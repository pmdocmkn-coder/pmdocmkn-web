import { useState, useRef } from "react";
import {
  Upload, FileText, CheckCircle, XCircle, AlertCircle,
  ArrowLeft, UploadCloud, File, Info, Download, FileSpreadsheet,
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { MobilePageHeader } from "../ui/MobilePageHeader";
import { operationalDocumentApi, operationalDocumentTypeApi } from "../../services/operationalDocumentApi";
import { useToast } from "../../hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ImportRow {
  rowNum: number;
  name: string;
  type: string;
  referenceNumber?: string;
  validFrom: string;
  validUntil: string;
  picName?: string;
  picPhone?: string;
  fileLink?: string;
  error?: string;
  status?: "pending" | "success" | "error";
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function parseDateStr(s: string): string {
  const parts = s.includes("/") ? s.split("/") : null;
  if (parts && parts.length === 3) {
    const [d, m, y] = parts;
    return new Date(Number(y), Number(m) - 1, Number(d)).toISOString();
  }
  return new Date(s).toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
export default function OperationalDocumentImportPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputMobileRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<ImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // ── Parse file into preview rows ──────────────────────────────────────────
  const parseFile = async (file: File) => {
    setImportResult(null);
    setPreviewRows([]);
    setSelectedFile(file);

    try {
      const buffer = await file.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);

      const ws = wb.worksheets[0];
      if (!ws) {
        toast({ title: "Sheet tidak ditemukan", variant: "destructive" });
        return;
      }

      const rows: ImportRow[] = [];
      ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
        if (rowNum === 1) return; // skip header
        const get = (col: number) => String(row.getCell(col).value ?? "").trim();

        const name      = get(1);
        const type      = get(2);
        const validFrom = get(4);
        const validUntil= get(5);

        let error: string | undefined;
        if (!name)       error = "Nama dokumen wajib diisi";
        else if (!type)  error = "Tipe dokumen wajib diisi";
        else if (!validFrom)  error = "Tanggal berlaku wajib diisi";
        else if (!validUntil) error = "Tanggal berakhir wajib diisi";

        rows.push({
          rowNum,
          name,
          type,
          referenceNumber: get(3) || undefined,
          validFrom,
          validUntil,
          picName:   get(6) || undefined,
          picPhone:  get(7) || undefined,
          fileLink:  get(8) || undefined,
          error,
          status: error ? "error" : "pending",
        });
      });

      setPreviewRows(rows);
    } catch (e: any) {
      toast({ title: "Gagal membaca file", description: e.message, variant: "destructive" });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  };

  // ── Process (upload) valid rows ───────────────────────────────────────────
  const handleImport = async () => {
    const validRows = previewRows.filter(r => r.status === "pending");
    if (validRows.length === 0) return;

    setIsProcessing(true);
    const errors: string[] = [];
    const updated = [...previewRows];

    for (const r of validRows) {
      const idx = updated.findIndex(u => u.rowNum === r.rowNum);
      try {
        await operationalDocumentApi.create({
          name:            r.name,
          type:            r.type,
          referenceNumber: r.referenceNumber,
          validFrom:       parseDateStr(r.validFrom),
          validUntil:      parseDateStr(r.validUntil),
          picName:         r.picName,
          picPhone:        r.picPhone,
          fileLink:        r.fileLink,
        });
        updated[idx] = { ...r, status: "success" };
      } catch (e: any) {
        const msg = e?.response?.data?.message ?? e.message;
        updated[idx] = { ...r, status: "error", error: msg };
        errors.push(`Baris ${r.rowNum}: ${r.name} — ${msg}`);
      }
      setPreviewRows([...updated]);
    }

    setImportResult({
      total:   validRows.length,
      success: validRows.length - errors.length,
      failed:  errors.length,
      errors,
    });
    setIsProcessing(false);
    toast({ title: "Import selesai", description: `${validRows.length - errors.length} berhasil, ${errors.length} gagal` });
  };

  // ── Download template ─────────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Template Import");

    ws.columns = [
      { header: "Nama Dokumen *",    key: "name",            width: 35 },
      { header: "Tipe Dokumen *",    key: "type",            width: 22 },
      { header: "No. Referensi",     key: "referenceNumber", width: 22 },
      { header: "Tanggal Berlaku *", key: "validFrom",       width: 18 },
      { header: "Tanggal Berakhir *",key: "validUntil",      width: 18 },
      { header: "Nama PIC",          key: "picName",         width: 22 },
      { header: "No. WA PIC",        key: "picPhone",        width: 18 },
      { header: "Link Dokumen",      key: "fileLink",        width: 40 },
    ];

    const hr = ws.getRow(1);
    hr.eachCell((cell) => {
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B3A6B" } };
      cell.font      = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { vertical: "middle" };
    });
    hr.height = 28;

    ws.addRow({
      name: "Ijin Frekuensi", type: "Ijin Frekuensi", referenceNumber: "REF/001/2025",
      validFrom: "01/01/2025", validUntil: "31/12/2025",
      picName: "Nama PIC", picPhone: "628123456789", fileLink: "https://sharepoint...",
    });

    const ws2 = wb.addWorksheet("Petunjuk");
    [
      ["PETUNJUK PENGISIAN IMPORT DOKUMEN"],
      [""],
      ["Kolom Wajib (*): Nama Dokumen, Tipe Dokumen, Tanggal Berlaku, Tanggal Berakhir"],
      ["Format Tanggal: DD/MM/YYYY  (contoh: 31/12/2025)"],
      ["No. WA PIC: awali dengan 62, tanpa + atau spasi (contoh: 628123456789)"],
      ["Tipe Dokumen: harus sesuai dengan master data Operational Doc Types"],
    ].forEach(r => ws2.addRow(r));
    ws2.getCell("A1").font = { bold: true, size: 13, color: { argb: "FF1B3A6B" } };

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, "Template_Import_Monitoring_Dokumen.xlsx");
  };

  const validCount   = previewRows.filter(r => r.status === "pending").length;
  const invalidCount = previewRows.filter(r => r.status === "error").length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">

      {/* ==================== MOBILE VIEW ==================== */}
      <div className="md:hidden bg-[#F7F8FA] min-h-screen pb-28 text-[#1A202C] -mt-4 -mx-4">
        <MobilePageHeader
          label="Monitoring Dokumen"
          title="Import Excel"
          subtitle="Upload file .xlsx untuk import data"
          icon={<FileSpreadsheet className="w-5 h-5 text-[#2B6CB0]" />}
          iconBg="bg-[#EBF4FF]"
          rightAction={
            <button onClick={() => navigate("/operational-documents")}
              className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-[#F7F8FA] border border-[#E2E8F0] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          }
        />

        <div className="px-4 space-y-4 pt-4">
          {/* Upload Area Mobile */}
          <div
            className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-200 bg-white ${dragOver ? "border-[#2B6CB0] bg-[#EBF4FF]/30" : "border-[#2B6CB0]/30"} ${isProcessing ? "opacity-60 pointer-events-none" : ""}`}
            onClick={() => !isProcessing && fileInputMobileRef.current?.click()}
          >
            <input ref={fileInputMobileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-[#EBF4FF] flex items-center justify-center">
                <UploadCloud className="w-10 h-10 text-[#2B6CB0]" />
              </div>
              <div>
                <p className="text-base font-black text-slate-800">Tap untuk pilih file</p>
                <p className="text-[11px] text-slate-500 mt-1">Format .xlsx atau .xls</p>
              </div>
              <button type="button" className="bg-[#1B3A6B] text-white px-8 py-3 rounded-2xl text-[12px] font-bold shadow-xl active:scale-95 transition-all">
                Buka File Browser
              </button>
            </div>
          </div>

          {/* Template download mobile */}
          <button onClick={handleDownloadTemplate}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-[#E2E8F0] bg-white text-[13px] font-semibold text-[#4A5568] hover:bg-[#F7F8FA] transition-colors">
            <Download className="w-4 h-4 text-[#2B6CB0]" /> Download Template Excel
          </button>

          {/* Selected file info */}
          {selectedFile && (
            <div className="bg-white rounded-2xl border border-[#EBF4FF] shadow-sm p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#EBF4FF] flex items-center justify-center flex-shrink-0">
                <File className="w-6 h-6 text-[#2B6CB0]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-slate-800 truncate">{selectedFile.name}</p>
                <p className="text-[11px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB · {previewRows.length} baris data</p>
              </div>
              {previewRows.length > 0 && <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
            </div>
          )}

          {/* Preview rows mobile */}
          {previewRows.length > 0 && (
            <div className="space-y-2">
              <p className="text-[12px] font-bold text-[#4A5568] uppercase tracking-wider">
                Preview ({validCount} valid, {invalidCount} error)
              </p>
              {previewRows.map(r => (
                <div key={r.rowNum} className={`rounded-[12px] border p-3 ${r.status === "success" ? "bg-emerald-50 border-emerald-200" : r.status === "error" ? "bg-red-50 border-red-200" : "bg-white border-[#E2E8F0]"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-bold text-[#1A202C] truncate flex-1">{r.name || "—"}</p>
                    {r.status === "success" && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                    {r.status === "error"   && <XCircle    className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  </div>
                  <p className="text-[11px] text-[#718096]">{r.type} · {r.validFrom} – {r.validUntil}</p>
                  {r.error && r.status === "error" && <p className="text-[10px] text-red-600 mt-1">{r.error}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Import result mobile */}
          {importResult && (
            <div className={`rounded-3xl p-5 border ${importResult.failed === 0 ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"}`}>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-white rounded-2xl p-3 text-center border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Berhasil</p>
                  <p className="text-[20px] font-black text-emerald-700">{importResult.success}</p>
                </div>
                <div className="bg-white rounded-2xl p-3 text-center border border-red-100">
                  <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Gagal</p>
                  <p className="text-[20px] font-black text-red-700">{importResult.failed}</p>
                </div>
                <div className="bg-white rounded-2xl p-3 text-center border border-blue-100">
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Total</p>
                  <p className="text-[20px] font-black text-blue-700">{importResult.total}</p>
                </div>
              </div>
              <button onClick={() => navigate("/operational-documents")}
                className="w-full py-3 rounded-2xl bg-[#1B3A6B] text-white text-[13px] font-bold">
                Lihat Data Dokumen →
              </button>
            </div>
          )}

          {/* Process button mobile */}
          {validCount > 0 && !importResult && (
            <button onClick={handleImport} disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-[#D94F2B] text-white font-bold text-[14px] disabled:opacity-60 active:scale-95 transition-all">
              {isProcessing ? `Mengimpor... ${previewRows.filter(r => r.status === "success").length}/${validCount}` : `Import ${validCount} Dokumen`}
            </button>
          )}

          {/* Guidelines mobile */}
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-5">
            <h3 className="text-[13px] font-black text-slate-800 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-[#2B6CB0]" /> Panduan Import
            </h3>
            <div className="space-y-3">
              {[
                { text: "Gunakan file template yang sudah disediakan",      icon: CheckCircle, c: "text-emerald-500", bg: "bg-emerald-50" },
                { text: "Format tanggal: DD/MM/YYYY (31/12/2025)",          icon: CheckCircle, c: "text-emerald-500", bg: "bg-emerald-50" },
                { text: "Kolom wajib: Nama, Tipe, Tgl Berlaku, Tgl Berakhir", icon: AlertCircle, c: "text-amber-500",  bg: "bg-amber-50"  },
                { text: "Tipe dokumen harus sesuai master Operational Doc Types", icon: AlertCircle, c: "text-amber-500",  bg: "bg-amber-50"  },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                    <item.icon className={`w-4 h-4 ${item.c}`} />
                  </div>
                  <span className="text-[12px] font-bold text-slate-600">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== DESKTOP VIEW ==================== */}
      <div className="hidden md:block max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-8 mb-8 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#1B3A6B] to-[#2B6CB0]" />
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/operational-documents")}
              className="p-3 text-slate-400 hover:text-[#2B6CB0] hover:bg-[#EBF4FF] rounded-2xl transition-all">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-black text-slate-900 leading-tight">Import Dokumen Excel</h1>
              <p className="text-slate-500 mt-2 font-medium">Upload file .xlsx untuk menambahkan dokumen monitoring secara massal</p>
            </div>
            <div className="w-12" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">

          {/* Left: Upload + Preview */}
          <div className="lg:col-span-2 space-y-6">

            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-300 relative group overflow-hidden ${
                dragOver ? "border-[#2B6CB0] bg-[#EBF4FF]/30" : "border-slate-200 bg-white hover:border-[#2B6CB0]/50"
              } ${isProcessing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />
              <div className="flex flex-col items-center group-hover:scale-105 transition-transform duration-300">
                <div className="w-24 h-24 rounded-3xl bg-[#EBF4FF] flex items-center justify-center mb-6 group-hover:bg-[#2B6CB0]/20 transition-colors">
                  <UploadCloud className="w-12 h-12 text-[#2B6CB0]" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Drag & Drop File Excel</h3>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto">Seret file .xlsx ke sini, atau klik untuk memilih dari komputer Anda</p>
                <button type="button" className="bg-gradient-to-r from-[#1B3A6B] to-[#2B6CB0] text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all">
                  Pilih File Excel
                </button>
              </div>
            </div>

            {/* Selected file banner */}
            {selectedFile && (
              <div className="bg-[#EBF4FF] rounded-2xl p-4 flex items-center gap-4 border border-[#2B6CB0]/20">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 border border-[#2B6CB0]/20">
                  <FileSpreadsheet className="w-6 h-6 text-[#2B6CB0]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-[#1B3A6B] truncate">{selectedFile.name}</p>
                  <p className="text-[12px] text-[#2B6CB0]/70 font-medium">
                    {(selectedFile.size / 1024).toFixed(1)} KB · {previewRows.length} baris terdeteksi
                    {validCount > 0 && ` · ${validCount} siap import`}
                    {invalidCount > 0 && ` · ${invalidCount} error`}
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              </div>
            )}

            {/* Preview table */}
            {previewRows.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="font-bold text-[#1A202C] text-[15px]">Preview Data</h3>
                  <div className="flex items-center gap-3 text-[12px]">
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> {validCount} valid
                    </span>
                    {invalidCount > 0 && (
                      <span className="flex items-center gap-1 text-red-500 font-semibold">
                        <XCircle className="w-3.5 h-3.5" /> {invalidCount} error
                      </span>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-[13px]">
                    <thead className="bg-[#F8FAFC] sticky top-0">
                      <tr>
                        {["Baris", "Nama Dokumen", "Tipe", "Tgl Berlaku", "Tgl Berakhir", "Status"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {previewRows.map(r => (
                        <tr key={r.rowNum} className={r.status === "success" ? "bg-emerald-50" : r.status === "error" ? "bg-red-50" : "hover:bg-[#F7F8FA]"}>
                          <td className="px-4 py-3 font-mono text-[#718096]">{r.rowNum}</td>
                          <td className="px-4 py-3 font-semibold text-[#1A202C] max-w-[200px] truncate">{r.name || "—"}</td>
                          <td className="px-4 py-3 text-[#4A5568]">{r.type || "—"}</td>
                          <td className="px-4 py-3 text-[#4A5568]">{r.validFrom}</td>
                          <td className="px-4 py-3 text-[#4A5568]">{r.validUntil}</td>
                          <td className="px-4 py-3">
                            {r.status === "success" && (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                                <CheckCircle className="w-3.5 h-3.5" /> Berhasil
                              </span>
                            )}
                            {r.status === "error" && (
                              <span className="inline-flex items-center gap-1 text-red-500 font-semibold text-[11px]" title={r.error}>
                                <XCircle className="w-3.5 h-3.5" /> {r.error?.slice(0, 30)}...
                              </span>
                            )}
                            {r.status === "pending" && (
                              <span className="inline-flex items-center gap-1 text-[#2B6CB0] font-semibold text-[11px]">
                                <AlertCircle className="w-3.5 h-3.5" /> Siap
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import result */}
            {importResult && (
              <div className={`p-8 rounded-3xl border shadow-lg ${importResult.failed === 0 ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"}`}>
                <h3 className={`text-xl font-black mb-6 ${importResult.failed === 0 ? "text-emerald-900" : "text-amber-900"}`}>
                  {importResult.failed === 0 ? "🎉 Semua Dokumen Berhasil Diimport!" : "Import Selesai Dengan Beberapa Error"}
                </h3>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Berhasil</p>
                    <p className="text-3xl font-black text-emerald-700">{importResult.success}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Gagal</p>
                    <p className="text-3xl font-black text-red-700">{importResult.failed}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-3xl font-black text-blue-700">{importResult.total}</p>
                  </div>
                </div>
                <button onClick={() => navigate("/operational-documents")}
                  className="w-full py-4 rounded-2xl bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white font-bold text-[15px] transition-colors">
                  Lihat Semua Dokumen →
                </button>
              </div>
            )}

            {/* Import button */}
            {validCount > 0 && !importResult && (
              <button onClick={handleImport} disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-[#D94F2B] hover:bg-[#B83D20] text-white font-bold text-[15px] shadow-lg shadow-[#D94F2B]/20 disabled:opacity-60 active:scale-95 transition-all">
                {isProcessing
                  ? `Mengimpor... ${previewRows.filter(r => r.status === "success").length} / ${validCount}`
                  : `Import ${validCount} Dokumen`}
              </button>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-[#E2E8F0] shadow-sm sticky top-28">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-[#2B6CB0]" /> Panduan Import
              </h3>
              <ul className="space-y-5">
                {[
                  { title: "Format File",        text: "Gunakan .xlsx dari template yang tersedia",   icon: CheckCircle, color: "text-emerald-500" },
                  { title: "Format Tanggal",     text: "DD/MM/YYYY (contoh: 31/12/2025)",             icon: CheckCircle, color: "text-emerald-500" },
                  { title: "Kolom Wajib",        text: "Nama, Tipe, Tgl Berlaku, Tgl Berakhir",       icon: AlertCircle, color: "text-amber-500"  },
                  { title: "Tipe Dokumen",       text: "Harus sesuai master Operational Doc Types",   icon: AlertCircle, color: "text-amber-500"  },
                  { title: "Preview Dahulu",     text: "Cek tabel preview sebelum mulai import",       icon: CheckCircle, color: "text-emerald-500" },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <item.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${item.color}`} />
                    <div>
                      <p className="text-sm font-black text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500 font-medium">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <button onClick={handleDownloadTemplate}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-[#2B6CB0]/30 text-[#2B6CB0] font-bold text-[14px] hover:bg-[#EBF4FF] transition-colors">
                  <Download className="w-4 h-4" /> Download Template
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
