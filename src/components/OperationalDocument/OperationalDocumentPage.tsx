import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  FileText, Plus, Search, ExternalLink, Edit2, Trash2,
  CheckCircle, Clock, AlertTriangle, ChevronDown, Filter, X,
  Calendar, ChevronRight, TrendingUp, RotateCw, CalendarX,
  MoreHorizontal, Download, Upload, FileSpreadsheet, Info, Bell, Eye
} from "lucide-react";
import { MobilePageHeader } from "../ui/MobilePageHeader";
import BottomSheet from "../common/BottomSheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "../../hooks/use-toast";
import { hasPermission } from "../../utils/permissionUtils";
import {
  operationalDocumentApi,
  OperationalDocumentDto,
  CreateOperationalDocumentDto,
  operationalDocumentTypeApi,
  OperationalDocumentTypeDto,
} from "../../services/operationalDocumentApi";
import { FormMobileDatePicker } from "../Radio/FormMobileDatePicker";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ── Constants ────────────────────────────────────────────────────────────────


const FOLLOW_UP_STATUS_OPTIONS = ["Tidak Ada", "Pending", "SedangDiproses", "Selesai"] as const;
type FollowUpStatus = typeof FOLLOW_UP_STATUS_OPTIONS[number];

const PAGE_SIZE = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseResponse(raw: any): { items: OperationalDocumentDto[]; totalCount: number; totalPages: number } {
  const items: OperationalDocumentDto[] = Array.isArray(raw?.data) ? raw.data : [];
  const pagination = raw?.meta?.pagination;
  return { items, totalCount: pagination?.totalCount ?? items.length, totalPages: pagination?.totalPages ?? 1 };
}

function parseSummary(raw: any) {
  const d = raw?.data ?? raw ?? {};
  return { totalDocuments: d.totalDocuments ?? 0, expiringSoon: d.expiringSoon ?? 0, expired: d.expired ?? 0 };
}

