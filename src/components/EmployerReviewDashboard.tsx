import React, { useState } from "react";
import { motion } from "motion/react";
import { Shield, CheckCircle2, Clock, AlertCircle, ArrowRight, User, Activity, FileText, RefreshCw, ShieldAlert, Filter, Calendar, Download, Search } from "lucide-react";
import { cn } from "@/src/lib/utils";

export interface ClinicianPacket {
  clinicianName: string;
  npi: string;
  specialty: string;
  status: "Pending" | "Ready" | "Needs Review";
  submissionDate: string;
  timeToStart: string;
  synthesis: {
    verifiedCredentials: string;
    identifiedGaps: string;
    timeline: string;
  };
  sources: {
    name: string;
    status: "CHECKED" | "PENDING" | "ACCESS REQUIRED";
    details: string;
  }[];
}

export interface EmployerReviewProps {
  packets?: ClinicianPacket[];
  // Fallback for single packet view (legacy support)
  clinicianName?: string;
  npi?: string;
  timeToStart?: string;
  synthesis?: {
    verifiedCredentials: string;
    identifiedGaps: string;
    timeline: string;
  };
  sources?: {
    name: string;
    status: "CHECKED" | "PENDING" | "ACCESS REQUIRED";
    details: string;
  }[];
}

const EmployerReviewDashboard: React.FC<EmployerReviewProps> = (props) => {
  // Determine if we are in list mode or single view mode
  const isListMode = !!props.packets;

  const handleExport = (data: any, npi: string) => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clinician-packet-${npi}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("All");
  const [dateRange, setDateRange] = useState<"All" | "Last 7 Days" | "Last 30 Days">("All");

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "All" || specialtyFilter !== "All" || dateRange !== "All";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setSpecialtyFilter("All");
    setDateRange("All");
  };

  // Mock packets if none provided in list mode (for demonstration)
  const packets = props.packets || [
    {
      clinicianName: props.clinicianName || "Dr. John Smith, MD",
      npi: props.npi || "1234567890",
      specialty: "Internal Medicine",
      status: "Pending" as const,
      submissionDate: new Date().toISOString(),
      timeToStart: props.timeToStart || "14 Days",
      synthesis: props.synthesis || {
        verifiedCredentials: "NPPES Identity confirmed.",
        identifiedGaps: "PECOS Enrollment status is PENDING.",
        timeline: "Estimated onboarding completion in 14 days.",
      },
      sources: props.sources || [],
    },
    {
      clinicianName: "Dr. Sarah Chen, DO",
      npi: "1003000126",
      specialty: "Emergency Medicine",
      status: "Ready" as const,
      submissionDate: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      timeToStart: "0 Days",
      synthesis: {
        verifiedCredentials: "All primary sources verified and active.",
        identifiedGaps: "None.",
        timeline: "Cleared to start immediately.",
      },
      sources: [
        { name: "Identity", status: "CHECKED" as const, details: "NPPES Registry match confirmed." },
        { name: "Sanctions", status: "CHECKED" as const, details: "OIG/LEIE clear." },
      ],
    },
    {
      clinicianName: "Dr. Emily Davis, MD",
      npi: "9876543210",
      specialty: "Cardiology",
      status: "Needs Review" as const,
      submissionDate: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
      timeToStart: "TBD",
      synthesis: {
        verifiedCredentials: "NPPES Identity confirmed.",
        identifiedGaps: "State license expired. Requires manual intervention.",
        timeline: "Blocked until license renewal is verified.",
      },
      sources: [
        { name: "Licensure", status: "ACCESS REQUIRED" as const, details: "License expired on 2025-12-31." },
      ],
    }
  ];

  // Apply filters
  const filteredPackets = packets.filter(packet => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!packet.clinicianName.toLowerCase().includes(query) && !packet.npi.includes(query)) {
        return false;
      }
    }
    if (statusFilter !== "All" && packet.status !== statusFilter) return false;
    if (specialtyFilter !== "All" && packet.specialty !== specialtyFilter) return false;
    
    if (dateRange !== "All") {
      const packetDate = new Date(packet.submissionDate).getTime();
      const now = Date.now();
      const daysDiff = (now - packetDate) / (1000 * 3600 * 24);
      
      if (dateRange === "Last 7 Days" && daysDiff > 7) return false;
      if (dateRange === "Last 30 Days" && daysDiff > 30) return false;
    }
    
    return true;
  });

  // Extract unique specialties for the filter dropdown
  const specialties = ["All", ...Array.from(new Set(packets.map(p => p.specialty)))];

  // Render Single Packet View (Legacy)
  if (!isListMode) {
    const { clinicianName, npi, timeToStart, synthesis, sources } = props;
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-5xl mx-auto w-full space-y-12 pb-32"
      >
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-line pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-ink text-bg px-2 py-0.5 rounded-full">
                Employer Review Mode
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                NPI: {npi}
              </span>
            </div>
            <h2 className="text-5xl font-bold tracking-tighter">{clinicianName}</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Est. Time-to-Start</div>
              <div className="text-5xl font-bold tracking-tighter text-green-600 dark:text-green-400">{timeToStart}</div>
            </div>
            <button
              onClick={() => handleExport(props, npi || 'unknown')}
              className="p-4 border border-line hover:bg-ink/5 transition-colors flex items-center justify-center"
              aria-label="Export Packet Data"
              title="Export Packet Data"
            >
              <Download className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* AI Synthesis Section */}
        <div className="border border-line p-8 bg-white/10 dark:bg-white/5 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-ink/20" />
          <div className="flex items-center gap-2 mb-8 opacity-40">
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">MSP Auditor Synthesis</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">01. Verified Credentials</h4>
              <p className="font-mono text-xs leading-relaxed opacity-80">{synthesis?.verifiedCredentials}</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">02. Identified Gaps</h4>
              <p className="font-mono text-xs leading-relaxed opacity-80">{synthesis?.identifiedGaps}</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">03. Timeline</h4>
              <p className="font-mono text-xs leading-relaxed opacity-80">{synthesis?.timeline}</p>
            </div>
          </div>
        </div>

        {/* Source Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sources?.map((source, index) => (
            <motion.div
              key={source.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index, duration: 0.4 }}
              className="border border-line p-5 bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">{source.name}</span>
                {source.status === "CHECKED" ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                ) : source.status === "PENDING" ? (
                  <Clock className="w-3 h-3 text-amber-500" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-red-500" />
                )}
              </div>
              <div className={cn(
                "font-mono text-xs font-bold mb-2",
                source.status === "CHECKED" ? "text-green-500" : 
                source.status === "PENDING" ? "text-amber-500" : "text-red-500"
              )}>
                {source.status}
              </div>
              <p className="text-[10px] opacity-50 leading-tight line-clamp-2">{source.details}</p>
            </motion.div>
          ))}
        </div>

        {/* Fixed Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-bg/80 backdrop-blur-md border-t border-line p-6 z-50">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-4">
            <button className="flex-1 bg-green-600 text-white py-4 font-bold uppercase tracking-widest hover:bg-green-700 transition-colors flex items-center justify-center gap-2 group">
              Accept as Head Start <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="flex-1 bg-ink text-bg py-4 font-bold uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              Request Refresh <RefreshCw className="w-4 h-4" />
            </button>
            <button className="flex-1 border border-red-500/50 text-red-500 py-4 font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
              Route to Manual Review <ShieldAlert className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Render List View with Filters
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="max-w-5xl mx-auto w-full space-y-8 pb-32"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-line pb-8">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter uppercase">Clinician Packets</h2>
          <p className="text-sm opacity-60 font-mono mt-2">Review and manage incoming readiness snapshots.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search clinicians by name or NPI..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border border-line py-3 pl-11 pr-4 text-sm font-mono focus:outline-none focus:border-ink transition-colors"
          aria-label="Search clinicians"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 p-4 border border-line bg-ink/5 items-start md:items-center">
        <div className="flex items-center justify-between w-full md:w-auto md:mr-4">
          <div className="flex items-center gap-2 opacity-60">
            <Filter className="w-4 h-4" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Filters</span>
          </div>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="md:hidden text-[10px] font-bold uppercase tracking-widest text-ink/60 hover:text-ink transition-colors"
              aria-label="Clear all filters"
            >
              Clear All
            </button>
          )}
        </div>
        
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          {/* Status Filter */}
          <div className="flex flex-col gap-1">
            <label htmlFor="status-filter" className="text-[9px] font-bold uppercase tracking-widest opacity-40">Status</label>
            <select 
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-b border-line py-2 text-xs font-mono focus:outline-none focus:border-ink transition-colors"
              aria-label="Filter by status"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Ready">Ready</option>
              <option value="Needs Review">Needs Review</option>
            </select>
          </div>

          {/* Specialty Filter */}
          <div className="flex flex-col gap-1">
            <label htmlFor="specialty-filter" className="text-[9px] font-bold uppercase tracking-widest opacity-40">Specialty</label>
            <select 
              id="specialty-filter"
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="bg-transparent border-b border-line py-2 text-xs font-mono focus:outline-none focus:border-ink transition-colors"
              aria-label="Filter by specialty"
            >
              {specialties.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-col gap-1">
            <label htmlFor="date-range-filter" className="text-[9px] font-bold uppercase tracking-widest opacity-40">Date Range</label>
            <div className="relative">
              <select 
                id="date-range-filter"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="w-full bg-transparent border-b border-line py-2 pl-6 text-xs font-mono focus:outline-none focus:border-ink transition-colors appearance-none"
                aria-label="Filter by date range"
              >
                <option value="All">All Time</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
              </select>
              <Calendar className="w-3 h-3 absolute left-0 top-1/2 -translate-y-1/2 opacity-40" aria-hidden="true" />
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-ink/60 hover:text-ink transition-colors whitespace-nowrap ml-4"
            aria-label="Clear all filters"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Packet List */}
      <div className="space-y-4">
        {filteredPackets.length === 0 ? (
          <div className="p-12 text-center border border-line border-dashed opacity-40">
            <p className="text-xs font-mono uppercase">No packets match the current filters.</p>
          </div>
        ) : (
          filteredPackets.map((packet) => (
            <motion.div 
              key={packet.npi}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-line p-6 hover:bg-ink/5 transition-colors group cursor-pointer"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold tracking-tight">{packet.clinicianName}</h3>
                    <span className={cn(
                      "flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                      packet.status === "Ready" ? "border-green-500 text-green-600 dark:text-green-400 bg-green-500/10" :
                      packet.status === "Pending" ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10" :
                      "border-red-500 text-red-600 dark:text-red-400 bg-red-500/10"
                    )}>
                      {packet.status === "Ready" && <CheckCircle2 className="w-3 h-3" />}
                      {packet.status === "Pending" && <Clock className="w-3 h-3" />}
                      {packet.status === "Needs Review" && <AlertCircle className="w-3 h-3" />}
                      {packet.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono opacity-60">
                    <span>NPI: {packet.npi}</span>
                    <span>•</span>
                    <span>{packet.specialty}</span>
                    <span>•</span>
                    <span>Submitted: {new Date(packet.submissionDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Est. Start</div>
                    <div className="text-lg font-bold font-mono">{packet.timeToStart}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleExport(packet, packet.npi); }}
                      className="p-3 border border-line hover:bg-ink/5 transition-colors text-ink"
                      aria-label="Export Packet Data"
                      title="Export Packet Data"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-3 bg-ink text-bg hover:opacity-90 transition-opacity">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default EmployerReviewDashboard;

