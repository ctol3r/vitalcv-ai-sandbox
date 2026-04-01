import axios from "axios";
import { NPIDataResponse } from "@/src/types/npi";

/**
 * VitalCV NPI Ingestion Service
 * Interacts with the public NPI lookup wedge.
 * This service operates in the "public lane" and does not require organization context.
 */
export async function fetchNPIData(npi: string): Promise<NPIDataResponse> {
  // 1. Validation: NPI must be exactly 10 digits
  const npiRegex = /^\d{10}$/;
  if (!npiRegex.test(npi)) {
    throw new Error("Invalid NPI format. Must be exactly 10 digits.");
  }

  try {
    // 2. Call the public ingest endpoint
    // Note: No x-organization-id header is sent as this is a public route
    const response = await axios.post("/api/ingest/npi", { npi });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401 && error.response?.data?.error === "organization_context_required") {
      throw new Error("Critical Error: Public NPI route is incorrectly guarded by organization context.");
    }
    throw new Error(error.response?.data?.error || "Failed to fetch primary source data.");
  }
}

/**
 * Fetches the public readiness snapshot for a clinician.
 */
export async function fetchReadinessSnapshot(npi: string) {
  const response = await axios.get(`/api/readiness/${npi}`);
  return response.data;
}

/**
 * Fetches the public passport status for a clinician.
 */
export async function fetchPassportStatus(npi: string) {
  const response = await axios.get(`/api/passport/${npi}`);
  return response.data;
}
