import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Pencil, X, Check, Loader2 } from "lucide-react";
import type { RadioRepairJobDetail, RadioRepairJobStatus, RepairJobCustomStatus } from "../../types/radioRepair";
import type { RadioHandoverDetail } from "../../types/radioHandover";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import { radioApi, type RadioDto } from "../../services/radioApi";
import { radioRepairApi } from "../../services/radioRepairApi";
import { repairJobCustomStatusApi } from "../../services/repairJobCustomStatusApi";
import RadioRepairStatusBadge, { STATUS_CONFIG } from "./RadioRepairStatusBadge";
import RepairJobCustomStatusManager from "./RepairJobCustomStatusManager";
import HandoverTagPreview from "../RadioHandover/HandoverTagPreview";
import HandoverTimeline from "../RadioHandover/HandoverTimeline";
import HandoverPhotoThumbnails from "../RadioHandover/HandoverPhotoThumbnails";
import SignaturePadField from "../common/SignaturePadField";
import type { GreenTagFields } from "../../types/equipmentTag";
import GreenTagFieldsForm from "../RadioHandover/GreenTagFieldsForm";
import {
  allowedNextStatuses,
  isJobStatusLocked,
  STATUS_LABELS,
  statusActionButtonClass,
  statusActionLabel,
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
  patchingStatus?: boolean;
  onPatchStatus: (status: RadioRepairJobStatus, customStatusId?: number | null) => void;
  onApproveMaterial: (resume: "InProgress" | "Monitoring") => void;
  onOpenWh: () => void;
  onOpenPhotos?: (images: string[], index?: number) => void;
  onJobUpdated?: (job: RadioRepairJobDetail) => void;
};

