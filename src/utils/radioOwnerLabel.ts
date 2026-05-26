import type { RadioLookup } from "../types/radioHandover";

/** Ringkas untuk hint di bawah field SN (pemilik saja). */
export function formatRadioOwnerLabel(l: Pick<RadioLookup, "ownerLabel" | "company" | "category">): string {
  if (l.company?.trim()) return l.company.trim();
  if (l.ownerLabel?.trim()) return l.ownerLabel.trim();
  return l.category || "—";
}
