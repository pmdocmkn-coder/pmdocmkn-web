import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, cubicBezier, Variants } from "framer-motion";
import { hasPermission } from "../../utils/permissionUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import {
  Search,
  Plus,
  MoreVertical,
  History,
  Trash2,
  Edit2,
  Upload,
  Radio as RadioIcon,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Copy,
  Tag,
  Download,
} from "lucide-react";
import { radioApi, RadioDto, CreateRadioDto } from "../../services/radioApi";
import { SearchableCombobox, FleetCombobox } from "./RadioCombobox";
import RadioHistoryModal from "./RadioHistoryModal";
import ScrapRadioModal from "./ScrapRadioModal";
import RadioImportModal from "./RadioImportModal";
import { useToast } from "../../hooks/use-toast";
import { parseRadioResponse, parseFleetList, isNoGrafir } from "../../utils/radioHelpers";
import { FilterSelect } from "./FilterSelect";
import { format } from "date-fns";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ─── Helper Functions ────────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: cubicBezier(0.25, 0.46, 0.45, 0.94),
    },
  },
};

const cardHoverVariants: Variants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.03,
    y: -4,
    transition: { type: "spring", stiffness: 400, damping: 12 },
  },
};

const filterPanelVariants: Variants = {
  open: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.3, ease: cubicBezier(0.25, 0.46, 0.45, 0.94) },
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.25, ease: cubicBezier(0.55, 0, 1, 0.45) },
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function RadioUnitPage() {
  const { toast } = useToast();

  // ── Data State ──────────────────────────────────────────────────────────────
  const [data, setData] = useState<RadioDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ── Pagination ──────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // ── Filter State ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterDivisi, setFilterDivisi] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFleet, setFilterFleet] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterDuplikat, setFilterDuplikat] = useState(false);
  const [filterNoGrafir, setFilterNoGrafir] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // ── Options untuk combobox ──────────────────────────────────────────────────
  const [allOptions, setAllOptions] = useState<RadioDto[]>([]);

  // ── Modal State ─────────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isScrapOpen, setIsScrapOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedRadio, setSelectedRadio] = useState<RadioDto | null>(null);

  // ── Form Error ──────────────────────────────────────────────────────────────
  const [formError, setFormError] = useState<string | null>(null);

  // ── Form State ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<CreateRadioDto>({
    category: "Unit",
    nomorAset: "",
    nomorUnit: "",
    nomorLv: "",
    serialNumber: "",
    type: "",
    division: "",
    department: "",
    channel: "",
    tanggal: "",
    fleet: "",
    radioId: "",
    mark: "",
    isTrunking: false,
    isConventional: false,
    isScrap: false,
  });

  // ── Load Options ────────────────────────────────────────────────────────────
  useEffect(() => {
    radioApi.getAllUnpaged("Unit", false)
      .then((r) => setAllOptions(r.data.data))
      .catch(() => {});
  }, []);

  // ── Load Data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    loadData();
  }, [page, search, filterDivisi, filterType, filterFleet, filterJenis, filterDepartment, filterDuplikat, filterNoGrafir]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await radioApi.getAll({
        category: "Unit",
        isScrap: false,
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        division: filterDivisi || undefined,
        type: filterType || undefined,
        fleet: filterFleet || undefined,
        jenis: filterJenis ? filterJenis.toLowerCase() : undefined,
        department: filterDepartment || undefined,
        isDuplicate: filterDuplikat || undefined,
        isNoGrafir: filterNoGrafir || undefined,
      });
      const { items, totalCount: tc, totalPages: tp } = parseRadioResponse(response.data);
      setData(items);
      setTotalCount(tc);
      setTotalPages(tp);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load Unit radios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── CRUD Handlers ───────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setFormError(null);
    try {
      await radioApi.create(formData);
      toast({ title: "Berhasil", description: "Radio berhasil ditambahkan" });
      setIsCreateOpen(false);
      loadData();
      resetForm();
    } catch (error: any) {
      setFormError(error.response?.data?.message || "Gagal membuat radio");
    }
  };

  const handleUpdate = async () => {
    if (!selectedRadio) return;
    setFormError(null);
    try {
      await radioApi.update(selectedRadio.id, formData);
      toast({ title: "Berhasil", description: "Radio berhasil diperbarui" });
      setIsEditOpen(false);
      loadData();
      resetForm();
    } catch (error: any) {
      setFormError(error.response?.data?.message || "Gagal memperbarui radio");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this radio?")) return;
    try {
      await radioApi.delete(id);
      toast({ title: "Berhasil", description: "Radio berhasil dihapus" });
      loadData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete radio", variant: "destructive" });
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("PERINGATAN: Yakin ingin menghapus SEMUA data Radio Unit? Tindakan ini tidak dapat dibatalkan!")) return;
    try {
      await radioApi.deleteAllUnit();
      toast({ title: "Berhasil", description: "Semua data Radio Unit berhasil dihapus" });
      loadData();
    } catch (error) {
      toast({ title: "Error", description: "Gagal menghapus data Radio Unit", variant: "destructive" });
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const handleExport = async () => {
    if (filteredAllOptions.length === 0) {
      toast({ title: "Info", description: "Tidak ada data untuk diekspor" });
      return;
    }
    setIsExporting(true);
    try {
      const wb = new ExcelJS.Workbook();

      const addSheet = (sheetName: string, data: RadioDto[]) => {
        if (data.length === 0) return;
        const ws = wb.addWorksheet(sheetName);

        const noGrafirCount = data.filter(d => isNoGrafir(d.nomorAset)).length;

        const allFleets = new Set<string>();
        data.forEach(d => {
          parseFleetList(d.fleet).forEach(f => allFleets.add(f));
        });
        const distinctFleets = Array.from(allFleets).sort();

        // 1. Info Table
        const infoHeaderRow = ws.addRow(["Warna", "KETERANGAN", "JUMLAH"]);
        infoHeaderRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
          cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        });
        
        const infoDataRow = ws.addRow(["", "Belum Grafir", noGrafirCount]);
        infoDataRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };
        infoDataRow.getCell(2).font = { bold: true };
        infoDataRow.getCell(3).font = { bold: true, color: { argb: 'FFFF0000' } };
        infoDataRow.eachCell((cell) => {
          cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
          cell.alignment = { horizontal: "center", vertical: "middle" };
        });

        // Spacer
        ws.addRow([]);

        // Main Table Headers (2 rows for merged Fleet)
        const mainHeadersRow1 = [
          "NO", "Nomor Aset", "Nomor Unit", "Serial Number", "Fleet"
        ];
        // Add empty slots for Fleet merge
        for(let i=1; i<distinctFleets.length; i++) {
          mainHeadersRow1.push("");
        }
        mainHeadersRow1.push("ID Radio", "Scrap", "Mark", "TRUNGKING", "KONV", "DIV", "Dept", "Tanggal", "Type", "Channel");

        const mainHeadersRow2 = [
          "", "", "", "", ...distinctFleets, "", "", "", "", "", "", "", "", "", ""
        ];

        const r1 = ws.addRow(mainHeadersRow1);
        const r2 = ws.addRow(mainHeadersRow2);

        // Styling and merging
        const fleetStartCol = 5;
        const fleetEndCol = 4 + (distinctFleets.length > 0 ? distinctFleets.length : 1);
        
        if (distinctFleets.length > 0) {
          ws.mergeCells(r1.number, fleetStartCol, r1.number, fleetEndCol);
        }

        const standardMergeCols = [
          1, 2, 3, 4, 
          fleetEndCol + 1, fleetEndCol + 2, fleetEndCol + 3, fleetEndCol + 4, 
          fleetEndCol + 5, fleetEndCol + 6, fleetEndCol + 7, fleetEndCol + 8,
          fleetEndCol + 9, fleetEndCol + 10
        ];

        standardMergeCols.forEach(col => {
          ws.mergeCells(r1.number, col, r2.number, col);
        });

        [r1, r2].forEach(r => {
          r.eachCell(cell => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
            cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
          });
        });

        // Add Data
        data.forEach((item, i) => {
          const isItemNoGrafir = isNoGrafir(item.nomorAset);
          
          const rowData: any[] = [
            i + 1,
            item.nomorAset || "-",
            item.nomorUnit || "-",
            item.serialNumber || "-"
          ];

          const itemFleets = parseFleetList(item.fleet);
          if (distinctFleets.length > 0) {
            distinctFleets.forEach(f => {
              rowData.push(itemFleets.includes(f) ? "✓" : "");
            });
          } else {
            rowData.push(""); // empty fleet placeholder if none exist
          }

          rowData.push(
            item.radioId || "-",
            item.isScrap ? "Yes" : "-",
            item.mark || "-",
            item.isTrunking ? "V" : "",
            item.isConventional ? "V" : "",
            item.division || "-",
            item.department || "-",
            (item.tanggal && item.tanggal !== "-") ? format(new Date(item.tanggal), "dd-MMM-yyyy") : "-",
            item.type || "-",
            item.channel || "-"
          );

          const row = ws.addRow(rowData);
          row.eachCell((cell) => {
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
            if (isItemNoGrafir) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };
            }
          });
        });

        // Adjust column widths
        ws.getColumn(1).width = 5;  // NO
        ws.getColumn(2).width = 15; // Aset
        ws.getColumn(3).width = 15; // Unit
        ws.getColumn(4).width = 20; // SN
        
        let colIdx = 5;
        if (distinctFleets.length > 0) {
          distinctFleets.forEach(() => {
            ws.getColumn(colIdx).width = 8;
            colIdx++;
          });
        } else {
          ws.getColumn(colIdx).width = 15;
          colIdx++;
        }
        
        ws.getColumn(colIdx++).width = 12; // ID
        ws.getColumn(colIdx++).width = 10; // Scrap
        ws.getColumn(colIdx++).width = 12; // Mark
        ws.getColumn(colIdx++).width = 12; // Trunking
        ws.getColumn(colIdx++).width = 12; // Konv
        ws.getColumn(colIdx++).width = 15; // Div
        ws.getColumn(colIdx++).width = 15; // Dept
        ws.getColumn(colIdx++).width = 15; // Tanggal
        ws.getColumn(colIdx++).width = 15; // Type
        ws.getColumn(colIdx++).width = 10; // Channel
      };

      const getDiv = (r: RadioDto) => (r.division && r.division.trim() !== "" ? r.division.trim() : "Tanpa Divisi");
      if (!filterDivisi) {
        const divisions = Array.from(new Set(filteredAllOptions.map(getDiv))).sort();
        const usedSheetNames = new Set<string>();

        divisions.forEach(div => {
          let sheetName = div.replace(/[\\/?*[\]]/g, '').trim().substring(0, 31) || "Sheet1";
          
          let finalSheetName = sheetName;
          let counter = 1;
          while (usedSheetNames.has(finalSheetName.toLowerCase())) {
            const suffix = `_${counter}`;
            finalSheetName = `${sheetName.substring(0, 31 - suffix.length)}${suffix}`;
            counter++;
          }
          usedSheetNames.add(finalSheetName.toLowerCase());

          addSheet(finalSheetName, filteredAllOptions.filter(d => getDiv(d) === div));
        });
      } else {
        let sheetName = filterDivisi.replace(/[\\/?*[\]]/g, '').trim().substring(0, 31) || "Sheet1";
        addSheet(sheetName, filteredAllOptions);
      }

      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf]), `Radio_Unit_Filtered_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
      toast({ title: "Berhasil", description: `${filteredAllOptions.length} data diekspor.` });
    } catch (e) {
      toast({ title: "Gagal", description: "Terjadi kesalahan saat export", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const openEditModal = (radio: RadioDto) => {
    setSelectedRadio(radio);
    setFormData({
      category: "Unit",
      nomorAset: radio.nomorAset || "",
      nomorUnit: radio.nomorUnit || "",
      nomorLv: radio.nomorLv || "",
      serialNumber: radio.serialNumber || "",
      type: radio.type || "",
      division: radio.division || "",
      department: radio.department || "",
      channel: radio.channel || "",
      tanggal: radio.tanggal ? radio.tanggal.split("T")[0] : "",
      fleet: radio.fleet || "",
      radioId: radio.radioId || "",
      mark: radio.mark || "",
      isTrunking: radio.isTrunking,
      isConventional: radio.isConventional,
      isScrap: radio.isScrap,
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      category: "Unit",
      nomorAset: "",
      nomorUnit: "",
      nomorLv: "",
      serialNumber: "",
      type: "",
      division: "",
      department: "",
      channel: "",
      tanggal: "",
      fleet: "",
      radioId: "",
      mark: "",
      isTrunking: false,
      isConventional: false,
      isScrap: false,
    });
    setSelectedRadio(null);
  };

  // ── Derived Filter Options (dari allOptions unpaged) ───────────────────────
  const divisiOptions = useMemo(
    () => Array.from(new Set(allOptions.map((d) => d.division).filter(Boolean))).sort() as string[],
    [allOptions]
  );
  const typeOptions = useMemo(
    () => Array.from(new Set(allOptions.map((d) => d.type).filter(Boolean))).sort() as string[],
    [allOptions]
  );
  const departmentOptions = useMemo(
    () => Array.from(new Set(allOptions.map((d) => d.department).filter(Boolean))).sort() as string[],
    [allOptions]
  );
  const fleetOptions = useMemo(() => {
    const all = allOptions.flatMap((d) => parseFleetList(d.fleet));
    return Array.from(new Set(all)).sort();
  }, [allOptions]);

  // ── Active Filter Count ─────────────────────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (filterDivisi) count++;
    if (filterType) count++;
    if (filterFleet) count++;
    if (filterJenis) count++;
    if (filterDepartment) count++;
    if (filterDuplikat) count++;
    if (filterNoGrafir) count++;
    return count;
  }, [search, filterDivisi, filterType, filterFleet, filterJenis, filterDepartment, filterDuplikat, filterNoGrafir]);

  const resetFilters = () => {
    setSearch("");
    setFilterDivisi("");
    setFilterType("");
    setFilterFleet("");
    setFilterJenis("");
    setFilterDepartment("");
    setFilterDuplikat(false);
    setFilterNoGrafir(false);
    setPage(1);
  };

  // data sudah difilter server-side
  const filteredData = data;

  // ── Fleet Color Map ──────────────────────────────────────────────────────────
  const fleetColorMap = useMemo(() => {
    const palettes = [
      "bg-emerald-100 border-emerald-400 text-emerald-800",
      "bg-pink-100 border-pink-400 text-pink-800",
      "bg-sky-100 border-sky-400 text-sky-800",
      "bg-amber-100 border-amber-400 text-amber-800",
      "bg-violet-100 border-violet-400 text-violet-800",
      "bg-rose-100 border-rose-400 text-rose-800",
      "bg-teal-100 border-teal-400 text-teal-800",
      "bg-orange-100 border-orange-400 text-orange-800",
      "bg-indigo-100 border-indigo-400 text-indigo-800",
      "bg-lime-100 border-lime-400 text-lime-800",
    ];
    const map = new Map<string, string>();
    let idx = 0;
    const sorted = [...fleetOptions].sort();
    for (const f of sorted) {
      map.set(f, palettes[idx % palettes.length]);
      idx++;
    }
    return map;
  }, [fleetOptions]);

  // ── Calculate Stats from All Unpaged Data based on active filters ──────────
  const filteredAllOptions = useMemo(() => {
    let result = allOptions;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(d => 
        (d.nomorAset || "").toLowerCase().includes(s) ||
        (d.radioId || "").toLowerCase().includes(s) ||
        (d.serialNumber || "").toLowerCase().includes(s) ||
        (d.company || "").toLowerCase().includes(s)
      );
    }
    if (filterDivisi) result = result.filter(d => d.division === filterDivisi);
    if (filterType) result = result.filter(d => d.type === filterType);
    if (filterFleet) result = result.filter(d => d.fleet?.includes(filterFleet));
    if (filterJenis === "Trunking") result = result.filter(d => d.isTrunking);
    if (filterJenis === "Konvensional") result = result.filter(d => d.isConventional);
    if (filterDepartment) result = result.filter(d => d.department === filterDepartment);
    if (filterDuplikat) result = result.filter(d => d.isDuplicateId);
    if (filterNoGrafir) result = result.filter(d => isNoGrafir(d.nomorAset));

    return result;
  }, [allOptions, search, filterDivisi, filterType, filterFleet, filterJenis, filterDepartment, filterDuplikat, filterNoGrafir]);

  // ── Stat Counts ─────────────────────────────────────────────────────────────
  const trunkingCount = useMemo(() => filteredAllOptions.filter((d) => d.isTrunking).length, [filteredAllOptions]);
  const konvensionalCount = useMemo(() => filteredAllOptions.filter((d) => d.isConventional).length, [filteredAllOptions]);
  const duplikatCount = useMemo(() => filteredAllOptions.filter((d) => d.isDuplicateId).length, [filteredAllOptions]);
  const scrapCount = useMemo(() => filteredAllOptions.filter((d) => d.isScrap).length, [filteredAllOptions]);
  const noGrafirCount = useMemo(() => filteredAllOptions.filter((d) => isNoGrafir(d.nomorAset)).length, [filteredAllOptions]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 md:p-6 space-y-6"
    >
      {/* ── Page Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Radio Unit</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manajemen aset radio unit kendaraan</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPermission("radio.delete.all.unit") && (
            <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete All
            </Button>
          )}
          {hasPermission("radio.import") && (
            <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
              <Upload className="w-4 h-4 mr-1.5" />
              Import
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="bg-white hover:bg-slate-50 text-slate-700">
            {isExporting ? (
              <div className="w-4 h-4 mr-1.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-1.5" />
            )}
            Export
          </Button>
          {hasPermission("radio.create") && (
            <Button
              size="sm"
              onClick={() => { resetForm(); setIsCreateOpen(true); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah
            </Button>
          )}
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Unit */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br from-emerald-600 to-emerald-800 cursor-default"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                <RadioIcon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-80">Total</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{totalCount.toLocaleString()}</p>
            <p className="text-xs opacity-70 mt-1.5 font-medium">halaman {page} / {totalPages}</p>
          </div>
        </motion.div>

        {/* Trunking */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br from-sky-500 to-blue-700 cursor-default"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                <RadioIcon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-80">Trunking</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{trunkingCount}</p>
            <p className="text-xs opacity-70 mt-1.5 font-medium">radio trunking aktif</p>
          </div>
        </motion.div>

        {/* Konvensional */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br from-teal-500 to-emerald-700 cursor-default"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                <RadioIcon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-80">Konvensional</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{konvensionalCount}</p>
            <p className="text-xs opacity-70 mt-1.5 font-medium">radio konvensional aktif</p>
          </div>
        </motion.div>

        {/* Duplikat ID */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br from-rose-500 to-red-700 cursor-default"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                <Copy className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-80">Duplikat</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{duplikatCount}</p>
            <p className="text-xs opacity-70 mt-1.5 font-medium">ID radio duplikat</p>
          </div>
        </motion.div>

        {/* Scrap */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br from-amber-500 to-orange-600 cursor-default"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                <Tag className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-80">Scrap</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{scrapCount}</p>
            <p className="text-xs opacity-70 mt-1.5 font-medium">unit di-scrap</p>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Filter Panel ── */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* Filter Header */}
        <button
          onClick={() => setIsFilterOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/80 transition-colors rounded-2xl"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-100 rounded-lg">
              <Filter className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="font-semibold text-gray-800 text-sm">Filter &amp; Pencarian</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); resetFilters(); }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
            {isFilterOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </button>

        {/* Collapsible Filter Body */}
        <AnimatePresence initial={false}>
          {isFilterOpen && (
            <motion.div
              key="filter-body"
              variants={filterPanelVariants}
              initial="closed"
              animate="open"
              exit="closed"
              style={{ overflow: "hidden" }}
            >
              <div className="px-5 pt-1 pb-5 border-t border-gray-100 space-y-4">
                {/* Search */}
                <div className="pt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      placeholder="Cari nomor aset, unit, SN, ID radio..."
                      className="pl-9 h-9 text-sm border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                  </div>
                </div>

                {/* Dropdowns */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  <FilterSelect value={filterDivisi} onChange={(v) => { setFilterDivisi(v); setPage(1); }} options={divisiOptions} placeholder="Semua Divisi" color="emerald" />
                  <FilterSelect value={filterDepartment} onChange={(v) => { setFilterDepartment(v); setPage(1); }} options={departmentOptions} placeholder="Semua Dept" color="emerald" />
                  <FilterSelect value={filterType} onChange={(v) => { setFilterType(v); setPage(1); }} options={typeOptions} placeholder="Semua Type" color="emerald" />
                  <FilterSelect value={filterFleet} onChange={(v) => { setFilterFleet(v); setPage(1); }} options={fleetOptions} placeholder="Semua Fleet" color="emerald" />
                  <FilterSelect value={filterJenis} onChange={(v) => { setFilterJenis(v); setPage(1); }} options={["Trunking", "Konvensional"]} placeholder="Semua Jenis" color="emerald" />
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${filterDuplikat ? "bg-red-500 border-red-500" : "border-gray-300 group-hover:border-red-400"}`}>
                      {filterDuplikat && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      <input type="checkbox" checked={filterDuplikat} onChange={(e) => { setFilterDuplikat(e.target.checked); setPage(1); }} className="sr-only" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Duplikat ID</span>
                    {duplikatCount > 0 && <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">{duplikatCount}</span>}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${filterNoGrafir ? "bg-orange-500 border-orange-500" : "border-gray-300 group-hover:border-orange-400"}`}>
                      {filterNoGrafir && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      <input type="checkbox" checked={filterNoGrafir} onChange={(e) => { setFilterNoGrafir(e.target.checked); setPage(1); }} className="sr-only" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">No Grafir</span>
                    {noGrafirCount > 0 && <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">{noGrafirCount}</span>}
                  </label>
                </div>

                {/* Active Filter Chips */}
                {activeFilterCount > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    {[
                      { val: search, label: `Cari: "${search}"`, clear: () => setSearch(""), color: "bg-emerald-100 text-emerald-700" },
                      { val: filterDivisi, label: `Divisi: ${filterDivisi}`, clear: () => setFilterDivisi(""), color: "bg-blue-100 text-blue-700" },
                      { val: filterDepartment, label: `Dept: ${filterDepartment}`, clear: () => setFilterDepartment(""), color: "bg-blue-100 text-blue-700" },
                      { val: filterType, label: `Type: ${filterType}`, clear: () => setFilterType(""), color: "bg-blue-100 text-blue-700" },
                      { val: filterFleet, label: `Fleet: ${filterFleet}`, clear: () => setFilterFleet(""), color: "bg-blue-100 text-blue-700" },
                      { val: filterJenis, label: `Jenis: ${filterJenis}`, clear: () => setFilterJenis(""), color: "bg-blue-100 text-blue-700" },
                      { val: filterDuplikat ? "1" : "", label: "Duplikat ID", clear: () => setFilterDuplikat(false), color: "bg-red-100 text-red-700" },
                      { val: filterNoGrafir ? "1" : "", label: "No Grafir", clear: () => setFilterNoGrafir(false), color: "bg-orange-100 text-orange-700" },
                    ].filter(f => f.val).map((f, i) => (
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

      {/* ── Data Table ── */}
      <motion.div variants={itemVariants} className="rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Nomor Aset</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Nomor Unit</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Serial Number</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Type Radio</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">DIV</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Dept</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Jenis</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Channel</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Tanggal</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Fleet</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">ID Radio</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Scrap</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Mark</th>
                {(hasPermission("radio.update") ||
                  hasPermission("radio.delete") ||
                  hasPermission("radio.scrap.create") ||
                  hasPermission("radio.view")) && (
                  <th className="font-semibold text-gray-600 py-3 px-4 text-right whitespace-nowrap">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={15} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                      <span className="text-sm text-muted-foreground">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={15} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <RadioIcon className="w-10 h-10 opacity-20" />
                      <span className="text-sm">Tidak ada data yang ditemukan</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const fleetList = parseFleetList(item.fleet);
                  const rowBg = item.isDuplicateId
                    ? "bg-red-50 hover:bg-red-100"
                    : isNoGrafir(item.nomorAset)
                    ? "bg-orange-50 hover:bg-orange-100"
                    : "hover:bg-gray-50";
                  return (
                    <tr key={item.id} className={`border-b border-gray-100 transition-colors ${rowBg}`}>
                      <td className="font-medium py-3 px-4 whitespace-nowrap">{item.nomorAset || "-"}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{item.nomorLv || item.nomorUnit || "-"}</td>
                      <td className="py-3 px-4 font-mono whitespace-nowrap">{item.serialNumber || "-"}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{item.type || "-"}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{item.division || "-"}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{item.department || "-"}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.isTrunking ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold">
                            Trunking
                          </span>
                        ) : item.isConventional ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 text-xs font-semibold">
                            Konvensional
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{item.channel || "-"}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.tanggal
                          ? new Date(item.tanggal).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {fleetList.slice(0, 4).map((f, i) => {
                            const colorClass =
                              fleetColorMap.get(f) ?? "bg-gray-100 border-gray-300 text-gray-700";
                            return (
                              <span
                                key={i}
                                className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono font-semibold ${colorClass}`}
                              >
                                {f}
                              </span>
                            );
                          })}
                          {fleetList.length > 4 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 border border-gray-300 text-gray-600 text-xs font-semibold">
                              +{fleetList.length - 4}
                            </span>
                          )}
                          {fleetList.length === 0 && <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`font-mono ${item.isDuplicateId ? "text-red-600 font-bold" : ""}`}>
                          {item.radioId || "-"}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.isScrap ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-semibold">
                            Scrap
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{item.mark || "-"}</td>
                      {(hasPermission("radio.update") ||
                        hasPermission("radio.delete") ||
                        hasPermission("radio.scrap.create") ||
                        hasPermission("radio.view")) && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-7 w-7 p-0 inline-flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {hasPermission("radio.update") && (
                                <DropdownMenuItem onClick={() => openEditModal(item)}>
                                  <Edit2 className="mr-2 h-4 w-4" />Edit
                                </DropdownMenuItem>
                              )}
                              {hasPermission("radio.scrap.create") && (
                                <DropdownMenuItem
                                  onClick={() => { setSelectedRadio(item); setIsScrapOpen(true); }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />Scrap
                                </DropdownMenuItem>
                              )}
                              {hasPermission("radio.view") && (
                                <DropdownMenuItem
                                  onClick={() => { setSelectedRadio(item); setIsHistoryOpen(true); }}
                                >
                                  <History className="mr-2 h-4 w-4" />History
                                </DropdownMenuItem>
                              )}
                              {hasPermission("radio.delete") && (
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />Hapus
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Pagination ── */}
      <motion.div variants={itemVariants} className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-500">
          Menampilkan <span className="font-semibold text-gray-700">{totalCount > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, totalCount)}</span> dari <span className="font-semibold text-gray-700">{totalCount.toLocaleString()}</span> data
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(1)} disabled={page <= 1} className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold" title="Halaman pertama">«</button>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs" title="Sebelumnya">‹</button>
          {totalPages > 0 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <button key={p} onClick={() => setPage(p)} className={`h-8 w-8 flex items-center justify-center rounded-md border text-xs font-medium transition-colors ${p === page ? "bg-emerald-600 border-emerald-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{p}</button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs" title="Berikutnya">›</button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold" title="Halaman terakhir">»</button>
          </div>
      </motion.div>

      {/* ── Create / Edit Modal ── */}
      <Dialog
        open={isCreateOpen || isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setIsEditOpen(false);
            resetForm();
            setFormError(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditOpen ? "Edit Radio Unit" : "Tambah Radio Unit"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nomor Aset</label>
              <Input value={formData.nomorAset} placeholder="e.g. KPC-001" onChange={(e) => setFormData({ ...formData, nomorAset: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nomor Unit (LV/LT)</label>
              <Input value={formData.nomorLv} placeholder="e.g. LV-001 / LT-001" onChange={(e) => setFormData({ ...formData, nomorLv: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Serial Number</label>
              <Input value={formData.serialNumber} placeholder="e.g. SN123456" onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type Radio</label>
              <SearchableCombobox value={formData.type || ""} onChange={(val) => setFormData({ ...formData, type: val })} options={typeOptions} placeholder="e.g. Motorola XPR" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Divisi (DIV)</label>
              <SearchableCombobox value={formData.division || ""} onChange={(val) => setFormData({ ...formData, division: val })} options={divisiOptions} placeholder="e.g. Mining" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Department (Dept)</label>
              <SearchableCombobox value={formData.department || ""} onChange={(val) => setFormData({ ...formData, department: val })} options={departmentOptions} placeholder="e.g. MOD" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal</label>
              <Input type="date" value={formData.tanggal} onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fleet</label>
              <FleetCombobox value={formData.fleet || ""} onChange={(val) => setFormData({ ...formData, fleet: val })} options={fleetOptions} />
              <p className="text-xs text-muted-foreground">Pisahkan dengan koma untuk beberapa fleet</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ID Radio</label>
              <Input value={formData.radioId} placeholder="e.g. 2001" onChange={(e) => setFormData({ ...formData, radioId: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mark</label>
              <Input value={formData.mark} placeholder="e.g. OK" onChange={(e) => setFormData({ ...formData, mark: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Jenis Radio</label>
              <div className="flex gap-6 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="radioType" checked={formData.isTrunking} onChange={() => setFormData({ ...formData, isTrunking: true, isConventional: false })} className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500" />
                  <span className="text-sm text-gray-700">Trunking</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="radioType" checked={formData.isConventional} onChange={() => setFormData({ ...formData, isTrunking: false, isConventional: true })} className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500" />
                  <span className="text-sm text-gray-700">Konvensional</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="radioType" checked={!formData.isTrunking && !formData.isConventional} onChange={() => setFormData({ ...formData, isTrunking: false, isConventional: false })} className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500" />
                  <span className="text-sm text-gray-700">Tidak Ditentukan</span>
                </label>
              </div>
            </div>
          </div>

          {/* ── Inline Error Banner ── */}
          {formError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              <div className="flex-1"><p className="font-semibold">Gagal menyimpan</p><p className="mt-0.5 opacity-90">{formError}</p></div>
              <button onClick={() => setFormError(null)} className="ml-auto flex-shrink-0 text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); setFormError(null); }}>Batal</Button>
            <Button onClick={isEditOpen ? handleUpdate : handleCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isEditOpen ? "Simpan Perubahan" : "Tambah Radio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Scrap Modal ── */}
      <ScrapRadioModal
        isOpen={isScrapOpen}
        onClose={() => setIsScrapOpen(false)}
        radioId={selectedRadio?.id}
        radioIdentifier={
          selectedRadio?.nomorAset ||
          selectedRadio?.nomorLv ||
          selectedRadio?.nomorUnit ||
          selectedRadio?.serialNumber ||
          ""
        }
        onSuccess={() => {
          setIsScrapOpen(false);
          loadData();
        }}
      />

      {/* ── Import Modal ── */}
      <RadioImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Radio Unit"
        onImportSuccess={() => loadData()}
        importApiCall={radioApi.importUnit}
      />

      {/* ── History Modal ── */}
      <RadioHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        radioId={selectedRadio?.id || null}
      />
    </motion.div>
  );
}
