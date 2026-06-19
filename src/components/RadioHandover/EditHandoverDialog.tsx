import { useEffect, useRef, useState } from "react";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import { workshopTechnicianApi, type WorkshopTechnicianDto } from "../../services/workshopTechnicianApi";
import type { HandoverAccessoryItem, RadioHandoverDetail, UserOption, RadioLookup } from "../../types/radioHandover";
import type { EquipmentTagType, GreenTagFields } from "../../types/equipmentTag";
import { EMPTY_GREEN_TAG } from "../../types/equipmentTag";
import { useToast } from "../../hooks/use-toast";
import { isValidSignature } from "../../utils/signatureUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import HandoverAccessoryList from "./HandoverAccessoryList";
import MultiPhotoUpload from "./MultiPhotoUpload";
import SignaturePadField, { type SignaturePadHandle } from "../common/SignaturePadField";
import GreenTagFieldsForm from "./GreenTagFieldsForm";
import RadioSerialLookupField from "./RadioSerialLookupField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

type Props = {
  detail: RadioHandoverDetail;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditHandoverDialog({ detail, onClose, onSuccess }: Props) {
  const { toast } = useToast();
  const [tagType, setTagType] = useState<EquipmentTagType>((detail.equipmentTagType as EquipmentTagType) || "Damaged");
  const [technicians, setTechnicians] = useState<UserOption[]>([]);
  const [workshopTechnicians, setWorkshopTechnicians] = useState<WorkshopTechnicianDto[]>([]);
  const [ticket, setTicket] = useState(detail.helpdeskTicketNumber || "");
  const [serial, setSerial] = useState(detail.radioSerialNumber || "");
  const [radioId, setRadioId] = useState<number | null>(detail.radioId ?? null);
  const [equipmentName, setEquipmentName] = useState(detail.equipmentName || "");
  const [damage, setDamage] = useState(detail.damageDescription || "");
  const [greenFields, setGreenFields] = useState<GreenTagFields>({
    originFrom: detail.originFrom || "",
    repairDataDescription: detail.repairDataDescription || "",
    repairedByName: detail.repairedByName || "",
    frequencyError: detail.frequencyError || "",
    afReading: detail.afReading || "",
    powerReading: detail.powerReading || "",
    voltageOutNoLoad: detail.voltageOutNoLoad || "",
    voltageOutWithLoad: detail.voltageOutWithLoad || "",
    physicalCondition: detail.physicalCondition || "",
    displayCondition: detail.displayCondition || "",
  });
  const [techId, setTechId] = useState(detail.receivedByUserId?.toString() || "");
  const [workshopTechId, setWorkshopTechId] = useState(detail.workshopTechnicianId?.toString() || "");
  const [lookup, setLookup] = useState<RadioLookup | null>(detail.radioId ? {
    id: detail.radioId,
    radioId: detail.radioMasterRadioId || undefined,
    category: "Radio",
    serialNumber: detail.radioSerialNumber,
    type: detail.equipmentName || undefined,
    division: detail.ownerDivision || undefined,
    department: detail.ownerDepartment || undefined,
    fleet: detail.radioFleet || undefined,
    ownerLabel: detail.radioOwnerLabel || undefined,
    label: detail.radioSerialNumber
  } : null);
  const [accessories, setAccessories] = useState<HandoverAccessoryItem[]>(detail.accessories || []);
  const [remarks, setRemarks] = useState(detail.remarks || "");
  const [photos, setPhotos] = useState<string[]>(
    detail.radioPhotos?.length ? detail.radioPhotos : detail.radioPhotoBase64 ? [detail.radioPhotoBase64] : []
  );
  const [sigReceiver, setSigReceiver] = useState<string | null>(detail.receiverSignatureBase64 || null);
  const [submitting, setSubmitting] = useState(false);
  const sigTekRef = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    radioHandoverApi.getTechnicians().then(setTechnicians).catch(() => setTechnicians([]));
    workshopTechnicianApi.getAllActive().then((res) => setWorkshopTechnicians(res.data.data)).catch(() => setWorkshopTechnicians([]));
  }, []);

  const validate = (): string[] => {
    const missing: string[] = [];
    if (!ticket.trim()) missing.push("No tiket helpdesk");
    if (!serial.trim()) missing.push("Serial Number");
    if (tagType === "Damaged" && !damage.trim()) missing.push("Keterangan kerusakan");
    if (tagType === "Good" && !greenFields.repairDataDescription?.trim()) missing.push("Data perbaikan (Tag Hijau)");
    if (!techId) missing.push("Akun Sistem Penerima");
    if (!workshopTechId) missing.push("Teknisi Penerima");
    if (photos.length === 0) missing.push("Foto radio");
    return missing;
  };

  const submit = async () => {
    const missing = validate();
    if (missing.length) {
      toast({ title: "Belum lengkap", description: missing.join(" • "), variant: "destructive" });
      return;
    }

    const tekSig = (await sigTekRef.current?.exportNow()) ?? sigReceiver;
    const receiverOk = isValidSignature(tekSig);

    const payload = {
      helpdeskTicketNumber: ticket.trim(),
      radioId: radioId ?? undefined,
      radioSerialNumber: serial.trim(),
      equipmentName: equipmentName.trim() || undefined,
      equipmentTagType: tagType,
      damageDescription: tagType === "Damaged" ? damage.trim() : damage.trim() || undefined,
      originFrom: greenFields.originFrom?.trim() || undefined,
      repairDataDescription: greenFields.repairDataDescription?.trim() || undefined,
      repairedByName: greenFields.repairedByName?.trim() || undefined,
      frequencyError: greenFields.frequencyError?.trim() || undefined,
      afReading: greenFields.afReading?.trim() || undefined,
      powerReading: greenFields.powerReading?.trim() || undefined,
      voltageOutNoLoad: greenFields.voltageOutNoLoad?.trim() || undefined,
      voltageOutWithLoad: greenFields.voltageOutWithLoad?.trim() || undefined,
      physicalCondition: greenFields.physicalCondition?.trim() || undefined,
      displayCondition: greenFields.displayCondition?.trim() || undefined,
      receivedByUserId: Number(techId),
      workshopTechnicianId: Number(workshopTechId),
      radioPhotos: photos,
      receiverSignatureBase64: receiverOk ? tekSig! : undefined,
      accessories,
      remarks: remarks.trim() || undefined,
    };

    setSubmitting(true);
    try {
      await radioHandoverApi.update(detail.id, payload);
      toast({ title: "Serah terima berhasil diperbarui" });
      onSuccess();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast({
        title: "Gagal menyimpan",
        description: ax.response?.data?.message ?? (err instanceof Error ? err.message : "Error tidak diketahui"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Serah Terima: {detail.handoverNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tiket & Serial - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Tiket Helpdesk *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
                placeholder="#MKN/1234/5678"
              />
            </div>
            <div>
              <RadioSerialLookupField
                serial={serial}
                radioId={radioId}
                lookup={lookup}
                label="Serial Number"
                required
                onSelect={(s, id, l) => {
                  setSerial(s);
                  setRadioId(id);
                  setLookup(l ?? null);
                  if (l?.type && !equipmentName.trim()) {
                    setEquipmentName(l.type);
                  }
                }}
              />
            </div>
          </div>

          {/* Equipment Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Nama/Tipe Peralatan</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
              value={equipmentName}
              onChange={(e) => setEquipmentName(e.target.value)}
              placeholder="Motorola DP4800, TP8100, ..."
            />
          </div>

          {/* Tag Type Selection - Mobile Optimized */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Jenis Tag</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTagType("Damaged")}
                className={`p-3 rounded-xl border-2 text-left transition-all ${tagType === "Damaged"
                  ? "border-amber-500 bg-amber-50 shadow-sm ring-2 ring-amber-200"
                  : "border-gray-200 bg-white hover:border-amber-300"
                  }`}
              >
                <p className="font-bold text-sm text-amber-900">Tag kuning (Rusak)</p>
                <p className="text-xs text-amber-700 mt-0.5">Peralatan masuk perbaikan</p>
              </button>
              <button
                type="button"
                onClick={() => setTagType("Good")}
                className={`p-3 rounded-xl border-2 text-left transition-all ${tagType === "Good"
                  ? "border-emerald-500 bg-emerald-50 shadow-sm ring-2 ring-emerald-200"
                  : "border-gray-200 bg-white hover:border-emerald-300"
                  }`}
              >
                <p className="font-bold text-sm text-emerald-900">Tag hijau (Baik)</p>
                <p className="text-xs text-emerald-700 mt-0.5">Kondisi baik / inspeksi</p>
              </button>
            </div>
          </div>

          {/* Conditional Fields based on Tag Type */}
          {tagType === "Damaged" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Keterangan kerusakan *</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                rows={3}
                value={damage}
                onChange={(e) => setDamage(e.target.value)}
                placeholder="Contoh: tidak ada suara, LCD mati, ..."
              />
            </div>
          )}

          {tagType === "Good" && (
            <GreenTagFieldsForm value={greenFields} onChange={setGreenFields} originPrefilled={detail.originFrom || ""} />
          )}

          {/* Technician Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Akun Sistem Penerima *</label>
              <Select value={techId} onValueChange={setTechId}>
                <SelectTrigger className="w-full h-11 border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white">
                  <SelectValue placeholder="Pilih akun sistem" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {technicians.map((t) => (
                    <SelectItem key={t.userId} value={t.userId.toString()}>
                      <span className="font-medium">{t.fullName}</span>{" "}
                      <span className="text-xs text-gray-500">(@{t.username})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Teknisi Penerima *</label>
              <Select value={workshopTechId} onValueChange={setWorkshopTechId}>
                <SelectTrigger className="w-full h-11 border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white">
                  <SelectValue placeholder="Pilih teknisi fisik" />
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
          </div>

          {/* Photos */}
          <MultiPhotoUpload photos={photos} onChange={setPhotos} required label="Foto Radio" />

          {/* Accessories */}
          <HandoverAccessoryList items={accessories} onChange={setAccessories} />

          {/* Signature */}
          {!detail.receiverSignatureBase64 && (
            <SignaturePadField
              ref={sigTekRef}
              label="TTD Penerima (opsional)"
              value={sigReceiver}
              onChange={setSigReceiver}
            />
          )}

          {/* Remarks */}
          <div className="space-y-2 pb-4">
            <label className="text-sm font-medium text-gray-900">Catatan / Remarks</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Catatan tambahan (opsional)"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-2 pt-4 border-t">
          <button
            type="button"
            className="px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors min-w-[90px]"
            onClick={onClose}
          >
            Batal
          </button>
          <button
            type="button"
            disabled={submitting}
            className="px-4 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-700 transition-colors min-w-[140px]"
            onClick={submit}
          >
            {submitting ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
