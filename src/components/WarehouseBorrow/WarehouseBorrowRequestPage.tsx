import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { warehouseBorrowApi } from "../../services/warehouseBorrowApi";
import { radioRepairApi } from "../../services/radioRepairApi";
import type { RadioRepairJobDetail } from "../../types/radioRepair";
import { useToast } from "../../hooks/use-toast";
import { motion } from "framer-motion";
import { PackageOpen, ArrowLeft, Wrench, AlertCircle, Search } from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

export default function WarehouseBorrowRequestPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const jobId = params.get("repairJobId");

  const [part, setPart] = useState("");
  const [code, setCode] = useState("");
  const [qty, setQty] = useState(1);
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [jobDetail, setJobDetail] = useState<RadioRepairJobDetail | null>(null);
  const [loadingJob, setLoadingJob] = useState(!!jobId);

  useEffect(() => {
    if (jobId) {
      radioRepairApi.getById(Number(jobId), false)
        .then(res => setJobDetail(res))
        .catch(() => {
          toast({ title: "Gagal memuat data pekerjaan", variant: "destructive" });
        })
        .finally(() => setLoadingJob(false));
    }
  }, [jobId, toast]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!part.trim()) {
      toast({ title: "Deskripsi part wajib diisi", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    try {
      await warehouseBorrowApi.create({
        partDescription: part,
        partCode: code || undefined,
        quantity: qty,
        purpose: purpose || undefined,
        relatedRepairJobId: jobId ? Number(jobId) : undefined,
      });
      toast({ title: "Permintaan peminjaman berhasil dikirim" });
      
      if (jobId) {
        navigate("/radio/repair/dashboard");
      } else {
        setPart("");
        setCode("");
        setPurpose("");
        setQty(1);
      }
    } catch {
      toast({ title: "Gagal mengirim permintaan", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      {/* ====== MOBILE INTEGRATED HEADER ====== */}
      <div className="md:hidden -mx-4 -mt-4 mb-4 px-4 pt-4 pb-4 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] rounded-b-3xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1 opacity-80">
              <span className="text-[10px] font-bold text-violet-600 tracking-wider uppercase">Warehouse</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
              Peminjaman Part
            </h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center hover:bg-violet-100 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Page Header (Desktop) ── */}
      <div className="hidden md:flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
          title="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <PackageOpen className="w-7 h-7 text-violet-600" />
            Peminjaman Part
          </h1>
          <p className="text-sm text-gray-500 mt-1">Ajukan peminjaman suku cadang (parts) dari Warehouse</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <form onSubmit={submit} className="space-y-6">
            
            {/* Context Info (If Linked to Job) */}
            {jobId && (
              <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-4 flex gap-4 items-start">
                <div className="p-2 bg-violet-100 text-violet-600 rounded-lg shrink-0 mt-0.5">
                  <Wrench className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-violet-900 flex items-center gap-2">
                    Terkait Pekerjaan Perbaikan
                  </h3>
                  {loadingJob ? (
                    <p className="text-sm text-violet-600/70 animate-pulse">Memuat data tiket...</p>
                  ) : jobDetail ? (
                    <div className="text-sm text-violet-800/80">
                      <p>Tiket: <strong>{jobDetail.helpdeskTicketNumber}</strong></p>
                      <p>SN Radio: <strong>{jobDetail.radioSerialNumber}</strong> {jobDetail.equipmentName ? `— ${jobDetail.equipmentName}` : ''}</p>
                      <p className="mt-1 line-clamp-1 opacity-80 italic">"{jobDetail.damageDescription}"</p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Pekerjaan tidak ditemukan (ID: {jobId})
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Nama / Deskripsi Part <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder="Contoh: Baterai Motorola XiR P8668i..." 
                    className="pl-9 h-11"
                    value={part}
                    onChange={(e) => setPart(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Kode Part (Opsional)</label>
                <Input 
                  placeholder="Contoh: PMNN4409BR" 
                  className="h-11 font-mono text-sm"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Kuantitas</label>
                <Input 
                  type="number" 
                  min={1} 
                  className="h-11"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Keperluan (Opsional)</label>
                <Textarea 
                  placeholder={jobId ? "Deskripsikan bagian spesifik yang rusak..." : "Tujuan penggunaan part..."}
                  rows={3}
                  className="resize-none"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} className="h-11 px-6">
                Batal
              </Button>
              <Button type="submit" disabled={submitting || !part.trim()} className="h-11 px-8 bg-violet-600 hover:bg-violet-700 font-semibold shadow-md shadow-violet-200">
                {submitting ? "Memproses..." : "Ajukan Peminjaman"}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
