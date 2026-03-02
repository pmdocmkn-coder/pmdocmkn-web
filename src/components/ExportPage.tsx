import React, { useState } from "react";
import { FileDown, ArrowLeft, Calendar, Download, FileSpreadsheet, Table, Info } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { callRecordApi } from "../services/api";
import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "./ui/MobilePageHeader";
import { DatePicker } from "./ui/date-picker";
import { format } from "date-fns";

interface ExportPageProps {
  onBack: () => void;
  setActiveTab?: (tab: string) => void;
}

// 🪶 Animasi masuk halaman
const pageVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

// 🪄 Animasi tiap kartu (muncul berurutan)
const combinedCardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.4, ease: "easeOut" },
  }),
  hover: {
    scale: 1.03,
    y: -5,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
};

const ExportPage: React.FC<ExportPageProps> = ({ onBack, setActiveTab }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // 🎯 Loading state per tombol (independen)
  const [isLoading, setIsLoading] = useState({
    dailyCsv: false,
    dailyExcel: false,
    rangeCsv: false,
    rangeExcel: false,
  });

  const handleBack = () => {
    onBack?.();
    navigate("/callrecords");
  };

  const handleExport = async (
    key: keyof typeof isLoading,
    fn: () => Promise<void>
  ) => {
    setIsLoading((prev) => ({ ...prev, [key]: true }));
    try {
      await fn();
    } finally {
      setIsLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // 🔄 Desktop spinner
  const LoadingSpinner = () => (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
      />
    </motion.div>
  );

  // Mobile spinner
  const MobileSpinner = () => (
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  );

  return (
    <div className="w-full">
      {/* ==================== MOBILE VIEW ==================== */}
      <div className="md:hidden bg-[#f8f5fc] min-h-screen pb-24 text-slate-900 font-sans">
        <MobilePageHeader
          label="Call Records"
          title="Export Data"
          rightAction={
            <button
              onClick={handleBack}
              className="flex items-center justify-center rounded-xl h-9 w-9 bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg shadow-purple-500/25 active:scale-90 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          }
        />

        <div className="px-4 space-y-4">
          {/* Single Date Export */}
          <div className="bg-white rounded-2xl border border-purple-50/80 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-slate-800">Export Tanggal Spesifik</h3>
                <p className="text-[10px] text-slate-400">Download data untuk tanggal tertentu</p>
              </div>
            </div>

            <div className="mb-3">
              <label className="text-[10px] font-extrabold text-slate-500 ml-1 uppercase tracking-wider">Pilih Tanggal</label>
              <div className="mt-1 bg-slate-50 rounded-xl border border-purple-100/60 overflow-hidden">
                <DatePicker
                  date={selectedDate ? new Date(selectedDate) : undefined}
                  onSelect={(d) => setSelectedDate(d ? format(d, 'yyyy-MM-dd') : '')}
                  className="w-full border-none shadow-none text-[12px] font-bold text-slate-700 h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleExport("dailyCsv", () => callRecordApi.exportDailyCsv(selectedDate))}
                disabled={isLoading.dailyCsv}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/15 disabled:opacity-60 active:scale-[0.97] transition-all"
              >
                {isLoading.dailyCsv ? <MobileSpinner /> : (<><Download className="w-3.5 h-3.5" />CSV</>)}
              </button>
              <button
                onClick={() => handleExport("dailyExcel", () => callRecordApi.exportDailySummaryExcel(selectedDate))}
                disabled={isLoading.dailyExcel}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/15 disabled:opacity-60 active:scale-[0.97] transition-all"
              >
                {isLoading.dailyExcel ? <MobileSpinner /> : (<><FileDown className="w-3.5 h-3.5" />Excel</>)}
              </button>
            </div>
          </div>

          {/* Date Range Export */}
          <div className="bg-white rounded-2xl border border-purple-50/80 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-slate-800">Export Rentang Tanggal</h3>
                <p className="text-[10px] text-slate-400">Download data untuk periode tertentu</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 ml-1 uppercase tracking-wider">Dari</label>
                <div className="mt-1 bg-slate-50 rounded-xl border border-purple-100/60 overflow-hidden">
                  <DatePicker
                    date={startDate ? new Date(startDate) : undefined}
                    onSelect={(d) => setStartDate(d ? format(d, 'yyyy-MM-dd') : '')}
                    className="w-full border-none shadow-none text-[12px] font-bold text-slate-700 h-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 ml-1 uppercase tracking-wider">Sampai</label>
                <div className="mt-1 bg-slate-50 rounded-xl border border-purple-100/60 overflow-hidden">
                  <DatePicker
                    date={endDate ? new Date(endDate) : undefined}
                    onSelect={(d) => setEndDate(d ? format(d, 'yyyy-MM-dd') : '')}
                    className="w-full border-none shadow-none text-[12px] font-bold text-slate-700 h-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleExport("rangeCsv", () => callRecordApi.exportCsv(startDate, endDate))}
                disabled={isLoading.rangeCsv}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/15 disabled:opacity-60 active:scale-[0.97] transition-all"
              >
                {isLoading.rangeCsv ? <MobileSpinner /> : (<><Download className="w-3.5 h-3.5" />CSV</>)}
              </button>
              <button
                onClick={() => handleExport("rangeExcel", () => callRecordApi.exportOverallSummaryExcel(startDate, endDate))}
                disabled={isLoading.rangeExcel}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/15 disabled:opacity-60 active:scale-[0.97] transition-all"
              >
                {isLoading.rangeExcel ? <MobileSpinner /> : (<><FileDown className="w-3.5 h-3.5" />Excel</>)}
              </button>
            </div>
          </div>

          {/* Export Info */}
          <div className="bg-white rounded-2xl border border-purple-50/80 shadow-[0_1px_8px_rgba(0,0,0,0.03)] p-4">
            <h3 className="text-[12px] font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-purple-500" />
              Informasi Export
            </h3>
            <div className="space-y-3">
              <div className="bg-emerald-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Table className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700">CSV Export</span>
                </div>
                <ul className="space-y-0.5 ml-8">
                  <li className="text-[10px] text-emerald-600">• Data call record mentah</li>
                  <li className="text-[10px] text-emerald-600">• Semua kolom database</li>
                  <li className="text-[10px] text-emerald-600">• Untuk analisis data eksternal</li>
                </ul>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileSpreadsheet className="w-3 h-3 text-purple-600" />
                  </div>
                  <span className="text-[11px] font-bold text-purple-700">Excel Export</span>
                </div>
                <ul className="space-y-0.5 ml-8">
                  <li className="text-[10px] text-purple-600">• Laporan summary terformat</li>
                  <li className="text-[10px] text-purple-600">• Termasuk statistik &amp; chart</li>
                  <li className="text-[10px] text-purple-600">• Untuk presentasi &amp; laporan</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== DESKTOP VIEW ==================== */}
      <motion.div
        className="hidden md:block max-w-5xl mx-auto flex-1 mt-10 md:mt-12 px-4"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8 overflow-hidden relative"
          variants={combinedCardVariants}
          custom={0}
          initial="hidden"
          animate="visible"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-indigo-600" />
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="p-3 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-2xl transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-black text-slate-900 leading-tight">Export Data Call Record</h1>
              <p className="text-slate-500 mt-2 font-medium">
                Download data call record dalam format CSV atau Excel
              </p>
            </div>
            <div className="w-12" />
          </div>
        </motion.div>

        {/* Main Grid: 2/3 + 1/3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Left: Export Cards */}
          <div className="lg:col-span-2 space-y-6">

            {/* Card: Tanggal Spesifik */}
            <motion.div
              className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8"
              variants={combinedCardVariants}
              custom={1}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Export Tanggal Spesifik</h3>
                  <p className="text-xs text-slate-400 font-medium">Download data untuk satu tanggal tertentu</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                  Pilih Tanggal
                </label>
                <DatePicker
                  date={selectedDate ? new Date(selectedDate) : undefined}
                  onSelect={(d) => setSelectedDate(d ? format(d, 'yyyy-MM-dd') : '')}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleExport("dailyCsv", () => callRecordApi.exportDailyCsv(selectedDate))}
                  disabled={isLoading.dailyCsv}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 disabled:opacity-60 active:scale-95 transition-all relative overflow-hidden"
                >
                  {isLoading.dailyCsv ? <LoadingSpinner /> : (<><Download className="w-4 h-4" />Download CSV</>)}
                </button>
                <button
                  onClick={() => handleExport("dailyExcel", () => callRecordApi.exportDailySummaryExcel(selectedDate))}
                  disabled={isLoading.dailyExcel}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-60 active:scale-95 transition-all relative overflow-hidden"
                >
                  {isLoading.dailyExcel ? <LoadingSpinner /> : (<><FileDown className="w-4 h-4" />Download Excel</>)}
                </button>
              </div>
            </motion.div>

            {/* Card: Rentang Tanggal */}
            <motion.div
              className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8"
              variants={combinedCardVariants}
              custom={2}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Export Rentang Tanggal</h3>
                  <p className="text-xs text-slate-400 font-medium">Download data untuk periode / rentang waktu tertentu</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                    Dari Tanggal
                  </label>
                  <DatePicker
                    date={startDate ? new Date(startDate) : undefined}
                    onSelect={(d) => setStartDate(d ? format(d, 'yyyy-MM-dd') : '')}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                    Sampai Tanggal
                  </label>
                  <DatePicker
                    date={endDate ? new Date(endDate) : undefined}
                    onSelect={(d) => setEndDate(d ? format(d, 'yyyy-MM-dd') : '')}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleExport("rangeCsv", () => callRecordApi.exportCsv(startDate, endDate))}
                  disabled={isLoading.rangeCsv}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 disabled:opacity-60 active:scale-95 transition-all relative overflow-hidden"
                >
                  {isLoading.rangeCsv ? <LoadingSpinner /> : (<><Download className="w-4 h-4" />Download CSV</>)}
                </button>
                <button
                  onClick={() => handleExport("rangeExcel", () => callRecordApi.exportOverallSummaryExcel(startDate, endDate))}
                  disabled={isLoading.rangeExcel}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-60 active:scale-95 transition-all relative overflow-hidden"
                >
                  {isLoading.rangeExcel ? <LoadingSpinner /> : (<><FileDown className="w-4 h-4" />Download Excel</>)}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right: Info Sidebar */}
          <div>
            <motion.div
              className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm sticky top-28"
              variants={combinedCardVariants}
              custom={3}
              initial="hidden"
              animate="visible"
            >
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <Info className="w-6 h-6 text-purple-600" />
                Panduan Export
              </h3>

              {/* CSV */}
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Table className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-sm font-black text-slate-800">CSV Export</p>
                </div>
                <ul className="space-y-2 ml-12">
                  {["Data call record mentah", "Semua kolom dari database", "Ideal untuk analisis eksternal"].map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                      <span className="text-xs text-slate-500 font-medium">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Excel */}
              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-sm font-black text-slate-800">Excel Export</p>
                </div>
                <ul className="space-y-2 ml-12">
                  {["Laporan summary terformat rapi", "Termasuk statistik & chart", "Ideal untuk presentasi & laporan"].map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                      <span className="text-xs text-slate-500 font-medium">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tip */}
              <div className="border-t border-slate-100 pt-5 mt-5">
                <div className="bg-amber-50 rounded-2xl p-4 flex items-start gap-3">
                  <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    File akan otomatis terunduh ke folder{" "}
                    <span className="font-black">Downloads</span> browser Anda
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExportPage;
