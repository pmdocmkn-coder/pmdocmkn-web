import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { id as dateFnsLocale } from "date-fns/locale";
import { id as dayPickerLocale } from "react-day-picker/locale";
import { Calendar, ChevronDown } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

type Props = {
  dateFrom: string;
  dateTo: string;
  onChange: (from: string, to: string) => void;
  accent?: "violet" | "red";
};

export default function RepairDateRangeFilter({ dateFrom, dateTo, onChange, accent = "violet" }: Props) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(() => {
    if (!dateFrom) return undefined;
    return {
      from: new Date(dateFrom),
      to: dateTo ? new Date(dateTo) : undefined,
    };
  });
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dateFrom && !dateTo) {
      setRange(undefined);
      return;
    }
    setRange({
      from: dateFrom ? new Date(dateFrom) : undefined,
      to: dateTo ? new Date(dateTo) : undefined,
    });
  }, [dateFrom, dateTo]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const label = () => {
    if (!dateFrom && !dateTo) return "Pilih rentang tanggal";
    if (dateFrom && !dateTo) return format(new Date(dateFrom), "d MMM yyyy", { locale: dateFnsLocale });
    if (dateFrom === dateTo) return format(new Date(dateFrom), "d MMM yyyy", { locale: dateFnsLocale });
    return `${format(new Date(dateFrom), "d MMM yyyy", { locale: dateFnsLocale })} – ${format(new Date(dateTo), "d MMM yyyy", { locale: dateFnsLocale })}`;
  };

  const ring = accent === "violet" ? "focus:ring-violet-400 focus:border-violet-400" : "focus:ring-red-400 focus:border-red-400";
  const icon = accent === "violet" ? "text-violet-600" : "text-red-500";

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`flex items-center justify-between w-full h-10 px-3 text-sm font-medium text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-1 ${ring}`}
          >
            <span className="flex items-center gap-2 text-gray-700 truncate">
              <Calendar className={`w-4 h-4 shrink-0 ${icon}`} />
              {label()}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div ref={calRef} className="p-3 bg-white rounded-xl shadow-xl border border-gray-100">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={(r) => {
                setRange(r);
                onChange(r?.from ? format(r.from, "yyyy-MM-dd") : "", r?.to ? format(r.to, "yyyy-MM-dd") : "");
              }}
              locale={dayPickerLocale}
              showOutsideDays
              classNames={{
                day_range_start: accent === "violet" ? "bg-violet-600 text-white rounded-l-lg" : "bg-red-600 text-white rounded-l-lg",
                day_range_end: accent === "violet" ? "bg-violet-600 text-white rounded-r-lg" : "bg-red-600 text-white rounded-r-lg",
                day_range_middle: accent === "violet" ? "bg-violet-50 text-violet-900" : "bg-red-50 text-red-900",
                day_selected: accent === "violet" ? "bg-violet-600 text-white" : "bg-red-600 text-white",
              }}
            />
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setRange(undefined);
                  onChange("", "");
                  setOpen(false);
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-violet-700"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`px-4 py-1.5 text-xs font-medium text-white rounded-lg ${
                  accent === "violet" ? "bg-violet-600 hover:bg-violet-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Selesai
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
