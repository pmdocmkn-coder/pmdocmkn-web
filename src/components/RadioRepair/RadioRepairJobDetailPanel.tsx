import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { RadioRepairJobDetail, RadioRepairJobStatus } from "../../types/radioRepair";
import type { RadioHandoverDetail } from "../../types/radioHandover";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import { radioApi, type RadioDto } from "../../services/radioApi";
import DamagedEquipmentTagCard from "../RadioHandover/DamagedEquipmentTagCard";
import HandoverPhotoThumbnails from "../RadioHandover/HandoverPhotoThumbnails";
import SignaturePadField from "../common/SignaturePadField";
import {
  allowedNextStatuses,
  isJobStatusLocked,
  STATUS_LABELS,
  statusActionButtonClass,
} from "../../utils/radioRepairStatusUtils";
import { formatWorkshopDuration } from "../../utils/repairDurationUtils";

function resolveHandoverPhotosFromDetail(d: RadioHandoverDetail): string[] {
  if (d.radioPhotos && d.radioPhotos.length > 0) return d.radioPhotos;
  if (d.radioPhotoBase64) return [d.radioPhotoBase64];
  return [];
}

type Props = {
  job: RadioRepairJobDetail;
  canUpdate: boolean;
  canSupervise: boolean;
  canHandoverWh: boolean;
  onPatchStatus: (status: RadioRepairJobStatus) => void;
  onApproveMaterial: (resume: "InProgress" | "Monitoring") => void;
  onOpenWh: () => void;
  onOpenPhotos?: (images: string[], index?: number) => void;
};

