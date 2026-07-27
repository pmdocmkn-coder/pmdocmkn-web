import React, { useState, useEffect } from "react";
import { format, setMonth, setYear, getMonth, getYear, addMonths, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export type PeriodFilterValue = 
  | { type: "month"; year: string; month: string } // month is 'all' or '0'-'11'
  | { type: "date"; date: Date };

interface SinglePeriodFilterProps {
  value?: PeriodFilterValue;
  onChange: (value: PeriodFilterValue) => void;
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
  /** Dates that have data — shown with a dot indicator */
  highlightedDates?: Date[];
  /** Called when the visible month on the calendar changes */
  onMonthChange?: (year: number, month: number) => void;
}

export function SinglePeriodFilter({ value, onChange, trigger, align = "start", highlightedDates, onMonthChange }: SinglePeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Local state for the popover UI
  const [activeTab, setActiveTab] = useState<"month" | "date">("date");
  const [yearFilter, setYearFilter] = useState<string>(String(new Date().getFullYear()));
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Sync incoming value to local state when popover opens
  useEffect(() => {
    if (isOpen && value) {
      setActiveTab(value.type);
      if (value.type === "month") {
        setYearFilter(value.year);
        setMonthFilter(value.month);
      } else if (value.type === "date") {
        setSelectedDate(value.date);
      }
    } else if (isOpen && !value) {
        // default state if no value
        setSelectedDate(new Date());
    }
  }, [isOpen, value]);

  const handleApply = () => {
    if (activeTab === "month") {
      onChange({ type: "month", year: yearFilter, month: monthFilter });
    } else {
      if (selectedDate) {
        onChange({ type: "date", date: selectedDate });
      }
    }
    setIsOpen(false);
  };

  const renderMonthTab = () => (
    <div className="space-y-4 p-4 min-w-[280px]">
      <div className="flex items-center justify-between rounded-[10px] border border-[#E2E8F0] bg-white p-2">
        <button
          type="button"
          onClick={() => setYearFilter(String(Number(yearFilter) - 1))}
          className="w-9 h-9 flex items-center justify-center rounded-[8px] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center relative group">
          <div className="text-[10px] uppercase tracking-[0.12em] font-bold text-[#718096]">Tahun</div>
          <div className="flex items-center justify-center cursor-pointer">
            <Select value={yearFilter} onValueChange={(val) => setYearFilter(val)}>
              <SelectTrigger className="w-fit h-auto border-none bg-transparent p-0 gap-1 text-lg font-bold text-[#1A202C] focus:ring-0 shadow-none hover:bg-transparent [&>svg]:w-3.5 [&>svg]:h-3.5 [&>svg]:text-[#A0AEC0] group-hover:[&>svg]:text-[#2B6CB0] transition-colors">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent className="max-h-[250px] z-[300] bg-white">
                {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - 10 + i).map(year => (
                  <SelectItem key={year} value={String(year)} className="text-sm font-medium cursor-pointer hover:bg-gray-100">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setYearFilter(String(Number(yearFilter) + 1))}
          className="w-9 h-9 flex items-center justify-center rounded-[8px] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setMonthFilter("all")}
          className={`col-span-3 h-9 rounded-[8px] text-xs font-bold border transition-colors ${
            monthFilter === "all"
              ? "bg-[#1B3A6B] border-[#1B3A6B] text-white"
              : "bg-white border-[#E2E8F0] text-[#4A5568] hover:border-[#2B6CB0]"
          }`}
        >
          Semua Bulan
        </button>
        {MONTHS_ID.map((month, idx) => (
          <button
            key={month}
            type="button"
            onClick={() => setMonthFilter(String(idx))}
            className={`h-10 rounded-[8px] text-xs font-semibold border transition-colors ${
              monthFilter === String(idx)
                ? "bg-[#1B3A6B] border-[#1B3A6B] text-white"
                : "bg-white border-[#E2E8F0] text-[#4A5568] hover:border-[#2B6CB0] hover:text-[#1B3A6B]"
            }`}
          >
            {month.slice(0, 3)}
          </button>
        ))}
      </div>
    </div>
  );

  // Build a Set of highlighted date strings for fast lookup
  const highlightedSet = React.useMemo(() => {
    if (!highlightedDates || highlightedDates.length === 0) return new Set<string>();
    return new Set(highlightedDates.map(d => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`));
  }, [highlightedDates]);

  const renderDateTab = () => (
    <div className="p-3">
        <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={id as any}
            showOutsideDays
            defaultMonth={selectedDate ?? new Date()}
            onMonthChange={(month) => {
              if (onMonthChange) {
                onMonthChange(month.getFullYear(), month.getMonth() + 1);
              }
            }}
            modifiers={{
              hasData: (date: Date) => highlightedSet.has(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`),
            }}
            classNames={{
                months:        "flex flex-col",
                month:         "space-y-3",
                month_caption: "flex justify-center pt-1 relative items-center mb-1",
                caption_label: "text-sm font-medium",
                nav:           "flex items-center justify-between absolute w-full top-3 left-0 px-3 z-10",
                button_previous: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center rounded border border-[#E2E8F0]",
                button_next:     "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center rounded border border-[#E2E8F0]",
                month_grid:    "w-full border-collapse",
                weekdays:      "flex",
                weekday:       "text-muted-foreground w-9 font-normal text-[0.8rem] text-center",
                week:          "flex w-full mt-1",
                day:           "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day_button:    "h-9 w-9 p-0 font-normal rounded-md hover:bg-[#EBF4FF] transition-colors",
                selected:      "bg-[#1B3A6B] text-white rounded-md hover:bg-[#1B3A6B] hover:text-white",
                today:         "bg-[#EBF4FF] text-[#2B6CB0] font-bold rounded-md",
                outside:       "text-muted-foreground opacity-40",
                disabled:      "text-muted-foreground opacity-30",
                hidden:        "invisible",
            }}
            components={{
                Chevron: ({ orientation }) => {
                    const Icon = orientation === "left" ? ChevronLeft : ChevronRight
                    return <Icon className="h-4 w-4" />
                },
                DayButton: (props) => {
                    const { day, modifiers, ...buttonProps } = props;
                    const hasData = modifiers?.hasData;
                    return (
                      <button {...buttonProps}>
                        {day.date.getDate()}
                        {hasData && (
                          <span
                            className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#2B6CB0]"
                            style={{ pointerEvents: 'none' }}
                          />
                        )}
                      </button>
                    );
                },
            }}
        />
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger ? trigger : (
          <Button variant="outline">
            Pilih Periode
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[200]" align={align} sideOffset={12}>
        <div className="flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#E2E8F0]">
            <h3 className="text-sm font-bold text-[#1A202C]">Filter Periode</h3>
            <p className="text-xs text-[#718096] mt-0.5">Pilih bulan/tahun atau tanggal spesifik.</p>
            
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-[10px] bg-[#F7F8FA] p-1 border border-[#E2E8F0]">
                <button
                type="button"
                onClick={() => setActiveTab("month")}
                className={`h-9 rounded-[8px] text-xs font-bold transition-colors ${
                    activeTab === "month" ? "bg-white text-[#1B3A6B] shadow-sm" : "text-[#718096] hover:text-[#1A202C]"
                }`}
                >
                Bulan & Tahun
                </button>
                <button
                type="button"
                onClick={() => setActiveTab("date")}
                className={`h-9 rounded-[8px] text-xs font-bold transition-colors ${
                    activeTab === "date" ? "bg-white text-[#1B3A6B] shadow-sm" : "text-[#718096] hover:text-[#1A202C]"
                }`}
                >
                Tanggal Spesifik
                </button>
            </div>
          </div>

          {/* Body */}
          {activeTab === "month" ? renderMonthTab() : renderDateTab()}

          {/* Footer */}
          <div className="p-4 border-t border-[#E2E8F0] bg-[#F7F8FA] rounded-b-md flex justify-between items-center">
             <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-[#718096] hover:text-gray-900 transition-colors"
             >
                Batal
             </button>
             <button
                type="button"
                onClick={handleApply}
                className="h-9 px-4 rounded-[8px] bg-[#1B3A6B] text-white text-xs font-bold hover:bg-[#12284D] transition-colors shadow-sm"
             >
                Terapkan
             </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
