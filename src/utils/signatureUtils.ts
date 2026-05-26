/** Tanda tangan dari canvas dianggap valid jika data URI cukup panjang. */
export function isValidSignature(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  const t = value.trim();
  return t.startsWith("data:image") && t.length > 80;
}
