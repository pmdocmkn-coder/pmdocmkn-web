import { useState, useEffect, useRef } from "react";
import { X, ChevronDown } from "lucide-react";

// ─── Searchable Combobox ──────────────────────────────────────────────────────

interface SearchableComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  allowCustom?: boolean;
  accentColor?: string; // tailwind ring color class, e.g. "violet" | "emerald" | "blue"
}

export function SearchableCombobox({
  value,
  onChange,
  options,
  placeholder = "Pilih atau ketik...",
  allowCustom = true,
  accentColor = "violet",
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ringClass = `focus-visible:ring-${accentColor}-400 focus-visible:border-${accentColor}-400`;

  useEffect(() => {
    if (!open) setQuery(value);
  }, [value, open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (allowCustom) onChange(query);
        else setQuery(value);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [query, value, allowCustom, onChange]);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (opt: string) => {
    onChange(opt);
    setQuery(opt);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (allowCustom) onChange(e.target.value);
    setOpen(true);
  };

  const handleClear = () => {
    setQuery("");
    onChange("");
    inputRef.current?.focus();
    setOpen(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-8 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 ${ringClass}`}
        />
        {query ? (
          <button type="button" onClick={handleClear} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-gray-400">
              {allowCustom && query
                ? <span>Tekan Enter atau klik di luar untuk pakai "<strong>{query}</strong>"</span>
                : "Tidak ada data ditemukan"}
            </div>
          ) : (
            <ul className="max-h-48 overflow-y-auto py-1">
              {filtered.map((opt) => (
                <li
                  key={opt}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
                  className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-violet-50 hover:text-violet-700 transition-colors ${opt === value ? "bg-violet-50 text-violet-700 font-medium" : "text-gray-700"}`}
                >
                  {opt === value && (
                    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className={opt === value ? "" : "ml-5"}>{opt}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Fleet Combobox (multi-value, koma-separated) ────────────────────────────

interface FleetComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
}

export function FleetCombobox({ value, onChange, options }: FleetComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedFleets = value
    ? value.split(",").map((f) => f.trim()).filter(Boolean)
    : [];

  const filtered = options.filter(
    (o) => o.toLowerCase().includes(query.toLowerCase()) && !selectedFleets.includes(o)
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addFleet = (fleet: string) => {
    const next = [...selectedFleets, fleet].join(", ");
    onChange(next);
    setQuery("");
    inputRef.current?.focus();
  };

  const removeFleet = (fleet: string) => {
    const next = selectedFleets.filter((f) => f !== fleet).join(", ");
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && query.trim()) {
      e.preventDefault();
      if (!selectedFleets.includes(query.trim())) addFleet(query.trim());
    }
    if (e.key === "Backspace" && !query && selectedFleets.length > 0) {
      removeFleet(selectedFleets[selectedFleets.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex flex-wrap gap-1.5 min-h-9 w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-violet-400 focus-within:border-violet-400 cursor-text"
        onClick={() => { inputRef.current?.focus(); setOpen(true); }}
      >
        {selectedFleets.map((f) => (
          <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold border border-violet-200">
            {f}
            <button type="button" onMouseDown={(e) => { e.preventDefault(); removeFleet(f); }} className="hover:text-violet-900 transition-colors">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedFleets.length === 0 ? "Cari atau ketik fleet..." : ""}
          className="flex-1 min-w-[80px] bg-transparent outline-none placeholder:text-muted-foreground text-sm"
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-gray-400">
              {query
                ? <span>Tekan Enter untuk tambah "<strong>{query}</strong>"</span>
                : options.length === 0 ? "Belum ada data fleet" : "Semua fleet sudah dipilih"}
            </div>
          ) : (
            <ul className="max-h-48 overflow-y-auto py-1">
              {filtered.map((opt) => (
                <li
                  key={opt}
                  onMouseDown={(e) => { e.preventDefault(); addFleet(opt); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-violet-50 hover:text-violet-700 transition-colors text-gray-700"
                >
                  <span className="font-mono font-medium">{opt}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
