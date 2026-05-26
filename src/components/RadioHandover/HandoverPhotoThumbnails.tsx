import { ImageIcon } from "lucide-react";
import { asImageSrc } from "../../utils/handoverPhotoUtils";

type Props = {
  photos: string[];
  size?: "sm" | "md";
  onOpen?: (index: number) => void;
  label?: string;
};

export default function HandoverPhotoThumbnails({ photos, size = "md", onOpen, label }: Props) {
  const resolved = photos.map((p) => asImageSrc(p)).filter(Boolean) as string[];
  if (resolved.length === 0) return null;

  const dim = size === "sm" ? "w-12 h-12" : "w-20 h-20";

  return (
    <div className="space-y-1.5">
      {label && <p className="text-xs font-medium text-gray-600">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {resolved.map((src, i) => (
          <button
            key={i}
            type="button"
            title={`Foto ${i + 1}`}
            onClick={() => onOpen?.(i)}
            className={`relative ${dim} rounded-lg border border-gray-200 overflow-hidden bg-gray-100 hover:ring-2 hover:ring-violet-400 transition-shadow shrink-0`}
          >
            <img src={src} alt={`Foto radio ${i + 1}`} className="w-full h-full object-cover" />
            {resolved.length > 1 && size === "sm" && i === 0 && (
              <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1 rounded-tl">
                +{resolved.length - 1}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function TablePhotoPlaceholder() {
  return (
    <div className="w-12 h-12 rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300">
      <ImageIcon className="w-4 h-4" />
    </div>
  );
}

export function HandoverPhotoThumb({
  photo,
  onClick,
}: {
  photo?: string | null;
  onClick?: () => void;
}) {
  const src = asImageSrc(photo);
  if (!src) return <TablePhotoPlaceholder />;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-12 h-12 rounded-lg border overflow-hidden hover:ring-2 hover:ring-violet-400 shrink-0"
      title="Lihat foto"
    >
      <img src={src} alt="" className="w-full h-full object-cover" />
    </button>
  );
}
