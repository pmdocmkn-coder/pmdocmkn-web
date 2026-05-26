import type { HandoverAccessoryItem } from "../../types/radioHandover";

type Props = {
  items: HandoverAccessoryItem[];
  title?: string;
  subtitle?: string;
  loading?: boolean;
};

export default function HandoverAccessoryHistory({
  items,
  title = "Aksesoris dari serah terima HD → Teknisi",
  subtitle = "Data ini disalin otomatis ke serah terima ke warehouse.",
  loading,
}: Props) {
  const rows = items.filter((a) => a.itemName?.trim());

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
        Memuat riwayat aksesoris...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-500">
        <p className="font-medium text-gray-700">{title}</p>
        <p className="text-xs mt-1">Tidak ada aksesoris tercatat pada serah terima HD → Teknisi.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50/40 p-3 space-y-2">
      <div>
        <p className="text-sm font-medium text-violet-900">{title}</p>
        {subtitle && <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>}
      </div>
      <ul className="text-sm space-y-1.5">
        {rows.map((a, i) => (
          <li key={i} className="flex flex-wrap gap-x-2 gap-y-0.5 bg-white/80 rounded-md px-2 py-1.5 border border-violet-100">
            <span className="font-medium">{a.itemName}</span>
            <span className="text-gray-500">
              ×{a.quantity} {a.unit ?? "EA"}
            </span>
            {a.serialNumber?.trim() && <span className="text-gray-700">SN: {a.serialNumber}</span>}
            {a.description?.trim() && <span className="text-gray-500">— {a.description}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
