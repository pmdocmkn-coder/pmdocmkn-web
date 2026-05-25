import { useEffect, useRef, useState } from "react";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import type { HandoverAccessoryItem, RadioHandoverDetail, UserOption } from "../../types/radioHandover";
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

type Props = {
  detail: RadioHandoverDetail;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditHandoverDialog({ detail, onClose, onSuccess }: Props) {
  const { toast } = useToast();
  const [tagType, setTagType] = useState<EquipmentTagType>((detail.equipmentTagType as EquipmentTagType) || "Damaged");
  const [technicians, setTechnicians] = useState<UserOption[]>([]);
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
  }, []);

  const validate = (): string[] => {
    const missing: string[] = [];
    if (!ticket.trim()) missing.push("No tiket helpdesk");
    if (!serial.trim()) missing.push("Serial Number");
    if (tagType === "Damaged" && !damage.trim()) missing.push("Keterangan kerusakan");
    if (tagType === "Good" && !greenFields.repairDataDescription?.trim()) missing.push("Data perbaikan (Tag Hijau)");
    if (!techId) missing.push("Teknisi penerima");
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
      <DialogContent className="max-w-2xl flex flex-col max-h-[94vh]">
        <DialogHeader>
          <DialogTitle>Edit Serah Terima: {detail.handoverNumber}</DialogTitle>
        </DialogHeader>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
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
                label="Serial Number"
                required
                onSelect={(s, id, lookup) => {
                  setSerial(s);
                  setRadioId(id);
                  if (lookup?.type && !equipmentName.trim()) {
                    setEquipmentName(lookup.type);
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
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  tagType === "Damaged" 
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
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  tagType === "Good" 
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
          <div className="space-y-2 pt-2 border-t">
            <label className="text-sm font-medium text-gray-900">Teknisi penerima *</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors bg-white" 
              value={techId} 
              onChange={(e) => setTechId(e.target.value)}
            >
              <option value="">Pilih teknisi</option>
              {technicians.map((t) => (
                <option key={t.userId} value={t.userId}>
                  {t.fullName} ({t.username})
                </option>
              ))}
            </select>
          </div>

          {/* Photos */}
          <MultiPhotoUpload photos={photos} onChange={setPhotos} required label="Foto Radio" />
          
          {/* Accessories */}
          <HandoverAccessoryList items={accessories} onChange={setAccessories} />
          
          {/* Signature */}
          <SignaturePadField 
            ref={sigTekRef} 
            label="TTD Teknisi (opsional - dapat diwakilkan)" 
            value={sigReceiver} 
            onChange={setSigReceiver} 
          />
          
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

        {/* Footer Buttons - Outside scrollable area */}
        <div className="flex justify-between gap-2 pt-4 border-t bg-white shrink-0 -mx-4 px-4 sm:-mx-6 sm:px-6 pb-4 sm:pb-0">
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
