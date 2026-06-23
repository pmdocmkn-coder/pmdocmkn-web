import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ChevronDown, ChevronUp, Filter, RotateCcw, Search, Home } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import RepairDateRangeFilter from "./RepairDateRangeFilter";
import RadioRepairStatsCards from "./RadioRepairStatsCards";
import RadioRepairGroupedTable, { type TicketJobGroup } from "./RadioRepairGroupedTable";
import { radioRepairApi, type UpdateRadioRepairJobPayload } from "../../services/radioRepairApi";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import { workshopTechnicianApi, type WorkshopTechnicianDto } from "../../services/workshopTechnicianApi";
import type {
  RadioRepairDashboard,
  RadioRepairJobDetail,
  RadioRepairJobList,
  RadioRepairJobStatus,
  RepairJobCustomStatus,
} from "../../types/radioRepair";
import { repairJobCustomStatusApi } from "../../services/repairJobCustomStatusApi";
import type { UserOption } from "../../types/radioHandover";
import RadioRepairStatusBadge from "./RadioRepairStatusBadge";
import RadioRepairJobDetailPanel from "./RadioRepairJobDetailPanel";
import RadioRepairJobEditForm from "./RadioRepairJobEditForm";
import TechnicianToWarehouseForm from "../RadioHandover/TechnicianToWarehouseForm";
import WorkshopTechnicianManager from "./WorkshopTechnicianManager";
import ImageGalleryModal from "../common/ImageGalleryModal";
import RadioScrapApprovalModal from "./RadioScrapApprovalModal";
import RadioCompletionTagModal from "./RadioCompletionTagModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { FilterSelect } from "../Radio/FilterSelect";
import { FormMobileSelect } from "../Radio/FormMobileSelect";
import { FormMobileDatePicker } from "../Radio/FormMobileDatePicker";
import { useToast } from "../../hooks/use-toast";
import { hasPermission } from "../../utils/permissionUtils";
import { isJobStatusLocked, STATUS_LABELS } from "../../utils/radioRepairStatusUtils";
import {
  canApproveRepairMaterial,
  canCreateTekToWarehouseHandover,
  canUpdateRepairJobStatus,
} from "../../utils/repairDashboardPermissions";
import { asImageSrc } from "../../utils/handoverPhotoUtils";
import { format } from "date-fns";
import { id as dateFnsLocale } from "date-fns/locale";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { id as localeId } from "react-day-picker/locale";
import { Calendar } from "lucide-react";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";

const PAGE_SIZE = 15;

const filterPanelVariants = {
  open: { height: "auto", opacity: 1, transition: { duration: 0.3 } },
  closed: { height: 0, opacity: 0, transition: { duration: 0.25 } },
};

