import { useEffect, useState } from "react";
import { format } from "date-fns";
import { warehouseBorrowApi } from "../../services/warehouseBorrowApi";
import type { WarehouseBorrowList } from "../../types/warehouseBorrow";

export default function WarehouseBorrowHistoryPage() {
  const [items, setItems] = useState<WarehouseBorrowList[]>([]);

  useEffect(() => {
    warehouseBorrowApi
      .getAll({ page: 1, pageSize: 50 })
      .then((r) => setItems(r.data ?? []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Histori Peminjaman Part</h1>
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">No</th>
              <th className="text-left px-4 py-3">Part</th>
              <th className="text-left px-4 py-3">Qty</th>
              <th className="text-left px-4 py-3">Teknisi</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="px-4 py-3 font-mono text-xs">{b.borrowNumber}</td>
                <td className="px-4 py-3">{b.partDescription}</td>
                <td className="px-4 py-3">{b.quantity}</td>
                <td className="px-4 py-3">{b.borrowedByName}</td>
                <td className="px-4 py-3">{b.status}</td>
                <td className="px-4 py-3">{format(new Date(b.requestedAt), "dd/MM/yyyy")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
