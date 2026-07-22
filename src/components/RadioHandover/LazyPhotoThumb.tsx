import { useEffect, useState, useRef } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { asImageSrc } from "../../utils/handoverPhotoUtils";
import { radioHandoverApi } from "../../services/radioHandoverApi";

// Global in-memory cache so thumbnails persist across re-renders & tab switches
const thumbCache = new Map<number, string | null>();
// Track in-flight batch requests to avoid duplicate fetches
let batchQueue: number[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;
let batchResolvers: Map<number, Array<(val: string | null) => void>> = new Map();

function requestThumbnail(id: number): Promise<string | null> {
  if (thumbCache.has(id)) return Promise.resolve(thumbCache.get(id)!);

  return new Promise((resolve) => {
    if (!batchResolvers.has(id)) batchResolvers.set(id, []);
    batchResolvers.get(id)!.push(resolve);

    if (!batchQueue.includes(id)) batchQueue.push(id);

    if (batchTimer) clearTimeout(batchTimer);
    batchTimer = setTimeout(flushBatch, 80); // batch within 80ms window
  });
}

async function flushBatch() {
  const ids = [...batchQueue];
  const resolvers = new Map(batchResolvers);
  batchQueue = [];
  batchResolvers = new Map();
  batchTimer = null;

  try {
    const result = await radioHandoverApi.getThumbnails(ids);
    for (const id of ids) {
      const photo = result[id] ?? null;
      thumbCache.set(id, photo);
      resolvers.get(id)?.forEach((r) => r(photo));
    }
  } catch {
    for (const id of ids) {
      thumbCache.set(id, null);
      resolvers.get(id)?.forEach((r) => r(null));
    }
  }
}

interface LazyPhotoThumbProps {
  handoverId: number;
  photoCount: number;
  onClick?: () => void;
}

export function LazyPhotoThumb({ handoverId, photoCount, onClick }: LazyPhotoThumbProps) {
  const [photo, setPhoto] = useState<string | null | undefined>(
    thumbCache.has(handoverId) ? thumbCache.get(handoverId)! : undefined
  );
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (photoCount === 0) {
      setPhoto(null);
      return;
    }
    if (thumbCache.has(handoverId)) {
      setPhoto(thumbCache.get(handoverId)!);
      return;
    }
    requestThumbnail(handoverId).then((val) => {
      if (mounted.current) setPhoto(val);
    });
    return () => { mounted.current = false; };
  }, [handoverId, photoCount]);

  // No photo at all
  if (photoCount === 0 || photo === null) {
    return (
      <div className="w-12 h-12 rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300">
        <ImageIcon className="w-4 h-4" />
      </div>
    );
  }

  // Still loading (shimmer)
  if (photo === undefined) {
    return (
      <div className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-[shimmer_1.5s_infinite]" />
        <Loader2 className="w-4 h-4 text-gray-400 animate-spin relative z-10" />
      </div>
    );
  }

  // Photo loaded
  const src = asImageSrc(photo);
  if (!src) {
    return (
      <div className="w-12 h-12 rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300">
        <ImageIcon className="w-4 h-4" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="w-12 h-12 rounded-lg border overflow-hidden hover:ring-2 hover:ring-violet-400 shrink-0 transition-all duration-300 animate-[fadeIn_0.3s_ease-in]"
      title="Lihat foto"
    >
      <img src={src} alt="" className="w-full h-full object-cover" />
    </button>
  );
}