export default function RadioRepairDashboardPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dash, setDash] = useState<RadioRepairDashboard | null>(null);
  const [jobs, setJobs] = useState<RadioRepairJobList[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const [detail, setDetail] = useState<RadioRepairJobDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showWh, setShowWh] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showScrapApproval, setShowScrapApproval] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTechnician, setFilterTechnician] = useState("");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [mobDateRangeOpen, setMobDateRangeOpen] = useState(false);

  const formatRangeLabel = () => {
    if (!filterFromDate && !filterToDate) return "Pilih Rentang Tanggal";
    if (filterFromDate && !filterToDate) return format(new Date(filterFromDate), "d MMM yyyy", { locale: dateFnsLocale });
    if (filterFromDate === filterToDate) return format(new Date(filterFromDate), "d MMM yyyy", { locale: dateFnsLocale });
    return `${format(new Date(filterFromDate), "d MMM yyyy", { locale: dateFnsLocale })} – ${format(new Date(filterToDate), "d MMM yyyy", { locale: dateFnsLocale })}`;
  };
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const [editJob, setEditJob] = useState<RadioRepairJobDetail | null>(null);
  const [technicians, setTechnicians] = useState<UserOption[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [patchingStatus, setPatchingStatus] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const [customStatuses, setCustomStatuses] = useState<RepairJobCustomStatus[]>([]);

  const [workshopTechs, setWorkshopTechs] = useState<WorkshopTechnicianDto[]>([]);
  const [techPickerOpen, setTechPickerOpen] = useState(false);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [autoOpenTag, setAutoOpenTag] = useState<"Good" | "Damaged" | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: "status" | "approve" | "tag";
    jobId: number;
    status?: RadioRepairJobStatus;
    customStatusId?: number | null;
    resumeStatus?: "InProgress" | "Monitoring";
  } | null>(null);

  const canSupervise = canApproveRepairMaterial();
  const canUpdate = canUpdateRepairJobStatus();
  const canDelete = hasPermission("radio.repair.delete");
  const canEdit = hasPermission("radio.repair.edit");
  const canViewArchive = hasPermission("radio.repair.view.archive");
  const canDeletePermanent = hasPermission("radio.repair.delete.permanent");
  const canHandoverWh = canCreateTekToWarehouseHandover();
  const canResetTestingData = hasPermission("delete.all-data");

  const statusOptions = useMemo(() => Object.values(STATUS_LABELS), []);
  const statusLabel = filterStatus ? STATUS_LABELS[filterStatus as RadioRepairJobStatus] ?? "" : "";

  const technicianOptions = useMemo(
    () => technicians.map((t) => `${t.fullName} (${t.username})`),
    [technicians]
  );
  const technicianLabel = useMemo(() => {
    if (!filterTechnician) return "";
    const t = technicians.find((x) => String(x.userId) === filterTechnician);
    return t ? `${t.fullName} (${t.username})` : "";
  }, [filterTechnician, technicians]);

  const ticketGroups: TicketJobGroup[] = useMemo(() => {
    const map = new Map<string, RadioRepairJobList[]>();
    for (const j of jobs) {
      const list = map.get(j.helpdeskTicketNumber) ?? [];
      list.push(j);
      map.set(j.helpdeskTicketNumber, list);
    }
    return Array.from(map.entries())
      .map(([ticket, radios]) => ({
        ticket,
        radios: [...radios].sort(
          (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
        ),
      }))
      .sort((a, b) => {
        const ta = Math.max(...a.radios.map((r) => new Date(r.openedAt).getTime()));
        const tb = Math.max(...b.radios.map((r) => new Date(r.openedAt).getTime()));
        return tb - ta;
      });
  }, [jobs]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (search.trim()) n++;
    if (filterStatus) n++;
    if (filterTechnician) n++;
    if (filterFromDate || filterToDate) n++;
    return n;
  }, [search, filterStatus, filterTechnician, filterFromDate, filterToDate]);

  const apiMessage = (err: unknown) => {
    const ax = err as { response?: { data?: { message?: string } } };
    return ax.response?.data?.message;
  };



  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        pageSize: PAGE_SIZE,
        search: search.trim() || undefined,
        status: filterStatus || undefined,
        technicianUserId: filterTechnician ? Number(filterTechnician) : undefined,
        fromDate: filterFromDate || undefined,
        toDate: filterToDate || undefined,
        includeDeleted: showArchive,
      };
      const [d, paged] = await Promise.all([
        showArchive ? Promise.resolve(null) : radioRepairApi.getDashboard(),
        radioRepairApi.getAll(params),
      ]);
      if (d) setDash(d);
      setJobs(paged.data);
      const pg = paged.meta.pagination;
      setTotalCount(pg.totalCount);
      setTotalPages(pg.totalPages || 1);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      setDash(null);
      setJobs([]);
      setTotalCount(0);
      setTotalPages(1);
      const ax = err as { response?: { status?: number } };
      toast({
        title: ax.response?.status === 403 ? "Akses ditolak" : "Gagal memuat data",
        description: apiMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, search, filterStatus, filterTechnician, filterFromDate, filterToDate, showArchive]);

  useEffect(() => {
    radioHandoverApi.getTechnicians().then(setTechnicians).catch(() => setTechnicians([]));
    repairJobCustomStatusApi.getAll().then((list) => setCustomStatuses(list.filter((s) => s.isActive))).catch(() => setCustomStatuses([]));
    workshopTechnicianApi.getAllActive().then(res => setWorkshopTechs(res.data.data)).catch(() => setWorkshopTechs([]));
  }, []);

  // Auto-open modal if jobId is present in URL
  useEffect(() => {
    const jobIdParam = searchParams.get("jobId");
    if (jobIdParam) {
      const jobId = parseInt(jobIdParam, 10);
      if (!isNaN(jobId)) {
        openDetail(jobId);
      }
      // Remove jobId from URL so it doesn't reopen on reload after closing
      setSearchParams(prev => {
        prev.delete("jobId");
        return prev;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const resetFilters = () => {
    setFilterStatus("");
    setFilterTechnician("");
    setFilterFromDate("");
    setFilterToDate("");
    setDateRange(undefined);
    setSearch("");
    setPage(1);
  };

  const openPhotos = (images: string[], index = 0) => {
    const resolved = images.map((i) => asImageSrc(i)).filter(Boolean) as string[];
    if (resolved.length === 0) return;
    setGalleryImages(resolved);
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const openRowPhoto = (j: RadioRepairJobList) => {
    if (!j.previewPhotoBase64) return;
    openPhotos([j.previewPhotoBase64], 0);
  };

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      setDetail(await radioRepairApi.getById(id, showArchive));
    } catch (err: unknown) {
      setDetail(null);
      toast({ title: "Gagal membuka detail", description: apiMessage(err), variant: "destructive" });
    } finally {
      setDetailLoading(false);
    }
  };

  useLiveRefresh("RadioRepairJob", () => {
    load();
  });

  useLiveRefresh("RadioHandover", () => {
    load();
  });

  const openEdit = async (job: RadioRepairJobList) => {
    try {
      setEditJob(await radioRepairApi.getById(job.id, showArchive));
    } catch {
      toast({ title: "Gagal memuat data edit", variant: "destructive" });
    }
  };

  const saveEdit = async (payload: UpdateRadioRepairJobPayload) => {
    if (!editJob) return;
    setSavingEdit(true);
    try {
      await radioRepairApi.update(editJob.id, payload);
      toast({ title: "Pekerjaan diperbarui" });
      setEditJob(null);
      if (detail?.id === editJob.id) {
        setDetail(await radioRepairApi.getById(editJob.id, showArchive));
      }
      load();
    } catch (err: unknown) {
      toast({ title: "Gagal menyimpan", description: apiMessage(err), variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const softDelete = async (job: RadioRepairJobList) => {
    if (!window.confirm(`Hapus (arsip) tiket ${job.helpdeskTicketNumber} — SN ${job.radioSerialNumber}?`)) return;
    try {
      await radioRepairApi.softDelete(job.id);
      toast({ title: "Dipindah ke arsip" });
      if (detail?.id === job.id) setDetail(null);
      load();
    } catch (err: unknown) {
      toast({ title: "Gagal menghapus", description: apiMessage(err), variant: "destructive" });
    }
  };

  const restore = async (id: number) => {
    try {
      await radioRepairApi.restore(id);
      toast({ title: "Dipulihkan" });
      load();
    } catch {
      toast({ title: "Gagal memulihkan", variant: "destructive" });
    }
  };

  const deletePermanent = async (job: RadioRepairJobList) => {
    if (!window.confirm(`Hapus permanen tiket ${job.helpdeskTicketNumber} — SN ${job.radioSerialNumber}?`)) return;
    if (!window.confirm("Konfirmasi terakhir: hapus permanen?")) return;
    try {
      await radioRepairApi.deletePermanent(job.id);
      toast({ title: "Dihapus permanen" });
      if (detail?.id === job.id) setDetail(null);
      load();
    } catch (err: unknown) {
      toast({ title: "Gagal hapus permanen", description: apiMessage(err), variant: "destructive" });
    }
  };

  /** Status transitions yang wajib pilih teknisi workshop */
  const needsTechnicianPick = (targetStatus: RadioRepairJobStatus, fromStatus?: RadioRepairJobStatus) => {
    // Saat masuk ke InProgress pertama kali (dari Received), wajib pilih teknisi
    if (targetStatus === "InProgress" && fromStatus === "Received") return true;
    // Saat monitoring selesai → kembali ke InProgress, wajib pilih teknisi
    if (targetStatus === "InProgress" && fromStatus === "Monitoring") return true;
    return false;
  };

  const patchStatus = async (jobId: number, status: RadioRepairJobStatus, customStatusId?: number | null, workshopTechnicianId?: number | null, bypassTagCheck?: boolean) => {
    if (patchingStatus) return;

    // Cek apakah perlu pilih teknisi workshop
    const currentJob = detail?.id === jobId ? detail : jobs.find(j => j.id === jobId);
    if (!workshopTechnicianId && currentJob && needsTechnicianPick(status, currentJob.status)) {
      setPendingAction({ type: "status", jobId, status, customStatusId });
      setTechPickerOpen(true);
      return;
    }

    // Cek apakah perlu pilih Tag sebelum Selesai
    if (status === "RepairCompleted" && !bypassTagCheck && currentJob) {
      setPendingAction({ type: "tag", jobId, status, customStatusId });
      setTagPickerOpen(true);
      return;
    }

    setPatchingStatus(true);
    try {
      const updated = await radioRepairApi.updateStatus(jobId, status, undefined, customStatusId, workshopTechnicianId);
      if (detail?.id === jobId) setDetail(updated);
      toast({ title: "Status diperbarui" });
      load();
    } catch (err: unknown) {
      toast({ title: "Gagal update status", description: apiMessage(err), variant: "destructive" });
    } finally {
      setPatchingStatus(false);
    }
  };

  const approveMaterial = async (resume: "InProgress" | "Monitoring", workshopTechnicianId?: number | null) => {
    if (!detail || patchingStatus) return;

    // Approve material selalu wajib pilih teknisi
    if (!workshopTechnicianId) {
      setPendingAction({ type: "approve", jobId: detail.id, resumeStatus: resume });
      setTechPickerOpen(true);
      return;
    }

    setPatchingStatus(true);
    try {
      setDetail(await radioRepairApi.approveMaterial(detail.id, resume, undefined, workshopTechnicianId));
      toast({ title: "Material disetujui" });
      load();
    } catch (err: unknown) {
      toast({ title: "Gagal approve", description: apiMessage(err), variant: "destructive" });
    } finally {
      setPatchingStatus(false);
    }
  };

  const handleTechnicianPicked = (techId: number) => {
    setTechPickerOpen(false);
    if (!pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    if (action.type === "status" && action.status) {
      patchStatus(action.jobId, action.status, action.customStatusId, techId);
    } else if (action.type === "approve" && action.resumeStatus) {
      approveMaterial(action.resumeStatus, techId);
    }
  };

  const handleTagModalSave = async (tag: "Good" | "Damaged", payload: any) => {
    setTagPickerOpen(false);
    if (!pendingAction || pendingAction.type !== "tag") return;
    
    const jobId = pendingAction.jobId;
    
    setPatchingStatus(true);
    try {
      // Update job tag fields
      await radioRepairApi.technicianUpdate(jobId, payload);
      
      // Then proceed to change status
      await patchStatus(jobId, pendingAction.status!, pendingAction.customStatusId, null, true);
      
      if (detail && detail.id === jobId) {
         // Refresh detail if opened
         const current = await radioRepairApi.getById(jobId);
         setDetail(current);
      } else {
         load();
      }
    } catch (err: unknown) {
      toast({ title: "Gagal update radio", description: apiMessage(err), variant: "destructive" });
    } finally {
      setPatchingStatus(false);
      setPendingAction(null);
    }
  };

  const handleApproveScrap = async (payload: { dateScrapped: string; scrapJobNumber?: string; remarks?: string }) => {
    if (!detail) return;
    setPatchingStatus(true);
    try {
      setDetail(await radioRepairApi.approveScrap(detail.id, payload));
      setShowScrapApproval(false);
      toast({ title: "Radio berhasil di-scrap" });
      load();
    } catch (err: unknown) {
      toast({ title: "Gagal menyetujui scrap", description: apiMessage(err), variant: "destructive" });
    } finally {
      setPatchingStatus(false);
    }
  };

  const handleCancelScrap = async () => {
    if (!detail) return;
    const msg = detail.status === "Scrapped" 
      ? "Apakah Anda yakin ingin membatalkan status Scrap dan mengembalikan pekerjaan ke Progress?"
      : "Apakah Anda yakin ingin membatalkan status Proses Scrap dan mengembalikan pekerjaan ke Progress?";
    if (!window.confirm(msg)) return;
    setPatchingStatus(true);
    try {
      setDetail(await radioRepairApi.cancelScrap(detail.id));
      toast({ title: "Scrap dibatalkan" });
      load();
    } catch (err: unknown) {
      toast({ title: "Gagal membatalkan scrap", description: apiMessage(err), variant: "destructive" });
    } finally {
      setPatchingStatus(false);
    }
  };

  const handleResetTestingData = async () => {
    if (!window.confirm("PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA DATA serah terima dan perbaikan (Testing Data)? Tindakan ini tidak dapat dibatalkan!")) return;
    if (!window.confirm("Konfirmasi terakhir: Hapus semua data?")) return;
    
    try {
      await radioRepairApi.resetTestingData();
      toast({ title: "Semua data berhasil direset" });
      setDetail(null);
      resetFilters();
      load();
    } catch (err: unknown) {
      toast({ title: "Gagal reset data", description: apiMessage(err), variant: "destructive" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-6 space-y-6">
      {/* ====== MOBILE INTEGRATED HEADER ====== */}
      <div className="md:hidden -mx-4 -mt-4 mb-4 px-4 pt-4 pb-4 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] rounded-b-3xl">
        <div className="flex items-start justify-between pb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1 opacity-80">
              <span className="text-[10px] font-bold text-violet-600 tracking-wider uppercase">Radio Management</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
              Dashboard Perbaikan
            </h1>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center hover:bg-violet-100 transition-colors shrink-0"
          >
            <Home className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="hidden md:flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Perbaikan Radio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitoring perbaikan radio per tiket MKN
            <span className="ml-2 text-xs text-gray-400">
              · Diperbarui {lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              <span className="ml-1 text-gray-300">(otomatis setiap 30 detik)</span>
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          {canResetTestingData && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleResetTestingData}
            >
              Reset Data Uji
            </Button>
          )}
          {canSupervise && <WorkshopTechnicianManager />}
          {canViewArchive && (
            <Button
              variant={showArchive ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowArchive((v) => !v);
                setPage(1);
              }}
              className="gap-2"
            >
              <Archive className="w-4 h-4" />
              {showArchive ? "Keluar arsip" : "Lihat arsip"}
            </Button>
          )}
        </div>
      </div>

      {!showArchive && dash && (
        <RadioRepairStatsCards dash={dash} page={page} totalPages={totalPages} />
      )}

      {/* ── Mobile Filter ── */}
      <div className="md:hidden flex flex-col gap-3 bg-[#fbf8ff] p-4 rounded-xl border border-purple-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b5cf6]" />
          <Input 
            placeholder="Cari tiket, SN, ID, kerusakan..." 
            value={search} 
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }} 
            className="pl-10 pr-4 py-2.5 h-10 border-none rounded-xl focus:ring-2 focus:ring-purple-500 text-sm bg-[#f3e8ff] text-gray-900 placeholder-[#c084fc]" 
          />
        </div>
        <div className="flex flex-wrap gap-2 relative z-30 pb-1">
          <div className="relative shrink-0 flex-1 min-w-[120px]">
            <FormMobileSelect
              value={statusLabel}
              onChange={(v) => {
                const key = Object.entries(STATUS_LABELS).find(([, label]) => label === v)?.[0] ?? "";
                setFilterStatus(key);
                setPage(1);
              }}
              options={statusOptions}
              placeholder="Semua status"
              color="violet"
            />
          </div>
          <div className="relative shrink-0 flex-1 min-w-[120px]">
            <FormMobileSelect
              value={technicianLabel}
              onChange={(v) => {
                const t = technicians.find((x) => `${x.fullName} (${x.username})` === v);
                setFilterTechnician(t ? String(t.userId) : "");
                setPage(1);
              }}
              options={technicianOptions}
              placeholder="Semua teknisi"
              color="violet"
            />
          </div>
          <div className="relative shrink-0 w-full mt-2">
            <button
              onClick={() => setMobDateRangeOpen((prev) => !prev)}
              className="flex items-center justify-between h-10 w-full rounded-lg bg-white border border-gray-200 px-3 text-gray-800 text-sm font-medium select-none shadow-sm hover:border-gray-300"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                <span className={`truncate ${filterFromDate ? "text-gray-800 font-medium" : "text-gray-400"}`}>{formatRangeLabel()}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 ml-2 text-gray-400" />
            </button>

            {mobDateRangeOpen && (
              <>
                <div
                  className="fixed inset-0 bg-slate-900/40 z-[200] backdrop-blur-sm"
                  onClick={() => setMobDateRangeOpen(false)}
                />
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] bg-white rounded-2xl shadow-2xl border border-purple-100 p-4 w-[90%] max-w-[360px] max-h-[85vh] flex flex-col">
                  <div className="flex items-center justify-between mb-1 shrink-0">
                    <span className="text-sm font-semibold text-gray-700">Pilih Rentang Waktu</span>
                    <button
                      type="button"
                      onClick={() => setMobDateRangeOpen(false)}
                      className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Tutup"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="flex justify-center">
                      <DayPicker
                        mode="range"
                        selected={dateRange}
                        onSelect={(r) => {
                          setDateRange(r);
                          if (r?.from) setFilterFromDate(format(r.from, "yyyy-MM-dd"));
                          else setFilterFromDate("");

                          if (r?.to) setFilterToDate(format(r.to, "yyyy-MM-dd"));
                          else if (r?.from) setFilterToDate(format(r.from, "yyyy-MM-dd"));
                          else setFilterToDate("");
                          
                          setPage(1);
                        }}
                        locale={localeId}
                        showOutsideDays
                      />
                    </div>
                  </div>
                  {/* Fixed Footer */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-2 text-sm bg-white shrink-0">
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setDateRange(undefined);
                          setFilterFromDate("");
                          setFilterToDate("");
                          setPage(1);
                        }}
                        className="text-gray-400 hover:text-red-500 font-medium transition-colors"
                      >
                        Hapus
                      </button>
                      <button
                        onClick={() => {
                          const today = new Date();
                          setDateRange({ from: today, to: today });
                          setFilterFromDate(format(today, "yyyy-MM-dd"));
                          setFilterToDate(format(today, "yyyy-MM-dd"));
                          setPage(1);
                        }}
                        className="text-violet-600 font-bold hover:text-violet-800 transition-colors"
                      >
                        Hari ini
                      </button>
                    </div>
                    <button
                      onClick={() => setMobDateRangeOpen(false)}
                      className="bg-violet-600 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-violet-700 transition-colors"
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter panel — gaya Radio KPC (Desktop) */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setIsFilterOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/80 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-violet-100 rounded-lg">
              <Filter className="w-4 h-4 text-violet-600" />
            </div>
            <span className="font-semibold text-gray-800 text-sm">Filter &amp; Pencarian</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-violet-600 text-white text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetFilters();
                }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 px-2 py-1 rounded-md hover:bg-red-50"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
            {isFilterOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </button>

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
                <div className="pt-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    placeholder="Cari tiket MKN, SN, ID radio, fleet, kerusakan..."
                    className="pl-9 h-9 text-sm border-gray-200 focus:border-violet-400 focus:ring-violet-400"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <FilterSelect
                    value={statusLabel}
                    onChange={(v) => {
                      const key =
                        Object.entries(STATUS_LABELS).find(([, label]) => label === v)?.[0] ?? "";
                      setFilterStatus(key);
                      setPage(1);
                    }}
                    options={statusOptions}
                    placeholder="Semua status"
                    color="violet"
                  />
                  <FilterSelect
                    value={technicianLabel}
                    onChange={(v) => {
                      const t = technicians.find((x) => `${x.fullName} (${x.username})` === v);
                      setFilterTechnician(t ? String(t.userId) : "");
                      setPage(1);
                    }}
                    options={technicianOptions}
                    placeholder="Semua teknisi"
                    color="violet"
                  />
                  <RepairDateRangeFilter
                    dateFrom={filterFromDate}
                    dateTo={filterToDate}
                    onChange={(from, to) => {
                      setFilterFromDate(from);
                      setFilterToDate(to);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

        <RadioRepairGroupedTable
          groups={ticketGroups}
          loading={loading}
          detailLoading={detailLoading}
          showArchive={showArchive}
          canEdit={canEdit}
          canDelete={canDelete}
          canUpdate={canUpdate}
          canHandoverWh={canHandoverWh}
          canViewArchive={canViewArchive}
          canDeletePermanent={canDeletePermanent}
          onOpenPhoto={openRowPhoto}
          onOpenDetail={openDetail}
          onOpenEdit={openEdit}
          onOpenBorrowRequest={(job) => navigate(`/warehouse/borrow-request?repairJobId=${job.id}`)}
          onSoftDelete={softDelete}
          onRestore={restore}
          onDeletePermanent={deletePermanent}
          onQuickStatus={(j, s, cid) => patchStatus(j.id, s, cid)}
          onQuickHandoverWh={async (job) => {
            await openDetail(job.id);
            setShowWh(true);
          }}
          isJobLocked={isJobStatusLocked}
          customStatuses={customStatuses}
        />

      {totalPages > 1 && (
        <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-t bg-gray-50 text-sm rounded-xl">
          <p className="text-gray-600">
            Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} dari {totalCount}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Sebelumnya
            </Button>
            <span className="px-3 py-1 text-gray-700 flex items-center">
              Hal {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}

      <ImageGalleryModal
        images={galleryImages}
        index={galleryIndex}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onIndexChange={setGalleryIndex}
      />

      <Dialog open={!!detail} onOpenChange={(open) => { if (!open) setDetail(null); }}>
        <DialogContent 
          className="max-w-3xl" 
          onInteractOutside={(e) => {
            if (galleryOpen) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              {detail?.helpdeskTicketNumber} — SN {detail?.radioSerialNumber}
              {detail && <RadioRepairStatusBadge status={detail.status} customStatusLabel={detail.customStatusLabel} customStatusColor={detail.customStatusColor} pendingHandoverType={detail.pendingHandoverType} />}
            </DialogTitle>
            {detail && (
              <p className="text-sm text-gray-600">
                Teknisi: <strong>{detail.assignedTechnicianName}</strong>
                {detail.workshopTechnicianName && (
                  <span className="ml-2 text-violet-600">· Workshop: <strong>{detail.workshopTechnicianName}</strong></span>
                )}
              </p>
            )}
          </DialogHeader>
          {detail && (
            <RadioRepairJobDetailPanel
              job={detail}
              canUpdate={canUpdate}
              canSupervise={canSupervise}
              canHandoverWh={canHandoverWh}
              onPatchStatus={(s, cid) => patchStatus(detail.id, s, cid)}
              onApproveMaterial={approveMaterial}
              onOpenWh={() => setShowWh(true)}
              onOpenApproveScrap={() => setShowScrapApproval(true)}
              onCancelScrap={handleCancelScrap}
              onOpenPhotos={openPhotos}
              onJobUpdated={(updated) => {
                setDetail(updated);
                load();
              }}
              patchingStatus={patchingStatus}
              onOpenBorrowRequest={() => {
                setDetail(null);
                navigate(`/warehouse/borrow-request?repairJobId=${detail.id}`);
              }}
              defaultEditingTag={autoOpenTag}
              onClearDefaultEditingTag={() => setAutoOpenTag(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editJob} onOpenChange={() => setEditJob(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit pekerjaan</DialogTitle>
          </DialogHeader>
          {editJob && (
            <RadioRepairJobEditForm job={editJob} technicians={technicians} workshopTechs={workshopTechs} saving={savingEdit} onSave={saveEdit} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showWh && !!detail} onOpenChange={setShowWh}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Teknisi → Warehouse</DialogTitle>
          </DialogHeader>
          {detail && (
            <TechnicianToWarehouseForm
              job={detail}
              onSuccess={() => {
                setShowWh(false);
                setDetail(null);
                load();
              }}
              onCancel={() => setShowWh(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Technician Picker Dialog */}
      <Dialog open={techPickerOpen} onOpenChange={(open) => { if (!open) { setTechPickerOpen(false); setPendingAction(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Pilih Teknisi Workshop</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Pilih teknisi workshop yang akan mengerjakan radio ini.
            </p>
            {workshopTechs.length === 0 ? (
              <p className="text-sm text-amber-600 p-3 bg-amber-50 rounded-lg">
                Belum ada data teknisi workshop. Tambahkan melalui menu pengaturan teknisi.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {workshopTechs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTechnicianPicked(t.id)}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-violet-400 hover:bg-violet-50 transition-colors flex items-center justify-between group"
                  >
                    <span className="font-medium text-sm text-gray-900 group-hover:text-violet-700">{t.name}</span>
                    <span className="text-xs text-gray-400 group-hover:text-violet-500">Pilih →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <RadioCompletionTagModal
        open={tagPickerOpen}
        onOpenChange={(open) => {
          if (!open) {
            setTagPickerOpen(false);
            setPendingAction(null);
          }
        }}
        job={pendingAction?.type === "tag" ? (detail?.id === pendingAction.jobId ? detail : jobs.find(j => j.id === pendingAction.jobId) || null) : null}
        saving={patchingStatus}
        onSave={handleTagModalSave}
      />

      <RadioScrapApprovalModal
        open={showScrapApproval}
        onClose={() => setShowScrapApproval(false)}
        onApprove={handleApproveScrap}
        loading={patchingStatus}
      />
    </motion.div>
  );
}
