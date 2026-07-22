export function asImageSrc(base64?: string | null): string | undefined {
  if (!base64?.trim()) return undefined;
  const t = base64.trim();
  if (t.startsWith("data:image")) return t;
  return `data:image/jpeg;base64,${t}`;
}
export function resolveHandoverPhotos(d: {
  radioPhotos?: string[];
  radioPhotoBase64?: string | null;
}): string[] {
  if (d.radioPhotos && d.radioPhotos.length > 0) return d.radioPhotos;
  if (d.radioPhotoBase64) return [d.radioPhotoBase64];
  return [];
}
