import { Plus, Trash2 } from "lucide-react";
import type { HandoverAccessoryItem } from "../../types/radioHandover";

const emptyRow = (): HandoverAccessoryItem => ({
  itemName: "",
  quantity: 1,
  unit: "EA",
  serialNumber: "",
});

type Props = {
  items: HandoverAccessoryItem[];
  onChange: (items: HandoverAccessoryItem[]) => void;
};

export default function HandoverAccessoryList({ items, onChange }: Props) {
  const rows = items.length > 0 ? items : [emptyRow()];

  const update = (index: number, field: keyof HandoverAccessoryItem, value: string | number) => {
    const next = [...rows];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const add = () => onChange([...rows, emptyRow()]);

  const remove = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [emptyRow()]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Aksesoris</p>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 text-xs px-2 py-1 border rounded-lg hover:bg-gray-50"
        >
          <Plus className="w-3 h-3" /> Tambah
        </button>
      </div>
      {rows.map((row, index) => (
        <div key={index} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              placeholder="Nama barang *"
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
            placeholder="Serial Number (opsional)"
            value={row.serialNumber ?? ""}
            onChange={(e) => update(index, "serialNumber", e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