// ── Badge Components ─────────────────────────────────────────────────────────
function TableExpiryBadge({ status }: { status: string }) {
  if (status === "Expired") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-red-50 text-[12px] font-bold text-[#DC2626]"><div className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"/> Expired</span>;
  if (status === "Warning") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-amber-50 text-[12px] font-bold text-[#F59E0B]"><div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"/> Segera Berakhir</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-emerald-50 text-[12px] font-bold text-[#059669]"><div className="w-1.5 h-1.5 rounded-full bg-[#059669]"/> Aman</span>;
}

function MobileExpiryBadge({ status }: { status: string }) {
  if (status === "Expired") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] border text-[11px] font-semibold bg-red-50 border-red-200 text-[#DC2626]"><AlertTriangle className="w-3 h-3" /> Expired</span>;
  if (status === "Warning") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] border text-[11px] font-semibold bg-amber-50 border-amber-200 text-[#F59E0B]"><Clock className="w-3 h-3" /> Segera</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] border text-[11px] font-semibold bg-emerald-50 border-emerald-200 text-[#059669]"><CheckCircle className="w-3 h-3" /> Aman</span>;
}

function FollowUpBadge({ status, onClick }: { status: FollowUpStatus; onClick?: () => void }) {
  const cfg: Record<FollowUpStatus, { cls: string; label: string }> = {
    "Tidak Ada": { cls: "bg-gray-100 text-[#718096] border-gray-200", label: "Tidak Ada" },
    Pending: { cls: "bg-slate-100 text-[#718096] border-slate-200", label: "Pending" },
    SedangDiproses: { cls: "bg-[#EBF4FF] text-[#2B6CB0] border-[#2B6CB0]/20", label: "Diproses" },
    Selesai: { cls: "bg-emerald-50 text-[#059669] border-emerald-200", label: "Selesai" },
  };
  const c = cfg[status] ?? cfg["Tidak Ada"];
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`inline-flex items-center px-2 py-0.5 rounded-[6px] border text-[11px] font-semibold cursor-pointer hover:opacity-80 transition-opacity ${c.cls}`}>
        {c.label}
      </button>
    );
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] border text-[11px] font-semibold ${c.cls}`}>{c.label}</span>;
}

// ── Default form ──────────────────────────────────────────────────────────────
const defaultForm = (): CreateOperationalDocumentDto => ({
  name: "", type: "", referenceNumber: "", groupName: "", validFrom: "", validUntil: "",
  picName: "", picTelegramId: "", fileLink: "",
});

// ─────────────────────────────────────────────────────────────────────────────
export default function OperationalDocumentPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // ── State ──
  const [items, setItems] = useState<OperationalDocumentDto[]>([]);
  const [documentTypes, setDocumentTypes] = useState<OperationalDocumentTypeDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({ totalDocuments: 0, expiringSoon: 0, expired: 0 });
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFollowUp, setFilterFollowUp] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [sendingNotifId, setSendingNotifId] = useState<number | null>(null);
  
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);
  const [followUpSheetOpen, setFollowUpSheetOpen] = useState(false);
  const [groupSheetOpen, setGroupSheetOpen] = useState(false);

  // Responsive check
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailDoc, setSelectedDetailDoc] = useState<OperationalDocumentDto | null>(null);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [selectedFollowUpDoc, setSelectedFollowUpDoc] = useState<OperationalDocumentDto | null>(null);
  const [followUpFormStatus, setFollowUpFormStatus] = useState<string>("Tidak Ada");
  const [followUpFormRemark, setFollowUpFormRemark] = useState<string>("");
  const [isUpdatingFollowUp, setIsUpdatingFollowUp] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateOperationalDocumentDto>(defaultForm());
  const [validFromDate, setValidFromDate] = useState<Date | undefined>();
  const [validUntilDate, setValidUntilDate] = useState<Date | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<OperationalDocumentDto | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  const canCreate = hasPermission("operationaldocument.create");
  const canUpdate = hasPermission("operationaldocument.update");
  const canDelete = hasPermission("operationaldocument.delete");
  const canSendNotification = hasPermission("operationaldocument.sendnotification");

  // ── Fetching ──
  const loadSummary = useCallback(async () => {
    try {
      const res = await operationalDocumentApi.getSummary();
      setSummary(parseSummary(res.data));
    } catch (error) {
      console.error("Gagal load summary", error);
    }
  }, []);

  const loadTypes = useCallback(async () => {
    try {
      const res = await operationalDocumentTypeApi.getAll({ isActive: true });
      setDocumentTypes(res.data.data);
    } catch (error) {
      console.error("Gagal load types", error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await operationalDocumentApi.getAll({
        page, pageSize: PAGE_SIZE, search: search || undefined,
        type: filterType || undefined,
        expiryStatus: filterStatus || undefined,
        followUpStatus: filterFollowUp || undefined,
        groupName: filterGroup || undefined,
        sortBy: "ValidUntil", sortDir: "asc",
      });
      const parsed = parseResponse(res.data);
      setItems(parsed.items);
      setTotalPages(parsed.totalPages);
      setTotalCount(parsed.totalCount);
    } catch (e: any) {
      toast({ title: "Error", description: "Gagal memuat dokumen", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType, filterStatus, filterFollowUp, filterGroup, toast]);

  const loadGroups = useCallback(async () => {
    try {
      const res = await operationalDocumentApi.getAll({ page: 1, pageSize: 9999 });
      const allItems: OperationalDocumentDto[] = res.data?.data ?? [];
      const groups = [...new Set(allItems.map(d => d.groupName).filter(Boolean) as string[])].sort();
      setAvailableGroups(groups);
    } catch (error) {
      console.error("Gagal load groups", error);
    }
  }, []);

  useEffect(() => {
    loadSummary();
    loadTypes();
    loadGroups();
  }, [loadSummary, loadTypes, loadGroups]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Actions ──
  const openCreate = () => { setEditId(null); setForm(defaultForm()); setValidFromDate(undefined); setValidUntilDate(undefined); setFormOpen(true); };
  
  const openDetail = (doc: OperationalDocumentDto) => {
    setSelectedDetailDoc(doc);
    setDetailModalOpen(true);
  };

  const openEdit = (doc: OperationalDocumentDto) => {
    setEditId(doc.id);
    setForm({      name: doc.name,
      type: doc.type,
      referenceNumber: doc.referenceNumber ?? "",
      groupName: doc.groupName ?? "",
      validFrom: doc.validFrom,
      validUntil: doc.validUntil, picName: doc.picName ?? "", picTelegramId: doc.picTelegramId ?? "", fileLink: doc.fileLink ?? "" });
    setValidFromDate(parseISO(doc.validFrom));
    setValidUntilDate(parseISO(doc.validUntil));
    setFormOpen(true);
  };
  const closeForm = () => { setFormOpen(false); setEditId(null); setForm(defaultForm()); };
  
  const handleSubmit = async () => {
    const dto: CreateOperationalDocumentDto = {
      ...form,
      validFrom: validFromDate ? validFromDate.toISOString() : form.validFrom,
      validUntil: validUntilDate ? validUntilDate.toISOString() : form.validUntil,
    };
    if (!dto.name.trim() || !dto.type || !dto.validFrom || !dto.validUntil) {
      toast({ title: "Nama, Tipe, dan Tanggal wajib diisi", variant: "destructive" }); return;
    }
    
    setIsBusy(true);
    try {
      if (editId) {
        await operationalDocumentApi.update(editId, dto);
        toast({ title: "Dokumen berhasil diperbarui" });
      } else {
        await operationalDocumentApi.create(dto);
        toast({ title: "Dokumen berhasil ditambahkan" });
      }
      closeForm();
      loadData();
      loadSummary();
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.response?.data?.message ?? e.message, variant: "destructive" });
    } finally {
      setIsBusy(false);
    }
  };

  const handleFollowUpChange = (doc: OperationalDocumentDto, status: string) => {
    setSelectedFollowUpDoc(doc);
    setFollowUpFormStatus(status);
    setFollowUpFormRemark(doc.followUpRemark || "");
    setFollowUpModalOpen(true);
  };

  const submitFollowUpStatus = async () => {
    if (!selectedFollowUpDoc) return;
    setIsUpdatingFollowUp(true);
    try {
      await operationalDocumentApi.updateFollowUpStatus(selectedFollowUpDoc.id, followUpFormStatus, followUpFormRemark);
      toast({ title: "Status tindak lanjut diperbarui" });
      setFollowUpModalOpen(false);
      loadData();
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.response?.data?.message ?? e.message, variant: "destructive" });
    } finally {
      setIsUpdatingFollowUp(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsBusy(true);
    try {
      await operationalDocumentApi.delete(id);
      toast({ title: "Dokumen berhasil dihapus" });
      setDeleteConfirm(null);
      loadData();
      loadSummary();
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.response?.data?.message ?? e.message, variant: "destructive" });
    } finally {
      setIsBusy(false);
    }
  };

  const applySearch = () => { setSearch(searchInput); setPage(1); };
  const clearFilters = () => { setFilterType(""); setFilterStatus(""); setFilterFollowUp(""); setFilterGroup(""); setSearch(""); setSearchInput(""); setPage(1); };
  const hasActiveFilter = filterType || filterStatus || filterFollowUp || filterGroup || search;

  const handleTriggerNotification = async () => {
    if (isSendingNotif) return;
    setIsSendingNotif(true);
    try {
      await operationalDocumentApi.triggerNotification();
      toast({ title: "✅ Notifikasi Telegram Terkirim!", description: "Job notifikasi berhasil dijalankan. Periksa Telegram Anda." });
    } catch (e: any) {
      toast({ title: "Gagal kirim notifikasi", description: e?.response?.data?.message ?? e.message, variant: "destructive" });
    } finally {
      setIsSendingNotif(false);
    }
  };

  const handleSendNotification = async (doc: OperationalDocumentDto) => {
    if (sendingNotifId !== null) return;
    if (!doc.picTelegramId) {
      toast({ title: "Tidak ada Telegram ID", description: `Dokumen "${doc.name}" tidak memiliki Telegram Chat ID PIC.`, variant: "destructive" });
      return;
    }
    setSendingNotifId(doc.id);
    try {
      const res = await operationalDocumentApi.sendNotification(doc.id);
      toast({ title: "✅ Telegram Terkirim!", description: res.data?.message ?? `Notifikasi berhasil dikirim ke ${doc.picTelegramId}` });
    } catch (e: any) {
      toast({ title: "Gagal kirim Telegram", description: e?.response?.data?.message ?? e.message, variant: "destructive" });
    } finally {
      setSendingNotifId(null);
    }
  };

  const handleSendNotificationBulk = async () => {
    if (isSendingNotif) return;
    setIsSendingNotif(true);
    try {
      const res = await operationalDocumentApi.sendNotificationBulk({
        groupName: filterGroup || undefined,
        type: filterType || undefined,
        expiryStatus: filterStatus || undefined
      });
      const count = res.data?.data?.sentCount || 0;
      toast({ title: "✅ WA Bulk Terkirim!", description: res.data?.message ?? `Notifikasi berhasil dikirim ke ${count} dokumen` });
    } catch (e: any) {
      toast({ title: "Gagal kirim Telegram Bulk", description: e?.response?.data?.message ?? e.message, variant: "destructive" });
    } finally {
      setIsSendingNotif(false);
    }
  };

  const fmtDate = (iso: string) => {
    if (!iso) return "-";
    try { return format(parseISO(iso), "dd MMM yyyy", { locale: localeId }); } catch { return iso; }
  };

  const typeOptions = documentTypes.map(t => ({ value: t.name, label: t.name }));
  const statusOptions = [
    { value: "Aman", label: "Aman" },
    { value: "Warning", label: "Segera Berakhir (<30 hari)" },
    { value: "Expired", label: "Sudah Expired" }
  ];
  const followUpOptions = FOLLOW_UP_STATUS_OPTIONS.map(s => ({ value: s, label: s === "SedangDiproses" ? "Sedang Diproses" : s }));
  const groupOptions = availableGroups.map(g => ({ value: g, label: g }));

  // ── Excel Export ──────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      toast({ title: "Mempersiapkan export...", description: "Mengambil semua data dokumen" });

      // Fetch all records (no pagination)
      const res = await operationalDocumentApi.getAll({
        page: 1, pageSize: 9999,
        search: search || undefined,
        type: filterType || undefined,
        expiryStatus: filterStatus || undefined,
        followUpStatus: filterFollowUp || undefined,
        sortBy: "ValidUntil", sortDir: "asc",
      });
      const allItems: OperationalDocumentDto[] = res.data?.data ?? [];

      const wb = new ExcelJS.Workbook();
      wb.creator = "PM Docs System";
      wb.created = new Date();

      const ws = wb.addWorksheet("Monitoring Dokumen", {
        views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
      });

      // Header row
      ws.columns = [
        { header: "No",                 key: "no",              width: 6  },
        { header: "Nama Dokumen",        key: "name",            width: 35 },
        { header: "Tipe Dokumen",        key: "type",            width: 22 },
        { header: "No. Referensi",       key: "referenceNumber", width: 22 },
        { header: "Grup Dokumen",        key: "groupName",       width: 25 },
        { header: "Tanggal Berlaku",     key: "validFrom",       width: 18 },
        { header: "Tanggal Berakhir",    key: "validUntil",      width: 18 },
        { header: "Sisa Hari",           key: "daysRemaining",   width: 12 },
        { header: "Status Kadaluarsa",   key: "expiryStatus",    width: 18 },
        { header: "Tindak Lanjut",       key: "followUpStatus",  width: 18 },
        { header: "PIC",                 key: "picName",         width: 22 },
        { header: "Telegram Chat ID PIC",          key: "picTelegramId",        width: 18 },
        { header: "Link Dokumen",        key: "fileLink",        width: 40 },
      ];

      // Style header row
      const headerRow = ws.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B3A6B" } };
        cell.font   = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFD94F2B" } },
        };
        cell.alignment = { vertical: "middle", wrapText: false };
      });
      headerRow.height = 28;

      // Data rows
      allItems.forEach((doc, idx) => {
        const row = ws.addRow({
          no:              idx + 1,
          name:            doc.name,
          type:            doc.type,
          referenceNumber: doc.referenceNumber ?? "",
          groupName:       doc.groupName ?? "",
          validFrom:       doc.validFrom ? format(parseISO(doc.validFrom), "dd/MM/yyyy") : "",
          validUntil:      doc.validUntil ? format(parseISO(doc.validUntil), "dd/MM/yyyy") : "",
          daysRemaining:   doc.daysRemaining,
          expiryStatus:    doc.expiryStatus,
          followUpStatus:  doc.followUpStatus,
          picName:         doc.picName ?? "",
          picTelegramId:        doc.picTelegramId ?? "",
          fileLink:        doc.fileLink ?? "",
        });

        // Colour-code by expiry status
        const expiryCell = row.getCell("expiryStatus");
        const daysCell   = row.getCell("daysRemaining");
        if (doc.expiryStatus === "Expired") {
          expiryCell.font = { color: { argb: "FFDC2626" }, bold: true };
          daysCell.font   = { color: { argb: "FFDC2626" }, bold: true };
          row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF5F5" } };
        } else if (doc.expiryStatus === "Warning") {
          expiryCell.font = { color: { argb: "FFF59E0B" }, bold: true };
          daysCell.font   = { color: { argb: "FFF59E0B" }, bold: true };
          row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFBEB" } };
        } else {
          expiryCell.font = { color: { argb: "FF059669" }, bold: true };
        }

        // Alternate row background for non-expired rows
        if (doc.expiryStatus === "Aman" && idx % 2 === 1) {
          row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
        }

        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { vertical: "middle" };
        });
        row.height = 22;
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const timestamp = format(new Date(), "yyyyMMdd_HHmm");
      saveAs(blob, `Monitoring_Dokumen_${timestamp}.xlsx`);
      toast({ title: "Export berhasil", description: `${allItems.length} dokumen diekspor ke Excel` });
    } catch (e: any) {
      toast({ title: "Gagal export", description: e.message, variant: "destructive" });
    }
  };

  // ── Excel Template Download ───────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Template Import");

    ws.columns = [
      { header: "Nama Dokumen *",      key: "name",            width: 35 },
      { header: "Tipe Dokumen *",       key: "type",            width: 22 },
      { header: "No. Referensi",        key: "referenceNumber", width: 22 },
      { header: "Grup Dokumen",         key: "groupName",       width: 25 },
      { header: "Tanggal Berlaku *",    key: "validFrom",       width: 18 },
      { header: "Tanggal Berakhir *",   key: "validUntil",      width: 18 },
      { header: "Nama PIC",             key: "picName",         width: 22 },
      { header: "Telegram Chat ID PIC",           key: "picTelegramId",        width: 18 },
      { header: "Link Dokumen",         key: "fileLink",        width: 40 },
    ];

    const hr = ws.getRow(1);
    hr.eachCell((cell) => {
      cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B3A6B" } };
      cell.font   = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { vertical: "middle" };
    });
    hr.height = 28;

    // Sample row
    ws.addRow({
      name: "Ijin Frekuensi", type: "Ijin Frekuensi", referenceNumber: "REF/001/2025", groupName: "Grup ISR KPC",
      validFrom: "01/01/2025", validUntil: "31/12/2025",
      picName: "Nama PIC", picTelegramId: "123456789", fileLink: "https://sharepoint..."
    });

    // Instructions sheet
    const ws2 = wb.addWorksheet("Petunjuk");
    const instructions = [
      ["PETUNJUK PENGISIAN IMPORT DOKUMEN"],
      [""],
      ["Kolom Wajib (*): Nama Dokumen, Tipe Dokumen, Tanggal Berlaku, Tanggal Berakhir"],
      ["Format Tanggal: DD/MM/YYYY (contoh: 31/12/2025)"],
      ["Telegram Chat ID PIC: awali dengan 62, tanpa + atau spasi (contoh: 123456789)"],
      ["Tipe Dokumen: harus sesuai dengan master data Operational Doc Types yang tersedia"],
    ];
    instructions.forEach(r => ws2.addRow(r));
    ws2.getCell("A1").font = { bold: true, size: 13, color: { argb: "FF1B3A6B" } };

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, "Template_Import_Monitoring_Dokumen.xlsx");
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1400px] mx-auto min-h-[calc(100vh-64px)] bg-[#F7F8FA] md:bg-white md:rounded-[16px] md:shadow-sm md:m-4 md:p-8 md:border md:border-[#E2E8F0]">

      {/* ── Mobile Header ── */}
      <div className="md:hidden">
        <MobilePageHeader
          label="Administrasi"
          title="Monitoring Dokumen"
          subtitle="Pantau masa berlaku dokumen operasional"
          icon={<FileText className="w-5 h-5 text-[#2B6CB0]" />}
          iconBg="bg-[#EBF4FF]"
        />
      </div>

      {/* ── Desktop Header (Mockup Style) ── */}
      <div className="hidden md:flex justify-between items-start pb-2">
        <div>
          <div className="text-[12px] font-semibold text-[#2B6CB0] flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
            <span className="text-[#718096]">Docs</span> <ChevronRight className="w-3.5 h-3.5" /> Expiry Monitoring
          </div>
          <h1 className="text-[26px] font-bold text-[#1A202C] leading-tight mb-1">Monitoring Masa Berlaku Dokumen</h1>
          <p className="text-[14px] text-[#718096]">Kelola dan pantau masa aktif dokumen penting untuk operasional sistem.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export & Template Buttons */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#E2E8F0] bg-white text-[13px] font-semibold text-[#4A5568] hover:bg-[#F7F8FA] transition-colors"
            title="Export ke Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#059669]" /> Export
          </button>
          {canCreate && (
            <>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#E2E8F0] bg-white text-[13px] font-semibold text-[#4A5568] hover:bg-[#F7F8FA] transition-colors"
                title="Download Template Import"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#2B6CB0]" /> Template
              </button>
              <button
                onClick={() => navigate("/operational-documents/import")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#E2E8F0] bg-white text-[13px] font-semibold text-[#4A5568] hover:bg-[#F7F8FA] transition-colors"
                title="Import dari Excel"
              >
                <Upload className="w-3.5 h-3.5 text-[#F59E0B]" /> Import
              </button>
              <button
                onClick={openCreate}
                className="bg-[#D94F2B] hover:bg-[#B83D20] text-white px-5 py-2.5 rounded-[10px] flex items-center gap-2 font-semibold shadow-sm shadow-[#D94F2B]/20 transition-all active:scale-95 text-[14px]"
              >
                <Plus className="w-4 h-4" /> Tambah Dokumen
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Summary Cards (Mockup Style) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
        {/* Card 1 */}
        <div className="bg-white border border-[#E2E8F0] md:border-[#E2E8F0] md:shadow-sm rounded-[12px] md:rounded-[14px] p-4 md:p-5 flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-[10px] md:rounded-[12px] bg-[#1A2744] flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] font-bold text-[#718096] uppercase tracking-wider">Total Dokumen</p>
            <p className="text-[24px] md:text-[28px] font-bold text-[#1A202C] leading-none mt-1.5 mb-1.5">{summary.totalDocuments.toLocaleString()}</p>
          </div>
        </div>
        {/* Card 2 */}
        <div className="bg-white border border-[#E2E8F0] md:border-[#E2E8F0] md:shadow-sm rounded-[12px] md:rounded-[14px] p-4 md:p-5 flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-[10px] md:rounded-[12px] bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <RotateCw className="w-5 h-5 md:w-6 md:h-6 text-[#F59E0B]" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] font-bold text-[#718096] uppercase tracking-wider">Akan Berakhir (&lt; 30 Hari)</p>
            <p className="text-[24px] md:text-[28px] font-bold text-[#F59E0B] leading-none mt-1.5 mb-1.5">{summary.expiringSoon}</p>
            <p className="text-[11px] md:text-[12px] text-[#718096] italic">Segera perbarui dokumen ini</p>
          </div>
        </div>
        {/* Card 3 */}
        <div className="bg-white border border-[#E2E8F0] md:border-[#E2E8F0] md:shadow-sm rounded-[12px] md:rounded-[14px] p-4 md:p-5 flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-[10px] md:rounded-[12px] bg-red-50 flex items-center justify-center flex-shrink-0 border border-red-100">
            <CalendarX className="w-5 h-5 md:w-6 md:h-6 text-[#DC2626]" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] font-bold text-[#718096] uppercase tracking-wider">Sudah Expired</p>
            <p className="text-[24px] md:text-[28px] font-bold text-[#DC2626] leading-none mt-1.5 mb-1.5">{summary.expired}</p>
            <p className="text-[11px] md:text-[12px] text-[#718096] italic">Tindakan segera diperlukan</p>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar (Mobile) ── */}
      <div className="md:hidden space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
            <input
              className="w-full pl-9 pr-3 h-10 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] focus:outline-none focus:border-[#2B6CB0]"
              placeholder="Cari nama / no. referensi…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
            />
          </div>
          <button onClick={applySearch} className="px-3 h-10 bg-[#1B3A6B] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[#2B6CB0] transition-colors">Cari</button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { label: filterType || "Tipe Dokumen", active: !!filterType, onClick: () => setTypeSheetOpen(true) },
            { label: filterStatus || "Status Berakhir", active: !!filterStatus, onClick: () => setStatusSheetOpen(true) },
            { label: filterFollowUp || "Tindak Lanjut", active: !!filterFollowUp, onClick: () => setFollowUpSheetOpen(true) },
            { label: filterGroup || "Grup", active: !!filterGroup, onClick: () => setGroupSheetOpen(true) },
          ].map((chip, idx) => (
            <button key={idx} onClick={chip.onClick}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-[10px] border text-[12px] font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${chip.active ? "bg-[#1B3A6B] border-[#1B3A6B] text-white" : "bg-white border-[#E2E8F0] text-[#4A5568]"}`}>
              <Filter className="w-3.5 h-3.5 opacity-80" />{chip.label}<ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          ))}
          {hasActiveFilter && (
            <button onClick={clearFilters} className="px-3 h-9 bg-[#F7F8FA] border border-[#E2E8F0] text-[#718096] rounded-[10px] flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
          {canSendNotification && (
            <button 
              onClick={handleSendNotificationBulk} 
              disabled={isSendingNotif || (!filterType && !filterStatus && !filterGroup)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-[10px] bg-[#1A202C] text-white border border-[#2D3748] text-[12px] font-semibold whitespace-nowrap flex-shrink-0 transition-colors hover:bg-[#2D3748] disabled:opacity-50">
              {isSendingNotif ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              )}
              Kirim Telegram Filter
            </button>
          )}
        </div>
      </div>

      {/* ── Search & Filter Bar (Desktop Mockup Style) ── */}
      <div className="hidden md:flex bg-white border border-[#E2E8F0] rounded-[12px] p-2 gap-3 items-center shadow-sm">
        <div className="relative flex-1 max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
          <input
            className="w-full pl-9 pr-3 h-10 border-none bg-transparent text-[13px] text-[#1A202C] focus:outline-none placeholder-[#A0AEC0]"
            placeholder="Cari berdasarkan nama dokumen..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              // Auto search on desktop when typing could be nice, or just rely on enter
            }}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
          />
        </div>
        <div className="w-px h-6 bg-[#E2E8F0]"></div>
        
        <div className="min-w-[160px]">
          <Select value={filterType || "all"} onValueChange={(v) => { setFilterType(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="h-10 border-none bg-transparent hover:bg-[#F7F8FA] shadow-none focus:ring-0 px-3 text-[13px] font-medium text-[#4A5568]">
              <SelectValue placeholder="Tipe Dokumen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              {typeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="w-px h-6 bg-[#E2E8F0]"></div>
        
        <div className="min-w-[160px]">
          <Select value={filterStatus || "all"} onValueChange={(v) => { setFilterStatus(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="h-10 border-none bg-transparent hover:bg-[#F7F8FA] shadow-none focus:ring-0 px-3 text-[13px] font-medium text-[#4A5568]">
              <SelectValue placeholder="Status Berakhir" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-px h-6 bg-[#E2E8F0]"></div>
        
        <div className="min-w-[160px]">
          <Select value={filterGroup || "all"} onValueChange={(v) => { setFilterGroup(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="h-10 border-none bg-transparent hover:bg-[#F7F8FA] shadow-none focus:ring-0 px-3 text-[13px] font-medium text-[#4A5568]">
              <SelectValue placeholder="Grup Dokumen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Grup</SelectItem>
              {groupOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <button onClick={() => { applySearch(); }} className="ml-2 h-9 px-4 bg-[#F7F8FA] hover:bg-[#E2E8F0] text-[#4A5568] text-[13px] font-semibold rounded-[8px] transition-colors border border-[#E2E8F0]">
          Search
        </button>

        <div className="ml-auto flex items-center gap-2">
          {hasActiveFilter && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 h-9 text-[13px] font-semibold text-[#2B6CB0] hover:bg-[#EBF4FF] rounded-[8px] transition-colors">
              <Filter className="w-3.5 h-3.5" /> Reset Filter
            </button>
          )}

          {canSendNotification && (
            <button 
              onClick={handleSendNotificationBulk} 
              disabled={isSendingNotif || (!filterType && !filterStatus && !filterGroup)}
              title={!filterType && !filterStatus && !filterGroup ? "Pilih minimal 1 filter (Tipe/Status/Grup) untuk kirim massal" : "Kirim Telegram Massal berdasar Filter"}
              className="flex items-center gap-1.5 px-3 h-9 bg-[#1A202C] text-white hover:bg-[#2D3748] text-[13px] font-semibold rounded-[8px] transition-colors border border-[#2D3748] disabled:opacity-50 disabled:cursor-not-allowed">
              {isSendingNotif ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              )}
              Kirim Telegram Filter
            </button>
          )}
        </div>
      </div>

      {/* ── Desktop Table (Mockup Style) ── */}
      <div className="hidden md:block rounded-[12px] border border-[#E2E8F0] overflow-hidden bg-white shadow-sm mt-4">
        <table className="w-full">
          <thead className="bg-[#F8FAFC]">
            <tr>
              {["No", "Nama Dokumen", "Tipe", "Grup", "Tanggal Berakhir", "Sisa Hari", "Status", "Tindak Lanjut", "Aksi"].map(h => (
                <th key={h} className="px-5 py-4 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {loading && items.length === 0 ? (
              <tr><td colSpan={9} className="py-16 text-center text-[#718096] text-[14px]">Memuat data...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={9} className="py-16 text-center text-[#718096] text-[14px]">Tidak ada dokumen yang ditemukan.</td></tr>
            ) : items.map((doc, idx) => {
              const daysColor = doc.daysRemaining < 0 ? "text-[#DC2626]" : (doc.daysRemaining < 30 ? "text-[#F59E0B]" : "text-[#059669]");
              return (
                <tr key={doc.id} className="hover:bg-[#F7F8FA] transition-colors">
                  <td className="px-5 py-4 text-[13px] text-[#718096] font-mono">{(page - 1) * PAGE_SIZE + idx + 1 < 10 ? `0${(page - 1) * PAGE_SIZE + idx + 1}` : (page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-5 py-4">
                    <p className="text-[14px] font-bold text-[#1A202C] leading-snug">{doc.name}</p>
                    {doc.referenceNumber && <p className="text-[11px] text-[#718096] uppercase mt-1 tracking-wide">REF: {doc.referenceNumber}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[13px] text-[#4A5568]">{doc.type}</span>
                  </td>
                  <td className="px-5 py-4">
                    {doc.groupName ? <span className="text-[11px] text-[#2B6CB0] bg-[#EBF4FF] px-2 py-1 rounded-[6px] font-medium">{doc.groupName}</span> : <span className="text-[13px] text-[#A0AEC0]">-</span>}
                  </td>
                  <td className="px-5 py-4 text-[13px] font-semibold text-[#1A202C]">
                    {fmtDate(doc.validUntil)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className={`text-[14px] font-bold ${daysColor}`}>
                        {Math.abs(doc.daysRemaining)}
                      </span>
                      <span className={`text-[11px] ${daysColor} font-medium`}>{doc.daysRemaining < 0 ? "Hari lalu" : "Hari"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <TableExpiryBadge status={doc.expiryStatus} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="relative">
                      <Select
                        value={doc.followUpStatus}
                        onValueChange={(v) => handleFollowUpChange(doc, v)}
                        disabled={!canUpdate}
                      >
                        <SelectTrigger className="h-8 min-w-[120px] text-[12px] font-medium border-[#E2E8F0] rounded-[6px] bg-white focus:ring-1 focus:ring-[#2B6CB0]/20 text-[#4A5568]">
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        <SelectContent>
                          {FOLLOW_UP_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s === "SedangDiproses" ? "Sedang Diproses" : s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openDetail(doc)}
                        title="Lihat Detail"
                        className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      {doc.fileLink && (
                        <a href={doc.fileLink} target="_blank" rel="noopener noreferrer"
                          className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {canSendNotification && (
                        <button onClick={() => handleSendNotification(doc)} disabled={sendingNotifId === doc.id}
                          title="Kirim Notifikasi Telegram (Manual)"
                          className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#229ED9] hover:bg-[#E8F4FD] transition-colors disabled:opacity-50">
                          {sendingNotifId === doc.id ? <RotateCw className="w-4 h-4 animate-spin" /> : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                          )}
                        </button>
                      )}
                      {canUpdate && (
                        <button onClick={() => openEdit(doc)}
                          className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => setDeleteConfirm(doc)}
                          className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#718096] hover:bg-red-50 hover:text-[#DC2626] transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="md:hidden flex flex-col gap-3">
        {loading && items.length === 0 ? (
          <div className="py-12 text-center text-[#718096] text-[13px]">Memuat...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-[#718096] text-[13px]">Tidak ada data</div>
        ) : items.map((doc) => (
          <div key={doc.id} className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-sm p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-[#1A202C] leading-snug">{doc.name}</p>
                {doc.referenceNumber && <p className="text-[10px] text-[#718096] uppercase tracking-wider mt-1">REF: {doc.referenceNumber}</p>}
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <span className="text-[12px] text-[#4A5568] bg-[#F7F8FA] px-2 py-0.5 rounded-[4px]">{doc.type}</span>
                  {doc.groupName && <span className="text-[11px] text-[#2B6CB0] bg-[#EBF4FF] px-2 py-0.5 rounded-[4px] font-medium">{doc.groupName}</span>}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <MobileExpiryBadge status={doc.expiryStatus} />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[12px] text-[#718096] bg-[#F7F8FA] p-2 rounded-[8px]">
              <Calendar className="w-3.5 h-3.5" />
              <span>Berakhir: <span className="font-semibold text-[#1A202C]">{fmtDate(doc.validUntil)}</span></span>
              <span className={`ml-auto font-bold ${doc.daysRemaining < 0 ? "text-[#DC2626]" : (doc.daysRemaining < 30 ? "text-[#F59E0B]" : "text-[#059669]")}`}>
                {doc.daysRemaining < 0 ? `${Math.abs(doc.daysRemaining)}h lalu` : `${doc.daysRemaining} hari`}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
              <FollowUpBadge 
                status={doc.followUpStatus} 
                onClick={canUpdate ? () => handleFollowUpChange(doc, doc.followUpStatus) : undefined} 
              />
              <div className="flex gap-1 ml-auto">
                <button onClick={() => openDetail(doc)}
                  title="Lihat Detail"
                  className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-white border border-[#E2E8F0] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0]">
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {doc.fileLink && (
                  <a href={doc.fileLink} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-white border border-[#E2E8F0] text-[#718096]">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {canSendNotification && (
                  <button onClick={() => handleSendNotification(doc)} disabled={sendingNotifId === doc.id}
                    title="Kirim Notifikasi Telegram (Manual)"
                    className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-white border border-[#E2E8F0] text-[#229ED9] hover:bg-[#E8F4FD] disabled:opacity-50">
                    {sendingNotifId === doc.id ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                    )}
                  </button>
                )}
                {canUpdate && (
                  <button onClick={() => openEdit(doc)}
                    className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-white border border-[#E2E8F0] text-[#718096]">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => setDeleteConfirm(doc)}
                    className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-white border border-[#E2E8F0] text-[#718096] hover:text-[#DC2626]">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pagination (Desktop & Mobile) ── */}
      {totalPages > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 pb-12 md:pb-0">
          <div className="text-[13px] text-[#718096] text-center md:text-left">
            Menampilkan <span className="font-semibold text-[#1A202C]">{(page - 1) * PAGE_SIZE + 1}</span> - <span className="font-semibold text-[#1A202C]">{Math.min(page * PAGE_SIZE, totalCount)}</span> dari <span className="font-semibold text-[#1A202C]">{totalCount.toLocaleString()}</span> dokumen
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-9 h-9 rounded-[8px] bg-white border border-[#E2E8F0] text-[#718096] hover:bg-[#F7F8FA] hover:text-[#2B6CB0] disabled:opacity-40 flex items-center justify-center text-[16px] transition-colors">
              ‹
            </button>
            <div className="flex items-center px-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum = page;
                if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                
                if (pageNum < 1 || pageNum > totalPages) return null;
                
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)}
                    className={`w-9 h-9 rounded-[8px] flex items-center justify-center text-[13px] font-semibold transition-colors mx-0.5 ${page === pageNum ? 'bg-[#1B3A6B] text-white' : 'bg-transparent text-[#718096] hover:bg-[#F7F8FA]'}`}>
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && page < totalPages - 2 && (
                <>
                  <span className="w-9 h-9 flex items-center justify-center text-[#718096]">...</span>
                  <button onClick={() => setPage(totalPages)}
                    className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[13px] font-semibold text-[#718096] hover:bg-[#F7F8FA]">
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-9 h-9 rounded-[8px] bg-white border border-[#E2E8F0] text-[#718096] hover:bg-[#F7F8FA] hover:text-[#2B6CB0] disabled:opacity-40 flex items-center justify-center text-[16px] transition-colors">
              ›
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile FAB group ── */}
      <div className="md:hidden fixed bottom-[100px] right-4 z-30 flex flex-col items-end gap-2">
        {canCreate && (
          <button
            onClick={() => navigate("/operational-documents/import")}
            className="flex items-center gap-2 bg-[#2B6CB0] hover:bg-[#1B3A6B] text-white px-4 py-3 rounded-full shadow-lg font-bold text-[13px] transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
        )}
        <button onClick={handleExport}
          className="flex items-center gap-2 bg-[#059669] hover:bg-[#047857] text-white px-4 py-3 rounded-full shadow-lg font-bold text-[13px] transition-all active:scale-95">
          <Download className="w-4 h-4" /> Export
        </button>
        {canCreate && (
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-[#D94F2B] hover:bg-[#B83D20] text-white px-5 py-3.5 rounded-full shadow-lg font-bold shadow-[#D94F2B]/40 transition-all active:scale-95 text-[15px]">
            <Plus className="w-5 h-5" /> Tambah
          </button>
        )}
      </div>

      {/* ── Mobile Filter BottomSheets ── */}
      <BottomSheet open={typeSheetOpen} onClose={() => setTypeSheetOpen(false)} title="Tipe Dokumen">
        {[{ value: "", label: "Semua Tipe" }, ...typeOptions].map(opt => (
          <button key={opt.value} onClick={() => { setFilterType(opt.value); setPage(1); setTypeSheetOpen(false); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-[10px] text-[14px] font-medium ${filterType === opt.value ? "bg-[#EBF4FF] text-[#1B3A6B] font-semibold" : "text-[#1A202C] hover:bg-[#F7F8FA]"}`}>
            <span>{opt.label}</span>
            {filterType === opt.value && <CheckCircle className="w-4 h-4 text-[#2B6CB0]" />}
          </button>
        ))}
      </BottomSheet>

      <BottomSheet open={statusSheetOpen} onClose={() => setStatusSheetOpen(false)} title="Status Kadaluarsa">
        {[{ value: "", label: "Semua Status" }, ...statusOptions].map(opt => (
          <button key={opt.value} onClick={() => { setFilterStatus(opt.value); setPage(1); setStatusSheetOpen(false); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-[10px] text-[14px] font-medium ${filterStatus === opt.value ? "bg-[#EBF4FF] text-[#1B3A6B] font-semibold" : "text-[#1A202C] hover:bg-[#F7F8FA]"}`}>
            <span>{opt.label}</span>
            {filterStatus === opt.value && <CheckCircle className="w-4 h-4 text-[#2B6CB0]" />}
          </button>
        ))}
      </BottomSheet>

      <BottomSheet open={followUpSheetOpen} onClose={() => setFollowUpSheetOpen(false)} title="Status Tindak Lanjut">
        {[{ value: "", label: "Semua" }, ...followUpOptions].map(opt => (
          <button key={opt.value} onClick={() => { setFilterFollowUp(opt.value); setPage(1); setFollowUpSheetOpen(false); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-[10px] text-[14px] font-medium ${filterFollowUp === opt.value ? "bg-[#EBF4FF] text-[#1B3A6B] font-semibold" : "text-[#1A202C] hover:bg-[#F7F8FA]"}`}>
            <span>{opt.label}</span>
            {filterFollowUp === opt.value && <CheckCircle className="w-4 h-4 text-[#2B6CB0]" />}
          </button>
        ))}
      </BottomSheet>

      {/* ── Form Content ── */}
      {(() => {
        const FormContent = (
          <div className="space-y-4 py-2">
            <div>
              <label className="text-[12px] font-semibold text-[#4A5568] mb-1.5 block">Nama Dokumen <span className="text-[#DC2626]">*</span></label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Contoh: Sertifikasi Alat Uji HT-102" className="h-11 rounded-[10px]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#4A5568] mb-1.5 block">Tipe Dokumen <span className="text-[#DC2626]">*</span></label>
              <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="h-11 rounded-[10px] bg-white border-[#E2E8F0] text-[#1A202C] text-[13px]">
                  <SelectValue placeholder="-- Pilih Tipe --" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#4A5568] mb-1.5 block">No. Referensi</label>
              <Input value={form.referenceNumber} onChange={(e) => setForm(f => ({ ...f, referenceNumber: e.target.value }))} placeholder="REF/CERT/POL nomor..." className="h-11 rounded-[10px]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#4A5568] mb-1.5 block flex items-center gap-1">
                Grup Dokumen (Opsional)
                <div className="group relative cursor-help">
                  <Info className="w-3.5 h-3.5 text-[#718096] hover:text-[#2B6CB0]" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-[#1A202C] text-white text-[11px] rounded-[6px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none text-center shadow-lg">
                    Dokumen dengan Nama Grup dan Tanggal Berakhir yang sama akan digabung jadi 1 notifikasi WA.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A202C]"></div>
                  </div>
                </div>
              </label>
              <Input value={form.groupName} onChange={(e) => setForm(f => ({ ...f, groupName: e.target.value }))} placeholder="Contoh: ISR Link Backbone 2027 KPC" className="h-11 rounded-[10px]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-semibold text-[#4A5568] mb-1.5 block">Tanggal Berlaku <span className="text-[#DC2626]">*</span></label>
                <FormMobileDatePicker date={validFromDate} onSelect={setValidFromDate} placeholder="Pilih tanggal" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#4A5568] mb-1.5 block">Tanggal Berakhir <span className="text-[#DC2626]">*</span></label>
                <FormMobileDatePicker date={validUntilDate} onSelect={setValidUntilDate} placeholder="Pilih tanggal" />
              </div>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#4A5568] mb-1.5 block">Nama PIC</label>
              <Input value={form.picName} onChange={(e) => setForm(f => ({ ...f, picName: e.target.value }))} placeholder="Nama penanggung jawab" className="h-11 rounded-[10px]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#4A5568] mb-1.5 block">Telegram Chat ID PIC</label>
              <Input value={form.picTelegramId} onChange={(e) => setForm(f => ({ ...f, picTelegramId: e.target.value }))} placeholder="Chat ID Telegram (cth: 123456789)" type="text" className="h-11 rounded-[10px]" />
              <p className="text-[11px] text-[#718096] mt-1.5">Chat ID dari Telegram (buka bot @userinfobot untuk cek ID Anda). Pisahkan dengan koma jika lebih dari 1.</p>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#4A5568] mb-1.5 block">Link Dokumen (OneDrive/SharePoint)</label>
              <Input value={form.fileLink} onChange={(e) => setForm(f => ({ ...f, fileLink: e.target.value }))} placeholder="https://..." type="url" className="h-11 rounded-[10px]" />
            </div>
          </div>
        );

        const FormActions = (
          <>
            <Button variant="outline" onClick={closeForm} disabled={isBusy} className="h-11 rounded-[10px] font-semibold flex-1 sm:flex-none">Batal</Button>
            <Button onClick={handleSubmit} disabled={isBusy}
              className="h-11 rounded-[10px] bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white font-semibold flex-1 sm:flex-none">
              {isBusy ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Tambah Dokumen"}
            </Button>
          </>
        );

        if (isMobile) {
          return (
            <BottomSheet open={formOpen} onClose={closeForm} title={editId ? "Edit Dokumen" : "Tambah Dokumen Baru"} size="xl">
              {FormContent}
              <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex gap-3">
                {FormActions}
              </div>
            </BottomSheet>
          );
        }

        return (
          <Dialog open={formOpen} onOpenChange={(o) => !o && closeForm()}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-[16px]">
              <DialogHeader className="mb-2">
                <DialogTitle className="text-[20px] font-bold text-[#1A202C]">{editId ? "Edit Dokumen" : "Tambah Dokumen Baru"}</DialogTitle>
              </DialogHeader>
              {FormContent}
              <DialogFooter className="mt-4 pt-4 border-t border-[#E2E8F0]">
                {FormActions}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* ── Delete Confirm ── */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm bg-white rounded-[16px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#DC2626]"><AlertTriangle className="w-5 h-5" /> Hapus Dokumen</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-[14px] text-[#4A5568] leading-relaxed">
              Yakin ingin menghapus dokumen <br/><span className="font-bold text-[#1A202C]">{deleteConfirm?.name}</span>?
            </p>
            <p className="text-[13px] text-[#718096] mt-2 italic">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <DialogFooter className="mt-2 pt-4 border-t border-[#E2E8F0] gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="h-10 rounded-[10px] font-semibold">Batal</Button>
            <Button onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}
              disabled={isBusy}
              className="h-10 rounded-[10px] bg-[#DC2626] hover:bg-red-700 text-white font-semibold">
              {isBusy ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-[16px]">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-[20px] font-bold text-[#1A202C]">Detail Dokumen</DialogTitle>
          </DialogHeader>
          {selectedDetailDoc && (
            <div className="space-y-4">
              <div>
                <p className="text-[12px] font-semibold text-[#718096] uppercase tracking-wider mb-1">Nama Dokumen</p>
                <p className="text-[14px] font-medium text-[#1A202C]">{selectedDetailDoc.name}</p>
                {selectedDetailDoc.referenceNumber && (
                  <p className="text-[13px] text-[#718096] mt-0.5">REF: {selectedDetailDoc.referenceNumber}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[12px] font-semibold text-[#718096] uppercase tracking-wider mb-1">Tipe</p>
                  <p className="text-[14px] font-medium text-[#1A202C]">{selectedDetailDoc.type}</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#718096] uppercase tracking-wider mb-1">Grup</p>
                  <p className="text-[14px] font-medium text-[#1A202C]">{selectedDetailDoc.groupName || "-"}</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#718096] uppercase tracking-wider mb-1">Mulai Berlaku</p>
                  <p className="text-[14px] font-medium text-[#1A202C]">{format(parseISO(selectedDetailDoc.validFrom), "dd MMM yyyy", { locale: localeId })}</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#718096] uppercase tracking-wider mb-1">Berakhir</p>
                  <p className="text-[14px] font-medium text-[#1A202C]">{format(parseISO(selectedDetailDoc.validUntil), "dd MMM yyyy", { locale: localeId })}</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#718096] uppercase tracking-wider mb-1">Nama PIC</p>
                  <p className="text-[14px] font-medium text-[#1A202C]">{selectedDetailDoc.picName || "-"}</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#718096] uppercase tracking-wider mb-1">Telegram Chat ID</p>
                  <p className="text-[14px] font-medium text-[#1A202C]">{selectedDetailDoc.picTelegramId || "-"}</p>
                </div>
              </div>
              {selectedDetailDoc.followUpRemark && (
                <div>
                  <p className="text-[12px] font-semibold text-[#718096] uppercase tracking-wider mb-1">Catatan Tindak Lanjut</p>
                  <p className="text-[14px] font-medium text-[#1A202C] whitespace-pre-line">{selectedDetailDoc.followUpRemark}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="mt-4 pt-4 border-t border-[#E2E8F0]">
            <Button onClick={() => setDetailModalOpen(false)} className="w-full h-10 rounded-[10px] font-semibold bg-[#1A202C] hover:bg-[#2D3748] text-white">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Follow Up Modal */}
      <Dialog open={followUpModalOpen} onOpenChange={setFollowUpModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-[16px]">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-[20px] font-bold text-[#1A202C]">Tindak Lanjut</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#4A5568] mb-1">Status</label>
              <Select value={followUpFormStatus} onValueChange={setFollowUpFormStatus}>
                <SelectTrigger className="w-full h-10 rounded-[8px] bg-white border-[#E2E8F0]">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {FOLLOW_UP_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s === "SedangDiproses" ? "Sedang Diproses" : s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#4A5568] mb-1">Catatan</label>
              <textarea
                value={followUpFormRemark}
                onChange={(e) => setFollowUpFormRemark(e.target.value)}
                placeholder="Tambahkan catatan tindak lanjut..."
                className="w-full h-24 text-[14px] border border-[#E2E8F0] rounded-[8px] p-3 focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent resize-none"
              />
            </div>
          </div>
          <DialogFooter className="mt-4 pt-4 border-t border-[#E2E8F0] flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setFollowUpModalOpen(false)} className="h-10 rounded-[10px] font-semibold">Batal</Button>
            <Button onClick={submitFollowUpStatus} disabled={isUpdatingFollowUp} className="h-10 rounded-[10px] font-semibold bg-[#2B6CB0] hover:bg-[#1A365D] text-white">
              {isUpdatingFollowUp ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



