import { Plus, Trash2 } from "lucide-react";
import RadioSerialLookupField from "./RadioSerialLookupField";
import RadioMasterSummaryCard from "./RadioMasterSummaryCard";
import type { RadioLookup } from "../../types/radioHandover";
import { lineFromLookup } from "../../utils/radioHandoverLineUtils";

export type RadioSerialLine = {
  id: string;
  serial: string;
  radioId: number | null;
  lookup?: RadioLookup | null;
  equipmentName: string;
  unitNumber: string;
  radioOwnerLabel: string;
  ownerDivision: string;
  ownerDepartment: string;
};

const newLine = (): RadioSerialLine => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  serial: "",
  radioId: null,
  lookup: null,
  equipmentName: "",
  unitNumber: "",
  radioOwnerLabel: "",
  ownerDivision: "",
  ownerDepartment: "",
});

type Props = {
  lines: RadioSerialLine[];
  onChange: (lines: RadioSerialLine[]) => void;
  /** Sembunyikan pemilik/divisi — dipakai bersama SharedRadioDefaultsFields */
  compactMode?: boolean;
};

export default function MultiRadioSerialList({ lines, onChange, compactMode }: Props) {
  const rows = lines.length > 0 ? lines : [newLine()];

  const patch = (id: string, patch: Partial<RadioSerialLine>) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const onSelect = (id: string, s: string, radioId: number | null, lookup?: RadioLookup) => {
    const merged = lineFromLookup(s, radioId, lookup ?? null);
    patch(id, { ...merged, id });
  };

  const add = () => onChange([...rows, newLine()]);

  const remove = (id: string) => {
    const next = rows.filter((r) => r.id !== id);
    onChange(next.length > 0 ? next : [newLine()]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="text-sm font-medium">Serial Number Radio *</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Satu tiket bisa beberapa radio — tambah baris untuk setiap SN
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-violet-50 text-violet-700 shrink-0"
        >
          <Plus className="w-3 h-3" /> Tambah SN
        </button>
      </div>
      {rows.map((row, index) => (
        <div key={row.id} className="border rounded-xl p-3 bg-gray-50/50 space-y-3">
          <div className="flex gap-2 items-start">
            {rows.length > 1 && (
              <span className="text-xs font-medium text-gray-400 pt-3 w-5 text-right shrink-0">{index + 1}.</span>
            )}
            <div className="flex-1 min-w-0">
              <RadioSerialLookupField
                serial={row.serial}
                radioId={row.radioId}
                lookup={row.lookup}
                label={rows.length > 1 ? `SN radio ${index + 1}` : "Serial Number Radio"}
                required={index === 0}
                onSelect={(s, id, l) => onSelect(row.id, s, id, l)}
              />
              {compactMode && row.serial.trim() && (
                <RadioMasterSummaryCard line={row} compact />
              )}
            </div>
            {rows.length > 1 && (
              <button
                type="button"
                title="Hapus baris SN"
                className="p-2 mt-7 border rounded-lg text-red-600 hover:bg-red-50 shrink-0"
                onClick={() => remove(row.id)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {row.serial.trim() && (
            <>
              {!row.radioId && (
                <label className="block text-sm">
                  <span className="font-medium text-amber-800">Tipe / nama alat *</span>
                  <span className="text-xs text-gray-500 block mb-1">
                    {compactMode
                      ? "Wajib jika SN belum di master — atau isi default di atas"
                      : "Wajib jika SN belum di master (contoh: Motorola DP4800)"}
                  </span>
                  <input
                    className="w-full border rounded-lg px-3 py-2 mt-0.5 bg-white"
                    value={row.equipmentName}
                    onChange={(e) => patch(row.id, { equipmentName: e.target.value })}
                    placeholder="Tipe radio atau jenis peralatan lain"
                  />
                </label>
              )}

              {!compactMode && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block text-sm sm:col-span-2">
                      <span className="font-medium text-gray-700">Pemilik radio</span>
                      <span className="text-xs text-gray-500 block mb-1">
                        Nama perusahaan, unit, atau nama pemakai (user)
                      </span>
                      <input
                        className="w-full border rounded-lg px-3 py-2 mt-0.5 bg-white"
                        value={row.radioOwnerLabel}
                        onChange={(e) => patch(row.id, { radioOwnerLabel: e.target.value })}
                        placeholder={row.radioId ? "Dari master — bisa diedit" : "Contoh: PT KPC / John Doe"}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium text-gray-700">Divisi</span>
                      <input
                        className="w-full border rounded-lg px-3 py-2 mt-1 bg-white"
                        value={row.ownerDivision}
                        onChange={(e) => patch(row.id, { ownerDivision: e.target.value })}
                        placeholder={row.radioId ? "Dari master" : "Opsional"}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium text-gray-700">Departemen</span>
                      <input
                        className="w-full border rounded-lg px-3 py-2 mt-1 bg-white"
                        value={row.ownerDepartment}
                        onChange={(e) => patch(row.id, { ownerDepartment: e.target.value })}
                        placeholder={row.radioId ? "Dari master" : "Opsional"}
                      />
                    </label>
                  </div>
                  <label className="block text-sm">
                    <span className="font-medium text-gray-700">Nomor unit</span>
                    <span className="text-xs text-gray-500 block mb-1">
                      {row.radioId ? "Terisi otomatis dari master — bisa diedit" : "Opsional jika tidak terdaftar"}
                    </span>
                    <input
                      className="w-full border rounded-lg px-3 py-2 mt-0.5 bg-white"
                      value={row.unitNumber}
                      onChange={(e) => patch(row.id, { unitNumber: e.target.value })}
                      placeholder={row.radioId ? "Dari master radio" : "Opsional"}
                    />
                  </label>
                </>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
