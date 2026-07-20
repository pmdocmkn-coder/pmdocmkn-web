import { useEffect, useRef, useState, useCallback } from "react";
import { X, SwitchCamera, Check, ImageIcon, Zap, ZapOff } from "lucide-react";
import { compressDataUrl, IMAGE_PRESETS } from "../../utils/imageCompress";

type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  remaining?: number;
};

export default function LiveCameraCapture({ open, onClose, onCapture, remaining }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [flash, setFlash] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [supportsTorch, setSupportsTorch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [hardwareZoom, setHardwareZoom] = useState(false); // true = pakai constraint API
  const [preview, setPreview] = useState<string | null>(null);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const [focusAnim, setFocusAnim] = useState(false);

  // ─── Start / stop stream ───────────────────────────────────────────
  const startCamera = useCallback(async (facing: "environment" | "user") => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setError(null);
    setZoom(1);
    setTorchOn(false);
    setSupportsTorch(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch { /* autoPlay fallback */ }

        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities?.() as {
          zoom?: { max: number };
          torch?: boolean;
        } | undefined;
        if (caps?.zoom?.max && caps.zoom.max > 1) {
          setMaxZoom(caps.zoom.max);
          setHardwareZoom(true);
        } else {
          // Fallback: software zoom via CSS scale, max 4×
          setMaxZoom(4);
          setHardwareZoom(false);
        }
        if (caps?.torch) setSupportsTorch(true);
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      setHasMultipleCameras(devices.filter((d) => d.kind === "videoinput").length > 1);
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err?.name === "NotAllowedError") setError("Izin kamera ditolak.");
      else if (err?.name === "NotFoundError") setError("Kamera tidak ditemukan.");
      else setError("Kamera tidak dapat diakses.");
    }
  }, []);

  useEffect(() => {
    if (open) {
      startCamera(facingMode);
    } else {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setPreview(null);
      setError(null);
      setZoom(1);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Flip ──────────────────────────────────────────────────────────
  const flipCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  // ─── Torch ────────────────────────────────────────────────────────
  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track?.applyConstraints) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch { /* unsupported */ }
  };

  // ─── Zoom ─────────────────────────────────────────────────────────
  const applyZoom = useCallback(async (val: number) => {
    const clamped = Math.min(Math.max(1, val), maxZoom);
    setZoom(clamped);
    if (hardwareZoom) {
      try {
        const track = streamRef.current?.getVideoTracks()[0];
        await track?.applyConstraints?.({ advanced: [{ zoom: clamped } as MediaTrackConstraintSet] });
      } catch { /* unsupported */ }
    }
    // Software zoom diterapkan langsung via style pada <video> (lihat render)
  }, [maxZoom, hardwareZoom]);

  // ─── Focus tap ────────────────────────────────────────────────────
  const handleTapFocus = () => {
    setFocusAnim(true);
    setTimeout(() => setFocusAnim(false), 800);
  };

  // ─── Capture ──────────────────────────────────────────────────────
  const capture = useCallback(async () => {
    if (!videoRef.current || capturing) return;
    setCapturing(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 180);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const compressed = await compressDataUrl(
      canvas.toDataURL("image/jpeg", 0.95),
      IMAGE_PRESETS.radioPhoto
    );
    setPreview(compressed);
    setCapturing(false);
  }, [capturing]);

  const confirmCapture = () => {
    if (!preview) return;
    onCapture(preview);
    setLastPhoto(preview);
    if (remaining !== undefined && remaining <= 1) { onClose(); return; }
    setPreview(null);
    startCamera(facingMode);
  };

  const retakeCapture = () => {
    setPreview(null);
    startCamera(facingMode);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col select-none">

      {/* ── Flash overlay ── */}
      <div
        className="absolute inset-0 z-50 pointer-events-none transition-opacity duration-100"
        style={{ backgroundColor: "white", opacity: flash ? 0.75 : 0 }}
      />

      {/* ── VIEWFINDER (full bleed) ── */}
      <div className="absolute inset-0" onClick={handleTapFocus}>
        {preview ? (
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transition-transform duration-150"
            style={!hardwareZoom && zoom > 1 ? { transform: `scale(${zoom})`, transformOrigin: "center center" } : undefined}
          />
        )}

        {/* Vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        {/* Focus box */}
        {!preview && focusAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-16 h-16 border-2 rounded-sm"
              style={{
                borderColor: "#D94F2B",
                animation: "focusPulse 0.8s ease-out forwards",
              }}
            />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center bg-black/70">
            <p className="text-white/80 text-sm leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={() => startCamera(facingMode)}
              className="px-5 py-2.5 rounded-full bg-white/15 text-white text-sm border border-white/20 backdrop-blur-sm"
            >
              Coba Lagi
            </button>
          </div>
        )}
      </div>

      {/* ── TOP BAR ── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-3">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title + slot info */}
        <div className="text-center">
          <p className="text-white text-[13px] font-semibold tracking-wide drop-shadow">
            Foto Langsung
          </p>
          {remaining !== undefined && (
            <p className="text-white/60 text-[11px] mt-0.5">
              {remaining} slot tersisa
            </p>
          )}
        </div>

        {/* Torch toggle — tampil jika didukung */}
        {supportsTorch ? (
          <button
            type="button"
            onClick={toggleTorch}
            className={`w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-sm border transition-colors ${
              torchOn
                ? "bg-[#F59E0B]/80 border-[#F59E0B] text-white"
                : "bg-black/40 border-white/10 text-white"
            }`}
          >
            {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* ── SPACER (push controls to bottom) ── */}
      <div className="flex-1" />

      {/* ── BOTTOM CONTROLS ── */}
      <div className="relative z-10 pb-12 pt-4 px-8">

        {/* Zoom pill — di atas shutter, hanya tampil di live mode */}
        {!preview && !error && (
          <div className="flex items-center justify-center mb-5">
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-2 border border-white/10 w-full max-w-xs">
              {/* Zoom out */}
              <button
                type="button"
                onClick={() => applyZoom(zoom - 0.5)}
                disabled={zoom <= 1}
                className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 transition-colors flex-shrink-0"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9zm4.5 0a.75.75 0 01.75-.75h3.5a.75.75 0 010 1.5h-3.5A.75.75 0 016.5 9z" clipRule="evenodd" />
                </svg>
              </button>
              {/* Slider */}
              <input
                type="range"
                min={1}
                max={maxZoom}
                step={0.1}
                value={zoom}
                onChange={(e) => applyZoom(parseFloat(e.target.value))}
                className="flex-1 h-1 accent-[#D94F2B]"
              />
              {/* Zoom in */}
              <button
                type="button"
                onClick={() => applyZoom(zoom + 0.5)}
                disabled={zoom >= maxZoom}
                className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 transition-colors flex-shrink-0"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9zm4.5-.75a.75.75 0 011.5 0v1.75h1.75a.75.75 0 010 1.5H7.5v1.75a.75.75 0 01-1.5 0V11.5H4.25a.75.75 0 010-1.5H6V8.25z" clipRule="evenodd" />
                </svg>
              </button>
              {/* Label */}
              <span className="text-white text-xs font-semibold w-8 text-right flex-shrink-0">
                {zoom.toFixed(1)}×
              </span>
            </div>
          </div>
        )}

        {preview ? (
          /* ── Preview mode ── */
          <div className="flex items-center justify-between">
            {/* Ulangi */}
            <button
              type="button"
              onClick={retakeCapture}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
                <X className="w-6 h-6" />
              </div>
              <span className="text-white/70 text-xs">Ulangi</span>
            </button>

            {/* Confirm */}
            <button
              type="button"
              onClick={confirmCapture}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-20 h-20 rounded-full bg-[#D94F2B] border-4 border-white/30 flex items-center justify-center shadow-lg shadow-[#D94F2B]/40 active:scale-95 transition-transform">
                <Check className="w-8 h-8 text-white" />
              </div>
              <span className="text-white text-xs font-semibold">Gunakan</span>
            </button>

            {/* Spacer kanan */}
            <div className="w-14" />
          </div>
        ) : (
          /* ── Live mode ── */
          <div className="flex items-center justify-between">

            {/* Thumbnail foto terakhir */}
            <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/20">
              {lastPhoto ? (
                <img src={lastPhoto} alt="last" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-white/30" />
                </div>
              )}
            </div>

            {/* Shutter button */}
            <button
              type="button"
              onClick={capture}
              disabled={capturing || !!error}
              className="relative w-20 h-20 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
            >
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-white/70" />
              {/* Inner circle */}
              <div
                className="w-14 h-14 rounded-full transition-all duration-100"
                style={{ backgroundColor: capturing ? "#D94F2B" : "white" }}
              />
            </button>

            {/* Flip camera */}
            {hasMultipleCameras ? (
              <button
                type="button"
                onClick={flipCamera}
                className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform"
              >
                <SwitchCamera className="w-6 h-6" />
              </button>
            ) : (
              <div className="w-14" />
            )}
          </div>
        )}
      </div>

      {/* Focus pulse keyframe */}
      <style>{`
        @keyframes focusPulse {
          0%   { opacity: 1; transform: scale(1.4); }
          60%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
