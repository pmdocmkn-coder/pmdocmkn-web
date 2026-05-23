import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ChevronDown, ChevronUp, Filter, RotateCcw, Search } from "lucide-react";
import RepairDateRangeFilter from "./RepairDateRangeFilter";
import RadioRepairStatsCards from "./RadioRepairStatsCards";
import RadioRepairGroupedTable, { type TicketJobGroup } from "./RadioRepairGroupedTable";
import { radioRepairApi, type UpdateRadioRepairJobPayload } from "../../services/radioRepairApi";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import type {
  RadioRepairDashboard,
  RadioRepairJobDetail,
  RadioRepairJobList,
  RadioRepairJobStatus,
} from "../../types/radioRepair";
import type { UserOption } from "../../types/radioHandover";
import RadioRepairStatusBadge from "./RadioRepairStatusBadge";
import RadioRepairJobDetailPanel from "./RadioRepairJobDetailPanel";
import RadioRepairJobEditForm from "./RadioRepairJobEditForm";
import TechnicianToWarehouseForm from "../RadioHandover/TechnicianToWarehouseForm";
import ImageGalleryModal from "../common/ImageGalleryModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { FilterSelect } from "../Radio/FilterSelect";
import { useToast } from "../../hooks/use-toast";
import { hasPermission } from "../../utils/permissionUtils";
import { isJobStatusLocked, STATUS_LABELS } from "../../utils/radioRepairStatusUtils";
import {
  canApproveRepairMaterial,
  canCreateTekToWarehouseHandover,
  canUpdateRepairJobStatus,
} from "../../utils/repairDashboardPermissions";
import { asImageSrc } from "../../utils/handoverPhotoUtils";

const PAGE_SIZE = 15;

const filterPanelVariants = {
  open: { height: "auto", opacity: 1, transition: { duration: 0.3 } },
  closed: { height: 0, opacity: 0, transition: { duration: 0.25 } },
};

export default function RadioRepairDashboardPage() {
  const { toast } = useToast();
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

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTechnician, setFilterTechnician] = useState("");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const [editJob, setEditJob] = useState<RadioRepairJobDetail | null>(null);
  const [technicians, setTechnicians] = useState<UserOption[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [patchingStatus, setPatchingStatus] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const canSupervise = canApproveRepairMaterial();
  const canUpdate = canUpdateRepairJobStatus();
  const canDelete = hasPermission("radio.repair.delete");
  const canEdit = hasPermission("radio.repair.edit");
  const canViewArchive = hasPermission("radio.repair.view.archive");
  const canDeletePermanent = hasPermission("radio.repair.delete.permanent");
  const canHandoverWh = canCreateTekToWarehouseHandover();

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

  // Auto-refresh setiap 30 detik — sinkronisasi antar teknisi tanpa perlu reload manual
  useEffect(() => {
    const interval = setInterval(() => {
      // Hanya refresh jika tidak sedang ada operasi aktif (patching/saving)
      if (!patchingStatus && !savingEdit) {
        load();
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [page, search, filterStatus, filterTechnician, filterFromDate, filterToDate, showArchive, patchingStatus, savingEdit]);

  useEffect(() => {
    radioHandoverApi.getTechnicians().then(setTechnicians).catch(() => setTechnicians([]));
  }, []);

  const resetFilters = () => {
    setFilterStatus("");
    setFilterTechnician("");
    setFilterFromDate("");
    setFilterToDate("");
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

  const patchStatus = async (status: RadioRepairJobStatus, customStatusId?: number | null) => {
    if (!detail || patchingStatus) return;
    setPatchingStatus(true);
    try {
      setDetail(await radioRepairApi.updateStatus(detail.id, status, undefined, customStatusId));
      toast({ title: "Status diperbarui" });
      load();
    } catch (err: unknown) {
      toast({ title: "Gagal update status", description: apiMessage(err), variant: "destructive" });
    } finally {
      setPatchingStatus(false);
    }
  };

  const approveMaterial = async (resume: "InProgress" | "Monitoring") => {
    if (!detail || patchingStatus) return;
    setPatchingStatus(true);
    try {
      setDetail(await radioRepairApi.approveMaterial(detail.id, resume));
      toast({ title: "Material disetujui" });
      load();
    } catch (err: unknown) {
      toast({ title: "Gagal approve", description: apiMessage(err), variant: "destructive" });
    } finally {
      setPatchingStatus(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
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

      {!showArchive && dash && (
        <RadioRepairStatsCards dash={dash} page={page} totalPages={totalPages} />
      )}

      {/* Filter panel — gaya Radio KPC */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
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
          onSoftDelete={softDelete}
          onRestore={restore}
          onDeletePermanent={deletePermanent}
          onQuickStatus={async (job, status) => {
            setPatchingStatus(true);
            try {
              await radioRepairApi.updateStatus(job.id, status);
              toast({ title: "Status diperbarui" });
              load();
            } catch (err) {
              toast({ title: "Gagal update status", description: apiMessage(err), variant: "destructive" });
            } finally {
              setPatchingStatus(false);
            }
          }}
          onQuickHandoverWh={async (job) => {
            // Buka detail panel langsung ke form serah terima WH
            await openDetail(job.id);
            setShowWh(true);
          }}
          isJobLocked={isJobStatusLocked}
        />

        {totalPages > 1 && (
          <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-t bg-gray-50 text-sm">
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
      </div>

      <ImageGalleryModal
        images={galleryImages}
        index={galleryIndex}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onIndexChange={setGalleryIndex}
      />

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              {detail?.helpdeskTicketNumber} — SN {detail?.radioSerialNumber}
              {detail && <RadioRepairStatusBadge status={detail.status} customStatusLabel={detail.customStatusLabel} customStatusColor={detail.customStatusColor} />}
            </DialogTitle>
            {detail && (
              <p className="text-sm text-gray-600">
                Teknisi: <strong>{detail.assignedTechnicianName}</strong>
              </p>
            )}
          </DialogHeader>
          {detail && (
            <RadioRepairJobDetailPanel
              job={detail}
              canUpdate={canUpdate}
              canSupervise={canSupervise}
              canHandoverWh={canHandoverWh}
              onPatchStatus={patchStatus}
              onApproveMaterial={approveMaterial}
              onOpenWh={() => setShowWh(true)}
              onOpenPhotos={openPhotos}
              onJobUpdated={(updated) => {
                setDetail(updated);
                load();
              }}
              patchingStatus={patchingStatus}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editJob} onOpenChange={() => setEditJob(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit pekerjaan</DialogTitle>
          </DialogHeader>
          {editJob && (
            <RadioRepairJobEditForm job={editJob} technicians={technicians} saving={savingEdit} onSave={saveEdit} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showWh && !!detail} onOpenChange={setShowWh}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
    </motion.div>
  );
}
