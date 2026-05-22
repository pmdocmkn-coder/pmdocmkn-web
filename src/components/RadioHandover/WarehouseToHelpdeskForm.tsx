import { useEffect, useState } from "react";
import SignaturePadField from "../common/SignaturePadField";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import type { HandoverAccessoryItem, UserOption } from "../../types/radioHandover";
import type { RadioRepairJobList } from "../../types/radioRepair";
import { useToast } from "../../hooks/use-toast";
import HandoverAccessoryList from "./HandoverAccessoryList";
import MultiPhotoUpload from "./MultiPhotoUpload";

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
    setSubmitting(true);
    try {
      await radioHandoverApi.create({
        handoverType: "WarehouseToHelpdesk",
        radioRepairJobId: job.id,
        radioId: job.radioId ?? undefined,
        radioSerialNumber: job.radioSerialNumber,
        receivedByUserId: Number(hdId),
        radioPhotos: photos,
        handedOverSignatureBase64: sigWh,
        receiverSignatureBase64: sigHd,
        accessories: acc,
        remarks: remarks || undefined,
      });
      toast({ title: "Serah terima ke Helpdesk berhasil" });
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <p className="text-sm text-gray-600">
        Job <strong>{job.jobNumber}</strong> — SN {job.radioSerialNumber} — Tiket {job.helpdeskTicketNumber}
      </p>
      <div>
        <label className="text-sm font-medium">Penerima Helpdesk *</label>
        <select className="w-full border rounded-lg px-3 py-2 mt-1" value={hdId} onChange={(e) => setHdId(e.target.value)}>
          <option value="">Pilih staff helpdesk</option>
          {(receivers ?? []).map((r) => (
            <option key={r.userId} value={r.userId}>{r.fullName} ({r.username})</option>
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
        <button type="button" className="px-4 py-2 border rounded-lg" onClick={onCancel}>Batal</button>
        <button type="button" className="px-4 py-2 bg-violet-600 text-white rounded-lg disabled:opacity-50" disabled={submitting} onClick={submit}>
          {submitting ? "Menyimpan..." : "Serah ke Helpdesk"}
        </button>
      </div>
    </div>
  );
}
