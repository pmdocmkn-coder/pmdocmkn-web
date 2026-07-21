import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  FileText, Plus, Search, ExternalLink, Edit2, Trash2,
  CheckCircle, Clock, AlertTriangle, ChevronDown, Filter, X,
  Calendar, ChevronRight, RotateCw, CalendarX, Loader2,
  Download, Upload, FileSpreadsheet, Info, Eye
} from "lucide-react";
import { MobilePageHeader } from "../ui/MobilePageHeader";
import BottomSheet from "../common/BottomSheet";
import { ResponsiveModal } from "../common/ResponsiveModal";
import { PageWrapper } from "../common/PageWrapper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
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

// ── Combobox Filter Helper ───────────────────────────────────────────────────
function ComboboxFilter({
  value,
  onChange,
  options,
  placeholder,
  emptyText = "Tidak ditemukan.",
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = value === "all" || !value 
    ? `Semua ${placeholder.split(' ')[0]}` 
    : options.find((opt) => opt.value === value)?.label || value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          className="flex items-center justify-between w-full h-10 px-3 text-[13px] font-medium text-[#4A5568] bg-transparent hover:bg-[#F7F8FA] rounded-[6px] transition-colors"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Cari ${placeholder.toLowerCase()}...`} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Semua {placeholder.split(' ')[0]}
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    !value || value === "all" ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label} // shadcn command uses the text content to search, but we can just use label
                  onSelect={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === opt.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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
  // Multi-PIC entries — setiap entry punya nama dan telegramId
  const [picEntries, setPicEntries] = useState<{ name: string; telegramId: string }[]>([{ name: "", telegramId: "" }]);
  const [deleteConfirm, setDeleteConfirm] = useState<OperationalDocumentDto | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  
  // BHP State
  const [bhpInvoiceNumbers, setBhpInvoiceNumbers] = useState<Record<number, string>>({});
  const [isUpdatingBhp, setIsUpdatingBhp] = useState<Record<number, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [editingBhpYear, setEditingBhpYear] = useState<Record<number, boolean>>({}); // key = year

  const toggleRow = (id: number) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const canCreate = hasPermission("operationaldocument.create");
  const canUpdate = hasPermission("operationaldocument.update");
  const canDelete = hasPermission("operationaldocument.delete");
  const canSendNotification = hasPermission("operationaldocument.sendnotification");
  const canUpdateBhp = hasPermission("operationaldocument.updatebhp");

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

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (search !== searchInput) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput, search]);

  // ── Actions ──
  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm());
    setValidFromDate(undefined);
    setValidUntilDate(undefined);
    setPicEntries([{ name: "", telegramId: "" }]);
    setFormOpen(true);
  };
  
  const openDetail = (doc: OperationalDocumentDto) => {
    setSelectedDetailDoc(doc);
    setDetailModalOpen(true);
  };

  const openEdit = (doc: OperationalDocumentDto) => {
    setEditId(doc.id);
    setForm({
      name: doc.name,
      type: doc.type,
      referenceNumber: doc.referenceNumber ?? "",
      groupName: doc.groupName ?? "",
      validFrom: doc.validFrom,
      validUntil: doc.validUntil,
      picName: doc.picName ?? "",
      picTelegramId: doc.picTelegramId ?? "",
      fileLink: doc.fileLink ?? ""
    });
    setValidFromDate(parseISO(doc.validFrom));
    setValidUntilDate(parseISO(doc.validUntil));

    // Parse picEntries dari data — split nama & telegram ID per koma
    const names = (doc.picName ?? "").split(",").map(n => n.trim()).filter(Boolean);
    const tids = (doc.picTelegramId ?? "").split(",").map(t => t.trim()).filter(Boolean);
    const maxLen = Math.max(names.length, tids.length, 1);
    setPicEntries(
      Array.from({ length: maxLen }, (_, i) => ({
        name: names[i] ?? "",
        telegramId: tids[i] ?? "",
      }))
    );

    setFormOpen(true);
  };
  const closeForm = () => {
    setFormOpen(false);
    setEditId(null);
    setForm(defaultForm());
    setPicEntries([{ name: "", telegramId: "" }]);
  };
  
  const handleSubmit = async () => {
    // Serialize picEntries → picName & picTelegramId (koma-separated, skip yang kosong)
    const validPicEntries = picEntries.filter(p => p.name.trim() || p.telegramId.trim());
    const picName = validPicEntries.map(p => p.name.trim()).join(",");
    const picTelegramId = [...new Set(validPicEntries.map(p => p.telegramId.trim()).filter(Boolean))].join(",");

    const dto: CreateOperationalDocumentDto = {
      ...form,
      validFrom: validFromDate ? validFromDate.toISOString() : form.validFrom,
      validUntil: validUntilDate ? validUntilDate.toISOString() : form.validUntil,
      picName: picName || undefined as any,
      picTelegramId: picTelegramId || undefined as any,
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

  const handleToggleBhp = async (docId: number, year: number, currentIsPaid: boolean) => {
    setIsUpdatingBhp(prev => ({ ...prev, [year]: true }));
    try {
      if (currentIsPaid) {
        // Unmark
        const res = await operationalDocumentApi.unmarkBhpPayment(docId, year);
        toast({ title: "BHP Dibatalkan", description: res.data?.message });
        // Keluar dari mode edit jika sedang edit
        setEditingBhpYear(prev => ({ ...prev, [year]: false }));
      } else {
        // Mark (requires invoice number)
        const inv = bhpInvoiceNumbers[year];
        if (!inv || !inv.trim()) {
          toast({ title: "Gagal", description: "Nomor Invoice harus diisi", variant: "destructive" });
          setIsUpdatingBhp(prev => ({ ...prev, [year]: false }));
          return;
        }
        const res = await operationalDocumentApi.markBhpPayment(docId, year, inv);
        toast({ title: "BHP Disimpan", description: res.data?.message });
        setBhpInvoiceNumbers(prev => ({ ...prev, [year]: "" }));
        setEditingBhpYear(prev => ({ ...prev, [year]: false }));
      }
      
      // Reload document detail if modal is open
      if (selectedDetailDoc && selectedDetailDoc.id === docId) {
        const res = await operationalDocumentApi.getById(docId);
        setSelectedDetailDoc(res.data.data);
      }
      loadData();
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.response?.data?.message ?? e.message, variant: "destructive" });
    } finally {
      setIsUpdatingBhp(prev => ({ ...prev, [year]: false }));
    }
  };

  // Masuk mode edit invoice untuk item yang sudah paid
  const startEditBhpInvoice = (year: number, currentInvoice: string) => {
    setBhpInvoiceNumbers(prev => ({ ...prev, [year]: currentInvoice }));
    setEditingBhpYear(prev => ({ ...prev, [year]: true }));
  };

  // Simpan invoice yang diedit (re-mark dengan invoice baru)
  const handleSaveEditBhp = async (docId: number, year: number) => {
    const inv = bhpInvoiceNumbers[year];
    if (!inv || !inv.trim()) {
      toast({ title: "Gagal", description: "Nomor Invoice tidak boleh kosong", variant: "destructive" });
      return;
    }
    setIsUpdatingBhp(prev => ({ ...prev, [year]: true }));
    try {
      const res = await operationalDocumentApi.markBhpPayment(docId, year, inv);
      toast({ title: "Invoice Diperbarui", description: res.data?.message });
      setEditingBhpYear(prev => ({ ...prev, [year]: false }));
      setBhpInvoiceNumbers(prev => ({ ...prev, [year]: "" }));
      loadData();
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.response?.data?.message ?? e.message, variant: "destructive" });
    } finally {
      setIsUpdatingBhp(prev => ({ ...prev, [year]: false }));
    }
  };

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
      setIsExporting(true);
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
    } finally {
      setIsExporting(false);
    }
  };

  // ── Excel Template Download ───────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
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
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <PageWrapper>

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
            disabled={isExporting}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#E2E8F0] bg-white text-[13px] font-semibold text-[#4A5568] transition-colors ${isExporting ? "opacity-60 cursor-not-allowed" : "hover:bg-[#F7F8FA]"}`}
            title="Export ke Excel"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 text-[#059669] animate-spin" /> : <Download className="w-3.5 h-3.5 text-[#059669]" />} Export
          </button>
          {canCreate && (
            <>
              <button
                onClick={handleDownloadTemplate}
                disabled={isDownloadingTemplate}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#E2E8F0] bg-white text-[13px] font-semibold text-[#4A5568] transition-colors ${isDownloadingTemplate ? "opacity-60 cursor-not-allowed" : "hover:bg-[#F7F8FA]"}`}
                title="Download Template Import"
              >
                {isDownloadingTemplate ? <Loader2 className="w-3.5 h-3.5 text-[#2B6CB0] animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-[#2B6CB0]" />} Template
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {/* Card 1 - Total */}
        <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-4 md:p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-[12px] bg-gradient-to-br from-[#1B3A6B] to-[#2B6CB0] flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#1B3A6B]/20">
            <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] font-bold text-[#718096] uppercase tracking-wider">Total Dokumen</p>
            <p className="text-[26px] md:text-[30px] font-bold text-[#1A202C] leading-none mt-1.5">{summary.totalDocuments.toLocaleString()}</p>
            <p className="text-[11px] text-[#718096] mt-1">dokumen aktif terpantau</p>
          </div>
        </div>
        {/* Card 2 - Expiring */}
        <div className="bg-white border border-amber-100 rounded-[14px] p-4 md:p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-[12px] bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-200">
            <RotateCw className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] font-bold text-[#718096] uppercase tracking-wider">Akan Berakhir &lt; 30 Hari</p>
            <p className="text-[26px] md:text-[30px] font-bold text-[#F59E0B] leading-none mt-1.5">{summary.expiringSoon}</p>
            <p className="text-[11px] text-[#718096] mt-1">segera perbarui dokumen ini</p>
          </div>
        </div>
        {/* Card 3 - Expired */}
        <div className="bg-white border border-red-100 rounded-[14px] p-4 md:p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-[12px] bg-gradient-to-br from-[#DC2626] to-[#EF4444] flex items-center justify-center flex-shrink-0 shadow-sm shadow-red-200">
            <CalendarX className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] font-bold text-[#718096] uppercase tracking-wider">Sudah Expired</p>
            <p className="text-[26px] md:text-[30px] font-bold text-[#DC2626] leading-none mt-1.5">{summary.expired}</p>
            <p className="text-[11px] text-[#718096] mt-1">tindakan segera diperlukan</p>
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
            placeholder="Cari..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
            }}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
          />
        </div>
        <div className="w-px h-6 bg-[#E2E8F0]"></div>
        
        <div className="min-w-[160px]">
          <ComboboxFilter
            value={filterType}
            onChange={(v) => { setFilterType(v); setPage(1); }}
            options={typeOptions}
            placeholder="Tipe Dokumen"
          />
        </div>

        <div className="w-px h-6 bg-[#E2E8F0]"></div>
        
        <div className="min-w-[160px]">
          <ComboboxFilter
            value={filterStatus}
            onChange={(v) => { setFilterStatus(v); setPage(1); }}
            options={statusOptions}
            placeholder="Status Berakhir"
          />
        </div>
        <div className="w-px h-6 bg-[#E2E8F0]"></div>
        
        <div className="min-w-[160px]">
          <ComboboxFilter
            value={filterGroup}
            onChange={(v) => { setFilterGroup(v); setPage(1); }}
            options={groupOptions}
            placeholder="Grup Dokumen"
          />
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
              <th className="px-5 py-4 w-10"></th>
              {["No", "Nama Dokumen", "Tipe", "Grup", "Tanggal Berakhir", "Sisa Hari", "Status", "Tindak Lanjut", "Aksi"].map(h => (
                <th key={h} className="px-5 py-4 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {loading && items.length === 0 ? (
              <tr><td colSpan={10} className="py-16 text-center text-[#718096] text-[14px]">Memuat data...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={10} className="py-16 text-center text-[#718096] text-[14px]">Tidak ada dokumen yang ditemukan.</td></tr>
            ) : items.map((doc, idx) => {
              const daysColor = doc.daysRemaining < 0 ? "text-[#DC2626]" : (doc.daysRemaining < 30 ? "text-[#F59E0B]" : "text-[#059669]");
              const isExpanded = expandedRows[doc.id];
              const isIsr = doc.type?.toLowerCase().includes("isr");
              return (
                <React.Fragment key={doc.id}>
                  <tr className={`hover:bg-[#F7F8FA] transition-colors ${isExpanded ? 'bg-[#F0F5FF]' : ''}`}>
                    <td className="px-2 py-4 text-center">
                      {isIsr && (
                        <button
                          onClick={() => toggleRow(doc.id)}
                          className={`w-7 h-7 flex items-center justify-center rounded-[6px] transition-all ${
                            isExpanded
                              ? 'bg-[#1B3A6B] text-white shadow-sm'
                              : 'text-[#718096] hover:bg-[#E2E8F0] hover:text-[#1A202C]'
                          }`}
                          title={isExpanded ? 'Tutup Checklist BHP' : 'Lihat Checklist BHP'}
                        >
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[#718096] font-mono">{(page - 1) * PAGE_SIZE + idx + 1 < 10 ? `0${(page - 1) * PAGE_SIZE + idx + 1}` : (page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="px-5 py-4">
                      <p className="text-[14px] font-bold text-[#1A202C] leading-snug">{doc.name}</p>
                      {doc.referenceNumber && <p className="text-[11px] text-[#718096] uppercase mt-1 tracking-wide">REF: {doc.referenceNumber}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[13px] text-[#4A5568] block">{doc.type}</span>
                      {isIsr && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-[#718096] uppercase tracking-wide">BHP</span>
                            <span className={`text-[10px] font-bold ${
                              (doc.bhpPaidCount || 0) === (doc.bhpTotalCount || 0) ? 'text-[#059669]' : 'text-[#F59E0B]'
                            }`}>
                              {doc.bhpPaidCount || 0}/{doc.bhpTotalCount || 0}
                            </span>
                          </div>
                          <Progress
                            value={((doc.bhpPaidCount || 0) / (doc.bhpTotalCount || 1)) * 100}
                            className={`h-2 w-20 bg-[#E2E8F0] ${
                              (doc.bhpPaidCount || 0) === (doc.bhpTotalCount || 0)
                                ? '[&>div]:bg-[#059669]'
                                : '[&>div]:bg-[#F59E0B]'
                            }`}
                          />
                        </div>
                      )}
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
                  
                  {isExpanded && doc.bhpChecklist && (
                    <tr className="bg-gradient-to-b from-[#F0F5FF] to-[#F8FAFC] border-b border-[#E2E8F0]">
                      <td colSpan={10} className="p-0">
                        <div className="px-8 py-6">
                          {/* Header */}
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-[8px] bg-[#1B3A6B] flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <h4 className="text-[13px] font-bold text-[#1B3A6B]">Checklist Pembayaran BHP Tahunan</h4>
                                <p className="text-[11px] text-[#718096]">
                                  {doc.bhpPaidCount || 0} dari {doc.bhpTotalCount || 0} tahun telah lunas
                                </p>
                              </div>
                            </div>
                            {/* Overall Progress */}
                            <div className="flex items-center gap-3 bg-white rounded-[10px] border border-[#E2E8F0] px-4 py-2 shadow-sm">
                              <div className="w-28">
                                <Progress
                                  value={((doc.bhpPaidCount || 0) / (doc.bhpTotalCount || 1)) * 100}
                                  className="h-2 bg-[#E2E8F0] [&>div]:bg-[#059669] [&>div]:transition-all [&>div]:duration-700"
                                />
                              </div>
                              <span className="text-[13px] font-bold text-[#059669]">
                                {Math.round(((doc.bhpPaidCount || 0) / (doc.bhpTotalCount || 1)) * 100)}%
                              </span>
                            </div>
                          </div>

                          {/* Timeline vertikal */}
                          <div className="relative">
                            {/* Garis koneksi vertikal */}
                            <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-[#E2E8F0]" />

                            <div className="space-y-3">
                              {doc.bhpChecklist.map((chk, chkIdx) => (
                                <div key={chk.id} className="relative flex items-start gap-4">
                                  {/* Timeline dot */}
                                  <div className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                                    chk.isPaid
                                      ? 'bg-[#059669] border-[#059669] shadow-sm shadow-[#059669]/30'
                                      : 'bg-white border-[#E2E8F0]'
                                  }`}>
                                    {isUpdatingBhp[chk.year] ? (
                                      <Loader2 className="w-4 h-4 animate-spin text-[#718096]" />
                                    ) : chk.isPaid ? (
                                      <CheckCircle className="w-5 h-5 text-white" />
                                    ) : (
                                      <span className="text-[11px] font-bold text-[#A0AEC0]">{String(chkIdx + 1).padStart(2, '0')}</span>
                                    )}
                                  </div>

                                  {/* Card konten */}
                                  <div className={`flex-1 rounded-[10px] border transition-all duration-200 ${
                                    chk.isPaid
                                      ? 'bg-white border-emerald-200 shadow-sm shadow-emerald-100/50'
                                      : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-sm'
                                  }`}>
                                    {chk.isPaid && !editingBhpYear[chk.year] ? (
                                      /* ── LUNAS STATE (tampilan) ── */
                                      <div className="flex items-center justify-between px-4 py-3">
                                        <div>
                                          <p className="text-[13px] font-bold text-[#1A202C]">Tahun {chk.year}</p>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[11px] text-[#059669] font-semibold flex items-center gap-1">
                                              <CheckCircle className="w-3 h-3" /> Lunas
                                            </span>
                                            <span className="text-[#E2E8F0]">•</span>
                                            <span className="text-[11px] text-[#4A5568] font-mono">INV: {chk.invoiceNumber}</span>
                                          </div>
                                          {chk.paidAt && (
                                            <p className="text-[10px] text-[#A0AEC0] mt-0.5">
                                              {chk.paidByUserName} · {format(parseISO(chk.paidAt), "dd MMM yyyy")}
                                            </p>
                                          )}
                                        </div>
                                        {canUpdateBhp && (
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              onClick={() => startEditBhpInvoice(chk.year, chk.invoiceNumber || "")}
                                              className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors"
                                              title="Edit nomor invoice"
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => handleToggleBhp(doc.id, chk.year, true)}
                                              disabled={isUpdatingBhp[chk.year]}
                                              className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#A0AEC0] hover:bg-red-50 hover:text-[#DC2626] transition-colors"
                                              title="Batalkan lunas"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ) : chk.isPaid && editingBhpYear[chk.year] ? (
                                      /* ── EDIT INVOICE STATE ── */
                                      <div className="px-4 py-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <div>
                                            <p className="text-[13px] font-bold text-[#1A202C]">Tahun {chk.year}</p>
                                            <p className="text-[11px] text-[#2B6CB0] font-medium">Edit nomor invoice</p>
                                          </div>
                                          <button
                                            onClick={() => setEditingBhpYear(prev => ({ ...prev, [chk.year]: false }))}
                                            className="text-[11px] text-[#718096] hover:text-[#1A202C]"
                                          >
                                            Batal
                                          </button>
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="No. Invoice baru..."
                                            value={bhpInvoiceNumbers[chk.year] || ""}
                                            onChange={(e) => setBhpInvoiceNumbers(prev => ({ ...prev, [chk.year]: e.target.value }))}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' && (bhpInvoiceNumbers[chk.year] || "").trim()) {
                                                handleSaveEditBhp(doc.id, chk.year);
                                              }
                                              if (e.key === 'Escape') setEditingBhpYear(prev => ({ ...prev, [chk.year]: false }));
                                            }}
                                            autoFocus
                                            className="h-9 text-[12px] bg-[#F7F8FA] border-[#2B6CB0] focus:bg-white flex-1 rounded-[8px]"
                                          />
                                          <Button
                                            onClick={() => handleSaveEditBhp(doc.id, chk.year)}
                                            disabled={isUpdatingBhp[chk.year] || !(bhpInvoiceNumbers[chk.year] || "").trim()}
                                            className="h-9 px-4 text-[12px] font-semibold bg-[#2B6CB0] hover:bg-[#1B3A6B] text-white rounded-[8px] whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50"
                                          >
                                            {isUpdatingBhp[chk.year] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Simpan"}
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      /* ── BELUM BAYAR STATE ── */
                                      <div className="px-4 py-3">
                                        <div className="flex items-center justify-between mb-3">
                                          <div>
                                            <p className="text-[13px] font-bold text-[#1A202C]">Tahun {chk.year}</p>
                                            <p className="text-[11px] text-[#F59E0B] font-medium flex items-center gap-1">
                                              <Clock className="w-3 h-3" /> Belum dibayar
                                            </p>
                                          </div>
                                        </div>
                                        {canUpdateBhp && (
                                          <div className="flex gap-2">
                                            <Input
                                              placeholder="Masukkan No. Invoice / Bukti Bayar..."
                                              value={bhpInvoiceNumbers[chk.year] || ""}
                                              onChange={(e) => setBhpInvoiceNumbers(prev => ({ ...prev, [chk.year]: e.target.value }))}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter' && (bhpInvoiceNumbers[chk.year] || "").trim()) {
                                                  handleToggleBhp(doc.id, chk.year, false);
                                                }
                                              }}
                                              className="h-9 text-[12px] bg-[#F7F8FA] border-[#E2E8F0] focus:bg-white flex-1 rounded-[8px]"
                                            />
                                            <Button
                                              onClick={() => handleToggleBhp(doc.id, chk.year, false)}
                                              disabled={isUpdatingBhp[chk.year] || !(bhpInvoiceNumbers[chk.year] || "").trim()}
                                              className="h-9 px-4 text-[12px] font-semibold bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white rounded-[8px] whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50"
                                            >
                                              {isUpdatingBhp[chk.year] ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                              ) : (
                                                <><CheckCircle className="w-3.5 h-3.5" /> Tandai Lunas</>
                                              )}
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
                  {doc.type?.toLowerCase().includes("isr") && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1.5">
                        <Progress
                          value={((doc.bhpPaidCount || 0) / (doc.bhpTotalCount || 1)) * 100}
                          className={`h-1.5 w-12 bg-[#E2E8F0] ${
                            (doc.bhpPaidCount || 0) === (doc.bhpTotalCount || 0)
                              ? '[&>div]:bg-[#059669]'
                              : '[&>div]:bg-[#F59E0B]'
                          }`}
                        />
                        <span className={`text-[11px] font-bold ${
                          (doc.bhpPaidCount || 0) === (doc.bhpTotalCount || 0) ? 'text-[#059669]' : 'text-[#F59E0B]'
                        }`}>
                          BHP {doc.bhpPaidCount || 0}/{doc.bhpTotalCount || 0}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleRow(doc.id)}
                        className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[5px] transition-colors ${
                          expandedRows[doc.id]
                            ? 'bg-[#1B3A6B] text-white'
                            : 'text-[#2B6CB0] bg-[#EBF4FF]'
                        }`}
                      >
                        {expandedRows[doc.id] ? 'Tutup' : 'Bayar'} <ChevronDown className={`w-3 h-3 transition-transform ${expandedRows[doc.id] ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <MobileExpiryBadge status={doc.expiryStatus} />
              </div>
            </div>

            {/* Mobile Expanded BHP */}
            {expandedRows[doc.id] && doc.type?.toLowerCase().includes("isr") && doc.bhpChecklist && (
              <div className="bg-gradient-to-b from-[#F0F5FF] to-[#F8FAFC] border border-[#DBEAFE] rounded-[10px] p-3 mt-1">
                {/* Header summary */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-[7px] bg-[#1B3A6B] flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-[#1B3A6B]">Checklist BHP Tahunan</p>
                      <p className="text-[10px] text-[#718096]">{doc.bhpPaidCount || 0}/{doc.bhpTotalCount || 0} tahun lunas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={((doc.bhpPaidCount || 0) / (doc.bhpTotalCount || 1)) * 100}
                      className="h-1.5 w-16 bg-[#E2E8F0] [&>div]:bg-[#059669]"
                    />
                    <span className="text-[11px] font-bold text-[#059669]">
                      {Math.round(((doc.bhpPaidCount || 0) / (doc.bhpTotalCount || 1)) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Timeline items */}
                <div className="relative">
                  <div className="absolute left-[15px] top-5 bottom-5 w-0.5 bg-[#E2E8F0]" />
                  <div className="space-y-2">
                    {doc.bhpChecklist.map((chk, chkIdx) => (
                      <div key={chk.id} className="relative flex items-start gap-3">
                        {/* Dot */}
                        <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          chk.isPaid ? 'bg-[#059669] border-[#059669]' : 'bg-white border-[#E2E8F0]'
                        }`}>
                          {isUpdatingBhp[chk.year] ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#718096]" />
                          ) : chk.isPaid ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : (
                            <span className="text-[10px] font-bold text-[#A0AEC0]">{chkIdx + 1}</span>
                          )}
                        </div>

                        {/* Card */}
                        <div className={`flex-1 rounded-[8px] border text-left ${
                          chk.isPaid ? 'bg-white border-emerald-200' : 'bg-white border-[#E2E8F0]'
                        }`}>
                          {chk.isPaid && !editingBhpYear[chk.year] ? (
                            <div className="px-3 py-2.5 flex items-start justify-between">
                              <div>
                                <p className="text-[12px] font-bold text-[#1A202C]">Tahun {chk.year}</p>
                                <p className="text-[10px] text-[#059669] font-semibold flex items-center gap-1 mt-0.5">
                                  <CheckCircle className="w-3 h-3" /> Lunas
                                </p>
                                <p className="text-[10px] text-[#4A5568] mt-0.5 font-mono">INV: {chk.invoiceNumber}</p>
                                {chk.paidAt && <p className="text-[10px] text-[#A0AEC0] mt-0.5">{format(parseISO(chk.paidAt), "dd/MM/yy")} · {chk.paidByUserName}</p>}
                              </div>
                              {canUpdateBhp && (
                                <div className="flex gap-1 ml-2 flex-shrink-0">
                                  <button
                                    onClick={() => startEditBhpInvoice(chk.year, chk.invoiceNumber || "")}
                                    className="w-6 h-6 flex items-center justify-center rounded-[5px] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors"
                                    title="Edit invoice"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleBhp(doc.id, chk.year, true)}
                                    disabled={isUpdatingBhp[chk.year]}
                                    className="w-6 h-6 flex items-center justify-center rounded-[5px] text-[#A0AEC0] hover:text-[#DC2626] hover:bg-red-50 transition-colors ml-2 flex-shrink-0"
                                    title="Batalkan"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : chk.isPaid && editingBhpYear[chk.year] ? (
                            /* Edit mode mobile */
                            <div className="px-3 py-2.5">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[12px] font-bold text-[#2B6CB0]">Edit Invoice {chk.year}</p>
                                <button onClick={() => setEditingBhpYear(prev => ({ ...prev, [chk.year]: false }))} className="text-[10px] text-[#718096]">Batal</button>
                              </div>
                              <div className="flex gap-1.5">
                                <Input
                                  placeholder="No. Invoice baru..."
                                  value={bhpInvoiceNumbers[chk.year] || ""}
                                  onChange={(e) => setBhpInvoiceNumbers(prev => ({ ...prev, [chk.year]: e.target.value }))}
                                  autoFocus
                                  className="h-8 text-[11px] bg-[#F7F8FA] border-[#2B6CB0] focus:bg-white flex-1 rounded-[6px]"
                                />
                                <Button
                                  onClick={() => handleSaveEditBhp(doc.id, chk.year)}
                                  disabled={isUpdatingBhp[chk.year] || !(bhpInvoiceNumbers[chk.year] || "").trim()}
                                  className="h-8 px-2.5 text-[11px] font-semibold bg-[#2B6CB0] hover:bg-[#1B3A6B] text-white rounded-[6px] whitespace-nowrap disabled:opacity-50"
                                >
                                  {isUpdatingBhp[chk.year] ? <Loader2 className="w-3 h-3 animate-spin" /> : "Simpan"}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="px-3 py-2.5">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[12px] font-bold text-[#1A202C]">Tahun {chk.year}</p>
                                <span className="text-[10px] text-[#F59E0B] font-medium flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" /> Belum bayar
                                </span>
                              </div>
                              {canUpdateBhp && (
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="No. Invoice..."
                                    value={bhpInvoiceNumbers[chk.year] || ""}
                                    onChange={(e) => setBhpInvoiceNumbers(prev => ({ ...prev, [chk.year]: e.target.value }))}
                                    className="h-8 text-[11px] bg-[#F7F8FA] border-[#E2E8F0] focus:bg-white flex-1 rounded-[6px]"
                                  />
                                  <Button
                                    onClick={() => handleToggleBhp(doc.id, chk.year, false)}
                                    disabled={isUpdatingBhp[chk.year] || !(bhpInvoiceNumbers[chk.year] || "").trim()}
                                    className="h-8 px-3 text-[11px] font-semibold bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white rounded-[6px] whitespace-nowrap disabled:opacity-50"
                                  >
                                    {isUpdatingBhp[chk.year] ? <Loader2 className="w-3 h-3 animate-spin" /> : "Simpan"}
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
          disabled={isExporting}
          className={`flex items-center gap-2 text-white px-4 py-3 rounded-full shadow-lg font-bold text-[13px] transition-all active:scale-95 ${isExporting ? 'bg-[#059669]/60 cursor-not-allowed' : 'bg-[#059669] hover:bg-[#047857]'}`}>
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export
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

      <BottomSheet open={groupSheetOpen} onClose={() => setGroupSheetOpen(false)} title="Grup Dokumen">
        {[{ value: "", label: "Semua Grup" }, ...groupOptions].map(opt => (
          <button key={opt.value} onClick={() => { setFilterGroup(opt.value); setPage(1); setGroupSheetOpen(false); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-[10px] text-[14px] font-medium ${filterGroup === opt.value ? "bg-[#EBF4FF] text-[#1B3A6B] font-semibold" : "text-[#1A202C] hover:bg-[#F7F8FA]"}`}>
            <span>{opt.label}</span>
            {filterGroup === opt.value && <CheckCircle className="w-4 h-4 text-[#2B6CB0]" />}
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12px] font-semibold text-[#4A5568]">Penanggung Jawab (PIC)</label>
                <button
                  type="button"
                  onClick={() => setPicEntries(prev => [...prev, { name: "", telegramId: "" }])}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#2B6CB0] hover:text-[#1B3A6B] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah PIC
                </button>
              </div>
              <div className="space-y-2">
                {picEntries.map((entry, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    {/* Avatar nomor */}
                    <div className="w-8 h-8 rounded-full bg-[#EBF4FF] border border-[#2B6CB0]/20 flex items-center justify-center flex-shrink-0 mt-1.5">
                      <span className="text-[11px] font-bold text-[#2B6CB0]">{idx + 1}</span>
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        value={entry.name}
                        onChange={e => setPicEntries(prev => prev.map((p, i) => i === idx ? { ...p, name: e.target.value } : p))}
                        placeholder="Nama PIC"
                        className="h-9 rounded-[8px] text-[13px]"
                      />
                      <Input
                        value={entry.telegramId}
                        onChange={e => setPicEntries(prev => prev.map((p, i) => i === idx ? { ...p, telegramId: e.target.value } : p))}
                        placeholder="Telegram Chat ID"
                        className="h-9 rounded-[8px] text-[13px] font-mono"
                      />
                    </div>
                    {picEntries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPicEntries(prev => prev.filter((_, i) => i !== idx))}
                        className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#718096] hover:bg-red-50 hover:text-[#DC2626] transition-colors mt-1.5 flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#718096] mt-2">Telegram Chat ID: buka bot @userinfobot untuk cek ID Anda.</p>
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
          <ResponsiveModal
            open={formOpen}
            onOpenChange={(o) => !o && closeForm()}
            bottomSheetSize="xl"
            desktopClassName="max-w-lg"
            title={editId ? "Edit Dokumen" : "Tambah Dokumen Baru"}
            footer={<>{FormActions}</>}
          >
            {FormContent}
          </ResponsiveModal>
        );
      })()}

      {/* ── Delete Confirm ── */}
      <ResponsiveModal
        open={!!deleteConfirm}
        onOpenChange={(o) => !o && setDeleteConfirm(null)}
        bottomSheetSize="md"
        desktopClassName="max-w-sm"
        title={<span className="flex items-center gap-2 text-[#DC2626]"><AlertTriangle className="w-5 h-5" /> Hapus Dokumen</span>}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="h-10 rounded-[10px] font-semibold">Batal</Button>
            <Button onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}
              disabled={isBusy}
              className="h-10 rounded-[10px] bg-[#DC2626] hover:bg-red-700 text-white font-semibold">
              {isBusy ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </>
        }
      >
        <div className="py-2">
          <p className="text-[14px] text-[#4A5568] leading-relaxed">
            Yakin ingin menghapus dokumen <br/><span className="font-bold text-[#1A202C]">{deleteConfirm?.name}</span>?
          </p>
          <p className="text-[13px] text-[#718096] mt-2 italic">Tindakan ini tidak dapat dibatalkan.</p>
        </div>
      </ResponsiveModal>

      {/* Detail Modal — Desktop: Dialog, Mobile: BottomSheet dengan swipe */}
      {selectedDetailDoc && (() => {
        const isIsr = selectedDetailDoc.type?.toLowerCase().includes("isr");
        const daysRemaining = selectedDetailDoc.daysRemaining;
        const expiryStatus = selectedDetailDoc.expiryStatus;
        const bhpPct = isIsr ? Math.round(((selectedDetailDoc.bhpPaidCount || 0) / (selectedDetailDoc.bhpTotalCount || 1)) * 100) : 0;
        const allLunas = isIsr && (selectedDetailDoc.bhpPaidCount || 0) === (selectedDetailDoc.bhpTotalCount || 0) && (selectedDetailDoc.bhpTotalCount || 0) > 0;

        // Split nama & Telegram IDs — independent, tidak dipasangkan
        const picNames = selectedDetailDoc.picName
          ? selectedDetailDoc.picName.split(",").map(n => n.trim()).filter(Boolean)
          : [];
        const telegramIds = selectedDetailDoc.picTelegramId
          ? [...new Set(selectedDetailDoc.picTelegramId.split(",").map(id => id.trim()).filter(Boolean))]
          : [];

        const TelegramIcon = () => (
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        );
        // Shared detail body (reused in both mobile & desktop)
        const DetailBody = (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F7F8FA] rounded-[12px] p-3.5 border border-[#E2E8F0]">
                <p className="text-[10px] font-bold text-[#718096] uppercase tracking-wider mb-1">Mulai Berlaku</p>
                <p className="text-[13px] font-bold text-[#1A202C]">{format(parseISO(selectedDetailDoc.validFrom), "dd MMM yyyy", { locale: localeId })}</p>
              </div>
              <div className="bg-[#F7F8FA] rounded-[12px] p-3.5 border border-[#E2E8F0]">
                <p className="text-[10px] font-bold text-[#718096] uppercase tracking-wider mb-1">Berakhir</p>
                <p className={`text-[13px] font-bold ${expiryStatus === "Expired" ? "text-[#DC2626]" : expiryStatus === "Warning" ? "text-[#F59E0B]" : "text-[#1A202C]"}`}>
                  {format(parseISO(selectedDetailDoc.validUntil), "dd MMM yyyy", { locale: localeId })}
                </p>
              </div>
            </div>

            {(selectedDetailDoc.picName || selectedDetailDoc.picTelegramId) && (
              <div className="bg-[#F7F8FA] rounded-[12px] p-4 border border-[#E2E8F0]">
                <p className="text-[10px] font-bold text-[#718096] uppercase tracking-wider mb-3">Penanggung Jawab (PIC)</p>

                {/* Nama PIC — bisa multiple */}
                {picNames.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] text-[#A0AEC0] font-semibold uppercase tracking-wide mb-2">Nama</p>
                    <div className="space-y-1.5">
                      {picNames.map((name, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B3A6B] to-[#2B6CB0] flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-white text-[11px] font-bold">
                              {name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[13px] font-bold text-[#1A202C]">{name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider jika keduanya ada */}
                {picNames.length > 0 && telegramIds.length > 0 && (
                  <div className="border-t border-[#E2E8F0] my-3" />
                )}

                {/* Telegram IDs — bisa multiple, tampil terpisah */}
                {telegramIds.length > 0 && (
                  <div>
                    <p className="text-[10px] text-[#A0AEC0] font-semibold uppercase tracking-wide mb-2">Telegram Notifikasi</p>
                    <div className="flex flex-wrap gap-2">
                      {telegramIds.map((tid, i) => (
                        <a
                          key={i}
                          href={`https://t.me/${tid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#229ED9]/10 border border-[#229ED9]/20 text-[#229ED9] text-[12px] font-semibold hover:bg-[#229ED9]/20 transition-colors"
                        >
                          <TelegramIcon /> {tid}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between bg-[#F7F8FA] rounded-[12px] px-4 py-3 border border-[#E2E8F0]">
              <p className="text-[12px] font-bold text-[#718096] uppercase tracking-wider">Tindak Lanjut</p>
              <FollowUpBadge status={selectedDetailDoc.followUpStatus} />
            </div>

            {selectedDetailDoc.followUpRemark && (
              <div className="bg-[#FFFBEB] border border-amber-200 rounded-[12px] px-4 py-3">
                <p className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider mb-1.5">Catatan</p>
                <p className="text-[13px] text-[#1A202C] leading-relaxed whitespace-pre-line">{selectedDetailDoc.followUpRemark}</p>
              </div>
            )}

            {isIsr && (selectedDetailDoc.bhpTotalCount ?? 0) > 0 && (
              <div className={`rounded-[12px] p-4 border ${allLunas ? 'bg-emerald-50 border-emerald-200' : 'bg-[#F0F5FF] border-[#DBEAFE]'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-[7px] flex items-center justify-center ${allLunas ? 'bg-[#059669]' : 'bg-[#1B3A6B]'}`}>
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-[#1B3A6B]">Checklist BHP Tahunan</p>
                      <p className="text-[10px] text-[#718096]">{selectedDetailDoc.bhpPaidCount || 0} dari {selectedDetailDoc.bhpTotalCount || 0} tahun lunas</p>
                    </div>
                  </div>
                  <span className={`text-[20px] font-black ${allLunas ? 'text-[#059669]' : 'text-[#1B3A6B]'}`}>{bhpPct}%</span>
                </div>
                <div className="w-full bg-white/60 rounded-full h-2.5 overflow-hidden border border-white">
                  <div className={`h-full rounded-full transition-all duration-700 ${allLunas ? 'bg-[#059669]' : bhpPct >= 60 ? 'bg-[#2B6CB0]' : 'bg-[#F59E0B]'}`} style={{ width: `${bhpPct}%` }} />
                </div>
                {selectedDetailDoc.bhpChecklist && selectedDetailDoc.bhpChecklist.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {selectedDetailDoc.bhpChecklist.map(chk => (
                      <div key={chk.id} title={chk.isPaid ? `INV: ${chk.invoiceNumber}` : 'Belum dibayar'}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${chk.isPaid ? 'bg-emerald-100 border-emerald-300 text-[#059669]' : 'bg-white border-[#E2E8F0] text-[#718096]'}`}>
                        {chk.isPaid ? <CheckCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                        {chk.year}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedDetailDoc.fileLink && (
              <a href={selectedDetailDoc.fileLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between bg-[#F7F8FA] hover:bg-[#EBF4FF] border border-[#E2E8F0] hover:border-[#2B6CB0]/30 rounded-[12px] px-4 py-3 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-[#EBF4FF] flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 text-[#2B6CB0]" />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-[#2B6CB0]">Lihat Dokumen</p>
                    <p className="text-[10px] text-[#718096] truncate max-w-[220px]">{selectedDetailDoc.fileLink}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#2B6CB0] opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )}
          </div>
        );        // ── Render mobile (BottomSheet) & desktop (Dialog) ──
        return (
          <>
            {/* MOBILE: BottomSheet dengan swipe dismiss */}
            <BottomSheet open={detailModalOpen && isMobile} onClose={() => setDetailModalOpen(false)} size="xl" contentClassName="px-4 py-4 pb-8"
              title={
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0 ${expiryStatus === "Expired" ? "bg-red-100" : expiryStatus === "Warning" ? "bg-amber-100" : "bg-[#EBF4FF]"}`}>
                    <FileText className={`w-3.5 h-3.5 ${expiryStatus === "Expired" ? "text-[#DC2626]" : expiryStatus === "Warning" ? "text-[#F59E0B]" : "text-[#2B6CB0]"}`} />
                  </div>
                  <span className="truncate text-[14px] font-bold text-[#1A202C]">{selectedDetailDoc.name}</span>
                </div>
              }
            >
              <div className="bg-gradient-to-br from-[#1B3A6B] to-[#2B6CB0] rounded-[12px] px-4 py-3.5 mb-4">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-white/15 text-white/90 text-[10px] font-semibold">{selectedDetailDoc.type}</span>
                  {selectedDetailDoc.groupName && <span className="px-2 py-0.5 rounded-full bg-[#D94F2B]/30 text-white/90 text-[10px] font-semibold">{selectedDetailDoc.groupName}</span>}
                </div>
                {selectedDetailDoc.referenceNumber && <p className="text-[11px] text-white/50 font-mono">REF: {selectedDetailDoc.referenceNumber}</p>}
                <div className="flex items-center gap-2 mt-2">
                  {expiryStatus === "Expired" && <span className="text-[11px] text-red-300 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Expired</span>}
                  {expiryStatus === "Warning" && <span className="text-[11px] text-amber-300 font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Segera Berakhir</span>}
                  {expiryStatus === "Aman" && <span className="text-[11px] text-emerald-300 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Aman</span>}
                  <span className="text-white/40 text-[10px]">· {daysRemaining < 0 ? `${Math.abs(daysRemaining)}h lalu` : `${daysRemaining}h lagi`}</span>
                </div>
              </div>
              {DetailBody}
              <button onClick={() => setDetailModalOpen(false)} className="w-full mt-4 h-11 rounded-[12px] font-bold text-[14px] bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white transition-colors active:scale-[0.98]">
                Tutup
              </button>
            </BottomSheet>

            {/* DESKTOP: Dialog */}
            <Dialog open={detailModalOpen && !isMobile} onOpenChange={setDetailModalOpen}>
              <DialogContent hideCloseButton className="max-w-lg p-0 bg-white rounded-[20px] overflow-hidden border-0 shadow-2xl shadow-black/20 [&>div:first-child]:hidden [&>div:nth-child(2)]:p-0">
                <>
                  <div className="relative bg-gradient-to-br from-[#1B3A6B] via-[#1E4080] to-[#2B6CB0] px-6 pt-6 pb-8 overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
                    <button onClick={() => setDetailModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all">
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-[10px] bg-white/10 border border-white/20 flex items-center justify-center"><FileText className="w-5 h-5 text-white" /></div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-white/90 text-[11px] font-semibold">{selectedDetailDoc.type}</span>
                        {selectedDetailDoc.groupName && <span className="px-2.5 py-0.5 rounded-full bg-[#D94F2B]/30 border border-[#D94F2B]/40 text-white/90 text-[11px] font-semibold">{selectedDetailDoc.groupName}</span>}
                      </div>
                    </div>
                    <h2 className="text-[18px] font-bold text-white leading-snug pr-8">{selectedDetailDoc.name}</h2>
                    {selectedDetailDoc.referenceNumber && <p className="text-[12px] text-white/50 mt-1 font-mono tracking-wide">REF: {selectedDetailDoc.referenceNumber}</p>}
                    <div className="flex items-center gap-2 mt-3">
                      {expiryStatus === "Expired" && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-400/30 text-red-300 text-[11px] font-bold"><AlertTriangle className="w-3 h-3" /> Expired</span>}
                      {expiryStatus === "Warning" && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold"><Clock className="w-3 h-3" /> Segera Berakhir</span>}
                      {expiryStatus === "Aman" && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold"><CheckCircle className="w-3 h-3" /> Aman</span>}
                      <span className="text-white/40 text-[11px]">{daysRemaining < 0 ? `${Math.abs(daysRemaining)} hari lalu` : `${daysRemaining} hari lagi`}</span>
                    </div>
                  </div>
                  <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto">{DetailBody}</div>
                  <div className="px-6 pb-5 pt-1">
                    <button onClick={() => setDetailModalOpen(false)} className="w-full h-11 rounded-[12px] font-bold text-[14px] bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white transition-colors active:scale-[0.98]">Tutup</button>
                  </div>
                </>
              </DialogContent>
            </Dialog>
          </>
        );
      })()}

      {/* Follow Up Modal */}
      <ResponsiveModal
        open={followUpModalOpen}
        onOpenChange={setFollowUpModalOpen}
        bottomSheetSize="lg"
        desktopClassName="max-w-md"
        title="Tindak Lanjut"
        footer={
          <>
            <Button variant="outline" onClick={() => setFollowUpModalOpen(false)} className="h-10 rounded-[10px] font-semibold">Batal</Button>
            <Button onClick={submitFollowUpStatus} disabled={isUpdatingFollowUp} className="h-10 rounded-[10px] font-semibold bg-[#2B6CB0] hover:bg-[#1A365D] text-white">
              {isUpdatingFollowUp ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
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
      </ResponsiveModal>
    </PageWrapper>
  );
}



