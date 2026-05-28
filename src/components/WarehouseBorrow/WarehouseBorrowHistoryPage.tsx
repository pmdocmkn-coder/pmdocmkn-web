import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { History, Package, Search, Calendar, User, CheckCircle2, RotateCcw, PenTool, FileText, Trash2 } from "lucide-react";
import { warehouseBorrowApi } from "../../services/warehouseBorrowApi";
import type { WarehouseBorrowList } from "../../types/warehouseBorrow";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { useToast } from "../../hooks/use-toast";
import { Textarea } from "../ui/textarea";
import WarehouseBorrowDetailModal from "./WarehouseBorrowDetailModal";

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

  // Signature canvas refs & state
  const issuerCanvasRef = useRef<HTMLCanvasElement>(null);
  const receiverCanvasRef = useRef<HTMLCanvasElement>(null);
  const returnIssuerCanvasRef = useRef<HTMLCanvasElement>(null);
  const returnReceiverCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [issuerSigned, setIssuerSigned] = useState(false);
  const [receiverSigned, setReceiverSigned] = useState(false);
  const [returnIssuerSigned, setReturnIssuerSigned] = useState(false);
  const [returnReceiverSigned, setReturnReceiverSigned] = useState(false);

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
  };

  const closeDialog = () => {
    setActiveItem(null);
    setActionType(null);
  };

  const handleIssue = async () => {
    if (!activeItem) return;
    setSubmitting(true);
    try {
      const issuerSig = issuerCanvasRef.current?.toDataURL("image/png");
      const receiverSig = receiverCanvasRef.current?.toDataURL("image/png");
      await warehouseBorrowApi.issue(activeItem.id, {
        issuerSignatureBase64: issuerSigned ? issuerSig : undefined,
        receiverSignatureBase64: receiverSigned ? receiverSig : undefined,
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
    setSubmitting(true);
    try {
      const retIssuerSig = returnIssuerCanvasRef.current?.toDataURL("image/png");
      const retReceiverSig = returnReceiverCanvasRef.current?.toDataURL("image/png");
      await warehouseBorrowApi.return(activeItem.id, {
        returnCondition,
        returnNote,
        returnIssuerSignatureBase64: returnIssuerSigned ? retIssuerSig : undefined,
        returnReceiverSignatureBase64: returnReceiverSigned ? retReceiverSig : undefined,
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
      (b.relatedJobNumber && b.relatedJobNumber.toLowerCase().includes(s)) ||
      (b.ticketNumber && b.ticketNumber.toLowerCase().includes(s)) ||
      (b.items && b.items.some(
        (i) =>
          i.partDescription.toLowerCase().includes(s) ||
          (i.partCode && i.partCode.toLowerCase().includes(s))
      ))
    );
  });

  // Canvas drawing helpers
  const startDraw = (canvas: HTMLCanvasElement, e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (canvas: HTMLCanvasElement, e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const clearCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

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

  // Render signature canvas block (reusable)
  const renderSignatureCanvas = (
    label: string,
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    signed: boolean,
    setSigned: (v: boolean) => void,
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-700">{label}</label>
        <button
          type="button"
          className="text-xs text-red-500 hover:text-red-700"
          onClick={() => { clearCanvas(canvasRef.current); setSigned(false); }}
        >
          Hapus
        </button>
      </div>
      <canvas
        ref={canvasRef as React.RefObject<HTMLCanvasElement>}
        width={240}
        height={120}
        className="w-full border-2 border-dashed border-gray-300 rounded-xl bg-white cursor-crosshair touch-none"
        onMouseDown={(e) => { startDraw(canvasRef.current!, e); setSigned(true); }}
        onMouseMove={(e) => draw(canvasRef.current!, e)}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={(e) => { e.preventDefault(); startDraw(canvasRef.current!, e); setSigned(true); }}
        onTouchMove={(e) => { e.preventDefault(); draw(canvasRef.current!, e); }}
        onTouchEnd={stopDraw}
      />
    </div>
  );

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
              <div><span className="text-gray-400">Teknisi:</span> {b.borrowedByName}</div>
              <div><span className="text-gray-400">Barang:</span> {b.items?.length ?? 0} item</div>
              {b.relatedJobNumber && (
                <div className="col-span-2"><span className="text-gray-400">Job:</span> <span className="font-mono text-blue-700">{b.relatedJobNumber}</span></div>
              )}
            </div>

            {/* Baris 4: Footer aksi */}
            <div className="flex flex-col pt-3 mt-1 border-t border-gray-100">
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
                  <FileText className="w-3.5 h-3.5 mr-1" /> Detail
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setDeleteTarget(b)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus
                </Button>
              </div>
              
              <div className="flex gap-1 shrink-0 mt-2">
                {b.status === "Approved" && (
                  <Button variant="ghost" size="sm" className="w-full text-indigo-700" onClick={() => openIssue(b)}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Serahkan
                  </Button>
                )}
                {(b.status === "Approved" || b.status === "Issued") && (
                  <Button variant="ghost" size="sm" className="w-full text-emerald-700" onClick={() => openReturn(b)}>
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
                      <div className="flex justify-end gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs h-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                          onClick={() => setDetailTargetId(b.id)}
                        >
                          Detail
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteTarget(b)}
                        >
                          Hapus
                        </Button>
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
                        {(b.status === "Approved" || b.status === "Issued") && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs h-8 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200"
                            onClick={() => openReturn(b)}
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Kembalikan
                          </Button>
                        )}
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
          setIssuerSigned(false);
          setReceiverSigned(false);
          clearCanvas(issuerCanvasRef.current);
          clearCanvas(receiverCanvasRef.current);
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
                  <span className="font-semibold">{activeItem.borrowedByName}</span>
                </div>
                <div className="pt-1">
                  {renderItemsList(activeItem)}
                </div>
              </div>

              {/* Dual Signature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderSignatureCanvas("TTD Admin Gudang", issuerCanvasRef, issuerSigned, setIssuerSigned)}
                {renderSignatureCanvas("TTD Penerima", receiverCanvasRef, receiverSigned, setReceiverSigned)}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              closeDialog();
              setIssuerSigned(false);
              setReceiverSigned(false);
              clearCanvas(issuerCanvasRef.current);
              clearCanvas(receiverCanvasRef.current);
            }}>Batal</Button>
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
          setReturnIssuerSigned(false);
          setReturnReceiverSigned(false);
          clearCanvas(returnIssuerCanvasRef.current);
          clearCanvas(returnReceiverCanvasRef.current);
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
                  <span className="text-gray-500">Dari Teknisi</span>
                  <span className="font-semibold">{activeItem.borrowedByName}</span>
                </div>
                <div className="pt-1">
                  {renderItemsList(activeItem)}
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

                {/* Return Dual Signature */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderSignatureCanvas("TTD Admin Gudang", returnIssuerCanvasRef, returnIssuerSigned, setReturnIssuerSigned)}
                  {renderSignatureCanvas("TTD Teknisi", returnReceiverCanvasRef, returnReceiverSigned, setReturnReceiverSigned)}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              closeDialog();
              setReturnIssuerSigned(false);
              setReturnReceiverSigned(false);
              clearCanvas(returnIssuerCanvasRef.current);
              clearCanvas(returnReceiverCanvasRef.current);
            }}>Batal</Button>
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
              <p className="text-xs text-gray-500">{deleteTarget.borrowedByName}</p>
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
