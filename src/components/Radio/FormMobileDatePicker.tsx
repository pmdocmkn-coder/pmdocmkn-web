import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import { id as localeId } from "react-day-picker/locale";
import { createPortal } from "react-dom";
import "react-day-picker/style.css";

interface FormMobileDatePickerProps {
  date?: Date;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
}

export function FormMobileDatePicker({ date, onSelect, placeholder = "Pilih tanggal" }: FormMobileDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(date);

  useEffect(() => {
    if (open) {
      setTempDate(date);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open, date]);

  const modal = open
    ? createPortal(
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 z-[200] backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] bg-white rounded-2xl shadow-2xl border border-purple-100 p-4 w-[90%] max-w-[360px] max-h-[85vh] overflow-y-auto flex flex-col">
            {/* Header dengan tombol X */}
            <div className="flex items-center justify-between mb-1 shrink-0">
              <span className="text-sm font-semibold text-gray-700">Pilih Tanggal</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Tutup"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="flex justify-center">
                <DayPicker
                  mode="single"
                  selected={tempDate}
                  onSelect={(d) => setTempDate(d)}
                  locale={localeId}
                  showOutsideDays
                />
              </div>
            </div>
            {/* Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-2 text-sm bg-white shrink-0">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setTempDate(undefined);
                    onSelect(undefined);
                    setOpen(false);
                  }}
                  className="text-gray-400 hover:text-red-500 font-medium transition-colors"
                >
                  Hapus
                </button>
                <button
                  type="button"
                  onClick={() => setTempDate(new Date())}
                  className="text-violet-600 font-bold hover:text-violet-800 transition-colors"
                >
                  Hari ini
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelect(tempDate);
                  setOpen(false);
                }}
                className="bg-violet-600 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-violet-700 transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        </>,
        document.body
      )
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full h-10 flex items-center gap-2 px-3 rounded-lg border bg-white text-sm shadow-sm transition-all cursor-pointer select-none border-gray-200 hover:border-gray-300 hover:shadow`}
      >
        <CalendarIcon className="w-4 h-4 text-gray-500 shrink-0" />
        <span className={`truncate text-left ${date ? "text-gray-800 font-medium" : "text-gray-400"}`}>
          {date ? format(date, "PPP", { locale: id }) : placeholder}
        </span>
      </button>

      {modal}
    </>
  );
}
