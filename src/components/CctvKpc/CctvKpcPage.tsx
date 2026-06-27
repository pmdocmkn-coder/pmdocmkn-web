import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, cubicBezier, Variants } from "framer-motion";
import { hasPermission } from "../../utils/permissionUtils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Search, Plus, MoreVertical, Trash2, Edit2, Upload, Download,
  Filter, X, ChevronDown, ChevronUp, RotateCcw, Video, AlertTriangle,
  ShieldAlert, ShieldCheck, Wifi, MapPin, Home, Check,
} from "lucide-react";
import { cctvKpcApi, CctvKpcDto, CreateCctvKpcDto } from "../../services/cctvKpcApi";
import { useToast } from "../../hooks/use-toast";
import { FilterSelect } from "../Radio/FilterSelect";
import { FormMobileSelect } from "../Radio/FormMobileSelect";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ─── Animation Variants ──────────────────────────────────────────────────────
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: cubicBezier(0.25, 0.46, 0.45, 0.94) } },
};
const cardHoverVariants: Variants = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.03, y: -4, transition: { type: "spring", stiffness: 400, damping: 12 } },
};
const filterPanelVariants: Variants = {
  open: { height: "auto", opacity: 1, transition: { duration: 0.3, ease: cubicBezier(0.25, 0.46, 0.45, 0.94) } },
  closed: { height: 0, opacity: 0, transition: { duration: 0.25, ease: cubicBezier(0.55, 0, 1, 0.45) } },
};

// ─── Severity Badge ───────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { cls: string; icon: JSX.Element; label: string }> = {
    High: {
      cls: "bg-red-100 text-red-700 border-red-300",
      icon: <ShieldAlert className="w-3 h-3" />,
      label: "High",
    },
    Medium: {
      cls: "bg-amber-100 text-amber-700 border-amber-300",
      icon: <AlertTriangle className="w-3 h-3" />,
      label: "Medium",
    },
    Low: {
      cls: "bg-emerald-100 text-emerald-700 border-emerald-300",
      icon: <ShieldCheck className="w-3 h-3" />,
      label: "Low",
    },
  };
  const s = map[severity] ?? map["Low"];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}

// ─── Row severity color ───────────────────────────────────────────────────────
function rowBgBySeverity(severity: string) {
  if (severity === "High") return "bg-red-50/60 hover:bg-red-100/60";
  if (severity === "Medium") return "bg-amber-50/60 hover:bg-amber-100/60";
  return "hover:bg-gray-50";
}

// ─── Default form ─────────────────────────────────────────────────────────────
const defaultForm = (): CreateCctvKpcDto => ({
  severity: "Low",
  camera: "",
  ipCamera: "",
  model: "",
  brand: "",
  explicitLocation: "",
  fotoKoordinat: "",
  remarks: "",
  isActive: true,
});

