import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Loader2, Package, Calendar, User, FileText, CheckCircle2, RotateCcw, PenTool } from "lucide-react";
import { warehouseBorrowApi } from "../../services/warehouseBorrowApi";
import type { WarehouseBorrowDetail } from "../../types/warehouseBorrow";

interface WarehouseBorrowDetailModalProps {
  borrowId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function WarehouseBorrowDetailModal({ borrowId, isOpen, onClose }: WarehouseBorrowDetailModalProps) {
  const [data, setData] = useState<WarehouseBorrowDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && borrowId) {
      setLoading(true);
      warehouseBorrowApi.getById(borrowId)
        .then(res => setData(res))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [borrowId, isOpen]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PendingApproval": return "bg-amber-100 text-amber-700";
      case "Approved": return "bg-emerald-100 text-emerald-700";
      case "Rejected": return "bg-red-100 text-red-700";
      case "Issued": return "bg-blue-100 text-blue-700";
      case "Returned": return "bg-indigo-100 text-indigo-700";
      case "Cancelled": return "bg-slate-100 text-slate-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PendingApproval": return "Menunggu Approval";
      case "Approved": return "Disetujui";
      case "Rejected": return "Ditolak";
      case "Issued": return "Diberikan";
      case "Returned": return "Dikembalikan";
      case "Cancelled": return "Dibatalkan";
      default: return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-0 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Detail Peminjaman
            {data && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(data.status)}`}>
                {getStatusLabel(data.status)}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {data?.borrowNumber || "Memuat..."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-sm text-gray-500">Memuat detail...</span>
            </div>
          ) : !data ? (
            <div className="text-center py-12 text-gray-500">Gagal memuat data atau data tidak ditemukan.</div>
          ) : (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1"><User className="w-3.5 h-3.5"/> Peminjam</span>
                  <p className="font-semibold text-gray-900">{data.borrowerName || data.borrowedByName}</p>
                  {data.borrowerName && data.borrowerName !== data.borrowedByName && (
                    <p className="text-[10px] text-gray-500">via akun: {data.borrowedByName}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> Tanggal Diajukan</span>
                  <p className="text-sm font-semibold text-gray-800">
                    {format(new Date(data.requestedAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1"><FileText className="w-3.5 h-3.5"/> No. Tiket</span>
                  <p className="text-sm font-semibold text-indigo-600">{data.ticketNumber || data.relatedJobNumber || "—"}</p>
                </div>

                {/* Dipinjam sejak + durasi — hanya tampil jika sudah Issued atau Returned */}
                {data.issuedAt && (
                  <div className="col-span-2 md:col-span-3 border-t border-gray-200 pt-3 mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5"/> Dipinjam sejak
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-800">
                        {format(new Date(data.issuedAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        data.status === "Returned"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {(() => {
                          const from = new Date(data.issuedAt);
                          const until = data.returnedAt ? new Date(data.returnedAt) : new Date();
                          const diffMs = until.getTime() - from.getTime();
                          const diffH = Math.floor(diffMs / 3600000);
                          const diffD = Math.floor(diffH / 24);
                          const remH = diffH % 24;
                          if (data.status === "Returned") {
                            if (diffD > 0) return `Dipinjam ${diffD} hari${remH > 0 ? ` ${remH} jam` : ""}`;
                            return `Dipinjam ${diffH} jam`;
                          }
                          if (diffD > 0) return `${diffD} hari${remH > 0 ? ` ${remH} jam` : ""} yang lalu`;
                          if (diffH > 0) return `${diffH} jam yang lalu`;
                          const diffMin = Math.floor(diffMs / 60000);
                          return `${diffMin} menit yang lalu`;
                        })()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="col-span-2 md:col-span-3 border-t border-gray-200 pt-3 mt-1 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Pengembali / Penerima Akhir</p>
                    <p className="font-semibold text-gray-900">
                      {data.returnedByName || (data.status === "Returned" ? (data.borrowerName || data.borrowedByName) : "—")}
                    </p>
                    {data.returnedByName && data.returnedByName !== (data.borrowerName || data.borrowedByName) && (
                      <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5">
                            ⚠️ {data.returnedByName} <span className="text-xs font-normal text-gray-500">(bukan peminjam asli: {data.borrowerName || data.borrowedByName})</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-indigo-500" />
                  Daftar Part
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Part Code</th>
                        <th className="px-4 py-2 text-left font-medium">Deskripsi</th>
                        <th className="px-4 py-2 text-right font-medium">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 font-mono text-xs">{item.partCode || "—"}</td>
                          <td className="px-4 py-2.5 font-medium">{item.partDescription}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-indigo-600">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {data.purpose && (
                  <p className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100 italic">
                    "<span className="font-medium text-gray-800">{data.purpose}</span>"
                  </p>
                )}
              </div>

              {/* Return Info if applicable */}
              {data.status === "Returned" && (
                <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                  <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-indigo-600" />
                    Informasi Pengembalian
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                    <div>
                      <span className="text-gray-500 text-xs uppercase font-medium">Kondisi</span>
                      <p className="font-semibold text-gray-800">{data.returnCondition || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs uppercase font-medium">Tanggal Kembali</span>
                      <p className="font-semibold text-gray-800">
                        {data.returnedAt ? format(new Date(data.returnedAt), "dd MMM yyyy, HH:mm", { locale: localeId }) : "—"}
                      </p>
                    </div>
                    {data.returnNote && (
                      <div className="col-span-2">
                        <span className="text-gray-500 text-xs uppercase font-medium">Catatan Pengembalian</span>
                        <p className="text-gray-700 bg-white p-2 rounded-lg mt-1 border border-indigo-100/50">{data.returnNote}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Signatures */}
              {(data.issuerSignatureBase64 || data.receiverSignatureBase64) && (
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-indigo-500" />
                    Tanda Tangan Penyerahan
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-xl p-3 bg-white text-center">
                      <p className="text-xs font-semibold text-gray-500 mb-2">TTD Penyerah</p>
                      {data.issuerSignatureBase64 ? (
                        <img src={data.issuerSignatureBase64} alt="TTD Admin" className="h-16 mx-auto object-contain mix-blend-multiply" />
                      ) : (
                        <div className="h-16 flex items-center justify-center text-gray-300 text-xs italic">Belum TTD</div>
                      )}
                      <p className="text-xs font-medium text-gray-700 mt-1.5 border-t border-gray-100 pt-1.5">
                        {data.statusLogs.find(l => l.toStatus === "Issued")?.userName || "—"}
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-3 bg-white text-center">
                      <p className="text-xs font-semibold text-gray-500 mb-2">TTD Penerima</p>
                      {data.receiverSignatureBase64 ? (
                        <img src={data.receiverSignatureBase64} alt="TTD Teknisi" className="h-16 mx-auto object-contain mix-blend-multiply" />
                      ) : (
                        <div className="h-16 flex items-center justify-center text-gray-300 text-xs italic">Belum TTD</div>
                      )}
                      <p className="text-xs font-medium text-gray-700 mt-1.5 border-t border-gray-100 pt-1.5">
                        {data.borrowerName || data.borrowedByName}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Return Signatures */}
              {(data.returnIssuerSignatureBase64 || data.returnReceiverSignatureBase64) && (
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-emerald-500" />
                    Tanda Tangan Pengembalian
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-xl p-3 bg-white text-center">
                      <p className="text-xs font-semibold text-gray-500 mb-2">TTD Penyerah</p>
                      {data.returnReceiverSignatureBase64 ? (
                        <img src={data.returnReceiverSignatureBase64} alt="TTD Teknisi Return" className="h-16 mx-auto object-contain mix-blend-multiply" />
                      ) : (
                        <div className="h-16 flex items-center justify-center text-gray-300 text-xs italic">Belum TTD</div>
                      )}
                      <p className="text-xs font-medium text-gray-700 mt-1.5 border-t border-gray-100 pt-1.5">
                        {data.returnedByName || data.borrowerName || data.borrowedByName}
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-3 bg-white text-center">
                      <p className="text-xs font-semibold text-gray-500 mb-2">TTD Penerima</p>
                      {data.returnIssuerSignatureBase64 ? (
                        <img src={data.returnIssuerSignatureBase64} alt="TTD Admin Return" className="h-16 mx-auto object-contain mix-blend-multiply" />
                      ) : (
                        <div className="h-16 flex items-center justify-center text-gray-300 text-xs italic">Belum TTD</div>
                      )}
                      <p className="text-xs font-medium text-gray-700 mt-1.5 border-t border-gray-100 pt-1.5">
                        {data.statusLogs.find(l => l.toStatus === "Returned")?.userName || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Logs */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-4">Riwayat Status</h4>
                <div className="space-y-4">
                  {data.statusLogs.map((log, i) => (
                    <div key={log.id} className="flex gap-4 relative">
                      {i !== data.statusLogs.length - 1 && (
                        <div className="absolute left-2.5 top-6 w-0.5 h-full bg-gray-200 -ml-px z-0" />
                      )}
                      <div className="relative z-10 shrink-0">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center ring-4 ring-white">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        </div>
                      </div>
                      <div className="pb-1">
                        <div className="flex items-baseline gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(log.toStatus)}`}>
                            {getStatusLabel(log.toStatus)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {format(new Date(log.at), "dd MMM yyyy, HH:mm", { locale: localeId })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Oleh: <span className="font-medium text-gray-800">{log.userName}</span></p>
                        {log.note && (
                          <p className="text-sm text-gray-500 italic mt-0.5">{log.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <Button variant="outline" onClick={onClose} className="min-w-24">Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
