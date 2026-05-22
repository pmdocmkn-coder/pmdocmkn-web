import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { warehouseBorrowApi } from "../../services/warehouseBorrowApi";
import { useToast } from "../../hooks/use-toast";

export default function WarehouseBorrowRequestPage() {
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [part, setPart] = useState("");
  const [code, setCode] = useState("");
  const [qty, setQty] = useState(1);
  const [purpose, setPurpose] = useState("");
  const jobId = params.get("repairJobId");

  const submit = async () => {
    if (!part.trim()) {
      toast({ title: "Deskripsi part wajib", variant: "destructive" });
      return;
    }
    try {
      await warehouseBorrowApi.create({
        partDescription: part,
        partCode: code || undefined,
        quantity: qty,
        purpose: purpose || undefined,
        relatedRepairJobId: jobId ? Number(jobId) : undefined,
      });
      toast({ title: "Permintaan dikirim" });
      setPart("");
      setCode("");
      setPurpose("");
    } catch {
      toast({ title: "Gagal", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Ajuan Peminjaman Part</h1>
      {jobId && <p className="text-sm text-violet-600">Terhubung ke job repair #{jobId}</p>}
      <input className="w-full border rounded-lg px-3 py-2" placeholder="Deskripsi part *" value={part} onChange={(e) => setPart(e.target.value)} />
      <input className="w-full border rounded-lg px-3 py-2" placeholder="Kode part" value={code} onChange={(e) => setCode(e.target.value)} />
      <input type="number" min={1} className="w-full border rounded-lg px-3 py-2" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
      <textarea className="w-full border rounded-lg px-3 py-2" rows={3} placeholder="Keperluan" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
      <button type="button" className="px-4 py-2 bg-violet-600 text-white rounded-lg" onClick={submit}>Kirim Permintaan</button>
    </div>
  );
}
