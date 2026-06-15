import { useEffect, useState } from "react";
import { warehouseBorrowApi } from "../../services/warehouseBorrowApi";
import type { WarehouseBorrowList } from "../../types/warehouseBorrow";
import { useToast } from "../../hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardCheck, PackageSearch, AlertTriangle, ArrowRight, User } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";

export default function WarehouseSupervisionPage() {
  const { toast } = useToast();
  const [pending, setPending] = useState<WarehouseBorrowList[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [activeItem, setActiveItem] = useState<WarehouseBorrowList | null>(null);
  const [note, setNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    warehouseBorrowApi
      .getPending()
      .then((list) => setPending(list ?? []))
      .catch(() => {
        toast({ title: "Gagal memuat data", variant: "destructive" });
        setPending([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Live refresh saat ada perubahan data warehouse borrow dari user lain
  useLiveRefresh("WarehouseBorrow", () => {
    load();
  });

  const closeReview = () => {
    setActiveItem(null);
    setNote("");
    setRejectReason("");
  };

  const approve = async (id: number) => {
    setSubmitting(true);
    try {
      await warehouseBorrowApi.approve(id, note || undefined);
      toast({ title: "Peminjaman Disetujui", description: "Status diubah menjadi menunggu pengambilan." });
      closeReview();
      load();
    } catch {
      toast({ title: "Gagal menyetujui", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const reject = async (id: number) => {
    if (!rejectReason.trim()) {
      toast({ title: "Alasan tolak wajib diisi", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await warehouseBorrowApi.reject(id, rejectReason);
      toast({ title: "Peminjaman Ditolak", description: "Permintaan telah ditolak." });
      closeReview();
      load();
    } catch {
      toast({ title: "Gagal menolak", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-violet-100 rounded-xl">
            <ClipboardCheck className="w-8 h-8 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Supervisi Warehouse</h1>
            <p className="text-sm text-gray-500 mt-0.5">Persetujuan pengajuan peminjaman parts</p>
          </div>
        </div>
        <div className="bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <span className="text-amber-800 font-bold text-sm">{pending.length} Menunggu Approval</span>
        </div>
      </div>

      {/* List Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          Memuat data...
        </div>
      ) : pending.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <PackageSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Tidak ada pengajuan pending</h3>
          <p className="text-gray-500 text-sm mt-1">Semua permintaan peminjaman sudah diproses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {pending.map((b) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <span className="font-mono text-xs font-semibold text-gray-600 bg-gray-200/60 px-2 py-1 rounded-md">
                    {b.borrowNumber}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {format(new Date(b.requestedAt), "dd MMM yyyy", { locale: localeId })}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-2" title={b.items?.[0]?.partDescription ?? "-"}>
                      {b.items?.[0]?.partDescription ?? "-"}{b.items && b.items.length > 1 ? ` (+${b.items.length - 1} lainnya)` : ""}
                    </h3>
                    <div className="text-sm text-gray-500 mt-1 flex items-center justify-between">
                      <span className="truncate">{b.items?.[0]?.partCode || "Tanpa kode part"}</span>
                      <span className="font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded text-xs">
                        {b.items?.length ?? 0} barang
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Teknisi</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{b.borrowedByName}</p>
                      </div>
                    </div>

                    {b.relatedJobNumber && (
                      <div className="bg-blue-50/60 text-blue-800 text-xs px-2.5 py-1.5 rounded-md border border-blue-100 font-medium truncate mb-3">
                        Terkait Job: {b.relatedJobNumber}
                      </div>
                    )}

                    <Button 
                      className="w-full bg-violet-600 hover:bg-violet-700" 
                      onClick={() => setActiveItem(b)}
                    >
                      Review Pengajuan <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Review Modal */}
      <Dialog open={!!activeItem} onOpenChange={(open) => !open && closeReview()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Pengajuan Part</DialogTitle>
          </DialogHeader>
          
          {activeItem && (
            <div className="space-y-5">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm space-y-2">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Nomor Transaksi</span>
                  <span className="font-mono font-semibold">{activeItem.borrowNumber}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2 pt-1">
                  <span className="text-gray-500">Teknisi</span>
                  <span className="font-semibold">{activeItem.borrowedByName}</span>
                </div>
                <div className="pt-1">
                  <span className="text-gray-500 block mb-1">Part yang dipinjam:</span>
                  {activeItem.items && activeItem.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-gray-100 mb-1">
                      <div>
                        <div className="font-semibold text-gray-900">{item.partDescription}</div>
                        {item.partCode && <div className="text-xs text-gray-500 font-mono">{item.partCode}</div>}
                      </div>
                      <span className="font-bold text-violet-700 ml-2">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
                {activeItem.relatedJobNumber && (
                  <div className="pt-2 border-t border-gray-200 mt-2">
                    <span className="text-gray-500 block">Terkait Pekerjaan:</span>
                    <span className="font-mono font-semibold text-blue-700">{activeItem.relatedJobNumber}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Keputusan Review</label>
                  <p className="text-xs text-gray-500">Pilih salah satu tindakan di bawah untuk memproses pengajuan ini.</p>
                </div>
                
                {/* Approve Form */}
                <div className="p-4 border border-emerald-200 bg-emerald-50/50 rounded-xl space-y-3">
                  <Textarea 
                    placeholder="Catatan persetujuan (opsional)..." 
                    className="h-20 resize-none bg-white border-emerald-200 focus-visible:ring-emerald-500"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    onClick={() => approve(activeItem.id)}
                    disabled={submitting}
                  >
                    {submitting ? "Memproses..." : "Setujui Peminjaman"}
                  </Button>
                </div>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-semibold uppercase">Atau Tolak</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                {/* Reject Form */}
                <div className="p-4 border border-red-200 bg-red-50/50 rounded-xl space-y-3">
                  <Textarea 
                    placeholder="Alasan tolak (wajib)..." 
                    className="h-20 resize-none bg-white border-red-200 focus-visible:ring-red-500"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="flex items-start gap-2 text-red-600 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Pastikan Anda telah mengisi alasan penolakan sebelum klik tolak.</span>
                  </div>
                  <Button 
                    className="w-full bg-red-600 hover:bg-red-700 text-white shadow-sm"
                    onClick={() => reject(activeItem.id)}
                    disabled={submitting || !rejectReason.trim()}
                    variant="destructive"
                  >
                    {submitting ? "Memproses..." : "Tolak Peminjaman"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
