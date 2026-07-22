import { useEffect, useState } from "react";
import SignaturePadField from "../common/SignaturePadField";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import { radioRepairApi } from "../../services/radioRepairApi";
import type { HandoverAccessoryItem, UserOption } from "../../types/radioHandover";
import type { RadioRepairJobList, RadioRepairJobDetail } from "../../types/radioRepair";
import { EMPTY_GREEN_TAG } from "../../types/equipmentTag";
import type { GreenTagFields } from "../../types/equipmentTag";
import { useToast } from "../../hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import HandoverAccessoryList from "./HandoverAccessoryList";
import MultiPhotoUpload from "./MultiPhotoUpload";
import GoodEquipmentTagCard from "./GoodEquipmentTagCard";
import DamagedEquipmentTagCard from "./DamagedEquipmentTagCard";

type Props = {
  job: RadioRepairJobList;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function WarehouseToHelpdeskForm({ job, onSuccess, onCancel }: Props) {
  const { toast } = useToast();
  const [receivers, setReceivers] = useState<UserOption[]>([]);
  const [hdId, setHdId] = useState("");
  const [jobDetail, setJobDetail] = useState<RadioRepairJobDetail | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [remarks, setRemarks] = useState("");
  const [picReceiverName, setPicReceiverName] = useState("");
  const [sigWh, setSigWh] = useState<string | null>(null);
  const [sigHd, setSigHd] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    radioHandoverApi
      .getHelpdeskReceivers()
      .then((list) => setReceivers(list ?? []))
      .catch(() => setReceivers([]));

    radioRepairApi
      .getById(job.id)
      .then(setJobDetail)
      .catch(console.error);
  }, [job.id]);

  const submit = async () => {
    if (!hdId || photos.length === 0 || !sigWh) {
      toast({ title: "Lengkapi penerima helpdesk, foto, dan TTD penyerah", variant: "destructive" });
      return;
    }

    const accPayload = jobDetail?.primaryHandover?.accessories?.map(a => ({
      itemName: a.itemName,
      quantity: a.quantity,
      unit: a.unit || undefined,
      description: a.description || undefined,
      serialNumber: a.serialNumber || undefined,
    })) || [];

    setSubmitting(true);
    try {
      await radioHandoverApi.create({
        handoverType: "WarehouseToHelpdesk",
        equipmentTagType: (job.equipmentTagType as "Good" | "Damaged" | undefined) || "Good", // Fallback to Good if null
        radioRepairJobId: job.id,
        radioId: job.radioId ?? undefined,
        radioSerialNumber: job.radioSerialNumber,
        equipmentName: job.equipmentName ?? undefined,
        receivedByUserId: Number(hdId),
        radioPhotos: photos,
        handedOverSignatureBase64: sigWh,
        receiverSignatureBase64: sigHd || undefined,
        accessories: accPayload, // Use the accessories from the previous handover
        remarks: remarks || undefined,
        picReceiverName: picReceiverName || undefined,
      });
      toast({ title: "Serah terima ke Helpdesk berhasil" });
      onSuccess();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast({
        title: "Gagal menyimpan",
        description: ax.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tag Preview Card */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-600">Pratinjau Tag Hijau</p>
        {job.equipmentTagType === "Damaged" ? (
          <DamagedEquipmentTagCard
            data={{
              handoverNumber: "STR-…",
              helpdeskTicketNumber: job.helpdeskTicketNumber,
              handoverAt: new Date().toISOString(),
              handedOverByName: "Warehouse",
              receivedByName: "Helpdesk",
              equipmentName: job.equipmentName,
              unitNumber: job.unitNumber,
              radioSerialNumber: job.radioSerialNumber,
              radioOwnerLabel: job.radioOwnerLabel,
              radioMasterId: job.radioId,
              radioMasterRadioId: job.radioMasterRadioId,
              radioFleet: job.radioFleet,
              radioCategory: job.radioCategory,
              damageDescription: job.damageDescription,
              handoverType: "WarehouseToHelpdesk",
              accessories: jobDetail?.primaryHandover?.accessories?.map(a => ({
                itemName: a.itemName,
                quantity: a.quantity,
                unit: a.unit ?? undefined,
                description: a.description ?? undefined,
                serialNumber: a.serialNumber ?? undefined,
              })) ?? [],
            }}
          />
        ) : (
          <GoodEquipmentTagCard
            data={{
              handoverNumber: "STR-…",
              helpdeskTicketNumber: job.helpdeskTicketNumber,
              handoverAt: new Date().toISOString(),
              handedOverByName: "Warehouse",
              receivedByName: "Helpdesk",
              equipmentName: job.equipmentName,
              unitNumber: job.unitNumber,
              radioSerialNumber: job.radioSerialNumber,
              radioOwnerLabel: job.radioOwnerLabel,
              radioMasterRadioId: job.radioMasterRadioId,
              radioFleet: job.radioFleet,
              originFrom: job.originFrom || job.radioOwnerLabel,
              repairDataDescription: job.repairDataDescription,
              repairedByName: job.repairedByName || job.assignedTechnicianName,
              frequencyError: job.frequencyError,
              afReading: job.afReading,
              powerReading: job.powerReading,
              voltageOutNoLoad: job.voltageOutNoLoad,
              voltageOutWithLoad: job.voltageOutWithLoad,
              physicalCondition: job.physicalCondition,
              displayCondition: job.displayCondition,
              handoverType: "WarehouseToHelpdesk",
              accessories: jobDetail?.primaryHandover?.accessories?.map(a => ({
                itemName: a.itemName,
                quantity: a.quantity,
                unit: a.unit ?? undefined,
                description: a.description ?? undefined,
                serialNumber: a.serialNumber ?? undefined,
              })) ?? [],
            }}
          />
        )}
      </div>

      {/* Helpdesk Receiver Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">Penerima Helpdesk *</label>
        <Select value={hdId} onValueChange={setHdId}>
          <SelectTrigger className="w-full h-11 border-gray-300 focus:ring-2 focus:ring-[#2B6CB0]/20 focus:border-[#2B6CB0]">
            <SelectValue placeholder="Pilih staff helpdesk" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {(receivers ?? []).map((r) => (
              <SelectItem key={r.userId} value={r.userId.toString()}>
                <span className="font-medium">{r.fullName}</span>{" "}
                <span className="text-xs text-gray-500">(@{r.username})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Photos */}
      <MultiPhotoUpload photos={photos} onChange={setPhotos} required label="Foto Radio" />

      {/* Accessories (Read Only) */}
      {(jobDetail?.primaryHandover?.accessories?.length ?? 0) > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-900 mb-2">Kelengkapan / Aksesoris</p>
          <table className="w-full text-xs border rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Barang</th>
                <th className="text-left px-3 py-2">Qty</th>
                <th className="text-left px-3 py-2">Unit</th>
                <th className="text-left px-3 py-2">SN</th>
              </tr>
            </thead>
            <tbody>
              {jobDetail!.primaryHandover!.accessories.map((a, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2 font-medium">{a.itemName}</td>
                  <td className="px-3 py-2">{a.quantity}</td>
                  <td className="px-3 py-2">{a.unit}</td>
                  <td className="px-3 py-2 text-gray-500">{a.serialNumber || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-gray-500 mt-1">Aksesoris diturunkan dari serah terima sebelumnya.</p>
        </div>
      )}

      {/* Signatures */}
      <SignaturePadField
        label="TTD Penyerah"
        required
        value={sigWh}
        onChange={setSigWh}
      />
      <SignaturePadField
        label="TTD Penerima (opsional)"
        required={false}
        value={sigHd}
        onChange={setSigHd}
      />

      {/* PIC Receiver */}
      <div className="space-y-2 pt-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-900">Nama PIC / Penerima Fisik</label>
          <button
            type="button"
            className="text-xs text-[#2B6CB0] hover:text-[#1B3A6B] font-medium bg-[#EBF4FF] hover:bg-[#EBF4FF]/80 px-2 py-1 rounded transition-colors"
            onClick={() => setPicReceiverName(job.radioOwnerLabel || "")}
          >
            Gunakan data Pemilik
          </button>
        </div>
        <input
          className="w-full border border-gray-300 rounded-[10px] px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#2B6CB0]/20 focus:border-[#2B6CB0] transition-colors"
          value={picReceiverName}
          onChange={(e) => setPicReceiverName(e.target.value)}
          placeholder="Nama pengambil radio (opsional)"
        />
      </div>

      {/* Remarks */}
      <div className="space-y-2 pb-4">
        <label className="text-sm font-medium text-gray-900">Catatan</label>
        <input
          className="w-full border border-gray-300 rounded-[10px] px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#2B6CB0]/20 focus:border-[#2B6CB0] transition-colors"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Catatan tambahan (opsional)"
        />
      </div>
      {/* Action Buttons */}
      <div className="flex justify-between gap-2 pt-4 border-t">
        <button
          type="button"
          className="px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors min-w-[90px]"
          onClick={onCancel}
        >
          Batal
        </button>
        <button
          type="button"
          className="px-4 py-2.5 bg-[#1B3A6B] text-white rounded-[10px] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2B6CB0] transition-colors min-w-[140px]"
          disabled={submitting}
          onClick={submit}
        >
          {submitting ? "Menyimpan..." : "Serah ke Helpdesk"}
        </button>
      </div>
    </div>
  );
}
