import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, X, ZoomIn, ZoomOut, SwitchCamera, Check } from "lucide-react";
import { compressDataUrl, IMAGE_PRESETS } from "../../utils/imageCompress";

type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  /** Berapa foto lagi yang boleh ditambahkan (default: tak terbatas) */
  remaining?: number;
};

/**
 * LiveCameraCapture — Modal kamera live (mobile-first)
 *
 * Fitur:
 * - Auto-pilih kamera belakang di HP (facingMode: environment)
 * - Tombol flip (front/back) jika perangkat mendukung
 * - Capture → compress via IMAGE_PRESETS.radioPhoto → kirim ke parent
 * - Flash animasi saat capture
 * - Fullscreen overlay agar tidak memenuhi memori HP
 *   (foto langsung dikompresi ke max 1280×960, quality 0.82 → sekitar 100–250 KB)
 */
export default function LiveCameraCapture({ open, onClose, onCapture, remaining }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(4);
  const [preview, setPreview] = useState<string | null>(null);

  // -------------------------------------------------------------------
  // Start / stop stream
  // -------------------------------------------------------------------
  const startCamera = useCallback(async (facing: "environment" | "user") => {
    // Hentikan stream lama
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setError(null);
    setZoom(1);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Cek zoom support (hanya Chrome/Android)
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() as { zoom?: { max: number } } | undefined;
        if (capabilities?.zoom?.max) setMaxZoom(capabilities.zoom.max);
      }

      // Cek apakah ada kamera lebih dari 1
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err?.name === "NotAllowedError") {
        setError("Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.");
      } else if (err?.name === "NotFoundError") {
        setError("Kamera tidak ditemukan di perangkat ini.");
      } else {
        setError("Kamera tidak dapat diakses. Coba buka melalui HTTPS.");
      }
    }
  }, []);

  useEffect(() => {
    if (open) {
      startCamera(facingMode);
    } else {
      // Cleanup saat ditutup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setPreview(null);
      setError(null);
      setZoom(1);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const flipCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  // -------------------------------------------------------------------
  // Zoom (hanya desktop & browser yang mendukung ImageCapture)
  // -------------------------------------------------------------------
  const applyZoom = useCallback(async (newZoom: number) => {
    const clamped = Math.min(Math.max(1, newZoom), maxZoom);
    setZoom(clamped);
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (track?.applyConstraints) {
        await track.applyConstraints({ advanced: [{ zoom: clamped } as MediaTrackConstraintSet] });
      }
    } catch {
      // Tidak semua browser mendukung zoom constraint — abaikan
    }
  }, [maxZoom]);

  // -------------------------------------------------------------------
  // Capture
  // -------------------------------------------------------------------
  const capture = useCallback(async () => {
    if (!videoRef.current || capturing) return;
    setCapturing(true);

    // Flash animasi
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL("image/jpeg", 0.95);

    // Compress sebelum disimpan → hemat memori
    const compressed = await compressDataUrl(rawDataUrl, IMAGE_PRESETS.radioPhoto);
    setPreview(compressed);
    setCapturing(false);
  }, [capturing]);

  const confirmCapture = () => {
    if (preview) {
      onCapture(preview);
      setPreview(null);
      // Jika sudah hampir penuh (remaining === 1), tutup otomatis
      if (remaining !== undefined && remaining <= 1) onClose();
    }
  };

  const retakeCapture = () => setPreview(null);

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Flash overlay */}
      {flash && <div className="absolute inset-0 bg-white opacity-80 z-10 pointer-events-none" />}

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 bg-black/80 z-20">
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <p className="text-white text-sm font-semibold">
          <Camera className="w-4 h-4 inline mr-1.5 opacity-70" />
          Foto Langsung
          {remaining !== undefined && (
            <span className="ml-2 text-xs font-normal opacity-70">({remaining} slot tersisa)</span>
          )}
        </p>
        {hasMultipleCameras ? (
          <button
            type="button"
            onClick={flipCamera}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Video area */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <Camera className="w-12 h-12 text-white/30" />
            <p className="text-white/70 text-sm leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={() => startCamera(facingMode)}
              className="mt-2 px-4 py-2 bg-white/10 text-white text-sm rounded-[10px] border border-white/20 hover:bg-white/20 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : preview ? (
          /* Preview sebelum konfirmasi */
          <img
            src={preview}
            alt="preview"
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Grid overlay (opsional panduan komposisi) */}
        {!preview && !error && (
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.15 }}>
            <div className="w-full h-full grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              {[0, 1, 2].map((col) =>
                [0, 1, 2].map((row) => (
                  <div
                    key={`${col}-${row}`}
                    className="border border-white"
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Zoom controls (non-preview, no error) */}
      {!preview && !error && maxZoom > 1 && (
        <div className="flex items-center gap-3 px-6 py-2 bg-black/60">
          <button
            type="button"
            onClick={() => applyZoom(zoom - 0.5)}
            disabled={zoom <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <input
            type="range"
            min={1}
            max={maxZoom}
            step={0.1}
            value={zoom}
            onChange={(e) => applyZoom(parseFloat(e.target.value))}
            className="flex-1 accent-[#D94F2B]"
          />
          <button
            type="button"
            onClick={() => applyZoom(zoom + 0.5)}
            disabled={zoom >= maxZoom}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-white text-xs w-8 text-right">{zoom.toFixed(1)}×</span>
        </div>
      )}

      {/* Bottom controls */}
      <div className="pb-safe pb-8 pt-4 px-8 bg-black/80 flex items-center justify-center gap-8">
        {preview ? (
          /* Konfirmasi atau ulangi */
          <>
            <button
              type="button"
              onClick={retakeCapture}
              className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center">
                <X className="w-6 h-6" />
              </div>
              <span className="text-xs">Ulangi</span>
            </button>
            <button
              type="button"
              onClick={confirmCapture}
              className="flex flex-col items-center gap-1 text-white hover:text-[#D94F2B] transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-[#D94F2B] hover:bg-[#B83D20] border-4 border-white/30 flex items-center justify-center transition-colors">
                <Check className="w-7 h-7" />
              </div>
              <span className="text-xs font-semibold">Gunakan</span>
            </button>
          </>
        ) : (
          /* Tombol capture */
          <button
            type="button"
            onClick={capture}
            disabled={capturing || !!error}
            className="w-20 h-20 rounded-full bg-white border-4 border-[#D94F2B] shadow-lg flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-[#D94F2B]/10" />
          </button>
        )}
      </div>
    </div>
  );
}