export default function RadioRepairJobDetailPanel({
  job,
  canUpdate,
  canSupervise,
  canHandoverWh,
  onPatchStatus,
  onApproveMaterial,
  onOpenWh,
  onOpenPhotos,
}: Props) {
  const [handoverDetail, setHandoverDetail] = useState<RadioHandoverDetail | null>(null);
  const [radioMaster, setRadioMaster] = useState<RadioDto | null>(null);

  const ph = job.primaryHandover;
  const handoverId = ph?.id ?? job.handovers?.find((h) => h.handoverType === "HelpdeskToTechnician")?.id;

  useEffect(() => {
    if (!handoverId) {
      setHandoverDetail(null);
      return;
    }
    radioHandoverApi.getById(handoverId).then(setHandoverDetail).catch(() => setHandoverDetail(null));
  }, [handoverId]);

  useEffect(() => {
    if (!job.radioId) {
      setRadioMaster(null);
      return;
    }
    radioApi
      .getById(job.radioId)
      .then((r) => setRadioMaster(r.data?.data ?? null))
      .catch(() => setRadioMaster(null));
  }, [job.radioId]);

  const displayRadioMasterId =
    job.radioMasterRadioId?.trim() || radioMaster?.radioId?.trim() || null;
  const displayFleet = job.radioFleet?.trim() || radioMaster?.fleet?.trim() || null;
  const displayCategory = job.radioCategory ?? radioMaster?.category ?? null;

  const tagData = {
    handoverNumber: ph?.handoverNumber ?? "—",
    handedOverByName: ph?.handedOverByName ?? job.openedByName,
    receivedByName: ph?.receivedByName ?? job.assignedTechnicianName,
    handoverAt: ph?.handoverAt ?? job.openedAt,
    equipmentName: ph?.equipmentName ?? job.equipmentName,
    unitNumber: ph?.unitNumber ?? job.unitNumber,
    radioSerialNumber: ph?.radioSerialNumber ?? job.radioSerialNumber,
    radioOwnerLabel: ph?.radioOwnerLabel ?? job.radioOwnerLabel,
    ownerDivision: ph?.ownerDivision ?? job.ownerDivision,
    ownerDepartment: ph?.ownerDepartment ?? job.ownerDepartment,
    damageDescription: ph?.damageDescription ?? job.damageDescription,
    accessories:
      ph?.accessories?.map((a) => ({
        itemName: a.itemName,
        quantity: a.quantity,
        unit: a.unit ?? undefined,
        description: a.description ?? undefined,
        serialNumber: a.serialNumber ?? undefined,
      })) ?? [],
    helpdeskTicketNumber: job.helpdeskTicketNumber,
    radioMasterId: job.radioId,
    radioMasterRadioId: displayRadioMasterId,
    radioFleet: displayFleet,
    radioCategory: displayCategory,
  };

  const handoverPhotos = handoverDetail ? resolveHandoverPhotosFromDetail(handoverDetail) : [];
  const nextStatuses = allowedNextStatuses(job.status);
  const locked = isJobStatusLocked(job.status) || job.isDeleted;

  const openGallery = (imgs: string[], index = 0) => {
    if (imgs.length === 0) return;
    if (onOpenPhotos) {
      onOpenPhotos(imgs, index);
      return;
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          Lama di workshop: <strong>{formatWorkshopDuration(job.openedAt, job.closedAt)}</strong>
        </span>
        {job.radioId && (
          <span className="text-violet-700">Terhubung master #{job.radioId}</span>
        )}
      </div>

      <DamagedEquipmentTagCard data={tagData} />

      {handoverDetail && (
        <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
          <div>
            <p className="font-medium text-gray-800">Serah terima HD→Tek — {handoverDetail.handoverNumber}</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {handoverDetail.handedOverByName} → {handoverDetail.receivedByName} ·{" "}
              {format(new Date(handoverDetail.handoverAt), "dd MMM yyyy HH:mm", { locale: localeId })}
            </p>
          </div>

          <HandoverPhotoThumbnails
            photos={handoverPhotos}
            label="Foto radio"
            onOpen={(i) => openGallery(handoverPhotos, i)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <SignaturePadField label="TTD Penyerah (HD)" readOnly value={handoverDetail.handedOverSignatureBase64} />
            <SignaturePadField label="TTD Penerima (Tek)" readOnly value={handoverDetail.receiverSignatureBase64} />
          </div>
        </div>
      )}

      {job.isDeleted && <p className="text-red-600 font-medium">Pekerjaan di arsip</p>}

      {canUpdate && !locked && nextStatuses.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Ubah status pekerjaan</p>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((s) => (
              <button
                key={s}
                type="button"
                className={statusActionButtonClass(s)}
                onClick={() => onPatchStatus(s)}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          {job.status === "Received" && (
            <p className="text-xs text-gray-500">
              Status &quot;Tunggu material&quot; akan masuk antrian persetujuan supervisor.
            </p>
          )}
        </div>
      )}

      {canSupervise && job.status === "WaitingMaterialApproval" && !job.isDeleted && (
        <div className="p-3 border border-amber-200 bg-amber-50 rounded-lg space-y-2">
          <p className="font-medium text-amber-900">Persetujuan material (supervisor)</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm"
              onClick={() => onApproveMaterial("InProgress")}
            >
              Setujui → Progress
            </button>
            <button
              type="button"
              className="px-4 py-2 border border-amber-600 text-amber-800 rounded-lg text-sm hover:bg-amber-100"
              onClick={() => onApproveMaterial("Monitoring")}
            >
              Setujui → Monitoring
            </button>
          </div>
        </div>
      )}

      {canHandoverWh && job.status === "RepairCompleted" && !job.isDeleted && (
        <button
          type="button"
          className="px-4 py-2 bg-violet-700 text-white rounded-lg font-medium shadow-sm hover:bg-violet-800"
          onClick={onOpenWh}
        >
          Serah terima ke Warehouse
        </button>
      )}

      {job.handovers && job.handovers.length > 0 && (
        <div>
          <h3 className="font-semibold mb-1">Riwayat serah terima</h3>
          <ul className="text-xs space-y-1 text-gray-600">
            {job.handovers.map((h) => (
              <li key={h.id}>
                {h.handoverNumber} ({h.handoverType}) — {h.handedOverByName} → {h.receivedByName}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-2">Timeline status</h3>
        <ul className="space-y-1 text-xs text-gray-600">
          {(job.statusLogs ?? []).map((l) => (
            <li key={l.id}>
              {format(new Date(l.at), "dd/MM HH:mm")} — {l.fromStatus ?? "—"} → {l.toStatus} ({l.userName})
              {l.note && <span className="text-gray-400"> — {l.note}</span>}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
