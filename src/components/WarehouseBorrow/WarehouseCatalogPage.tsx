import { useEffect, useState, useRef } from "react";
import { Database, Search, Upload, Trash2, Package, Home, FileSpreadsheet, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { warehousePartApi } from "../../services/warehousePartApi";
import type { WarehousePartCatalogItem } from "../../services/warehousePartApi";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";
import { useToast } from "../../hooks/use-toast";
import { ResponsiveModal } from "../common/ResponsiveModal";
import { motion } from "framer-motion";
import RadioImportModal from "../Radio/RadioImportModal";
import WarehousePartFormModal from "./WarehousePartFormModal";

export default function WarehouseCatalogPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [items, setItems] = useState<WarehousePartCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const [importing, setImporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WarehousePartCatalogItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WarehousePartCatalogItem | null>(null);

  const loadData = (p = page, s = search) => {
    setLoading(true);
    warehousePartApi
      .getAll({ page: p, pageSize, search: s || undefined })
      .then((r) => {
        setItems(r.data ?? []);
        setTotalCount(r.meta?.pagination?.totalCount ?? 0);
      })
      .catch(() => {
        // Fallback: use search API if getAll not available
        if (s) {
          warehousePartApi.search(s, 50).then(setItems).catch(() => setItems([]));
        } else {
          setItems([]);
        }
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  };

  const handleOpenAdd = () => {
    setEditTarget(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: WarehousePartCatalogItem) => {
    setEditTarget(item);
    setIsFormModalOpen(true);
  };

  useEffect(() => {
    const t = setTimeout(() => loadData(1, search), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    loadData(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Live refresh when warehouse part catalog changes
  useLiveRefresh("WarehousePart", () => { loadData(page, search); });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await warehousePartApi.delete(deleteTarget.id);
      toast({ title: "Berhasil dihapus", description: "Data berhasil dihapus dari sistem." });
      setDeleteTarget(null);
      loadData(page, search);
    } catch {
      toast({ title: "Gagal menghapus", description: "Pastikan data tidak terikat ke transaksi lain.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("PERINGATAN: Yakin ingin menghapus SEMUA data Master Data Tools? Tindakan ini tidak dapat dibatalkan!")) return;
    try {
      await warehousePartApi.deleteAll();
      toast({ title: "Berhasil", description: "Semua data Master Data Tools berhasil dihapus." });
      loadData(1, "");
      setSearch("");
      setPage(1);
    } catch {
      toast({ title: "Gagal menghapus", description: "Terjadi kesalahan saat menghapus semua data.", variant: "destructive" });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* ====== MOBILE INTEGRATED HEADER ====== */}
      <div className="md:hidden bg-white rounded-[14px] border border-[#E2E8F0] shadow-sm mb-4">
        <div className="flex items-start gap-4 p-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#F3E8FF] flex items-center justify-center flex-shrink-0">
            <Database className="w-5 h-5 text-[#7E22CE]" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#7E22CE] tracking-[0.1em] uppercase mb-0.5">Warehouse</p>
            <h1 className="text-[20px] font-bold text-[#1A202C] leading-tight">Master Data Tools</h1>
            <p className="text-[12px] text-[#718096] mt-0.5">Kelola material dan suku cadang</p>
          </div>
          <button
            onClick={() => navigate("/warehouse")}
            className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-[#F7F8FA] border border-[#E2E8F0] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
            <Input
              placeholder="Cari kode atau nama tools..."
              className="pl-10 pr-4 h-10 border-[#E2E8F0] rounded-[10px] text-sm bg-[#F7F8FA] text-[#1A202C] placeholder:text-[#718096] w-full focus:border-[#2B6CB0]"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* ── Page Header (Desktop) ── */}
      <div className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-violet-100 rounded-xl">
            <Database className="w-8 h-8 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Master Data Tools</h1>
            <p className="text-sm text-gray-500 mt-0.5">Kelola daftar material / suku cadang warehouse</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cari kode atau nama tools..."
              className="pl-9 h-10 w-full"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <Button
              variant="outline"
              onClick={handleOpenAdd}
              className="h-10 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold flex-shrink-0"
            >
              + Tambah Tools
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={loading || items.length === 0}
              className="h-10 text-white font-semibold shadow-md shadow-red-200 gap-2 hidden md:flex"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Semua
            </Button>
            <Button
              onClick={() => setIsImportModalOpen(true)}
              disabled={importing}
              className="h-10 bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-md shadow-violet-200 gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
          </div>
        </div>
      </div>

      {/* ── Mobile Card View ── */}
      <div className="md:hidden flex flex-col gap-3 mt-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm">
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Belum ada data master tools</p>
            <p className="text-xs text-gray-400 mt-1">Gunakan tombol Import untuk menambah data</p>
          </div>
        ) : (
          items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{item.partName}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{item.partCode}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-100 transition-colors shrink-0"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5">
                <div><span className="text-gray-400">Owner:</span> {item.ownerId || "—"}</div>
                <div><span className="text-gray-400">UoM:</span> {item.unit || "—"}</div>
                {item.description && (
                  <div className="col-span-2"><span className="text-gray-400">Ket:</span> {item.description}</div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ── Data Table (Desktop) ── */}
      <div className="hidden md:block rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 text-left text-xs font-semibold text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3.5 w-12">No</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Tools Code</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Nama Tools</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Owner ID</th>
                <th className="px-4 py-3.5 whitespace-nowrap">UoM</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Deskripsi</th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
                      <span className="text-sm text-gray-400">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-10 h-10 opacity-20" />
                      <span className="text-sm">Belum ada data master tools</span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                        {item.partCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.partName}</td>
                    <td className="px-4 py-3 text-gray-600">{item.ownerId || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{item.unit || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{item.description || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 h-8"
                          onClick={() => handleOpenEdit(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8"
                          onClick={() => setDeleteTarget(item)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Menampilkan {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} dari {totalCount} item
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-8 text-xs">
                Sebelumnya
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="h-8 text-xs">
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Pagination */}
      {totalPages > 1 && (
        <div className="md:hidden flex items-center justify-between">
          <p className="text-xs text-gray-500">Hal {page}/{totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-8 text-xs">
              ←
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="h-8 text-xs">
              →
            </Button>
          </div>
        </div>
      )}

      {/* Mobile FAB: Import */}
      <button
        onClick={() => setIsImportModalOpen(true)}
        disabled={importing}
        className="md:hidden fixed bottom-[100px] right-4 z-30 flex items-center gap-2 bg-[#D94F2B] hover:bg-[#B83D20] text-white px-5 py-3.5 rounded-full shadow-lg font-bold shadow-[#D94F2B]/40 transition-all active:scale-95 text-[15px]"
      >
        <Upload className="w-5 h-5" />
        Import
      </button>

      <RadioImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Master Data Tools"
        onImportSuccess={() => {
          loadData(1, "");
          setSearch("");
          setPage(1);
        }}
        importApiCall={async (file) => {
          const result = await warehousePartApi.import(file);
          return {
            data: {
              success: result.importedCount + result.updatedCount,
              failed: 0,
              errors: [],
              sheetDetails: []
            }
          };
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ResponsiveModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Tools"
        description="Apakah Anda yakin ingin menghapus tools ini dari master data?"
        bottomSheetSize="md"
        desktopClassName="max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 sm:flex-none">Batal</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white flex-1 sm:flex-none"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <div className="bg-red-50 rounded-xl p-4 border border-red-100 text-sm space-y-1 my-2">
            <p className="font-semibold text-gray-900">{deleteTarget.partName}</p>
            <p className="text-gray-500 font-mono text-xs">{deleteTarget.partCode}</p>
          </div>
        )}
      </ResponsiveModal>
      <WarehousePartFormModal 
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        initialData={editTarget}
        onSuccess={() => loadData()}
      />

    </div>
  );
}
