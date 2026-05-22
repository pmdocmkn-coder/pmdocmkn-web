export type CompressOptions = {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
  mime?: string;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawResized(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): HTMLCanvasElement {
  let { width, height } = img;
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

export async function compressImageForStorage(
  file: File,
  options: CompressOptions
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return compressDataUrl(dataUrl, options);
}

export async function compressDataUrl(
  dataUrl: string,
  options: CompressOptions
): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = drawResized(img, options.maxWidth, options.maxHeight);
  const mime = options.mime ?? "image/jpeg";
  const quality = options.quality ?? 0.85;
  return canvas.toDataURL(mime, quality);
}

export const IMAGE_PRESETS = {
  radioPhoto: { maxWidth: 1280, maxHeight: 960, quality: 0.82 },
  signature: { maxWidth: 600, maxHeight: 200, quality: 0.9 },
} as const;
