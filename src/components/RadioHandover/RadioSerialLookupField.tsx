import { useEffect, useState } from "react";
import { Search, X, Check } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import type { RadioLookup } from "../../types/radioHandover";

type Props = {
  serial: string;
  radioId: number | null;
  onSelect: (serial: string, radioId: number | null, lookup?: RadioLookup) => void;
  label?: string;
  required?: boolean;
};

export default function RadioSerialLookupField({
  serial,
  radioId,
  onSelect,
  label = "Serial Number Radio",
  required,
}: Props) {
  const [open, setOpen] = useState(false);
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

  const pick = (s: string, id: number | null, item?: RadioLookup) => {
    onSelect(s, id, item);
    setOpen(false);
  };

  return (
    <div>
      <label className="text-sm font-medium">
        {label} {required && "*"}
      </label>
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Trigger asChild>
          <button
            type="button"
            className="w-full h-10 flex items-center justify-between gap-2 px-3 mt-1 rounded-lg border bg-white text-sm shadow-sm hover:border-violet-300"
          >
            <span className={`truncate text-left ${display ? "text-gray-800 font-medium" : "text-gray-400"}`}>
              {display || "Cari SN di master radio..."}
            </span>
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
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
                      pick(search.trim(), null);
                    }
                  }}
                  placeholder="Cari atau ketik SN manual..."
                  autoFocus
                  className="w-full pl-10 pr-20 py-3 text-sm bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-violet-300 outline-none"
                />
                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => pick(search.trim(), null)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-violet-100 text-violet-700 rounded-xl text-xs font-bold"
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
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-0.5 text-left text-sm hover:bg-violet-50 ${
                      radioId === l.id ? "bg-violet-50 text-violet-700 font-bold" : "text-gray-700"
                    }`}
                  >
                    <span>{l.label}</span>
                    {radioId === l.id && <Check className="w-4 h-4" />}
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
        <p className="text-xs text-amber-600 mt-1">SN manual (belum di master radio)</p>
      )}
    </div>
  );
}
