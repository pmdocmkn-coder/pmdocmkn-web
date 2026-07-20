import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Camera } from "lucide-react";
import { compressImageForStorage, IMAGE_PRESETS } from "../../utils/imageCompress";
import LiveCameraCapture from "./LiveCameraCapture";

const MAX_PHOTOS = 5;

type Props = {
  photos: string[];
  onChange: (photos: string[]) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean; // jika true: tampil read-only, tombol tambah/hapus disembunyikan
};

export default function MultiPhotoUpload({
  photos,
  onChange,
  label = "Foto Radio",
  required,
  disabled = false,
}: Props) {
  const [cameraOpen, setCameraOpen] = useState(false);

  // Sisa slot yang tersedia
  const remaining = MAX_PHOTOS - photos.length;
  const canAdd = !disabled && remaining > 0;

  // ------------------------------------------------------------------
  // Handler: pilih file dari galeri / storage
  // ------------------------------------------------------------------
  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const slice = files.slice(0, remaining);
    const encoded: string[] = [];
    for (const file of slice) {
      encoded.push(await compressImageForStorage(file, IMAGE_PRESETS.radioPhoto));
    }
    onChange([...photos, ...encoded]);
    e.target.value = "";
  };

  // ------------------------------------------------------------------
  // Handler: foto dari kamera live
  // ------------------------------------------------------------------
  const onCameraCapture = (dataUrl: string) => {
    onChange([...photos, dataUrl]);
    // Kamera tetap terbuka sampai pengguna tutup manual atau slot penuh
  };

  const remove = (index: number) => onChange(photos.filter((_, i) => i !== index));

  return (
    <>
      <div>
        {/* Header baris label + tombol aksi */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[#1A202C]">
            {label} {required && <span className="text-[#DC2626]">*</span>}{" "}
            <span className="text-[#718096] font-normal">
              ({photos.length}/{MAX_PHOTOS})
            </span>
          </label>

          {canAdd && (
            <div className="flex items-center gap-1.5">
              {/* Tombol kamera live */}
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                title="Foto langsung dari kamera"
                className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-[8px] border border-[#E2E8F0] bg-[#F7F8FA] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] hover:border-[#2B6CB0]/30 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kamera</span>
              </button>

              {/* Tombol pilih dari galeri */}
              <label
                title="Pilih foto dari galeri / storage"
                className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-[8px] border border-[#E2E8F0] bg-[#F7F8FA] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] hover:border-[#2B6CB0]/30 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tambah foto</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onFiles}
                />
              </label>
            </div>
          )}
        </div>

        {/* Area upload kosong — tampil jika belum ada foto dan tidak disabled */}
        {photos.length === 0 && !disabled && (
          <div className="mt-2 flex gap-2">
            {/* Tap kamera (primary CTA di mobile) */}
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#E2E8F0] rounded-[10px] py-5 hover:border-[#2B6CB0]/40 hover:bg-[#EBF4FF]/30 transition-colors group"
            >
              <Camera className="w-6 h-6 text-[#718096] group-hover:text-[#2B6CB0] transition-colors" />
              <span className="text-xs text-[#718096] group-hover:text-[#2B6CB0] transition-colors font-medium">
                Foto langsung
              </span>
            </button>

            {/* Atau pilih dari galeri */}
            <label className="flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#E2E8F0] rounded-[10px] py-5 hover:border-[#2B6CB0]/40 hover:bg-[#EBF4FF]/30 transition-colors cursor-pointer group">
              <Plus className="w-6 h-6 text-[#718096] group-hover:text-[#2B6CB0] transition-colors" />
              <span className="text-xs text-[#718096] group-hover:text-[#2B6CB0] transition-colors font-medium">
                Pilih dari galeri
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onFiles}
              />
            </label>
          </div>
        )}

        {/* State: tidak ada foto & disabled */}
        {photos.length === 0 && disabled && (
          <p className="mt-2 text-sm text-[#718096] italic">Tidak ada foto</p>
        )}

        {/* Thumbnail grid */}
        {photos.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {photos.map((src, i) => (
              <div key={i} className="relative">
                <img
                  src={src}
                  alt={`foto ${i + 1}`}
                  className="h-24 w-24 object-cover rounded-[8px] border border-[#E2E8F0]"
                />
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    title="Hapus foto"
                    className="absolute -top-1.5 -right-1.5 bg-[#DC2626] text-white rounded-full p-0.5 shadow-sm hover:bg-[#B91C1C] transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

            {/* Slot tambah foto kecil (jika sudah ada foto tapi belum penuh) */}
            {canAdd && (
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                title="Ambil foto lagi"
                className="h-24 w-24 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-[#E2E8F0] rounded-[8px] text-[#718096] hover:border-[#2B6CB0]/40 hover:text-[#2B6CB0] hover:bg-[#EBF4FF]/30 transition-colors"
              >
                <Camera className="w-5 h-5" />
                <span className="text-[10px]">Foto lagi</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Live camera modal — portal ke document.body agar tidak terkurung di dalam modal parent */}
      {createPortal(
        <LiveCameraCapture
          open={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onCapture={onCameraCapture}
          remaining={remaining}
        />,
        document.body
      )}
    </>
  );
}
