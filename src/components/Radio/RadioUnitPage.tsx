import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  Home,
  Check,
  AlertCircle,
} from "lucide-react";
import { radioApi, RadioDto, CreateRadioDto } from "../../services/radioApi";
import { SearchableCombobox, FleetCombobox } from "./RadioCombobox";
import RadioHistoryModal from "./RadioHistoryModal";
import ScrapRadioModal from "./ScrapRadioModal";
import RadioImportModal from "./RadioImportModal";
import { DuplicateSnModal } from "./DuplicateSnModal";
import { useToast } from "../../hooks/use-toast";
import { parseRadioResponse, parseFleetList, isNoGrafir } from "../../utils/radioHelpers";
import { FilterSelect } from "./FilterSelect";
import { FormMobileSelect } from "./FormMobileSelect";
import { FormMobileDatePicker } from "./FormMobileDatePicker";
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
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Data State ──────────────────────────────────────────────────────────────
  const [data, setData] = useState<RadioDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ── Pagination ──────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageBeforeSearch, setPageBeforeSearch] = useState(1);
  const PAGE_SIZE = 10;

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
  const [isDuplicateSnModalOpen, setIsDuplicateSnModalOpen] = useState(false);

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
  const validateDuplicate = (): string | null => {
    if (!formData.radioId || !formData.fleet) return null;
    
    const inputRadioId = formData.radioId.trim().toLowerCase();
    const inputFleets = parseFleetList(formData.fleet).map(f => f.toLowerCase());
    
    if (inputFleets.length === 0) return null;

    for (const option of allOptions) {
      if (selectedRadio && option.id === selectedRadio.id) continue;
      
      if (option.radioId && option.radioId.trim().toLowerCase() === inputRadioId) {
        const optionFleets = parseFleetList(option.fleet).map(f => f.toLowerCase());
        const hasOverlap = inputFleets.some(f => optionFleets.includes(f));
        if (hasOverlap) {
          return `Duplikat terdeteksi! Radio ID "${formData.radioId}" sudah terdaftar pada fleet yang sama.`;
        }
      }
    }
    return null;
  };

  const handleCreate = async () => {
    setFormError(null);
    const dupError = validateDuplicate();
    if (dupError) {
      alert(dupError);
      setFormError(dupError);
      return;
    }
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
    const dupError = validateDuplicate();
    if (dupError) {
      alert(dupError);
      setFormError(dupError);
      return;
    }
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
  const uniqueRadios = useMemo(() => {
    const seenSn = new Set<string>();
    return filteredAllOptions.filter((d) => {
      const sn = d.serialNumber?.trim()?.toLowerCase();
      if (!sn || sn === "-" || sn === "n/a") return true; // count devices without valid SN individually
      if (seenSn.has(sn)) return false;
      seenSn.add(sn);
      return true;
    });
  }, [filteredAllOptions]);

  const duplicateSns = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of filteredAllOptions) {
      const sn = d.serialNumber?.trim()?.toLowerCase();
      if (sn && sn !== "-" && sn !== "n/a") {
        counts.set(sn, (counts.get(sn) || 0) + 1);
      }
    }
    const dups = new Set<string>();
    for (const [sn, c] of counts.entries()) {
      if (c > 1) dups.add(sn);
    }
    return dups;
  }, [filteredAllOptions]);

  const realTotalCount = uniqueRadios.length;
  const trunkingCount = useMemo(() => uniqueRadios.filter((d) => d.isTrunking).length, [uniqueRadios]);
  const konvensionalCount = useMemo(() => uniqueRadios.filter((d) => d.isConventional).length, [uniqueRadios]);
  const duplikatCount = useMemo(() => {
    const seen = new Set<string>();
    let count = 0;
    for (const d of filteredAllOptions) {
      if (!d.isDuplicateId) continue;
      const key = `${(d.radioId || "").trim().toLowerCase()}_${(d.fleet || "").trim().toLowerCase()}`;
      if (!seen.has(key)) { seen.add(key); count++; }
    }
    return count;
  }, [filteredAllOptions]);
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
      {/* ====== MOBILE INTEGRATED HEADER ====== */}
      <div className="md:hidden -mx-4 -mt-4 mb-4 px-4 pt-4 pb-4 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] rounded-b-3xl">
        <div className="flex items-start justify-between pb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1 opacity-80">
              <span className="text-[10px] font-bold text-purple-600 tracking-wider uppercase">Radio Management</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
              Radio Unit
            </h1>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center hover:bg-purple-100 transition-colors shrink-0"
          >
            <Home className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Page Header (Desktop) ── */}
      <motion.div variants={itemVariants} className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Radio Unit</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manajemen aset radio unit kendaraan</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setIsDuplicateSnModalOpen(true)}
            className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200 gap-2 font-semibold shadow-sm"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Cek Duplikat SN</span>
          </Button>

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
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {/* Total Unit */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-3.5 md:p-5 shadow-sm text-white bg-gradient-to-br from-[#059669] to-[#047857] cursor-default"
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-3 md:gap-4">
            <div className="flex items-start justify-between">
              <span className="text-xs md:text-sm font-semibold opacity-90 tracking-wide">Total Unit</span>
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <RadioIcon className="w-3.5 h-3.5 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl md:text-3xl font-bold tracking-tight leading-none">{realTotalCount.toLocaleString()}</p>
              <p className="text-[10px] md:text-xs opacity-80 font-medium">hal {page}/{totalPages}</p>
            </div>
          </div>
        </motion.div>

        {/* Trunking */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-3.5 md:p-5 shadow-sm text-white bg-gradient-to-br from-[#0ea5e9] to-[#1d4ed8] cursor-default"
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-3 md:gap-4">
            <div className="flex items-start justify-between">
              <span className="text-xs md:text-sm font-semibold opacity-90 tracking-wide">Trunking</span>
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <RadioIcon className="w-3.5 h-3.5 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl md:text-3xl font-bold tracking-tight leading-none">{trunkingCount}</p>
              <p className="text-[10px] md:text-xs opacity-80 font-medium">aktif</p>
            </div>
          </div>
        </motion.div>

        {/* Konvensional */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-3.5 md:p-5 shadow-sm text-white bg-gradient-to-br from-[#14b8a6] to-[#047857] cursor-default"
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-3 md:gap-4">
            <div className="flex items-start justify-between">
              <span className="text-xs md:text-sm font-semibold opacity-90 tracking-wide">Konvensional</span>
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <RadioIcon className="w-3.5 h-3.5 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl md:text-3xl font-bold tracking-tight leading-none">{konvensionalCount}</p>
              <p className="text-[10px] md:text-xs opacity-80 font-medium">aktif</p>
            </div>
          </div>
        </motion.div>

        {/* Duplikat ID */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-3.5 md:p-5 shadow-sm text-white bg-gradient-to-br from-[#f43f5e] to-[#b91c1c] cursor-default"
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-3 md:gap-4">
            <div className="flex items-start justify-between">
              <span className="text-xs md:text-sm font-semibold opacity-90 tracking-wide">Duplikat ID</span>
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Copy className="w-3.5 h-3.5 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl md:text-3xl font-bold tracking-tight leading-none">{duplikatCount}</p>
              <p className="text-[10px] md:text-xs opacity-80 font-medium">radio</p>
            </div>
          </div>
        </motion.div>

        {/* Scrap */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-3.5 md:p-5 shadow-sm text-white bg-gradient-to-br from-[#f59e0b] to-[#ea580c] cursor-default"
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-3 md:gap-4">
            <div className="flex items-start justify-between">
              <span className="text-xs md:text-sm font-semibold opacity-90 tracking-wide">Scrap</span>
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Tag className="w-3.5 h-3.5 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl md:text-3xl font-bold tracking-tight leading-none">{scrapCount}</p>
              <p className="text-[10px] md:text-xs opacity-80 font-medium">di-scrap</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Mobile Filter ── */}
      <div className="md:hidden flex flex-col gap-3 bg-[#f0fdf4] p-4 rounded-xl border border-emerald-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
          <Input placeholder="Cari nomor aset, unit, SN, ID radio..." value={search} onChange={(e) => { const v = e.target.value; if (v && !search) setPageBeforeSearch(page); setSearch(v); setPage(v ? 1 : pageBeforeSearch); }} className="pl-10 pr-4 py-2.5 h-10 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm bg-emerald-50 text-gray-900 placeholder-emerald-400" />
        </div>
        <div className="flex flex-wrap gap-2 relative z-30 pb-1">
          <div className="relative shrink-0">
            <button onClick={() => document.getElementById("mobile-dropdown-divisi")?.classList.remove("hidden")} className="flex items-center justify-between h-8 rounded-lg bg-emerald-50 px-3 text-gray-800 text-xs font-medium select-none min-w-[90px]">
              <span className="truncate max-w-[100px]">{filterDivisi || "Divisi"}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>
          </div>
          <div className="relative shrink-0">
            <button onClick={() => document.getElementById("mobile-dropdown-dept")?.classList.remove("hidden")} className="flex items-center justify-between h-8 rounded-lg bg-emerald-50 px-3 text-gray-800 text-xs font-medium select-none min-w-[90px]">
              <span className="truncate max-w-[100px]">{filterDepartment || "Dept"}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>
          </div>
          <div className="relative shrink-0">
            <button onClick={() => document.getElementById("mobile-dropdown-type")?.classList.remove("hidden")} className="flex items-center justify-between h-8 rounded-lg bg-emerald-50 px-3 text-gray-800 text-xs font-medium select-none min-w-[90px]">
              <span className="truncate max-w-[100px]">{filterType || "Type"}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>
          </div>
          <div className="relative shrink-0">
            <button onClick={() => document.getElementById("mobile-dropdown-jenis")?.classList.remove("hidden")} className="flex items-center justify-between h-8 rounded-lg bg-emerald-50 px-3 text-gray-800 text-xs font-medium select-none min-w-[90px]">
              <span className="truncate max-w-[100px]">{filterJenis || "Jenis"}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>
          </div>
        </div>
        
        {/* Mobile Checkboxes */}
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${filterDuplikat ? 'bg-red-500 border-red-500' : 'border-emerald-300 bg-white'}`}>
              {filterDuplikat && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
              <input type="checkbox" checked={filterDuplikat} onChange={(e) => { setFilterDuplikat(e.target.checked); }} className="sr-only" />
            </div>
            <span className="text-xs font-medium text-emerald-900">Duplikat ID</span>
            {duplikatCount > 0 && <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">{duplikatCount}</span>}
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${filterNoGrafir ? 'bg-orange-500 border-orange-500' : 'border-emerald-300 bg-white'}`}>
              {filterNoGrafir && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
              <input type="checkbox" checked={filterNoGrafir} onChange={(e) => { setFilterNoGrafir(e.target.checked); }} className="sr-only" />
            </div>
            <span className="text-xs font-medium text-emerald-900">No Grafir</span>
            {noGrafirCount > 0 && <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">{noGrafirCount}</span>}
          </label>
        </div>
      </div>

      {/* ── Filter Panel (Desktop) ── */}
      <motion.div variants={itemVariants} className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm">
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
                      onChange={(e) => { const v = e.target.value; if (v && !search) setPageBeforeSearch(page); setSearch(v); setPage(v ? 1 : pageBeforeSearch); }}
                    />
                  </div>
                </div>

                {/* Dropdowns */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  <FilterSelect value={filterDivisi} onChange={(v) => { setFilterDivisi(v); }} options={divisiOptions} placeholder="Semua Divisi" color="emerald" />
                  <FilterSelect value={filterDepartment} onChange={(v) => { setFilterDepartment(v); }} options={departmentOptions} placeholder="Semua Dept" color="emerald" />
                  <FilterSelect value={filterType} onChange={(v) => { setFilterType(v); }} options={typeOptions} placeholder="Semua Type" color="emerald" />
                  <FilterSelect value={filterFleet} onChange={(v) => { setFilterFleet(v); }} options={fleetOptions} placeholder="Semua Fleet" color="emerald" />
                  <FilterSelect value={filterJenis} onChange={(v) => { setFilterJenis(v); }} options={["Trunking", "Konvensional"]} placeholder="Semua Jenis" color="emerald" />
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${filterDuplikat ? "bg-red-500 border-red-500" : "border-gray-300 group-hover:border-red-400"}`}>
                      {filterDuplikat && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      <input type="checkbox" checked={filterDuplikat} onChange={(e) => { setFilterDuplikat(e.target.checked); }} className="sr-only" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Duplikat ID</span>
                    {duplikatCount > 0 && <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">{duplikatCount}</span>}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${filterNoGrafir ? "bg-orange-500 border-orange-500" : "border-gray-300 group-hover:border-orange-400"}`}>
                      {filterNoGrafir && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      <input type="checkbox" checked={filterNoGrafir} onChange={(e) => { setFilterNoGrafir(e.target.checked); }} className="sr-only" />
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

      {/* ── Data Table (Desktop) ── */}
      <motion.div variants={itemVariants} className="hidden md:block rounded-xl border bg-white shadow-sm">
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
                  const snLower = item.serialNumber?.trim()?.toLowerCase();
                  const isDuplicateSn = !!(snLower && snLower !== "-" && snLower !== "n/a" && duplicateSns.has(snLower));

                  let rowBg = "hover:bg-gray-50";
                  if (item.isDuplicateId) rowBg = "bg-red-50 hover:bg-red-100";
                  else if (isDuplicateSn) rowBg = "bg-amber-50 hover:bg-amber-100";
                  else if (isNoGrafir(item.nomorAset)) rowBg = "bg-orange-50 hover:bg-orange-100";
                  
                  return (
                    <tr key={item.id} className={`border-b border-gray-100 transition-colors ${rowBg}`}>
                      <td className="font-medium py-3 px-4 whitespace-nowrap">{item.nomorAset || "-"}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{item.nomorLv || item.nomorUnit || "-"}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`font-mono ${isDuplicateSn ? "text-amber-700 font-bold" : ""}`}>
                          {item.serialNumber || "-"}
                        </span>
                      </td>
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
      {/* ── Mobile Card View ── */}
      <div className="md:hidden flex flex-col gap-3 mt-4">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm">Tidak ada data radio unit</div>
        ) : filteredData.map((item) => {
          const fleetList = parseFleetList(item.fleet);
          return (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  item.isTrunking ? 'bg-blue-100 text-blue-700' : item.isConventional ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {item.isTrunking ? 'Trunking' : item.isConventional ? 'Konvensional' : 'N/A'}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{item.nomorAset || "-"}</p>
                <p className="text-xs text-gray-500 mt-0.5">Unit: {item.nomorLv || "-"} • SN: {item.serialNumber || "-"}</p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5">
                <div><span className="text-gray-400">Type:</span> {item.type || "-"}</div>
                <div><span className="text-gray-400">Divisi:</span> {item.division || "-"}</div>
                <div><span className="text-gray-400">Dept:</span> {item.department || "-"}</div>
                <div><span className="text-gray-400">ID Radio:</span> <span className={item.isDuplicateId ? "text-red-600 font-bold" : ""}>{item.radioId || "-"}</span></div>
                <div><span className="text-gray-400">Mark:</span> {item.mark || "-"}</div>
              </div>
              {fleetList.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-xs text-gray-400 mr-1 font-medium">Fleet:</span>
                  {fleetList.slice(0, 4).map((f, i) => {
                    const colorClass = fleetColorMap.get(f) ?? "bg-gray-100 border-gray-300 text-gray-700";
                    return <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono font-semibold ${colorClass}`}>{f}</span>;
                  })}
                  {fleetList.length > 4 && <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 border border-gray-300 text-gray-600 text-xs font-semibold">+{fleetList.length - 4}</span>}
                </div>
              )}
              <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  {item.isScrap && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-semibold">Scrap</span>}
                  {item.isDuplicateId && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold border border-red-200">Duplikat ID: {item.radioId || "-"}</span>}
                </div>
                <div className="flex gap-1 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
                  {hasPermission("radio.view") && <Button variant="ghost" size="sm" onClick={() => { setSelectedRadio(item); setIsHistoryOpen(true); }}><History className="h-4 w-4" /></Button>}
                  {hasPermission("radio.update") && <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}><Edit2 className="h-4 w-4" /></Button>}
                  {hasPermission("radio.delete") && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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
      {hasPermission("radio.create") && (
        <button
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          className="md:hidden fixed bottom-24 right-4 z-30 flex items-center gap-2 bg-[#9333ea] hover:bg-purple-700 text-white px-5 py-3.5 rounded-full shadow-lg font-bold shadow-purple-500/40 transition-all active:scale-95 text-[15px]"
        >
          <Plus className="w-5 h-5" /> Tambah
        </button>
      )}

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
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
              <FormMobileSelect value={formData.type || ""} onChange={(val) => setFormData({ ...formData, type: val })} options={typeOptions} placeholder="e.g. Motorola XPR" color="emerald" label="Pilih Type" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Divisi (DIV)</label>
              <FormMobileSelect value={formData.division || ""} onChange={(val) => setFormData({ ...formData, division: val })} options={divisiOptions} placeholder="Pilih Divisi (e.g. Mining)" color="emerald" label="Pilih Divisi" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Department (Dept)</label>
              <FormMobileSelect value={formData.department || ""} onChange={(val) => setFormData({ ...formData, department: val })} options={departmentOptions} placeholder="Pilih Dept (e.g. MOD)" color="emerald" label="Pilih Department" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal</label>
              <FormMobileDatePicker
                date={formData.tanggal ? new Date(formData.tanggal) : undefined}
                onSelect={(date) => {
                  if (date) {
                    const offset = date.getTimezoneOffset();
                    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                    setFormData({ ...formData, tanggal: localDate.toISOString().split('T')[0] });
                  } else {
                    setFormData({ ...formData, tanggal: "" });
                  }
                }}
                placeholder="Pilih tanggal"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fleet</label>
              <FormMobileSelect
                value={formData.fleet || ""}
                onChange={(val) => setFormData({ ...formData, fleet: val })}
                options={fleetOptions}
                placeholder="Pilih atau ketik Fleet..."
                label="Pilih Fleet"
                color="emerald"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ID Radio</label>
              <Input value={formData.radioId} placeholder="e.g. 100" onChange={(e) => setFormData({ ...formData, radioId: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mark</label>
              <Input value={formData.mark} placeholder="e.g. OK" onChange={(e) => setFormData({ ...formData, mark: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
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

          {/* ── Footer: Error Banner + Tombol ── */}
          <div className="flex flex-col gap-3 pt-2 border-t border-gray-100 mt-2">
            {formError && (
              <div className="flex items-start gap-3 w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                <div className="flex-1"><p className="font-semibold">Gagal menyimpan</p><p className="mt-0.5 opacity-90">{formError}</p></div>
                <button onClick={() => setFormError(null)} className="ml-auto flex-shrink-0 text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); setFormError(null); }}>Batal</Button>
              <Button onClick={isEditOpen ? handleUpdate : handleCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isEditOpen ? "Simpan Perubahan" : "Tambah Radio"}
              </Button>
            </div>
          </div>
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
        onImportSuccess={() => {
            loadData();
            radioApi.getAllUnpaged("Unit", false)
              .then((r) => setAllOptions(r.data.data))
              .catch(() => {});
          }}
        importApiCall={radioApi.importUnit}
      />

      {/* ── Duplicate SN Modal ── */}
      <DuplicateSnModal
        isOpen={isDuplicateSnModalOpen}
        onClose={() => setIsDuplicateSnModalOpen(false)}
      />

      {/* ── History Modal ── */}
      <RadioHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        radioId={selectedRadio?.id || null}
      />

      {/* ========== MOBILE FILTER MODALS ========== */}
      <div id="mobile-dropdown-divisi" className="hidden fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => document.getElementById("mobile-dropdown-divisi")?.classList.add("hidden")}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[70vh] animate-in slide-in-from-bottom-8 duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
            <h3 className="font-bold text-gray-800">Pilih Divisi</h3>
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            <div className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${!filterDivisi ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { setFilterDivisi(""); document.getElementById("mobile-dropdown-divisi")?.classList.add("hidden"); }}>
              Semua Divisi {!filterDivisi && <Check className="w-4 h-4" />}
            </div>
            {divisiOptions.map((opt) => (
              <div key={opt} className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${filterDivisi === opt ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { setFilterDivisi(opt); document.getElementById("mobile-dropdown-divisi")?.classList.add("hidden"); }}>
                {opt} {filterDivisi === opt && <Check className="w-4 h-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="mobile-dropdown-dept" className="hidden fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => document.getElementById("mobile-dropdown-dept")?.classList.add("hidden")}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[70vh] animate-in slide-in-from-bottom-8 duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
            <h3 className="font-bold text-gray-800">Pilih Dept</h3>
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            <div className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${!filterDepartment ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { setFilterDepartment(""); document.getElementById("mobile-dropdown-dept")?.classList.add("hidden"); }}>
              Semua Dept {!filterDepartment && <Check className="w-4 h-4" />}
            </div>
            {departmentOptions.map((opt) => (
              <div key={opt} className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${filterDepartment === opt ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { setFilterDepartment(opt); document.getElementById("mobile-dropdown-dept")?.classList.add("hidden"); }}>
                {opt} {filterDepartment === opt && <Check className="w-4 h-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="mobile-dropdown-type" className="hidden fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => document.getElementById("mobile-dropdown-type")?.classList.add("hidden")}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[70vh] animate-in slide-in-from-bottom-8 duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
            <h3 className="font-bold text-gray-800">Pilih Type</h3>
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            <div className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${!filterType ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { setFilterType(""); document.getElementById("mobile-dropdown-type")?.classList.add("hidden"); }}>
              Semua Type {!filterType && <Check className="w-4 h-4" />}
            </div>
            {typeOptions.map((opt) => (
              <div key={opt} className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${filterType === opt ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { setFilterType(opt); document.getElementById("mobile-dropdown-type")?.classList.add("hidden"); }}>
                {opt} {filterType === opt && <Check className="w-4 h-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="mobile-dropdown-jenis" className="hidden fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => document.getElementById("mobile-dropdown-jenis")?.classList.add("hidden")}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[70vh] animate-in slide-in-from-bottom-8 duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
            <h3 className="font-bold text-gray-800">Pilih Jenis</h3>
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            <div className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${!filterJenis ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { setFilterJenis(""); document.getElementById("mobile-dropdown-jenis")?.classList.add("hidden"); }}>
              Semua Jenis {!filterJenis && <Check className="w-4 h-4" />}
            </div>
            {["Trunking", "Konvensional"].map((opt) => (
              <div key={opt} className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${filterJenis === opt ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { setFilterJenis(opt); document.getElementById("mobile-dropdown-jenis")?.classList.add("hidden"); }}>
                {opt} {filterJenis === opt && <Check className="w-4 h-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
