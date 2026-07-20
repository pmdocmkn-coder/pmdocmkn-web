import { useEffect, useState, useRef } from "react";
import {
  format, addMonths, subMonths, setMonth, setYear, getMonth, getYear,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, isWithinInterval,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { History, Package, Search, Calendar, User, CheckCircle2, RotateCcw, PenTool, FileText, Trash2, Eye, ClipboardCheck, ArrowLeft, Printer, Download, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { warehouseBorrowApi } from "../../services/warehouseBorrowApi";
import { workshopTechnicianApi, type WorkshopTechnicianDto } from "../../services/workshopTechnicianApi";
import { api } from "../../services/api";
import type { WarehouseBorrowList, WarehouseBorrowDetail } from "../../types/warehouseBorrow";
import { hasPermission } from "../../utils/permissionUtils";
import PrintMaterialDialog from "./PrintMaterialDialog";
import PrintMaterialTemplate from "./PrintMaterialTemplate";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ResponsiveModal } from "../common/ResponsiveModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useToast } from "../../hooks/use-toast";
import { Textarea } from "../ui/textarea";
import SignaturePadField from "../common/SignaturePadField";
import WarehouseBorrowDetailModal from "./WarehouseBorrowDetailModal";
import { useAuth } from "../../contexts/AuthContext";
import { FormMobileSelect } from "../Radio/FormMobileSelect";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";

interface UserLookupItem {
  id: number;
  name: string;
  username: string;
  roleName?: string | null;
}

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const toDateParam = (date: Date) => format(date, "yyyy-MM-dd");

const fromDateParam = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export default function WarehouseBorrowHistoryPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isWarehouse = user?.roleName?.toLowerCase() === "warehouse";
  const canPrintBorrow = hasPermission("warehouse.print.borrow");
  const [items, setItems] = useState<WarehouseBorrowList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Filters & Print
  const [statusFilter, setStatusFilter] = useState("all");
  const [borrowerFilter, setBorrowerFilter] = useState("all");
  const [dateRangeFrom, setDateRangeFrom] = useState("");
  const [dateRangeTo, setDateRangeTo] = useState("");
  const [monthFilter, setMonthFilter] = useState(String(new Date().getMonth()));
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [dateFilterMode, setDateFilterMode] = useState<"month" | "range">("month");
  const [dateFilterType, setDateFilterType] = useState<"month" | "range" | null>(null);
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [rangeViewMonth, setRangeViewMonth] = useState(new Date());
  const [rangePicker, setRangePicker] = useState<"month" | "year" | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printTarget, setPrintTarget] = useState<WarehouseBorrowList | null>(null);
  const [itemsToPrint, setItemsToPrint] = useState<WarehouseBorrowDetail[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  // Modal States
  const [activeItem, setActiveItem] = useState<WarehouseBorrowList | null>(null);
  const [actionType, setActionType] = useState<"issue" | "return" | "sign" | "return-sign" | null>(null);

  // Semua user terdaftar (dropdown utama)
  const [allUsers, setAllUsers] = useState<UserLookupItem[]>([]);
  // Teknisi workshop (dropdown ke-2 jika pilih Teknisi WSK)
  const [technicians, setTechnicians] = useState<WorkshopTechnicianDto[]>([]);
  // Simpan object user yang dipilih agar bisa akses roleName langsung
  const [selectedReturnerUser, setSelectedReturnerUser] = useState<UserLookupItem | null>(null);

  // Load kedua data sekaligus
  useEffect(() => {
    api.get<{ data: UserLookupItem[] }>("/api/users/lookup")
      .then((res) => {
        const users = res.data?.data ?? [];

        setAllUsers(users);
      })
      .catch(console.error);
    workshopTechnicianApi.getAllActive("Teknisi WKS").then(res => setTechnicians(res.data.data)).catch(() => setTechnicians([]));
  }, []);

  // Return form state
  const [returnCondition, setReturnCondition] = useState("Good");
  const [returnNote, setReturnNote] = useState("");
  const [returnedByName, setReturnedByName] = useState("");
  const [workshopTechName, setWorkshopTechName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Deteksi apakah user yang dipilih adalah Teknisi WSK atau punya linked teknisi
  const WORKSHOP_ROLE = "teknisi wsk";
  const selectedReturnerIsWorkshop =
    (selectedReturnerUser?.roleName ?? "").toLowerCase().trim() === WORKSHOP_ROLE;

  // Teknisi linked ke returner yang dipilih
  const linkedTechniciansForReturner = selectedReturnerUser
    ? technicians.filter(t => t.userId === selectedReturnerUser.id)
    : [];

  // Tampilkan tech picker jika role Teknisi WSK ATAU user punya linked teknisi
  const shouldShowReturnTechPicker = returnedByName && (
    selectedReturnerIsWorkshop || linkedTechniciansForReturner.length > 0
  );

  // Auto-detect user yang dipilih dari returnedByName (fallback jika FormMobileSelect tidak trigger onChange dengan object)
  useEffect(() => {
    if (returnedByName && allUsers.length > 0) {
      const found = allUsers.find(u => u.name === returnedByName);
      if (found) {
        // Hanya update jika berbeda (bandingkan by id untuk avoid loop)
        if (!selectedReturnerUser || selectedReturnerUser.id !== found.id) {
          setSelectedReturnerUser(found);
        }
      }
    } else if (!returnedByName) {
      // Reset jika returnedByName dikosongkan
      setSelectedReturnerUser(null);
    }
  }, [returnedByName, allUsers]);

  // Debug: log perubahan selectedReturnerUser dan status workshop
  useEffect(() => {



    if (selectedReturnerUser) {
    }

  }, [selectedReturnerUser, selectedReturnerIsWorkshop, returnedByName]);

  // Pilihan penerima warehouse saat non-warehouse melakukan pengembalian
  const [selectedReceiverWarehouse, setSelectedReceiverWarehouse] = useState<string>("");

  // Signature state
  const [issuerSigned, setIssuerSigned] = useState<string | null>(null);
  const [receiverSigned, setReceiverSigned] = useState<string | null>(null);
  const [returnIssuerSigned, setReturnIssuerSigned] = useState<string | null>(null);
  const [returnReceiverSigned, setReturnReceiverSigned] = useState<string | null>(null);

  // Detail & Delete States
  const [detailTargetId, setDetailTargetId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WarehouseBorrowList | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = (silent = false) => {
    if (!silent) setLoading(true);
    const params: any = { page: 1, pageSize: 100 };
    if (statusFilter !== "all") params.status = statusFilter;
    if (dateRangeFrom) params.fromDate = dateRangeFrom;
    if (dateRangeTo) params.toDate = dateRangeTo;
    
    warehouseBorrowApi
      .getAll(params)
      .then((r) => setItems(r.data ?? []))
      .catch(() => setItems([]))
      .finally(() => { if (!silent) setLoading(false); });
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, dateRangeFrom, dateRangeTo]);

  const applyMonthYearFilter = (month: string, year: string) => {
    const selectedYear = Number(year);
    setMonthFilter(month);
    setYearFilter(year);

    if (!selectedYear) {
      setDateRangeFrom("");
      setDateRangeTo("");
      return;
    }

    if (month === "all") {
      setDateRangeFrom(toDateParam(new Date(selectedYear, 0, 1)));
      setDateRangeTo(toDateParam(new Date(selectedYear, 11, 31)));
      return;
    }

    const selectedMonth = Number(month);
    setDateRangeFrom(toDateParam(new Date(selectedYear, selectedMonth, 1)));
    setDateRangeTo(toDateParam(new Date(selectedYear, selectedMonth + 1, 0)));
  };

  const clearDateFilter = () => {
    setDateRangeFrom("");
    setDateRangeTo("");
    setMonthFilter(String(new Date().getMonth()));
    setYearFilter(String(new Date().getFullYear()));
    setCustomDateFrom("");
    setCustomDateTo("");
    setDateFilterMode("month");
    setDateFilterType(null);
    setRangePicker(null);
  };

  const getDateFilterLabel = () => {
    if (!dateRangeFrom || !dateRangeTo) return "Semua tanggal";
    if (dateFilterType === "range") {
      if (dateRangeFrom === dateRangeTo) return formatDateFilterLabel(dateRangeFrom);
      return `${formatDateFilterLabel(dateRangeFrom)} - ${formatDateFilterLabel(dateRangeTo)}`;
    }
    if (monthFilter === "all") return `Tahun ${yearFilter}`;
    return `${MONTHS_ID[Number(monthFilter)]} ${yearFilter}`;
  };

  const formatDateFilterLabel = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return format(new Date(year, month - 1, day), "dd MMM yyyy", { locale: localeId });
  };

  const applyCustomDateFilter = () => {
    if (!customDateFrom && !customDateTo) {
      clearDateFilter();
      return;
    }

    const from = customDateFrom || customDateTo;
    const to = customDateTo || customDateFrom;
    const [normalizedFrom, normalizedTo] = from > to ? [to, from] : [from, to];

    setDateRangeFrom(normalizedFrom);
    setDateRangeTo(normalizedTo);
    setCustomDateFrom(normalizedFrom);
    setCustomDateTo(normalizedTo);
    setDateFilterType("range");
  };

  const applyDateFilter = () => {
    if (dateFilterMode === "range") {
      applyCustomDateFilter();
      return;
    }

    applyMonthYearFilter(monthFilter, yearFilter);
    setDateFilterType("month");
  };

  const rangeCalendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(rangeViewMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(rangeViewMonth), { weekStartsOn: 1 }),
  });

  const selectRangeDate = (date: Date) => {
    const selected = toDateParam(date);
    if (!customDateFrom || customDateTo) {
      setCustomDateFrom(selected);
      setCustomDateTo("");
      return;
    }

    if (selected < customDateFrom) {
      setCustomDateFrom(selected);
      setCustomDateTo(customDateFrom);
      return;
    }

    setCustomDateTo(selected);
  };

  const isRangeStart = (date: Date) => customDateFrom && isSameDay(date, fromDateParam(customDateFrom));
  const isRangeEnd = (date: Date) => customDateTo && isSameDay(date, fromDateParam(customDateTo));
  const isInSelectedRange = (date: Date) => {
    if (!customDateFrom || !customDateTo) return false;
    return isWithinInterval(date, {
      start: fromDateParam(customDateFrom),
      end: fromDateParam(customDateTo),
    });
  };

  const getStatusLabelText = (status: string) => {
    switch (status) {
      case "PendingApproval": return "Waiting Approval";
      case "PendingSignature": return "Menunggu TTD";
      case "Approved": return "Disetujui";
      case "Rejected": return "Ditolak";
      case "Issued": return "Telah Diberikan";
      case "Returned": return "Dikembalikan";
      case "Cancelled": return "Dibatalkan";
      default: return status;
    }
  };

  const handleExportExcel = async () => {
    if (filteredItems.length === 0) {
      toast({ title: "Data kosong", description: "Tidak ada data untuk diexport", variant: "destructive" });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "PM Docs System";
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet("Histori Peminjaman");

    worksheet.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "No Transaksi", key: "borrowNumber", width: 18 },
      { header: "Tanggal", key: "requestedAt", width: 18 },
      { header: "Status", key: "status", width: 18 },
      { header: "Peminjam", key: "borrower", width: 24 },
      { header: "Akun Pengaju", key: "borrowedBy", width: 24 },
      { header: "Terkait Pekerjaan", key: "relatedJob", width: 18 },
      { header: "No. Tiket", key: "ticketNumber", width: 18 },
      { header: "Jumlah Jenis", key: "totalItems", width: 12 },
      { header: "Total Qty", key: "totalQty", width: 12 },
      { header: "Item Dipinjam", key: "items", width: 70 },
      { header: "Keperluan", key: "purpose", width: 36 },
    ];

    worksheet.mergeCells("A1:L1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "Histori Peminjaman Tools";
    titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B3A6B" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(1).height = 28;

    worksheet.mergeCells("A2:L2");
    const filterCell = worksheet.getCell("A2");
    filterCell.value = `Periode: ${getDateFilterLabel()} | Status: ${statusFilter === "all" ? "Semua Status" : getStatusLabelText(statusFilter)} | Search: ${search || "-"}`;
    filterCell.font = { size: 10, color: { argb: "FF4A5568" } };
    filterCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F8FA" } };
    filterCell.alignment = { vertical: "middle", horizontal: "left" };

    const headerRow = worksheet.getRow(4);
    headerRow.values = [
      "No",
      "No Transaksi",
      "Tanggal",
      "Status",
      "Peminjam",
      "Akun Pengaju",
      "Terkait Pekerjaan",
      "No. Tiket",
      "Jumlah Jenis",
      "Total Qty",
      "Item Dipinjam",
      "Keperluan",
    ];
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2B6CB0" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });

    const statusFill: Record<string, string> = {
      PendingApproval: "FFFFFBEB",
      PendingSignature: "FFFFF7ED",
      Approved: "FFEBF4FF",
      Rejected: "FFFEF2F2",
      Issued: "FFE0E7FF",
      Returned: "FFD1FAE5",
      Cancelled: "FFF1F5F9",
    };

    filteredItems.forEach((borrow, index) => {
      const row = worksheet.addRow({
        no: index + 1,
        borrowNumber: borrow.borrowNumber,
        requestedAt: format(new Date(borrow.requestedAt), "dd/MM/yyyy HH:mm"),
        status: getStatusLabelText(borrow.status),
        borrower: borrow.borrowerName || borrow.borrowedByName,
        borrowedBy: borrow.borrowedByName,
        relatedJob: borrow.relatedJobNumber || "-",
        ticketNumber: borrow.ticketNumber || "-",
        totalItems: borrow.items?.length ?? 0,
        totalQty: borrow.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
        items: borrow.items?.map((item, itemIndex) =>
          `${itemIndex + 1}. ${item.partDescription}${item.partCode ? ` [${item.partCode}]` : ""} - x${item.quantity}${item.unit ? ` ${item.unit}` : ""}`
        ).join("\n") || "-",
        purpose: borrow.purpose || "-",
      });

      row.eachCell((cell, colNumber) => {
        cell.alignment = {
          vertical: "top",
          horizontal: colNumber === 1 || colNumber === 9 || colNumber === 10 ? "center" : "left",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });

      const statusCell = row.getCell("status");
      statusCell.font = { bold: true, color: { argb: "FF1A202C" } };
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusFill[borrow.status] ?? "FFF7F8FA" } };
      row.height = Math.max(22, (borrow.items?.length ?? 1) * 18);
    });

    worksheet.views = [{ state: "frozen", ySplit: 4 }];
    worksheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: 12 },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `Histori_Peminjaman_Tools_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`
    );
  };
  
  useEffect(() => {
    if (itemsToPrint.length > 0) {
      // Trigger print slightly after render
      setTimeout(() => {
        window.print();
        setItemsToPrint([]); // Reset after print
      }, 500);
    }
  }, [itemsToPrint]);

  // Live refresh saat ada perubahan data warehouse borrow dari user lain
  useLiveRefresh("WarehouseBorrow", () => {
    // Silent refresh — tidak tampilkan loading, data langsung berubah di background
    setTimeout(() => loadData(true), 500);
  });

  const openIssue = (item: WarehouseBorrowList) => {
    setActiveItem(item);
    setActionType("issue");
  };

  const openReturn = (item: WarehouseBorrowList) => {
    setActiveItem(item);
    setActionType("return");
    setReturnCondition("Good");
    setReturnNote("");
    setReturnedByName(item.borrowerName || item.borrowedByName);
    setWorkshopTechName("");
    setSelectedReturnerUser(null); // reset pilihan user
    setSelectedReceiverWarehouse(""); // reset pilihan warehouse penerima
  };

  const closeDialog = () => {
    setActiveItem(null);
    setActionType(null);
    setIssuerSigned(null);
    setReceiverSigned(null);
    setReturnIssuerSigned(null);
    setReturnReceiverSigned(null);
    setSelectedReturnerUser(null);
    setWorkshopTechName("");
    setSelectedReceiverWarehouse(""); // reset pilihan warehouse penerima
  };

  const handleIssue = async () => {
    if (!activeItem || !issuerSigned) {
      return toast({ title: "TTD Penyerah wajib diisi", variant: "destructive" });
    }

    setSubmitting(true);
    try {
      await warehouseBorrowApi.issue(activeItem.id, {
        issuerSignatureBase64: issuerSigned,
        receiverSignatureBase64: receiverSigned || undefined,
      });
      toast({ title: "Berhasil", description: "Status part berhasil diubah menjadi Telah Diberikan (Issued)." });
      closeDialog();
      loadData();
    } catch {
      toast({ title: "Gagal", description: "Terjadi kesalahan saat memproses data.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async () => {
    if (!activeItem) return;
    if (!returnIssuerSigned) {
      toast({ title: "Tanda Tangan Kosong", description: "Tanda tangan Penyerah (Peminjam) wajib diisi saat pengembalian.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await warehouseBorrowApi.return(activeItem.id, {
        returnCondition,
        returnNote,
        returnIssuerSignatureBase64: returnIssuerSigned ?? undefined,
        returnReceiverSignatureBase64: returnReceiverSigned ?? undefined,
        // Jika user punya linked teknisi dan ada nama spesifik → pakai nama teknisi, bukan nama akun
        returnedByName: (shouldShowReturnTechPicker && workshopTechName ? workshopTechName : returnedByName.trim()) || undefined,
        // Nama warehouse penerima yang dipilih manual (jika submit dari akun non-warehouse)
        returnReceiverName: (!isWarehouse && selectedReceiverWarehouse) ? selectedReceiverWarehouse : undefined,
      });
      toast({ title: "Berhasil", description: "Pengembalian part berhasil dicatat." });
      closeDialog();
      loadData();
    } catch (err: any) {
      toast({ title: "Gagal menyimpan data", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSign = async () => {
    if (!activeItem || !receiverSigned) {
      return toast({ title: "Tanda Tangan wajib diisi", variant: "destructive" });
    }

    setSubmitting(true);
    try {
      await warehouseBorrowApi.signReceiver(activeItem.id, receiverSigned);
      toast({ title: "Berhasil", description: "Tanda tangan penerima berhasil disimpan." });
      closeDialog();
      loadData();
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnSign = async () => {
    if (!activeItem || !returnReceiverSigned) {
      return toast({ title: "Tanda Tangan wajib diisi", variant: "destructive" });
    }

    setSubmitting(true);
    try {
      await warehouseBorrowApi.signReturnReceiver(activeItem.id, {
        returnReceiverSignatureBase64: returnReceiverSigned,
        returnCondition,
        returnNote
      });
      toast({ title: "Berhasil", description: "Inspeksi & tanda tangan penerima berhasil disimpan." });
      closeDialog();
      loadData();
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await warehouseBorrowApi.delete(deleteTarget.id);
      toast({ title: "Berhasil", description: "Data riwayat peminjaman berhasil dihapus." });
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      toast({ title: "Gagal menghapus", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  // Helper: get first item summary text
  const getItemsSummary = (b: WarehouseBorrowList) => {
    if (!b.items || b.items.length === 0) return "—";
    const first = b.items[0];
    const extra = b.items.length > 1 ? ` (+${b.items.length - 1} lainnya)` : "";
    return first.partDescription + extra;
  };

  const getTotalQty = (b: WarehouseBorrowList) => {
    if (!b.items) return 0;
    return b.items.reduce((sum, i) => sum + i.quantity, 0);
  };

  // Helper: cari roleName dari borrowedByName via allUsers
  const getRoleByName = (fullName: string): string | null =>
    allUsers.find(u => u.name === fullName)?.roleName ?? null;

  const filteredItems = items.filter((b) => {
    const s = search.toLowerCase();
    const matchSearch =
      b.borrowNumber.toLowerCase().includes(s) ||
      b.borrowedByName.toLowerCase().includes(s) ||
      (b.borrowerName && b.borrowerName.toLowerCase().includes(s)) ||
      (b.relatedJobNumber && b.relatedJobNumber.toLowerCase().includes(s)) ||
      (b.ticketNumber && b.ticketNumber.toLowerCase().includes(s)) ||
      (b.items && b.items.some(
        (i) =>
          i.partDescription.toLowerCase().includes(s) ||
          (i.partCode && i.partCode.toLowerCase().includes(s))
      ));
    const matchBorrower = borrowerFilter === "all"
      || getRoleByName(b.borrowedByName) === borrowerFilter;
    return matchSearch && matchBorrower;
  });

  // Daftar role unik dari peminjam yang ada di data (untuk dropdown filter)
  const borrowerRoleOptions = Array.from(
    new Set(
      items
        .map(b => getRoleByName(b.borrowedByName))
        .filter((r): r is string => !!r)
    )
  ).sort();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PendingApproval":
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-semibold whitespace-nowrap">Waiting Approval</span>;
      case "PendingSignature":
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-semibold whitespace-nowrap">Menunggu TTD</span>;
      case "Approved":
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold whitespace-nowrap">Disetujui</span>;
      case "Rejected":
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold whitespace-nowrap">Ditolak</span>;
      case "Issued":
        return <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold whitespace-nowrap">Telah Diberikan</span>;
      case "Returned":
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-semibold whitespace-nowrap">Dikembalikan</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold whitespace-nowrap">{status}</span>;
    }
  };

  // Render items list for modals
  const renderItemsList = (b: WarehouseBorrowList) => (
    <div className="space-y-1.5">
      <span className="text-gray-500 block mb-1 text-sm">Barang yang dipinjam:</span>
      {b.items.map((item, idx) => (
        <div key={idx} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-gray-100">
          <div>
            <div className="font-semibold text-gray-900 text-sm">{item.partDescription}</div>
            {item.partCode && <div className="text-xs text-gray-500 font-mono">{item.partCode}</div>}
          </div>
          <span className="font-bold text-indigo-700 text-sm ml-3 shrink-0">
            x{item.quantity}{item.unit ? ` ${item.unit}` : ""}
          </span>
        </div>
      ))}
    </div>
  );

  const renderPeriodFilterPanel = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[#1A202C]">Filter Periode</h3>
        <p className="text-xs text-[#718096] mt-0.5">Pilih bulan/tahun atau rentang tanggal manual.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-[10px] bg-[#F7F8FA] p-1 border border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => {
            setDateFilterMode("month");
            setRangePicker(null);
          }}
          className={`h-9 rounded-[8px] text-xs font-bold transition-colors ${
            dateFilterMode === "month" ? "bg-white text-[#1B3A6B] shadow-sm" : "text-[#718096] hover:text-[#1A202C]"
          }`}
        >
          Bulan & Tahun
        </button>
        <button
          type="button"
          onClick={() => {
            setDateFilterMode("range");
            setRangeViewMonth(customDateFrom ? fromDateParam(customDateFrom) : new Date());
            setRangePicker(null);
          }}
          className={`h-9 rounded-[8px] text-xs font-bold transition-colors ${
            dateFilterMode === "range" ? "bg-white text-[#1B3A6B] shadow-sm" : "text-[#718096] hover:text-[#1A202C]"
          }`}
        >
          Rentang Tanggal
        </button>
      </div>

      {dateFilterMode === "month" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-[10px] border border-[#E2E8F0] bg-white p-2">
            <button
              type="button"
              onClick={() => setYearFilter(String(Number(yearFilter) - 1))}
              className="w-9 h-9 flex items-center justify-center rounded-[8px] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.12em] font-bold text-[#718096]">Tahun</div>
              <div className="text-lg font-bold text-[#1A202C] leading-tight">{yearFilter}</div>
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
      ) : (
        <div className="relative rounded-[14px] border border-[#E2E8F0] bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              type="button"
              onClick={() => setRangeViewMonth((prev) => subMonths(prev, 1))}
              className="w-9 h-9 flex items-center justify-center rounded-[10px] border border-[#E2E8F0] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setRangePicker(rangePicker === "month" ? null : "month")}
              className="h-9 flex-1 min-w-0 rounded-[10px] border border-[#E2E8F0] bg-[#F7F8FA] px-3 text-xs font-bold text-[#1A202C] flex items-center justify-between gap-2 hover:border-[#2B6CB0] transition-colors"
            >
              <span className="truncate">{MONTHS_ID[getMonth(rangeViewMonth)]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#718096] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setRangePicker(rangePicker === "year" ? null : "year")}
              className="h-9 w-24 rounded-[10px] border border-[#E2E8F0] bg-[#F7F8FA] px-3 text-xs font-bold text-[#1A202C] flex items-center justify-between gap-2 hover:border-[#2B6CB0] transition-colors"
            >
              <span>{getYear(rangeViewMonth)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#718096] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setRangeViewMonth((prev) => addMonths(prev, 1))}
              className="w-9 h-9 flex items-center justify-center rounded-[10px] border border-[#E2E8F0] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {rangePicker && (
            <div className="absolute left-3 right-3 top-[58px] z-30 overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
                <span className="text-sm font-bold text-[#1A202C]">
                  {rangePicker === "month" ? "Pilih Bulan" : "Pilih Tahun"}
                </span>
                <button
                  type="button"
                  onClick={() => setRangePicker(null)}
                  className="text-xs font-semibold text-[#2B6CB0] hover:text-[#1B3A6B]"
                >
                  Tutup
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {rangePicker === "month"
                  ? MONTHS_ID.map((month, idx) => {
                      const active = idx === getMonth(rangeViewMonth);
                      return (
                        <button
                          key={month}
                          type="button"
                          onClick={() => {
                            setRangeViewMonth((prev) => setMonth(prev, idx));
                            setRangePicker(null);
                          }}
                          className={`w-full px-4 py-3 text-left text-sm border-b border-[#F7F8FA] transition-colors ${
                            active ? "bg-[#EBF4FF] text-[#1B3A6B] font-bold" : "text-[#1A202C] hover:bg-[#F7F8FA]"
                          }`}
                        >
                          {month}
                        </button>
                      );
                    })
                  : Array.from({ length: new Date().getFullYear() - 1999 + 3 }, (_, i) => 2000 + i).map((year) => {
                      const active = year === getYear(rangeViewMonth);
                      return (
                        <button
                          key={year}
                          type="button"
                          onClick={() => {
                            setRangeViewMonth((prev) => setYear(prev, year));
                            setRangePicker(null);
                          }}
                          className={`w-full px-4 py-3 text-left text-sm border-b border-[#F7F8FA] transition-colors ${
                            active ? "bg-[#EBF4FF] text-[#1B3A6B] font-bold" : "text-[#1A202C] hover:bg-[#F7F8FA]"
                          }`}
                        >
                          {year}
                        </button>
                      );
                    })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
              <div key={day} className="h-7 flex items-center justify-center text-[10px] font-semibold text-[#718096]">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {rangeCalendarDays.map((date) => {
              const inMonth = isSameMonth(date, rangeViewMonth);
              const start = !!isRangeStart(date);
              const end = !!isRangeEnd(date);
              const inRange = isInSelectedRange(date);
              const single = start && !customDateTo;
              const selected = start || end;

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => selectRangeDate(date)}
                  className={`h-9 min-w-0 text-xs font-semibold transition-colors ${
                    selected || single
                      ? "bg-[#1B3A6B] text-white shadow-sm"
                      : inRange
                        ? "bg-[#EBF4FF] text-[#1B3A6B]"
                        : inMonth
                          ? "text-[#1A202C] hover:bg-[#F7F8FA]"
                          : "text-[#CBD5E0]"
                  } ${start ? "rounded-l-[10px]" : ""} ${end ? "rounded-r-[10px]" : ""} ${single || (!inRange && !selected) ? "rounded-[10px]" : ""}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 rounded-[10px] bg-[#F7F8FA] border border-[#E2E8F0] px-3 py-2 text-[11px] text-[#718096]">
            {customDateFrom ? (
              <span>
                {formatDateFilterLabel(customDateFrom)}
                {customDateTo ? ` - ${formatDateFilterLabel(customDateTo)}` : " - pilih tanggal akhir"}
              </span>
            ) : (
              <span>Pilih tanggal awal, lalu pilih tanggal akhir.</span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={clearDateFilter}
          className="text-xs font-semibold text-[#718096] hover:text-[#DC2626] transition-colors"
        >
          Hapus
        </button>
        <Button
          type="button"
          size="sm"
          className="bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white"
          onClick={applyDateFilter}
        >
          Terapkan
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* ====== MOBILE INTEGRATED HEADER ====== */}
      <div className="md:hidden bg-white rounded-[14px] border border-[#E2E8F0] shadow-sm mb-4">
        <div className="flex items-start gap-4 p-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#EBF4FF] flex items-center justify-center flex-shrink-0">
            <History className="w-5 h-5 text-[#2B6CB0]" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#2B6CB0] tracking-[0.1em] uppercase mb-0.5">Warehouse</p>
            <h1 className="text-[20px] font-bold text-[#1A202C] leading-tight">Histori Peminjaman</h1>
            <p className="text-[12px] text-[#718096] mt-0.5">Riwayat permintaan dan transaksi tools</p>
          </div>
          <button
            onClick={() => navigate("/warehouse")}
            className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-[#F7F8FA] border border-[#E2E8F0] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
            <Input
              placeholder="Cari transaksi, part, atau peminjam..."
              className="pl-10 pr-4 h-10 border-[#E2E8F0] rounded-[10px] text-sm bg-[#F7F8FA] text-[#1A202C] placeholder:text-[#718096] w-full focus:border-[#2B6CB0]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 bg-[#F7F8FA] border-[#E2E8F0] text-[12px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="PendingApproval">Waiting Approval</SelectItem>
                <SelectItem value="PendingSignature">Menunggu TTD</SelectItem>
                <SelectItem value="Approved">Disetujui</SelectItem>
                <SelectItem value="Rejected">Ditolak</SelectItem>
                <SelectItem value="Issued">Telah Diberikan</SelectItem>
                <SelectItem value="Returned">Dikembalikan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={borrowerFilter} onValueChange={setBorrowerFilter}>
              <SelectTrigger className="h-10 bg-[#F7F8FA] border-[#E2E8F0] text-[12px]">
                <SelectValue placeholder="Semua Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Group</SelectItem>
                {borrowerRoleOptions.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`h-10 px-3 rounded-[10px] border text-[12px] font-semibold flex items-center justify-between gap-2 ${
                    dateRangeFrom
                      ? "bg-[#EBF4FF] border-[#2B6CB0] text-[#1B3A6B]"
                      : "bg-[#F7F8FA] border-[#E2E8F0] text-[#4A5568]"
                  }`}
                >
                  <span className="truncate">{getDateFilterLabel()}</span>
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[calc(100vw-2rem)] p-4 z-[200]">
                {renderPeriodFilterPanel()}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* ── Page Header (Desktop) ── */}
      <div className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-[10px] border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#EBF4FF] rounded-[10px]">
            <History className="w-6 h-6 text-[#2B6CB0]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A202C] tracking-tight">Histori Peminjaman Tools</h1>
            <p className="text-sm text-[#718096] mt-0.5">Daftar lengkap riwayat permintaan dan transaksi tools</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
              <Input
                placeholder="Cari transaksi..."
                className="pl-9 h-10 w-full border-[#E2E8F0] focus:border-[#2B6CB0]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10 bg-white"><SelectValue placeholder="Semua Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="PendingApproval">Waiting Approval</SelectItem>
                <SelectItem value="PendingSignature">Menunggu TTD</SelectItem>
                <SelectItem value="Approved">Disetujui</SelectItem>
                <SelectItem value="Rejected">Ditolak</SelectItem>
                <SelectItem value="Issued">Telah Diberikan</SelectItem>
                <SelectItem value="Returned">Dikembalikan</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={borrowerFilter} onValueChange={setBorrowerFilter}>
              <SelectTrigger className="w-full sm:w-44 h-10 bg-white border-[#E2E8F0]">
                <SelectValue placeholder="Semua Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Group</SelectItem>
                {borrowerRoleOptions.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={`w-full sm:w-56 h-10 justify-between bg-white border-[#E2E8F0] ${
                    dateRangeFrom ? "text-[#1B3A6B] border-[#2B6CB0] bg-[#EBF4FF]" : "text-[#1A202C]"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Calendar className="w-4 h-4 text-[#2B6CB0]" />
                    <span className="truncate">{getDateFilterLabel()}</span>
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-96 p-4 z-[200]">
                {renderPeriodFilterPanel()}
              </PopoverContent>
            </Popover>

            <Button variant="outline" className="h-10 bg-white whitespace-nowrap" onClick={handleExportExcel}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </div>
      </div>

      {/* ── Mobile Card View ── */}
      <div className="md:hidden flex flex-col gap-3 mt-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B6CB0]" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-[#718096] bg-white rounded-[10px] border border-[#E2E8F0]">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
            Tidak ada data peminjaman
          </div>
        ) : filteredItems.map((b) => (
          <div key={b.id} className="bg-white rounded-[10px] border border-[#E2E8F0] shadow-sm p-4 flex flex-col gap-2">
            {/* Baris 1: Status badge + Tanggal */}
            <div className="flex justify-between items-start">
              {getStatusBadge(b.status)}
              <span className="text-[11px] text-[#718096] font-medium">
                {format(new Date(b.requestedAt), "dd MMM yyyy", { locale: localeId })}
              </span>
            </div>

            {/* Baris 2: Items summary */}
            <div>
              <p className="text-[14px] font-semibold text-[#1A202C]">{getItemsSummary(b)}</p>
              <p className="text-[12px] text-[#718096] mt-0.5">
                {b.borrowNumber} • {b.items?.length ?? 0} barang • Total Qty: x{getTotalQty(b)}
              </p>
            </div>

            {/* Baris 3: Detail grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-[#718096] bg-[#F7F8FA] rounded-[8px] p-2.5 border border-[#E2E8F0]">
              <div><span className="text-[#718096]">Peminjam:</span> <span className="text-[#1A202C] font-medium">{b.borrowerName || b.borrowedByName}</span></div>
              <div><span className="text-[#718096]">Barang:</span> <span className="text-[#1A202C] font-medium">{b.items?.length ?? 0} item</span></div>
              {b.relatedJobNumber && (
                <div className="col-span-2"><span className="text-[#718096]">Job:</span> <span className="font-mono text-[#2B6CB0] font-medium">{b.relatedJobNumber}</span></div>
              )}
            </div>

            {/* Baris 4: Footer aksi */}
            <div className="pt-2 mt-1 border-t border-[#E2E8F0]">
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-[#2B6CB0] border-[#E2E8F0] hover:bg-[#EBF4FF] hover:border-[#2B6CB0]"
                  onClick={() => setDetailTargetId(b.id)}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" /> Detail
                </Button>
                {b.status === "PendingSignature" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-600 hover:text-white"
                    onClick={() => {
                      setActiveItem(b);
                      setActionType("sign");
                    }}
                  >
                    <PenTool className="w-3.5 h-3.5 mr-1" /> TTD Serah Terima
                  </Button>
                )}
                {canPrintBorrow && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-[#4A5568] hover:bg-[#EDF2F7]"
                    onClick={() => {
                      setPrintTarget(b);
                      setIsPrintDialogOpen(true);
                    }}
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" /> Print
                  </Button>
                )}
                {b.status === "PendingReturnSignature" && isWarehouse && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-600 hover:text-white"
                    onClick={() => {
                      setActiveItem(b);
                      setActionType("return-sign");
                      setReturnCondition("Good");
                      setReturnNote("");
                    }}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 mr-1" /> Inspeksi & TTD
                  </Button>
                )}
                {b.status === "Approved" && isWarehouse && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-indigo-700 border-indigo-300 hover:bg-indigo-600 hover:text-white"
                    onClick={() => openIssue(b)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Serahkan
                  </Button>
                )}
                {b.status === "Issued" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-emerald-700 border-emerald-300 hover:bg-emerald-600 hover:text-white"
                    onClick={() => openReturn(b)}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> {isWarehouse ? "Terima Pengembalian" : "Kembalikan Part"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Data Table (Desktop) ── */}
      <div className="hidden md:block rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 text-left text-xs font-semibold text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3.5 whitespace-nowrap">No Transaksi</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Barang Dipinjam</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">Jml</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Peminjam</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Terkait Pekerjaan</th>
                <th className="px-4 py-3.5 whitespace-nowrap">No. Tiket</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Tanggal</th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
                      <span className="text-sm text-gray-400">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-10 h-10 opacity-20" />
                      <span className="text-sm">Tidak ada data ditemukan</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((b) => (
                  <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                        {b.borrowNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 min-w-[200px]">
                      <div className="font-medium text-gray-900">{getItemsSummary(b)}</div>
                      {b.items && b.items.length > 1 && (
                        <div className="text-xs text-violet-600 mt-0.5">{b.items.length} barang dipinjam</div>
                      )}
                      {b.items?.[0]?.partCode && <div className="text-xs text-gray-500 mt-0.5 font-mono">{b.items[0].partCode}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs">
                        x{getTotalQty(b)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium">{b.borrowerName || b.borrowedByName}</span>
                        </div>
                        {b.borrowerName && b.borrowerName !== b.borrowedByName && (
                          <span className="text-[10px] text-gray-400 ml-5">via: {b.borrowedByName}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(b.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {b.relatedJobNumber ? (
                        <span className="text-xs font-mono font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                          {b.relatedJobNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {b.ticketNumber ? (
                        <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                          {b.ticketNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(b.requestedAt), "dd MMM yyyy", { locale: localeId })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end items-center gap-1">
                        <button
                          title="Detail"
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors"
                          onClick={() => setDetailTargetId(b.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {b.status === "PendingSignature" && (
                          <button
                            title="TTD Serah Terima"
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-orange-600 hover:text-white hover:bg-orange-600 border border-orange-200 transition-colors"
                            onClick={() => {
                              setActiveItem(b);
                              setActionType("sign");
                            }}
                          >
                            <PenTool className="w-4 h-4" />
                          </button>
                        )}
                        {b.status === "PendingReturnSignature" && isWarehouse && (
                          <button
                            title="Inspeksi & TTD Penerima"
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-orange-600 hover:text-white hover:bg-orange-600 border border-orange-200 transition-colors"
                            onClick={() => {
                              setActiveItem(b);
                              setActionType("return-sign");
                              setReturnCondition("Good");
                              setReturnNote("");
                            }}
                          >
                            <ClipboardCheck className="w-4 h-4" />
                          </button>
                        )}
                        {b.status === "Approved" && isWarehouse && (
                          <button
                            title="Serahkan Part"
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 transition-colors"
                            onClick={() => openIssue(b)}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {b.status === "Issued" && (
                          <>
                            <button
                              title="Terima Pengembalian"
                              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-emerald-600 hover:text-white hover:bg-emerald-600 border border-emerald-200 transition-colors"
                              onClick={() => openReturn(b)}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {canPrintBorrow && (
                          <button
                            title="Print Bukti Material"
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-600 hover:text-white hover:bg-blue-600 border border-gray-200 transition-colors"
                            onClick={() => {
                              setPrintTarget(b);
                              setIsPrintDialogOpen(true);
                            }}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        {(canPrintBorrow || hasPermission("warehouse.borrow.delete")) && (
                          <div className="w-px h-5 bg-gray-200 mx-0.5" />
                        )}
                        {hasPermission("warehouse.borrow.delete") && (
                          <button
                            title="Hapus"
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            onClick={() => setDeleteTarget(b)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Serahkan Part (Issue) + Signature */}
      <ResponsiveModal
        open={actionType === "issue" && !!activeItem}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        title={
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-indigo-600" />
            Penyerahan Part ke Penerima
          </div>
        }
        description="Konfirmasi penyerahan dan tanda tangan kedua belah pihak."
        bottomSheetSize="lg"
        desktopClassName="max-w-lg"
        footer={
          <>
            <Button variant="outline" onClick={closeDialog} className="flex-1 sm:flex-none">Batal</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 sm:flex-none"
              onClick={handleIssue}
              disabled={submitting}
            >
              {submitting ? "Memproses..." : "Konfirmasi Penyerahan"}
            </Button>
          </>
        }
      >
        {activeItem && (
          <div className="space-y-4 my-2">
            {/* Info ringkas */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm space-y-2">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Nomor Transaksi</span>
                <span className="font-mono font-semibold">{activeItem.borrowNumber}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2 pt-1">
                <span className="text-gray-500">Penerima</span>
                <span className="font-semibold">{activeItem.borrowerName || activeItem.borrowedByName}</span>
              </div>
              <div className="pt-1">
                {renderItemsList(activeItem)}
              </div>
            </div>

            {/* Dual Signature */}
            <div className="space-y-4">
              <SignaturePadField label="TTD Penyerah" required value={issuerSigned} onChange={setIssuerSigned} signerName={user?.fullName || "Admin Warehouse"} />
              <SignaturePadField label="TTD Penerima (Opsional)" value={receiverSigned} onChange={setReceiverSigned} signerName={activeItem.borrowerName || activeItem.borrowedByName} />
            </div>
          </div>
        )}
      </ResponsiveModal>

      {/* Modal Pengembalian Part (Return) + Signature */}
      <ResponsiveModal open={actionType === "return" && !!activeItem} onOpenChange={(open) => {
        if (!open) {
          closeDialog();
        }
      }}
        title={
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-emerald-600" />
            Terima Pengembalian Part
          </div>
        }
        description="Catat penerimaan pengembalian part dari peminjam kembali ke warehouse."
        bottomSheetSize="xl"
        desktopClassName="max-w-lg"
        footer={
          <>
            <Button variant="outline" onClick={closeDialog} className="flex-1 sm:flex-none">Batal</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none"
              onClick={handleReturn}
              disabled={submitting}
            >
              {submitting ? "Memproses..." : (isWarehouse ? "Terima Pengembalian" : "Kembalikan Part")}
            </Button>
          </>
        }
      >
        {activeItem && (
          <div className="space-y-5 my-2">
            {/* ── Info Peminjaman ── */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm space-y-2">
              {/* No. Transaksi */}
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">No. Transaksi</span>
                <span className="font-mono font-semibold text-gray-700">{activeItem.borrowNumber}</span>
              </div>

              {/* Peminjam */}
              <div className="flex justify-between border-b border-gray-200 pb-2 pt-1">
                <span className="text-gray-500">Peminjam Awal</span>
                <span className="font-semibold">{activeItem.borrowerName || activeItem.borrowedByName}</span>
              </div>

              {/* No. Tiket / No. Job */}
              {(activeItem.ticketNumber || activeItem.relatedJobNumber) && (
                <div className="flex justify-between border-b border-gray-200 pb-2 pt-1">
                  <span className="text-gray-500">No. Tiket / Job</span>
                  <span className="font-semibold text-indigo-600">{activeItem.ticketNumber || activeItem.relatedJobNumber}</span>
                </div>
              )}

              {/* Dipinjam sejak */}
              {activeItem.issuedAt && (
                <div className="flex justify-between border-b border-gray-200 pb-2 pt-1">
                  <span className="text-gray-500">Waktu Pinjam</span>
                  <div className="text-right">
                    <p className="font-semibold">{new Date(activeItem.issuedAt).toLocaleString('id-ID')}</p>
                    <div className="text-xs text-amber-600 font-medium mt-0.5">
                      {(() => {
                        const from = new Date(activeItem.issuedAt);
                        const now = new Date();
                        const diffMs = now.getTime() - from.getTime();
                        const diffH = Math.floor(diffMs / 3600000);
                        const diffD = Math.floor(diffH / 24);
                        const remH = diffH % 24;
                        if (diffD > 0) return `${diffD} hari ${remH > 0 ? `${remH} jam` : ""} yang lalu`;
                        if (diffH > 0) return `${diffH} jam yang lalu`;
                        const diffMin = Math.floor(diffMs / 60000);
                        return `${diffMin} menit yang lalu`;
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Daftar Barang */}
                <div className="border-t border-gray-200 pt-3 mt-1">
                  {renderItemsList(activeItem)}
                </div>
              </div>

              {/* Nama Pengembali */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">Dikembalikan Oleh</label>

                {/* Step 1: Pilih dari semua user terdaftar */}
                <FormMobileSelect
                  value={returnedByName}
                  onChange={(val) => {
                    setReturnedByName(val);
                    setWorkshopTechName(""); // reset step 2
                    // Simpan object user yang dipilih agar roleName bisa diakses langsung
                    const found = allUsers.find(u => u.name === val) ?? null;
                    setSelectedReturnerUser(found);
                  }}
                  options={allUsers.map((u) => u.name)}
                  placeholder="Pilih atau ketik nama..."
                  label="Pilih Pengembali"
                  color="emerald"
                />

                {/* Step 2: Jika user punya linked teknisi atau adalah Teknisi WSK */}
                {shouldShowReturnTechPicker && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <p className="text-xs font-semibold text-emerald-700">
                        <span className="font-bold">{returnedByName}</span> punya beberapa teknisi.
                        Pilih nama teknisi spesifik:
                      </p>
                    </div>
                    <FormMobileSelect
                      value={workshopTechName}
                      onChange={setWorkshopTechName}
                      options={
                        linkedTechniciansForReturner.length > 0
                          ? linkedTechniciansForReturner.map(t => t.name)
                          : technicians.map(t => t.name)
                      }
                      placeholder="— Pilih nama teknisi —"
                      label="Pilih Nama Teknisi"
                      color="emerald"
                    />
                    {workshopTechName && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        ✓ Dikembalikan oleh: <strong>{workshopTechName}</strong>
                      </p>
                    )}
                  </div>
                )}

                {returnedByName && activeItem && returnedByName !== (activeItem.borrowerName || activeItem.borrowedByName) && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    ⚠️ Berbeda dari peminjam asli ({activeItem.borrowerName || activeItem.borrowedByName})
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Kondisi Barang Saat Dikembalikan <span className="text-red-500">*</span></label>
                  <Select value={returnCondition} onValueChange={setReturnCondition}>
                    <SelectTrigger className="w-full h-10 border-gray-300 focus:ring-emerald-500 focus:border-emerald-500">
                      <SelectValue placeholder="Pilih kondisi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Good">Good (Kondisi Baik)</SelectItem>
                      <SelectItem value="Damaged">Damaged (Rusak / Bekas Pakai)</SelectItem>
                      <SelectItem value="Incomplete">Incomplete (Tidak Lengkap)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Catatan Pengembalian (Opsional)</label>
                  <Textarea
                    placeholder="Catatan tambahan dari warehouse admin..."
                    className="h-20 resize-none focus-visible:ring-emerald-500"
                    value={returnNote}
                    onChange={(e) => setReturnNote(e.target.value)}
                  />
                </div>

                {/* Return Dual Signature */}
                <div className="space-y-4">
                  <SignaturePadField label="TTD Penyerah (Peminjam)" required value={returnIssuerSigned} onChange={setReturnIssuerSigned} signerName={returnedByName || activeItem.borrowerName || activeItem.borrowedByName} />
                  {isWarehouse ? (
                    <SignaturePadField label="TTD Penerima (Warehouse)" value={returnReceiverSigned} onChange={setReturnReceiverSigned} signerName={user?.fullName || "Admin Warehouse"} />
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">
                          Penerima Warehouse <span className="text-xs text-gray-400 font-normal">(Opsional)</span>
                        </label>
                        <FormMobileSelect
                          value={selectedReceiverWarehouse}
                          onChange={(val) => {
                            setSelectedReceiverWarehouse(val);
                            setReturnReceiverSigned(null); // reset TTD jika ganti pilihan
                          }}
                          options={allUsers
                            .filter(u => u.roleName?.toLowerCase() === "warehouse")
                            .map(u => u.name)}
                          placeholder="— Pilih admin warehouse penerima (opsional) —"
                          label="Pilih Penerima Warehouse"
                          color="emerald"
                        />
                      </div>
                      {selectedReceiverWarehouse ? (
                        <SignaturePadField
                          label="TTD Penerima (Warehouse)"
                          value={returnReceiverSigned}
                          onChange={setReturnReceiverSigned}
                          signerName={selectedReceiverWarehouse}
                        />
                      ) : (
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                          <p className="font-semibold mb-1">TTD Penerima (Warehouse)</p>
                          <p className="text-blue-700 text-xs">
                            Pilih admin warehouse di atas agar TTD penerima bisa diisi sekarang.
                            Jika tidak dipilih, Admin Warehouse akan menandatangani terpisah dan status berubah ke <span className="font-bold">Menunggu TTD Warehouse</span>.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

      </ResponsiveModal>

      {/* Modal Tanda Tangan Penerima */}
      <ResponsiveModal open={actionType === "sign" && !!activeItem} onOpenChange={(open) => {
        if (!open) closeDialog();
      }} title={<div className="flex items-center gap-2"><PenTool className="w-5 h-5 text-orange-600" />Tanda Tangan Penerima</div>} description="Silakan tanda tangan untuk mengonfirmasi bahwa Anda telah menerima barang ini." desktopClassName="max-w-2xl">

          {activeItem && (
            <div className="space-y-4 my-2">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm space-y-2">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Nomor Transaksi</span>
                  <span className="font-mono font-semibold">{activeItem.borrowNumber}</span>
                </div>
                <div className="pt-1">
                  {renderItemsList(activeItem)}
                </div>
              </div>

              <SignaturePadField
                label="Tanda Tangan"
                required
                value={receiverSigned}
                onChange={setReceiverSigned}
                signerName={activeItem.borrowerName || activeItem.borrowedByName}
              />
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={closeDialog}>Batal</Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleSign}
              disabled={submitting || !receiverSigned}
            >
              {submitting ? "Menyimpan..." : "Simpan Tanda Tangan"}
            </Button>
          </div>
      </ResponsiveModal>

      {/* Modal Inspeksi & TTD Penerima (Return) */}
      <ResponsiveModal
        open={actionType === "return-sign" && !!activeItem}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        title={
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-orange-600" />
            Inspeksi & Tanda Tangan Penerima
          </div>
        }
        description="Mohon inspeksi kondisi barang dan berikan tanda tangan sebagai Admin Warehouse."
        bottomSheetSize="xl"
        desktopClassName="max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={closeDialog} className="flex-1 sm:flex-none">Batal</Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white flex-1 sm:flex-none"
              onClick={handleReturnSign}
              disabled={submitting || !returnReceiverSigned}
            >
              {submitting ? "Menyimpan..." : "Simpan & Selesai"}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Kondisi Barang Saat Dikembalikan <span className="text-red-500">*</span></label>
            <Select value={returnCondition} onValueChange={setReturnCondition}>
              <SelectTrigger className="w-full h-10 border-gray-300 focus:ring-emerald-500 focus:border-emerald-500">
                <SelectValue placeholder="Pilih kondisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Good">Good (Kondisi Baik)</SelectItem>
                <SelectItem value="Damaged">Damaged (Rusak / Bekas Pakai)</SelectItem>
                <SelectItem value="Incomplete">Incomplete (Tidak Lengkap)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Catatan Pengembalian (Opsional)</label>
            <Textarea
              placeholder="Catatan tambahan..."
              className="h-20 resize-none focus-visible:ring-emerald-500"
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
            />
          </div>
          <SignaturePadField
            label="Tanda Tangan Penerima (Warehouse)"
            required
            value={returnReceiverSigned}
            onChange={setReturnReceiverSigned}
            signerName={user?.fullName || "Admin Warehouse"}
          />
        </div>
      </ResponsiveModal>

      {/* Modal Detail Peminjaman */}
      <WarehouseBorrowDetailModal
        isOpen={detailTargetId !== null}
        onClose={() => setDetailTargetId(null)}
        borrowId={detailTargetId}
      />

      <PrintMaterialDialog
        open={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
        targetBorrow={printTarget}
        onConfirmPrint={(items) => {
          setIsPrintDialogOpen(false);
          setItemsToPrint(items);
        }}
      />
      
      {/* Hidden print template */}
      {itemsToPrint.length > 0 && (
        <PrintMaterialTemplate ref={printRef} itemsToPrint={itemsToPrint} />
      )}

      {/* Dialog Hapus Riwayat */}
      <ResponsiveModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Riwayat"
        description="Apakah Anda yakin ingin menghapus data riwayat peminjaman ini? Data yang dihapus tidak akan ditampilkan lagi."
        bottomSheetSize="md"
        desktopClassName="max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 sm:flex-none">Batal</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white flex-1 sm:flex-none"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <div className="bg-red-50 rounded-lg p-3 border border-red-100 mt-2">
            <p className="text-sm font-semibold text-gray-900">{deleteTarget.borrowNumber}</p>
            <p className="text-xs text-gray-500">{deleteTarget.borrowerName || deleteTarget.borrowedByName}</p>
          </div>
        )}
      </ResponsiveModal>
    </div>
  );
}
