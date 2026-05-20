import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, cubicBezier, Variants } from "framer-motion";
import { hasPermission } from "../../utils/permissionUtils";
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
  Package,
} from "lucide-react";
import { radioApi, RadioDto, CreateRadioDto } from "../../services/radioApi";
import RadioHistoryModal from "./RadioHistoryModal";
import RadioImportModal from "./RadioImportModal";
import { useToast } from "../../hooks/use-toast";
import { parseRadioResponse } from "../../utils/radioHelpers";
import { FormMobileDatePicker } from "./FormMobileDatePicker";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  Download, 
  Calendar,
  Home,
  Check,
} from "lucide-react";

import { format } from "date-fns";
import { id as dateFnsLocale } from "date-fns/locale";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { id as localeId } from "react-day-picker/locale";

// ─── Animation Variants ──────────────────────────────────────────────────────

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

// ─── Category Badge ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category?: string }) {
  const map: Record<string, string> = {
    Internal: "bg-violet-100 text-violet-700 border-violet-200",
    Contractor: "bg-blue-100 text-blue-700 border-blue-200",
    Unit: "bg-green-100 text-green-700 border-green-200",
    LegacyScrap: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const cls = map[category ?? ""] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${cls}`}>
      {category || "-"}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RadioScrapPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Data State ──────────────────────────────────────────────────────────────
  const [data, setData] = useState<RadioDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ── Pagination ──────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // ── Filter State ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // State Date Range Popover
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const deskCalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (deskCalRef.current && !deskCalRef.current.contains(e.target as Node)) {
        setDateRangeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatRangeLabel = () => {
    if (!filterDateFrom && !filterDateTo) return "Pilih Rentang Tanggal";
    if (filterDateFrom && !filterDateTo) return format(new Date(filterDateFrom), "d MMM yyyy", { locale: dateFnsLocale });
    if (filterDateFrom === filterDateTo) return format(new Date(filterDateFrom), "d MMM yyyy", { locale: dateFnsLocale });
    return `${format(new Date(filterDateFrom), "d MMM yyyy", { locale: dateFnsLocale })} – ${format(new Date(filterDateTo), "d MMM yyyy", { locale: dateFnsLocale })}`;
  };

  // ── Modal State ─────────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedRadio, setSelectedRadio] = useState<RadioDto | null>(null);

  // ── Load Options (unpaged, untuk menghitung statistik akurat) ───────────────
  const [allOptions, setAllOptions] = useState<RadioDto[]>([]);
  useEffect(() => {
    radioApi.getAllUnpaged(undefined, true)
      .then((r) => setAllOptions(r.data.data))
      .catch(() => {});
  }, []);

  // ── Form Error ──────────────────────────────────────────────────────────────
  const [formError, setFormError] = useState<string | null>(null);

  // ── Form State ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<CreateRadioDto>({
    category: "LegacyScrap",
    nomorAset: "",
    nomorUnit: "",
    nomorLv: "",
    serialNumber: "",
    type: "",
    company: "",
    department: "",
    division: "",
    channel: "",
    tanggal: "",
    fleet: "",
    radioId: "",
    mark: "",
    isTrunking: false,
    isConventional: false,
    isScrap: true,
    scrapJobNumber: "",
    dateScrapped: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  // ── Load Data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    loadData();
  }, [page, search, filterCategory, filterDateFrom, filterDateTo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await radioApi.getAll({
        isScrap: true,
        category: filterCategory || undefined,
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
      });
      const { items, totalCount: tc, totalPages: tp } = parseRadioResponse(response.data);
      setData(items);
      setTotalCount(tc);
      setTotalPages(tp);
    } catch {
      toast({ title: "Error", description: "Failed to load Scrap radios", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── CRUD Handlers ───────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setFormError(null);
    try {
      await radioApi.create(formData);
      toast({ title: "Berhasil", description: "Data scrap radio berhasil ditambahkan" });
      setIsCreateOpen(false);
      loadData();
      resetForm();
    } catch (error: any) {
      setFormError(error.response?.data?.message || "Gagal menambahkan data");
    }
  };

  const handleUpdate = async () => {
    if (!selectedRadio) return;
    setFormError(null);
    try {
      await radioApi.update(selectedRadio.id, formData);
      toast({ title: "Berhasil", description: "Data scrap radio berhasil diperbarui" });
      setIsEditOpen(false);
      loadData();
      resetForm();
    } catch (error: any) {
      setFormError(error.response?.data?.message || "Gagal memperbarui data");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Yakin ingin menghapus data scrap ini?")) return;
    try {
      await radioApi.delete(id);
      toast({ title: "Berhasil", description: "Data berhasil dihapus" });
      loadData();
    } catch {
      toast({ title: "Error", description: "Gagal menghapus data", variant: "destructive" });
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("PERINGATAN: Yakin ingin menghapus SEMUA data Radio Scrap? Tindakan ini tidak dapat dibatalkan!")) return;
    try {
      await radioApi.deleteAllScrap();
      toast({ title: "Berhasil", description: "Semua data Radio Scrap berhasil dihapus" });
      loadData();
    } catch {
      toast({ title: "Error", description: "Gagal menghapus semua data", variant: "destructive" });
    }
  };

  const openEditModal = (radio: RadioDto) => {
    setSelectedRadio(radio);
    setFormData({
      category: radio.category || "LegacyScrap",
      nomorAset: radio.nomorAset || "",
      nomorUnit: radio.nomorUnit || "",
      nomorLv: radio.nomorLv || "",
      serialNumber: radio.serialNumber || "",
      type: radio.type || "",
      company: radio.company || "",
      department: radio.department || "",
      division: radio.division || "",
      channel: radio.channel || "",
      tanggal: radio.tanggal ? radio.tanggal.split("T")[0] : "",
      fleet: radio.fleet || "",
      radioId: radio.radioId || "",
      mark: radio.mark || "",
      isTrunking: radio.isTrunking,
      isConventional: radio.isConventional,
      isScrap: radio.isScrap,
      scrapJobNumber: radio.scrapJobNumber || "",
      dateScrapped: radio.dateScrapped
        ? radio.dateScrapped.split("T")[0]
        : new Date().toISOString().split("T")[0],
      remarks: radio.remarks || "",
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      category: "LegacyScrap",
      nomorAset: "",
      nomorUnit: "",
      nomorLv: "",
      serialNumber: "",
      type: "",
      company: "",
      department: "",
      division: "",
      channel: "",
      tanggal: "",
      fleet: "",
      radioId: "",
      mark: "",
      isTrunking: false,
      isConventional: false,
      isScrap: true,
      scrapJobNumber: "",
      dateScrapped: new Date().toISOString().split("T")[0],
      remarks: "",
    });
    setSelectedRadio(null);
  };

  const resetFilters = () => {
    setSearch("");
    setFilterCategory("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setDateRange(undefined);
    setPage(1);
  };

  // ── Active Filter Count ─────────────────────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (filterCategory) count++;
    if (filterDateFrom) count++;
    if (filterDateTo) count++;
    return count;
  }, [search, filterCategory, filterDateFrom, filterDateTo]);

  // ── Calculate Stats from All Unpaged Data based on active filters ──────────
  const filteredAllOptions = useMemo(() => {
    let result = allOptions;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(d => 
        (d.nomorAset || "").toLowerCase().includes(s) ||
        (d.radioId || "").toLowerCase().includes(s) ||
        (d.serialNumber || "").toLowerCase().includes(s) ||
        (d.scrapJobNumber || "").toLowerCase().includes(s) ||
        (d.company || "").toLowerCase().includes(s) ||
        (d.nomorLv || "").toLowerCase().includes(s)
      );
    }
    if (filterCategory) result = result.filter(d => d.category === filterCategory);
    
    if (filterDateFrom) {
      const from = new Date(filterDateFrom);
      result = result.filter(d => {
        const scrapped = d.dateScrapped ? new Date(d.dateScrapped) : null;
        return scrapped && scrapped >= from;
      });
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(d => {
        const scrapped = d.dateScrapped ? new Date(d.dateScrapped) : null;
        return scrapped && scrapped <= to;
      });
    }

    return result;
  }, [allOptions, search, filterCategory, filterDateFrom, filterDateTo]);

  // ── Stat Counts ─────────────────────────────────────────────────────────────
  const internalCount = useMemo(() => filteredAllOptions.filter((d) => d.category === "Internal").length, [filteredAllOptions]);
  const contractorCount = useMemo(() => filteredAllOptions.filter((d) => d.category === "Contractor").length, [filteredAllOptions]);
  const legacyCount = useMemo(() => filteredAllOptions.filter((d) => d.category === "LegacyScrap" || d.category === "Unit").length, [filteredAllOptions]);

  // ── Export Functions ────────────────────────────────────────────────────────
  const [isExportingNormal, setIsExportingNormal] = useState(false);
  const [isExportingTahunan, setIsExportingTahunan] = useState(false);

  const handleExportNormal = async () => {
    setIsExportingNormal(true);
    try {
      const res = await radioApi.getAllUnpaged(filterCategory || undefined, true);
      let exportData = res.data.data;

      if (search) {
        const s = search.toLowerCase();
        exportData = exportData.filter((item: RadioDto) =>
          (item.nomorAset || "").toLowerCase().includes(s) ||
          (item.serialNumber || "").toLowerCase().includes(s) ||
          (item.radioId || "").toLowerCase().includes(s) ||
          (item.scrapJobNumber || "").toLowerCase().includes(s) ||
          (item.company || "").toLowerCase().includes(s) ||
          (item.nomorLv || "").toLowerCase().includes(s)
        );
      }
      if (filterDateFrom) {
        const from = new Date(filterDateFrom);
        exportData = exportData.filter((item: RadioDto) => {
          const scrapped = item.dateScrapped ? new Date(item.dateScrapped) : null;
          return scrapped && scrapped >= from;
        });
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        exportData = exportData.filter((item: RadioDto) => {
          const scrapped = item.dateScrapped ? new Date(item.dateScrapped) : null;
          return scrapped && scrapped <= to;
        });
      }

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Radio Scrap Filtered");
      ws.columns = [
        { header: "NO", key: "no", width: 5 },
        { header: "KATEGORI", key: "kategori", width: 15 },
        { header: "NO ASET / COMPANY", key: "aset", width: 25 },
        { header: "SERIAL NUMBER", key: "sn", width: 20 },
        { header: "TYPE", key: "type", width: 20 },
        { header: "DIVISI", key: "divisi", width: 15 },
        { header: "DEPT", key: "dept", width: 15 },
        { header: "JENIS", key: "jenis", width: 15 },
        { header: "JOB NUMBER", key: "job", width: 20 },
        { header: "TGL SCRAP", key: "tgl", width: 15 },
        { header: "REMARK", key: "remark", width: 30 },
      ];

      ws.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF991B1B" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      exportData.forEach((item: RadioDto, i: number) => {
        ws.addRow({
          no: i + 1,
          kategori: item.category,
          aset: item.nomorAset || item.company || item.nomorLv || "-",
          sn: item.serialNumber || "-",
          type: item.type || "-",
          divisi: item.division || "-",
          dept: item.department || "-",
          jenis: item.isTrunking ? "Trunking" : item.isConventional ? "Konvensional" : "-",
          job: item.scrapJobNumber || "-",
          tgl: item.dateScrapped ? new Date(item.dateScrapped).toISOString().split("T")[0] : "-",
          remark: item.remarks || "-",
        });
      });

      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf]), `RadioScrap_Filtered_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast({ title: "Berhasil", description: `${exportData.length} data diekspor.` });
    } catch (e) {
      toast({ title: "Gagal", description: "Gagal ekspor data.", variant: "destructive" });
    } finally {
      setIsExportingNormal(false);
    }
  };

  const handleExportTahunan = async () => {
    setIsExportingTahunan(true);
    try {
      const res = await radioApi.getAllUnpaged(undefined, true);
      const allScrap = res.data.data;

      const trunking = allScrap.filter((x: RadioDto) => x.isTrunking);
      const conventional = allScrap.filter((x: RadioDto) => x.isConventional);

      // Hardcoded data based on user request (2022-2025)
      const hardcodedTrunking: Record<number, number[]> = {
        2022: [0, 2, 3, 5, 2, 1, 31, 45, 57, 36, 19, 10],
        2023: [2, 1, 3, 48, 5, 9, 2, 4, 6, 0, 4, 4],
        2024: [5, 4, 6, 5, 4, 4, 6, 4, 9, 5, 8, 3],
        2025: [3, 1, 4, 7, 11, 2, 26, 7, 6, 5, 0, 0]
      };

      const hardcodedConv: Record<number, number[]> = {
        2022: [2, 2, 3, 0, 1, 4, 3, 3, 0, 2, 9, 2],
        2023: [1, 0, 0, 18, 0, 6, 0, 1, 1, 7, 0, 2],
        2024: [1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1],
        2025: [1, 1, 3, 0, 0, 3, 5, 0, 0, 0, 0, 0]
      };

      // Ensure template exactly matches 2022 to 2037 as requested
      const allYears: number[] = [];
      for (let y = 2022; y <= 2037; y++) allYears.push(y);

      const buildTable = (data: RadioDto[], type: "trunking" | "conv") => {
        const rows: number[][] = [];
        const hardcodeMap = type === "trunking" ? hardcodedTrunking : hardcodedConv;

        for (let m = 0; m < 12; m++) {
          const monthRow = allYears.map(y => {
            // Use hardcoded data for 2022-2025
            if (y >= 2022 && y <= 2025) {
              return hardcodeMap[y][m];
            }
            // Use realtime data from database for 2026 onwards
            return data.filter((d: RadioDto) => {
              if (!d.dateScrapped) return false;
              const date = new Date(d.dateScrapped);
              return date.getFullYear() === y && date.getMonth() === m;
            }).length;
          });
          rows.push(monthRow);
        }
        return rows;
      };

      const paddedTrunking = buildTable(trunking, "trunking");
      const paddedConv = buildTable(conventional, "conv");
      const paddedTotal = paddedTrunking.map((row, m) => 
        row.map((val, i) => val + paddedConv[m][i])
      );

      const wb = new ExcelJS.Workbook();
      const wsConv = wb.addWorksheet("Conventional Radio");
      const wsTrunk = wb.addWorksheet("Trunking Radio");
      const wsTotal = wb.addWorksheet("TOTAL PER TAHUN");

      // Function to add raw data table
      const addRawDataToSheet = (ws: ExcelJS.Worksheet, data: RadioDto[]) => {
        ws.columns = [
          { header: "No.", key: "no", width: 5 },
          { header: "Type", key: "type", width: 15 },
          { header: "Serial Number", key: "sn", width: 20 },
          { header: "Job Number", key: "job", width: 15 },
          { header: "Date Scrapped", key: "date", width: 20 },
          { header: "remarks", key: "remark", width: 30 },
        ];

        ws.getRow(1).eachCell(cell => {
          cell.font = { bold: true };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        data.forEach((item, i) => {
          const formattedDate = item.dateScrapped 
            ? format(new Date(item.dateScrapped), "dd-MMM-yy") 
            : "";
          const row = ws.addRow({
            no: i + 1,
            type: item.type || "-",
            sn: item.serialNumber || "-",
            job: item.scrapJobNumber || "-",
            date: formattedDate || "-",
            remark: item.remarks || "-",
          });
          row.eachCell(cell => {
            cell.alignment = { horizontal: "center" };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          });
        });
      };

      addRawDataToSheet(wsConv, conventional);
      addRawDataToSheet(wsTrunk, trunking);

      // Function to add summary table to sheet
      const addTableToSheet = (ws: ExcelJS.Worksheet, title: string, dataRows: number[][], startRow: number) => {
        ws.getCell(`A${startRow}`).value = title;
        ws.getCell(`A${startRow}`).font = { size: 16, bold: true, italic: true, underline: true };

        const headerRow = ws.getRow(startRow + 2);
        headerRow.getCell(1).value = "";
        headerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5C282' } };
        allYears.forEach((y, i) => {
          const cell = headerRow.getCell(i + 2);
          cell.value = y;
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5C282' } };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let r = startRow + 3;
        for (let m = 0; m < 12; m++) {
          const row = ws.getRow(r);
          row.getCell(1).value = months[m];
          row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5C282' } };
          row.getCell(1).font = { bold: true };
          row.getCell(1).alignment = { horizontal: 'center' };
          row.getCell(1).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

          allYears.forEach((y, i) => {
            const val = dataRows[m][i];
            const cell = row.getCell(i + 2);
            cell.value = val;
            cell.alignment = { horizontal: 'center' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          });
          r++;
        }

        const totalRow = ws.getRow(r);
        totalRow.getCell(1).value = "Total";
        totalRow.getCell(1).font = { bold: true };
        totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
        totalRow.getCell(1).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        totalRow.getCell(1).alignment = { horizontal: 'center' };

        allYears.forEach((y, i) => {
          let sum = 0;
          for (let m = 0; m < 12; m++) sum += dataRows[m][i];
          const cell = totalRow.getCell(i + 2);
          cell.value = sum;
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        return r + 3;
      };

      let nextRow = addTableToSheet(wsTotal, "Radio Trunking Scrap", paddedTrunking, 1);
      nextRow = addTableToSheet(wsTotal, "Radio Conventional Scrap", paddedConv, nextRow);
      addTableToSheet(wsTotal, "Total Radio Scrap (Conventional + Trunking)", paddedTotal, nextRow);

      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf]), `RadioScrap_Tahunan_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast({ title: "Berhasil", description: "Laporan tahunan berhasil diekspor." });
    } catch (e) {
      toast({ title: "Gagal", description: "Gagal ekspor laporan tahunan.", variant: "destructive" });
    } finally {
      setIsExportingTahunan(false);
    }
  };

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
              Radio Scrap
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
      <motion.div
        variants={itemVariants}
        className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Radio Scrap</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Semua aset radio yang telah di-scrap dari seluruh kategori
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPermission("radio.delete.all.scrap") && (
            <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete All
            </Button>
          )}
          {hasPermission("radio.scrap.import") && (
            <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
              <Upload className="w-4 h-4 mr-1.5" />
              Import Legacy
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-slate-50 text-slate-700" disabled={isExportingNormal || isExportingTahunan}>
                {(isExportingNormal || isExportingTahunan) ? (
                  <div className="w-4 h-4 mr-1.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-1.5" />
                )}
                {(isExportingNormal || isExportingTahunan) ? "Exporting..." : "Export Data"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={(e) => {
                  if (isExportingNormal || isExportingTahunan) {
                    e.preventDefault();
                  } else {
                    handleExportNormal();
                  }
                }}
                className={`cursor-pointer ${isExportingNormal || isExportingTahunan ? "pointer-events-none opacity-50" : ""}`}
              >
                Export Filter Terkini
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  if (isExportingNormal || isExportingTahunan) {
                    e.preventDefault();
                  } else {
                    handleExportTahunan();
                  }
                }}
                className={`cursor-pointer ${isExportingNormal || isExportingTahunan ? "pointer-events-none opacity-50" : ""}`}
              >
                Export Data Tahunan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {hasPermission("radio.scrap.create") && (
            <Button
              size="sm"
              onClick={() => { resetForm(); setIsCreateOpen(true); }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Manual
            </Button>
          )}
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scrap */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br from-red-600 to-red-800 cursor-default"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-80">Total Scrap</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{totalCount.toLocaleString()}</p>
            <p className="text-xs opacity-70 mt-1.5 font-medium">halaman {page} / {totalPages}</p>
          </div>
        </motion.div>

        {/* Internal */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 cursor-default"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                <RadioIcon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-80">KPC</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{internalCount}</p>
            <p className="text-xs opacity-70 mt-1.5 font-medium">radio KPC</p>
          </div>
        </motion.div>

        {/* Contractor */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br from-sky-500 via-blue-600 to-blue-700 cursor-default"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                <RadioIcon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-80">Contractor</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{contractorCount}</p>
            <p className="text-xs opacity-70 mt-1.5 font-medium">radio kontraktor</p>
          </div>
        </motion.div>

        {/* Legacy */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br from-slate-500 to-slate-700 cursor-default"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-80">Legacy</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{legacyCount}</p>
            <p className="text-xs opacity-70 mt-1.5 font-medium">unit &amp; legacy scrap</p>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Mobile Filter ── */}
      <div className="md:hidden flex flex-col gap-3 bg-[#fff1f2] p-4 rounded-xl mb-4 border border-red-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" />
          <Input placeholder="Cari job number, SN, ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10 pr-4 py-2.5 h-10 border-none rounded-xl focus:ring-2 focus:ring-red-500 text-sm bg-red-50 text-gray-900 placeholder-red-400" />
        </div>
        <div className="flex flex-wrap gap-2 relative z-30 pb-1">
          <div className="relative shrink-0">
            <button onClick={() => document.getElementById("mobile-dropdown-category")?.classList.remove("hidden")} className="flex items-center justify-between h-8 rounded-lg bg-red-50 px-3 text-gray-800 text-xs font-medium select-none min-w-[100px]">
              <span className="truncate max-w-[120px]">{filterCategory || "Kategori"}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>
          </div>
          <div className="relative shrink-0 flex items-center gap-1">
             <Input type="date" className="h-8 text-xs bg-red-50 border-none rounded-lg text-gray-700" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }} />
             <span className="text-xs text-gray-400">-</span>
             <Input type="date" className="h-8 text-xs bg-red-50 border-none rounded-lg text-gray-700" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setPage(1); }} />
          </div>
        </div>
      </div>

      {/* ── Filter Panel ── */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* Filter Header */}
        <button
          onClick={() => setIsFilterOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/80 transition-colors rounded-2xl"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-red-100 rounded-lg">
              <Filter className="w-4 h-4 text-red-600" />
            </div>
            <span className="font-semibold text-gray-800 text-sm">Filter &amp; Pencarian</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-xs font-bold">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
                  {/* Search */}
                  <div className="relative sm:col-span-2 lg:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      placeholder="Cari job number, SN, ID radio..."
                      className="pl-9 h-9 text-sm border-gray-200 focus:border-red-400 focus:ring-red-400"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                  </div>

                  {/* Category */}
                  <select
                    value={filterCategory}
                    onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                    className="h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 text-gray-700"
                  >
                    <option value="">Semua Kategori</option>
                    <option value="Internal">Internal</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Unit">Unit</option>
                    <option value="LegacyScrap">LegacyScrap</option>
                  </select>

                  {/* Date Range Picker */}
                  <div className="relative sm:col-span-2 lg:col-span-2">
                    <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
                      <PopoverTrigger asChild>
                        <button className="flex items-center justify-between w-full h-9 px-3 text-sm font-medium text-left bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all shadow-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-red-500" />
                            <span className="truncate">{formatRangeLabel()}</span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div ref={deskCalRef} className="p-3 bg-white rounded-xl shadow-xl border border-gray-100">
                          <DayPicker
                            mode="range"
                            selected={dateRange}
                            onSelect={(range) => {
                              setDateRange(range);
                              if (range?.from) setFilterDateFrom(format(range.from, 'yyyy-MM-dd'));
                              else setFilterDateFrom("");
                              
                              if (range?.to) setFilterDateTo(format(range.to, 'yyyy-MM-dd'));
                              else setFilterDateTo("");
                            }}
                            locale={localeId}
                            showOutsideDays
                            className="border-0"
                            classNames={{
                              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                              month: "space-y-4",
                              caption: "flex justify-center pt-1 relative items-center mb-4",
                              caption_label: "text-sm font-semibold text-gray-900",
                              nav: "space-x-1 flex items-center bg-gray-50/50 rounded-lg p-1",
                              nav_button: "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-white rounded-md transition-all flex items-center justify-center text-gray-600 shadow-sm",
                              nav_button_previous: "absolute left-1",
                              nav_button_next: "absolute right-1",
                              table: "w-full border-collapse space-y-1",
                              head_row: "flex w-full",
                              head_cell: "text-gray-500 rounded-md w-9 font-medium text-[0.8rem] text-center",
                              row: "flex w-full mt-2",
                              cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                              day: "h-9 w-9 p-0 font-normal hover:bg-gray-100 rounded-lg transition-colors aria-selected:opacity-100",
                              day_range_start: "day-range-start bg-red-600 text-white hover:bg-red-700 rounded-l-lg rounded-r-none",
                              day_range_end: "day-range-end bg-red-600 text-white hover:bg-red-700 rounded-r-lg rounded-l-none",
                              day_range_middle: "aria-selected:bg-red-50 aria-selected:text-red-900 rounded-none",
                              day_selected: "bg-red-600 text-white hover:bg-red-700 focus:bg-red-600 focus:text-white rounded-lg font-semibold shadow-sm",
                              day_today: "bg-gray-100 text-gray-900 font-semibold",
                              day_outside: "text-gray-400 opacity-50 aria-selected:bg-red-50/50 aria-selected:text-red-900/50",
                              day_disabled: "text-gray-300 opacity-50",
                              day_hidden: "invisible",
                            }}
                          />
                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                            <button
                              onClick={() => {
                                setDateRange(undefined);
                                setFilterDateFrom("");
                                setFilterDateTo("");
                                setDateRangeOpen(false);
                              }}
                              className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
                            >
                              Hapus
                            </button>
                            <button
                              onClick={() => setDateRangeOpen(false)}
                              className="px-4 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                            >
                              Selesai
                            </button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Active Filter Chips */}
                {activeFilterCount > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    {search && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                        Cari: &quot;{search}&quot;
                        <button onClick={() => setSearch("")} className="hover:text-red-900 ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filterCategory && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        Kategori: {filterCategory}
                        <button onClick={() => setFilterCategory("")} className="hover:text-blue-900 ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filterDateFrom && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                        Dari: {filterDateFrom}
                        <button onClick={() => setFilterDateFrom("")} className="hover:text-orange-900 ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filterDateTo && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                        Sampai: {filterDateTo}
                        <button onClick={() => setFilterDateTo("")} className="hover:text-orange-900 ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
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
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Kategori</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">No. Aset / Perusahaan</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Serial Number</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Type Radio</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Divisi</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Dept</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Jenis</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Job Number</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Tanggal Scrap</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Remark</th>
                {(hasPermission("radio.view") ||
                  hasPermission("radio.scrap.update") ||
                  hasPermission("radio.scrap.delete")) && (
                    <th className="font-semibold text-gray-600 py-3 px-4 text-right whitespace-nowrap">Aksi</th>
                  )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
                      <span className="text-sm text-muted-foreground">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-10 h-10 opacity-20" />
                      <span className="text-sm">Tidak ada data yang ditemukan</span>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium">
                      {item.nomorAset || item.company || item.nomorLv || "-"}
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">{item.serialNumber || "-"}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{item.type || "-"}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{item.division || "-"}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{item.department || "-"}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.isTrunking ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold">Trunking</span>
                      ) : item.isConventional ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 text-xs font-semibold">Konvensional</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{item.scrapJobNumber || "-"}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.dateScrapped
                        ? new Date(item.dateScrapped).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                        : "-"}
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate" title={item.remarks || undefined}>
                      {item.remarks || "-"}
                    </td>
                    {(hasPermission("radio.view") ||
                      hasPermission("radio.scrap.update") ||
                      hasPermission("radio.scrap.delete")) && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-7 w-7 p-0 inline-flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {hasPermission("radio.view") && (
                                <DropdownMenuItem
                                  onClick={() => { setSelectedRadio(item); setIsHistoryOpen(true); }}
                                >
                                  <History className="mr-2 h-4 w-4" />
                                  History
                                </DropdownMenuItem>
                              )}
                              {hasPermission("radio.scrap.update") && (
                                <DropdownMenuItem onClick={() => openEditModal(item)}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {hasPermission("radio.scrap.delete") && (
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Hapus
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
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm flex flex-col items-center gap-2">
            <Package className="w-10 h-10 opacity-20" />
            <span className="text-sm">Tidak ada data yang ditemukan</span>
          </div>
        ) : data.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <CategoryBadge category={item.category} />
              <span className="text-xs text-gray-400 font-medium">
                {item.dateScrapped ? new Date(item.dateScrapped).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{item.nomorAset || item.company || item.nomorLv || "-"}</p>
              <p className="text-xs text-gray-500 mt-0.5">Job: {item.scrapJobNumber || "-"} • SN: {item.serialNumber || "-"}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5 mt-1 mb-1">
              <div><span className="text-gray-400">Type:</span> {item.type || "-"}</div>
              <div><span className="text-gray-400">Div/Dept:</span> {item.division || "-"}/{item.department || "-"}</div>
              <div>
                <span className="text-gray-400">Jenis: </span>
                {item.isTrunking ? "Trunking" : item.isConventional ? "Konvensional" : "-"}
              </div>
              <div><span className="text-gray-400">ID Radio:</span> {item.radioId || "-"}</div>
            </div>
            {item.remarks && (
              <p className="text-xs text-gray-600 italic leading-snug break-words">"{item.remarks}"</p>
            )}
            <div className="flex items-center justify-end pt-3 mt-1 border-t border-gray-100">
              <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                {hasPermission("radio.view") && <Button variant="ghost" size="sm" onClick={() => { setSelectedRadio(item); setIsHistoryOpen(true); }}><History className="h-4 w-4" /></Button>}
                {hasPermission("radio.scrap.update") && <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}><Edit2 className="h-4 w-4" /></Button>}
                {hasPermission("radio.scrap.delete") && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                )}
              </div>
            </div>
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
      {hasPermission("radio.scrap.create") && (
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
              {isEditOpen ? "Edit Scrap Radio" : "Tambah Scrap Radio Manual"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Kategori Asal</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="LegacyScrap">Legacy Scrap (Unknown Source)</option>
                <option value="Internal">Internal</option>
                <option value="Contractor">Contractor</option>
                <option value="Unit">Unit</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Scrap Job Number</label>
              <Input value={formData.scrapJobNumber} placeholder="e.g. SCRAP-2024-001" onChange={(e) => setFormData({ ...formData, scrapJobNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Scrap</label>
              <FormMobileDatePicker
                date={formData.dateScrapped ? new Date(formData.dateScrapped) : undefined}
                onSelect={(date) => {
                  if (date) {
                    const offset = date.getTimezoneOffset();
                    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                    setFormData({ ...formData, dateScrapped: localDate.toISOString().split('T')[0] });
                  } else {
                    setFormData({ ...formData, dateScrapped: "" });
                  }
                }}
                placeholder="Pilih tanggal scrap"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nomor Aset / Company</label>
              <Input
                value={formData.nomorAset}
                placeholder="Aset/Company/Unit/LV No"
                onChange={(e) => setFormData({ ...formData, nomorAset: e.target.value, company: e.target.value, nomorUnit: e.target.value, nomorLv: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Serial Number</label>
              <Input value={formData.serialNumber} placeholder="e.g. SN123456" onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type Radio</label>
              <Input value={formData.type} placeholder="e.g. Motorola XPR" onChange={(e) => setFormData({ ...formData, type: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ID Radio</label>
              <Input value={formData.radioId} placeholder="e.g. 2001" onChange={(e) => setFormData({ ...formData, radioId: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Keterangan</label>
              <Input value={formData.remarks} placeholder="Catatan tambahan..." onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
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
            <Button onClick={isEditOpen ? handleUpdate : handleCreate} className="bg-red-600 hover:bg-red-700 text-white">
              {isEditOpen ? "Simpan Perubahan" : "Tambah Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Import Modal ── */}
      <RadioImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Legacy Scrap"
        onImportSuccess={() => loadData()}
        importApiCall={radioApi.importScrap}
      />

      {/* ── History Modal ── */}
      <RadioHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        radioId={selectedRadio?.id || null}
      />

      {/* ========== MOBILE FILTER MODALS ========== */}
      <div id="mobile-dropdown-category" className="hidden fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => document.getElementById("mobile-dropdown-category")?.classList.add("hidden")}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[70vh] animate-in slide-in-from-bottom-8 duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
            <h3 className="font-bold text-gray-800">Pilih Kategori</h3>
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            <div className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${!filterCategory ? 'font-bold text-red-700 bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { setFilterCategory(""); setPage(1); document.getElementById("mobile-dropdown-category")?.classList.add("hidden"); }}>
              Semua Kategori {!filterCategory && <Check className="w-4 h-4" />}
            </div>
            {["Internal", "Contractor", "Unit", "LegacyScrap"].map((opt) => (
              <div key={opt} className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${filterCategory === opt ? 'font-bold text-red-700 bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { setFilterCategory(opt); setPage(1); document.getElementById("mobile-dropdown-category")?.classList.add("hidden"); }}>
                {opt} {filterCategory === opt && <Check className="w-4 h-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
