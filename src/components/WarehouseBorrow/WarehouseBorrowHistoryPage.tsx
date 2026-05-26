import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { History, Package, Search, Calendar, User, CheckCircle2, RotateCcw } from "lucide-react";
import { warehouseBorrowApi } from "../../services/warehouseBorrowApi";
import type { WarehouseBorrowList } from "../../types/warehouseBorrow";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { useToast } from "../../hooks/use-toast";
import { Textarea } from "../ui/textarea";

export default function WarehouseBorrowHistoryPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<WarehouseBorrowList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal States
  const [activeItem, setActiveItem] = useState<WarehouseBorrowList | null>(null);
  const [actionType, setActionType] = useState<"issue" | "return" | null>(null);
  
  // Return form state
  const [returnCondition, setReturnCondition] = useState("Good");
  const [returnNote, setReturnNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    setLoading(true);
    warehouseBorrowApi
      .getAll({ page: 1, pageSize: 100 })
      .then((r) => setItems(r.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openIssue = (item: WarehouseBorrowList) => {
    setActiveItem(item);
    setActionType("issue");
  };

  const openReturn = (item: WarehouseBorrowList) => {
    setActiveItem(item);
    setActionType("return");
    setReturnCondition("Good");
    setReturnNote("");
  };

  const closeDialog = () => {
    setActiveItem(null);
    setActionType(null);
  };

  const handleIssue = async () => {
    if (!activeItem) return;
    setSubmitting(true);
    try {
      await warehouseBorrowApi.issue(activeItem.id);
      toast({ title: "Berhasil", description: "Status part berhasil diubah menjadi Telah Diberikan (Issued)." });
      closeDialog();
      loadData();
    } catch {
      toast({ title: "Gagal", description: "Terjadi kesalahan saat memproses data.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async () => {
    if (!activeItem) return;
    setSubmitting(true);
    try {
      await warehouseBorrowApi.return(activeItem.id, { returnCondition, returnNote });
      toast({ title: "Berhasil", description: "Part berhasil dikembalikan ke Warehouse." });
      closeDialog();
      loadData();
    } catch {
      toast({ title: "Gagal", description: "Terjadi kesalahan saat memproses data.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter((b) => 
    b.borrowNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.partDescription.toLowerCase().includes(search.toLowerCase()) ||
    b.borrowedByName.toLowerCase().includes(search.toLowerCase()) ||
    (b.relatedJobNumber && b.relatedJobNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PendingApproval":
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-semibold whitespace-nowrap">Menunggu Persetujuan</span>;
      case "Approved":
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold whitespace-nowrap">Disetujui</span>;
      case "Rejected":
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold whitespace-nowrap">Ditolak</span>;
      case "Issued":
        return <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold whitespace-nowrap">Telah Diberikan</span>;
      case "Returned":
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-semibold whitespace-nowrap">Dikembalikan</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold whitespace-nowrap">{status}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* ====== MOBILE INTEGRATED HEADER ====== */}
      <div className="md:hidden -mx-4 -mt-4 mb-4 px-4 pt-4 pb-4 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] rounded-b-3xl">
        <div className="flex items-start justify-between pb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1 opacity-80">
              <span className="text-[10px] font-bold text-violet-600 tracking-wider uppercase">Warehouse</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
              Histori Peminjaman
            </h1>
          </div>
          <button
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center hover:bg-violet-100 transition-colors shrink-0"
          >
            <History className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Search inside Mobile Header like Radio Mgmt */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-600" />
          <Input 
            placeholder="Cari transaksi, part, atau teknisi..." 
            className="pl-10 pr-4 py-2.5 h-10 border-none rounded-xl focus:ring-2 focus:ring-violet-500 text-sm bg-violet-50 text-gray-900 placeholder-violet-400 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Page Header (Desktop) ── */}
      <div className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-violet-100 rounded-xl">
            <History className="w-8 h-8 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Histori Peminjaman Part</h1>
            <p className="text-sm text-gray-500 mt-0.5">Daftar lengkap riwayat permintaan dan transaksi parts</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Cari transaksi, part, atau teknisi..." 
            className="pl-9 h-10 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Mobile Card View ── */}
      <div className="md:hidden flex flex-col gap-3 mt-4">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div></div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
            Tidak ada data peminjaman
          </div>
        ) : filteredItems.map((b) => (
          <div key={b.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2">
            {/* Baris 1: Status badge + Tanggal */}
            <div className="flex justify-between items-start">
              {getStatusBadge(b.status)}
              <span className="text-xs text-gray-400 font-medium">
                {format(new Date(b.requestedAt), "dd MMM yyyy", { locale: localeId })}
              </span>
            </div>

            {/* Baris 2: Info utama */}
            <div>
              <p className="text-sm font-bold text-gray-900">{b.partDescription}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {b.borrowNumber} • Qty: x{b.quantity}
                {b.partCode && ` • ${b.partCode}`}
              </p>
            </div>

            {/* Baris 3: Detail grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5">
              <div><span className="text-gray-400">Teknisi:</span> {b.borrowedByName}</div>
              <div><span className="text-gray-400">Qty:</span> x{b.quantity}</div>
              {b.relatedJobNumber && (
                <div className="col-span-2"><span className="text-gray-400">Job:</span> <span className="font-mono text-blue-700">{b.relatedJobNumber}</span></div>
              )}
            </div>

            {/* Baris 4: Footer aksi */}
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {b.relatedJobNumber && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200">
                    {b.relatedJobNumber}
                  </span>
                )}
              </div>
              <div className="flex gap-1 shrink-0 ml-auto">
                {b.status === "Approved" && (
                  <Button variant="ghost" size="sm" className="text-indigo-700" onClick={() => openIssue(b)}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Serahkan
                  </Button>
                )}
                {b.status === "Issued" && (
                  <Button variant="ghost" size="sm" className="text-emerald-700" onClick={() => openReturn(b)}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Kembalikan
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Data Table (Desktop) ── */}
      <div className="hidden md:block rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 text-left text-xs font-semibold text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3.5 whitespace-nowrap">No Transaksi</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Deskripsi Part</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">Qty</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Teknisi</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Terkait Pekerjaan</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Tanggal</th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
                      <span className="text-sm text-gray-400">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-10 h-10 opacity-20" />
                      <span className="text-sm">Tidak ada data ditemukan</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((b) => (
                  <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                        {b.borrowNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 min-w-[200px]">
                      <div className="font-medium text-gray-900">{b.partDescription}</div>
                      {b.partCode && <div className="text-xs text-gray-500 mt-0.5">{b.partCode}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs">
                        x{b.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium">{b.borrowedByName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(b.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {b.relatedJobNumber ? (
                        <span className="text-xs font-mono font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                          {b.relatedJobNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(b.requestedAt), "dd MMM yyyy", { locale: localeId })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {b.status === "Approved" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-8 text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 border-indigo-200"
                          onClick={() => openIssue(b)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Serahkan
                        </Button>
                      )}
                      {b.status === "Issued" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-8 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200"
                          onClick={() => openReturn(b)}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Kembalikan
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Serahkan Part (Issue) */}
      <Dialog open={actionType === "issue" && !!activeItem} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Penyerahan Part ke Teknisi</DialogTitle>
            <DialogDescription>
              Konfirmasi penyerahan part kepada teknisi. Pastikan fisik barang sudah diberikan sesuai kuantitas.
            </DialogDescription>
          </DialogHeader>
          
          {activeItem && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm space-y-2 my-4">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Nomor Transaksi</span>
                <span className="font-mono font-semibold">{activeItem.borrowNumber}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2 pt-1">
                <span className="text-gray-500">Teknisi Penerima</span>
                <span className="font-semibold">{activeItem.borrowedByName}</span>
              </div>
              <div className="pt-1">
                <span className="text-gray-500 block mb-1">Part yang diserahkan:</span>
                <div className="font-semibold text-gray-900">{activeItem.partDescription}</div>
                <div className="text-gray-500 flex justify-between mt-1">
                  <span>{activeItem.partCode || "-"}</span>
                  <span className="font-bold text-indigo-700">x{activeItem.quantity}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Batal</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white" 
              onClick={handleIssue} 
              disabled={submitting}
            >
              {submitting ? "Memproses..." : "Konfirmasi Penyerahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Pengembalian Part (Return) */}
      <Dialog open={actionType === "return" && !!activeItem} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Terima Pengembalian Part</DialogTitle>
            <DialogDescription>
              Catat penerimaan pengembalian part dari teknisi kembali ke warehouse.
            </DialogDescription>
          </DialogHeader>
          
          {activeItem && (
            <div className="space-y-5 my-2">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm space-y-2">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Dari Teknisi</span>
                  <span className="font-semibold">{activeItem.borrowedByName}</span>
                </div>
                <div className="pt-1 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-900 line-clamp-1">{activeItem.partDescription}</div>
                  </div>
                  <span className="font-bold text-emerald-700 ml-2">x{activeItem.quantity}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Kondisi Barang Saat Dikembalikan <span className="text-red-500">*</span></label>
                  <select 
                    className="w-full border-gray-300 rounded-md shadow-sm h-10 px-3 text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white border"
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value)}
                  >
                    <option value="Good">Good (Kondisi Baik)</option>
                    <option value="Damaged">Damaged (Rusak / Bekas Pakai)</option>
                    <option value="Incomplete">Incomplete (Tidak Lengkap)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Catatan Pengembalian (Opsional)</label>
                  <Textarea 
                    placeholder="Catatan tambahan dari warehouse admin..." 
                    className="h-20 resize-none focus-visible:ring-emerald-500"
                    value={returnNote}
                    onChange={(e) => setReturnNote(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Batal</Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white" 
              onClick={handleReturn} 
              disabled={submitting}
            >
              {submitting ? "Memproses..." : "Terima Pengembalian"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
