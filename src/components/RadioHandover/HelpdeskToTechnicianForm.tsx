import { useEffect, useState } from "react";
import SignaturePadField from "../common/SignaturePadField";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import type { HandoverAccessoryItem, UserOption } from "../../types/radioHandover";
import { useToast } from "../../hooks/use-toast";
import { isValidSignature } from "../../utils/signatureUtils";
import RadioSerialLookupField from "./RadioSerialLookupField";
import HandoverAccessoryList from "./HandoverAccessoryList";
import MultiPhotoUpload from "./MultiPhotoUpload";

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

export default function HelpdeskToTechnicianForm({ onSuccess, onCancel }: Props) {
  const { toast } = useToast();
  const [technicians, setTechnicians] = useState<UserOption[]>([]);
  const [ticket, setTicket] = useState("");
  const [serial, setSerial] = useState("");
  const [radioId, setRadioId] = useState<number | null>(null);
  const [batterySn, setBatterySn] = useState("");
  const [damage, setDamage] = useState("");
  const [techId, setTechId] = useState("");
  const [accessories, setAccessories] = useState<HandoverAccessoryItem[]>([]);
  const [remarks, setRemarks] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [sigHandover, setSigHandover] = useState<string | null>(null);
  const [sigReceiver, setSigReceiver] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    radioHandoverApi
      .getTechnicians()
      .then((list) => setTechnicians(list ?? []))
      .catch(() => setTechnicians([]));
  }, []);

  const validate = (): string[] => {
    const missing: string[] = [];
    if (!ticket.trim()) missing.push("No tiket helpdesk");
    if (!serial.trim()) missing.push("Serial number radio");
    if (!damage.trim()) missing.push("Keterangan kerusakan");
    if (!techId) missing.push("Teknisi penerima");
    if (photos.length === 0) missing.push("Foto radio (minimal 1)");
    if (!isValidSignature(sigHandover)) missing.push("TTD Helpdesk — pastikan sudah digambar dan kursor keluar dari area tanda tangan");
    return missing;
  };

  const submit = async () => {
    const missing = validate();
    if (missing.length > 0) {
      toast({
        title: "Field wajib belum lengkap",
        description: missing.join(" • "),
        variant: "destructive",
      });
      return;
    }

    const receiverOk = isValidSignature(sigReceiver);
    setSubmitting(true);
    try {
      await radioHandoverApi.create({
        handoverType: "HelpdeskToTechnician",
        helpdeskTicketNumber: ticket.trim(),
        radioId,
        radioSerialNumber: serial.trim(),
        batterySerialNumber: batterySn.trim() || undefined,
        damageDescription: damage.trim(),
        receivedByUserId: Number(techId),
        radioPhotos: photos,
        handedOverSignatureBase64: sigHandover!,
        receiverSignatureBase64: receiverOk ? sigReceiver! : undefined,
        accessories: accessories.filter((a) => a.itemName.trim()),
        remarks: remarks.trim() || undefined,
      });
      toast({
        title: receiverOk ? "Serah terima selesai" : "Disimpan — menunggu TTD teknisi",
        description: receiverOk
          ? "Kedua tanda tangan lengkap."
          : "Teknisi penerima dapat melengkapi TTD dari daftar serah terima.",
      });
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
      <div>
        <label className="text-sm font-medium">No Tiket Helpdesk *</label>
        <input
          className="w-full border rounded-lg px-3 py-2 mt-1"
          placeholder="#MKN/0526/0669"
          value={ticket}
          onChange={(e) => setTicket(e.target.value)}
        />
      </div>
      <RadioSerialLookupField
        serial={serial}
        radioId={radioId}
        required
        onSelect={(s, id) => {
          setSerial(s);
          setRadioId(id);
        }}
      />
      <div>
        <label className="text-sm font-medium">SN Baterai</label>
        <input className="w-full border rounded-lg px-3 py-2 mt-1" value={batterySn} onChange={(e) => setBatterySn(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Keterangan Kerusakan *</label>
        <textarea className="w-full border rounded-lg px-3 py-2 mt-1" rows={3} value={damage} onChange={(e) => setDamage(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Teknisi Penerima *</label>
        <select className="w-full border rounded-lg px-3 py-2 mt-1" value={techId} onChange={(e) => setTechId(e.target.value)}>
          <option value="">Pilih teknisi</option>
          {(technicians ?? []).map((t) => (
            <option key={t.userId} value={t.userId}>{t.fullName} ({t.username})</option>
          ))}
        </select>
      </div>
      <MultiPhotoUpload photos={photos} onChange={setPhotos} required />
      <HandoverAccessoryList items={accessories} onChange={setAccessories} />
      <SignaturePadField label="TTD Helpdesk (penyerah)" required value={sigHandover} onChange={setSigHandover} />
      <SignaturePadField
        label="TTD Teknisi (penerima)"
        value={sigReceiver}
        onChange={setSigReceiver}
      />
      <p className="text-xs text-gray-500 -mt-2">
        TTD teknisi opsional saat simpan. Jika kosong, status tetap <strong>belum selesai</strong> sampai teknisi menandatangani.
      </p>
      <div>
        <label className="text-sm font-medium text-gray-600">Catatan (opsional)</label>
        <input className="w-full border rounded-lg px-3 py-2 mt-1" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Opsional" />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button type="button" className="px-4 py-2 border rounded-lg" onClick={onCancel}>Batal</button>
        <button type="button" className="px-4 py-2 bg-violet-600 text-white rounded-lg disabled:opacity-50" disabled={submitting} onClick={submit}>
          {submitting ? "Menyimpan..." : "Simpan Serah Terima"}
        </button>
      </div>
    </div>
  );
}
