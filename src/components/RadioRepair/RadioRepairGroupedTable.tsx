import { Fragment, useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Eye, Pencil, RotateCcw, Trash2, ChevronDown, Warehouse } from "lucide-react";
import type { RadioRepairJobList, RadioRepairJobStatus, RepairJobCustomStatus } from "../../types/radioRepair";
import { HandoverPhotoThumb } from "../RadioHandover/HandoverPhotoThumbnails";
import RadioRepairStatusBadge from "./RadioRepairStatusBadge";
import {
  allowedNextStatuses,
  statusActionLabel,
  isJobStatusLocked,
} from "../../utils/radioRepairStatusUtils";
import {
  formatWorkshopDuration,
  getWorkshopDays,
  workshopDurationBadgeClass,
} from "../../utils/repairDurationUtils";

export type TicketJobGroup = {
  ticket: string;
  radios: RadioRepairJobList[];
};

type Props = {
  groups: TicketJobGroup[];
  loading: boolean;
  detailLoading: boolean;
  showArchive: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  canHandoverWh: boolean;
  canViewArchive: boolean;
  canDeletePermanent: boolean;
  onOpenPhoto: (job: RadioRepairJobList) => void;
  onOpenDetail: (id: number) => void;
  onOpenEdit: (job: RadioRepairJobList) => void;
  onSoftDelete: (job: RadioRepairJobList) => void;
  onRestore: (id: number) => void;
  onDeletePermanent: (job: RadioRepairJobList) => void;
  onQuickStatus: (job: RadioRepairJobList, status: RadioRepairJobStatus, customStatusId?: number | null) => void;
  onQuickHandoverWh: (job: RadioRepairJobList) => void;
  onOpenBorrowRequest: (job: RadioRepairJobList) => void;
  isJobLocked: (status: RadioRepairJobList["status"]) => boolean;
  customStatuses?: RepairJobCustomStatus[];
};

