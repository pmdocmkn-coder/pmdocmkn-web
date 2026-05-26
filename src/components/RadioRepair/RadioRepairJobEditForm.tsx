import { useEffect, useState } from "react";
import type { RadioRepairJobDetail } from "../../types/radioRepair";
import type { UpdateRadioRepairJobPayload } from "../../services/radioRepairApi";
import type { RadioLookup, UserOption } from "../../types/radioHandover";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import RadioSerialLookupField from "../RadioHandover/RadioSerialLookupField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

type Props = {
  job: RadioRepairJobDetail;
  technicians: UserOption[];
  saving: boolean;
  onSave: (payload: UpdateRadioRepairJobPayload) => void;
};

export default function RadioRepairJobEditForm({ job, technicians, saving, onSave }: Props) {
  const [serial, setSerial] = useState(job.radioSerialNumber);
  const [radioId, setRadioId] = useState<number | null>(job.radioId ?? null);
  const [lookup, setLookup] = useState<RadioLookup | null>(null);
  const [form, setForm] = useState<UpdateRadioRepairJobPayload>({
    helpdeskTicketNumber: job.helpdeskTicketNumber,
    radioSerialNumber: job.radioSerialNumber,
    batterySerialNumber: job.batterySerialNumber ?? "",
    damageDescription: job.damageDescription,
    assignedTechnicianUserId: job.assignedTechnicianUserId,
    radioId: job.radioId ?? null,
    equipmentName: job.equipmentName ?? "",
    unitNumber: job.unitNumber ?? "",
    radioOwnerLabel: job.radioOwnerLabel ?? "",
    ownerDivision: job.ownerDivision ?? "",
    ownerDepartment: job.ownerDepartment ?? "",
  });

  useEffect(() => {
    setSerial(job.radioSerialNumber);
    setRadioId(job.radioId ?? null);
    setForm({
      helpdeskTicketNumber: job.helpdeskTicketNumber,
      radioSerialNumber: job.radioSerialNumber,
      batterySerialNumber: job.batterySerialNumber ?? "",
      damageDescription: job.damageDescription,
      assignedTechnicianUserId: job.assignedTechnicianUserId,
      radioId: job.radioId ?? null,
      equipmentName: job.equipmentName ?? "",
      unitNumber: job.unitNumber ?? "",
      radioOwnerLabel: job.radioOwnerLabel ?? "",
      ownerDivision: job.ownerDivision ?? "",
      ownerDepartment: job.ownerDepartment ?? "",
    });

    // Fetch lookup sekaligus dalam satu effect — hindari race condition
    // antara reset form dan async fetch
    if (!job.radioSerialNumber) {
      setLookup(null);
      return;
    }
    let cancelled = false;
    radioHandoverApi
      .lookupBySerial(job.radioSerialNumber)
      .then((results) => {
        if (cancelled) return;
        const match =
          (job.radioId ? results.find((r) => r.id === job.radioId) : null) ??
          results[0] ??
          null;
        setLookup(match);
      })
      .catch(() => {
        if (!cancelled) setLookup(null);
      });
    return () => { cancelled = true; };
  }, [job]);

  const techInList = technicians.some((t) => t.userId === job.assignedTechnicianUserId);

  const submit = () => {
    if (!form.assignedTechnicianUserId) return;
    if (!radioId && !form.equipmentName?.trim()) return;
    onSave({
      ...form,
      radioSerialNumber: serial.trim(),
      radioId,
      batterySerialNumber: form.batterySerialNumber || null,
      equipmentName: form.equipmentName?.trim() || undefined,
      unitNumber: form.unitNumber?.trim() || undefined,
      radioOwnerLabel: form.radioOwnerLabel?.trim() || undefined,
      ownerDivision: form.ownerDivision?.trim() || undefined,
      ownerDepartment: form.ownerDepartment?.trim() || undefined,
    });
  };

  return (
    <div className="space-y-3 text-sm">
      <label className="block">
        Tiket MKN
        <input
          className="w-full border rounded-lg px-3 py-2 mt-1"
          value={form.helpdeskTicketNumber}
          onChange={(e) => setForm({ ...form, helpdeskTicketNumber: e.target.value })}
        />
      </label>

      <RadioSerialLookupField
        serial={serial}
        radioId={radioId}
        lookup={lookup}
        onSelect={(s, id, newLookup) => {
          setSerial(s);
          setRadioId(id);
          setLookup(newLookup ?? null);
          setForm((f) => ({
            ...f,
            radioSerialNumber: s,
            radioId: id,
            equipmentName: newLookup?.type ?? f.equipmentName,
            unitNumber: newLookup?.nomorUnit ?? f.unitNumber,
            radioOwnerLabel: newLookup?.ownerLabel ?? f.radioOwnerLabel,
            ownerDivision: newLookup?.division ?? f.ownerDivision,
            ownerDepartment: newLookup?.department ?? f.ownerDepartment,
          }));
        }}
      />

      {!radioId && serial.trim() && (
        <label className="block">
          <span className="font-medium text-amber-800">Tipe / nama alat *</span>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={form.equipmentName ?? ""}
            onChange={(e) => setForm({ ...form, equipmentName: e.target.value })}
          />
        </label>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block sm:col-span-2">
          Pemilik radio
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={form.radioOwnerLabel ?? ""}
            onChange={(e) => setForm({ ...form, radioOwnerLabel: e.target.value })}
            placeholder="Perusahaan / nama pemakai"
          />
        </label>
        <label className="block">
          Divisi
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={form.ownerDivision ?? ""}
            onChange={(e) => setForm({ ...form, ownerDivision: e.target.value })}
          />
        </label>
        <label className="block">
          Departemen
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={form.ownerDepartment ?? ""}
            onChange={(e) => setForm({ ...form, ownerDepartment: e.target.value })}
          />
        </label>
      </div>

      <label className="block">
        Nomor unit
        <input
          className="w-full border rounded-lg px-3 py-2 mt-1"
          value={form.unitNumber ?? ""}
          onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
        />
      </label>

      <label className="block">
        Kerusakan
        <textarea
          className="w-full border rounded-lg px-3 py-2 mt-1"
          rows={3}
          value={form.damageDescription}
          onChange={(e) => setForm({ ...form, damageDescription: e.target.value })}
        />
      </label>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Teknisi *</label>
        <Select
          value={form.assignedTechnicianUserId ? String(form.assignedTechnicianUserId) : ""}
          onValueChange={(v) => setForm({ ...form, assignedTechnicianUserId: Number(v) })}
        >
          <SelectTrigger className="w-full h-11 border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white">
            <SelectValue placeholder="Pilih teknisi" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {!techInList && job.assignedTechnicianUserId > 0 && (
              <SelectItem value={String(job.assignedTechnicianUserId)}>
                <span className="font-medium">{job.assignedTechnicianName}</span>
              </SelectItem>
            )}
            {technicians.map((t) => (
              <SelectItem key={t.userId} value={t.userId.toString()}>
                <span className="font-medium">{t.fullName}</span>{" "}
                <span className="text-xs text-gray-500">(@{t.username})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <button
        type="button"
        disabled={saving || !form.assignedTechnicianUserId}
        className="w-full py-2 bg-violet-600 text-white rounded-lg disabled:opacity-50"
        onClick={submit}
      >
        {saving ? "Menyimpan..." : "Simpan"}
      </button>
    </div>
  );
}
