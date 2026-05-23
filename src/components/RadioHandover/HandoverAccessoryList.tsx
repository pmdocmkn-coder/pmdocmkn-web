import { Plus, Trash2 } from "lucide-react";
import type { HandoverAccessoryItem } from "../../types/radioHandover";

const emptyRow = (): HandoverAccessoryItem => ({
  itemName: "",
  quantity: 1,
  unit: "EA",
  serialNumber: "",
});

const QUICK_ADD = ["Baterai", "Antenna", "Charger", "Speaker Mic", "Flexible Cable"];

type Props = {
  items: HandoverAccessoryItem[];
  onChange: (items: HandoverAccessoryItem[]) => void;
  /** Tanpa baris kosong default; cocok untuk tambahan opsional. */
  optional?: boolean;
  label?: string;
  hint?: string;
};

export default function HandoverAccessoryList({
  items,
  onChange,
  optional,
  label = "Aksesoris",
  hint,
}: Props) {
  const rows = items.length > 0 ? items : optional ? [] : [emptyRow()];

  const update = (index: number, field: keyof HandoverAccessoryItem, value: string | number) => {
    const next = [...rows];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const add = () => onChange([...rows, emptyRow()]);

  const addPreset = (name: string) => {
    onChange([...rows.filter((r) => r.itemName.trim()), { itemName: name, quantity: 1, unit: "EA", serialNumber: "" }]);
  };

  const remove = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [emptyRow()]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm font-medium">
            {label}
            {optional && <span className="text-gray-400 font-normal"> (opsional)</span>}
          </p>
          <p className="text-xs text-gray-500">
            {hint ??
              (optional
                ? "Tambahkan barang baru jika ada perubahan kelengkapan sejak HD → Teknisi"
                : "SN baterai & aksesoris lain — isi nama barang + SN di bawah")}
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 text-xs px-2 py-1 border rounded-lg hover:bg-gray-50"
        >
          <Plus className="w-3 h-3" /> Tambah
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {QUICK_ADD.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => addPreset(name)}
            className="text-xs px-2 py-1 rounded-full border border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            + {name}
          </button>
        ))}
      </div>
      {optional && rows.length === 0 && (
        <p className="text-xs text-gray-400 italic">Belum ada tambahan. Klik Tambah jika perlu.</p>
      )}
      {rows.map((row, index) => (
        <div key={index} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              placeholder={index === 0 && row.itemName === "" ? "Nama barang (mis. Baterai) *" : "Nama barang *"}
              value={row.itemName}
              onChange={(e) => update(index, "itemName", e.target.value)}
            />
            <input
              type="number"
              min={1}
              className="w-16 border rounded-lg px-2 py-2 text-sm"
              value={row.quantity}
              onChange={(e) => update(index, "quantity", parseInt(e.target.value, 10) || 1)}
            />
            <input
              className="w-16 border rounded-lg px-2 py-2 text-sm"
              placeholder="Unit"
              value={row.unit ?? "EA"}
              onChange={(e) => update(index, "unit", e.target.value)}
            />
            {rows.length > 1 && (
              <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder={
              /baterai|battery/i.test(row.itemName)
                ? "SN Baterai *"
                : "Serial Number (opsional)"
            }
            value={row.serialNumber ?? ""}
            onChange={(e) => update(index, "serialNumber", e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