// ─── Parse response helper ────────────────────────────────────────────────────
function parseCctvResponse(raw: any) {
  const items: CctvKpcDto[] = Array.isArray(raw?.data) ? raw.data : [];
  const pagination = raw?.meta?.pagination;
  return {
    items,
    totalCount: pagination?.totalCount ?? items.length,
    totalPages: pagination?.totalPages ?? 1,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CctvKpcPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── State ──────────────────────────────────────────────────────────────────
  const [data, setData] = useState<CctvKpcDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageBeforeSearch, setPageBeforeSearch] = useState(1);
  const PAGE_SIZE = 10;

  // ── Filter ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterActive, setFilterActive] = useState<string>("");
  const [filterLocation, setFilterLocation] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // ── Options ────────────────────────────────────────────────────────────────
  const [allOptions, setAllOptions] = useState<CctvKpcDto[]>([]);

  // ── Modal ──────────────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selected, setSelected] = useState<CctvKpcDto | null>(null);
  const [formData, setFormData] = useState<CreateCctvKpcDto>(defaultForm());
  const [formError, setFormError] = useState<string | null>(null);

  // ── Import state ───────────────────────────────────────────────────────────
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [importCount, setImportCount] = useState(0);
  const [importError, setImportError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // ── Load options (unpaged) ─────────────────────────────────────────────────
  useEffect(() => {
    cctvKpcApi.getAllUnpaged()
      .then((r) => setAllOptions(Array.isArray(r.data?.data) ? r.data.data : []))
      .catch(() => {});
  }, []);

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => { loadData(); }, [page, search, filterSeverity, filterBrand, filterActive, filterLocation]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await cctvKpcApi.getAll({
        page, pageSize: PAGE_SIZE,
        search: search || undefined,
        severity: filterSeverity || undefined,
        brand: filterBrand || undefined,
        isActive: filterActive === "" ? undefined : filterActive === "Aktif",
        explicitLocation: filterLocation || undefined,
      });
      const { items, totalCount: tc, totalPages: tp } = parseCctvResponse(res.data);
      setData(items);
      setTotalCount(tc);
      setTotalPages(tp);
    } catch {
      toast({ title: "Error", description: "Gagal memuat data CCTV", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setFormError(null);
    try {
      await cctvKpcApi.create(formData);
      toast({ title: "Berhasil", description: "CCTV berhasil ditambahkan" });
      setIsCreateOpen(false);
      setFormData(defaultForm());
      loadData();
      cctvKpcApi.getAllUnpaged().then((r) => setAllOptions(Array.isArray(r.data?.data) ? r.data.data : []));
    } catch (e: any) {
      setFormError(e.response?.data?.message || "Gagal menambahkan CCTV");
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setFormError(null);
    try {
      await cctvKpcApi.update(selected.id, formData);
      toast({ title: "Berhasil", description: "CCTV berhasil diperbarui" });
      setIsEditOpen(false);
      setFormData(defaultForm());
      loadData();
    } catch (e: any) {
      setFormError(e.response?.data?.message || "Gagal memperbarui CCTV");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Yakin ingin menghapus data CCTV ini?")) return;
    try {
      await cctvKpcApi.delete(id);
      toast({ title: "Berhasil", description: "CCTV berhasil dihapus" });
      loadData();
    } catch {
      toast({ title: "Error", description: "Gagal menghapus CCTV", variant: "destructive" });
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("PERINGATAN: Yakin ingin menghapus SEMUA data CCTV KPC? Tindakan ini tidak dapat dibatalkan!")) return;
    try {
      await cctvKpcApi.deleteAll();
      toast({ title: "Berhasil", description: "Semua data CCTV KPC berhasil dihapus" });
      loadData();
    } catch {
      toast({ title: "Error", description: "Gagal menghapus semua data CCTV", variant: "destructive" });
    }
  };

  const openEdit = (item: CctvKpcDto) => {
    setSelected(item);
    setFormData({
      severity: item.severity,
      camera: item.camera,
      ipCamera: item.ipCamera || "",
      model: item.model || "",
      brand: item.brand || "",
      explicitLocation: item.explicitLocation || "",
      fotoKoordinat: item.fotoKoordinat || "",
      remarks: item.remarks || "",
      isActive: item.isActive,
    });
    setIsEditOpen(true);
  };

  // ── Filter options ─────────────────────────────────────────────────────────
  const brandOptions = useMemo(
    () => Array.from(new Set(allOptions.map((d) => d.brand).filter(Boolean))).sort() as string[],
    [allOptions]
  );

  const locationOptions = useMemo(
    () => Array.from(new Set(allOptions.map((d) => d.explicitLocation).filter(Boolean))).sort() as string[],
    [allOptions]
  );

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (search) c++;
    if (filterSeverity) c++;
    if (filterBrand) c++;
    if (filterActive !== "") c++;
    if (filterLocation) c++;
    return c;
  }, [search, filterSeverity, filterBrand, filterActive, filterLocation]);

  const resetFilters = () => {
    setSearch(""); setFilterSeverity(""); setFilterBrand(""); setFilterActive(""); setFilterLocation(""); setPage(1);
  };

  // ── Stat counts ────────────────────────────────────────────────────────────
  const highCount = useMemo(() => allOptions.filter((d) => d.severity === "High").length, [allOptions]);
  const mediumCount = useMemo(() => allOptions.filter((d) => d.severity === "Medium").length, [allOptions]);
  const lowCount = useMemo(() => allOptions.filter((d) => d.severity === "Low").length, [allOptions]);

  // ── Export Excel (frontend-only, pakai exceljs) ───────────────────────────
  const handleExport = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("CCTV KPC");

    // Header row
    ws.columns = [
      { header: "NO", key: "no", width: 5 },
      { header: "Severity", key: "severity", width: 10 },
      { header: "Camera", key: "camera", width: 25 },
      { header: "IP Camera", key: "ipCamera", width: 16 },
      { header: "Model", key: "model", width: 22 },
      { header: "Brand", key: "brand", width: 15 },
      { header: "Explicit Location", key: "explicitLocation", width: 35 },
      { header: "Foto Koordinat", key: "fotoKoordinat", width: 30 },
      { header: "Remarks", key: "remarks", width: 25 },
      { header: "Status", key: "status", width: 10 },
    ];

    // Style header
    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = { bottom: { style: "thin", color: { argb: "FF94A3B8" } } };
    });
    ws.getRow(1).height = 22;

    // Data rows
    allOptions.forEach((item, i) => {
      const row = ws.addRow({
        no: i + 1,
        severity: item.severity,
        camera: item.camera,
        ipCamera: item.ipCamera || "",
        model: item.model || "",
        brand: item.brand || "",
        explicitLocation: item.explicitLocation || "",
        fotoKoordinat: item.fotoKoordinat || "",
        remarks: item.remarks || "",
        status: item.isActive ? "Aktif" : "Nonaktif",
      });

      if (item.fotoKoordinat && item.fotoKoordinat.startsWith('http')) {
        const fotoCell = row.getCell('fotoKoordinat');
        fotoCell.value = { text: item.fotoKoordinat, hyperlink: item.fotoKoordinat };
        fotoCell.font = { color: { argb: 'FF0563C1' }, underline: true };
      }

      // Color by severity
      const severityColor =
        item.severity === "High" ? "FFFFF1F2" :
        item.severity === "Medium" ? "FFFFFBEB" : "FFF0FDF4";

      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: severityColor } };
        cell.alignment = { vertical: "middle" };
      });
    });

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `CCTV_KPC_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast({ title: "Export Berhasil", description: `${allOptions.length} data CCTV berhasil diekspor` });
  };

  // ── Import Excel (frontend-only, pakai exceljs) ────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      toast({ title: "Format tidak valid", description: "Hanya file .xlsx atau .xls yang diterima", variant: "destructive" });
      return;
    }
    setImportFile(file);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportStatus("loading");
    setImportError("");
    try {
      const buf = await importFile.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buf);
      const ws = wb.worksheets[0];

      // Build header map from row 1 — normalize: lowercase, trim, hapus spasi/slash/underscore
      const headerMap: Record<string, number> = {};
      ws.getRow(1).eachCell((cell, colNum) => {
        const raw = String(cell.value || "").trim();
        // Simpan versi asli (lowercase)
        headerMap[raw.toLowerCase()] = colNum;
        // Simpan versi normalized (hapus spasi, slash, underscore)
        const normalized = raw.toLowerCase().replace(/[\s/_\-]/g, "");
        headerMap[normalized] = colNum;
      });

      const getVal = (row: ExcelJS.Row, keys: string[]) => {
        for (const k of keys) {
          let col = headerMap[k.toLowerCase()];
          if (!col) col = headerMap[k.toLowerCase().replace(/[\s/_\-]/g, "")];
          if (col) {
            let v = row.getCell(col).value;
            if (v !== null && v !== undefined) {
              if (typeof v === 'object') {
                if ('hyperlink' in v) {
                  v = (v as any).hyperlink;
                } else if ('text' in v) {
                  v = (v as any).text;
                } else if ('richText' in v && Array.isArray((v as any).richText)) {
                  v = (v as any).richText.map((rt: any) => rt.text).join("");
                }
              }
              return String(v).trim();
            }
          }
        }
        return "";
      };

      // Kumpulkan semua baris valid dulu
      const dtos: CreateCctvKpcDto[] = [];
      for (let r = 2; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        const camera = getVal(row, ["camera", "Camera", "CAMERA"]);
        if (!camera) continue;

        dtos.push({
          severity: getVal(row, ["severity", "Severity", "SEVERITY"]) || "Low",
          camera,
          ipCamera: getVal(row, ["ip camera", "IP Camera", "ip_camera", "IpCamera", "ipcamera"]),
          model: getVal(row, ["model", "Model", "MODEL"]),
          brand: getVal(row, ["brand", "Brand", "BRAND"]),
          explicitLocation: getVal(row, [
            "explicit location",
            "Explicit Location",
            "ExplicitLocation",
            "explicitlocation",
            "location",
            "lokasi",
          ]),
          fotoKoordinat: getVal(row, [
            "foto / koordinat",
            "Foto / Koordinat",
            "foto koordinat",
            "Foto Koordinat",
            "FotoKoordinat",
            "foto_koordinat",
            "foto/koordinat",
            "fotokoordinat",
            "koordinat",
            "Koordinat",
          ]),
          remarks: getVal(row, ["remarks", "Remarks", "REMARKS", "keterangan", "Keterangan"]),
          isActive: true,
        });
      }

      if (dtos.length === 0) {
        setImportStatus("error");
        setImportError("Tidak ada data valid yang ditemukan. Pastikan kolom 'Camera' terisi.");
        return;
      }

      // Kirim ke backend — batch 10 sekaligus agar tidak terlalu lambat
      const BATCH = 10;
      let count = 0;
      for (let i = 0; i < dtos.length; i += BATCH) {
        const batch = dtos.slice(i, i + BATCH);
        await Promise.all(batch.map((dto) => cctvKpcApi.create(dto)));
        count += batch.length;
      }

      setImportCount(count);
      setImportStatus("done");
      loadData();
      cctvKpcApi.getAllUnpaged().then((r) => setAllOptions(Array.isArray(r.data?.data) ? r.data.data : []));
    } catch (e: any) {
      setImportStatus("error");
      setImportError(e.response?.data?.message || e.message || "Gagal mengimpor data");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="p-4 md:p-6 space-y-6">

      {/* ====== MOBILE INTEGRATED HEADER ====== */}
      <div className="md:hidden bg-white rounded-[14px] border border-[#E2E8F0] shadow-sm mb-4">
        <div className="flex items-start gap-4 p-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#EBF4FF] flex items-center justify-center flex-shrink-0">
            <Video className="w-5 h-5 text-[#2B6CB0]" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#2B6CB0] tracking-[0.1em] uppercase mb-0.5">Monitoring</p>
            <h1 className="text-[20px] font-bold text-[#1A202C] leading-tight">CCTV KPC</h1>
            <p className="text-[12px] text-[#718096] mt-0.5">Manajemen aset CCTV KPC</p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-[#F7F8FA] border border-[#E2E8F0] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors flex-shrink-0"
          >
            <Home className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Page Header (Desktop) ── */}
      <motion.div variants={itemVariants} className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Video className="w-6 h-6 text-slate-600" />
            CCTV KPC
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manajemen aset CCTV KPC perusahaan</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPermission("cctv.kpc.delete.all") && (
            <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
              <Trash2 className="w-4 h-4 mr-1.5" />Delete All
            </Button>
          )}
          {hasPermission("cctv.kpc.view") && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1.5" />Export
            </Button>
          )}
          {hasPermission("cctv.kpc.create") && (
            <Button variant="outline" size="sm" onClick={() => { setIsImportOpen(true); setImportStatus("idle"); setImportFile(null); setIsDragging(false); }}>
              <Upload className="w-4 h-4 mr-1.5" />Import
            </Button>
          )}
          {hasPermission("cctv.kpc.create") && (
            <Button size="sm" onClick={() => { setFormData(defaultForm()); setIsCreateOpen(true); }}
              className="bg-slate-700 hover:bg-slate-800 text-white">
              <Plus className="w-4 h-4 mr-1.5" />Tambah
            </Button>
          )}
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total */}
        <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-3.5 md:p-5 shadow-sm text-white bg-gradient-to-br from-[#475569] to-[#334155] cursor-default">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-3 md:gap-4">
            <div className="flex items-start justify-between">
              <span className="text-xs md:text-sm font-semibold opacity-90 tracking-wide">Total CCTV</span>
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Video className="w-3.5 h-3.5 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl md:text-3xl font-bold tracking-tight leading-none">{totalCount.toLocaleString()}</p>
              <p className="text-[10px] md:text-xs opacity-80 font-medium">hal {page}/{totalPages}</p>
            </div>
          </div>
        </motion.div>

        {/* High */}
        <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-3.5 md:p-5 shadow-sm text-white bg-gradient-to-br from-[#ef4444] to-[#b91c1c] cursor-default">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-3 md:gap-4">
            <div className="flex items-start justify-between">
              <span className="text-xs md:text-sm font-semibold opacity-90 tracking-wide">High</span>
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <ShieldAlert className="w-3.5 h-3.5 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl md:text-3xl font-bold tracking-tight leading-none">{highCount}</p>
              <p className="text-[10px] md:text-xs opacity-80 font-medium">severity tinggi</p>
            </div>
          </div>
        </motion.div>

        {/* Medium */}
        <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-3.5 md:p-5 shadow-sm text-white bg-gradient-to-br from-[#f59e0b] to-[#c2410c] cursor-default">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-3 md:gap-4">
            <div className="flex items-start justify-between">
              <span className="text-xs md:text-sm font-semibold opacity-90 tracking-wide">Medium</span>
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <AlertTriangle className="w-3.5 h-3.5 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl md:text-3xl font-bold tracking-tight leading-none">{mediumCount}</p>
              <p className="text-[10px] md:text-xs opacity-80 font-medium">severity sedang</p>
            </div>
          </div>
        </motion.div>

        {/* Low */}
        <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-3.5 md:p-5 shadow-sm text-white bg-gradient-to-br from-[#10b981] to-[#047857] cursor-default">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-3 md:gap-4">
            <div className="flex items-start justify-between">
              <span className="text-xs md:text-sm font-semibold opacity-90 tracking-wide">Low</span>
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <ShieldCheck className="w-3.5 h-3.5 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl md:text-3xl font-bold tracking-tight leading-none">{lowCount}</p>
              <p className="text-[10px] md:text-xs opacity-80 font-medium">severity rendah</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Mobile Filter ── */}
      <div className="md:hidden flex flex-col gap-3 bg-[#f8fafc] p-4 rounded-xl mb-4 border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input placeholder="Cari nama kamera, IP, lokasi..." value={search} onChange={(e) => { const v = e.target.value; if (v && !search) setPageBeforeSearch(page); setSearch(v); setPage(v ? 1 : pageBeforeSearch); }} className="pl-10 pr-4 py-2.5 h-10 border-none rounded-xl focus:ring-2 focus:ring-slate-500 text-sm bg-slate-100 text-gray-900 placeholder-slate-400" />
        </div>
        <div className="flex flex-wrap gap-2 relative z-30 pb-1">
          <div className="relative shrink-0">
            <button onClick={() => document.getElementById("mobile-dropdown-severity")?.classList.remove("hidden")} className="flex items-center justify-between h-8 rounded-lg bg-slate-100 px-3 text-gray-800 text-xs font-medium select-none min-w-[90px]">
              <span className="truncate max-w-[100px]">{filterSeverity || "Severity"}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>
          </div>
          <div className="relative shrink-0">
            <button onClick={() => document.getElementById("mobile-dropdown-brand")?.classList.remove("hidden")} className="flex items-center justify-between h-8 rounded-lg bg-slate-100 px-3 text-gray-800 text-xs font-medium select-none min-w-[90px]">
              <span className="truncate max-w-[100px]">{filterBrand || "Brand"}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>
          </div>
          <div className="relative shrink-0">
            <button onClick={() => document.getElementById("mobile-dropdown-active")?.classList.remove("hidden")} className="flex items-center justify-between h-8 rounded-lg bg-slate-100 px-3 text-gray-800 text-xs font-medium select-none min-w-[90px]">
              <span className="truncate max-w-[100px]">{filterActive === "true" ? "Aktif" : filterActive === "false" ? "Nonaktif" : "Status"}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter Panel (Desktop) ── */}
      <motion.div variants={itemVariants} className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm">
        <button onClick={() => setIsFilterOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/80 transition-colors rounded-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-100 rounded-lg"><Filter className="w-4 h-4 text-slate-600" /></div>
            <span className="font-semibold text-gray-800 text-sm">Filter &amp; Pencarian</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-slate-700 text-white text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button onClick={(e) => { e.stopPropagation(); resetFilters(); }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50">
                <RotateCcw className="w-3 h-3" />Reset
              </button>
            )}
            {isFilterOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {isFilterOpen && (
            <motion.div key="filter-body" variants={filterPanelVariants} initial="closed" animate="open" exit="closed" style={{ overflow: "hidden" }}>
              <div className="px-5 pt-1 pb-5 border-t border-gray-100 space-y-4">
                {/* Search */}
                <div className="pt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input placeholder="Cari nama kamera, IP, model, lokasi..."
                      className="pl-9 h-9 text-sm border-gray-200 focus:border-slate-400"
                      value={search} onChange={(e) => { const v = e.target.value; if (v && !search) setPageBeforeSearch(page); setSearch(v); setPage(v ? 1 : pageBeforeSearch); }} />
                  </div>
                </div>

                {/* Filter dropdowns — pakai FilterSelect seperti Radio Management */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  <FilterSelect
                    value={filterSeverity}
                    onChange={(v) => { setFilterSeverity(v); }}
                    options={["High", "Medium", "Low"]}
                    placeholder="Semua Severity"
                    color="violet"
                  />
                  <FilterSelect
                    value={filterBrand}
                    onChange={(v) => { setFilterBrand(v); }}
                    options={brandOptions}
                    placeholder="Semua Brand"
                    color="violet"
                  />
                  <FilterSelect
                    value={filterActive}
                    onChange={(v) => { setFilterActive(v); }}
                    options={["Aktif", "Nonaktif"]}
                    placeholder="Semua Status"
                    color="violet"
                  />
                  <FilterSelect
                    value={filterLocation}
                    onChange={(v) => { setFilterLocation(v); }}
                    options={locationOptions}
                    placeholder="Semua Lokasi"
                    color="violet"
                  />
                </div>

                {/* Active filter chips */}
                {activeFilterCount > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    {[
                      { val: search, label: `Cari: "${search}"`, clear: () => setSearch(""), color: "bg-slate-100 text-slate-700" },
                      { val: filterSeverity, label: `Severity: ${filterSeverity}`, clear: () => setFilterSeverity(""), color: filterSeverity === "High" ? "bg-red-100 text-red-700" : filterSeverity === "Medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700" },
                      { val: filterBrand, label: `Brand: ${filterBrand}`, clear: () => setFilterBrand(""), color: "bg-blue-100 text-blue-700" },
                      { val: filterActive, label: `Status: ${filterActive}`, clear: () => setFilterActive(""), color: "bg-violet-100 text-violet-700" },
                      { val: filterLocation, label: `Lokasi: ${filterLocation}`, clear: () => setFilterLocation(""), color: "bg-teal-100 text-teal-700" },
                    ].filter((f) => f.val).map((f, i) => (
                      <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${f.color}`}>
                        {f.label}
                        <button onClick={f.clear} className="ml-0.5 hover:opacity-70"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Data Table (Desktop only) ── */}
      <motion.div variants={itemVariants} className="hidden md:block rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap w-12">NO</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Severity</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Camera</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">IP Camera</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Model</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Brand</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Explicit Location</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Foto / Koordinat</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Status</th>
                {(hasPermission("cctv.kpc.update") || hasPermission("cctv.kpc.delete")) && (
                  <th className="font-semibold text-gray-600 py-3 px-4 text-right whitespace-nowrap">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600" />
                    <span className="text-sm text-muted-foreground">Memuat data...</span>
                  </div>
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Video className="w-10 h-10 opacity-20" />
                    <span className="text-sm">Tidak ada data yang ditemukan</span>
                  </div>
                </td></tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={item.id} className={`border-b border-gray-100 transition-colors ${rowBgBySeverity(item.severity)}`}>
                    <td className="py-3 px-4 text-gray-500 text-xs">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="py-3 px-4 whitespace-nowrap"><SeverityBadge severity={item.severity} /></td>
                    <td className="py-3 px-4 font-medium whitespace-nowrap">{item.camera}</td>
                    <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                      {item.ipCamera ? (
                        <span className="inline-flex items-center gap-1 text-blue-600">
                          <Wifi className="w-3 h-3" />{item.ipCamera}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{item.model || "-"}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{item.brand || "-"}</td>
                    <td className="py-3 px-4 max-w-[200px] truncate" title={item.explicitLocation || undefined}>
                      {item.explicitLocation ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          {item.explicitLocation}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="py-3 px-4 max-w-[150px] truncate text-xs text-gray-500" title={item.fotoKoordinat || undefined}>
                      {item.fotoKoordinat ? (
                        item.fotoKoordinat.startsWith('http') ? (
                          <a href={item.fotoKoordinat} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            {item.fotoKoordinat}
                          </a>
                        ) : (
                          item.fotoKoordinat
                        )
                      ) : "-"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold">Aktif</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 text-xs font-semibold">Nonaktif</span>
                      )}
                    </td>
                    {(hasPermission("cctv.kpc.update") || hasPermission("cctv.kpc.delete")) && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-7 w-7 p-0 inline-flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {hasPermission("cctv.kpc.update") && (
                              <DropdownMenuItem onClick={() => openEdit(item)}>
                                <Edit2 className="mr-2 h-4 w-4" />Edit
                              </DropdownMenuItem>
                            )}
                            {hasPermission("cctv.kpc.delete") && (
                              <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={() => handleDelete(item.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />Hapus
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Mobile Card View ── */}
      <div className="md:hidden flex flex-col gap-3 mt-4">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div></div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm flex flex-col items-center gap-2">
            <Video className="w-10 h-10 opacity-20" />
            <span className="text-sm">Tidak ada data yang ditemukan</span>
          </div>
        ) : data.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <SeverityBadge severity={item.severity} />
              {item.isActive ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold">AKTIF</span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-bold">NONAKTIF</span>
              )}
            </div>
            <div className="mt-1">
              <p className="text-sm font-bold text-gray-900">{item.camera || "-"}</p>
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                <Wifi className="w-3 h-3" /> <span>{item.ipCamera || "No IP"}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 bg-slate-50 rounded-lg p-2.5 mt-1 mb-1 border border-slate-100">
              <div className="col-span-2 flex gap-1">
                <MapPin className="w-3 h-3 text-slate-400 mt-0.5" /> 
                <span className="line-clamp-2">{item.explicitLocation || "-"}</span>
              </div>
              <div className="mt-1"><span className="text-slate-400">Brand:</span> {item.brand || "-"}</div>
              <div className="mt-1"><span className="text-slate-400">Model:</span> {item.model || "-"}</div>
            </div>
            {item.remarks && (
              <p className="text-xs text-gray-600 italic leading-snug mt-1 opacity-80">"{item.remarks}"</p>
            )}
            {(hasPermission("cctv.kpc.update") || hasPermission("cctv.kpc.delete")) && (
              <div className="flex items-center justify-end pt-3 mt-1 border-t border-gray-100">
                <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {hasPermission("cctv.kpc.update") && <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Edit2 className="h-4 w-4 text-slate-600" /></Button>}
                  {hasPermission("cctv.kpc.delete") && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-xl">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} variant="outline">Previous</Button>
            <span className="flex items-center text-sm text-gray-700">Hal {page}/{totalPages}</span>
            <Button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} variant="outline">Next</Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">
              Menampilkan <span className="font-medium">{totalCount > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}</span> s/d{" "}
              <span className="font-medium">{Math.min(page * PAGE_SIZE, totalCount)}</span> dari{" "}
              <span className="font-medium">{totalCount.toLocaleString()}</span> data
            </p>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <Button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} variant="outline" className="rounded-r-none">Previous</Button>
              {Number.isFinite(totalPages) && totalPages > 0 && [...Array(Math.min(totalPages, 5))].map((_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <Button key={p} onClick={() => setPage(p)} variant={page === p ? "default" : "outline"} className="rounded-none font-medium">{p}</Button>
                );
              })}
              <Button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} variant="outline" className="rounded-l-none">Next</Button>
            </nav>
          </div>
        </div>
      )}

      {/* ── Mobile FAB ── */}
      {hasPermission("cctv.kpc.create") && (
        <button
          onClick={() => { setFormData(defaultForm()); setIsCreateOpen(true); }}
          className="md:hidden fixed bottom-24 right-4 z-30 flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-5 py-3.5 rounded-full shadow-lg font-bold shadow-slate-500/40 transition-all active:scale-95 text-[15px]"
        >
          <Plus className="w-5 h-5" /> Tambah
        </button>
      )}

      {/* ── Create / Edit Modal ── */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) { setIsCreateOpen(false); setIsEditOpen(false); setFormData(defaultForm()); setFormError(null); }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? "Edit CCTV" : "Tambah CCTV"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Severity */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Severity</label>
              <div className="flex gap-3">
                {["Low", "Medium", "High"].map((s) => (
                  <label key={s} className={`flex-1 flex items-center justify-center gap-2 cursor-pointer rounded-xl border-2 py-2.5 text-sm font-semibold transition-all ${
                    formData.severity === s
                      ? s === "High" ? "border-red-500 bg-red-50 text-red-700"
                        : s === "Medium" ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}>
                    <input type="radio" name="severity" value={s} checked={formData.severity === s}
                      onChange={() => setFormData({ ...formData, severity: s })} className="sr-only" />
                    {s === "High" ? <ShieldAlert className="w-4 h-4" /> : s === "Medium" ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    {s}
                  </label>
                ))}
              </div>
            </div>
            {/* Camera */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Nama Camera <span className="text-red-500">*</span></label>
              <Input value={formData.camera} placeholder="e.g. M6 Camera1" onChange={(e) => setFormData({ ...formData, camera: e.target.value })} />
            </div>
            {/* IP Camera */}
            <div className="space-y-2">
              <label className="text-sm font-medium">IP Camera</label>
              <Input value={formData.ipCamera} placeholder="e.g. 172.16.1.57" onChange={(e) => setFormData({ ...formData, ipCamera: e.target.value })} />
            </div>
            {/* Model */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <Input value={formData.model} placeholder="e.g. SONY SNC-DH120" onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
            </div>
            {/* Brand */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Brand</label>
              <FormMobileSelect
                value={formData.brand || ""}
                onChange={(val) => setFormData({ ...formData, brand: val })}
                options={brandOptions}
                placeholder="Pilih Brand (e.g. Sony)"
                color="violet"
                label="Pilih Brand"
              />
            </div>
            {/* Explicit Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Explicit Location</label>
              <Input value={formData.explicitLocation} placeholder="e.g. M6 Mainshop" onChange={(e) => setFormData({ ...formData, explicitLocation: e.target.value })} />
            </div>
            {/* Foto / Koordinat */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Foto / Koordinat</label>
              <Input value={formData.fotoKoordinat} placeholder="URL foto atau koordinat GPS" onChange={(e) => setFormData({ ...formData, fotoKoordinat: e.target.value })} />
            </div>
            {/* Remarks */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Remarks</label>
              <Input value={formData.remarks} placeholder="Catatan tambahan" onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
            </div>
            {/* Status */}
            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${formData.isActive ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`}
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}>
                  {formData.isActive && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className="text-sm font-medium text-gray-700">CCTV Aktif</span>
              </label>
            </div>
          </div>
          {formError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <div><p className="font-semibold">Gagal menyimpan</p><p className="mt-0.5 opacity-90">{formError}</p></div>
              <button onClick={() => setFormError(null)} className="ml-auto text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); setFormData(defaultForm()); setFormError(null); }}>Batal</Button>
            <Button onClick={isEditOpen ? handleUpdate : handleCreate} className="bg-slate-700 hover:bg-slate-800 text-white">
              {isEditOpen ? "Simpan Perubahan" : "Tambah CCTV"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Import Modal ── */}
      <Dialog open={isImportOpen} onOpenChange={(open) => { if (!open) { setIsImportOpen(false); setImportFile(null); setImportStatus("idle"); setIsDragging(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import CCTV KPC dari Excel</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {importStatus === "idle" && (
              <>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer relative ${
                    isDragging
                      ? "border-slate-500 bg-slate-50 scale-[1.02]"
                      : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
                  }`}
                  onClick={() => document.getElementById("cctv-import-file")?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    id="cctv-import-file"
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) setImportFile(e.target.files[0]); }}
                  />
                  {importFile ? (
                    <div className="flex flex-col items-center pointer-events-none">
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center mb-3 text-slate-600 relative pointer-events-auto group">
                        <Upload size={28} />
                        <button
                          onClick={(e) => { e.stopPropagation(); setImportFile(null); }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <p className="font-semibold text-gray-800 text-base mb-1 truncate max-w-full px-4">{importFile.name}</p>
                      <p className="text-gray-500 text-sm">
                        {(importFile.size / 1024 / 1024).toFixed(2)} MB &bull; {importFile.name.split(".").pop()?.toUpperCase()}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center pointer-events-none">
                      <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 text-gray-400">
                        <Upload size={28} />
                      </div>
                      <p className="text-base font-semibold text-gray-800 mb-1">Upload File</p>
                      <p className="text-sm text-gray-500 mb-3">Seret dan lepas file ke sini atau klik untuk mencari</p>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-white shadow-sm rounded-md text-xs font-medium text-gray-600 border border-gray-200">.XLSX</span>
                        <span className="px-3 py-1 bg-white shadow-sm rounded-md text-xs font-medium text-gray-600 border border-gray-200">.XLS</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 space-y-1">
                  <p className="font-semibold">Format kolom yang dikenali:</p>
                  <p>Severity, Camera, IP Camera, Model, Brand, Explicit Location, Foto / Koordinat, Remarks</p>
                </div>
              </>
            )}
            {importStatus === "loading" && (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-600" />
                <p className="text-sm text-gray-600">Mengimpor data...</p>
              </div>
            )}
            {importStatus === "done" && (
              <div className="flex flex-col items-center py-6 gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-emerald-600" />
                </div>
                <p className="text-lg font-bold text-emerald-700">Import Berhasil!</p>
                <p className="text-sm text-gray-600">{importCount} data CCTV berhasil diimport</p>
              </div>
            )}
            {importStatus === "error" && (
              <div className="flex flex-col items-center py-6 gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>
                <p className="text-lg font-bold text-red-700">Import Gagal</p>
                <p className="text-sm text-gray-600">{importError}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            {importStatus === "idle" && (
              <>
                <Button variant="outline" onClick={() => setIsImportOpen(false)}>Batal</Button>
                <Button disabled={!importFile} onClick={handleImport} className="bg-slate-700 hover:bg-slate-800 text-white">
                  <Upload className="w-4 h-4 mr-2" />Mulai Import
                </Button>
              </>
            )}
            {(importStatus === "done" || importStatus === "error") && (
              <Button onClick={() => { setIsImportOpen(false); setImportFile(null); setImportStatus("idle"); }}>Tutup</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== MOBILE FILTER MODALS ========== */}
      <div id="mobile-dropdown-severity" className="hidden fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => document.getElementById("mobile-dropdown-severity")?.classList.add("hidden")}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[70vh] animate-in slide-in-from-bottom-8 duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
            <h3 className="font-bold text-gray-800">Pilih Severity</h3>
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            <div className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${!filterSeverity ? 'font-bold text-slate-700 bg-slate-100' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { setFilterSeverity(""); document.getElementById("mobile-dropdown-severity")?.classList.add("hidden"); }}>
              Semua Severity {!filterSeverity && <Check className="w-4 h-4" />}
            </div>
            {["High", "Medium", "Low"].map((opt) => (
              <div key={opt} className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${filterSeverity === opt ? 'font-bold text-slate-700 bg-slate-100' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { setFilterSeverity(opt); document.getElementById("mobile-dropdown-severity")?.classList.add("hidden"); }}>
                {opt} {filterSeverity === opt && <Check className="w-4 h-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="mobile-dropdown-brand" className="hidden fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => document.getElementById("mobile-dropdown-brand")?.classList.add("hidden")}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[70vh] animate-in slide-in-from-bottom-8 duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
            <h3 className="font-bold text-gray-800">Pilih Brand</h3>
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            <div className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${!filterBrand ? 'font-bold text-slate-700 bg-slate-100' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { setFilterBrand(""); document.getElementById("mobile-dropdown-brand")?.classList.add("hidden"); }}>
              Semua Brand {!filterBrand && <Check className="w-4 h-4" />}
            </div>
            {Array.from(new Set(allOptions.map(o => o.brand).filter(Boolean))).sort().map((opt) => (
              <div key={opt} className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${filterBrand === opt ? 'font-bold text-slate-700 bg-slate-100' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { setFilterBrand(opt as string); document.getElementById("mobile-dropdown-brand")?.classList.add("hidden"); }}>
                {opt} {filterBrand === opt && <Check className="w-4 h-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="mobile-dropdown-active" className="hidden fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => document.getElementById("mobile-dropdown-active")?.classList.add("hidden")}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[70vh] animate-in slide-in-from-bottom-8 duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
            <h3 className="font-bold text-gray-800">Pilih Status</h3>
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            <div className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${filterActive === "" ? 'font-bold text-slate-700 bg-slate-100' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { setFilterActive(""); document.getElementById("mobile-dropdown-active")?.classList.add("hidden"); }}>
              Semua Status {filterActive === "" && <Check className="w-4 h-4" />}
            </div>
            <div className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${filterActive === "true" ? 'font-bold text-slate-700 bg-slate-100' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { setFilterActive("true"); document.getElementById("mobile-dropdown-active")?.classList.add("hidden"); }}>
              Aktif {filterActive === "true" && <Check className="w-4 h-4" />}
            </div>
            <div className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${filterActive === "false" ? 'font-bold text-slate-700 bg-slate-100' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { setFilterActive("false"); document.getElementById("mobile-dropdown-active")?.classList.add("hidden"); }}>
              Nonaktif {filterActive === "false" && <Check className="w-4 h-4" />}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
