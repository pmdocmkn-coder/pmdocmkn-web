import { useState, useEffect, useRef } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import {
  format, addMonths, subMonths, setMonth, setYear,
  getMonth, getYear, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, isToday,
} from "date-fns";
import { id } from "date-fns/locale";
import { createPortal } from "react-dom";

const MONTHS_ID = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];
const DAYS_SHORT = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];

function buildCalendarDays(viewMonth: Date): Date[] {
  const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
  const end   = endOfWeek(endOfMonth(viewMonth),     { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

// ─── Standalone PickerPortal — rendered completely outside everything ─────────
interface PickerPortalProps {
  items: { label: string; value: number }[];
  selected: number;
  title: string;
  onSelect: (v: number) => void;
  onClose: () => void;
}

function PickerPortal({ items, selected, title, onSelect, onClose }: PickerPortalProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected item
  useEffect(() => {
    requestAnimationFrame(() => {
      const el = listRef.current?.querySelector<HTMLButtonElement>("[data-sel='true']");
      if (el && listRef.current) {
        const offset = el.offsetTop - (listRef.current.clientHeight / 2) + (el.clientHeight / 2);
        listRef.current.scrollTop = Math.max(0, offset);
      }
    });
  }, []);

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0,
        zIndex: 19999,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Picker backdrop — closes picker only */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }}
      />

      {/* Picker panel */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(92vw, 360px)",
          height: 400,
          background: "white",
          borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 16px 12px",
          borderBottom: "1px solid #E2E8F0",
          flexShrink: 0,
          height: 52,
          boxSizing: "border-box",
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1A202C" }}>{title}</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              fontSize: 13, color: "#2B6CB0", fontWeight: 600,
              background: "none", border: "none", cursor: "pointer",
              padding: "4px 10px",
            }}
          >
            Tutup
          </button>
        </div>

        {/* Scrollable list — explicit height = panel height minus header */}
        <div
          ref={listRef}
          style={{
            height: 348,
            overflowY: "scroll",
            overscrollBehavior: "contain",
          }}
        >
          {items.map(item => {
            const isSelected = item.value === selected;
            return (
              <button
                key={item.value}
                type="button"
                data-sel={isSelected ? "true" : undefined}
                onClick={() => { onSelect(item.value); onClose(); }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "13px 20px",
                  fontSize: 14,
                  cursor: "pointer",
                  border: "none",
                  borderBottom: "1px solid #F7F8FA",
                  fontWeight: isSelected ? 700 : 400,
                  background: isSelected ? "#EBF4FF" : "white",
                  color: isSelected ? "#1B3A6B" : "#2D3748",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface FormMobileDatePickerProps {
  date?: Date;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function FormMobileDatePicker({
  date, onSelect, placeholder = "Pilih tanggal",
}: FormMobileDatePickerProps) {
  const [open, setOpen]           = useState(false);
  const [tempDate, setTempDate]   = useState<Date | undefined>(date);
  const [viewMonth, setViewMonth] = useState<Date>(date ?? new Date());
  const [picker, setPicker]       = useState<"month" | "year" | null>(null);

  const thisYear  = new Date().getFullYear();
  const years     = Array.from({ length: thisYear - 1999 + 3 }, (_, i) => 2000 + i);
  const monthItems = MONTHS_ID.map((label, i) => ({ label, value: i }));
  const yearItems  = years.map(y => ({ label: String(y), value: y }));

  useEffect(() => {
    if (open) {
      setTempDate(date);
      setViewMonth(date ?? new Date());
      setPicker(null);
    }
  }, [open, date]);

  const days = buildCalendarDays(viewMonth);

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-10 flex items-center gap-2 px-3 rounded-lg border border-gray-200 bg-white text-sm shadow-sm hover:border-[#2B6CB0] transition-all cursor-pointer select-none"
      >
        <CalendarIcon className="w-4 h-4 text-[#718096] shrink-0" />
        <span className={`truncate text-left ${date ? "text-[#1A202C] font-medium" : "text-gray-400"}`}>
          {date ? format(date, "dd MMMM yyyy", { locale: id }) : placeholder}
        </span>
      </button>

      {/* Calendar modal portal */}
      {open && createPortal(
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
          />

          {/* Calendar dialog */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative", zIndex: 1,
              width: "min(92vw, 360px)",
              background: "white",
              borderRadius: 20,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              padding: 16,
              display: "flex", flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Title */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#1A202C" }}>Pilih Tanggal</span>
              <button type="button" onClick={() => setOpen(false)}
                style={{ padding: 6, borderRadius: 999, cursor: "pointer", background: "transparent", border: "none" }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#718096" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav row */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <button type="button" onClick={() => setViewMonth(v => subMonths(v, 1))}
                style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F7F8FA", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ChevronLeft size={16} color="#4A5568" />
              </button>

              <button type="button" onClick={() => setPicker("month")}
                style={{ flex: 1, height: 36, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F7F8FA", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", fontSize: 13, fontWeight: 600, color: "#1A202C" }}>
                <span>{MONTHS_ID[getMonth(viewMonth)]}</span>
                <ChevronDown size={14} color="#718096" />
              </button>

              <button type="button" onClick={() => setPicker("year")}
                style={{ width: 82, height: 36, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F7F8FA", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", fontSize: 13, fontWeight: 600, color: "#1A202C", flexShrink: 0 }}>
                <span>{getYear(viewMonth)}</span>
                <ChevronDown size={14} color="#718096" />
              </button>

              <button type="button" onClick={() => setViewMonth(v => addMonths(v, 1))}
                style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F7F8FA", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ChevronRight size={16} color="#4A5568" />
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
              {DAYS_SHORT.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#A0AEC0", paddingBottom: 4 }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px 0" }}>
              {days.map((day, i) => {
                const inMonth  = isSameMonth(day, viewMonth);
                const selected = tempDate ? isSameDay(day, tempDate) : false;
                const todayDay = isToday(day);
                return (
                  <button key={i} type="button" onClick={() => setTempDate(day)}
                    style={{
                      height: 36, borderRadius: 8, border: "none", cursor: "pointer",
                      fontSize: 13, fontWeight: selected ? 700 : 500,
                      background: selected ? "#1B3A6B" : (todayDay && inMonth ? "#EBF4FF" : "transparent"),
                      color: selected ? "white" : (todayDay && inMonth ? "#2B6CB0" : inMonth ? "#1A202C" : "#CBD5E0"),
                    }}>
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, marginTop: 12, borderTop: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", gap: 16 }}>
                <button type="button" onClick={() => { setTempDate(undefined); onSelect(undefined); setOpen(false); }}
                  style={{ fontSize: 13, color: "#718096", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}>
                  Hapus
                </button>
                <button type="button" onClick={() => { const t = new Date(); setTempDate(t); setViewMonth(t); }}
                  style={{ fontSize: 13, color: "#2B6CB0", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
                  Hari ini
                </button>
              </div>
              <button type="button" onClick={() => { onSelect(tempDate); setOpen(false); }}
                style={{ background: "#1B3A6B", color: "white", border: "none", borderRadius: 10, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Selesai
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Picker portal — completely separate from calendar modal */}
      {open && picker && (
        <PickerPortal
          title={picker === "month" ? "Pilih Bulan" : "Pilih Tahun"}
          items={picker === "month" ? monthItems : yearItems}
          selected={picker === "month" ? getMonth(viewMonth) : getYear(viewMonth)}
          onSelect={(v) => {
            if (picker === "month") setViewMonth(prev => setMonth(prev, v));
            else setViewMonth(prev => setYear(prev, v));
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </>
  );
}