export default function RadioRepairJobDetailPanel({
  job,
  canUpdate,
  canSupervise,
  canHandoverWh,
  patchingStatus = false,
  onPatchStatus,
  onApproveMaterial,
  onOpenWh,
  onOpenPhotos,
  onJobUpdated,
}: Props) {
  const [handoverDetail, setHandoverDetail] = useState<RadioHandoverDetail | null>(null);
  const [radioMaster, setRadioMaster] = useState<RadioDto | null>(null);
  const [customStatuses, setCustomStatuses] = useState<RepairJobCustomStatus[]>([]);

  // Load custom statuses sekali saat panel dibuka
  useEffect(() => {
    repairJobCustomStatusApi.getAll()
      .then((list) => setCustomStatuses(list.filter((s) => s.isActive)))
      .catch(() => setCustomStatuses([]));
  }, []);

  // Edit catatan kerusakan oleh teknisi
  const [editingDamage, setEditingDamage] = useState(false);
  const [tagTypeInput, setTagTypeInput] = useState<"Good" | "Damaged">(job.equipmentTagType === "Good" ? "Good" : "Damaged");
  const [damageInput, setDamageInput] = useState(job.damageDescription);
  const [greenTagInput, setGreenTagInput] = useState<GreenTagFields>({
    originFrom: job.originFrom || [job.radioOwnerLabel, job.ownerDivision].filter(Boolean).join(" - ") || "",
    repairDataDescription: job.repairDataDescription ?? undefined,
    repairedByName: job.repairedByName ?? undefined,
    frequencyError: job.frequencyError ?? undefined,
    afReading: job.afReading ?? undefined,
    powerReading: job.powerReading ?? undefined,
    voltageOutNoLoad: job.voltageOutNoLoad ?? undefined,
    voltageOutWithLoad: job.voltageOutWithLoad ?? undefined,
    physicalCondition: job.physicalCondition ?? undefined,
    displayCondition: job.displayCondition ?? undefined,
  });
  const [savingDamage, setSavingDamage] = useState(false);

  // Sync input saat job berubah (misal setelah refresh)
  useEffect(() => {
    setTagTypeInput(job.equipmentTagType === "Good" ? "Good" : "Damaged");
    setDamageInput(job.damageDescription);
    setGreenTagInput({
      originFrom: job.originFrom || [job.radioOwnerLabel, job.ownerDivision].filter(Boolean).join(" - ") || "",
      repairDataDescription: job.repairDataDescription ?? undefined,
      repairedByName: job.repairedByName ?? undefined,
      frequencyError: job.frequencyError ?? undefined,
      afReading: job.afReading ?? undefined,
      powerReading: job.powerReading ?? undefined,
      voltageOutNoLoad: job.voltageOutNoLoad ?? undefined,
      voltageOutWithLoad: job.voltageOutWithLoad ?? undefined,
      physicalCondition: job.physicalCondition ?? undefined,
      displayCondition: job.displayCondition ?? undefined,
    });
  }, [job]);

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

  const saveDamage = async () => {
    setSavingDamage(true);
    try {
      const payload: Parameters<typeof radioRepairApi.technicianUpdate>[1] = {
        damageDescription: damageInput,
        equipmentTagType: tagTypeInput,
      };
      if (tagTypeInput === "Good") {
        Object.assign(payload, greenTagInput);
      }
      
      const updated = await radioRepairApi.technicianUpdate(job.id, payload);
      setEditingDamage(false);
      onJobUpdated?.(updated);
    } catch {
      // biarkan user coba lagi
    } finally {
      setSavingDamage(false);
    }
  };
  const previewDetail = handoverDetail ? {
    ...handoverDetail,
    equipmentTagType: job.equipmentTagType ?? handoverDetail.equipmentTagType,
    damageDescription: job.damageDescription ?? handoverDetail.damageDescription,
    originFrom: job.originFrom ?? handoverDetail.originFrom,
    repairDataDescription: job.repairDataDescription ?? handoverDetail.repairDataDescription,
    repairedByName: job.repairedByName ?? handoverDetail.repairedByName,
    frequencyError: job.frequencyError ?? handoverDetail.frequencyError,
    afReading: job.afReading ?? handoverDetail.afReading,
    powerReading: job.powerReading ?? handoverDetail.powerReading,
    voltageOutNoLoad: job.voltageOutNoLoad ?? handoverDetail.voltageOutNoLoad,
    voltageOutWithLoad: job.voltageOutWithLoad ?? handoverDetail.voltageOutWithLoad,
    physicalCondition: job.physicalCondition ?? handoverDetail.physicalCondition,
    displayCondition: job.displayCondition ?? handoverDetail.displayCondition,
  } : null;

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

      {previewDetail ? <HandoverTagPreview detail={previewDetail} /> : null}

      {/* Edit keterangan kerusakan / Tag Hijau — hanya untuk teknisi yang punya radio.repair.update */}
      {canUpdate && !locked && (
        <div className={`border rounded-lg p-3 space-y-2 ${tagTypeInput === "Good" ? "bg-emerald-50/60 border-emerald-200" : "bg-amber-50/60 border-amber-200"}`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs font-semibold ${tagTypeInput === "Good" ? "text-emerald-800" : "text-amber-800"}`}>
              {tagTypeInput === "Good" ? "Data Perbaikan" : "Keterangan kerusakan"}
            </p>
            {!editingDamage && (
              <button
                type="button"
                onClick={() => setEditingDamage(true)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${tagTypeInput === "Good" ? "text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100" : "text-amber-700 hover:text-amber-900 hover:bg-amber-100"}`}
              >
                <Pencil className="w-3 h-3" /> Edit Data
              </button>
            )}
          </div>
          {editingDamage ? (
            <div className="space-y-4">
              <div className="flex gap-4 p-2 bg-white rounded-lg border">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="tagType"
                    checked={tagTypeInput === "Damaged"}
                    onChange={() => setTagTypeInput("Damaged")}
                  />
                  <span>Tag Kuning (Rusak)</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="tagType"
                    checked={tagTypeInput === "Good"}
                    onChange={() => setTagTypeInput("Good")}
                  />
                  <span>Tag Hijau (Bagus)</span>
                </label>
              </div>

              {tagTypeInput === "Damaged" ? (
                <textarea
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  rows={3}
                  value={damageInput}
                  onChange={(e) => setDamageInput(e.target.value)}
                  disabled={savingDamage}
                  placeholder="Keterangan kerusakan..."
                />
              ) : (
                <GreenTagFieldsForm
                  value={greenTagInput}
                  onChange={setGreenTagInput}
                />
              )}

              <div className="flex gap-2 justify-end pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingDamage(false)}
                  disabled={savingDamage}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50"
                >
                  <X className="w-3 h-3" /> Batal
                </button>
                <button
                  type="button"
                  onClick={saveDamage}
                  disabled={savingDamage}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs text-white rounded-lg disabled:opacity-50 ${tagTypeInput === "Good" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"}`}
                >
                  <Check className="w-3 h-3" /> {savingDamage ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {job.equipmentTagType === "Good" ? (
                <p className="text-sm text-emerald-900 line-clamp-2">
                  <span className="font-semibold block text-xs mb-1">Peralatan Bagus (Tag Hijau)</span>
                  {job.repairDataDescription || "-"}
                </p>
              ) : (
                <p className="text-sm text-gray-700 line-clamp-2">
                  <span className="font-semibold block text-xs mb-1 text-amber-900">Peralatan Rusak (Tag Kuning)</span>
                  {job.damageDescription}
                </p>
              )}
            </div>
          )}
        </div>
      )}

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
                disabled={patchingStatus}
                className={`${statusActionButtonClass(s, job.status)} disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5`}
                onClick={() => onPatchStatus(s)}
              >
                {patchingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {statusActionLabel(job.status, s)}
              </button>
            ))}
          </div>
          {job.status === "Received" && (
            <p className="text-xs text-gray-500">
              Status &quot;Tunggu material&quot; akan masuk antrian persetujuan supervisor.
            </p>
          )}
          {job.status === "Monitoring" && (
            <p className="text-xs text-gray-500">
              Selesaikan monitoring terlebih dahulu untuk melanjutkan ke tahap berikutnya.
            </p>
          )}

          {/* Tombol status custom — tampil saat InProgress atau dari status custom */}
          {customStatuses.length > 0 &&
            ["InProgress", "Received"].includes(job.status) && (
            <div className="pt-1 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1.5">Status tambahan:</p>
              <div className="flex flex-wrap gap-2">
                {customStatuses
                  .filter((cs) => cs.id !== job.customStatusId)
                  .map((cs) => (
                    <button
                      key={cs.id}
                      type="button"
                      disabled={patchingStatus}
                      onClick={() => onPatchStatus("InProgress", cs.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium text-white border-0 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5 ${cs.color}`}
                    >
                      {patchingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {cs.label}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Jika sedang di status custom, tampilkan tombol untuk kembali ke InProgress */}
          {job.customStatusId && (
            <div className="pt-1 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1.5">
                Status saat ini: <strong>{job.customStatusLabel}</strong>
              </p>
              <button
                type="button"
                disabled={patchingStatus}
                onClick={() => onPatchStatus("InProgress", null)}
                className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60 flex items-center gap-1.5"
              >
                {patchingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Kembali ke Progress
              </button>
            </div>
          )}
        </div>
      )}

      {canSupervise && job.status === "WaitingMaterialApproval" && !job.isDeleted && (
        <div className="p-3 border border-amber-200 bg-amber-50 rounded-lg space-y-2">
          <p className="font-medium text-amber-900">Persetujuan material (supervisor)</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={patchingStatus}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm disabled:opacity-60 flex items-center gap-1.5"
              onClick={() => onApproveMaterial("InProgress")}
            >
              {patchingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Setujui → Progress
            </button>
            <button
              type="button"
              disabled={patchingStatus}
              className="px-4 py-2 border border-amber-600 text-amber-800 rounded-lg text-sm hover:bg-amber-100 disabled:opacity-60 flex items-center gap-1.5"
              onClick={() => onApproveMaterial("Monitoring")}
            >
              {patchingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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

      {/* Supervisor: rollback dari RepairCompleted jika teknisi salah tekan */}
      {canSupervise && job.status === "RepairCompleted" && !job.isDeleted && (
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
          <p className="text-xs font-semibold text-slate-600">Koreksi status (supervisor)</p>
          <p className="text-xs text-slate-500">Job sudah ditandai Selesai. Jika salah, kembalikan ke Progress:</p>
          <button
            type="button"
            disabled={patchingStatus}
            onClick={() => onPatchStatus("InProgress", null)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-100 text-red-700 border border-red-300 rounded-lg hover:bg-red-200 disabled:opacity-60"
          >
            {patchingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Batalkan Selesai → Progress
          </button>
        </div>
      )}

      {/* Manajemen status custom — hanya supervisor */}
      {canSupervise && (
        <div className="border border-violet-100 rounded-lg p-3 bg-violet-50/40">
          <RepairJobCustomStatusManager />
        </div>
      )}

      {job.handovers && job.handovers.length > 0 && (
        <HandoverTimeline
          handovers={job.handovers.map((h) => ({
            id: h.id,
            handoverNumber: h.handoverNumber,
            handoverType: h.handoverType,
            handoverAt: h.handoverAt,
            signedAt: h.signedAt,
            equipmentTagType: h.equipmentTagType,
            handedOverByName: h.handedOverByName,
            receivedByName: h.receivedByName,
            status: h.status,
          }))}
        />
      )}

      <div>
        <h3 className="font-semibold mb-2">Timeline status</h3>
        <ul className="space-y-1.5 text-xs text-gray-600">
          {(job.statusLogs ?? []).map((l) => {
            const isEdit = l.note?.startsWith("[Edit oleh teknisi]");
            const isSameStatus = l.fromStatus === l.toStatus;
            const formatStatus = (s?: string | null) => {
              if (!s) return "—";
              return STATUS_CONFIG[s]?.label ?? s.replace(/([A-Z])/g, ' $1').trim();
            };
            return (
              <li
                key={l.id}
                className={`flex gap-2 p-2 rounded-lg ${
                  isEdit
                    ? "bg-amber-50 border border-amber-100"
                    : "bg-gray-50 border border-gray-100"
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {isEdit ? (
                    <Pencil className="w-3 h-3 text-amber-500" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-violet-400 mt-0.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-medium text-gray-800">{l.userName}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">
                      {format(new Date(l.at), "dd MMM yyyy HH:mm", { locale: localeId })}
                    </span>
                  </div>
                  {isEdit ? (
                    <p className="text-amber-700 mt-0.5 break-words">
                      {l.note?.replace("[Edit oleh teknisi] ", "")}
                    </p>
                  ) : (
                    <p className="mt-0.5">
                      {isSameStatus ? (
                        <span className="text-gray-500">Status tetap: <strong>{formatStatus(l.toStatus)}</strong></span>
                      ) : (
                        <>
                          <span className="text-gray-500">{formatStatus(l.fromStatus)}</span>
                          {" → "}
                          <strong className="text-violet-700">{formatStatus(l.toStatus)}</strong>
                        </>
                      )}
                      {l.note && !isEdit && (
                        <span className="text-gray-400 ml-2">— {l.note}</span>
                      )}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
          {(job.statusLogs ?? []).length === 0 && (
            <li className="text-gray-400 italic">Belum ada riwayat</li>
          )}
        </ul>
      </div>

    </div>
  );
}


