import { useState, useEffect } from "react";
import { Search, X, Check, ChevronDown } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

interface FormMobileSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
  color?: "violet" | "blue" | "emerald" | "rose";
}

export function FormMobileSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  label,
  color = "violet",
}: FormMobileSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const colorMap = {
    violet: { bg: "bg-violet-600", text: "text-violet-600", light: "bg-violet-50", ring: "ring-violet-300" },
    blue: { bg: "bg-blue-600", text: "text-blue-600", light: "bg-blue-50", ring: "ring-blue-300" },
    emerald: { bg: "bg-emerald-600", text: "text-emerald-600", light: "bg-emerald-50", ring: "ring-emerald-300" },
    rose: { bg: "bg-rose-600", text: "text-rose-600", light: "bg-rose-50", ring: "ring-rose-300" },
  };
  const c = colorMap[color];

  const handleSelect = (opt: string) => {
    onChange(opt);
    setOpen(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className={`w-full h-10 flex items-center justify-between gap-2 px-3 rounded-lg border bg-white text-sm shadow-sm transition-all cursor-pointer select-none border-gray-200 hover:border-gray-300 hover:shadow`}
        >
          <span className={`truncate text-left ${value ? "text-gray-800 font-medium" : "text-gray-400"}`}>
            {value || placeholder}
          </span>
          <div className="flex items-center gap-0.5 shrink-0">
            {value && (
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); onChange(""); }}
                className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]" />
        <DialogPrimitive.Content 
          className="fixed inset-x-0 bottom-0 top-12 z-[201] flex flex-col bg-white rounded-t-3xl sm:rounded-2xl sm:rounded-t-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 focus:outline-none sm:inset-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-full sm:max-w-md sm:h-auto sm:max-h-[85vh] sm:data-[state=open]:zoom-in-95"
        >
          {/* Handle bar (Mobile Only) */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          {/* Title */}
          <div className="px-5 pb-3 sm:pt-5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">{label || placeholder}</h3>
            <DialogPrimitive.Close asChild>
              <button className="p-1.5 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </DialogPrimitive.Close>
          </div>

          {/* Search */}
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
                    handleSelect(search.trim());
                  }
                }}
                placeholder="Cari atau ketik baru..."
                autoFocus
                className={`w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 ${c.ring} focus:border-transparent transition-all`}
              />
              {search && (
                <button onClick={() => handleSelect(search.trim())} className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-xl text-xs font-bold transition-colors`}>
                  Pakai
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-8">
            {/* Reset / Clear option */}
            <button
              onClick={() => { onChange(""); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-1 transition-colors ${
                !value ? `${c.light} ${c.text} font-bold` : "text-red-500 hover:bg-red-50"
              }`}
            >
              <span>Kosongkan Pilihan</span>
              {!value && <Check className="w-4 h-4" />}
            </button>

            {options.length > 0 && <div className="mx-4 border-t border-gray-100 my-1" />}

            {filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                {search ? (
                  <span>Tekan <strong>Pakai</strong> atau Enter untuk menggunakan "{search}"</span>
                ) : (
                  "Tidak ada data"
                )}
              </div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-0.5 transition-colors ${
                    value === opt
                      ? `${c.light} ${c.text} font-bold`
                      : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                  }`}
                >
                  <span className="text-left">{opt}</span>
                  {value === opt && <Check className="w-4 h-4 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 bg-white">
            <p className="text-xs text-gray-400 text-center">
              {search ? (
                !filtered.includes(search.trim()) ? "Data baru akan digunakan" : `${filtered.length} opsi ditemukan`
              ) : `${options.length} opsi tersedia`}
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
