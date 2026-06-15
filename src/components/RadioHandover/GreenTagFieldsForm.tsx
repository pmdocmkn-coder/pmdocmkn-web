import { useEffect, useState } from "react";
import type { GreenTagFields } from "../../types/equipmentTag";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import type { UserOption } from "../../types/radioHandover";

type Props = {
  value: GreenTagFields;
  onChange: (v: GreenTagFields) => void;
  /** Sudah terisi dari langkah Tiket & radio — tampilkan read-only */
  originPrefilled?: string;
  /** Jika true, Data perbaikan menjadi wajib diisi */
  requiredMode?: boolean;
  /** Nama teknisi terakhir — dipakai untuk auto-fill 'Diperbaiki oleh' */
  autoTechnicianName?: string;
};

export default function GreenTagFieldsForm({ value, onChange, originPrefilled, requiredMode, autoTechnicianName }: Props) {
  const set = (key: keyof GreenTagFields, v: string) => onChange({ ...value, [key]: v });

  // Auto-fill "Diperbaiki oleh" dengan teknisi terakhir jika kosong
  useEffect(() => {
    if (autoTechnicianName && !value.repairedByName?.trim()) {
      onChange({ ...value, repairedByName: autoTechnicianName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTechnicianName]);

  const [techs, setTechs] = useState<UserOption[]>([]);
  useEffect(() => {
    radioHandoverApi.getTechnicians().then(setTechs).catch(() => {});
  }, []);

  return (
    <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
      <p className="text-sm font-semibold text-emerald-900">Data tag hijau — peralatan baik</p>
      <p className="text-xs text-emerald-800/90">
        {requiredMode
          ? "Data perbaikan wajib diisi saat menandai peralatan sebagai Tag Hijau."
          : "Field di bawah opsional kecuali Anda ingin melengkapi hasil inspeksi. Data perbaikan bisa diisi nanti setelah pengecekan teknisi."
        }
      </p>
      {originPrefilled?.trim() ? (
        <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm">
          <span className="text-gray-500 text-xs block">Berasal dari (dari langkah 2)</span>
          <span className="font-medium text-gray-900">{originPrefilled.trim()}</span>
        </div>
      ) : (
        <label className="block text-sm">
          <span className="font-medium">Berasal dari</span>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1 bg-white"
            value={value.originFrom ?? ""}
            onChange={(e) => set("originFrom", e.target.value)}
            placeholder="Nama pengirim / divisi asal"
          />
        </label>
      )}
      <label className="block text-sm">
        <span className="font-medium">
          Data perbaikan{requiredMode ? <span className="text-red-500 ml-0.5">*</span> : " (opsional)"}
        </span>
        <textarea
          className={`w-full border rounded-lg px-3 py-2 mt-1 bg-white ${requiredMode && !value.repairDataDescription?.trim() ? "border-red-300 focus:ring-red-400" : ""}`}
          rows={3}
          value={value.repairDataDescription ?? ""}
          onChange={(e) => set("repairDataDescription", e.target.value)}
          placeholder="Isi setelah pengecekan — cleaning, ganti board, …"
        />
        {requiredMode && !value.repairDataDescription?.trim() && (
          <p className="text-xs text-red-500 mt-1">Data perbaikan wajib diisi untuk Tag Hijau</p>
        )}
      </label>
      <label className="block text-sm">
        <span className="font-medium">Diperbaiki oleh</span>
        <input
          list="tech-list"
          className="w-full border rounded-lg px-3 py-2 mt-1 bg-white"
          value={value.repairedByName ?? ""}
          onChange={(e) => set("repairedByName", e.target.value)}
        />
        <datalist id="tech-list">
          {techs.map(t => <option key={t.userId} value={t.fullName} />)}
        </datalist>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Freq error</span>
          <input className="w-full border rounded-lg px-3 py-2 mt-1 bg-white" value={value.frequencyError ?? ""} onChange={(e) => set("frequencyError", e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-gray-700">AF</span>
          <input className="w-full border rounded-lg px-3 py-2 mt-1 bg-white" value={value.afReading ?? ""} onChange={(e) => set("afReading", e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Power</span>
          <input className="w-full border rounded-lg px-3 py-2 mt-1 bg-white" value={value.powerReading ?? ""} onChange={(e) => set("powerReading", e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-gray-700">V.out tanpa beban</span>
          <input className="w-full border rounded-lg px-3 py-2 mt-1 bg-white" value={value.voltageOutNoLoad ?? ""} onChange={(e) => set("voltageOutNoLoad", e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-gray-700">V.out dengan beban</span>
          <input className="w-full border rounded-lg px-3 py-2 mt-1 bg-white" value={value.voltageOutWithLoad ?? ""} onChange={(e) => set("voltageOutWithLoad", e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Fisik</span>
          <input className="w-full border rounded-lg px-3 py-2 mt-1 bg-white" value={value.physicalCondition ?? ""} onChange={(e) => set("physicalCondition", e.target.value)} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-gray-700">Display</span>
          <input className="w-full border rounded-lg px-3 py-2 mt-1 bg-white" value={value.displayCondition ?? ""} onChange={(e) => set("displayCondition", e.target.value)} />
        </label>
      </div>
    </div>
  );
}
