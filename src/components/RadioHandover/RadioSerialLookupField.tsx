import { useEffect, useState } from "react";
import { Eye, Search, X, Check } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import type { RadioLookup } from "../../types/radioHandover";
import RadioMasterDetailDialog from "./RadioMasterDetailDialog";
import { formatRadioOwnerLabel } from "../../utils/radioOwnerLabel";

type Props = {
  serial: string;
  radioId: number | null;
  lookup?: RadioLookup | null;
  onSelect: (serial: string, radioId: number | null, lookup?: RadioLookup) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
};

export default function RadioSerialLookupField({
  serial,
  radioId,
  lookup,
  onSelect,
  label = "Serial Number Radio",
  required,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [masterOpen, setMasterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [lookups, setLookups] = useState<RadioLookup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (search.trim().length < 2) {
      setLookups([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      radioHandoverApi
        .lookupBySerial(search)
        .then(setLookups)
        .catch(() => setLookups([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, open]);

  const display = serial || (radioId ? `Radio #${radioId}` : "");

  const pick = async (s: string, id: number | null, item?: RadioLookup) => {
    const trimmed = s.trim();
    if (!trimmed) return;

    if (id != null && item) {
      onSelect(trimmed, id, item);
      setOpen(false);
      return;
    }

    try {
      const results = await radioHandoverApi.lookupBySerial(trimmed);
      const exact =
        results.find((r) => (r.serialNumber ?? "").trim().toLowerCase() === trimmed.toLowerCase()) ??
        results[0];
      if (exact?.id) {
        onSelect(trimmed, exact.id, exact);
        setOpen(false);
        return;
      }
    } catch {
      /* manual SN */
    }

    onSelect(trimmed, null);
    setOpen(false);
  };

  const activeLookup = lookup ?? (radioId ? lookups.find((l) => l.id === radioId) : undefined);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium">
          {label} {required && "*"}
        </label>
        {(serial.trim() || radioId) && (
          <button
            type="button"
            title="Lihat detail master radio"
            className="flex items-center gap-1 text-xs text-[#2B6CB0] hover:bg-[#EBF4FF]/50 px-2 py-1 rounded-[10px] border border-[#2B6CB0]/20"
            onClick={() => setMasterOpen(true)}
          >
            <Eye className="w-3.5 h-3.5" /> Detail radio
          </button>
        )}
      </div>
      <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!disabled) setOpen(v); }}>
        <DialogPrimitive.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={`w-full h-10 flex items-center justify-between gap-2 px-3 mt-1 rounded-[10px] border text-sm shadow-sm ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-80 text-gray-500' : 'bg-white hover:border-[#2B6CB0]'}`}
          >
            <span className={`truncate text-left ${display ? "text-gray-800 font-medium" : "text-gray-400"}`}>
              {display || "Cari SN di master radio..."}
            </span>
            {!disabled && <Search className="w-4 h-4 text-gray-400 shrink-0" />}
          </button>
        </DialogPrimitive.Trigger>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40 z-[200]" />
          <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 top-12 z-[201] flex flex-col bg-white rounded-t-3xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:max-h-[85vh] sm:rounded-2xl shadow-2xl">
            <div className="px-5 pt-5 pb-3 flex justify-between items-center">
              <h3 className="text-lg font-bold">Pilih Serial Number</h3>
              <DialogPrimitive.Close asChild>
                <button type="button" className="p-1.5 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </DialogPrimitive.Close>
            </div>
            <div className="px-5 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && search.trim()) {
                      e.preventDefault();
                      void pick(search.trim(), null);
                    }
                  }}
                  placeholder="Cari atau ketik SN manual..."
                  autoFocus
                  className="w-full pl-10 pr-20 py-3 text-sm bg-gray-50 border rounded-[10px] focus:ring-2 focus:ring-[#2B6CB0]/20 outline-none"
                />
                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => void pick(search.trim(), null)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#EBF4FF] text-[#2B6CB0] rounded-[10px] text-xs font-bold"
                  >
                    Pakai
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-8">
              {loading && <p className="text-center text-sm text-gray-400 py-6">Mencari...</p>}
              {!loading && search.trim().length < 2 && (
                <p className="text-center text-sm text-gray-400 py-6">Ketik minimal 2 karakter</p>
              )}
              {!loading &&
                lookups.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => pick(l.serialNumber ?? l.label, l.id, l)}
                    className={`w-full flex flex-col items-start px-4 py-3.5 rounded-[10px] mb-0.5 text-left text-sm hover:bg-[#EBF4FF]/50 ${
                      radioId === l.id ? "bg-[#EBF4FF] text-[#1B3A6B] font-bold" : "text-gray-700"
                    }`}
                  >
                    <span className="flex w-full justify-between items-center">
                      <span>{l.label}</span>
                      {radioId === l.id && <Check className="w-4 h-4 shrink-0" />}
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5">{formatRadioOwnerLabel(l)}</span>
                  </button>
                ))}
            </div>
            <div className="px-5 py-3 border-t text-xs text-gray-400 text-center">
              {search.trim().length >= 2
                ? `${lookups.length} hasil — atau Pakai untuk SN manual`
                : "Terhubung ke master radio KPC/Kontraktor/Unit"}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
      {serial && !radioId && (
        <p className="text-xs text-amber-600 mt-1">SN manual — isi tipe/nama alat di bawah</p>
      )}
      {activeLookup && radioId && (
        <p className="text-xs text-[#2B6CB0] mt-1 truncate">
          {formatRadioOwnerLabel(activeLookup)}
          {activeLookup.division && ` · Div: ${activeLookup.division}`}
          {activeLookup.department && ` · Dept: ${activeLookup.department}`}
        </p>
      )}
      <RadioMasterDetailDialog
        open={masterOpen}
        onClose={() => setMasterOpen(false)}
        lookup={activeLookup ?? null}
        serialFallback={serial}
      />
    </div>
  );
}
