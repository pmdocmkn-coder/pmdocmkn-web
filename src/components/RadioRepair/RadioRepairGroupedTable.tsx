import { Fragment } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Eye, Pencil, RotateCcw, Trash2 } from "lucide-react";
import type { RadioRepairJobList } from "../../types/radioRepair";
import { HandoverPhotoThumb } from "../RadioHandover/HandoverPhotoThumbnails";
import RadioRepairStatusBadge from "./RadioRepairStatusBadge";
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
  canViewArchive: boolean;
  canDeletePermanent: boolean;
  onOpenPhoto: (job: RadioRepairJobList) => void;
  onOpenDetail: (id: number) => void;
  onOpenEdit: (job: RadioRepairJobList) => void;
  onSoftDelete: (job: RadioRepairJobList) => void;
  onRestore: (id: number) => void;
  onDeletePermanent: (job: RadioRepairJobList) => void;
  isJobLocked: (status: RadioRepairJobList["status"]) => boolean;
};

export default function RadioRepairGroupedTable({
  groups,
  loading,
  detailLoading,
  showArchive,
  canEdit,
  canDelete,
  canViewArchive,
  canDeletePermanent,
  onOpenPhoto,
  onOpenDetail,
  onOpenEdit,
  onSoftDelete,
  onRestore,
  onDeletePermanent,
  isJobLocked,
}: Props) {
  const colCount = 11;

  const renderActions = (j: RadioRepairJobList) => (
    <div className="flex justify-end gap-1">
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
    </div>
  );

  const renderRow = (j: RadioRepairJobList) => {
    const days = getWorkshopDays(j.openedAt, j.closedAt);
    return (
      <tr
        key={j.id}
        className={`border-t border-gray-100 hover:bg-violet-50/40 ${j.isDeleted ? "opacity-60" : ""}`}
      >
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
        <td className="px-3 py-2.5 text-xs">{j.assignedTechnicianName}</td>
        <td className="px-3 py-2.5">
          <RadioRepairStatusBadge status={j.status} />
        </td>
        <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-600">
          {format(new Date(j.openedAt), "dd/MM/yy HH:mm", { locale: localeId })}
        </td>
        <td className="px-3 py-2.5">
          <span
            className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${workshopDurationBadgeClass(days)}`}
          >
            {formatWorkshopDuration(j.openedAt, j.closedAt)}
          </span>
        </td>
        <td className="px-3 py-2.5">{renderActions(j)}</td>
      </tr>
    );
  };

  return (
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
                {radios.map((j) => renderRow(j))}
              </Fragment>
            ))}
        </tbody>
      </table>
    </div>
  );
}
