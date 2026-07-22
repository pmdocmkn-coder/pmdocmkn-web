import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { RadioLookup } from "../../types/radioHandover";
import { formatRadioOwnerLabel } from "../../utils/radioOwnerLabel";

type Props = {
  open: boolean;
  onClose: () => void;
  lookup: RadioLookup | null;
  serialFallback?: string;
};

export default function RadioMasterDetailDialog({ open, onClose, lookup, serialFallback }: Props) {
  if (!lookup && !serialFallback) return null;

  const owner = lookup ? formatRadioOwnerLabel(lookup) : "—";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40 z-[250]" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[251] w-full max-w-md bg-white rounded-2xl shadow-2xl p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-gray-900">Detail Master Radio</h3>
            <DialogPrimitive.Close asChild>
              <button type="button" className="p-1.5 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </DialogPrimitive.Close>
          </div>
          {lookup ? (
            <dl className="space-y-2 text-sm">
              <Row label="Serial Number" value={lookup.serialNumber ?? "—"} />
              <Row label="Pemilik / Unit" value={owner} highlight />
              <Row label="Kategori" value={lookup.category} />
              <Row label="Tipe radio" value={lookup.type ?? "—"} />
              <Row label="Nomor unit" value={lookup.nomorUnit ?? "—"} />
              <Row label="Nomor LV" value={lookup.nomorLv ?? "—"} />
              <Row label="Nomor aset" value={lookup.nomorAset ?? "—"} />
              <Row label="Perusahaan" value={lookup.company ?? "—"} />
              <Row label="Divisi" value={lookup.division ?? "—"} />
              <Row label="Departemen" value={lookup.department ?? "—"} />
              <Row label="Fleet" value={lookup.fleet ?? "—"} />
              <Row label="Channel" value={lookup.channel ?? "—"} />
            </dl>
          ) : (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              SN <strong>{serialFallback}</strong> belum terdaftar di master radio. Isi tipe/nama alat manual di form.
            </p>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex gap-2 py-1 border-b border-gray-50 last:border-0">
      <dt className="w-32 shrink-0 text-gray-500">{label}</dt>
      <dd className={`flex-1 font-medium ${highlight ? "text-[#2B6CB0] font-semibold" : "text-gray-800"}`}>{value}</dd>
    </div>
  );
}
