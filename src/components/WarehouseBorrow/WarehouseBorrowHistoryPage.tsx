import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { History, Package, Search, Calendar, User, CheckCircle2, RotateCcw, PenTool, FileText, Trash2, Eye, ClipboardCheck } from "lucide-react";
import { warehouseBorrowApi } from "../../services/warehouseBorrowApi";
import { workshopTechnicianApi, type WorkshopTechnicianDto } from "../../services/workshopTechnicianApi";
import { api } from "../../services/api";
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
import { useLiveRefresh } from "../../hooks/useLiveRefresh";

interface UserLookupItem {
  id: number;
  name: string;
  username: string;
  roleName?: string | null;
}

export default function WarehouseBorrowHistoryPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isWarehouse = user?.roleName?.toLowerCase() === "warehouse";
  const [items, setItems] = useState<WarehouseBorrowList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal States
  const [activeItem, setActiveItem] = useState<WarehouseBorrowList | null>(null);
  const [actionType, setActionType] = useState<"issue" | "return" | "sign" | "return-sign" | null>(null);

  // Semua user terdaftar (dropdown utama)
  const [allUsers, setAllUsers] = useState<UserLookupItem[]>([]);
  // Teknisi workshop (dropdown ke-2 jika pilih Teknisi WSK)
  const [technicians, setTechnicians] = useState<WorkshopTechnicianDto[]>([]);
  // Simpan object user yang dipilih agar bisa akses roleName langsung
  const [selectedReturnerUser, setSelectedReturnerUser] = useState<UserLookupItem | null>(null);

  // Load kedua data sekaligus
  useEffect(() => {
    api.get<{ data: UserLookupItem[] }>("/api/users/lookup")
      .then((res) => {
        const users = res.data?.data ?? [];
        console.log('📥 All Users loaded:', users.length, 'users');
        console.log('👥 Users with "Teknisi" or "Workshop" in role:',
          users.filter(u => u.roleName?.toLowerCase().includes('teknisi') || u.roleName?.toLowerCase().includes('workshop'))
        );
        setAllUsers(users);
      })
      .catch(console.error);
    workshopTechnicianApi.getAllActive()
      .then((res) => {
        const techs = res.data?.data ?? [];
        console.log('🔧 Workshop Technicians loaded:', techs.length, 'technicians');
        setTechnicians(techs);
      })
      .catch(console.error);
  }, []);

  // Return form state
  const [returnCondition, setReturnCondition] = useState("Good");
  const [returnNote, setReturnNote] = useState("");
  const [returnedByName, setReturnedByName] = useState("");
  const [workshopTechName, setWorkshopTechName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Deteksi apakah user yang dipilih adalah Teknisi WSK — HARUS DEKLARASI SEBELUM useEffect
  const WORKSHOP_ROLE = "teknisi wsk";
  const selectedReturnerIsWorkshop =
    (selectedReturnerUser?.roleName ?? "").toLowerCase().trim() === WORKSHOP_ROLE;

  // Auto-detect user yang dipilih dari returnedByName (fallback jika FormMobileSelect tidak trigger onChange dengan object)
  useEffect(() => {
    if (returnedByName && allUsers.length > 0) {
      const found = allUsers.find(u => u.name === returnedByName);
      if (found) {
        console.log('🔍 Auto-detect returner:', { name: found.name, roleName: found.roleName, id: found.id });
        // Hanya update jika berbeda (bandingkan by id untuk avoid loop)
        if (!selectedReturnerUser || selectedReturnerUser.id !== found.id) {
          setSelectedReturnerUser(found);
        }
      }
    } else if (!returnedByName) {
      // Reset jika returnedByName dikosongkan
      setSelectedReturnerUser(null);
    }
  }, [returnedByName, allUsers]);

  // Debug: log perubahan selectedReturnerUser dan status workshop
  useEffect(() => {
    console.log('═══════════════════════════════════════');
    console.log('📝 returnedByName:', returnedByName);
    console.log('👤 selectedReturnerUser:', selectedReturnerUser);
    console.log('🏭 selectedReturnerIsWorkshop:', selectedReturnerIsWorkshop);
    if (selectedReturnerUser) {
      console.log('📋 Role Details:', {
        roleName: selectedReturnerUser.roleName,
        lowercase: (selectedReturnerUser.roleName ?? "").toLowerCase().trim(),
        expectedRole: WORKSHOP_ROLE,
        matches: (selectedReturnerUser.roleName ?? "").toLowerCase().trim() === WORKSHOP_ROLE
      });
    }
    console.log('✅ Should show Step 2?', returnedByName && selectedReturnerIsWorkshop);
    console.log('═══════════════════════════════════════');
  }, [selectedReturnerUser, selectedReturnerIsWorkshop, returnedByName]);

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

  // Live refresh saat ada perubahan data warehouse borrow dari user lain
  useLiveRefresh("WarehouseBorrow", () => {
    loadData();
  });

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
    setWorkshopTechName("");
    setSelectedReturnerUser(null); // reset pilihan user
  };

  const closeDialog = () => {
    setActiveItem(null);
    setActionType(null);
    setIssuerSigned(null);
    setReceiverSigned(null);
    setReturnIssuerSigned(null);
    setReturnReceiverSigned(null);
    setSelectedReturnerUser(null);
    setWorkshopTechName("");
  };

  const handleIssue = async () => {
    if (!activeItem || !issuerSigned) {
      return toast({ title: "TTD Penyerah wajib diisi", variant: "destructive" });
    }

    setSubmitting(true);
    try {
      await warehouseBorrowApi.issue(activeItem.id, {
        issuerSignatureBase64: issuerSigned,
        receiverSignatureBase64: receiverSigned || undefined,
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
    if (!returnIssuerSigned) {
      toast({ title: "Tanda Tangan Kosong", description: "Tanda tangan Penyerah (Peminjam) wajib diisi saat pengembalian.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await warehouseBorrowApi.return(activeItem.id, {
        returnCondition,
        returnNote,
        returnIssuerSignatureBase64: returnIssuerSigned ?? undefined,
        returnReceiverSignatureBase64: returnReceiverSigned ?? undefined,
        // Jika pemilih adalah Teknisi WSK dan ada nama spesifik → pakai nama teknisi
        returnedByName: (selectedReturnerIsWorkshop && workshopTechName ? workshopTechName : returnedByName.trim()) || undefined,
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

  const handleSign = async () => {
    if (!activeItem || !receiverSigned) {
      return toast({ title: "Tanda Tangan wajib diisi", variant: "destructive" });
    }

    setSubmitting(true);
    try {
      await warehouseBorrowApi.signReceiver(activeItem.id, receiverSigned);
      toast({ title: "Berhasil", description: "Tanda tangan penerima berhasil disimpan." });
      closeDialog();
      loadData();
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnSign = async () => {
    if (!activeItem || !returnReceiverSigned) {
      return toast({ title: "Tanda Tangan wajib diisi", variant: "destructive" });
    }

    setSubmitting(true);
    try {
      await warehouseBorrowApi.signReturnReceiver(activeItem.id, {
        returnReceiverSignatureBase64: returnReceiverSigned,
        returnCondition,
        returnNote
      });
      toast({ title: "Berhasil", description: "Inspeksi & tanda tangan penerima berhasil disimpan." });
      closeDialog();
      loadData();
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
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
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-semibold whitespace-nowrap">Waiting Approval</span>;
      case "PendingSignature":
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-semibold whitespace-nowrap">Menunggu TTD</span>;
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
            placeholder="Cari transaksi, part, atau peminjam..."
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
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Histori Peminjaman Tools</h1>
            <p className="text-sm text-gray-500 mt-0.5">Daftar lengkap riwayat permintaan dan transaksi tools</p>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari transaksi, part, atau peminjam..."
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
              <div><span className="text-gray-400">Peminjam:</span> {b.borrowerName || b.borrowedByName}</div>
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
                {b.status === "PendingSignature" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-600 hover:text-white"
                    onClick={() => {
                      setActiveItem(b);
                      setActionType("sign");
                    }}
                  >
                    <PenTool className="w-3.5 h-3.5 mr-1" /> TTD Serah Terima
                  </Button>
                )}
                {b.status === "PendingReturnSignature" && isWarehouse && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-600 hover:text-white"
                    onClick={() => {
                      setActiveItem(b);
                      setActionType("return-sign");
                      setReturnCondition("Good");
                      setReturnNote("");
                    }}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 mr-1" /> Inspeksi & TTD
                  </Button>
                )}
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
                {b.status === "Issued" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-emerald-700 border-emerald-300 hover:bg-emerald-600 hover:text-white"
                    onClick={() => openReturn(b)}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> {isWarehouse ? "Terima Pengembalian" : "Kembalikan Part"}
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
                <th className="px-4 py-3.5 whitespace-nowrap">Peminjam</th>
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
                        {b.status === "PendingSignature" && (
                          <button
                            title="TTD Serah Terima"
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-orange-600 hover:text-white hover:bg-orange-600 border border-orange-200 transition-colors"
                            onClick={() => {
                              setActiveItem(b);
                              setActionType("sign");
                            }}
                          >
                            <PenTool className="w-4 h-4" />
                          </button>
                        )}
                        {b.status === "PendingReturnSignature" && isWarehouse && (
                          <button
                            title="Inspeksi & TTD Penerima"
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-orange-600 hover:text-white hover:bg-orange-600 border border-orange-200 transition-colors"
                            onClick={() => {
                              setActiveItem(b);
                              setActionType("return-sign");
                              setReturnCondition("Good");
                              setReturnNote("");
                            }}
                          >
                            <ClipboardCheck className="w-4 h-4" />
                          </button>
                        )}
                        {b.status === "Approved" && isWarehouse && (
                          <button
                            title="Serahkan Part"
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 transition-colors"
                            onClick={() => openIssue(b)}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {b.status === "Issued" && (
                          <button
                            title="Terima Pengembalian"
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-emerald-600 hover:text-white hover:bg-emerald-600 border border-emerald-200 transition-colors"
                            onClick={() => openReturn(b)}
                          >
                            <RotateCcw className="w-4 h-4 text-emerald-600" />
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
              Penyerahan Part ke Penerima
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
                  <span className="text-gray-500">Penerima</span>
                  <span className="font-semibold">{activeItem.borrowerName || activeItem.borrowedByName}</span>
                </div>
                <div className="pt-1">
                  {renderItemsList(activeItem)}
                </div>
              </div>

              {/* Dual Signature */}
              <div className="space-y-4">
                <SignaturePadField label="TTD Penyerah" required value={issuerSigned} onChange={setIssuerSigned} signerName={user?.fullName || "Admin Warehouse"} />
                <SignaturePadField label="TTD Penerima (Opsional)" value={receiverSigned} onChange={setReceiverSigned} signerName={activeItem.borrowerName || activeItem.borrowedByName} />
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
              Catat penerimaan pengembalian part dari peminjam kembali ke warehouse.
            </DialogDescription>
          </DialogHeader>

          {activeItem && (
            <div className="space-y-5 my-2">
              {/* ── Info Peminjaman ── */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm space-y-2">
                {/* No. Transaksi */}
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">No. Transaksi</span>
                  <span className="font-mono font-semibold text-gray-700">{activeItem.borrowNumber}</span>
                </div>

                {/* Peminjam */}
                <div className="flex justify-between border-b border-gray-200 pb-2 pt-1">
                  <span className="text-gray-500">Peminjam Awal</span>
                  <span className="font-semibold">{activeItem.borrowerName || activeItem.borrowedByName}</span>
                </div>

                {/* No. Tiket / No. Job */}
                {(activeItem.ticketNumber || activeItem.relatedJobNumber) && (
                  <div className="flex justify-between border-b border-gray-200 pb-2 pt-1">
                    <span className="text-gray-500">
                      {activeItem.relatedJobNumber ? "No. Job Terkait" : "No. Tiket"}
                    </span>
                    <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {activeItem.relatedJobNumber || activeItem.ticketNumber}
                    </span>
                  </div>
                )}

                {/* Keperluan */}
                {activeItem.purpose && (
                  <div className="border-b border-gray-200 pb-2 pt-1">
                    <span className="text-gray-500 block mb-0.5">Keperluan</span>
                    <span className="text-gray-700 italic">"{activeItem.purpose}"</span>
                  </div>
                )}

                {/* Durasi Peminjaman */}
                <div className="flex justify-between pt-1">
                  <span className="text-gray-500">Dipinjam sejak</span>
                  <div className="text-right">
                    <div className="font-medium text-gray-700">
                      {format(new Date(activeItem.issuedAt ?? activeItem.requestedAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                    </div>
                    <div className="text-xs font-bold text-amber-600 mt-0.5">
                      {(() => {
                        const from = new Date(activeItem.issuedAt ?? activeItem.requestedAt);
                        const now = new Date();
                        const diffMs = now.getTime() - from.getTime();
                        const diffH = Math.floor(diffMs / 3600000);
                        const diffD = Math.floor(diffH / 24);
                        const remH = diffH % 24;
                        if (diffD > 0) return `${diffD} hari ${remH > 0 ? `${remH} jam` : ""} yang lalu`;
                        if (diffH > 0) return `${diffH} jam yang lalu`;
                        const diffMin = Math.floor(diffMs / 60000);
                        return `${diffMin} menit yang lalu`;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Daftar Barang */}
                <div className="border-t border-gray-200 pt-3 mt-1">
                  {renderItemsList(activeItem)}
                </div>
              </div>

              {/* Nama Pengembali */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">Dikembalikan Oleh</label>

                {/* Step 1: Pilih dari semua user terdaftar */}
                <FormMobileSelect
                  value={returnedByName}
                  onChange={(val) => {
                    setReturnedByName(val);
                    setWorkshopTechName(""); // reset step 2
                    // Simpan object user yang dipilih agar roleName bisa diakses langsung
                    const found = allUsers.find(u => u.name === val) ?? null;
                    setSelectedReturnerUser(found);
                  }}
                  options={allUsers.map((u) => u.name)}
                  placeholder="Pilih atau ketik nama..."
                  label="Pilih Pengembali"
                  color="emerald"
                />

                {/* Step 2: Jika user yang dipilih adalah Teknisi WSK → pilih nama teknisi spesifik */}
                {returnedByName && selectedReturnerIsWorkshop && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <p className="text-xs font-semibold text-emerald-700">
                        <span className="font-bold">{returnedByName}</span> adalah Teknisi Workshop.
                        Pilih nama teknisi spesifik:
                      </p>
                    </div>
                    <FormMobileSelect
                      value={workshopTechName}
                      onChange={setWorkshopTechName}
                      options={
                        // Filter: hanya teknisi yang terkait dengan user ini (jika ada)
                        // Jika user memiliki relasi teknisi spesifik (userId match) → tampilkan hanya itu
                        // Jika tidak ada relasi → tampilkan semua
                        (() => {
                          const linkedTechs = technicians.filter(t => t.userId === selectedReturnerUser?.id);
                          return linkedTechs.length > 0
                            ? linkedTechs.map(t => t.name)
                            : technicians.map(t => t.name); // fallback: tampilkan semua jika tidak ada relasi
                        })()
                      }
                      placeholder="— Pilih nama teknisi —"
                      label="Pilih Nama Teknisi"
                      color="emerald"
                    />
                    {workshopTechName && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        ✓ Dikembalikan oleh: <strong>{workshopTechName}</strong>
                      </p>
                    )}
                  </div>
                )}

                {returnedByName && activeItem && returnedByName !== (activeItem.borrowerName || activeItem.borrowedByName) && (
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
                  <SignaturePadField label="TTD Penyerah (Peminjam)" required value={returnIssuerSigned} onChange={setReturnIssuerSigned} signerName={returnedByName || activeItem.borrowerName || activeItem.borrowedByName} />
                  <SignaturePadField label="TTD Penerima (Warehouse)" value={returnReceiverSigned} onChange={setReturnReceiverSigned} signerName={isWarehouse ? user?.fullName || "Admin Warehouse" : "Admin Warehouse"} />
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
              {submitting ? "Memproses..." : (isWarehouse ? "Terima Pengembalian" : "Kembalikan Part")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Tanda Tangan Penerima */}
      <Dialog open={actionType === "sign" && !!activeItem} onOpenChange={(open) => {
        if (!open) closeDialog();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-orange-600" />
              Tanda Tangan Penerima
            </DialogTitle>
            <DialogDescription>
              Silakan tanda tangan untuk mengonfirmasi bahwa Anda telah menerima barang ini.
            </DialogDescription>
          </DialogHeader>

          {activeItem && (
            <div className="space-y-4 my-2">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm space-y-2">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Nomor Transaksi</span>
                  <span className="font-mono font-semibold">{activeItem.borrowNumber}</span>
                </div>
                <div className="pt-1">
                  {renderItemsList(activeItem)}
                </div>
              </div>

              <SignaturePadField
                label="Tanda Tangan"
                required
                value={receiverSigned}
                onChange={setReceiverSigned}
                signerName={activeItem.borrowerName || activeItem.borrowedByName}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Batal</Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleSign}
              disabled={submitting || !receiverSigned}
            >
              {submitting ? "Menyimpan..." : "Simpan Tanda Tangan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Inspeksi & TTD Penerima (Return) */}
      <Dialog open={actionType === "return-sign" && !!activeItem} onOpenChange={(open) => {
        if (!open) closeDialog();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-orange-600" />
              Inspeksi & Tanda Tangan Penerima
            </DialogTitle>
            <DialogDescription>
              Mohon inspeksi kondisi barang dan berikan tanda tangan sebagai Admin Warehouse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                placeholder="Catatan tambahan..."
                className="h-20 resize-none focus-visible:ring-emerald-500"
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
              />
            </div>
            <SignaturePadField
              label="Tanda Tangan Penerima (Warehouse)"
              required
              value={returnReceiverSigned}
              onChange={setReturnReceiverSigned}
              signerName={user?.fullName || "Admin Warehouse"}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Batal</Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleReturnSign}
              disabled={submitting || !returnReceiverSigned}
            >
              {submitting ? "Menyimpan..." : "Simpan & Selesai"}
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
