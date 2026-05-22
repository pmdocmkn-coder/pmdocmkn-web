import { useEffect, useState } from "react";
import { warehouseBorrowApi } from "../../services/warehouseBorrowApi";
import type { WarehouseBorrowList } from "../../types/warehouseBorrow";
import { useToast } from "../../hooks/use-toast";

export default function WarehouseSupervisionPage() {
  const { toast } = useToast();
  const [pending, setPending] = useState<WarehouseBorrowList[]>([]);
  const [note, setNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);

  const load = () =>
    warehouseBorrowApi
      .getPending()
      .then((list) => setPending(list ?? []))
      .catch(() => setPending([]));

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: number) => {
    try {
      await warehouseBorrowApi.approve(id, note || undefined);
      toast({ title: "Disetujui" });
      setActiveId(null);
      setNote("");
      load();
    } catch {
      toast({ title: "Gagal", variant: "destructive" });
    }
  };

  const reject = async (id: number) => {
    if (!rejectReason.trim()) return;
    try {
      await warehouseBorrowApi.reject(id, rejectReason);
      toast({ title: "Ditolak" });
      setActiveId(null);
      setRejectReason("");
      load();
    } catch {
      toast({ title: "Gagal", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Supervisi Warehouse</h1>
      <p className="text-sm text-gray-500">{pending.length} menunggu persetujuan</p>
      <div className="space-y-4">
        {pending.map((b) => (
          <div key={b.id} className="bg-white border rounded-xl p-4">
            <p className="font-mono text-xs text-gray-500">{b.borrowNumber}</p>
            <p className="font-semibold">{b.partDescription} × {b.quantity}</p>
            <p className="text-sm">Oleh: {b.borrowedByName}</p>
            {activeId === b.id ? (
              <div className="mt-3 space-y-2">
                <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Catatan approve" value={note} onChange={(e) => setNote(e.target.value)} />
                <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Alasan tolak" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                <div className="flex gap-2">
                  <button type="button" className="px-3 py-1 bg-emerald-600 text-white rounded text-sm" onClick={() => approve(b.id)}>Setujui</button>
                  <button type="button" className="px-3 py-1 bg-red-600 text-white rounded text-sm" onClick={() => reject(b.id)}>Tolak</button>
                  <button type="button" className="px-3 py-1 border rounded text-sm" onClick={() => setActiveId(null)}>Batal</button>
                </div>
              </div>
            ) : (
              <button type="button" className="mt-2 text-sm text-violet-600" onClick={() => setActiveId(b.id)}>Review</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
