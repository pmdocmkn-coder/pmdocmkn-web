import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import SignatureCanvas from "react-signature-canvas";
import { Eraser } from "lucide-react";
import { compressDataUrl, IMAGE_PRESETS } from "../../utils/imageCompress";

export type SignaturePadHandle = {
  exportNow: () => Promise<string | null>;
  isEmpty: () => boolean;
};

const PAD_HEIGHT = 160;

type SignaturePadFieldProps = {
  label: string;
  required?: boolean;
  value?: string | null;
  onChange?: (base64: string | null) => void;
  readOnly?: boolean;
  disabled?: boolean;
  signerName?: string | null;
};

const SignaturePadField = forwardRef<SignaturePadHandle, SignaturePadFieldProps>(
  function SignaturePadField({ label, required, value, onChange, readOnly, disabled, signerName }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const padRef = useRef<SignatureCanvas>(null);
    const [canvasWidth, setCanvasWidth] = useState(400);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const syncSize = () => {
        const w = Math.max(280, Math.floor(el.clientWidth));
        setCanvasWidth(w);
      };

      syncSize();
      const ro = new ResizeObserver(syncSize);
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const exportSignature = useCallback(async (): Promise<string | null> => {
      const pad = padRef.current;
      if (!pad || pad.isEmpty()) {
        onChange?.(null);
        return null;
      }
      try {
        const src = pad.getCanvas();
        const out = document.createElement("canvas");
        out.width = src.width;
        out.height = src.height;
        const ctx = out.getContext("2d");
        if (!ctx) throw new Error("Canvas tidak tersedia");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(src, 0, 0);
        const png = out.toDataURL("image/png");
        const jpeg = await compressDataUrl(png, IMAGE_PRESETS.signature);
        onChange?.(jpeg);
        return jpeg;
      } catch (err) {
        console.error("Export signature failed:", err);
        onChange?.(null);
        return null;
      }
    }, [onChange]);

    useImperativeHandle(ref, () => ({
      exportNow: exportSignature,
      isEmpty: () => padRef.current?.isEmpty() ?? true,
    }));

    useEffect(() => {
      if (readOnly || !value || !padRef.current) return;
      try {
        if (padRef.current.isEmpty()) {
          padRef.current.fromDataURL(value, { width: canvasWidth, height: PAD_HEIGHT });
        }
      } catch {
        /* ignore invalid restore */
      }
    }, [readOnly, value, canvasWidth]);

    const handleEnd = () => {
      void exportSignature();
    };

    const handleClear = () => {
      padRef.current?.clear();
      onChange?.(null);
    };

    if (readOnly) {
      return (
        <div className="space-y-1 text-center">
          <label className="text-xs font-semibold text-gray-500 mb-2 block">{label}</label>
          <div className="rounded-xl border border-gray-200 bg-white p-3 flex flex-col items-center justify-center min-h-[120px]">
            {value ? (
              <img
                src={value}
                alt={label}
                className="max-w-full max-h-24 object-contain mix-blend-multiply"
                style={{ background: "#ffffff" }}
              />
            ) : (
              <span className="text-xs text-gray-300 italic">Belum ada tanda tangan</span>
            )}
            {signerName && (
              <p className="text-xs font-medium text-gray-700 mt-2 border-t border-gray-100 pt-1.5 w-full">
                {signerName}
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs flex items-center gap-1 text-gray-500 hover:text-red-600"
            >
              <Eraser className="w-3 h-3" /> Ulangi
            </button>
          )}
        </div>
        <div
          ref={containerRef}
          className={`w-full border-2 border-dashed rounded-lg bg-white overflow-hidden ${
            disabled ? "opacity-50 pointer-events-none" : "border-gray-300"
          }`}
          style={{ height: PAD_HEIGHT }}
        >
          <SignatureCanvas
            ref={padRef}
            penColor="#111827"
            minWidth={1}
            maxWidth={2.5}
            velocityFilterWeight={0.7}
            canvasProps={{
              width: canvasWidth,
              height: PAD_HEIGHT,
              className: "block touch-none",
              style: { width: canvasWidth, height: PAD_HEIGHT, display: "block" },
            }}
            onEnd={handleEnd}
          />
        </div>
        <p className="text-xs text-gray-400">Gambar tanda tangan di area putih, lalu klik Simpan</p>
      </div>
    );
  }
);

export default SignaturePadField;
