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
  const [containsMainRadioUnit, setContainsMainRadioUnit] = useState(true);
  const [mainUnitDisabled, setMainUnitDisabled] = useState(false);
  const [mainUnitDisabledInfo, setMainUnitDisabledInfo] = useState("");
  const [selectedAccessories, setSelectedAccessories] = useState<boolean[]>([]);
  const [disabledAccessories, setDisabledAccessories] = useState<boolean[]>([]);
  const [disabledAccessoriesInfo, setDisabledAccessoriesInfo] = useState<string[]>([]);
  const [availableAccessories, setAvailableAccessories] = useState<HandoverAccessoryItem[]>([]);

  useEffect(() => {
    radioHandoverApi
      .getHelpdeskReceivers()
      .then((list) => setReceivers(list ?? []))
      .catch(() => setReceivers([]));

    radioRepairApi
      .getById(job.id)
      .then((res) => {
        setJobDetail(res);
        if (res?.handovers && res?.primaryHandover?.accessories) {
          // 1. Apa saja yang benar-benar masuk ke Warehouse?
          const incomingToWhStr = new Set<string>();
          res.handovers.filter(h => h.handoverType === "TechnicianToWarehouse" || h.handoverType === "HelpdeskToWarehouse")
            .forEach(h => {
              h.accessories?.forEach((accStr: any) => {
                incomingToWhStr.add(accStr as string);
              });
            });
          
          const whReceivedList = res.primaryHandover.accessories.filter(a => {
             const accStr = `${a.quantity} ${a.unit || 'EA'} ${a.itemName}`;
             return incomingToWhStr.has(accStr);
          }).map(a => ({
             itemName: a.itemName,
             quantity: a.quantity,
             unit: a.unit ?? undefined,
             description: a.description ?? undefined,
             serialNumber: a.serialNumber ?? undefined
          }));
          setAvailableAccessories(whReceivedList);

          // 2. Apa saja yang sudah diserahkan keluar dari Warehouse?
          const alreadyHandedOver = new Map<string, string>();
          res.handovers.filter(h => h.handoverType === "WarehouseToHelpdesk")
            .forEach(h => {
              h.accessories?.forEach((accStr: any) => {
                alreadyHandedOver.set(accStr as string, h.receivedByName);
              });
            });

          const disabled = whReceivedList.map(a => {
            const accStr = `${a.quantity} ${a.unit || 'EA'} ${a.itemName}`;
            return alreadyHandedOver.has(accStr);
          });
          const disabledInfo = whReceivedList.map(a => {
            const accStr = `${a.quantity} ${a.unit || 'EA'} ${a.itemName}`;
            return alreadyHandedOver.get(accStr) || "";
          });
          
          setDisabledAccessories(disabled);
          setDisabledAccessoriesInfo(disabledInfo);
          // By default select all items that have not been handed over yet
          setSelectedAccessories(disabled.map(d => !d));

          // Check main unit
          const mainUnitHandover = res.handovers?.find(h => h.handoverType === "WarehouseToHelpdesk" && h.containsMainRadioUnit);
          if (mainUnitHandover) {
            setMainUnitDisabled(true);
            setContainsMainRadioUnit(false);
            setMainUnitDisabledInfo(mainUnitHandover.receivedByName);
          }
        }
      })
      .catch(console.error);
  }, [job.id]);

  const submit = async () => {
    if (!hdId || photos.length === 0 || !sigWh) {
      toast({ title: "Lengkapi penerima helpdesk, foto, dan TTD penyerah", variant: "destructive" });
      return;
    }

    const accPayload = availableAccessories
      .filter((_, i) => selectedAccessories[i])
      .map(a => ({
        itemName: a.itemName,
        quantity: a.quantity,
        unit: a.unit || undefined,
        description: a.description || undefined,
        serialNumber: a.serialNumber || undefined,
      })) || [];

    if (!containsMainRadioUnit && accPayload.length === 0) {
      toast({ title: "Pilih minimal 1 barang untuk diserahkan (Radio atau Aksesoris)", variant: "destructive" });
      return;
    }

    const isPartial = !containsMainRadioUnit || selectedAccessories.includes(false);

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
        accessories: accPayload,
        remarks: remarks || undefined,
        picReceiverName: picReceiverName || undefined,
        isPartial,
        containsMainRadioUnit,
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
              accessories: availableAccessories
                .filter((_, i) => selectedAccessories[i])
                .map(a => ({
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
              accessories: availableAccessories
                .filter((_, i) => selectedAccessories[i])
                .map(a => ({
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

      {/* Items to Handover Checklist */}
      <div className="space-y-3 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
        <p className="text-sm font-semibold text-gray-900">Pilih Barang yang Diserahkan</p>
        <div className="space-y-3">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={containsMainRadioUnit} 
              disabled={mainUnitDisabled}
              onChange={(e) => setContainsMainRadioUnit(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2B6CB0] focus:ring-[#2B6CB0] disabled:opacity-50"
            />
            <div className={mainUnitDisabled ? "opacity-50" : ""}>
              <p className="text-sm font-medium text-gray-900 flex items-center">
                Unit Radio Utama
                {mainUnitDisabled && <span className="ml-2 text-xs text-amber-600 font-medium italic">(Sudah diserahkan ke {mainUnitDisabledInfo})</span>}
              </p>
              <p className="text-xs text-gray-500">{job.equipmentName || 'Radio'} - SN: {job.radioSerialNumber}</p>
            </div>
          </label>
          
          {(availableAccessories.length ?? 0) > 0 && (
            <div className="pl-7 space-y-2 border-l-2 border-gray-100 ml-1.5 mt-2 pt-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Aksesoris / Kelengkapan</p>
              {availableAccessories.map((a, i) => (
                <label key={i} className="flex items-start space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedAccessories[i] ?? false}
                    disabled={disabledAccessories[i]}
                    onChange={(e) => {
                      const next = [...selectedAccessories];
                      next[i] = e.target.checked;
                      setSelectedAccessories(next);
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2B6CB0] focus:ring-[#2B6CB0] disabled:opacity-50"
                  />
                  <div className={`text-sm text-gray-700 ${disabledAccessories[i] ? 'opacity-50' : ''}`}>
                    <span className="font-medium">{a.itemName}</span> ({a.quantity} {a.unit || 'EA'})
                    {a.serialNumber ? <span className="text-gray-500 ml-1">SN: {a.serialNumber}</span> : null}
                    {disabledAccessories[i] && <span className="ml-2 text-xs text-amber-600 font-medium italic">(Sudah diserahkan ke {disabledAccessoriesInfo[i]})</span>}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        {(!containsMainRadioUnit || selectedAccessories.includes(false)) && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-xs text-amber-800 font-medium flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Serah terima parsial. Status tiket / Job ERP tidak akan ditutup sampai unit radio diserahkan.
            </p>
          </div>
        )}
      </div>

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
