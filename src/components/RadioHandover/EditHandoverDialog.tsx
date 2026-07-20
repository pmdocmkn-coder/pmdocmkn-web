import { useEffect, useRef, useState } from "react";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import { workshopTechnicianApi, type WorkshopTechnicianDto } from "../../services/workshopTechnicianApi";
import type { HandoverAccessoryItem, RadioHandoverDetail, UserOption, RadioLookup } from "../../types/radioHandover";
import type { EquipmentTagType, GreenTagFields } from "../../types/equipmentTag";
import { EMPTY_GREEN_TAG } from "../../types/equipmentTag";
import { useToast } from "../../hooks/use-toast";
import { isValidSignature } from "../../utils/signatureUtils";
import { ResponsiveModal } from "../common/ResponsiveModal";
import HandoverAccessoryList from "./HandoverAccessoryList";
import MultiPhotoUpload from "./MultiPhotoUpload";
import SignaturePadField, { type SignaturePadHandle } from "../common/SignaturePadField";
import GreenTagFieldsForm from "./GreenTagFieldsForm";
import RadioSerialLookupField from "./RadioSerialLookupField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useAuth } from "../../contexts/AuthContext";

type Props = {
  detail: RadioHandoverDetail;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditHandoverDialog({ detail, onClose, onSuccess }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isWorkshopTech = user?.roleName === "Teknisi WKS";
  const isWarehouse = user?.roleName?.toLowerCase() === "warehouse";
  const isTechToWh = detail.handoverType === "TechnicianToWarehouse";
  const isWhToHd = detail.handoverType === "WarehouseToHelpdesk";

  // Teknisi WSK tidak boleh ubah field inti (tiket, SN, tag type, penerima)
  // tapi boleh edit data perbaikan (green/yellow tag fields) dan foto
  const lockCoreFields = isWorkshopTech || isWhToHd;      // tag type: teknisi dan saat serah ke HD tidak bisa ganti
  const lockTicketSerial = isTechToWh || isWhToHd;        // tiket & SN selalu readonly untuk Tek→WH dan WH→HD
  // Hanya Teknisi WKS yang tidak boleh ubah field penerima
  // Warehouse boleh edit akun penerima
  const lockReceiverFields = isWorkshopTech;
  // foto: semua role boleh tambah/hapus (lockPhotos dihapus)

  const [tagType, setTagType] = useState<EquipmentTagType>((detail.equipmentTagType as EquipmentTagType) || "Damaged");
  const [technicians, setTechnicians] = useState<UserOption[]>([]);
  const [warehouseReceivers, setWarehouseReceivers] = useState<UserOption[]>([]);
  const [helpdeskReceivers, setHelpdeskReceivers] = useState<UserOption[]>([]);
  const [workshopTechnicians, setWorkshopTechnicians] = useState<WorkshopTechnicianDto[]>([]);
  const [allWorkshopTechnicians, setAllWorkshopTechnicians] = useState<WorkshopTechnicianDto[]>([]);
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
  const [workshopTechId, setWorkshopTechId] = useState(
    // TechnicianToWarehouse → handedOverByWorkshopTechnicianId (penyerah)
    // HelpdeskToTechnician  → workshopTechnicianId (penerima teknisi)
    isTechToWh
      ? detail.handedOverByWorkshopTechnicianId?.toString() || ""
      : detail.workshopTechnicianId?.toString() || ""
  );
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
    radioHandoverApi.getTechnicians().then((list) => {
      setTechnicians(list);
    }).catch(() => setTechnicians([]));
    // Untuk handover Tek→WH, penerima adalah akun Warehouse (bukan teknisi)
    if (isTechToWh) {
      radioHandoverApi.getWarehouseReceivers().then((list) => {
        setWarehouseReceivers(list);
        // Auto-fill techId — bandingkan sebagai Number untuk hindari type mismatch
        if (detail.receivedByUserId) {
          const targetId = Number(detail.receivedByUserId);
          const match = list.find(r => Number(r.userId) === targetId);
          console.log("[EditHandover] warehouseReceivers loaded:", list.length, "looking for userId:", targetId, "match:", match?.fullName ?? "NOT FOUND");
          if (match) setTechId(match.userId.toString());
        }
      }).catch(() => setWarehouseReceivers([]));
    }
    // Untuk handover WH→HD, penerima adalah akun Helpdesk
    if (isWhToHd) {
      radioHandoverApi.getHelpdeskReceivers().then((list) => {
        setHelpdeskReceivers(list);
        if (detail.receivedByUserId) {
          const match = list.find(r => r.userId === detail.receivedByUserId);
          if (match) setTechId(match.userId.toString());
        }
      }).catch(() => setHelpdeskReceivers([]));
    }
    workshopTechnicianApi.getAllActive().then((res) => {
      setAllWorkshopTechnicians(res.data.data);
      // Auto-fill workshopTechId — sumber berbeda tergantung flow
      const sourceId = isTechToWh
        ? detail.handedOverByWorkshopTechnicianId  // Tek→WH: penyerah (semua teknisi)
        : detail.workshopTechnicianId;              // HD→Tek: penerima teknisi (difilter per akun)
      if (sourceId) {
        const match = res.data.data.find((t: WorkshopTechnicianDto) => t.id === sourceId);
        if (match) setWorkshopTechId(match.id.toString());
      }
    }).catch(() => setAllWorkshopTechnicians([]));
  }, [isTechToWh, isWhToHd]);

  // Filter teknisi berdasarkan akun yang terkait:
  // - HD→Tek: filter berdasarkan akun sistem penerima (techId = userId akun workshop)
  // - Tek→WH: filter berdasarkan userId dari teknisi penyerah asal (dari handedOverByWorkshopTechnicianId)
  const filteredWorkshopTechnicians = (() => {
    if (!isTechToWh && techId) {
      // HD→Tek: tampilkan teknisi yang terhubung ke akun worskhop penerima
      return allWorkshopTechnicians.filter(t => t.userId === Number(techId));
    }
    if (isTechToWh && detail.handedOverByWorkshopTechnicianId) {
      // Tek→WH: cari userId dari teknisi penyerah asal, lalu filter semua teknisi dengan userId yang sama
      const penyerahAsal = allWorkshopTechnicians.find(t => t.id === detail.handedOverByWorkshopTechnicianId);
      if (penyerahAsal?.userId) {
        return allWorkshopTechnicians.filter(t => t.userId === penyerahAsal.userId);
      }
    }
    return allWorkshopTechnicians;
  })();

  // Sync workshopTechnicians dari filtered list
  useEffect(() => {
    setWorkshopTechnicians(filteredWorkshopTechnicians);
    // Reset pilihan jika teknisi yang dipilih tidak ada di filtered list
    if (workshopTechId && !filteredWorkshopTechnicians.find(t => t.id.toString() === workshopTechId)) {
      setWorkshopTechId("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [techId, allWorkshopTechnicians]);

  const validate = (): string[] => {
    const missing: string[] = [];
    if (!ticket.trim()) missing.push("No tiket helpdesk");
    if (!serial.trim()) missing.push("Serial Number");
    if (tagType === "Damaged" && !damage.trim()) missing.push("Keterangan kerusakan");
    if (tagType === "Good" && !greenFields.repairDataDescription?.trim()) missing.push("Data perbaikan (Tag Hijau)");
    if (!techId) missing.push(isWhToHd ? "Akun Helpdesk Penerima" : "Akun Sistem Penerima");
    // WH→HD tidak memerlukan Teknisi Penyerah
    // Warehouse yang edit juga tidak wajib isi Teknisi Penyerah (sudah tercatat dari data awal)
    if (!isWhToHd && !isWarehouse && !workshopTechId) missing.push("Teknisi Penyerah");
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
      // Bedakan field tujuan berdasarkan flow
      workshopTechnicianId: !isTechToWh && workshopTechId ? Number(workshopTechId) : undefined,
      handedOverByWorkshopTechnicianId: isTechToWh && workshopTechId ? Number(workshopTechId) : undefined,
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
    <ResponsiveModal
      open={true}
      onOpenChange={onClose}
      bottomSheetSize="xl"
      desktopClassName="max-w-2xl"
      title={`Edit Serah Terima: ${detail.handoverNumber}`}
    >

        <div className="space-y-4">
          {/* Tiket & Serial - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Tiket Helpdesk *</label>
              <input
                className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors ${lockTicketSerial ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
                placeholder="#MKN/1234/5678"
                disabled={lockTicketSerial}
              />
            </div>
            <div>
              <RadioSerialLookupField
                serial={serial}
                radioId={radioId}
                lookup={lookup}
                label="Serial Number"
                required
                disabled={lockTicketSerial}
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
              className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors ${lockTicketSerial ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
              value={equipmentName}
              onChange={(e) => setEquipmentName(e.target.value)}
              placeholder="Motorola DP4800, TP8100, ..."
              disabled={lockTicketSerial}
            />
          </div>

          {/* Tag Type Selection - Mobile Optimized */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Jenis Tag</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { if (!lockCoreFields) setTagType("Damaged"); }}
                disabled={lockCoreFields}
                className={`p-3 rounded-xl border-2 text-left transition-all ${tagType === "Damaged"
                  ? "border-amber-500 bg-amber-50 shadow-sm ring-2 ring-amber-200"
                  : "border-gray-200 bg-white"
                  } ${lockCoreFields ? "opacity-75 cursor-not-allowed" : "hover:border-amber-300"}`}
              >
                <p className="font-bold text-sm text-amber-900">Tag kuning (Rusak)</p>
                <p className="text-xs text-amber-700 mt-0.5">Peralatan masuk perbaikan</p>
              </button>
              <button
                type="button"
                onClick={() => { if (!lockCoreFields) setTagType("Good"); }}
                disabled={lockCoreFields}
                className={`p-3 rounded-xl border-2 text-left transition-all ${tagType === "Good"
                  ? "border-emerald-500 bg-emerald-50 shadow-sm ring-2 ring-emerald-200"
                  : "border-gray-200 bg-white"
                  } ${lockCoreFields ? "opacity-75 cursor-not-allowed" : "hover:border-emerald-300"}`}
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
              <label className="text-sm font-medium text-gray-700">
                {isWhToHd ? "Akun Helpdesk Penerima *" : "Akun Sistem Penerima *"}
              </label>
              <Select value={techId} onValueChange={setTechId} disabled={lockReceiverFields}>
                <SelectTrigger className={`w-full h-11 border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${lockReceiverFields ? 'bg-gray-100 cursor-not-allowed opacity-80' : 'bg-white'}`}>
                  <SelectValue placeholder={isWhToHd ? "Pilih staff helpdesk" : "Pilih akun sistem"} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {/* Tek→WH: penerima adalah akun Warehouse; WH→HD: akun Helpdesk; selainnya: akun Teknisi */}
                  {(isTechToWh ? warehouseReceivers : isWhToHd ? helpdeskReceivers : technicians).map((t) => (
                    <SelectItem key={t.userId} value={t.userId.toString()}>
                      <span className="font-medium">{t.fullName}</span>{" "}
                      <span className="text-xs text-gray-500">(@{t.username})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lockReceiverFields && isWarehouse && isTechToWh && detail.receivedByUserId && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Penerima sudah ditentukan oleh helpdesk, tidak dapat diubah.
                </p>
              )}            </div>

            {/* Teknisi Penyerah — tidak relevan untuk WH→HD */}
            {!isWhToHd && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {isTechToWh ? `Teknisi Penyerah${!isWarehouse ? " *" : ""}` : "Teknisi Penerima *"}
              </label>
              <Select value={workshopTechId} onValueChange={setWorkshopTechId} disabled={lockReceiverFields}>
                <SelectTrigger className={`w-full h-11 border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${lockReceiverFields ? 'bg-gray-100 cursor-not-allowed opacity-80' : 'bg-white'}`}>
                  <SelectValue placeholder={isTechToWh ? "Pilih teknisi penyerah" : "Pilih teknisi penerima"} />
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
            )}
          </div>

          {/* Photos — semua role boleh tambah/hapus */}
          <MultiPhotoUpload photos={photos} onChange={setPhotos} required label="Foto Radio" />

          {/* Accessories */}
          <HandoverAccessoryList items={accessories} onChange={setAccessories} />

          {/* Signature — muncul jika warehouse login adalah penerima yang dituju */}
          {(!detail.receiverSignatureBase64 || isWarehouse) && (() => {
            // Jika sudah pilih penerima dan bukan akun sendiri → sembunyikan TTD
            // Biarkan penerima yang dituju TTD dari akunnya nanti
            const selectedReceiverId = techId ? Number(techId) : null;
            const myUserId = user?.userId ?? null;
            const iAmTheReceiver = !selectedReceiverId || selectedReceiverId === myUserId;
            if (!iAmTheReceiver) return null;
            return (
              <SignaturePadField
                ref={sigTekRef}
                label={isWarehouse ? "TTD Penerima (Warehouse)" : "TTD Penerima (opsional)"}
                value={sigReceiver}
                onChange={setSigReceiver}
              />
            );
          })()}

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
    </ResponsiveModal>
  );
}
