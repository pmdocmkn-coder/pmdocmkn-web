import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
  UploadCloud,
  File,
  Info,
} from "lucide-react";
import { callRecordApi } from "../services/api";
import { UploadCsvResponse } from "../types/callRecord";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";
import { MobilePageHeader } from "./ui/MobilePageHeader";

interface UploadPageProps {
  onBack: () => void;
  setActiveTab?: (tab: string) => void;
}

const UploadPage: React.FC<UploadPageProps> = ({ onBack, setActiveTab }) => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadCsvResponse | null>(null);

  useEffect(() => {
    console.log("UploadPage Mounted - Version 4.0");
  }, []);

  const handleBack = () => {
    onBack?.();
    navigate("/callrecords");
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setSelectedFile(file);
    setUploadResult(null);

    try {
      const response = await callRecordApi.importCsv(file);
      setUploadResult(response);
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.response?.data?.message || "Error uploading file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="w-full">
      {/* ==================== MOBILE VIEW (md:hidden) ==================== */}
      <div className="md:hidden bg-[#f8f5fc] min-h-screen pb-24 text-slate-900 font-sans -mt-8 -mx-6">
        <MobilePageHeader
          label="Call Records"
          title="Upload CSV"
          rightAction={
            <button
              onClick={handleBack}
              className="flex items-center justify-center rounded-xl h-9 w-9 bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg active:scale-90 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          }
        />

        <div className="px-4 space-y-4 pt-4">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-200 ${dragOver ? "border-purple-500 bg-purple-50/50" : "border-purple-200 bg-white"
              } ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
            onClick={() => !isUploading && document.getElementById("file-input-mobile")?.click()}
          >
            <input
              id="file-input-mobile"
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full border-[3px] border-purple-100 border-t-purple-600 animate-spin" />
                <p className="text-sm font-bold text-slate-700">Mengupload File...</p>
                <p className="text-[11px] text-slate-500">Memproses: {selectedFile?.name}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 flex items-center justify-center">
                  <UploadCloud className="w-10 h-10 text-purple-600" />
                </div>
                <div>
                  <p className="text-base font-black text-slate-800">Tap untuk pilih file</p>
                  <p className="text-[11px] text-slate-500 mt-1">Format CSV • Maks 100MB</p>
                </div>
                <button
                  type="button"
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-2xl text-[12px] font-bold shadow-xl shadow-purple-500/20 active:scale-95 transition-all"
                >
                  Buka File Browser
                </button>
              </div>
            )}
          </div>

          {/* Selected File Info */}
          {selectedFile && !isUploading && (
            <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <File className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-slate-800 truncate">{selectedFile.name}</p>
                <p className="text-[11px] text-slate-400 font-medium">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className={`rounded-3xl p-5 border shadow-sm ${uploadResult.records.successfulRecords > 0 ? "bg-emerald-50/50 border-emerald-100" : "bg-red-50/50 border-red-100"
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${uploadResult.records.successfulRecords > 0 ? "bg-emerald-500" : "bg-red-500"
                  }`}>
                  {uploadResult.records.successfulRecords > 0 ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <XCircle className="w-5 h-5 text-white" />
                  )}
                </div>
                <h3 className={`text-[14px] font-black ${uploadResult.records.successfulRecords > 0 ? "text-emerald-800" : "text-red-800"
                  }`}>
                  {uploadResult.records.successfulRecords > 0 ? "Upload Selesai!" : "Terjadi Kesalahan"}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-3 border border-emerald-100/50 text-center shadow-sm">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Sukses</p>
                  <p className="text-[18px] font-black text-emerald-700">{uploadResult.records.successfulRecords.toLocaleString()}</p>
                </div>
                {uploadResult.records.failedRecords > 0 && (
                  <div className="bg-white rounded-2xl p-3 border border-red-100/50 text-center shadow-sm">
                    <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Gagal</p>
                    <p className="text-[18px] font-black text-red-700">{uploadResult.records.failedRecords.toLocaleString()}</p>
                  </div>
                )}
                <div className="bg-white rounded-2xl p-3 border border-blue-100/50 text-center shadow-sm">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Total</p>
                  <p className="text-[18px] font-black text-blue-700">
                    {(uploadResult.records.successfulRecords + uploadResult.records.failedRecords).toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-slate-400 text-center font-bold">Waktu Proses: {uploadResult.totalTimeMs}ms</p>
            </div>
          )}

          {/* Guidelines */}
          <div className="bg-white rounded-3xl border border-purple-50 shadow-sm p-5">
            <h3 className="text-[13px] font-black text-slate-800 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-purple-500" />
              Aturan Upload File
            </h3>
            <div className="space-y-3.5">
              {[
                { text: "Format CSV dengan pemisah koma (,)", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
                { text: "Ukuran file maksimum 100MB", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
                { text: "Validasi otomatis saat import", icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="text-[12px] font-bold text-slate-600">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== DESKTOP VIEW (hidden md:block) ==================== */}
      <div className="hidden md:block max-w-5xl mx-auto flex-1 mt-10 md:mt-12 px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8 overflow-hidden relative">
          {/* Accent gradient */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-indigo-600" />

          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="p-3 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-2xl transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="flex-1 text-center">
              <h1 className="text-3xl font-black text-slate-900 leading-tight">Upload CSV Records</h1>
              <p className="text-slate-500 mt-2 font-medium">
                Import data call record terbaru untuk dianalisis dalam sistem
              </p>
            </div>
            <div className="w-12"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Upload Area */}
          <div className="lg:col-span-2 space-y-8">
            <div
              className={`border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-300 relative group overflow-hidden ${dragOver ? "border-purple-500 bg-purple-50" : "border-slate-200 bg-white hover:border-purple-300"
                } ${isUploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => !isUploading && document.getElementById("file-input-desktop")?.click()}
            >
              <input
                id="file-input-desktop"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {isUploading ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mb-6" />
                  <p className="text-xl font-bold text-slate-800">Sedang Mengunggah...</p>
                  <p className="text-slate-500 mt-2">Memproses {selectedFile?.name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center group-hover:transform group-hover:scale-105 transition-transform duration-300">
                  <div className="w-24 h-24 rounded-3xl bg-purple-50 flex items-center justify-center mb-6 group-hover:bg-purple-100 transition-colors">
                    <UploadCloud className="w-12 h-12 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Drag & Drop File CSV</h3>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                    Seret file Anda ke sini atau klik tombol di bawah untuk memilih file dari komputer Anda
                  </p>
                  <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 active:scale-95 transition-all">
                    Pilih File CSV
                  </button>
                </div>
              )}
            </div>

            {/* Results */}
            {uploadResult && (
              <div className={`p-8 rounded-3xl border shadow-lg ${uploadResult.records.successfulRecords > 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
                }`}>
                <h3 className={`text-xl font-black mb-6 ${uploadResult.records.successfulRecords > 0 ? "text-emerald-900" : "text-red-900"
                  }`}>
                  {uploadResult.records.successfulRecords > 0 ? "File Berhasil Diimport!" : "Hasil Import Dengan Peringatan"}
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100/50">
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Berhasil</p>
                    <p className="text-3xl font-black text-emerald-700">{uploadResult.records.successfulRecords.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100/50">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Gagal</p>
                    <p className="text-3xl font-black text-red-700">{uploadResult.records.failedRecords.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-indigo-100/50">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-3xl font-black text-indigo-700">
                      {(uploadResult.records.successfulRecords + uploadResult.records.failedRecords).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm sticky top-28">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-600" />
                Panduan Import
              </h3>
              <ul className="space-y-5">
                {[
                  { title: "Format File", text: "Gunakan ekstensi .csv", icon: CheckCircle, color: "text-emerald-500" },
                  { title: "Ukuran", text: "Maksimal size file 100MB", icon: CheckCircle, color: "text-emerald-500" },
                  { title: "Validasi", text: "Sistem akan mendeteksi baris ganda", icon: AlertCircle, color: "text-amber-500" },
                  { title: "Struktur", text: "Pastikan kolom sesuai template", icon: CheckCircle, color: "text-emerald-500" },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="mt-1">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500 font-medium">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {selectedFile && !isUploading && (
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <div className="bg-purple-50 rounded-2xl p-4 flex items-center gap-3">
                    <File className="w-6 h-6 text-purple-600" />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-purple-900 truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-purple-600/70 font-bold uppercase">SIAP IMPORT</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
