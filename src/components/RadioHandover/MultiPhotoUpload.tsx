import { Plus, Trash2 } from "lucide-react";
import { compressImageForStorage, IMAGE_PRESETS } from "../../utils/imageCompress";

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
  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = MAX_PHOTOS - photos.length;
    const slice = files.slice(0, remaining);
    const encoded: string[] = [];
    for (const file of slice) {
      encoded.push(await compressImageForStorage(file, IMAGE_PRESETS.radioPhoto));
    }
    onChange([...photos, ...encoded]);
    e.target.value = "";
  };

  const remove = (index: number) => onChange(photos.filter((_, i) => i !== index));

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {label} {required && "*"} ({photos.length}/{MAX_PHOTOS})
        </label>
        {/* Tombol tambah foto — disembunyikan jika disabled */}
        {!disabled && photos.length < MAX_PHOTOS && (
          <label className="flex items-center gap-1 text-xs px-2 py-1 border rounded-lg cursor-pointer hover:bg-gray-50">
            <Plus className="w-3 h-3" /> Tambah foto
            <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
          </label>
        )}
      </div>
      {/* Area upload kosong — hanya tampil jika belum ada foto dan tidak disabled */}
      {photos.length === 0 && !disabled && (
        <label className="mt-2 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-violet-300">
          <span className="text-sm text-gray-500">Pilih satu atau lebih foto</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
        </label>
      )}
      {photos.length === 0 && disabled && (
        <p className="mt-2 text-sm text-gray-400 italic">Tidak ada foto</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {photos.map((src, i) => (
          <div key={i} className="relative">
            <img src={src} alt={`foto ${i + 1}`} className="h-24 w-24 object-cover rounded border" />
            {/* Tombol hapus — disembunyikan jika disabled */}
            {!disabled && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
