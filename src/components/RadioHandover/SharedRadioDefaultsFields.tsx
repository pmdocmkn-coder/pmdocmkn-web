import type { RadioSerialLine } from "./MultiRadioSerialList";

export type SharedRadioDefaults = {
  equipmentName: string;
  radioOwnerLabel: string;
  ownerDivision: string;
  ownerDepartment: string;
  unitNumber: string;
};

type Props = {
  defaults: SharedRadioDefaults;
  onChange: (d: SharedRadioDefaults) => void;
  onApplyToAll: () => void;
  lineCount: number;
};

export default function SharedRadioDefaultsFields({ defaults, onChange, onApplyToAll, lineCount }: Props) {
  return (
    <div className="rounded-[10px] border border-[#2B6CB0]/20 bg-[#EBF4FF]/30 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#1B3A6B]">Data bersama (semua radio di tiket ini)</p>
          <p className="text-xs text-[#2B6CB0] mt-0.5">
            Isi sekali untuk pemilik/tipe yang sama — lalu terapkan ke semua SN
          </p>
        </div>
        {lineCount > 1 && (
          <button
            type="button"
            onClick={onApplyToAll}
            className="text-xs font-medium px-3 py-1.5 rounded-[10px] bg-[#1B3A6B] text-white hover:bg-[#2B6CB0] transition-colors"
          >
            Terapkan ke {lineCount} SN
          </button>
        )}
      </div>
      <label className="block text-sm">
        <span className="font-medium text-gray-700">Tipe / nama alat (default)</span>
        <input
          className="w-full border rounded-lg px-3 py-2 mt-1 bg-white"
          value={defaults.equipmentName}
          onChange={(e) => onChange({ ...defaults, equipmentName: e.target.value })}
          placeholder="Motorola DP4800, TP8100, …"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-gray-700">Pemilik radio (default)</span>
        <input
          className="w-full border rounded-lg px-3 py-2 mt-1 bg-white"
          value={defaults.radioOwnerLabel}
          onChange={(e) => onChange({ ...defaults, radioOwnerLabel: e.target.value })}
          placeholder="PT KPC / nama pemakai"
        />
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Divisi</span>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1 bg-white"
            value={defaults.ownerDivision}
            onChange={(e) => onChange({ ...defaults, ownerDivision: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Departemen</span>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1 bg-white"
            value={defaults.ownerDepartment}
            onChange={(e) => onChange({ ...defaults, ownerDepartment: e.target.value })}
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-medium text-gray-700">Nomor unit (default)</span>
        <input
          className="w-full border rounded-lg px-3 py-2 mt-1 bg-white"
          value={defaults.unitNumber}
          onChange={(e) => onChange({ ...defaults, unitNumber: e.target.value })}
        />
      </label>
    </div>
  );
}

export function applyDefaultsToLines(lines: RadioSerialLine[], defaults: SharedRadioDefaults): RadioSerialLine[] {
  return lines.map((r) => ({
    ...r,
    equipmentName: r.equipmentName.trim() || defaults.equipmentName,
    radioOwnerLabel: r.radioOwnerLabel.trim() || defaults.radioOwnerLabel,
    ownerDivision: r.ownerDivision.trim() || defaults.ownerDivision,
    ownerDepartment: r.ownerDepartment.trim() || defaults.ownerDepartment,
    unitNumber: r.unitNumber.trim() || defaults.unitNumber,
  }));
}

export function mergeLineWithDefaults(line: RadioSerialLine, defaults: SharedRadioDefaults): RadioSerialLine {
  return {
    ...line,
    equipmentName: line.equipmentName.trim() || defaults.equipmentName,
    radioOwnerLabel: line.radioOwnerLabel.trim() || defaults.radioOwnerLabel,
    ownerDivision: line.ownerDivision.trim() || defaults.ownerDivision,
    ownerDepartment: line.ownerDepartment.trim() || defaults.ownerDepartment,
    unitNumber: line.unitNumber.trim() || defaults.unitNumber,
  };
}