export default function RadioRepairGroupedTable({
  groups,
  loading,
  detailLoading,
  showArchive,
  canEdit,
  canDelete,
  canUpdate,
  canHandoverWh,
  canViewArchive,
  canDeletePermanent,
  onOpenPhoto,
  onOpenDetail,
  onOpenEdit,
  onSoftDelete,
  onRestore,
  onDeletePermanent,
  onQuickStatus,
  onQuickHandoverWh,
  onOpenBorrowRequest,
  isJobLocked,
  customStatuses = [],
}: Props) {
  const colCount = 11;

  return (
    <>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden md:block hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600 border-b">
            <tr>
              <th className="px-3 py-3 w-14">Foto</th>
              <th className="px-3 py-3">SN</th>
              <th className="px-3 py-3">Alat</th>
              <th className="px-3 py-3">ID Radio</th>
              <th className="px-3 py-3">Fleet</th>
              <th className="px-3 py-3">Kerusakan</th>
              <th className="px-3 py-3">Teknisi</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Tanggal masuk</th>
            <th className="px-3 py-3">Lama workshop</th>
            <th className="px-3 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={colCount} className="px-4 py-12 text-center text-gray-400">
                Memuat data...
              </td>
            </tr>
          )}
          {!loading && groups.length === 0 && (
            <tr>
              <td colSpan={colCount} className="px-4 py-12 text-center text-gray-400">
                Belum ada data perbaikan
              </td>
            </tr>
          )}
          {!loading &&
            groups.map(({ ticket, radios }) => (
              <Fragment key={ticket}>
                <tr className="bg-gradient-to-r from-violet-100/90 to-violet-50/50 border-t-2 border-violet-200">
                  <td colSpan={colCount} className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-violet-900">{ticket}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-200/80 text-violet-800 font-medium">
                        {radios.length} radio{radios.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </td>
                </tr>
                {radios.map((j) => (
                  <RadioRepairRow
                    key={j.id}
                    job={j}
                    showArchive={showArchive}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canUpdate={canUpdate}
                    canHandoverWh={canHandoverWh}
                    canViewArchive={canViewArchive}
                    canDeletePermanent={canDeletePermanent}
                    detailLoading={detailLoading}
                    onOpenPhoto={onOpenPhoto}
                    onOpenDetail={onOpenDetail}
                    onOpenEdit={onOpenEdit}
                    onSoftDelete={onSoftDelete}
                    onRestore={onRestore}
                    onDeletePermanent={onDeletePermanent}
                    onQuickStatus={onQuickStatus}
                    onQuickHandoverWh={onQuickHandoverWh}
                    onOpenBorrowRequest={onOpenBorrowRequest}
                    isJobLocked={isJobLocked}
                    customStatuses={customStatuses}
                  />
                ))}
              </Fragment>
            ))}
        </tbody>
      </table>
      </div>
    </div>

    {/* ====== MOBILE CARD LAYOUT ====== */}
    <div className="md:hidden space-y-4">
      {loading ? (
        <div className="text-center py-8 text-gray-500 text-sm">Memuat data...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">Belum ada data perbaikan</div>
      ) : (
        groups.map(({ ticket, radios }) => (
          <div key={ticket} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="font-bold text-violet-900 text-sm">{ticket}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 font-bold">
                {radios.length} radio
              </span>
            </div>
            <div className="space-y-3">
              {radios.map((j) => {
                const days = getWorkshopDays(j.openedAt, j.closedAt);
                return (
                  <div key={j.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2.5 relative">
                    {/* Row 1: Category Badge + Date */}
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 inline-flex text-[10px] leading-5 font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        {j.radioCategory || "Perbaikan"}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        {j.openedAt ? format(new Date(j.openedAt), "dd MMM yyyy", { locale: localeId }) : "-"}
                      </span>
                    </div>

                    {/* Row 2: SN + Unit/Alat */}
                    <div>
                      <p className="text-sm font-bold text-gray-900">{j.radioSerialNumber}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Unit: {j.unitNumber || "-"} • Alat: {j.equipmentName || "-"}
                      </p>
                    </div>

                    {/* Row 3: Detail Grid Box */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-2.5">
                        <div><span className="text-gray-400">ID Radio:</span> <span className="font-mono">{j.radioMasterRadioId || "-"}</span></div>
                        <div><span className="text-gray-400">Teknisi:</span> <span className="font-medium">{j.assignedTechnicianName || "-"}</span></div>
                        {j.workshopTechnicianName && (
                          <div className="col-span-2"><span className="text-gray-400">Workshop:</span> <span className="font-medium text-violet-700">{j.workshopTechnicianName}</span></div>
                        )}
                        <div className="col-span-2 flex items-baseline gap-1"><span className="text-gray-400 shrink-0">Kerusakan:</span> <span className="text-gray-800 line-clamp-1" title={j.damageDescription}>{j.damageDescription}</span></div>
                      <div className="col-span-2 flex items-center gap-1.5 mt-0.5 pt-1.5 border-t border-gray-200/50">
                        <span className="text-gray-400">Durasi:</span>
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded border whitespace-nowrap font-medium ${workshopDurationBadgeClass(days)}`}>
                          {formatWorkshopDuration(j.openedAt, j.closedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Row 4: Fleet Tag */}
                    {j.radioFleet && (
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-xs text-gray-400 mr-1 font-medium">Fleet:</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-mono font-semibold bg-red-50 border-red-200 text-red-600">
                          {j.radioFleet}
                        </span>
                      </div>
                    )}

                    {/* Row 5: Status & Actions */}
                    <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-gray-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <RadioRepairStatusBadge
                          status={j.status}
                          customStatusLabel={j.customStatusLabel}
                          customStatusColor={j.customStatusColor}
                        />
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-auto items-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onOpenDetail(j.id)}
                          className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {!showArchive && !isJobLocked(j.status) && canUpdate && (
                          <MobileQuickActionDropdown
                            job={j}
                            customStatuses={customStatuses}
                            onQuickStatus={onQuickStatus}
                            onQuickHandoverWh={onQuickHandoverWh}
                            onOpenBorrowRequest={onOpenBorrowRequest}
                            canHandoverWh={canHandoverWh}
                          />
                        )}

                        {canEdit && !showArchive && (
                          <button
                            type="button"
                            onClick={() => onOpenEdit(j)}
                            className="text-gray-500 hover:text-violet-600 p-1.5 rounded-lg hover:bg-violet-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}

                        {canDelete && !showArchive && (
                          <button
                            type="button"
                            onClick={() => onSoftDelete(j)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {showArchive && canViewArchive && (
                          <button
                            type="button"
                            onClick={() => onRestore(j.id)}
                            className="inline-flex items-center justify-center h-7 px-2.5 border border-amber-200 rounded-lg text-amber-700 bg-amber-50 text-[10px] font-semibold transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Pulihkan
                          </button>
                        )}

                        {showArchive && canDeletePermanent && (
                          <button
                            type="button"
                            onClick={() => onDeletePermanent(j)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title="Hapus Permanen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
    </>
  );
}

function MobileQuickActionDropdown({
  job,
  customStatuses = [],
  onQuickStatus,
  onQuickHandoverWh,
  onOpenBorrowRequest,
  canHandoverWh,
}: {
  job: RadioRepairJobList;
  customStatuses?: RepairJobCustomStatus[];
  onQuickStatus: (job: RadioRepairJobList, status: RadioRepairJobStatus, customStatusId?: number | null) => void;
  onQuickHandoverWh: (job: RadioRepairJobList) => void;
  onOpenBorrowRequest: (job: RadioRepairJobList) => void;
  canHandoverWh: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const nextList = allowedNextStatuses(job.status);
  const canShowCustom = customStatuses.length > 0 && ["InProgress", "Received"].includes(job.status);
  const showBackToProgress = !!job.customStatusId;
  const canBorrow = job.status === "InProgress";
  const hasActions = nextList.length > 0 || showBackToProgress || canShowCustom || (job.status === "RepairCompleted" && canHandoverWh) || canBorrow;

  if (!hasActions) return null;

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="inline-flex items-center justify-center h-8 px-3 border border-violet-200 rounded-xl text-violet-700 bg-violet-50 text-xs font-semibold shrink-0"
      >
        Aksi <ChevronDown className="w-3 h-3 ml-1" />
      </button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
          <DialogHeader className="p-4 pb-2 text-left border-b border-gray-100">
            <DialogTitle className="text-base font-bold text-gray-900">Aksi Pekerjaan</DialogTitle>
          </DialogHeader>
          <div className="py-2 max-h-[70vh] overflow-y-auto">
          {nextList.length > 0 && (
            <>
              <p className="px-4 py-1.5 text-xs text-gray-400 font-medium">
                Status sistem:
              </p>
              {nextList.map((ns) => (
                <button
                  key={ns}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    onQuickStatus(job, ns, null);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                >
                  {statusActionLabel(job.status, ns)}
                </button>
              ))}
            </>
          )}

          {showBackToProgress && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onQuickStatus(job, "InProgress", null);
              }}
              className="w-full text-left px-4 py-3 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors border-t border-gray-100 mt-1"
            >
              Kembali ke Progress
            </button>
          )}

          {canShowCustom && (
            <>
              <p className="px-4 py-1.5 text-xs text-gray-400 border-t border-gray-100 mt-1 pt-3 font-medium">
                Status tambahan:
              </p>
              {customStatuses
                .filter((cs) => cs.id !== job.customStatusId)
                .map((cs) => (
                  <button
                    key={cs.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(false);
                      onQuickStatus(job, "InProgress", cs.id);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-violet-50 transition-colors flex items-center gap-2"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${cs.color}`} />
                    {cs.label}
                  </button>
                ))}
            </>
          )}
          
          {job.status === "RepairCompleted" && canHandoverWh && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onQuickHandoverWh(job);
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-violet-50 text-violet-700 flex items-center font-medium border-t border-gray-100 mt-1"
            >
              <Warehouse className="w-4 h-4 mr-2" />
              Serah ke WH
            </button>
          )}

          {canBorrow && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onOpenBorrowRequest(job);
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-amber-50 text-amber-700 flex items-center font-medium border-t border-gray-100 mt-1"
            >
              <Warehouse className="w-4 h-4 mr-2" />
              Pinjam Part
            </button>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Row Component ────────────────────────────────────────────────────────────

type RowProps = {
  job: RadioRepairJobList;
  showArchive: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  canHandoverWh: boolean;
  canViewArchive: boolean;
  canDeletePermanent: boolean;
  detailLoading: boolean;
  onOpenPhoto: (job: RadioRepairJobList) => void;
  onOpenDetail: (id: number) => void;
  onOpenEdit: (job: RadioRepairJobList) => void;
  onSoftDelete: (job: RadioRepairJobList) => void;
  onRestore: (id: number) => void;
  onDeletePermanent: (job: RadioRepairJobList) => void;
  onQuickStatus: (job: RadioRepairJobList, status: RadioRepairJobStatus, customStatusId?: number | null) => void;
  onQuickHandoverWh: (job: RadioRepairJobList) => void;
  onOpenBorrowRequest: (job: RadioRepairJobList) => void;
  isJobLocked: (status: RadioRepairJobList["status"]) => boolean;
  customStatuses: RepairJobCustomStatus[];
};

function RadioRepairRow({
  job: j,
  showArchive,
  canEdit,
  canDelete,
  canUpdate,
  canHandoverWh,
  canViewArchive,
  canDeletePermanent,
  detailLoading,
  onOpenPhoto,
  onOpenDetail,
  onOpenEdit,
  onSoftDelete,
  onRestore,
  onDeletePermanent,
  onQuickStatus,
  onQuickHandoverWh,
  onOpenBorrowRequest,
  isJobLocked,
  customStatuses,
}: RowProps) {
  const days = getWorkshopDays(j.openedAt, j.closedAt);
  const locked = isJobStatusLocked(j.status as RadioRepairJobStatus) || !!j.isDeleted;
  const nextStatuses = !locked && !showArchive
    ? allowedNextStatuses(j.status as RadioRepairJobStatus)
    : [];
  const showWhShortcut = canHandoverWh && j.status === "RepairCompleted" && !j.isDeleted && !showArchive;

  return (
    <tr className={`border-t border-gray-100 hover:bg-violet-50/40 ${j.isDeleted ? "opacity-60" : ""}`}>
      <td className="px-3 py-2.5 w-14">
        <HandoverPhotoThumb photo={j.previewPhotoBase64} onClick={() => onOpenPhoto(j)} />
      </td>
      <td className="px-3 py-2.5 font-mono text-xs font-medium">{j.radioSerialNumber}</td>
      <td className="px-3 py-2.5 max-w-[110px] truncate text-xs" title={j.equipmentName ?? ""}>
        {j.equipmentName ?? "—"}
      </td>
      <td className="px-3 py-2.5 text-xs font-mono">{j.radioMasterRadioId?.trim() || "—"}</td>
      <td className="px-3 py-2.5 text-xs max-w-[90px] truncate" title={j.radioFleet ?? ""}>
        {j.radioFleet?.trim() || "—"}
      </td>
      <td className="px-3 py-2.5 max-w-[130px] truncate text-xs" title={j.damageDescription}>
        {j.damageDescription}
      </td>
      <td className="px-3 py-2.5 text-xs">
        {j.assignedTechnicianName}
        {j.workshopTechnicianName && (
          <div className="text-violet-700 mt-0.5">({j.workshopTechnicianName})</div>
        )}
      </td>
      <td className="px-3 py-2.5">
        <RadioRepairStatusBadge
          status={j.status}
          customStatusLabel={j.customStatusLabel}
          customStatusColor={j.customStatusColor}
        />
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-600">
        {format(new Date(j.openedAt), "dd/MM/yy HH:mm", { locale: localeId })}
      </td>
      <td className="px-3 py-2.5">
        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${workshopDurationBadgeClass(days)}`}>
          {formatWorkshopDuration(j.openedAt, j.closedAt)}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex justify-end items-center gap-1">
          {/* Shortcut serah terima ke warehouse */}
          {showWhShortcut && (
            <button
              type="button"
              title="Serah terima ke Warehouse"
              className="flex items-center gap-1 px-2 py-1 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 whitespace-nowrap"
              onClick={(e) => { e.stopPropagation(); onQuickHandoverWh(j); }}
            >
              <Warehouse className="w-3 h-3" /> Ke WH
            </button>
          )}

          {/* Dropdown shortcut ubah status */}
          {canUpdate && nextStatuses.length > 0 && (
            <StatusDropdown
              job={j}
              nextStatuses={nextStatuses}
              customStatuses={customStatuses}
              onSelect={(s, cid) => onQuickStatus(j, s, cid)}
            />
          )}

          {/* Tombol detail */}
          <button
            type="button"
            title="Detail"
            className="p-1.5 border rounded-lg hover:bg-violet-50 bg-white"
            disabled={detailLoading}
            onClick={() => onOpenDetail(j.id)}
          >
            <Eye className="w-4 h-4" />
          </button>

          {canEdit && !showArchive && !isJobLocked(j.status) && (
            <button
              type="button"
              title="Edit"
              className="p-1.5 border rounded-lg hover:bg-amber-50 bg-white"
              onClick={() => onOpenEdit(j)}
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}

          {canDelete && !showArchive && !isJobLocked(j.status) && (
            <button
              type="button"
              title="Hapus"
              className="p-1.5 border rounded-lg hover:bg-red-50 text-red-600 bg-white"
              onClick={() => onSoftDelete(j)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {canViewArchive && showArchive && (
            <>
              <button
                type="button"
                title="Pulihkan"
                className="p-1.5 border rounded-lg hover:bg-emerald-50 text-emerald-700 bg-white"
                onClick={() => onRestore(j.id)}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              {canDeletePermanent && (
                <button
                  type="button"
                  title="Hapus permanen"
                  className="p-1.5 border rounded-lg hover:bg-red-100 text-red-700 border-red-200 bg-white"
                  onClick={() => onDeletePermanent(j)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {canUpdate && (j.status === "InProgress") && (
            <button
              type="button"
              title="Pinjam Part"
              className="p-1.5 border rounded-lg hover:bg-amber-50 bg-white text-amber-600"
              onClick={() => onOpenBorrowRequest(j)}
            >
              <Warehouse className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Status Dropdown ──────────────────────────────────────────────────────────

function StatusDropdown({
  job,
  nextStatuses,
  customStatuses,
  onSelect,
}: {
  job: RadioRepairJobList;
  nextStatuses: RadioRepairJobStatus[];
  customStatuses: RepairJobCustomStatus[];
  onSelect: (s: RadioRepairJobStatus, customId?: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const canShowCustom = customStatuses.length > 0 && ["InProgress", "Received"].includes(job.status);
  const showBackToProgress = !!job.customStatusId;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title="Ubah status"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex items-center gap-1 px-2 py-1 text-xs border border-violet-200 text-violet-700 bg-violet-50 rounded-lg hover:bg-violet-100 whitespace-nowrap"
      >
        Status <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl min-w-[180px] py-1 overflow-hidden">
          <p className="px-3 py-1.5 text-xs text-gray-400 border-b border-gray-100 bg-gray-50 font-medium">
            Status sistem:
          </p>
          {nextStatuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(s);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
            >
              {statusActionLabel(job.status as RadioRepairJobStatus, s)}
            </button>
          ))}
          
          {showBackToProgress && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect("InProgress", null);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors border-t border-gray-100"
            >
              Kembali ke Progress
            </button>
          )}

          {canShowCustom && (
            <>
              <p className="px-3 py-1.5 text-xs text-gray-400 border-y border-gray-100 mt-1 bg-gray-50 font-medium">
                Status tambahan:
              </p>
              {customStatuses
                .filter((cs) => cs.id !== job.customStatusId)
                .map((cs) => (
                <button
                  key={cs.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect("InProgress", cs.id);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-violet-50 transition-colors flex items-center gap-2"
                >
                  <span className={`w-2 h-2 rounded-full ${cs.color}`} />
                  {cs.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
