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
  Copy,
  Tag,
} from "lucide-react";
import { radioApi, RadioDto, CreateRadioDto } from "../../services/radioApi";
import RadioHistoryModal from "./RadioHistoryModal";
import ScrapRadioModal from "./ScrapRadioModal";
import RadioImportModal from "./RadioImportModal";
import { useToast } from "../../hooks/use-toast";

// ─── Helper Functions ────────────────────────────────────────────────────────

/** Splits a comma-separated fleet string into an array of trimmed fleet numbers */
const parseFleetList = (fleet?: string): string[] => {
  if (!fleet) return [];
  return fleet
    .split(",")
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
};

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

// ─── Component ───────────────────────────────────────────────────────────────

export default function RadioContractorPage() {
  const { toast } = useToast();

  // ── Data State ──────────────────────────────────────────────────────────────
  const [data, setData] = useState<RadioDto[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Filter State ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFleet, setFilterFleet] = useState("");
  const [filterJenis, setFilterJenis] = useState(""); // "trunking" | "konvensional" | ""
  const [filterDuplikat, setFilterDuplikat] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // ── Modal State ─────────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isScrapOpen, setIsScrapOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedRadio, setSelectedRadio] = useState<RadioDto | null>(null);

  // ── Form State ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<CreateRadioDto>({
    category: "Contractor",
    serialNumber: "",
    type: "",
    company: "",
    department: "",
    channel: "",
    tanggal: "",
    fleet: "",
    radioId: "",
    mark: "",
    isTrunking: false,
    isConventional: false,
    isScrap: false,
  });

  // ── Load Data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await radioApi.getAll("Contractor", false);
      setData(response.data.data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load Contractor radios",
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
      toast({ title: "Success", description: "Radio created successfully" });
      setIsCreateOpen(false);
      loadData();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create radio",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedRadio) return;
    try {
      await radioApi.update(selectedRadio.id, formData);
      toast({ title: "Success", description: "Radio updated successfully" });
      setIsEditOpen(false);
      loadData();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update radio",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this radio?")) return;
    try {
      await radioApi.delete(id);
      toast({ title: "Success", description: "Radio deleted successfully" });
      loadData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete radio",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAll = async () => {
    if (
      !window.confirm(
        "WARNING: Are you sure you want to delete ALL radio data? This cannot be undone!"
      )
    )
      return;
    try {
      await radioApi.deleteAll();
      toast({ title: "Success", description: "All radio data deleted successfully" });
      loadData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete all radio data",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (radio: RadioDto) => {
    setSelectedRadio(radio);
    setFormData({
      category: "Contractor",
      serialNumber: radio.serialNumber || "",
      type: radio.type || "",
      company: radio.company || "",
      department: radio.department || "",
      channel: radio.channel || "",
      tanggal: radio.tanggal ? radio.tanggal.split("T")[0] : "",
      fleet: radio.fleet || "",
      radioId: radio.radioId || "",
      mark: radio.mark || "",
      isTrunking: radio.isTrunking,
      isConventional: radio.isConventional,
      isScrap: radio.isScrap,
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      category: "Contractor",
      serialNumber: "",
      type: "",
      company: "",
      department: "",
      channel: "",
      tanggal: "",
      fleet: "",
      radioId: "",
      mark: "",
      isTrunking: false,
      isConventional: false,
      isScrap: false,
    });
    setSelectedRadio(null);
  };

  // ── Derived Filter Options ──────────────────────────────────────────────────
  const typeOptions = useMemo(
    () => Array.from(new Set(data.map((d) => d.type).filter(Boolean))) as string[],
    [data]
  );
  const fleetOptions = useMemo(() => {
    const all = data.flatMap((d) => parseFleetList(d.fleet));
    return Array.from(new Set(all)).sort();
  }, [data]);

  // ── Active Filter Count ─────────────────────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (filterType) count++;
    if (filterFleet) count++;
    if (filterJenis) count++;
    if (filterDuplikat) count++;
    return count;
  }, [search, filterType, filterFleet, filterJenis, filterDuplikat]);

  const resetFilters = () => {
    setSearch("");
    setFilterType("");
    setFilterFleet("");
    setFilterJenis("");
    setFilterDuplikat(false);
  };

  // ── Filtered Data ───────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Search: serial, company, radioId
      if (search) {
        const q = search.toLowerCase();
        const matches =
          item.serialNumber?.toLowerCase().includes(q) ||
          item.company?.toLowerCase().includes(q) ||
          item.radioId?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      // Type
      if (filterType && item.type !== filterType) return false;
      // Fleet
      if (filterFleet) {
        const fleets = parseFleetList(item.fleet);
        if (!fleets.includes(filterFleet)) return false;
      }
      // Jenis
      if (filterJenis === "trunking" && !item.isTrunking) return false;
      if (filterJenis === "konvensional" && !item.isConventional) return false;
      // Duplikat ID
      if (filterDuplikat && !item.isDuplicateId) return false;
      return true;
    });
  }, [data, search, filterType, filterFleet, filterJenis, filterDuplikat]);

  // ── Fleet Color Map ─────────────────────────────────────────────────────────
  const fleetColorMap = useMemo(() => {
    const palettes = [
      "bg-emerald-100 border-emerald-400 text-emerald-800",
      "bg-pink-100 border-pink-400 text-pink-800",
      "bg-sky-100 border-sky-400 text-sky-800",
      "bg-amber-100 border-amber-400 text-amber-800",
      "bg-violet-100 border-violet-400 text-violet-800",
      "bg-rose-100 border-rose-400 text-rose-800",
      "bg-teal-100 border-teal-400 text-teal-800",
      "bg-orange-100 border-orange-400 text-orange-800",
      "bg-indigo-100 border-indigo-400 text-indigo-800",
      "bg-lime-100 border-lime-400 text-lime-800",
    ];
    const map = new Map<string, string>();
    let idx = 0;
    const sorted = [...fleetOptions].sort();
    for (const f of sorted) {
      map.set(f, palettes[idx % palettes.length]);
      idx++;
    }
    return map;
  }, [fleetOptions]);

  // ── Stat Counts ─────────────────────────────────────────────────────────────
  const trunkingCount = useMemo(() => filteredData.filter((d) => d.isTrunking).length, [filteredData]);
  const duplikatCount = useMemo(() => filteredData.filter((d) => d.isDuplicateId).length, [filteredData]);
  const scrapCount = useMemo(() => filteredData.filter((d) => d.isScrap).length, [filteredData]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 md:p-6 space-y-6"
    >
      {/* ── Page Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Radio Contractor</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manajemen aset radio kontraktor</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPermission("radio.delete") && (
            <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete All
            </Button>
          )}
          {hasPermission("radio.import") && (
            <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
              <Upload className="w-4 h-4 mr-1.5" />
              Import
            </Button>
          )}
          {hasPermission("radio.create") && (
            <Button
              size="sm"
              onClick={() => { resetForm(); setIsCreateOpen(true); }}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah
            </Button>
          )}
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Radio */}
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
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-80">Total</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{filteredData.length}</p>
            <p className="text-xs opacity-70 mt-1.5 font-medium">dari {data.length} data</p>
          </div>
        </motion.div>

        {/* Trunking */}
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
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-80">Trunking</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{trunkingCount}</p>
            <p className="text-xs opacity-70 mt-1.5 font-medium">radio trunking aktif</p>
          </div>
        </motion.div>

        {/* Duplikat ID */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br from-rose-500 via-red-600 to-red-700 cursor-default"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                <Copy className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-80">Duplikat</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{duplikatCount}</p>
            <p className="text-xs opacity-70 mt-1.5 font-medium">ID radio duplikat</p>
          </div>
        </motion.div>

        {/* Scrap */}
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 cursor-default"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                <Tag className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-80">Scrap</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{scrapCount}</p>
            <p className="text-xs opacity-70 mt-1.5 font-medium">radio di-scrap</p>
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
            <div className="p-1.5 bg-violet-100 rounded-lg">
              <Filter className="w-4 h-4 text-violet-600" />
            </div>
            <span className="font-semibold text-gray-800 text-sm">Filter &amp; Pencarian</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-violet-600 text-white text-xs font-bold">
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
                {/* Row 1: Search + Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 pt-4">
                  {/* Search */}
                  <div className="relative sm:col-span-2 lg:col-span-1 xl:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      placeholder="Cari serial, perusahaan, ID radio..."
                      className="pl-9 h-9 text-sm border-gray-200 focus:border-violet-400 focus:ring-violet-400"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {/* Type Radio */}
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400 text-gray-700"
                  >
                    <option value="">Semua Type Radio</option>
                    {typeOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  {/* Fleet */}
                  <select
                    value={filterFleet}
                    onChange={(e) => setFilterFleet(e.target.value)}
                    className="h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400 text-gray-700"
                  >
                    <option value="">Semua Fleet</option>
                    {fleetOptions.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>

                  {/* Jenis */}
                  <select
                    value={filterJenis}
                    onChange={(e) => setFilterJenis(e.target.value)}
                    className="h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400 text-gray-700"
                  >
                    <option value="">Semua Jenis</option>
                    <option value="trunking">Trunking</option>
                    <option value="konvensional">Konvensional</option>
                  </select>
                </div>

                {/* Row 2: Checkboxes */}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${filterDuplikat ? "bg-red-500 border-red-500" : "border-gray-300 group-hover:border-red-400"}`}>
                      {filterDuplikat && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <input type="checkbox" checked={filterDuplikat} onChange={(e) => setFilterDuplikat(e.target.checked)} className="sr-only" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Duplikat ID</span>
                    {duplikatCount > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">{duplikatCount}</span>
                    )}
                  </label>
                </div>

                {/* Active Filter Chips */}
                {activeFilterCount > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    {search && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
                        Cari: &quot;{search}&quot;
                        <button onClick={() => setSearch("")} className="hover:text-violet-900 ml-0.5"><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {filterType && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        Type: {filterType}
                        <button onClick={() => setFilterType("")} className="hover:text-blue-900 ml-0.5"><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {filterFleet && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        Fleet: {filterFleet}
                        <button onClick={() => setFilterFleet("")} className="hover:text-blue-900 ml-0.5"><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {filterJenis && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        Jenis: {filterJenis}
                        <button onClick={() => setFilterJenis("")} className="hover:text-blue-900 ml-0.5"><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {filterDuplikat && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                        Duplikat ID
                        <button onClick={() => setFilterDuplikat(false)} className="hover:text-red-900 ml-0.5"><X className="w-3 h-3" /></button>
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
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Serial Number</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Type Radio</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Trunking</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">KONV</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Dept</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Perusahaan</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Tanggal</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Fleet</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">ID Radio</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Scrap</th>
                <th className="font-semibold text-gray-600 py-3 px-4 text-left whitespace-nowrap">Mark</th>
                {(hasPermission("radio.update") ||
                  hasPermission("radio.delete") ||
                  hasPermission("radio.scrap.create") ||
                  hasPermission("radio.view")) && (
                  <th className="font-semibold text-gray-600 py-3 px-4 text-right whitespace-nowrap">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                      <span className="text-sm text-muted-foreground">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <RadioIcon className="w-10 h-10 opacity-20" />
                      <span className="text-sm">Tidak ada data yang ditemukan</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const fleetList = parseFleetList(item.fleet);
                  const rowBg = item.isDuplicateId
                    ? "bg-red-50 hover:bg-red-100"
                    : "hover:bg-gray-50";
                  return (
                    <tr key={item.id} className={`border-b border-gray-100 transition-colors ${rowBg}`}>
                      <td className="py-3 px-4 font-mono whitespace-nowrap">{item.serialNumber || "-"}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{item.type || "-"}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.isTrunking ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold">Trunking</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.isConventional ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 text-xs font-semibold">Konvensional</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{item.department || "-"}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{item.company || "-"}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.tanggal
                          ? new Date(item.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                          : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {fleetList.slice(0, 4).map((f, i) => {
                            const colorClass = fleetColorMap.get(f) ?? "bg-gray-100 border-gray-300 text-gray-700";
                            return (
                              <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono font-semibold ${colorClass}`}>{f}</span>
                            );
                          })}
                          {fleetList.length > 4 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 border border-gray-300 text-gray-600 text-xs font-semibold">+{fleetList.length - 4}</span>
                          )}
                          {fleetList.length === 0 && <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`font-mono ${item.isDuplicateId ? "text-red-600 font-bold" : ""}`}>{item.radioId || "-"}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.isScrap ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-semibold">Scrap</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{item.mark || "-"}</td>
                      {(hasPermission("radio.update") ||
                        hasPermission("radio.delete") ||
                        hasPermission("radio.scrap.create") ||
                        hasPermission("radio.view")) && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-7 w-7 p-0 inline-flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {hasPermission("radio.update") && (
                                <DropdownMenuItem onClick={() => openEditModal(item)}>
                                  <Edit2 className="mr-2 h-4 w-4" />Edit
                                </DropdownMenuItem>
                              )}
                              {hasPermission("radio.scrap.create") && (
                                <DropdownMenuItem onClick={() => { setSelectedRadio(item); setIsScrapOpen(true); }}>
                                  <Trash2 className="mr-2 h-4 w-4" />Scrap
                                </DropdownMenuItem>
                              )}
                              {hasPermission("radio.view") && (
                                <DropdownMenuItem onClick={() => { setSelectedRadio(item); setIsHistoryOpen(true); }}>
                                  <History className="mr-2 h-4 w-4" />History
                                </DropdownMenuItem>
                              )}
                              {hasPermission("radio.delete") && (
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />Hapus
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}
                    </tr>
                  );
                })
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
              {isEditOpen ? "Edit Radio Contractor" : "Tambah Radio Contractor"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
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
              <label className="text-sm font-medium">Perusahaan</label>
              <Input
                value={formData.company}
                placeholder="e.g. PT. Contoh Jaya"
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Department (Dept)</label>
              <Input
                value={formData.department}
                placeholder="e.g. Mining"
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Channel</label>
              <Input
                value={formData.channel}
                placeholder="e.g. CH-01"
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal</label>
              <Input
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fleet</label>
              <Input
                value={formData.fleet}
                placeholder="e.g. 2001, 3401, 4501"
                onChange={(e) => setFormData({ ...formData, fleet: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Pisahkan dengan koma untuk beberapa fleet</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ID Radio</label>
              <Input
                value={formData.radioId}
                placeholder="e.g. 2001"
                onChange={(e) => setFormData({ ...formData, radioId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mark</label>
              <Input
                value={formData.mark}
                placeholder="e.g. OK"
                onChange={(e) => setFormData({ ...formData, mark: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Jenis Radio</label>
              <div className="flex gap-6 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="radioTypeContractor"
                    checked={formData.isTrunking}
                    onChange={() =>
                      setFormData({ ...formData, isTrunking: true, isConventional: false })
                    }
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Trunking</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="radioTypeContractor"
                    checked={formData.isConventional}
                    onChange={() =>
                      setFormData({ ...formData, isTrunking: false, isConventional: true })
                    }
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Konvensional</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="radioTypeContractor"
                    checked={!formData.isTrunking && !formData.isConventional}
                    onChange={() =>
                      setFormData({ ...formData, isTrunking: false, isConventional: false })
                    }
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Tidak Ditentukan</span>
                </label>
              </div>
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
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isEditOpen ? "Simpan Perubahan" : "Tambah Radio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Scrap Modal ── */}
      <ScrapRadioModal
        isOpen={isScrapOpen}
        onClose={() => setIsScrapOpen(false)}
        radioId={selectedRadio?.id}
        radioIdentifier={
          selectedRadio?.company ||
          selectedRadio?.serialNumber ||
          selectedRadio?.radioId ||
          ""
        }
        onSuccess={() => {
          setIsScrapOpen(false);
          loadData();
        }}
      />

      {/* ── Import Modal ── */}
      <RadioImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Radio Contractor"
        onImportSuccess={() => loadData()}
        importApiCall={radioApi.importContractor}
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
