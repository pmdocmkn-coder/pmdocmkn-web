import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { asImageSrc } from "../../utils/handoverPhotoUtils";

type Props = {
  images: string[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export default function ImageGalleryModal({ images, index, open, onClose, onIndexChange }: Props) {
  const resolved = images.map((img) => asImageSrc(img)).filter(Boolean) as string[];

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      // Stop propagation so Radix Dialog underneath doesn't also close
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if (e.key === "ArrowRight" && resolved.length > 1) onIndexChange((index + 1) % resolved.length);
      if (e.key === "ArrowLeft" && resolved.length > 1)
        onIndexChange((index - 1 + resolved.length) % resolved.length);
    };
    // Use capture phase to intercept before Radix Dialog
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, index, resolved.length, onClose, onIndexChange]);

  if (!open || resolved.length === 0) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      onPointerDownCapture={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-6xl max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 text-white">
          <span className="text-lg font-medium">
            Foto {index + 1} / {resolved.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 border border-white/20"
          >
            <X className="w-5 h-5" /> Tutup
          </button>
        </div>
        <div className="relative flex-1 flex items-center justify-center bg-black/50 rounded-xl min-h-[60vh] border border-white/10">
          <img
            src={resolved[index]}
            alt={`Foto ${index + 1}`}
            className="max-w-full max-h-[75vh] object-contain rounded-lg"
          />
          {resolved.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => onIndexChange((index - 1 + resolved.length) % resolved.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 border border-white/20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() => onIndexChange((index + 1) % resolved.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 border border-white/20"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
        {resolved.length > 1 && (
          <div className="mt-3 flex gap-2 justify-center overflow-x-auto pb-1">
            {resolved.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onIndexChange(i)}
                className={`shrink-0 w-20 h-14 rounded-lg border-2 overflow-hidden ${
                  i === index ? "border-violet-400 ring-2 ring-violet-300" : "border-white/30 opacity-70"
                }`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
