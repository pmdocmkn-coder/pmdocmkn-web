import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { ResponsiveModal } from "../common/ResponsiveModal";
import { FileCheck, Camera, Upload, Trash2, Check, AlertCircle, PenTool } from "lucide-react";
import { compressImageForStorage, IMAGE_PRESETS } from "../../utils/imageCompress";
import SignaturePadField, { type SignaturePadHandle } from "../common/SignaturePadField";
import LiveCameraCapture from "./LiveCameraCapture";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketNumber?: string;
  serialNumber?: string;
  receiverName?: string;
  onConfirm: (data: {
    isScrapLetterAttached: boolean;
    proofPhotoBase64: string;
    receiverSignatureBase64?: string;
  }) => Promise<void> | void;
  submitting?: boolean;
};

export default function RadioScrapVerificationModal({
  open,
  onOpenChange,
  ticketNumber,
  serialNumber,
  receiverName,
  onConfirm,
  submitting = false,
}: Props) {
  const [isChecked, setIsChecked] = useState(false);
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [sigWh, setSigWh] = useState<string | null>(null);
  const [signLater, setSignLater] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sigWhRef = useRef<SignaturePadHandle>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingFile(true);
    try {
      const compressed = await compressImageForStorage(file, IMAGE_PRESETS.radioPhoto);
      setProofPhoto(compressed);
    } catch (err) {
      console.error("Gagal kompres foto bukti scrap:", err);
    } finally {
      setLoadingFile(false);
      e.target.value = "";
    }
  };

  const handleCameraCapture = (dataUrl: string) => {
    setProofPhoto(dataUrl);
    setCameraOpen(false);
  };

  const handleSubmit = async () => {
    if (!isChecked || !proofPhoto) return;

    let finalSig: string | undefined = undefined;
    if (!signLater) {
      const exported = await sigWhRef.current?.exportNow();
      finalSig = exported ?? sigWh ?? undefined;
    }

    await onConfirm({
      isScrapLetterAttached: isChecked,
      proofPhotoBase64: proofPhoto,
      receiverSignatureBase64: finalSig,
    });
  };

  const isFormValid = isChecked && !!proofPhoto && (signLater || !!sigWh);

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={onOpenChange}
        preventOutsideClose={true}
        desktopClassName="max-w-lg rounded-2xl p-0 overflow-hidden border-0 shadow-2xl"
        contentClassName="p-0"
      >
        {/* Header Banner — MKN Navy */}
        <div className="bg-[#1B3A6B] p-6 text-white text-center rounded-t-[16px] md:rounded-t-none">
          <div className="w-14 h-14 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-3">
            <FileCheck className="w-7 h-7 text-amber-300" />
          </div>
          <h2 className="text-lg md:text-xl font-bold">Verifikasi Surat Scrap & TTD Warehouse</h2>
          <p className="text-[#EBF4FF] text-xs mt-1 opacity-90">
            {ticketNumber ? `Tiket ${ticketNumber}` : "Radio Scrap"}
            {serialNumber ? ` — SN ${serialNumber}` : ""}
          </p>
          <p className="text-xs text-blue-200 mt-2 max-w-sm mx-auto">
            Pastikan surat scrap dari Helpdesk sudah disertakan sebelum menyelesaikan serah terima.
          </p>
        </div>

        <div className="p-6 space-y-4 bg-white pb-safe max-h-[75vh] overflow-y-auto">
          {/* Step 1: Checklist Wajib */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Langkah 1 — Konfirmasi Surat Scrap
            </label>
            <div
              onClick={() => setIsChecked(!isChecked)}
              className={`w-full flex items-start gap-3.5 p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none ${
                isChecked
                  ? "border-emerald-500 bg-emerald-50/70"
                  : "border-gray-200 bg-gray-50/80 hover:bg-gray-100 hover:border-gray-300"
              }`}
            >
              <div
                className={`w-5 h-5 mt-0.5 rounded-md flex items-center justify-center border-2 transition-colors shrink-0 ${
                  isChecked
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-white border-gray-300"
                }`}
              >
                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="text-left flex-1">
                <p className={`text-sm font-bold ${isChecked ? "text-emerald-950" : "text-gray-900"}`}>
                  Radio Diserahkan dengan Surat Scrap
                </p>
                <p className={`text-xs mt-0.5 leading-relaxed ${isChecked ? "text-emerald-800" : "text-gray-500"}`}>
                  Unit radio diserahkan bersama surat scrap dari Helpdesk.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Foto Bukti Surat & Radio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <span>Langkah 2 — Foto Bukti Surat & Radio</span>
                <span className="text-red-500">*</span>
              </label>
              {proofPhoto && (
                <button
                  type="button"
                  onClick={() => setProofPhoto(null)}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              )}
            </div>

            {proofPhoto ? (
              <div className="relative rounded-xl border-2 border-emerald-200 bg-emerald-50/40 p-2 overflow-hidden">
                <img
                  src={proofPhoto}
                  alt="Bukti Surat Scrap dan Radio"
                  className="w-full h-36 object-contain rounded-lg bg-black/5"
                />
                <div className="mt-2 flex items-center justify-between px-1">
                  <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Foto bukti terlampir
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCameraOpen(true)}
                      className="text-[11px] text-[#2B6CB0] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Camera className="w-3 h-3" /> Foto Ulang
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] text-[#2B6CB0] font-semibold hover:underline cursor-pointer"
                    >
                      Pilih File
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-300 p-3.5 text-center bg-gray-50/60 hover:bg-gray-50 transition-colors">
                <p className="text-xs text-gray-600 mb-2.5">
                  Gunakan kamera langsung atau unggah foto lembar surat scrap berdampingan dengan unit radio
                </p>

                <div className="flex items-center justify-center gap-2">
                  {/* Tombol Live Camera */}
                  <button
                    type="button"
                    disabled={loadingFile}
                    onClick={() => setCameraOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Live Kamera</span>
                  </button>

                  {/* Tombol Upload File */}
                  <button
                    type="button"
                    disabled={loadingFile}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih File</span>
                  </button>
                </div>

                {loadingFile && (
                  <p className="text-[11px] text-gray-500 mt-2 animate-pulse">Memproses foto...</p>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Step 3: Tanda Tangan Penerima Warehouse */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-gray-500" />
                <span>Langkah 3 — TTD Penerima Warehouse</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={signLater}
                  onChange={(e) => setSignLater(e.target.checked)}
                  className="rounded border-gray-300 text-[#1B3A6B] focus:ring-[#1B3A6B]"
                />
                <span>TTD Menyusul</span>
              </label>
            </div>

            {!signLater ? (
              <div className="space-y-1">
                <SignaturePadField
                  ref={sigWhRef}
                  label={`TTD Penerima${receiverName ? ` (${receiverName})` : " (Staff Warehouse)"} *`}
                  required
                  value={sigWh}
                  onChange={setSigWh}
                />
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Dokumen akan disimpan dengan status <strong>Pending Receiver Signature</strong>. Staf Warehouse dapat melengkapi tanda tangan nanti di portal Warehouse.
                </span>
              </div>
            )}
          </div>

          {/* Warning jika belum lengkap */}
          {!isFormValid && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                {!isChecked
                  ? "Wajib konfirmasi surat scrap telah disertakan."
                  : !proofPhoto
                  ? "Wajib ambil foto surat scrap bersama unit radio."
                  : "Wajib mengisi tanda tangan Warehouse (atau centang 'TTD Menyusul')."}
              </span>
            </div>
          )}

          {/* Bottom Action Buttons */}
          <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
            <button
              type="button"
              disabled={submitting}
              className="px-4 py-2.5 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!isFormValid || submitting}
              onClick={handleSubmit}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white text-xs font-bold rounded-xl disabled:opacity-40 disabled:pointer-events-none shadow-sm transition-all cursor-pointer"
            >
              {submitting ? "Menyimpan..." : "Simpan Serah Terima ke WHS"}
            </button>
          </div>
        </div>
      </ResponsiveModal>

      {/* Live camera modal portal ke document.body */}
      {createPortal(
        <LiveCameraCapture
          open={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onCapture={handleCameraCapture}
          remaining={1}
        />,
        document.body
      )}
    </>
  );
}
