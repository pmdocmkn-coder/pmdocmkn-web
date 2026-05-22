import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Props = {
  images: string[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export default function ImageGalleryModal({ images, index, open, onClose, onIndexChange }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && images.length > 1) onIndexChange((index + 1) % images.length);
      if (e.key === "ArrowLeft" && images.length > 1)
        onIndexChange((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, images.length, onClose, onIndexChange]);

  if (!open || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 text-white">
          <span className="text-lg font-medium">
            {index + 1} / {images.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 bg-black/50 px-3 py-2 rounded-lg hover:bg-black/70"
          >
            <X className="w-5 h-5" /> Tutup (ESC)
          </button>
        </div>
        <div className="relative flex-1 flex items-center justify-center bg-black/40 rounded-lg min-h-[50vh]">
          <img
            src={images[index]}
            alt={`Foto ${index + 1}`}
            className="max-w-full max-h-[70vh] object-contain"
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => onIndexChange((index - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() => onIndexChange((index + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 justify-center overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onIndexChange(i)}
                className={`shrink-0 w-20 h-14 rounded border-2 overflow-hidden ${
                  i === index ? "border-blue-500 ring-2 ring-blue-400" : "border-gray-500 opacity-70"
                }`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
