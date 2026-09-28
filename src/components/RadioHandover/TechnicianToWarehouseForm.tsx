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
import RadioScrapVerificationModal from "./RadioScrapVerificationModal";

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
  const [scrapModalOpen, setScrapModalOpen] = useState(false);
  const sigTechRef = useRef<SignaturePadHandle>(null);
  const sigWhRef = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    radioHandoverApi
      .getWarehouseReceivers()
      .then((list) => setReceivers(list ?? []))
      .catch(() => setReceivers([]));
    workshopTechnicianApi.getAllActive("Teknisi WKS").then(res => setWorkshopTechnicians(res.data.data)).catch(() => setWorkshopTechnicians([]));
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

  const selectedReceiver = receivers.find((r) => r.userId.toString() === whId);

  const executeSubmit = async ({
    receiverSig,
    additionalPhotos = [],
  }: {
    receiverSig?: string;
    additionalPhotos?: string[];
  }) => {
    const techSig = (await sigTechRef.current?.exportNow()) ?? sigTech;
    const allPhotos = [...additionalPhotos, ...photos];

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
        radioPhotos: allPhotos,
        handedOverSignatureBase64: techSig!,
        receiverSignatureBase64: receiverSig,
        accessories: acc,
        remarks: job.isScrap ? "[Verifikasi Surat Scrap Disertakan]" : undefined,
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

  const handleMainButtonClick = async () => {
    const techSig = (await sigTechRef.current?.exportNow()) ?? sigTech;

    if (!workshopTechId) {
      toast({ title: "Pilih teknisi workshop penyerah", variant: "destructive" });
      return;
    }
    if (!whId) {
      toast({ title: "Pilih akun sistem penerima Warehouse", variant: "destructive" });
      return;
    }
    if (photos.length === 0) {
      toast({ title: "Lampirkan minimal 1 foto radio", variant: "destructive" });
      return;
    }
    if (!techSig) {
      toast({ title: "Tanda tangan penyerah (teknisi) wajib diisi", variant: "destructive" });
      return;
    }

    if (job.isScrap) {
      // Untuk radio scrap, otomatis tampilkan popup verifikasi surat scrap & TTD warehouse
      setScrapModalOpen(true);
      return;
    }

    // Untuk radio normal (non-scrap)
    const whSig = (await sigWhRef.current?.exportNow()) ?? sigWh;
    await executeSubmit({ receiverSig: whSig || undefined });
  };

  const handleScrapModalConfirm = async (data: {
    isScrapLetterAttached: boolean;
    proofPhotoBase64: string;
    receiverSignatureBase64?: string;
  }) => {
    await executeSubmit({
      receiverSig: data.receiverSignatureBase64,
      additionalPhotos: [data.proofPhotoBase64],
    });
    setScrapModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {job.isScrap && (
        <div className="border border-red-200 bg-red-50 rounded-[10px] p-3 text-red-700 font-bold flex items-center justify-between">
          <span>RADIO SCRAP — Teknisi → Warehouse</span>
          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded font-normal">
            Verifikasi Surat Scrap di Langkah Akhir
          </span>
        </div>
      )}
      <p className="text-sm text-gray-600">
        Tiket <strong>{job.helpdeskTicketNumber}</strong> — SN {job.radioSerialNumber}
      </p>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Teknisi Workshop Penyerah (Fisik) *</label>
        <Select value={workshopTechId} onValueChange={setWorkshopTechId}>
          <SelectTrigger className="w-full h-11 border-gray-300 focus:ring-2 focus:ring-[#2B6CB0]/20 focus:border-[#2B6CB0]">
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
          <SelectTrigger className="w-full h-11 border-gray-300 focus:ring-2 focus:ring-[#2B6CB0]/20 focus:border-[#2B6CB0]">
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

      <SignaturePadField ref={sigTechRef} label="TTD Penyerah *" required value={sigTech} onChange={setSigTech} />

      {!job.isScrap && (
        <SignaturePadField
          ref={sigWhRef}
          label="TTD Penerima (opsional)"
          required={false}
          value={sigWh}
          onChange={setSigWh}
        />
      )}

      {/* Hanya SATU tombol aksi utama di bagian bawah */}
      <div className="flex gap-2 justify-end pt-2">
        <button type="button" className="px-4 py-2 border rounded-lg" onClick={onCancel}>
          Batal
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-[#1B3A6B] text-white rounded-[10px] disabled:opacity-50 hover:bg-[#2B6CB0] transition-colors font-semibold"
          disabled={submitting}
          onClick={handleMainButtonClick}
        >
          {submitting
            ? "Menyimpan..."
            : job.isScrap
            ? "Serah Terima Scrap ke WHS"
            : "Serah Terima"}
        </button>
      </div>

      <RadioScrapVerificationModal
        open={scrapModalOpen}
        onOpenChange={setScrapModalOpen}
        ticketNumber={job.helpdeskTicketNumber}
        serialNumber={job.radioSerialNumber}
        receiverName={selectedReceiver?.fullName}
        onConfirm={handleScrapModalConfirm}
        submitting={submitting}
      />
    </div>
  );
}
