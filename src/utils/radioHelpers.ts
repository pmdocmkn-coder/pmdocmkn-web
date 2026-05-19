import { RadioDto } from "../services/radioApi";

/**
 * Parse radio API response.
 * Response structure: { statusCode, message, data: RadioDto[], meta: { pagination: {...} } }
 */
export function parseRadioResponse(raw: any): { 
  items: RadioDto[]; 
  totalCount: number; 
  totalPages: number;
} {
  // raw = response.data (axios extracts .data from HTTP response)
  // Structure: { statusCode, message, data: [...], meta: { pagination: {...} } }
  
  const items: RadioDto[] = Array.isArray(raw?.data) ? raw.data : [];
  const pagination = raw?.meta?.pagination;
  
  return {
    items,
    totalCount: pagination?.totalCount ?? items.length,
    totalPages: pagination?.totalPages ?? 1,
  };
}

/** Splits a comma-separated fleet string into an array of trimmed fleet numbers */
export function parseFleetList(fleet?: string): string[] {
  if (!fleet) return [];
  return fleet
    .split(",")
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
}

/** Returns true if the radio has no valid grafir number */
export function isNoGrafir(nomorAset?: string): boolean {
  if (!nomorAset) return true;
  const val = nomorAset.trim().toLowerCase();
  return val === "" || val === "-" || val === "no graf" || val === "no grafir";
}
