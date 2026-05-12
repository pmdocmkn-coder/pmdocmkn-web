import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, cubicBezier, Variants } from "framer-motion";
import { hasPermission } from "../../utils/permissionUtils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreVertical,
  History,
  Trash2,
  Edit2,
  Upload,
  Radio as RadioIcon,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Package,
} from "lucide-react";
import { radioApi, RadioDto, CreateRadioDto } from "../../services/radioApi";
import RadioHistoryModal from "./RadioHistoryModal";
import RadioImportModal from "./RadioImportModal";
import { useToast } from "../../hooks/use-toast";

// ─── Animation Variants ──────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: cubicBezier(0.25, 0.46, 0.45, 0.94),
    },
  },
};

const cardHoverVariants: Variants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.03,
    y: -4,
    transition: { type: "spring", stiffness: 400, damping: 12 },
  },
};

const filterPanelVariants: Variants = {
  open: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.3, ease: cubicBezier(0.25, 0.46, 0.45, 0.94) },
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.25, ease: cubicBezier(0.55, 0, 1, 0.45) },
  },
};

// ─── Category Badge ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category?: string }) {
  const map: Record<string, string> = {
    Internal: "bg-violet-100 text-violet-700 border-violet-200",
    Contractor: "bg-blue-100 text-blue-700 border-blue-200",
    Unit: "bg-green-100 text-green-700 border-green-200",
    LegacyScrap: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const cls = map[category ?? ""] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${cls}`}>
      {category || "-"}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RadioScrapPage() {
  const { toast } = useToast();

  // ── Data State ──────────────────────────────────────────────────────────────
  const [data, setData] = useState<RadioDto[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Filter State ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // ── Modal State ─────────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedRadio, setSelectedRadio] = useState<RadioDto | null>(null);

  // ── Form State ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<CreateRadioDto>({
    category: "LegacyScrap",
    nomorAset: "",
    nomorUnit: "",
    nomorLv: "",
    serialNumber: "",
    type: "",
    company: "",
    department: "",
    division: "",
    channel: "",
    tanggal: "",
    fleet: "",
    radioId: "",
    mark: "",
    isTrunking: false,
    isConventional: false,
    isScrap: true,
    scrapJobNumber: "",
    dateScrapped: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  // ── Load Data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await radioApi.getAll(undefined, true);
      setData(response.data.data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load Scrap radios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── CRUD Handlers ───────────────────────────────────────────────────────────
  const handleCreate = async () => {
    try {
      await radioApi.create(formData);
      toast({ title: "Berhasil", description: "Data scrap radio berhasil ditambahkan" });
      setIsCreateOpen(false);
      loadData();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Gagal menambahkan data",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedRadio) return;
    try {
      await radioApi.update(selectedRadio.id, formData);
      toast({ title: "Berhasil", description: "Data scrap radio berhasil diperbarui" });
      setIsEditOpen(false);
      loadData();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Gagal memperbarui data",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Yakin ingin menghapus data scrap ini?")) return;
    try {
      await radioApi.delete(id);
      toast({ title: "Berhasil", description: "Data berhasil dihapus" });
      loadData();
    } catch {
      toast({ title: "Error", description: "Gagal menghapus data", variant: "destructive" });
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("PERINGATAN: Yakin ingin menghapus SEMUA data radio? Tindakan ini tidak dapat dibatalkan!")) return;
    try {
      await radioApi.deleteAll();
      toast({ title: "Berhasil", description: "Semua data radio berhasil dihapus" });
      loadData();
    } catch {
      toast({ title: "Error", description: "Gagal menghapus semua data", variant: "destructive" });
    }
  };

  const openEditModal = (radio: RadioDto) => {
    setSelectedRadio(radio);
    setFormData({
      category: radio.category || "LegacyScrap",
      nomorAset: radio.nomorAset || "",
      nomorUnit: radio.nomorUnit || "",
      nomorLv: radio.nomorLv || "",
      serialNumber: radio.serialNumber || "",
      type: radio.type || "",
      company: radio.company || "",
      department: radio.department || "",
      division: radio.division || "",
      channel: radio.channel || "",
      tanggal: radio.tanggal ? radio.tanggal.split("T")[0] : "",
      fleet: radio.fleet || "",
      radioId: radio.radioId || "",
      mark: radio.mark || "",
      isTrunking: radio.isTrunking,
      isConventional: radio.isConventional,
      isScrap: radio.isScrap,
      scrapJobNumber: radio.scrapJobNumber || "",
      dateScrapped: radio.dateScrapped
        ? radio.dateScrapped.split("T")[0]
        : new Date().toISOString().split("T")[0],
      remarks: radio.remarks || "",
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      category: "LegacyScrap",
      nomorAset: "",
      nomorUnit: "",
      nomorLv: "",
      serialNumber: "",
      type: "",
      company: "",
      department: "",
      division: "",
      channel: "",
      tanggal: "",
      fleet: "",
      radioId: "",
      mark: "",
      isTrunking: false,
      isConventional: false,
      isScrap: true,
      scrapJobNumber: "",
      dateScrapped: new Date().toISOString().split("T")[0],
      remarks: "",
    });
    setSelectedRadio(null);
  };

  const resetFilters = () => {
    setSearch("");
    setFilterCategory("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  // ── Active Filter Count ─────────────────────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (filterCategory) count++;
    if (filterDateFrom) count++;
    if (filterDateTo) count++;
    return count;
  }, [search, filterCategory, filterDateFrom, filterDateTo]);

  // ── Filtered Data ───────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (search) {
        const q = search.toLowerCase();
        const matches =
          item.scrapJobNumber?.toLowerCase().includes(q) ||
          item.serialNumber?.toLowerCase().includes(q) ||
          item.radioId?.toLowerCase().includes(q) ||
          item.nomorAset?.toLowerCase().includes(q) ||
          item.company?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filterCategory && item.category !== filterCategory) return false;
      if (filterDateFrom) {
        const from = new Date(filterDateFrom);
        const scrapped = item.dateScrapped ? new Date(item.dateScrapped) : null;
        if (!scrapped || scrapped < from) return false;
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        const scrapped = item.dateScrapped ? new Date(item.dateScrapped) : null;
        if (!scrapped || scrapped > to) return false;
      }
      return true;
    });
  }, [data, search, filterCategory, filterDateFrom, filterDateTo]);

  // ── Stat Counts ─────────────────────────────────────────────────────────────
  const internalCount = useMemo(
    () => filteredData.filter((d) => d.category === "Internal").length,
    [filteredData]
  );
  const contractorCount = useMemo(
    () => filteredData.filter((d) => d.category === "Contractor").length,
    [filteredData]
  );
  const legacyCount = useMemo(
    () => filteredData.filter((d) => d.category === "LegacyScrap" || d.category === "Unit").length,
    [filteredData]
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 md:p-6 space-y-6"
    >
      {/* ── Page Header ── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Radio Scrap</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Semua aset radio yang telah di-scrap dari seluruh kategori
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPermission("radio.delete") && (
            <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete All
            </Button>
          )}
          {hasPermission("radio.scrap.import") && (
            <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
              <Upload className="w-4 h-4 mr-1.5" />
              Import Legacy Scrap
            </Button>
          )}
          {hasPermission("radio.scrap.create") && (
            <Button
              size="sm"
              onClick={() => { resetForm(); setIsCreateOpen(true); }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Manual
            </Button>
          )}
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scrap */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br from-red-600 to-red-800 cursor-default"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-80">Total Scrap</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{filteredData.length}</p>
            <p className="text-xs opacity-70 mt-1.5 font-medium">dari {data.length} data</p>
          </div>
        </motion.div>

        {/* Internal */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 cursor-default"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                <RadioIcon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-80">Internal</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{internalCount}</p>
            <p className="text-xs opacity-70 mt-1.5 font-medium">radio internal</p>
          </div>
        </motion.div>

        {/* Contractor */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br from-sky-500 via-blue-600 to-blue-700 cursor-default"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                <RadioIcon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-80">Contractor</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{contractorCount}</p>
            <p className="text-xs opacity-70 mt-1.5 font-medium">radio kontraktor</p>
          </div>
        </motion.div>

        {/* Legacy */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br from-slate-500 to-slate-700 cursor-default"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-80">Legacy</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{legacyCount}</p>
            <p className="text-xs opacity-70 mt-1.5 font-medium">unit &amp; legacy scrap</p>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Filter Panel ── */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* Filter Header */}
        <button
          onClick={() => setIsFilterOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/80 transition-colors rounded-2xl"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-red-100 rounded-lg">
              <Filter className="w-4 h-4 text-red-600" />
            </div>
            <span className="font-semibold text-gray-800 text-sm">Filter &amp; Pencarian</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); resetFilters(); }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
            {isFilterOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </button>

        {/* Collapsible Filter Body */}
        <AnimatePresence initial={false}>
          {isFilterOpen && (
            <motion.div
              key="filter-body"
              variants={filterPanelVariants}
              initial="closed"
              animate="open"
              exit="closed"
              style={{ overflow: "hidden" }}
            >
              <div className="px-5 pt-1 pb-5 border-t border-gray-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
                  {/* Search */}
                  <div className="relative sm:col-span-2 lg:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      placeholder="Cari job number, SN, ID radio..."
                      className="pl-9 h-9 text-sm border-gray-200 focus:border-red-400 focus:ring-red-400"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {/* Category */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 text-gray-700"
                  >
                    <option value="">Semua Kategori</option>
                    <option value="Internal">Internal</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Unit">Unit</option>
                    <option value="LegacyScrap">LegacyScrap</option>
                  </select>

                  {/* Date From */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 whitespace-nowrap">Dari</label>
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="flex-1 h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 text-gray-700"
                    />
                  </div>

                  {/* Date To */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 whitespace-nowrap">Sampai</label>
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="flex-1 h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 text-gray-700"
                    />
                  </div>
                </div>

                {/* Active Filter Chips */}
                {activeFilterCount > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    {search && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                        Cari: &quot;{search}&quot;
                        <button onClick={() => setSearch("")} className="hover:text-red-900 ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filterCategory && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        Kategori: {filterCategory}
                        <button onClick={() => setFilterCategory("")} className="hover:text-blue-900 ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filterDateFrom && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                        Dari: {filterDateFrom}
                        <button onClick={() => setFilterDateFrom("")} className="hover:text-orange-900 ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filterDateTo && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                        Sampai: {filterDateTo}
                        <button onClick={() => setFilterDateTo("")} className="hover:text-orange-900 ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Data Table ── */}
      <motion.div variants={itemVariants} className="rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Kategori</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">No. Aset / Perusahaan</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Serial Number</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Type Radio</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Divisi</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Dept</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Jenis</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Job Number</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Tanggal Scrap</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Remark</th>
                {(hasPermission("radio.view") ||
                  hasPermission("radio.scrap.update") ||
                  hasPermission("radio.scrap.delete")) && (
                  <th className="font-semibold text-gray-600 py-3 px-4 text-right whitespace-nowrap">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
                      <span className="text-sm text-muted-foreground">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-10 h-10 opacity-20" />
                      <span className="text-sm">Tidak ada data yang ditemukan</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium">
                      {item.nomorAset || item.company || item.nomorLv || "-"}
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">{item.serialNumber || "-"}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{item.type || "-"}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{item.division || "-"}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{item.department || "-"}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.isTrunking ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold">Trunking</span>
                      ) : item.isConventional ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 text-xs font-semibold">Konvensional</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{item.scrapJobNumber || "-"}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.dateScrapped
                        ? new Date(item.dateScrapped).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate" title={item.remarks || undefined}>
                      {item.remarks || "-"}
                    </td>
                    {(hasPermission("radio.view") ||
                      hasPermission("radio.scrap.update") ||
                      hasPermission("radio.scrap.delete")) && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-7 w-7 p-0 inline-flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-3.5 w-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {hasPermission("radio.view") && (
                              <DropdownMenuItem
                                onClick={() => { setSelectedRadio(item); setIsHistoryOpen(true); }}
                              >
                                <History className="mr-2 h-4 w-4" />
                                History
                              </DropdownMenuItem>
                            )}
                            {hasPermission("radio.scrap.update") && (
                              <DropdownMenuItem onClick={() => openEditModal(item)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {hasPermission("radio.scrap.delete") && (
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Create / Edit Modal ── */}
      <Dialog
        open={isCreateOpen || isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setIsEditOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditOpen ? "Edit Scrap Radio" : "Tambah Scrap Radio Manual"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Kategori Asal</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="LegacyScrap">Legacy Scrap (Unknown Source)</option>
                <option value="Internal">Internal</option>
                <option value="Contractor">Contractor</option>
                <option value="Unit">Unit</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Scrap Job Number</label>
              <Input
                value={formData.scrapJobNumber}
                placeholder="e.g. SCRAP-2024-001"
                onChange={(e) => setFormData({ ...formData, scrapJobNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Scrap</label>
              <Input
                type="date"
                value={formData.dateScrapped}
                onChange={(e) => setFormData({ ...formData, dateScrapped: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nomor Aset / Company</label>
              <Input
                value={formData.nomorAset}
                placeholder="Aset/Company/Unit/LV No"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nomorAset: e.target.value,
                    company: e.target.value,
                    nomorUnit: e.target.value,
                    nomorLv: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Serial Number</label>
              <Input
                value={formData.serialNumber}
                placeholder="e.g. SN123456"
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type Radio</label>
              <Input
                value={formData.type}
                placeholder="e.g. Motorola XPR"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ID Radio</label>
              <Input
                value={formData.radioId}
                placeholder="e.g. 2001"
                onChange={(e) => setFormData({ ...formData, radioId: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Keterangan</label>
              <Input
                value={formData.remarks}
                placeholder="Catatan tambahan..."
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                resetForm();
              }}
            >
              Batal
            </Button>
            <Button
              onClick={isEditOpen ? handleUpdate : handleCreate}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isEditOpen ? "Simpan Perubahan" : "Tambah Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Import Modal ── */}
      <RadioImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Legacy Scrap"
        onImportSuccess={() => loadData()}
        importApiCall={radioApi.importScrap}
      />

      {/* ── History Modal ── */}
      <RadioHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        radioId={selectedRadio?.id || null}
      />
    </motion.div>
  );
}
