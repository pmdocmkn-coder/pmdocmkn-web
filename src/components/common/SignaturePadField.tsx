import { useRef, useEffect, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Eraser } from "lucide-react";
import { compressDataUrl, IMAGE_PRESETS } from "../../utils/imageCompress";

type SignaturePadFieldProps = {
  label: string;
  required?: boolean;
  value?: string | null;
  onChange?: (base64: string | null) => void;
  readOnly?: boolean;
  disabled?: boolean;
};

export default function SignaturePadField({
  label,
  required,
  value,
  onChange,
  readOnly,
  disabled,
}: SignaturePadFieldProps) {
  const padRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (readOnly || !value || !padRef.current) return;
    try {
      padRef.current.fromDataURL(value);
    } catch {
      /* ignore invalid restore */
    }
  }, [readOnly, value]);

  const exportSignature = useCallback(async () => {
    if (!padRef.current || padRef.current.isEmpty()) {
      onChange?.(null);
      return;
    }
    const trimmed = padRef.current.getTrimmedCanvas();
    const png = trimmed.toDataURL("image/png");
    const jpeg = await compressDataUrl(png, IMAGE_PRESETS.signature);
    onChange?.(jpeg);
  }, [onChange]);

  const handleEnd = () => {
    void exportSignature();
  };

  const handleClear = () => {
    padRef.current?.clear();
    onChange?.(null);
  };

  if (readOnly && value) {
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <img
          src={value}
          alt={label}
          className="max-w-md border rounded-lg bg-white p-2"
        />
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
        className={`border-2 border-dashed rounded-lg bg-white ${
          disabled ? "opacity-50 pointer-events-none" : "border-gray-300"
        }`}
      >
        <SignatureCanvas
          ref={padRef}
          penColor="#111827"
          canvasProps={{
            width: 600,
            height: 200,
            className: "w-full max-w-md rounded-lg touch-none",
          }}
          onEnd={handleEnd}
          onBlur={() => void exportSignature()}
        />
      </div>
      <p className="text-xs text-gray-400">Gambar tanda tangan di area putih</p>
    </div>
  );
}
