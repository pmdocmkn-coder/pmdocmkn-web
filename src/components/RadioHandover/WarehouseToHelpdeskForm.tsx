import { useEffect, useState } from "react";
import SignaturePadField from "../common/SignaturePadField";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import type { HandoverAccessoryItem, UserOption } from "../../types/radioHandover";
import type { RadioRepairJobList } from "../../types/radioRepair";
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
    <div className="flex flex-col max-h-[94vh]">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-4 py-2 -mx-4 px-4 sm:-mx-6 sm:px-6 custom-scrollbar">
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
                accessories: [],
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
              }}
            />
          )}
        </div>

        {/* Helpdesk Receiver Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">Penerima Helpdesk *</label>
          <Select value={hdId} onValueChange={setHdId}>
            <SelectTrigger className="w-full h-11 border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
              <SelectValue placeholder="Pilih staff helpdesk" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {(receivers ?? []).map((r) => (
                <SelectItem key={r.userId} value={r.userId.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">{r.fullName}</span>
                    <span className="text-xs text-gray-500">@{r.username}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Photos */}
        <MultiPhotoUpload photos={photos} onChange={setPhotos} required label="Foto Radio" />
        
        {/* Accessories */}
        <HandoverAccessoryList items={accessories} onChange={setAccessories} />
        
        {/* Signatures */}
        <SignaturePadField 
          label="TTD Warehouse (penyerah)" 
          required 
          value={sigWh} 
          onChange={setSigWh} 
        />
        <SignaturePadField 
          label="TTD Helpdesk (penerima)" 
          required 
          value={sigHd} 
          onChange={setSigHd} 
        />
        
        {/* Remarks */}
        <div className="space-y-2 pb-4">
          <label className="text-sm font-medium text-gray-900">Catatan</label>
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
          onClick={onCancel}
        >
          Batal
        </button>
        <button
          type="button"
          className="px-4 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-700 transition-colors min-w-[140px]"
          disabled={submitting}
          onClick={submit}
        >
          {submitting ? "Menyimpan..." : "Serah ke Helpdesk"}
        </button>
      </div>
    </div>
  );
}
