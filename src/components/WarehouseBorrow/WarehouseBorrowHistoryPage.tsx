import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { History, Package, Search, Calendar, User, CheckCircle2, RotateCcw, PenTool, FileText, Trash2, Eye } from "lucide-react";
import { warehouseBorrowApi } from "../../services/warehouseBorrowApi";
import { workshopTechnicianApi, type WorkshopTechnicianDto } from "../../services/workshopTechnicianApi";
import type { WarehouseBorrowList } from "../../types/warehouseBorrow";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from "../../hooks/use-toast";
import { Textarea } from "../ui/textarea";
import SignaturePadField from "../common/SignaturePadField";
import WarehouseBorrowDetailModal from "./WarehouseBorrowDetailModal";
import { useAuth } from "../../contexts/AuthContext";
import { FormMobileSelect } from "../Radio/FormMobileSelect";

export default function WarehouseBorrowHistoryPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isWarehouse = user?.roleName?.toLowerCase() === "warehouse";
  const [items, setItems] = useState<WarehouseBorrowList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal States
  const [activeItem, setActiveItem] = useState<WarehouseBorrowList | null>(null);
  const [actionType, setActionType] = useState<"issue" | "return" | null>(null);
  
  // Users list for dropdown (Technicians)
  const [technicians, setTechnicians] = useState<WorkshopTechnicianDto[]>([]);

  useEffect(() => {
    workshopTechnicianApi.getAllActive()
      .then((res) => setTechnicians(res.data?.data ?? []))
      .catch(console.error);
  }, []);
  
  // Return form state
  const [returnCondition, setReturnCondition] = useState("Good");
  const [returnNote, setReturnNote] = useState("");
  const [returnedByName, setReturnedByName] = useState("");
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Signature state
  const [issuerSigned, setIssuerSigned] = useState<string | null>(null);
  const [receiverSigned, setReceiverSigned] = useState<string | null>(null);
  const [returnIssuerSigned, setReturnIssuerSigned] = useState<string | null>(null);
  const [returnReceiverSigned, setReturnReceiverSigned] = useState<string | null>(null);

  // Detail & Delete States
  const [detailTargetId, setDetailTargetId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WarehouseBorrowList | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    setReturnedByName(item.borrowerName || item.borrowedByName);
  };

  const closeDialog = () => {
    setActiveItem(null);
    setActionType(null);
    setIssuerSigned(null);
    setReceiverSigned(null);
    setReturnIssuerSigned(null);
    setReturnReceiverSigned(null);
  };

  const handleIssue = async () => {
    if (!activeItem) return;
    if (!issuerSigned || !receiverSigned) {
      toast({ title: "Tanda Tangan Belum Lengkap", description: "Kedua pihak (Admin & Teknisi) wajib menandatangani form penyerahan.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await warehouseBorrowApi.issue(activeItem.id, {
        issuerSignatureBase64: issuerSigned,
        receiverSignatureBase64: receiverSigned,
      });
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
    if (!returnIssuerSigned || !returnReceiverSigned) {
      toast({ title: "Tanda Tangan Belum Lengkap", description: "Kedua pihak (Admin & Teknisi) wajib menandatangani form pengembalian.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await warehouseBorrowApi.return(activeItem.id, {
        returnCondition,
        returnNote,
        returnIssuerSignatureBase64: returnIssuerSigned ?? undefined,
        returnReceiverSignatureBase64: returnReceiverSigned ?? undefined,
        returnedByName: returnedByName.trim() || undefined,
      });
      toast({ title: "Berhasil", description: "Pengembalian part berhasil dicatat." });
      closeDialog();
      loadData();
    } catch (err: any) {
      toast({ title: "Gagal menyimpan data", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await warehouseBorrowApi.delete(deleteTarget.id);
      toast({ title: "Berhasil", description: "Data riwayat peminjaman berhasil dihapus." });
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      toast({ title: "Gagal menghapus", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  // Helper: get first item summary text
  const getItemsSummary = (b: WarehouseBorrowList) => {
    if (!b.items || b.items.length === 0) return "—";
    const first = b.items[0];
    const extra = b.items.length > 1 ? ` (+${b.items.length - 1} lainnya)` : "";
    return first.partDescription + extra;
  };

  const getTotalQty = (b: WarehouseBorrowList) => {
    if (!b.items) return 0;
    return b.items.reduce((sum, i) => sum + i.quantity, 0);
  };

  const filteredItems = items.filter((b) => {
    const s = search.toLowerCase();
    return (
      b.borrowNumber.toLowerCase().includes(s) ||
      b.borrowedByName.toLowerCase().includes(s) ||
      (b.borrowerName && b.borrowerName.toLowerCase().includes(s)) ||
      (b.relatedJobNumber && b.relatedJobNumber.toLowerCase().includes(s)) ||
      (b.ticketNumber && b.ticketNumber.toLowerCase().includes(s)) ||
      (b.items && b.items.some(
        (i) =>
          i.partDescription.toLowerCase().includes(s) ||
          (i.partCode && i.partCode.toLowerCase().includes(s))
      ))
    );
  });

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

  // Render items list for modals
  const renderItemsList = (b: WarehouseBorrowList) => (
    <div className="space-y-1.5">
      <span className="text-gray-500 block mb-1 text-sm">Barang yang dipinjam:</span>
      {b.items.map((item, idx) => (
        <div key={idx} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-gray-100">
          <div>
            <div className="font-semibold text-gray-900 text-sm">{item.partDescription}</div>
            {item.partCode && <div className="text-xs text-gray-500 font-mono">{item.partCode}</div>}
          </div>
          <span className="font-bold text-indigo-700 text-sm ml-3 shrink-0">x{item.quantity}</span>
        </div>
      ))}
    </div>
  );

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
        
        {/* Search inside Mobile Header */}
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

            {/* Baris 2: Items summary */}
            <div>
              <p className="text-sm font-bold text-gray-900">{getItemsSummary(b)}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {b.borrowNumber} • {b.items?.length ?? 0} barang • Total Qty: x{getTotalQty(b)}
              </p>
            </div>

            {/* Baris 3: Detail grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5">
              <div><span className="text-gray-400">Teknisi:</span> {b.borrowerName || b.borrowedByName}</div>
              <div><span className="text-gray-400">Barang:</span> {b.items?.length ?? 0} item</div>
              {b.relatedJobNumber && (
                <div className="col-span-2"><span className="text-gray-400">Job:</span> <span className="font-mono text-blue-700">{b.relatedJobNumber}</span></div>
              )}
            </div>

            {/* Baris 4: Footer aksi */}
            <div className="pt-3 mt-1 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
                {b.relatedJobNumber && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200">
                    {b.relatedJobNumber}
                  </span>
                )}
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                  onClick={() => setDetailTargetId(b.id)}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" /> Detail
                </Button>
                {b.status === "Approved" && isWarehouse && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-indigo-700 border-indigo-300 hover:bg-indigo-600 hover:text-white"
                    onClick={() => openIssue(b)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Serahkan
                  </Button>
                )}
                {b.status === "Issued" && isWarehouse && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-emerald-700 border-emerald-300 hover:bg-emerald-600 hover:text-white"
                    onClick={() => openReturn(b)}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Terima Pengembalian
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
                <th className="px-4 py-3.5 whitespace-nowrap">Barang Dipinjam</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">Jml</th>
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
                      <div className="font-medium text-gray-900">{getItemsSummary(b)}</div>
                      {b.items && b.items.length > 1 && (
                        <div className="text-xs text-violet-600 mt-0.5">{b.items.length} barang dipinjam</div>
                      )}
                      {b.items?.[0]?.partCode && <div className="text-xs text-gray-500 mt-0.5 font-mono">{b.items[0].partCode}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs">
                        x{getTotalQty(b)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium">{b.borrowerName || b.borrowedByName}</span>
                        </div>
                        {b.borrowerName && b.borrowerName !== b.borrowedByName && (
                          <span className="text-[10px] text-gray-400 ml-5">via: {b.borrowedByName}</span>
                        )}
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
                      <div className="flex justify-end items-center gap-1">
                        <button
                          title="Detail"
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors"
                          onClick={() => setDetailTargetId(b.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {b.status === "Approved" && isWarehouse && (
                          <button
                            title="Serahkan Part"
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 transition-colors"
                            onClick={() => openIssue(b)}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {b.status === "Issued" && isWarehouse && (
                          <button
                            title="Terima Pengembalian"
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-emerald-600 hover:text-white hover:bg-emerald-600 border border-emerald-200 transition-colors"
                            onClick={() => openReturn(b)}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <div className="w-px h-5 bg-gray-200 mx-0.5" />
                        <button
                          title="Hapus"
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => setDeleteTarget(b)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Serahkan Part (Issue) + Signature */}
      <Dialog open={actionType === "issue" && !!activeItem} onOpenChange={(open) => {
        if (!open) {
          closeDialog();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-indigo-600" />
              Penyerahan Part ke Teknisi
            </DialogTitle>
            <DialogDescription>
              Konfirmasi penyerahan dan tanda tangan kedua belah pihak.
            </DialogDescription>
          </DialogHeader>

          {activeItem && (
            <div className="space-y-4 my-2">
              {/* Info ringkas */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm space-y-2">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Nomor Transaksi</span>
                  <span className="font-mono font-semibold">{activeItem.borrowNumber}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2 pt-1">
                  <span className="text-gray-500">Teknisi Penerima</span>
                  <span className="font-semibold">{activeItem.borrowerName || activeItem.borrowedByName}</span>
                </div>
                <div className="pt-1">
                  {renderItemsList(activeItem)}
                </div>
              </div>

              {/* Dual Signature */}
              <div className="space-y-4">
                <SignaturePadField label="TTD Penyerah" required value={issuerSigned} onChange={setIssuerSigned} signerName={user?.fullName || "Admin Warehouse"} />
                <SignaturePadField label="TTD Penerima" required value={receiverSigned} onChange={setReceiverSigned} signerName={activeItem.borrowerName || activeItem.borrowedByName} />
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

      {/* Modal Pengembalian Part (Return) + Signature */}
      <Dialog open={actionType === "return" && !!activeItem} onOpenChange={(open) => {
        if (!open) {
          closeDialog();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-emerald-600" />
              Terima Pengembalian Part
            </DialogTitle>
            <DialogDescription>
              Catat penerimaan pengembalian part dari teknisi kembali ke warehouse.
            </DialogDescription>
          </DialogHeader>
          
          {activeItem && (
            <div className="space-y-5 my-2">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm space-y-2">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Peminjam Awal</span>
                  <span className="font-semibold">{activeItem.borrowerName || activeItem.borrowedByName}</span>
                </div>
                <div className="pt-1">
                  {renderItemsList(activeItem)}
                </div>
              </div>

              {/* Nama Pengembali */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Dikembalikan Oleh</label>
                <div className="relative">
                  <FormMobileSelect
                    value={returnedByName}
                    onChange={setReturnedByName}
                    options={technicians.map((t) => t.name)}
                    placeholder="Nama teknisi yang mengembalikan..."
                    label="Pilih Teknisi Pengembali"
                    color="emerald"
                  />
                </div>
                
                {returnedByName && returnedByName !== (activeItem.borrowerName || activeItem.borrowedByName) && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    ⚠️ Berbeda dari peminjam asli ({activeItem.borrowerName || activeItem.borrowedByName})
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Kondisi Barang Saat Dikembalikan <span className="text-red-500">*</span></label>
                  <Select value={returnCondition} onValueChange={setReturnCondition}>
                    <SelectTrigger className="w-full h-10 border-gray-300 focus:ring-emerald-500 focus:border-emerald-500">
                      <SelectValue placeholder="Pilih kondisi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Good">Good (Kondisi Baik)</SelectItem>
                      <SelectItem value="Damaged">Damaged (Rusak / Bekas Pakai)</SelectItem>
                      <SelectItem value="Incomplete">Incomplete (Tidak Lengkap)</SelectItem>
                    </SelectContent>
                  </Select>
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

                {/* Return Dual Signature */}
                <div className="space-y-4">
                  <SignaturePadField label="TTD Penyerah" required value={returnIssuerSigned} onChange={setReturnIssuerSigned} signerName={user?.fullName || "Admin Warehouse"} />
                  <SignaturePadField label="TTD Penerima" required value={returnReceiverSigned} onChange={setReturnReceiverSigned} signerName={returnedByName || activeItem.borrowerName || activeItem.borrowedByName} />
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

      {/* Modal Detail Peminjaman */}
      <WarehouseBorrowDetailModal 
        borrowId={detailTargetId}
        isOpen={!!detailTargetId}
        onClose={() => setDetailTargetId(null)}
      />

      {/* Dialog Hapus Riwayat */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm bg-white p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Hapus Riwayat</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data riwayat peminjaman ini? Data yang dihapus tidak akan ditampilkan lagi.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-100 mt-2">
              <p className="text-sm font-semibold text-gray-900">{deleteTarget.borrowNumber}</p>
              <p className="text-xs text-gray-500">{deleteTarget.borrowerName || deleteTarget.borrowedByName}</p>
            </div>
          )}
          <DialogFooter className="mt-4 border-t border-gray-100 pt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
