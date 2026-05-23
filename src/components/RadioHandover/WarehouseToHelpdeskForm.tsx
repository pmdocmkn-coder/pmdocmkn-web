import { useEffect, useState } from "react";
import SignaturePadField from "../common/SignaturePadField";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import type { HandoverAccessoryItem, UserOption } from "../../types/radioHandover";
import type { RadioRepairJobList } from "../../types/radioRepair";
import { EMPTY_GREEN_TAG } from "../../types/equipmentTag";
import type { GreenTagFields } from "../../types/equipmentTag";
import { useToast } from "../../hooks/use-toast";
import HandoverAccessoryList from "./HandoverAccessoryList";
import MultiPhotoUpload from "./MultiPhotoUpload";
import GreenTagFieldsForm from "./GreenTagFieldsForm";
import GoodEquipmentTagCard from "./GoodEquipmentTagCard";

type Props = {
  job: RadioRepairJobList;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function WarehouseToHelpdeskForm({ job, onSuccess, onCancel }: Props) {
  const { toast } = useToast();
  const [receivers, setReceivers] = useState<UserOption[]>([]);
  const [hdId, setHdId] = useState("");
  const [accessories, setAccessories] = useState<HandoverAccessoryItem[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [remarks, setRemarks] = useState("");
  const [greenFields, setGreenFields] = useState<GreenTagFields>({
    ...EMPTY_GREEN_TAG,
    repairDataDescription: job.damageDescription || "",
  });
  const [sigWh, setSigWh] = useState<string | null>(null);
  const [sigHd, setSigHd] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    radioHandoverApi
      .getHelpdeskReceivers()
      .then((list) => setReceivers(list ?? []))
      .catch(() => setReceivers([]));
  }, []);

  const submit = async () => {
    const acc = accessories.filter((a) => a.itemName.trim());
    if (!hdId || photos.length === 0 || !sigWh || !sigHd) {
      toast({ title: "Lengkapi penerima helpdesk, foto, dan kedua TTD", variant: "destructive" });
      return;
    }
    if (!greenFields.repairDataDescription?.trim()) {
      toast({ title: "Data perbaikan wajib untuk tag hijau", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await radioHandoverApi.create({
        handoverType: "WarehouseToHelpdesk",
        equipmentTagType: "Good",
        radioRepairJobId: job.id,
        radioId: job.radioId ?? undefined,
        radioSerialNumber: job.radioSerialNumber,
        equipmentName: job.equipmentName ?? undefined,
        receivedByUserId: Number(hdId),
        radioPhotos: photos,
        handedOverSignatureBase64: sigWh,
        receiverSignatureBase64: sigHd,
        accessories: acc,
        remarks: remarks || undefined,
        originFrom: greenFields.originFrom?.trim() || job.radioOwnerLabel || undefined,
        repairDataDescription: greenFields.repairDataDescription?.trim(),
        repairedByName: greenFields.repairedByName?.trim() || job.assignedTechnicianName,
        frequencyError: greenFields.frequencyError?.trim() || undefined,
        afReading: greenFields.afReading?.trim() || undefined,
        powerReading: greenFields.powerReading?.trim() || undefined,
        voltageOutNoLoad: greenFields.voltageOutNoLoad?.trim() || undefined,
        voltageOutWithLoad: greenFields.voltageOutWithLoad?.trim() || undefined,
        physicalCondition: greenFields.physicalCondition?.trim() || undefined,
        displayCondition: greenFields.displayCondition?.trim() || undefined,
      });
      toast({ title: "Serah terima ke Helpdesk (tag hijau) berhasil" });
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
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-900">
        <strong>Tag hijau — peralatan baik.</strong> Radio selesai diperbaiki dan dikembalikan ke Helpdesk.
      </div>
      <p className="text-sm text-gray-600">
        Tiket <strong>{job.helpdeskTicketNumber}</strong> — SN {job.radioSerialNumber}
      </p>
      <GreenTagFieldsForm value={greenFields} onChange={setGreenFields} />
      <GoodEquipmentTagCard
        data={{
          handoverNumber: "STR-…",
          helpdeskTicketNumber: job.helpdeskTicketNumber,
          handoverAt: new Date().toISOString(),
          handedOverByName: "Warehouse",
          receivedByName: "Helpdesk",
          equipmentName: job.equipmentName,
          radioSerialNumber: job.radioSerialNumber,
          originFrom: greenFields.originFrom || job.radioOwnerLabel,
          repairDataDescription: greenFields.repairDataDescription,
          repairedByName: greenFields.repairedByName || job.assignedTechnicianName,
          handoverType: "WarehouseToHelpdesk",
        }}
      />
      <div>
        <label className="text-sm font-medium">Penerima Helpdesk *</label>
        <select className="w-full border rounded-lg px-3 py-2 mt-1" value={hdId} onChange={(e) => setHdId(e.target.value)}>
          <option value="">Pilih staff helpdesk</option>
          {(receivers ?? []).map((r) => (
            <option key={r.userId} value={r.userId}>
              {r.fullName} ({r.username})
            </option>
          ))}
        </select>
      </div>
      <MultiPhotoUpload photos={photos} onChange={setPhotos} required />
      <HandoverAccessoryList items={accessories} onChange={setAccessories} />
      <SignaturePadField label="TTD Warehouse (penyerah)" required value={sigWh} onChange={setSigWh} />
      <SignaturePadField label="TTD Helpdesk (penerima)" required value={sigHd} onChange={setSigHd} />
      <div>
        <label className="text-sm font-medium">Catatan</label>
        <input className="w-full border rounded-lg px-3 py-2 mt-1" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button type="button" className="px-4 py-2 border rounded-lg" onClick={onCancel}>
          Batal
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-violet-600 text-white rounded-lg disabled:opacity-50"
          disabled={submitting}
          onClick={submit}
        >
          {submitting ? "Menyimpan..." : "Serah ke Helpdesk"}
        </button>
      </div>
    </div>
  );
}
