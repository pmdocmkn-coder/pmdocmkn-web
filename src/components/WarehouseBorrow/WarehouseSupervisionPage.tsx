import { useEffect, useState } from "react";
import { warehouseBorrowApi } from "../../services/warehouseBorrowApi";
import type { WarehouseBorrowList } from "../../types/warehouseBorrow";
import { useToast } from "../../hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardCheck, PackageSearch, AlertTriangle, ArrowRight, User, ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";

export default function WarehouseSupervisionPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
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
    setTimeout(() => load(), 500);
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
      {/* ====== MOBILE INTEGRATED HEADER ====== */}
      <div className="md:hidden bg-white rounded-[14px] border border-[#E2E8F0] shadow-sm mb-4">
        <div className="flex items-start gap-4 p-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#FFFBEB] flex items-center justify-center flex-shrink-0">
            <ClipboardCheck className="w-5 h-5 text-[#F59E0B]" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#F59E0B] tracking-[0.1em] uppercase mb-0.5">Warehouse</p>
            <h1 className="text-[20px] font-bold text-[#1A202C] leading-tight">Supervisi Warehouse</h1>
            <p className="text-[12px] text-[#718096] mt-0.5">Persetujuan pengajuan peminjaman tools</p>
          </div>
          <button
            onClick={() => navigate("/warehouse")}
            className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-[#F7F8FA] border border-[#E2E8F0] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <div className="px-4 pb-4">
          <div className="bg-[#FFFBEB] px-4 py-2.5 rounded-[10px] border border-amber-200 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <span className="text-amber-800 font-bold text-[13px]">{pending.length} Menunggu Approval</span>
          </div>
        </div>
      </div>

      {/* ====== DESKTOP HEADER ====== */}
      <div className="hidden md:flex flex-row items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-[14px] border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#F0FFF4] flex items-center justify-center flex-shrink-0">
            <ClipboardCheck className="w-5 h-5 text-[#059669]" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-[#1A202C] tracking-tight">Supervisi Warehouse</h1>
            <p className="text-[12px] text-[#718096] mt-0.5">Persetujuan pengajuan peminjaman tools</p>
          </div>
        </div>
        <div className="bg-[#FFFBEB] px-4 py-2 rounded-[10px] border border-amber-200 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <span className="text-amber-800 font-bold text-[13px]">{pending.length} Menunggu Approval</span>
        </div>
      </div>

      {/* List Content */}
      {loading ? (
        <div className="text-center py-12 text-[#718096] bg-white rounded-[14px] border border-[#E2E8F0] shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B6CB0] mx-auto mb-3" />
          Memuat data...
        </div>
      ) : pending.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[14px] border border-[#E2E8F0] shadow-sm">
          <PackageSearch className="w-14 h-14 text-[#E2E8F0] mx-auto mb-4" />
          <h3 className="text-[16px] font-semibold text-[#1A202C]">Tidak ada pengajuan pending</h3>
          <p className="text-[#718096] text-[13px] mt-1">Semua permintaan peminjaman sudah diproses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {pending.map((b) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-[#E2E8F0] rounded-[10px] overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="p-4 border-b border-[#E2E8F0] bg-[#F7F8FA] flex justify-between items-center">
                  <span className="font-mono text-[11px] font-semibold text-[#718096] bg-white border border-[#E2E8F0] px-2 py-1 rounded-[6px]">
                    {b.borrowNumber}
                  </span>
                  <span className="text-[11px] text-[#718096] font-medium">
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
                        <p className="text-sm font-semibold text-gray-900 truncate">{b.borrowerName || b.borrowedByName}</p>
                        {b.borrowerName && b.borrowerName !== b.borrowedByName && (
                           <p className="text-[10px] text-gray-400 truncate">via: {b.borrowedByName}</p>
                        )}
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
            <DialogTitle>Review Pengajuan Tools</DialogTitle>
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
                  <div className="text-right">
                    <div className="font-semibold">{activeItem.borrowerName || activeItem.borrowedByName}</div>
                    {activeItem.borrowerName && activeItem.borrowerName !== activeItem.borrowedByName && (
                      <div className="text-[10px] text-gray-500 -mt-0.5">via: {activeItem.borrowedByName}</div>
                    )}
                  </div>
                </div>
                <div className="pt-1">
                  <span className="text-gray-500 block mb-1">Tools yang dipinjam:</span>
                  {activeItem.items && activeItem.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-gray-100 mb-1">
                      <div>
                        <div className="font-semibold text-gray-900">{item.partDescription}</div>
                        {item.partCode && <div className="text-xs text-gray-500 font-mono">{item.partCode}</div>}
                      </div>
                      <span className="font-bold text-violet-700 ml-2">
                        x{item.quantity}{item.unit ? ` ${item.unit}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
                {activeItem.relatedJobNumber && (
                  <div className="pt-2 border-t border-gray-200 mt-2">
                    <span className="text-gray-500 block">Terkait Pekerjaan:</span>
                    <span className="font-mono font-semibold text-blue-700">{activeItem.relatedJobNumber}</span>
                  </div>
                )}
                {activeItem.purpose && (
                  <div className="pt-2 border-t border-gray-200 mt-2">
                    <span className="text-gray-500 block mb-1">Keperluan:</span>
                    <p className="text-sm text-gray-800 italic bg-white rounded-lg px-3 py-2 border border-gray-100">"{activeItem.purpose}"</p>
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
