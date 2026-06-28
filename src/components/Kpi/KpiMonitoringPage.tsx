import React, { useState, useEffect } from "react";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "../ui/table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { MobilePageHeader } from "../ui/MobilePageHeader";
import BottomSheet from "../common/BottomSheet";
import { 
    Search, Plus, Calendar, Edit2, Clock, Trash2, CheckCircle2, ChevronLeft, ChevronRight, Copy, Download, Upload, Link2, FileText, AlertCircle, MoreVertical, TrendingUp, Check, ChevronDown
} from "lucide-react";
import { motion } from "framer-motion";
import { kpiApi } from "../../services/kpiApi";
import { KpiDocument, KpiDocumentQuery } from "../../types/kpi";
import { useToast } from "../../hooks/use-toast";
import { hasPermission } from "../../utils/permissionUtils";
import KpiDatesModal from "./KpiDatesModal";
import KpiFormModal from "./KpiFormModal";
import { format, parseISO, subMonths } from "date-fns";

export default function KpiMonitoringPage() {
    const { toast } = useToast();
    
    // Default to current month
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().substring(0, 7) + "-01");
    
    const [data, setData] = useState<KpiDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDatesOpen, setIsDatesOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<KpiDocument | null>(null);
    const [selectedGroupDocs, setSelectedGroupDocs] = useState<KpiDocument[]>([]);
    const [mobActionsOpen, setMobActionsOpen] = useState(false);
    const [mobMonthOpen, setMobMonthOpen] = useState(false);
    const [mobSearchOpen, setMobSearchOpen] = useState(false);

    const [queryParams, setQueryParams] = useState<KpiDocumentQuery>({
        page: 1,
        pageSize: 100, // Load all for the month if possible
        search: "",
        periodMonth: currentMonth
    });

    useEffect(() => {
        setQueryParams(prev => ({ ...prev, periodMonth: currentMonth }));
    }, [currentMonth]);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParams]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await kpiApi.getAll(queryParams);
            const resData = response.data?.data || [];
            // Group the data by AreaGroup locally or just render it
            setData(resData as unknown as KpiDocument[]);
        } catch (error: any) {
            toast({
                title: "Error fetching data",
                description: error.response?.data?.message || error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQueryParams(prev => ({ ...prev, search: e.target.value, page: 1 }));
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value; // Format: "YYYY-MM"
        if (val) {
            setCurrentMonth(`${val}-01`);
        }
    };

    const handleCloneMonth = async () => {
        const targetDate = new Date(currentMonth);
        const sourceDate = subMonths(targetDate, 1);
        const sourceStr = format(sourceDate, "yyyy-MM-01");
        
        if (window.confirm(`Salin template data dari bulan ${format(sourceDate, "MMM yyyy")} ke ${format(targetDate, "MMM yyyy")}?`)) {
            try {
                await kpiApi.cloneMonth(sourceStr, currentMonth);
                toast({ title: "Berhasil disalin!" });
                fetchData();
            } catch (error: any) {
                toast({
                    title: "Gagal Clone",
                    description: error.response?.data?.message || "Terjadi kesalahan.",
                    variant: "destructive"
                });
            }
        }
    };

    const handleDeleteMonth = async () => {
        const targetDate = parseISO(currentMonth);
        if (window.confirm(`Yakin ingin membatalkan/menghapus seluruh data kosong di bulan ${format(targetDate, "MMM yyyy")}?\n\nCATATAN: Jika sudah ada dokumen yang diisi progresnya, penghapusan akan dibatalkan otomatis.`)) {
            try {
                await kpiApi.deleteMonth(currentMonth);
                toast({ title: "Berhasil dihapus!" });
                fetchData();
            } catch (error: any) {
                toast({
                    title: "Batal Menghapus",
                    description: error.response?.data?.message || "Terjadi kesalahan.",
                    variant: "destructive"
                });
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Hapus dokumen ini?")) {
            try {
                await kpiApi.delete(id);
                toast({ title: "Berhasil dihapus" });
                fetchData();
            } catch (error: any) {
                toast({
                    title: "Gagal menghapus",
                    description: error.response?.data?.message || "Error.",
                    variant: "destructive"
                });
            }
        }
    };

    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const response = await kpiApi.exportExcel(currentMonth);
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `KPI_Tracking_${currentMonth}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast({ title: "Berhasil download Excel" });
        } catch (error: any) {
            toast({
                title: "Gagal Export",
                description: "Terjadi kesalahan saat mengunduh Excel.",
                variant: "destructive"
            });
        } finally {
            setExporting(false);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImporting(true);
        try {
            await kpiApi.importExcel(file);
            toast({ title: "Berhasil mengimpor data KPI" });
            fetchData();
        } catch (error: any) {
            toast({
                title: "Gagal Import",
                description: error.response?.data?.message || "Terjadi kesalahan saat impor Excel.",
                variant: "destructive"
            });
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Selesai (Submitted RQM)":
            case "Selesai (Approved)":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Selesai</Badge>;
            case "Approved":
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Approved</Badge>;
            case "Menunggu Sign User ( Email )":
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">Menunggu Sign User ( Email )</Badge>;
            case "Menunggu Sign User":
                return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200">Menunggu Sign User</Badge>;
            case "Data Diterima":
                return <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-200">Data Diterima</Badge>;
            case "Menunggu Data":
            default:
                return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">Menunggu Data</Badge>;
        }
    };

    const formatDateStr = (dateStr?: string | null) => {
        if (!dateStr) return "-";
        try {
            return format(parseISO(dateStr), "dd/MM/yyyy");
        } catch {
            return dateStr;
        }
    };

    // Grouping logic for the UI
    const groupedData = data.reduce((acc, curr) => {
        if (!acc[curr.areaGroup]) acc[curr.areaGroup] = [];
        acc[curr.areaGroup].push(curr);
        return acc;
    }, {} as Record<string, KpiDocument[]>);

    // Smart grouping: merge rows that share the same explicit GroupTag within each areaGroup.
    // Rows without a groupTag are always standalone (each gets its own No).
    interface DataSourceGroup {
        dataSource: string; // representative label (first item's dataSource)
        groupTag: string | null;
        items: KpiDocument[];
    }

    const processGroupsForMerge = (items: KpiDocument[]): DataSourceGroup[] => {
        // Sort: tagged groups first (sorted by tag), then standalone by id
        const sorted = [...items].sort((a, b) => {
            const tagA = a.groupTag ?? "";
            const tagB = b.groupTag ?? "";
            if (tagA && tagB) return tagA.localeCompare(tagB);
            if (tagA) return -1;
            if (tagB) return 1;
            return a.id - b.id;
        });

        const groups: DataSourceGroup[] = [];

        sorted.forEach(item => {
            const tag = item.groupTag?.trim() || null;

            // Rows without a groupTag are ALWAYS standalone (tidak di-merge)
            if (!tag) {
                groups.push({
                    dataSource: item.dataSource,
                    groupTag: null,
                    items: [item]
                });
                return;
            }

            // Find existing group with the same tag
            const existing = groups.find(g => g.groupTag === tag);
            if (existing) {
                existing.items.push(item);
            } else {
                groups.push({ dataSource: item.dataSource, groupTag: tag, items: [item] });
            }
        });

        return groups;
    };

    interface SubGroup {
        dataSource: string;
        items: KpiDocument[];
    }

    interface TopLevelGroup {
        groupKey: string;
        groupTag: string | null;
        subGroups: SubGroup[];
        totalItemsCount: number;
    }

    const processMultiLevelGroups = (items: KpiDocument[]): TopLevelGroup[] => {
        const topGroups: TopLevelGroup[] = [];

        // Sort: tagged groups first (sorted by tag), then standalone by id
        const sorted = [...items].sort((a, b) => {
            const tagA = a.groupTag ?? "";
            const tagB = b.groupTag ?? "";
            if (tagA && tagB) return tagA.localeCompare(tagB);
            if (tagA) return -1;
            if (tagB) return 1;
            return a.id - b.id;
        });

        sorted.forEach(item => {
            const tag = item.groupTag?.trim() || null;
            
            const uniqueKey = tag ? `TAG_${tag}` : `ID_${item.id}`;

            let existingTop = topGroups.find(g => g.groupKey === uniqueKey);
            if (!existingTop) {
                existingTop = {
                    groupKey: uniqueKey,
                    groupTag: tag,
                    subGroups: [],
                    totalItemsCount: 0
                };
                topGroups.push(existingTop);
            }

            const dsKey = item.dataSource.toLowerCase();
            let existingSub = existingTop.subGroups.find(s => s.dataSource.toLowerCase() === dsKey);
            if (!existingSub) {
                existingSub = {
                    dataSource: item.dataSource,
                    items: []
                };
                existingTop.subGroups.push(existingSub);
            }

            existingSub.items.push(item);
            existingTop.totalItemsCount += 1;
        });

        return topGroups;
    };

    // Extract unique group tags for autocomplete
    const existingTags = Array.from(new Set(data.filter(d => !!d.groupTag).map(d => d.groupTag!))).sort();

    // Summary Calculations
    const totalDocs = data.length;
    const completedDocs = data.filter(d => d.status.includes("Selesai") || d.status === "Approved").length;
    const pendingReviewDocs = data.filter(d => d.status.includes("Menunggu Sign User")).length;
    const waitingDataDocs = data.filter(d => d.status.includes("Menunggu Data") || d.status.includes("Data Diterima") || (!d.status.includes("Selesai") && !d.status.includes("Menunggu Sign") && d.status !== "Approved")).length;

    // Month label for display
    const monthLabel = (() => {
        try { return format(parseISO(currentMonth), "MMMM yyyy"); } catch { return currentMonth; }
    })();

    return (
        <div className="space-y-4 md:space-y-6">

            {/* ── MOBILE HEADER ─────────────────────────────────────────── */}
            <MobilePageHeader
                label="PM Management"
                title="KPI Tracking"
                subtitle={`${totalDocs} dokumen · ${monthLabel}`}
                icon={<TrendingUp className="w-5 h-5 text-[#2B6CB0]" />}
                iconBg="bg-[#EBF4FF]"
                rightAction={
                    <button
                        onClick={() => setMobActionsOpen(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-[#F7F8FA] border border-[#E2E8F0] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors"
                        aria-label="Aksi"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                }
            />

            {/* ── MOBILE TOOLBAR CHIPS ──────────────────────────────────── */}
            <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar pb-1 px-0">
                {/* Month picker chip */}
                <button
                    onClick={() => setMobMonthOpen(true)}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-[10px] border border-[#E2E8F0] bg-white text-[#1B3A6B] text-[12px] font-semibold whitespace-nowrap flex-shrink-0"
                >
                    <Calendar className="w-3.5 h-3.5 text-[#2B6CB0]" />
                    {monthLabel}
                    <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {/* Search chip */}
                <button
                    onClick={() => setMobSearchOpen(v => !v)}
                    className={`flex items-center gap-1.5 h-9 px-3 rounded-[10px] border text-[12px] font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${mobSearchOpen ? 'bg-[#1B3A6B] border-[#1B3A6B] text-white' : 'bg-white border-[#E2E8F0] text-[#4A5568]'}`}
                >
                    <Search className="w-3.5 h-3.5" />
                    Cari
                </button>
                {/* Add chip */}
                {hasPermission("kpi.create") && (
                    <button
                        onClick={() => { setSelectedDoc(null); setIsFormOpen(true); }}
                        className="flex items-center gap-1.5 h-9 px-3 rounded-[10px] bg-[#D94F2B] text-white text-[12px] font-semibold whitespace-nowrap flex-shrink-0"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah
                    </button>
                )}
                <div className="w-2 flex-shrink-0" />
            </div>

            {/* Mobile search bar */}
            {mobSearchOpen && (
                <div className="md:hidden relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
                    <input
                        autoFocus
                        type="text"
                        onChange={handleSearch}
                        placeholder="Cari nama dokumen atau asal data..."
                        className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-[#E2E8F0] rounded-[10px] focus:outline-none focus:border-[#2B6CB0] bg-[#F7F8FA]"
                    />
                </div>
            )}

            {/* ── MOBILE ACTIONS BOTTOM SHEET ───────────────────────────── */}
            <BottomSheet open={mobActionsOpen} onClose={() => setMobActionsOpen(false)} title="Aksi Bulan Ini">
                <div className="space-y-2 pb-4">
                    <p className="text-[11px] font-semibold text-[#718096] uppercase tracking-wider px-1 mb-3">{monthLabel}</p>
                    {hasPermission("kpi.view") && (
                        <button onClick={() => { handleExportExcel(); setMobActionsOpen(false); }} disabled={exporting}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-[10px] text-[14px] font-medium text-[#1A202C] hover:bg-[#F7F8FA] transition-colors text-left">
                            <div className="w-9 h-9 rounded-[8px] bg-[#EBF4FF] flex items-center justify-center flex-shrink-0">
                                <Download className="w-4 h-4 text-[#2B6CB0]" />
                            </div>
                            {exporting ? "Mengekspor..." : "Export ke Excel"}
                        </button>
                    )}
                    {hasPermission("kpi.create") && (
                        <>
                            <input type="file" accept=".xlsx,.xls" hidden ref={fileInputRef} onChange={handleFileChange} />
                            <button onClick={() => { handleImportClick(); setMobActionsOpen(false); }} disabled={importing}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-[10px] text-[14px] font-medium text-[#1A202C] hover:bg-[#F7F8FA] transition-colors text-left">
                                <div className="w-9 h-9 rounded-[8px] bg-[#EBF4FF] flex items-center justify-center flex-shrink-0">
                                    <Upload className="w-4 h-4 text-[#2B6CB0]" />
                                </div>
                                {importing ? "Mengimpor..." : "Import dari Excel"}
                            </button>
                            <button onClick={() => { handleCloneMonth(); setMobActionsOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-[10px] text-[14px] font-medium text-[#1A202C] hover:bg-[#F7F8FA] transition-colors text-left">
                                <div className="w-9 h-9 rounded-[8px] bg-[#EBF4FF] flex items-center justify-center flex-shrink-0">
                                    <Copy className="w-4 h-4 text-[#2B6CB0]" />
                                </div>
                                Clone dari Bulan Lalu
                            </button>
                            {data.length > 0 && (
                                <button onClick={() => { handleDeleteMonth(); setMobActionsOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-[10px] text-[14px] font-medium text-red-600 hover:bg-red-50 transition-colors text-left">
                                    <div className="w-9 h-9 rounded-[8px] bg-red-50 flex items-center justify-center flex-shrink-0">
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </div>
                                    Hapus Data Bulan Ini
                                </button>
                            )}
                        </>
                    )}
                </div>
            </BottomSheet>

            {/* ── MOBILE MONTH PICKER BOTTOM SHEET ─────────────────────── */}
            <BottomSheet open={mobMonthOpen} onClose={() => setMobMonthOpen(false)} title="Pilih Bulan">
                <div className="pb-4 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 bg-[#F7F8FA] border border-[#E2E8F0] rounded-[12px] px-4 py-3 w-full">
                        <Calendar className="w-5 h-5 text-[#2B6CB0] flex-shrink-0" />
                        <input
                            type="month"
                            className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-[#1A202C] flex-1 outline-none"
                            value={currentMonth.substring(0, 7)}
                            onChange={(e) => { handleMonthChange(e); setMobMonthOpen(false); }}
                        />
                    </div>
                    {/* Quick month shortcuts */}
                    <div className="w-full space-y-1">
                        {[0, 1, 2, 3].map(offset => {
                            const d = subMonths(new Date(), offset);
                            const val = format(d, "yyyy-MM");
                            const label = format(d, "MMMM yyyy");
                            const isSelected = currentMonth.startsWith(val);
                            return (
                                <button key={val} onClick={() => { setCurrentMonth(val + "-01"); setMobMonthOpen(false); }}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-[10px] text-[14px] font-medium transition-colors ${isSelected ? 'bg-[#EBF4FF] text-[#1B3A6B] font-semibold' : 'text-[#1A202C] hover:bg-[#F7F8FA]'}`}>
                                    <span>{label}</span>
                                    {isSelected && <Check className="w-4 h-4 text-[#2B6CB0]" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </BottomSheet>

            {/* ── DESKTOP HEADER ────────────────────────────────────────── */}
            <div className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">KPI Document Monitoring</h2>
                    <p className="text-sm text-gray-500">Track and manage monthly KPI document flows.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <input type="month" className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 w-32"
                            value={currentMonth.substring(0, 7)} onChange={handleMonthChange} />
                    </div>
                    {hasPermission("kpi.view") && (
                        <Button variant="outline" onClick={handleExportExcel} disabled={exporting} className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                            <Download className="w-4 h-4 mr-2" />{exporting ? "Mengekspor..." : "Export"}
                        </Button>
                    )}
                    {hasPermission("kpi.create") && (
                        <>
                            <input type="file" accept=".xlsx, .xls" hidden ref={fileInputRef} onChange={handleFileChange} />
                            <Button variant="outline" onClick={handleImportClick} disabled={importing} className="bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100">
                                <Upload className="w-4 h-4 mr-2" />{importing ? "Mengimpor..." : "Import"}
                            </Button>
                            <Button variant="outline" onClick={handleCloneMonth} className="bg-[#EBF4FF] text-[#2B6CB0] border-[#2B6CB0]/20 hover:bg-[#D6EAF8]">
                                <Copy className="w-4 h-4 mr-2" />Clone Bulan Lalu
                            </Button>
                            {data.length > 0 && (
                                <Button variant="outline" onClick={handleDeleteMonth} className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
                                    <Trash2 className="w-4 h-4 mr-2" />Hapus Bulan Ini
                                </Button>
                            )}
                            <Button onClick={() => { setSelectedDoc(null); setIsFormOpen(true); }} className="bg-[#1B3A6B] hover:bg-[#2B6CB0]">
                                <Plus className="w-4 h-4 mr-2" />Tambah Baru
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Summary Cards — 2-col on mobile, 4-col on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {[
                    { label: "Total Dokumen", value: totalDocs, icon: FileText, color: "blue", tag: "ALL" },
                    { label: "Selesai", value: completedDocs, icon: CheckCircle2, color: "emerald", tag: "DONE" },
                    { label: "Pending TTD", value: pendingReviewDocs, icon: Clock, color: "amber", tag: "HOLD" },
                    { label: "Menunggu Data", value: waitingDataDocs, icon: AlertCircle, color: "rose", tag: "WAIT" },
                ].map(({ label, value, icon: Icon, color, tag }, i) => (
                    <motion.div key={label}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.07 }}
                        className="relative overflow-hidden bg-white rounded-[14px] p-4 md:p-6 shadow-sm border border-[#E2E8F0]"
                    >
                        <div className={`w-10 h-10 md:w-14 md:h-14 rounded-[10px] md:rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center mb-3`}>
                            <Icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                        </div>
                        <p className="text-[22px] md:text-4xl font-black text-[#1A202C] leading-none mb-1">{value}</p>
                        <p className="text-[11px] md:text-sm font-semibold text-[#718096]">{label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="bg-white rounded-[14px] md:rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                {/* Desktop search */}
                <div className="hidden md:flex items-center gap-3 p-4 border-b border-[#E2E8F0]">
                    <Search className="w-4 h-4 text-[#718096] flex-shrink-0" />
                    <Input placeholder="Cari nama dokumen atau sumber asalnya..."
                        onChange={handleSearch} className="bg-[#F7F8FA] border-[#E2E8F0] focus:border-[#2B6CB0]" />
                </div>

                {/* ── MOBILE CARD VIEW ───────────────────────────────────── */}
                <div className="md:hidden">
                    {loading && data.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-2 border-[#2B6CB0] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-12 px-6">
                            <div className="w-12 h-12 rounded-[14px] bg-[#EBF4FF] flex items-center justify-center mx-auto mb-3">
                                <FileText className="w-6 h-6 text-[#2B6CB0]" />
                            </div>
                            <p className="text-[14px] font-semibold text-[#1A202C] mb-1">Belum ada data</p>
                            <p className="text-[12px] text-[#718096]">Gunakan "Aksi" → Clone Bulan Lalu untuk membuat template.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#F0F0F0]">
                            {Object.entries(groupedData).map(([group, items]) => (
                                <div key={group}>
                                    {/* Group header */}
                                    <div className="px-4 py-2 bg-[#EBF4FF] flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#2B6CB0]" />
                                        <span className="text-[11px] font-bold text-[#1B3A6B] uppercase tracking-[0.08em]">{group}</span>
                                        <span className="ml-auto text-[11px] text-[#718096] font-medium">{items.length} dokumen</span>
                                    </div>
                                    {/* Cards */}
                                    <div className="p-3 space-y-3">
                                        {items.map((item) => (
                                            <div key={item.id} className="bg-[#F7F8FA] rounded-[12px] p-3 border border-[#E2E8F0]">
                                                {/* Header row */}
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-bold text-[#1A202C] leading-snug line-clamp-2">{item.documentName}</p>
                                                        <p className="text-[11px] text-[#718096] mt-0.5 truncate">
                                                            <span className="font-medium">Asal:</span> {item.dataSource}
                                                        </p>
                                                    </div>
                                                    <div className="flex-shrink-0">{getStatusBadge(item.status)}</div>
                                                </div>
                                                {/* Date progress row — 4 steps */}
                                                <div className="grid grid-cols-4 gap-1 bg-white rounded-[8px] p-2 border border-[#E2E8F0] mb-2">
                                                    {[
                                                        { label: "Terima", date: item.dateReceived },
                                                        { label: "Subm.", date: item.dateSubmittedToReviewer },
                                                        { label: "Apprvd", date: item.dateApproved },
                                                        { label: "RQM", date: item.dateSubmittedToRqm, highlight: true },
                                                    ].map(({ label, date, highlight }) => (
                                                        <div key={label} className="flex flex-col items-center gap-0.5">
                                                            <span className={`text-[9px] font-bold uppercase tracking-wider ${highlight ? 'text-[#2B6CB0]' : 'text-[#A0AEC0]'}`}>{label}</span>
                                                            <span className={`text-[10px] font-semibold text-center ${date ? (highlight ? 'text-[#1B3A6B]' : 'text-[#1A202C]') : 'text-[#CBD5E0]'}`}>
                                                                {date ? format(parseISO(date), "dd/MM") : "—"}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Remarks */}
                                                {item.remarks && (
                                                    <p className="text-[10px] text-red-500 font-bold mb-2 leading-tight">{item.remarks}</p>
                                                )}
                                                {/* Action buttons */}
                                                <div className="flex gap-2 justify-end">
                                                    {hasPermission("kpi.update") && (
                                                        <>
                                                            <button onClick={() => { setSelectedGroupDocs([item]); setIsDatesOpen(true); }}
                                                                className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-[#EBF4FF] text-[#2B6CB0] text-[11px] font-semibold border border-[#2B6CB0]/20">
                                                                <Clock className="w-3 h-3" /> Progress
                                                            </button>
                                                            <button onClick={() => { setSelectedDoc(item); setIsFormOpen(true); }}
                                                                className="w-8 h-8 rounded-[8px] bg-white border border-[#E2E8F0] flex items-center justify-center text-[#718096]">
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {hasPermission("kpi.delete") && (
                                                        <button onClick={() => handleDelete(item.id)}
                                                            className="w-8 h-8 rounded-[8px] bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop View — merged cell like Excel */}
                <div className="hidden md:block rounded-lg border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50 uppercase text-xs tracking-wider">
                                <TableHead className="w-[50px] text-center font-semibold border-r">No</TableHead>
                                <TableHead className="min-w-[200px] font-semibold">Nama Data</TableHead>
                                <TableHead className="min-w-[150px] font-semibold border-r">Asal Data</TableHead>
                                <TableHead className="text-center font-semibold min-w-[110px]">Date Received</TableHead>
                                <TableHead className="text-center font-semibold min-w-[120px]">Submitted To User</TableHead>
                                <TableHead className="text-center font-semibold min-w-[120px]">Approved By User</TableHead>
                                <TableHead className="text-center font-semibold min-w-[120px]">Submitted RQM</TableHead>
                                <TableHead className="text-center font-semibold">Status</TableHead>
                                <TableHead className="text-right font-semibold">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-10 text-gray-500">
                                        Loading data...
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-10 text-gray-500">
                                        Tidak ada data. Klik &apos;Clone Bulan Lalu&apos; untuk membuat template bulan ini.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                Object.entries(groupedData).map(([group, items]) => {
                                    const isGeneralGroup = group.toUpperCase() === "GENERAL";

                                    return (
                                        <React.Fragment key={group}>
                                            {/* Area Group Header */}
                                            <TableRow className="bg-indigo-50 hover:bg-indigo-50 border-t-2 border-indigo-200">
                                                <TableCell colSpan={9} className="py-2 text-center font-bold text-indigo-800 tracking-widest text-xs">
                                                    {group.toUpperCase()}
                                                </TableCell>
                                            </TableRow>

                                            {/* RENDER FOR GENERAL = MULTI-LEVEL MERGING */}
                                            {isGeneralGroup && processMultiLevelGroups(items).map((topGroup, topIdx) => (
                                                topGroup.subGroups.map((subGroup, subIdx) => (
                                                    subGroup.items.map((item, itemIdx) => {
                                                        const isFirstInTopGroup = subIdx === 0 && itemIdx === 0;
                                                        const isFirstInSubGroup = itemIdx === 0;
                                                        const refDoc = topGroup.subGroups[0].items[0];

                                                        return (
                                                            <TableRow key={item.id} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100 group">
                                                                {/* No */}
                                                                {isFirstInTopGroup && (
                                                                    <TableCell rowSpan={topGroup.totalItemsCount} className="text-center text-gray-500 font-semibold border-r align-middle bg-gray-50/60">
                                                                        {topIdx + 1}
                                                                    </TableCell>
                                                                )}
                                                                {/* Nama Data */}
                                                                <TableCell className="font-medium text-gray-900 py-2.5">
                                                                    {item.documentName}
                                                                </TableCell>
                                                                {/* Asal Data & Tag */}
                                                                {isFirstInSubGroup && (
                                                                    <TableCell rowSpan={subGroup.items.length} className="text-gray-600 text-sm border-l border-r align-middle bg-white">
                                                                        <span className="font-medium">{subGroup.dataSource}</span>
                                                                        {isFirstInTopGroup && topGroup.groupTag && (
                                                                            <div className="mt-1 block px-1.5 py-0.5 rounded-md bg-indigo-50 text-[10px] font-semibold text-indigo-600 border border-indigo-100 max-w-fit" title="Tag Grup (Tergabung)">
                                                                                <Link2 className="w-3 h-3 inline mr-1" /> {topGroup.groupTag}
                                                                            </div>
                                                                        )}
                                                                    </TableCell>
                                                                )}
                                                                {/* Date Received - INDIVIDUAL */}
                                                                <TableCell
                                                                    className="text-center text-sm font-medium cursor-pointer hover:bg-indigo-50 transition-colors border-r"
                                                                    onClick={() => { setSelectedGroupDocs([item]); setIsDatesOpen(true); }}
                                                                >
                                                                    {formatDateStr(item.dateReceived)}
                                                                </TableCell>
                                                                {/* Submitted To User */}
                                                                {isFirstInTopGroup && (
                                                                    <TableCell rowSpan={topGroup.totalItemsCount} className="text-center text-sm font-medium cursor-pointer hover:bg-indigo-100 transition-colors border-r" onClick={() => { setSelectedGroupDocs(topGroup.subGroups.flatMap(sg => sg.items)); setIsDatesOpen(true); }}>
                                                                        <div className="flex flex-col items-center">
                                                                            <span>{formatDateStr(refDoc.dateSubmittedToReviewer)}</span>
                                                                            {refDoc.remarksSubmittedToReviewer && <span className="text-[10px] text-gray-500 mt-0.5">{refDoc.remarksSubmittedToReviewer}</span>}
                                                                        </div>
                                                                    </TableCell>
                                                                )}
                                                                {/* Approved By User */}
                                                                {isFirstInTopGroup && (
                                                                    <TableCell rowSpan={topGroup.totalItemsCount} className="text-center text-sm font-medium cursor-pointer hover:bg-indigo-100 transition-colors border-r" onClick={() => { setSelectedGroupDocs(topGroup.subGroups.flatMap(sg => sg.items)); setIsDatesOpen(true); }}>
                                                                        <div className="flex flex-col items-center">
                                                                            <span>{formatDateStr(refDoc.dateApproved)}</span>
                                                                            {refDoc.remarksApproved && <span className="text-[10px] text-gray-500 mt-0.5">{refDoc.remarksApproved}</span>}
                                                                        </div>
                                                                    </TableCell>
                                                                )}
                                                                {/* Submitted RQM */}
                                                                {isFirstInTopGroup && (
                                                                    <TableCell rowSpan={topGroup.totalItemsCount} className="text-center text-sm font-medium cursor-pointer hover:bg-indigo-100 transition-colors border-r" onClick={() => { setSelectedGroupDocs(topGroup.subGroups.flatMap(sg => sg.items)); setIsDatesOpen(true); }}>
                                                                        <div className="flex flex-col items-center">
                                                                            <span>{formatDateStr(refDoc.dateSubmittedToRqm)}</span>
                                                                            {refDoc.remarksSubmittedToRqm && <span className="text-[10px] text-gray-500 mt-0.5">{refDoc.remarksSubmittedToRqm}</span>}
                                                                            {refDoc.remarks && <span className="text-[10px] text-red-500 font-bold">{refDoc.remarks}</span>}
                                                                        </div>
                                                                    </TableCell>
                                                                )}
                                                                {/* Status */}
                                                                {isFirstInTopGroup && (
                                                                    <TableCell rowSpan={topGroup.totalItemsCount} className="text-center border-r">
                                                                        {getStatusBadge(refDoc.status)}
                                                                    </TableCell>
                                                                )}
                                                                {/* Actions */}
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                                                        {hasPermission("kpi.update") && (
                                                                            <>
                                                                                <Button variant="ghost" size="icon" onClick={() => { setSelectedGroupDocs([item]); setIsDatesOpen(true); }} className="h-8 w-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 focus:ring-0" title="Edit Data Ini Saja">
                                                                                    <Clock className="w-4 h-4" />
                                                                                </Button>
                                                                                <Button variant="ghost" size="icon" onClick={() => { setSelectedDoc(item); setIsFormOpen(true); }} className="h-8 w-8 text-gray-600 hover:text-indigo-600 focus:ring-0">
                                                                                    <Edit2 className="w-4 h-4" />
                                                                                </Button>
                                                                            </>
                                                                        )}
                                                                        {hasPermission("kpi.delete") && (
                                                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 focus:ring-0">
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                ))
                                            ))}

                                            {/* RENDER FOR STANDARD GROUP */}
                                            {!isGeneralGroup && processGroupsForMerge(items).map((dsGroup, groupIdx) => (
                                                dsGroup.items.map((item, itemIdx) => (
                                                    <TableRow
                                                        key={item.id}
                                                        className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100 group"
                                                    >
                                                        {/* No — merged across the group */}
                                                        {itemIdx === 0 && (
                                                            <TableCell rowSpan={dsGroup.items.length} className="text-center text-gray-500 font-semibold border-r align-middle bg-gray-50/60">
                                                                {groupIdx + 1}
                                                            </TableCell>
                                                        )}
                                                        {/* Nama Data — individual per row */}
                                                        <TableCell className="font-medium text-gray-900 py-2.5">
                                                            {item.documentName}
                                                        </TableCell>
                                                        {/* Asal Data — merged when same dataSource */}
                                                        {itemIdx === 0 && (
                                                            <TableCell rowSpan={dsGroup.items.length} className="text-gray-600 text-sm border-l border-r align-middle bg-white">
                                                                <span className="font-medium">{dsGroup.dataSource}</span>
                                                                {dsGroup.groupTag && (
                                                                    <div className="mt-1 block px-1.5 py-0.5 rounded-md bg-indigo-50 text-[10px] font-semibold text-indigo-600 border border-indigo-100 max-w-fit" title="Tag Grup">
                                                                        <Link2 className="w-3 h-3 inline mr-1" /> {dsGroup.groupTag}
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                        )}
                                                        
                                                        {/* Date Received — Always per row */}
                                                        <TableCell className="text-center text-sm font-medium cursor-pointer hover:bg-indigo-50 transition-colors border-r" onClick={() => { setSelectedGroupDocs([item]); setIsDatesOpen(true); }}>
                                                            {formatDateStr(item.dateReceived)}
                                                        </TableCell>

                                                        {/* Submitted To User — Always per row */}
                                                        <TableCell className="text-center text-sm font-medium cursor-pointer hover:bg-indigo-50 transition-colors border-r" onClick={() => { setSelectedGroupDocs([item]); setIsDatesOpen(true); }}>
                                                            <div className="flex flex-col items-center">
                                                                <span>{formatDateStr(item.dateSubmittedToReviewer)}</span>
                                                                {item.remarksSubmittedToReviewer && <span className="text-[10px] text-gray-500 mt-0.5">{item.remarksSubmittedToReviewer}</span>}
                                                            </div>
                                                        </TableCell>

                                                        {/* Approved By User — Always per row */}
                                                        <TableCell className="text-center text-sm font-medium cursor-pointer hover:bg-indigo-50 transition-colors border-r" onClick={() => { setSelectedGroupDocs([item]); setIsDatesOpen(true); }}>
                                                            <div className="flex flex-col items-center">
                                                                <span>{formatDateStr(item.dateApproved)}</span>
                                                                {item.remarksApproved && <span className="text-[10px] text-gray-500 mt-0.5">{item.remarksApproved}</span>}
                                                            </div>
                                                        </TableCell>

                                                        {/* Submitted RQM — Always per row */}
                                                        <TableCell className="text-center text-sm font-medium cursor-pointer hover:bg-indigo-50 transition-colors border-r" onClick={() => { setSelectedGroupDocs([item]); setIsDatesOpen(true); }}>
                                                            <div className="flex flex-col items-center">
                                                                <span>{formatDateStr(item.dateSubmittedToRqm)}</span>
                                                                {item.remarksSubmittedToRqm && <span className="text-[10px] text-gray-500 mt-0.5">{item.remarksSubmittedToRqm}</span>}
                                                                {item.remarks && <span className="text-[10px] text-red-500 font-bold">{item.remarks}</span>}
                                                            </div>
                                                        </TableCell>

                                                        {/* Status */}
                                                        <TableCell className="text-center">{getStatusBadge(item.status)}</TableCell>

                                                        {/* Actions */}
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                                                {hasPermission("kpi.update") && (
                                                                    <>
                                                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedGroupDocs([item]); setIsDatesOpen(true); }} className="text-indigo-600 hover:text-indigo-800 focus:ring-0">
                                                                            <Clock className="w-4 h-4" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedDoc(item); setIsFormOpen(true); }} className="text-gray-600 hover:text-indigo-600 focus:ring-0">
                                                                            <Edit2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                {hasPermission("kpi.delete") && (
                                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 focus:ring-0">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ))}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <KpiFormModal 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                document={selectedDoc} 
                periodMonth={currentMonth}
                existingTags={existingTags}
                onSuccess={fetchData} 
            />

            <KpiDatesModal 
                isOpen={isDatesOpen} 
                onClose={() => setIsDatesOpen(false)} 
                documents={selectedGroupDocs} 
                onSuccess={fetchData} 
            />
        </div>
    );
}
