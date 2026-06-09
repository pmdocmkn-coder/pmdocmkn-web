import { useEffect, useRef, useState } from "react";
import SignaturePadField, { type SignaturePadHandle } from "../common/SignaturePadField";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import type { RadioRepairJobDetail } from "../../types/radioRepair";
import type { HandoverAccessoryItem, UserOption } from "../../types/radioHandover";
import { useToast } from "../../hooks/use-toast";
import HandoverAccessoryList from "./HandoverAccessoryList";
import HandoverAccessoryHistory from "./HandoverAccessoryHistory";
import MultiPhotoUpload from "./MultiPhotoUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { buildAccessoriesPayload, toHandoverAccessoryItems } from "../../utils/handoverFormUtils";
import { workshopTechnicianApi, WorkshopTechnicianDto } from "../../services/workshopTechnicianApi";

type Props = {
  job: RadioRepairJobDetail;
  onSuccess: () => void;
  onCancel: () => void;
};

function resolveHdHandoverId(job: RadioRepairJobDetail): number | undefined {
  if (job.primaryHandover?.id) return job.primaryHandover.id;
  return job.handovers?.find((h) => h.handoverType === "HelpdeskToTechnician")?.id;
}

export default function TechnicianToWarehouseForm({ job, onSuccess, onCancel }: Props) {
  const { toast } = useToast();
  const [receivers, setReceivers] = useState<UserOption[]>([]);
  const [whId, setWhId] = useState("");
  const [workshopTechId, setWorkshopTechId] = useState("");
  const [workshopTechnicians, setWorkshopTechnicians] = useState<WorkshopTechnicianDto[]>([]);
  const [inheritedAccessories, setInheritedAccessories] = useState<HandoverAccessoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [additionalAccessories, setAdditionalAccessories] = useState<HandoverAccessoryItem[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [sigTech, setSigTech] = useState<string | null>(null);
  const [sigWh, setSigWh] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const sigTechRef = useRef<SignaturePadHandle>(null);
  const sigWhRef = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    radioHandoverApi
      .getWarehouseReceivers()
      .then((list) => setReceivers(list ?? []))
      .catch(() => setReceivers([]));
    workshopTechnicianApi.getAllActive().then(res => setWorkshopTechnicians(res.data.data)).catch(() => setWorkshopTechnicians([]));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const phAcc = job.primaryHandover?.accessories;
        if (phAcc && phAcc.length > 0) {
          if (!cancelled) setInheritedAccessories(toHandoverAccessoryItems(phAcc));
          return;
        }

        const hdId = resolveHdHandoverId(job);
        if (!hdId) {
          if (!cancelled) setInheritedAccessories([]);
          return;
        }

        const detail = await radioHandoverApi.getById(hdId);
        if (!cancelled) {
          setInheritedAccessories(toHandoverAccessoryItems(detail.accessories ?? []));
        }
      } catch {
        if (!cancelled) setInheritedAccessories([]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [job]);

  const submit = async () => {
    // Export TTD dari canvas terlebih dahulu sebelum validasi
    const techSig = (await sigTechRef.current?.exportNow()) ?? sigTech;
    const whSig = (await sigWhRef.current?.exportNow()) ?? sigWh;

    if (!whId || !workshopTechId || photos.length === 0 || !techSig || !whSig) {
      toast({ title: "Lengkapi data teknisi, foto, TTD", variant: "destructive" });
      return;
    }

    const merged = [...inheritedAccessories, ...additionalAccessories.filter((a) => a.itemName.trim())];
    const { accessories: acc, batterySerialNumber } = buildAccessoriesPayload(merged);

    setSubmitting(true);
    try {
      await radioHandoverApi.create({
        handoverType: "TechnicianToWarehouse",
        radioRepairJobId: job.id,
        radioId: job.radioId ?? undefined,
        radioSerialNumber: job.radioSerialNumber,
        batterySerialNumber: batterySerialNumber ?? job.batterySerialNumber ?? undefined,
        receivedByUserId: Number(whId),
        handedOverByWorkshopTechnicianId: Number(workshopTechId),
        radioPhotos: photos,
        handedOverSignatureBase64: techSig,
        receiverSignatureBase64: whSig,
        accessories: acc,
      });
      toast({ title: "Serah terima ke warehouse berhasil" });
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
      <p className="text-sm text-gray-600">
        Tiket <strong>{job.helpdeskTicketNumber}</strong> — SN {job.radioSerialNumber}
      </p>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Teknisi Workshop Penyerah (Fisik) *</label>
        <Select value={workshopTechId} onValueChange={setWorkshopTechId}>
          <SelectTrigger className="w-full h-11 border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
            <SelectValue placeholder="Pilih teknisi" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {workshopTechnicians.map((t) => (
              <SelectItem key={t.id} value={t.id.toString()}>
                <span className="font-medium">{t.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Akun Sistem Penerima (Warehouse) *</label>
        <Select value={whId} onValueChange={setWhId}>
          <SelectTrigger className="w-full h-11 border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
            <SelectValue placeholder="Pilih staff warehouse" />
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

      <MultiPhotoUpload photos={photos} onChange={setPhotos} required />

      <HandoverAccessoryHistory items={inheritedAccessories} loading={historyLoading} />

      <HandoverAccessoryList
        items={additionalAccessories}
        onChange={setAdditionalAccessories}
        optional
        label="Tambahan aksesoris"
      />

      <SignaturePadField ref={sigTechRef} label="TTD Penyerah" required value={sigTech} onChange={setSigTech} />
      <SignaturePadField ref={sigWhRef} label="TTD Penerima" required value={sigWh} onChange={setSigWh} />

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
          {submitting ? "Menyimpan..." : "Serah Terima"}
        </button>
      </div>
    </div>
  );
}
