export function asImageSrc(base64?: string | null): string | undefined {
  if (!base64?.trim()) return undefined;
  const t = base64.trim();
  if (t.startsWith("data:image")) return t;
  return `data:image/jpeg;base64,${t}`;
}
