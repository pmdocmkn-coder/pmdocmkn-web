import * as React from "react"
import { format, setMonth, setYear, getMonth, getYear } from "date-fns"
import { id } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useDayPicker } from "react-day-picker"
import type { CalendarMonth } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// ─── Indonesian month names ───────────────────────────────────────────────────
const MONTHS_ID = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember",
]

// ─── Custom caption with year + month selects ─────────────────────────────────
function CustomCaption({ calendarMonth }: { calendarMonth: CalendarMonth }) {
    const { goToMonth, nextMonth, previousMonth } = useDayPicker()

    const displayMonth = calendarMonth.date
    const currentYear  = getYear(displayMonth)
    const currentMonthIdx = getMonth(displayMonth)

    const thisYear = new Date().getFullYear()
    // 2000 → 2 years forward so historical radio data (2019 etc.) is reachable
    const years = Array.from({ length: thisYear - 1999 + 2 }, (_, i) => 2000 + i)

    return (
        <div className="flex items-center justify-between gap-1 px-1 pb-1">
            {/* ← prev month */}
            <button
                type="button"
                onClick={() => previousMonth && goToMonth(previousMonth)}
                disabled={!previousMonth}
                className="h-7 w-7 flex items-center justify-center rounded border border-[#E2E8F0] bg-transparent hover:bg-[#F7F8FA] disabled:opacity-30 transition-colors flex-shrink-0"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Month select */}
            <select
                value={currentMonthIdx}
                onChange={(e) => goToMonth(setMonth(displayMonth, parseInt(e.target.value, 10)))}
                className="text-[13px] font-semibold bg-[#F7F8FA] border border-[#E2E8F0] rounded-[6px] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#2B6CB0] cursor-pointer text-[#1A202C]"
            >
                {MONTHS_ID.map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                ))}
            </select>

            {/* Year select */}
            <select
                value={currentYear}
                onChange={(e) => goToMonth(setYear(displayMonth, parseInt(e.target.value, 10)))}
                className="text-[13px] font-semibold bg-[#F7F8FA] border border-[#E2E8F0] rounded-[6px] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#2B6CB0] cursor-pointer text-[#1A202C]"
            >
                {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>

            {/* → next month */}
            <button
                type="button"
                onClick={() => nextMonth && goToMonth(nextMonth)}
                disabled={!nextMonth}
                className="h-7 w-7 flex items-center justify-center rounded border border-[#E2E8F0] bg-transparent hover:bg-[#F7F8FA] disabled:opacity-30 transition-colors flex-shrink-0"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    )
}

// ─── DatePicker ───────────────────────────────────────────────────────────────
interface DatePickerProps {
    date?: Date
    onSelect: (date: Date | undefined) => void
    placeholder?: string
    className?: string
}

export function DatePicker({ date, onSelect, placeholder = "Pilih tanggal", className }: DatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date
                        ? format(date, "dd MMMM yyyy", { locale: id })
                        : <span>{placeholder}</span>
                    }
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[200]" align="start">
                <DayPicker
                    mode="single"
                    selected={date}
                    onSelect={onSelect}
                    locale={id as any}
                    showOutsideDays
                    defaultMonth={date ?? new Date()}
                    className="p-3"
                    classNames={{
                        months:        "flex flex-col",
                        month:         "space-y-3",
                        month_caption: "mb-1",
                        caption_label: "hidden",
                        nav:           "hidden",
                        month_grid:    "w-full border-collapse",
                        weekdays:      "flex",
                        weekday:       "text-muted-foreground w-9 font-normal text-[0.8rem] text-center",
                        week:          "flex w-full mt-1",
                        day:           "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                        day_button:    "h-9 w-9 p-0 font-normal rounded-md hover:bg-[#EBF4FF] transition-colors",
                        selected:      "bg-[#1B3A6B] text-white rounded-md",
                        today:         "bg-[#EBF4FF] text-[#2B6CB0] font-bold rounded-md",
                        outside:       "text-muted-foreground opacity-40",
                        disabled:      "text-muted-foreground opacity-30",
                        hidden:        "invisible",
                    }}
                    components={{
                        MonthCaption: ({ calendarMonth }) => (
                            <CustomCaption calendarMonth={calendarMonth} />
                        ),
                    }}
                    footer={
                        <div className="flex justify-between items-center pt-2 border-t border-[#E2E8F0] mt-1">
                            <button
                                type="button"
                                onClick={() => onSelect(undefined)}
                                className="text-xs text-[#718096] hover:text-red-500 font-medium transition-colors px-1"
                            >
                                Hapus
                            </button>
                            <button
                                type="button"
                                onClick={() => onSelect(new Date())}
                                className="text-xs text-[#2B6CB0] hover:text-[#1B3A6B] font-bold transition-colors px-1"
                            >
                                Hari ini
                            </button>
                        </div>
                    }
                />
            </PopoverContent>
        </Popover>
    )
}
