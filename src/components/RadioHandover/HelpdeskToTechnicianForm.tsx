import { useEffect, useRef, useState } from "react";
import SignaturePadField, { type SignaturePadHandle } from "../common/SignaturePadField";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import type { HandoverAccessoryItem, UserOption } from "../../types/radioHandover";
import { useToast } from "../../hooks/use-toast";
import { isValidSignature } from "../../utils/signatureUtils";
import { buildAccessoriesPayload } from "../../utils/handoverFormUtils";
import MultiRadioSerialList, { type RadioSerialLine } from "./MultiRadioSerialList";
import HandoverAccessoryList from "./HandoverAccessoryList";
import MultiPhotoUpload from "./MultiPhotoUpload";

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

const initialLine = (): RadioSerialLine => ({
  id: `${Date.now()}-init`,
  serial: "",
  radioId: null,
  lookup: null,
  equipmentName: "",
  unitNumber: "",
  radioOwnerLabel: "",
  ownerDivision: "",
  ownerDepartment: "",
});

export default function HelpdeskToTechnicianForm({ onSuccess, onCancel }: Props) {
  const { toast } = useToast();
  const [technicians, setTechnicians] = useState<UserOption[]>([]);
  const [ticket, setTicket] = useState("");
  const [radioLines, setRadioLines] = useState<RadioSerialLine[]>([initialLine()]);
  const [damage, setDamage] = useState("");
  const [techId, setTechId] = useState("");
  const [accessories, setAccessories] = useState<HandoverAccessoryItem[]>([]);
  const [remarks, setRemarks] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [sigHandover, setSigHandover] = useState<string | null>(null);
  const [sigReceiver, setSigReceiver] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const sigHdRef = useRef<SignaturePadHandle>(null);
  const sigTekRef = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    radioHandoverApi
      .getTechnicians()
      .then((list) => setTechnicians(list ?? []))
      .catch(() => setTechnicians([]));
  }, []);

  const submit = async () => {
    const hdSig = (await sigHdRef.current?.exportNow()) ?? sigHandover;
    const tekSig = (await sigTekRef.current?.exportNow()) ?? sigReceiver;

    const filledLines = radioLines
      .map((r) => ({ ...r, serial: r.serial.trim() }))
      .filter((r) => r.serial.length > 0);

    const missing: string[] = [];
    if (!ticket.trim()) missing.push("No tiket helpdesk");
    if (filledLines.length === 0) missing.push("Minimal satu serial number radio");
    if (!damage.trim()) missing.push("Keterangan kerusakan");
    if (!techId) missing.push("Teknisi penerima");
    if (photos.length === 0) missing.push("Foto radio (minimal 1)");
    if (!isValidSignature(hdSig)) missing.push("TTD Helpdesk — gambar tanda tangan di area putih");

    const seen = new Set<string>();
    const dup: string[] = [];
    for (const r of filledLines) {
      const key = r.serial.toLowerCase();
      if (seen.has(key)) dup.push(r.serial);
      else seen.add(key);
    }
    if (dup.length > 0) {
      missing.push(`SN duplikat: ${[...new Set(dup)].join(", ")}`);
    }

    for (const r of filledLines) {
      if (!r.radioId && !r.equipmentName.trim()) {
        missing.push(`Tipe/nama alat untuk SN ${r.serial} (belum di master)`);
      }
    }

    if (missing.length > 0) {
      toast({
        title: "Field wajib belum lengkap",
        description: missing.join(" • "),
        variant: "destructive",
      });
      return;
    }

    const { accessories: acc, batterySerialNumber } = buildAccessoriesPayload(accessories);
    const receiverOk = isValidSignature(tekSig);
    const basePayload = {
      handoverType: "HelpdeskToTechnician" as const,
      helpdeskTicketNumber: ticket.trim(),
      batterySerialNumber,
      damageDescription: damage.trim(),
      receivedByUserId: Number(techId),
      radioPhotos: photos,
      handedOverSignatureBase64: hdSig!,
      receiverSignatureBase64: receiverOk ? tekSig! : undefined,
      accessories: acc,
      remarks: remarks.trim() || undefined,
    };

    setSubmitting(true);
    const failed: { sn: string; message: string }[] = [];
    let ok = 0;

    try {
      for (const line of filledLines) {
        try {
          await radioHandoverApi.create({
            ...basePayload,
            radioId: line.radioId,
            radioSerialNumber: line.serial,
            equipmentName: line.equipmentName.trim() || line.lookup?.type?.trim() || undefined,
            unitNumber: line.unitNumber.trim() || undefined,
            radioOwnerLabel: line.radioOwnerLabel.trim() || undefined,
            ownerDivision: line.ownerDivision.trim() || undefined,
            ownerDepartment: line.ownerDepartment.trim() || undefined,
          });
          ok += 1;
        } catch (err: unknown) {
          const ax = err as { response?: { data?: { message?: string } } };
          const message =
            ax.response?.data?.message ??
            (err instanceof Error ? err.message : "Gagal menyimpan");
          failed.push({ sn: line.serial, message });
        }
      }

      if (ok === 0) {
        toast({
          title: "Gagal menyimpan",
          description: failed.map((f) => `${f.sn}: ${f.message}`).join(" • "),
          variant: "destructive",
        });
        return;
      }

      if (failed.length > 0) {
        toast({
          title: `Tersimpan ${ok} dari ${filledLines.length} radio`,
          description: failed.map((f) => `${f.sn}: ${f.message}`).join(" • "),
          variant: "destructive",
        });
        onSuccess();
        return;
      }

      toast({
        title:
          filledLines.length > 1
            ? `${filledLines.length} radio tersimpan`
            : receiverOk
              ? "Serah terima selesai"
              : "Disimpan — menunggu TTD teknisi",
        description:
          filledLines.length > 1
            ? `Tiket ${ticket.trim()} — ${filledLines.length} SN, masing-masing job + STR terpisah.`
            : receiverOk
              ? "Kedua tanda tangan lengkap."
              : "Teknisi penerima dapat melengkapi TTD dari daftar serah terima.",
      });
      onSuccess();
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
      <MultiRadioSerialList lines={radioLines} onChange={setRadioLines} />
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
      <SignaturePadField
        ref={sigHdRef}
        label="TTD Helpdesk (penyerah)"
        required
        value={sigHandover}
        onChange={setSigHandover}
      />
      <SignaturePadField
        ref={sigTekRef}
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
