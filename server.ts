import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  /**
   * Organization Context Middleware
   * Enforces that employer-facing actions have a valid tenant/org context.
   * Explicitly exempts the public clinician NPI lookup wedge.
   */
  const organizationGuard = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Only apply organization guard to /api/ routes
    if (!req.path.startsWith("/api/")) {
      return next();
    }

    // Public routes that do NOT require x-organization-id
    const publicRoutes = [
      "/api/health",
      "/api/ingest/npi",
      "/api/identity",
      "/api/readiness",
      "/api/passport",
      "/api/audit/synthesis" // Synthesis is part of the public readiness generation flow
    ];

    // Check if the current path is in the public list
    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));

    if (isPublicRoute || req.method === 'OPTIONS') {
      return next();
    }

    // Employer-facing routes REQUIRE x-organization-id
    const orgId = req.headers["x-organization-id"];
    if (!orgId) {
      console.warn(`[GUARD] Blocked unauthorized access to ${req.path} - Missing x-organization-id`);
      return res.status(401).json({ 
        error: "organization_context_required",
        message: "This action requires a valid organization context header (x-organization-id). Clinician NPI lookups are exempt."
      });
    }

    next();
  };

  app.use(organizationGuard);

  // Mock database for employer workspaces
  const employerWorkspaces = new Set(["ORG-SUTTER-001"]);

  // Mock database for employer notifications
  const employerNotifications = new Map<string, any[]>();

  // WebSocket connections mapped by orgId
  const wsClients = new Map<string, Set<WebSocket>>();

  function broadcastNotification(orgId: string, notification: any) {
    const clients = wsClients.get(orgId);
    if (clients) {
      const message = JSON.stringify({ type: 'NOTIFICATION', payload: notification });
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  function getNotifications(orgId: string) {
    if (!employerNotifications.has(orgId)) {
      employerNotifications.set(orgId, [
        {
          id: `notif-${Date.now()}-1`,
          type: 'NEW_PACKET',
          title: 'New Packet Ready',
          message: 'Dr. Sarah Chen (NPI: 1003000126) has shared their readiness snapshot.',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
          read: false,
          npi: '1003000126'
        },
        {
          id: `notif-${Date.now()}-2`,
          type: 'STATUS_CHANGE',
          title: 'Status Update',
          message: 'PECOS enrollment for Dr. John Smith is now ACTIVE.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          read: true,
          npi: '1234567890'
        }
      ]);
    }
    return employerNotifications.get(orgId) || [];
  }

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  /**
   * Get Employer Notifications
   */
  app.get("/api/employer/notifications", (req, res) => {
    const orgId = req.headers["x-organization-id"] as string;
    res.json({ notifications: getNotifications(orgId) });
  });

  /**
   * Mark Notifications as Read
   */
  app.post("/api/employer/notifications/read", (req, res) => {
    const orgId = req.headers["x-organization-id"] as string;
    const { notificationIds } = req.body;
    
    if (!Array.isArray(notificationIds)) {
      return res.status(400).json({ error: "notificationIds must be an array" });
    }

    const notifs = getNotifications(orgId);
    notifs.forEach(n => {
      if (notificationIds.includes(n.id)) {
        n.read = true;
      }
    });

    res.json({ success: true });
  });

  /**
   * Clear All Notifications
   */
  app.delete("/api/employer/notifications", (req, res) => {
    const orgId = req.headers["x-organization-id"] as string;
    employerNotifications.set(orgId, []);
    res.json({ success: true });
  });

  /**
   * Check Employer Workspace
   * Returns 200 if workspace exists, 404 if setup is required.
   */
  app.get("/api/employer/workspace", (req, res) => {
    const orgId = req.headers["x-organization-id"] as string;
    if (employerWorkspaces.has(orgId)) {
      res.json({ status: "active", orgId });
    } else {
      res.status(404).json({ 
        error: "workspace_not_found", 
        message: "Employer workspace must be bootstrapped before reviewing packets." 
      });
    }
  });

  /**
   * Bootstrap Employer Workspace
   * Registers a new VcvEntity in the mock database.
   */
  app.post("/api/employer/workspace", (req, res) => {
    const orgId = req.headers["x-organization-id"] as string;
    const { name, domain } = req.body;

    if (!name || !domain) {
      return res.status(400).json({ error: "Missing mandatory fields: name, domain" });
    }

    // Simulate registration
    employerWorkspaces.add(orgId);
    console.log(`[WORKSPACE BOOTSTRAP] Registered new VcvEntity: ${name} (${orgId})`);

    res.status(201).json({
      status: "success",
      message: "Employer workspace bootstrapped successfully.",
      data: { orgId, name, domain, createdAt: new Date().toISOString() }
    });
  });

  // Mock Identity API
  app.get("/api/identity/:npi", (req, res) => {
    const { npi } = req.params;
    res.json({ npi, status: "Verified", source: "NPPES" });
  });

  // Mock Readiness API
  app.get("/api/readiness/:npi", (req, res) => {
    const { npi } = req.params;
    res.json({ npi, readinessScore: 84, status: "Ready" });
  });

  // Mock Passport API
  app.get("/api/passport/:npi", (req, res) => {
    const { npi } = req.params;
    res.json({ npi, passportId: `PASS-${npi}`, status: "Active" });
  });

  // Mock NPI Ingest API
  app.post("/api/ingest/npi", (req, res) => {
    const { npi } = req.body;
    
    // Validation: NPI must be exactly 10 digits
    const npiRegex = /^\d{10}$/;
    if (!npi || !npiRegex.test(npi)) {
      return res.status(400).json({ error: "Invalid NPI format. Must be exactly 10 digits." });
    }

    // Simulate fetching data from NPPES, OIG, etc.
    setTimeout(() => {
      // 5% chance of failure
      if (Math.random() < 0.05) {
        return res.status(504).json({ error: "Primary source timeout: One or more upstream registries are unresponsive." });
      }

      res.json({
        npi,
        timestamp: new Date().toISOString(),
        identity: {
          firstName: "John",
          lastName: "Smith",
          enumerationDate: "2015-05-12",
          specialty: "Emergency Medicine",
          status: "Checked",
        },
        sanctions: {
          exclusionStatus: false,
          lastChecked: new Date().toISOString(),
          status: "Checked",
        },
        licensure: {
          licenseNumber: "MD12345678",
          state: "CA",
          expirationDate: "2027-03-30",
          status: "Checked",
        },
        pecos: {
          enrolled: true,
          status: "Pending",
        },
        readinessScore: 84,
      });
    }, 1200);
  });

  // Audit Synthesis Endpoint
  // In this environment, the AI call is handled by the frontend service for optimal performance.
  // This endpoint can be used to ingest and persist the generated synthesis.
  app.post("/api/audit/synthesis", (req, res) => {
    const { npi, synthesis } = req.body;
    
    if (!npi || !synthesis) {
      return res.status(400).json({ error: "Missing NPI or synthesis data." });
    }

    console.log(`[MSP Audit] Synthesis ingested for NPI: ${npi}`);
    
    // Here you would typically save this to a database (e.g., Firestore)
    res.json({ 
      status: "success", 
      message: "Audit synthesis persisted successfully.",
      auditId: `AUD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });
  });

  /**
   * Employer Decision Audit Trail
   * Securely logs decisions as immutable audit events.
   */
  app.post("/api/audit/decision", (req, res) => {
    try {
      const { npi, employerId, decision, packetHash } = req.body;

      // 1. Strict Payload Validation
      const requiredFields = ["npi", "employerId", "decision", "packetHash"];
      const missingFields = requiredFields.filter(field => !req.body[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: `Bad Request: Missing mandatory fields: ${missingFields.join(", ")}` 
        });
      }

      // 2. Enum Validation
      const validDecisions = ["ACCEPT", "REFRESH", "MANUAL_REVIEW", "AUDIT_PACKET_SHARED"];
      if (!validDecisions.includes(decision)) {
        return res.status(400).json({ 
          error: `Bad Request: Invalid decision type. Must be one of: ${validDecisions.join(", ")}` 
        });
      }

      // 3. Persistence Simulation (Immutable Audit Log)
      const auditEvent = {
        auditId: `AUD-DEC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        npi,
        employerId,
        decision,
        timestamp: new Date().toISOString(),
        packetHash,
        shareUrl: req.body.shareUrl,
      };

      // Log structured JSON to console for visibility
      console.log("[AUDIT LOG] Immutable Decision Event Recorded:");
      console.log(JSON.stringify(auditEvent, null, 2));

      // 4. Success Response
      res.status(201).json({
        status: "success",
        message: "Employer decision securely logged to audit trail.",
        data: auditEvent
      });

    } catch (error) {
      console.error("[AUDIT ERROR] Failed to process decision event:", error);
      res.status(500).json({ error: "Internal Server Error: Failed to log audit event." });
    }
  });

  /**
   * Update Audit Decision Event
   * Simulates updating an existing audit entry (e.g., for link regeneration).
   */
  app.put("/api/audit/decision/:auditId", (req, res) => {
    try {
      const { auditId } = req.params;
      const { npi, employerId, decision, packetHash, shareUrl } = req.body;

      console.log(`[AUDIT UPDATE] Updating Event ID: ${auditId}`);
      
      const updatedEvent = {
        auditId,
        npi,
        employerId,
        decision,
        timestamp: new Date().toISOString(),
        packetHash,
        shareUrl,
        updated: true
      };

      console.log("[AUDIT LOG] Immutable Decision Event Updated (Revision Recorded):");
      console.log(JSON.stringify(updatedEvent, null, 2));

      res.json({
        status: "success",
        message: "Audit event updated successfully.",
        data: updatedEvent
      });
    } catch (error) {
      console.error("[AUDIT ERROR] Failed to update decision event:", error);
      res.status(500).json({ error: "Internal Server Error: Failed to update audit event." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    // Basic URL parsing to get orgId from query params
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const orgId = url.searchParams.get("orgId");

    if (!orgId) {
      ws.close(1008, "Missing orgId");
      return;
    }

    if (!wsClients.has(orgId)) {
      wsClients.set(orgId, new Set());
    }
    wsClients.get(orgId)!.add(ws);

    ws.on("close", () => {
      const clients = wsClients.get(orgId);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) {
          wsClients.delete(orgId);
        }
      }
    });
  });

  // Simulate incoming notifications periodically for testing
  setInterval(() => {
    employerWorkspaces.forEach(orgId => {
      const newNotif = {
        id: `notif-${Date.now()}`,
        type: Math.random() > 0.5 ? 'NEW_PACKET' : 'STATUS_CHANGE',
        title: 'Real-time Update',
        message: 'This is a simulated real-time notification via WebSocket.',
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      const notifs = getNotifications(orgId);
      notifs.unshift(newNotif); // Add to beginning
      
      broadcastNotification(orgId, newNotif);
    });
  }, 45000); // Every 45 seconds

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
