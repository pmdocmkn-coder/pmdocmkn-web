import { useState, useRef, useEffect, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";

interface FilterSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  color?: "violet" | "blue" | "emerald" | "rose";
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  color = "violet",
}: FilterSelectProps) {
  const uid = useId();
  const portalId = `fsp-${uid.replace(/:/g, "")}`;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const c = {
    violet: { active: "bg-violet-600 text-white", hover: "hover:bg-violet-50 hover:text-violet-700", ring: "ring-violet-400 border-violet-400" },
    blue:   { active: "bg-blue-600 text-white",   hover: "hover:bg-blue-50 hover:text-blue-700",     ring: "ring-blue-400 border-blue-400" },
    emerald:{ active: "bg-emerald-600 text-white", hover: "hover:bg-emerald-50 hover:text-emerald-700", ring: "ring-emerald-400 border-emerald-400" },
    rose:   { active: "bg-rose-600 text-white",    hover: "hover:bg-rose-50 hover:text-rose-700",     ring: "ring-rose-400 border-rose-400" },
  }[color];

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = Math.min(300, 56 + Math.min(filtered.length + 1, 8) * 36 + 32);

    if (spaceBelow < estimatedHeight && rect.top > estimatedHeight) {
      setDropdownStyle({
        position: "fixed",
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: Math.max(rect.width, 220),
        zIndex: 99999,
      });
    } else {
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 220),
        zIndex: 99999,
      });
    }
  }, [filtered.length]);

  const handleOpen = () => {
    if (!open) updatePosition();
    setOpen((v) => !v);
  };

  // Close on outside click — but NOT when clicking inside the dropdown itself
  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
      setSearch("");
    };

    // Close on page scroll (but not scroll inside the dropdown list)
    const handleScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false);
      setSearch("");
    };

    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const handleSelect = (val: string) => {
    onChange(val === value ? "" : val);
    setOpen(false);
    setSearch("");
  };

  const dropdown = open ? (
    <div
      ref={dropdownRef}
      id={portalId}
      style={dropdownStyle}
      className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Search */}
      <div className="p-2 border-b border-gray-100 bg-gray-50/80">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setOpen(false); setSearch(""); }
              if (e.key === "Enter" && filtered.length === 1) handleSelect(filtered[0]);
            }}
            placeholder="Cari..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400"
          />
        </div>
      </div>

      {/* Options */}
      <div className="max-h-52 overflow-y-auto overscroll-contain py-1">
        {/* Reset option */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleSelect("")}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
            !value ? `${c.active} font-medium` : `text-gray-500 ${c.hover}`
          }`}
        >
          <span>{placeholder}</span>
          {!value && <Check className="w-3.5 h-3.5 shrink-0" />}
        </button>

        {options.length > 0 && <div className="mx-3 my-0.5 border-t border-gray-100" />}

        {filtered.length === 0 ? (
          <div className="px-3 py-5 text-center text-xs text-gray-400">
            Tidak ada hasil untuk &ldquo;{search}&rdquo;
          </div>
        ) : (
          filtered.map((opt) => (
            <button
              key={opt}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(opt)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                value === opt ? `${c.active} font-medium` : `text-gray-700 ${c.hover}`
              }`}
            >
              <span className="truncate text-left">{opt}</span>
              {value === opt && <Check className="w-3.5 h-3.5 shrink-0 ml-2" />}
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50/80">
        <p className="text-xs text-gray-400">
          {search ? `${filtered.length} dari ${options.length} opsi` : `${options.length} opsi`}
        </p>
      </div>
    </div>
  ) : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={`
          w-full h-9 flex items-center justify-between gap-1.5 px-3
          rounded-lg border bg-white text-sm shadow-sm
          transition-all duration-150 cursor-pointer select-none
          ${open ? `ring-2 ring-offset-0 ${c.ring}` : "border-gray-200 hover:border-gray-300 hover:shadow"}
        `}
      >
        <span className={`truncate text-left ${value ? "text-gray-800 font-medium" : "text-gray-400"}`}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-0.5 shrink-0">
          {value && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); setSearch(""); }}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}
