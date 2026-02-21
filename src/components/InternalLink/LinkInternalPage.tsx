import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { hasPermission } from "../../utils/permissionUtils";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Plus, Edit, Trash, Search, Eye, Image, Camera, X,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Wifi, WifiOff, Settings, Activity, Link2,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ReferenceLine,
    LineChart, Line,
} from "recharts";
import { internalLinkApi } from "../../services/internalLinkService";
import {
    InternalLinkListDto, InternalLinkHistoryItemDto, InternalLinkHistoryDetailDto,
    InternalLinkCreateDto, InternalLinkUpdateDto,
    InternalLinkHistoryCreateDto, InternalLinkHistoryUpdateDto,
    InternalLinkHistoryQueryDto,
    SERVICE_TYPE_OPTIONS, getServiceTypeLabel, STATUS_OPTIONS, getStatusLabel, getStatusColor, getStatusBgColor,
    LINK_TYPE_OPTIONS, getLinkTypeBadgeClass, DIRECTION_OPTIONS
} from "../../types/internalLink";

// ============================================
// RSL THRESHOLDS & UTILITIES (same as NEC)
// ============================================
const RSL_THRESHOLDS = {
    TOO_STRONG_MAX: -30, TOO_STRONG_MIN: -45,
    OPTIMAL_MAX: -45, OPTIMAL_MIN: -55,
    WARNING_MAX: -55, WARNING_MIN: -60,
    SUB_OPTIMAL_MAX: -60, SUB_OPTIMAL_MIN: -65,
    CRITICAL: -65,
};

const getRslStatus = (value: number | null): string => {
    if (value === null) return "no_data";
    if (value > RSL_THRESHOLDS.OPTIMAL_MAX) return "too_strong";
    if (value > RSL_THRESHOLDS.OPTIMAL_MIN && value <= RSL_THRESHOLDS.OPTIMAL_MAX) return "optimal";
    if (value > RSL_THRESHOLDS.WARNING_MIN && value <= RSL_THRESHOLDS.WARNING_MAX) return "warning";
    if (value > RSL_THRESHOLDS.SUB_OPTIMAL_MIN && value <= RSL_THRESHOLDS.SUB_OPTIMAL_MAX) return "sub_optimal";
    return "critical";
};

const getRslColor = (value: number | null | undefined): string => {
    const colors: Record<string, string> = {
        too_strong: "bg-red-200", optimal: "bg-green-200", warning: "bg-yellow-200",
        sub_optimal: "bg-orange-200", critical: "bg-red-300", no_data: "bg-gray-100",
    };
    return colors[getRslStatus(value ?? null)] || colors.no_data;
};

const getRslTextColor = (value: number | null | undefined): string => {
    const colors: Record<string, string> = {
        too_strong: "text-red-800", optimal: "text-green-800", warning: "text-yellow-800",
        sub_optimal: "text-orange-800", critical: "text-red-900", no_data: "text-gray-400",
    };
    return colors[getRslStatus(value ?? null)] || colors.no_data;
};

const getRslStatusLabel = (value: number | null | undefined): string => {
    const labels: Record<string, string> = {
        too_strong: "Terlalu Kuat", optimal: "Optimal", warning: "Warning",
        sub_optimal: "Sub-optimal", critical: "Critical", no_data: "No Data",
    };
    return labels[getRslStatus(value ?? null)] || labels.no_data;
};

// ============================================
// IMAGE COMPRESSION HELPER
// ============================================
function compressImage(file: File, quality = 0.75): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) return reject("Canvas context error");
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================
// MAIN COMPONENT
// ============================================
const LinkInternalPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("history");

    // Links
    const [links, setLinks] = useState<InternalLinkListDto[]>([]);

    // History (paginated for table)
    const [histories, setHistories] = useState<InternalLinkHistoryItemDto[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLinkId, setSelectedLinkId] = useState<number | undefined>();

    // ALL histories (for charts & pivot table)
    const [allHistories, setAllHistories] = useState<InternalLinkHistoryItemDto[]>([]);

    // UI
    const [loading, setLoading] = useState(false);

    // Link Modal
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkModalMode, setLinkModalMode] = useState<"create" | "edit">("create");
    const [editingLink, setEditingLink] = useState<InternalLinkListDto | null>(null);
    const [linkForm, setLinkForm] = useState<InternalLinkCreateDto>({
        linkName: "", linkGroup: "", direction: "TX", ipAddress: "", device: "", type: "", usedFrequency: "",
        serviceType: "LinkInternal", isActive: true,
    });

    // History Modal
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyModalMode, setHistoryModalMode] = useState<"create" | "edit">("create");
    const [editingHistory, setEditingHistory] = useState<InternalLinkHistoryItemDto | null>(null);
    const [historyForm, setHistoryForm] = useState<InternalLinkHistoryCreateDto>({
        internalLinkId: 0, date: format(new Date(), "yyyy-MM-dd"),
        rslNearEnd: undefined, uptime: undefined, notes: "", screenshotBase64: null, status: "Active",
    });
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Detail Modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailHistory, setDetailHistory] = useState<InternalLinkHistoryDetailDto | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Group Detail Modal (From Yearly Chart)
    const [showGroupDetailModal, setShowGroupDetailModal] = useState(false);
    const [selectedGroupLinks, setSelectedGroupLinks] = useState<InternalLinkListDto[]>([]);
    const [selectedGroupName, setSelectedGroupName] = useState("");

    // Screenshot lightbox
    const [screenshotLightbox, setScreenshotLightbox] = useState<string | null>(null);
    const [screenshotLightboxLoading, setScreenshotLightboxLoading] = useState(false);

    // Pivot table hover & notes
    const [hoveredCell, setHoveredCell] = useState<{
        rowIdx: number; colIdx: number; linkId: number; linkName: string;
        month: string; monthIdx: number; value: number | null;
    } | null>(null);
    const [pivotNotes, setPivotNotes] = useState<Record<string, string>>({});
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<{ linkId: number; linkName: string; monthKey: string; monthLabel: string } | null>(null);
    const [noteText, setNoteText] = useState("");

    // Delete confirm
    const [confirmDelete, setConfirmDelete] = useState<{ type: "link" | "history"; id: number } | null>(null);

    // Chart
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    // Pivot filters
    const [pivotLinkFilter, setPivotLinkFilter] = useState<string | null>(null);
    const [pivotTypeFilter, setPivotTypeFilter] = useState<string | null>(null);

    // Chart filters (shared between monthly and yearly)
    const [chartLinkFilter, setChartLinkFilter] = useState<string | null>(null);
    const [chartTypeFilter, setChartTypeFilter] = useState<string | null>(null);

    // ============================================
    // DATA FETCHING
    // ============================================
    const fetchLinks = useCallback(async () => {
        try {
            const data = await internalLinkApi.getLinks();
            setLinks(data);
        } catch (err: any) {
            toast({ title: "Error", description: err.response?.data?.message || "Gagal memuat data link", variant: "destructive" });
        }
    }, []);

    const fetchHistories = useCallback(async (page = 1, search = "", linkId?: number) => {
        try {
            setLoading(true);
            const result = await internalLinkApi.getHistories({
                page, pageSize: 15, search, internalLinkId: linkId,
                sortBy: "Date", sortDir: "desc",
            });
            setHistories(result.data);
            setCurrentPage(result.page);
            setTotalPages(result.totalPages);
            setTotalCount(result.totalCount);
        } catch (err: any) {
            toast({ title: "Error", description: err.response?.data?.message || "Gagal memuat data history", variant: "destructive" });
            setHistories([]);
            setTotalPages(1);
            setCurrentPage(1);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAllHistories = useCallback(async () => {
        try {
            const result = await internalLinkApi.getHistories({
                page: 1, pageSize: 9999, sortBy: "Date", sortDir: "desc",
            });
            setAllHistories(result.data);
        } catch (err: any) {
            setAllHistories([]);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchLinks(), fetchHistories(), fetchAllHistories()]);
            setLoading(false);
        };
        init();
    }, [fetchLinks, fetchHistories, fetchAllHistories]);

    // ============================================
    // LINK CRUD
    // ============================================
    const openLinkModal = (mode: "create" | "edit", link?: InternalLinkListDto) => {
        setLinkModalMode(mode);
        if (mode === "edit" && link) {
            setEditingLink(link);
            setLinkForm({
                linkName: link.linkName, linkGroup: link.linkGroup || "", direction: link.directionString || "TX",
                ipAddress: link.ipAddress || "",
                device: link.device || "", type: link.type || "",
                usedFrequency: link.usedFrequency || "",
                serviceType: link.serviceTypeString || "LinkInternal",
                isActive: link.isActive,
            });
        } else {
            setEditingLink(null);
            setLinkForm({
                linkName: "", linkGroup: "", direction: "TX", ipAddress: "", device: "", type: "", usedFrequency: "",
                serviceType: "LinkInternal", isActive: true,
            });
        }
        setShowLinkModal(true);
    };

    const handleLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (linkModalMode === "edit" && editingLink) {
                await internalLinkApi.updateLink(editingLink.id, { ...linkForm, id: editingLink.id } as InternalLinkUpdateDto);
                toast({ title: "Berhasil", description: "Link berhasil diupdate" });
            } else {
                await internalLinkApi.createLink(linkForm);
                toast({ title: "Berhasil", description: "Link berhasil ditambahkan" });
            }
            setShowLinkModal(false);
            fetchLinks();
        } catch (err: any) {
            toast({ title: "Error", description: err.response?.data?.message || "Gagal menyimpan link", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLink = async (id: number) => {
        try {
            setLoading(true);
            await internalLinkApi.deleteLink(id);
            toast({ title: "Berhasil", description: "Link berhasil dihapus" });
            setConfirmDelete(null);
            fetchLinks();
        } catch (err: any) {
            toast({ title: "Error", description: err.response?.data?.message || "Gagal menghapus link", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // HISTORY CRUD
    // ============================================
    const openHistoryModal = (mode: "create" | "edit", history?: InternalLinkHistoryItemDto) => {
        setHistoryModalMode(mode);
        if (mode === "edit" && history) {
            setEditingHistory(history);
            setHistoryForm({
                internalLinkId: history.internalLinkId,
                date: format(new Date(history.date), "yyyy-MM-dd"),
                rslNearEnd: history.rslNearEnd,
                uptime: history.uptime, notes: history.notes || "",
                screenshotBase64: null, status: getStatusLabel(history.status),
            });
            setScreenshotPreview(null);
        } else {
            setEditingHistory(null);
            setHistoryForm({
                internalLinkId: selectedLinkId || (links.length > 0 ? links[0].id : 0),
                date: format(new Date(), "yyyy-MM-dd"),
                rslNearEnd: undefined, uptime: undefined, notes: "",
                screenshotBase64: null, status: "Active",
            });
            setScreenshotPreview(null);
        }
        setShowHistoryModal(true);
    };

    const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast({ title: "Error", description: "File harus berupa gambar", variant: "destructive" });
            return;
        }
        try {
            const compressed = await compressImage(file, 0.75);
            setScreenshotPreview(compressed);
            setHistoryForm(prev => ({ ...prev, screenshotBase64: compressed }));
        } catch {
            toast({ title: "Error", description: "Gagal memproses gambar", variant: "destructive" });
        }
    };

    const handleHistorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (historyModalMode === "edit" && editingHistory) {
                const updateDto: InternalLinkHistoryUpdateDto = {
                    rslNearEnd: historyForm.rslNearEnd,
                    uptime: historyForm.uptime, notes: historyForm.notes,
                    status: historyForm.status,
                    screenshotBase64: historyForm.screenshotBase64 || undefined,
                };
                await internalLinkApi.updateHistory(editingHistory.id, updateDto);
                toast({ title: "Berhasil", description: "History berhasil diupdate" });
            } else {
                await internalLinkApi.createHistory(historyForm);
                toast({ title: "Berhasil", description: "History berhasil ditambahkan" });
            }
            setShowHistoryModal(false);
            fetchHistories(currentPage, searchTerm, selectedLinkId);
            fetchAllHistories();
        } catch (err: any) {
            toast({ title: "Error", description: err.response?.data?.message || "Gagal menyimpan history", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteHistory = async (id: number) => {
        try {
            setLoading(true);
            await internalLinkApi.deleteHistory(id);
            toast({ title: "Berhasil", description: "History berhasil dihapus" });
            setConfirmDelete(null);
            fetchHistories(currentPage, searchTerm, selectedLinkId);
            fetchAllHistories();
        } catch (err: any) {
            toast({ title: "Error", description: err.response?.data?.message || "Gagal menghapus history", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (id: number) => {
        try {
            setDetailLoading(true);
            setShowDetailModal(true);
            const detail = await internalLinkApi.getHistoryById(id);
            setDetailHistory(detail);
        } catch (err: any) {
            toast({ title: "Error", description: err.response?.data?.message || "Gagal memuat detail", variant: "destructive" });
        } finally {
            setDetailLoading(false);
        }
    };

    const handleViewScreenshot = async (id: number) => {
        try {
            setScreenshotLightboxLoading(true);
            setScreenshotLightbox("loading");
            const detail = await internalLinkApi.getHistoryById(id);
            if (detail.screenshotBase64) {
                setScreenshotLightbox(detail.screenshotBase64);
            } else {
                setScreenshotLightbox(null);
                toast({ title: "Info", description: "Screenshot tidak tersedia" });
            }
        } catch (err: any) {
            setScreenshotLightbox(null);
            toast({ title: "Error", description: "Gagal memuat screenshot", variant: "destructive" });
        } finally {
            setScreenshotLightboxLoading(false);
        }
    };

    // ============================================
    // CHART DATA GENERATORS
    // ============================================
    const getMonthlyChartData = () => {
        // Calculate average RSL per link based on ALL histories in the selected month/year
        const filteredIds = new Set(links.filter(l => {
            if (chartLinkFilter && !l.linkName.toLowerCase().includes(chartLinkFilter.toLowerCase())) return false;
            if (chartTypeFilter && l.type !== chartTypeFilter) return false;
            return true;
        }).map(l => l.id));

        const linkMap: Record<string, { sum: number; count: number; linkName: string }> = {};

        const monthHistories = allHistories.filter(h => {
            const d = new Date(h.date);
            return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth && filteredIds.has(h.internalLinkId);
        });

        monthHistories.forEach(h => {
            if (h.rslNearEnd != null) {
                if (!linkMap[h.linkName]) linkMap[h.linkName] = { sum: 0, count: 0, linkName: h.linkName };
                linkMap[h.linkName].sum += h.rslNearEnd;
                linkMap[h.linkName].count++;
            }
        });

        return Object.values(linkMap)
            .filter(v => v.count > 0)
            .map(v => ({ linkName: v.linkName, avgRsl: Math.round((v.sum / v.count) * 10) / 10 }));
    };

    const getPieChartData = () => {
        const barData = getMonthlyChartData();
        const statusCount = { too_strong: 0, optimal: 0, warning: 0, sub_optimal: 0, critical: 0 };
        barData.forEach(d => {
            const s = getRslStatus(d.avgRsl);
            if (s in statusCount) statusCount[s as keyof typeof statusCount]++;
        });
        return [
            { name: "Too Strong", value: statusCount.too_strong, fill: "#ef4444" },
            { name: "Optimal", value: statusCount.optimal, fill: "#10b981" },
            { name: "Warning", value: statusCount.warning, fill: "#f59e0b" },
            { name: "Sub-optimal", value: statusCount.sub_optimal, fill: "#fb923c" },
            { name: "Critical", value: statusCount.critical, fill: "#dc2626" },
        ].filter(item => item.value > 0);
    };

    const getYearlyChartData = () => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const filteredIds = new Set(links.filter(l => {
            if (chartLinkFilter && !l.linkName.toLowerCase().includes(chartLinkFilter.toLowerCase())) return false;
            if (chartTypeFilter && l.type !== chartTypeFilter) return false;
            return true;
        }).map(l => l.id));
        // Calculate average RSL per month across filtered links based on ALL histories in the selected year
        return months.map((m, i) => {
            const monthRslValues = allHistories
                .filter(h => {
                    const d = new Date(h.date);
                    return d.getFullYear() === selectedYear && d.getMonth() === i && h.rslNearEnd != null && filteredIds.has(h.internalLinkId);
                })
                .map(h => h.rslNearEnd!);

            const avg = monthRslValues.length > 0 ? monthRslValues.reduce((a, b) => a + b, 0) / monthRslValues.length : null;
            return { date: m, value: avg !== null ? Math.round(avg * 10) / 10 : null };
        });
    };

    const availableYears = () => {
        const years = [new Date().getFullYear()];
        allHistories.forEach(h => {
            const y = new Date(h.date).getFullYear();
            if (!years.includes(y)) years.push(y);
        });
        return years.sort((a, b) => b - a);
    };

    // ============================================
    // RENDER: MONTHLY CHART
    // ============================================
    const renderMonthlyChart = () => {
        const barData = getMonthlyChartData();
        const pieData = getPieChartData();
        if (loading) {
            return (
                <div className="space-y-6 p-4">
                    <div className="flex justify-between">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-8 w-64" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-[400px] w-full" />
                        <Skeleton className="h-[300px] w-full" />
                    </div>
                    <Skeleton className="h-[400px] w-full" />
                </div>
            );
        }

        const monthNames = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const filteredLinks = links.filter(l => {
            if (chartLinkFilter && !l.linkName.toLowerCase().includes(chartLinkFilter.toLowerCase())) return false;
            if (chartTypeFilter && l.type !== chartTypeFilter) return false;
            return true;
        });

        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h3 className="text-xl font-semibold">Performa Bulanan - {monthNames[selectedMonth]} {selectedYear}</h3>
                    <div className="flex flex-wrap gap-2">
                        <Input placeholder="Cari link..." className="w-[160px]" value={chartLinkFilter ?? ""}
                            onChange={(e) => setChartLinkFilter(e.target.value || null)} />
                        <Select value={chartTypeFilter ?? "all"} onValueChange={(v) => setChartTypeFilter(v === "all" ? null : v)}>
                            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Tipe" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tipe</SelectItem>
                                {LINK_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle>Grafik Bar Rata-rata RSL</CardTitle></CardHeader>
                        <CardContent>
                            {barData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={barData} margin={{ top: 20, right: 80, left: 20, bottom: 100 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="linkName" angle={-45} textAnchor="end" height={100} interval={0} tick={{ fontSize: 9 }} />
                                        <YAxis domain={[-70, -30]} label={{ value: "RSL (dBm)", angle: -90, position: "insideLeft" }} />
                                        <Tooltip formatter={(value: any) => [`${value} dBm`, "Average RSL"]} />
                                        <Legend wrapperStyle={{ paddingTop: "10px" }} />
                                        <ReferenceLine y={-45} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Optimal (-45)", position: "right", fill: "#10b981", fontSize: 10 }} />
                                        <ReferenceLine y={-55} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Warning (-55)", position: "right", fill: "#f59e0b", fontSize: 10 }} />
                                        <ReferenceLine y={-60} stroke="#fb923c" strokeDasharray="3 3" label={{ value: "Sub-opt (-60)", position: "right", fill: "#fb923c", fontSize: 10 }} />
                                        <ReferenceLine y={-65} stroke="#dc2626" strokeDasharray="3 3" label={{ value: "Critical (-65)", position: "right", fill: "#dc2626", fontSize: 10 }} />
                                        <Bar dataKey="avgRsl" fill="#3b82f6" name="Average RSL" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <p className="text-center text-gray-400 py-10">Belum ada data RSL</p>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Distribusi Status Link</CardTitle></CardHeader>
                        <CardContent>
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent! * 100).toFixed(0)}%`}
                                            outerRadius={80} fill="#8884d8" dataKey="value">
                                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value} links`} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <p className="text-center text-gray-400 py-10">Belum ada data</p>}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Detail Per Link</CardTitle></CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Link</TableHead>
                                        <TableHead>Tipe</TableHead>
                                        <TableHead>IP Address</TableHead>
                                        <TableHead>RSL Near End</TableHead>
                                        <TableHead>Status RSL</TableHead>
                                        <TableHead>Service</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLinks.map(link => {
                                        // Compute average RSL from history for selected month/year
                                        const histRsl = allHistories
                                            .filter(h => {
                                                const d = new Date(h.date);
                                                return h.internalLinkId === link.id && d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth && h.rslNearEnd != null;
                                            })
                                            .map(h => h.rslNearEnd!);
                                        const avgRsl = histRsl.length > 0 ? Math.round((histRsl.reduce((a, b) => a + b, 0) / histRsl.length) * 10) / 10 : null;

                                        return (
                                            <TableRow key={link.id}>
                                                <TableCell className="font-medium">{link.linkName}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getLinkTypeBadgeClass(link.type)}`}>
                                                        {link.type || "-"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{link.ipAddress || "-"}</TableCell>
                                                <TableCell>
                                                    {avgRsl != null ? (
                                                        <span className={`font-mono font-semibold ${getRslTextColor(avgRsl)}`}>
                                                            {avgRsl.toFixed(1)} dBm
                                                        </span>
                                                    ) : <span className="text-gray-400">-</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {avgRsl != null ? (
                                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getRslColor(avgRsl)} ${getRslTextColor(avgRsl)}`}>{getRslStatusLabel(avgRsl)}</span>
                                                    ) : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {getServiceTypeLabel(link.serviceType)}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        );
    };

    // ============================================
    // RENDER: YEARLY CHART
    // ============================================
    const renderYearlyChart = () => {
        if (loading) {
            return (
                <div className="space-y-6 p-4">
                    <div className="flex justify-between">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-8 w-64" />
                    </div>
                    <Skeleton className="h-[400px] w-full" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            );
        }

        const chartData = getYearlyChartData();
        const filteredLinks = links.filter(l => {
            if (chartLinkFilter && !l.linkName.toLowerCase().includes(chartLinkFilter.toLowerCase())) return false;
            if (chartTypeFilter && l.type !== chartTypeFilter) return false;
            return true;
        });

        // Group links for the table
        const groupedLinks: Record<string, typeof filteredLinks> = {};
        filteredLinks.forEach(link => {
            const groupKey = link.linkGroup || link.linkName;
            if (!groupedLinks[groupKey]) groupedLinks[groupKey] = [];
            groupedLinks[groupKey].push(link);
        });
        const groupKeys = Object.keys(groupedLinks).sort();
        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h3 className="text-xl font-semibold">Ringkasan Tahunan - {selectedYear}</h3>
                    <div className="flex flex-wrap gap-2">
                        <Input placeholder="Cari link..." className="w-[160px]" value={chartLinkFilter ?? ""}
                            onChange={(e) => setChartLinkFilter(e.target.value || null)} />
                        <Select value={chartTypeFilter ?? "all"} onValueChange={(v) => setChartTypeFilter(v === "all" ? null : v)}>
                            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Tipe" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tipe</SelectItem>
                                {LINK_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Card>
                    <CardHeader><CardTitle>Grafik Area Rata-rata Bulanan</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis domain={[-70, -30]} />
                                <Tooltip formatter={(value: any) => [`${value} dBm`, "Rata-rata RSL"]} />
                                <ReferenceLine y={-45} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Optimal Max (-45)", position: "insideBottomRight", fill: "#10b981" }} />
                                <ReferenceLine y={-55} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Warning (-55)", position: "insideBottomRight", fill: "#f59e0b" }} />
                                <ReferenceLine y={-60} stroke="#fb923c" strokeDasharray="3 3" label={{ value: "Sub-optimal (-60)", position: "insideBottomRight", fill: "#fb923c" }} />
                                <ReferenceLine y={-65} stroke="#dc2626" strokeDasharray="3 3" label={{ value: "Critical (-65)", position: "insideBottomRight", fill: "#dc2626" }} />
                                <Area type="monotone" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} name="⇒ value" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Statistik Detail Per Link</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto border rounded-xl shadow-sm">
                            <table className="w-full min-w-max text-xs text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="border-r border-b p-2 font-bold bg-[#00a651] text-white text-center w-10 align-middle" rowSpan={2}>No</th>
                                        <th className="border-r border-b p-2 font-bold bg-[#00a651] text-white text-center w-48 align-middle sticky left-0 z-20" rowSpan={2}>Link</th>
                                        {months.map((m) => (
                                            <th key={m} className="border-r border-b p-1.5 font-bold bg-[#00a651] text-white text-center" colSpan={2}>{m}</th>
                                        ))}
                                    </tr>
                                    <tr>
                                        {months.map((m) => (
                                            <React.Fragment key={`${m}-sub`}>
                                                <th className="border-r border-b p-1 font-bold bg-[#42bbed] text-white text-center w-10">TX</th>
                                                <th className="border-r border-b p-1 font-bold bg-[#ff0000] text-white text-center w-10">RX</th>
                                            </React.Fragment>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupKeys.map((groupName, idx) => {
                                        const groupLinks = groupedLinks[groupName];
                                        return (
                                            <tr key={groupName} className="hover:bg-gray-50 bg-white">
                                                <td className="border-r border-b p-1.5 text-center font-medium bg-white">{idx + 1}</td>
                                                <td className="border-r border-b p-1.5 font-semibold text-blue-600 sticky left-0 z-10 bg-white">
                                                    <button onClick={() => {
                                                        setSelectedGroupName(groupName);
                                                        setSelectedGroupLinks(groupLinks);
                                                        setShowGroupDetailModal(true);
                                                    }} className="hover:underline text-left w-full focus:outline-none">
                                                        {groupName}
                                                    </button>
                                                </td>
                                                {months.map((_, monthIdx) => {
                                                    // Find TX and RX data
                                                    const txLink = groupLinks.find(l => l.directionString === 'TX') || groupLinks[0];
                                                    const rxLink = groupLinks.find(l => l.directionString === 'RX') || groupLinks[groupLinks.length > 1 ? 1 : 0];

                                                    // Calculate average RSL for TX Link
                                                    const histTx = allHistories.filter(h => {
                                                        const d = new Date(h.date);
                                                        return h.internalLinkId === txLink?.id && d.getFullYear() === selectedYear && d.getMonth() === monthIdx && h.rslNearEnd != null;
                                                    });
                                                    const txVal = histTx.length > 0 ? histTx.reduce((a, b) => a + b.rslNearEnd!, 0) / histTx.length : null;

                                                    // Calculate average RSL for RX Link
                                                    const histRx = allHistories.filter(h => {
                                                        const d = new Date(h.date);
                                                        return h.internalLinkId === rxLink?.id && d.getFullYear() === selectedYear && d.getMonth() === monthIdx && h.rslNearEnd != null;
                                                    });
                                                    const rxVal = histRx.length > 0 ? histRx.reduce((a, b) => a + b.rslNearEnd!, 0) / histRx.length : null;

                                                    return (
                                                        <React.Fragment key={`data-${monthIdx}`}>
                                                            <td className="border-r border-b p-1 text-center font-mono font-medium">
                                                                {txVal != null ? (
                                                                    <span className={getRslTextColor(txVal)}>{Math.round(txVal)}</span>
                                                                ) : ""}
                                                            </td>
                                                            <td className="border-r border-b p-1 text-center font-mono font-medium bg-gray-50/50">
                                                                {rxVal != null ? (
                                                                    <span className={getRslTextColor(rxVal)}>{Math.round(rxVal)}</span>
                                                                ) : ""}
                                                            </td>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Peringatan Detail Per Link (Cards) */}
                        <div className="mt-8">
                            <h4 className="font-semibold text-lg mb-4 text-gray-800 border-b pb-2">Detail Peringatan Per Link</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredLinks.map(link => {
                                    const hist = allHistories.filter(h => h.internalLinkId === link.id && new Date(h.date).getFullYear() === selectedYear && h.rslNearEnd != null);
                                    const avg = hist.length > 0 ? (hist.reduce((a, b) => a + b.rslNearEnd!, 0) / hist.length) : null;

                                    const warnings: { month: string, status: string, value: number }[] = [];
                                    months.forEach((month, idx) => {
                                        const monthHist = hist.filter(h => new Date(h.date).getMonth() === idx);
                                        const monthAvg = monthHist.length > 0 ? (monthHist.reduce((a, b) => a + b.rslNearEnd!, 0) / monthHist.length) : null;
                                        if (monthAvg !== null) {
                                            const status = getRslStatusLabel(monthAvg);
                                            // Asumsi: Optimal adalah bagus, lainnya adalah warning
                                            if (status !== 'Optimal') {
                                                warnings.push({ month: month.substring(0, 3), status, value: monthAvg });
                                            }
                                        }
                                    });

                                    return (
                                        <Card key={link.id} className="shadow-sm border-gray-200">
                                            <CardContent className="p-4 flex flex-col h-full">
                                                <div className="mb-2">
                                                    <h4 className="font-bold text-gray-800 line-clamp-1" title={link.linkName}>{link.linkName}</h4>
                                                    <p className="text-xs text-gray-500">{link.type || "-"}</p>
                                                </div>
                                                <div className="flex justify-between items-center mb-4 py-2 border-b border-gray-100">
                                                    <span className="text-xs text-gray-500">Rata-rata Tahunan:</span>
                                                    {avg !== null ? (
                                                        <span className={`font-mono font-bold ${getRslTextColor(avg)}`}>{avg.toFixed(1)} dBm</span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Tidak ada data</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    {warnings.length > 0 ? (
                                                        <div className="bg-red-50 p-2.5 rounded text-xs border border-red-100">
                                                            <p className="font-semibold text-red-700 flex items-center mb-1.5"><Activity className="w-3 h-3 mr-1" /> Peringatan:</p>
                                                            <ul className="space-y-1 text-red-600 list-disc pl-4">
                                                                {warnings.map((w, i) => (
                                                                    <li key={i}>
                                                                        <span className="font-medium">{w.month}:</span> {w.status} ({w.value.toFixed(1)} dBm)
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-green-50 p-3 rounded flex items-center justify-center h-full border border-green-100">
                                                            <p className="text-xs text-green-700 text-center font-medium">✨ Semua nilai optimal tahun ini</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>
        );
    };

    // ============================================
    // MAIN RENDER
    // ============================================
    return (
        <div className="w-full p-4">
            {/* Header — same style as NEC */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Link Internal Monitoring</h1>
                <div className="flex space-x-2">
                    <Button onClick={() => navigate("/dashboard")} variant="outline">Kembali ke Dashboard</Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                {/* Tab Navigation — same style as NEC */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-wrap gap-3">
                        <button onClick={() => { setActiveTab("history"); fetchHistories(1, searchTerm, selectedLinkId); }}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "history" ? "bg-blue-100 text-blue-700 border border-blue-200" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}>
                            <span className="flex items-center gap-2">
                                <span>📋</span><span>Daftar History</span>
                                {totalCount > 0 && <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs font-semibold">{totalCount}</span>}
                            </span>
                        </button>
                        <button onClick={() => setActiveTab("links")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "links" ? "bg-blue-100 text-blue-700 border border-blue-200" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}>
                            <span className="flex items-center gap-2"><span>🔗</span><span>Kelola Link</span></span>
                        </button>
                        <button onClick={() => setActiveTab("pivot")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "pivot" ? "bg-blue-100 text-blue-700 border border-blue-200" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}>
                            <span className="flex items-center gap-2"><span>📊</span><span>Pivot Table</span></span>
                        </button>
                        <button onClick={() => setActiveTab("monthly")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "monthly" ? "bg-blue-100 text-blue-700 border border-blue-200" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}>
                            <span className="flex items-center gap-2"><span>📈</span><span>Grafik Bulanan</span></span>
                        </button>
                        <button onClick={() => setActiveTab("yearly")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "yearly" ? "bg-blue-100 text-blue-700 border border-blue-200" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}>
                            <span className="flex items-center gap-2"><span>📉</span><span>Grafik Tahunan</span></span>
                        </button>
                    </div>
                </div>

                {/* ============================================ */}
                {/* TAB: DAFTAR HISTORY */}
                {/* ============================================ */}
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Daftar History RSL</CardTitle>
                                {hasPermission("internal.link.create") && (
                                    <Button onClick={() => openHistoryModal("create")}><Plus className="mr-2 h-4 w-4" /> Tambah Data</Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex space-x-4 mb-4">
                                <div className="flex-1">
                                    <Input placeholder="Cari history..." value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") fetchHistories(1, searchTerm, selectedLinkId); }} />
                                </div>
                                <Select value={selectedLinkId?.toString() || "all"}
                                    onValueChange={(v) => {
                                        const val = v === "all" ? undefined : parseInt(v);
                                        setSelectedLinkId(val);
                                        fetchHistories(1, searchTerm, val);
                                    }}>
                                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Semua Link" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Link</SelectItem>
                                        {links.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.linkName}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button onClick={() => fetchHistories(1, searchTerm, selectedLinkId)}><Search className="h-4 w-4" /></Button>
                            </div>

                            {loading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : histories.length > 0 ? (
                                <div className="space-y-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>No</TableHead>
                                                <TableHead>Tanggal</TableHead>
                                                <TableHead>Link</TableHead>
                                                <TableHead>IP Address</TableHead>
                                                <TableHead>Frekuensi</TableHead>
                                                <TableHead>RSL</TableHead>
                                                <TableHead>Uptime</TableHead>
                                                <TableHead>Screenshot</TableHead>
                                                <TableHead>Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {histories.map(h => {
                                                const parentLink = links.find(l => l.id === h.internalLinkId);
                                                return (
                                                    <TableRow key={h.id}>
                                                        <TableCell>{h.no || h.id}</TableCell>
                                                        <TableCell>{format(new Date(h.date), "dd/MM/yyyy")}</TableCell>
                                                        <TableCell className="font-medium">{h.linkName}</TableCell>
                                                        <TableCell className="font-mono text-xs">{parentLink?.ipAddress || "-"}</TableCell>
                                                        <TableCell className="text-xs">{parentLink?.usedFrequency || "-"}</TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                {h.rslNearEnd != null ? (
                                                                    <>
                                                                        <span className={`font-mono font-semibold ${getRslTextColor(h.rslNearEnd)}`}>
                                                                            {h.rslNearEnd.toFixed(1)} dBm
                                                                        </span>
                                                                        <span className="text-xs text-gray-500 mt-1">{getRslStatusLabel(h.rslNearEnd)}</span>
                                                                    </>
                                                                ) : <span className="text-gray-400">-</span>}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{h.uptime != null ? `${h.uptime} Hari` : "-"}</TableCell>
                                                        <TableCell>
                                                            {h.hasScreenshot ? (
                                                                <button onClick={() => handleViewScreenshot(h.id)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Lihat Screenshot">
                                                                    <Camera className="h-5 w-5" />
                                                                </button>
                                                            ) : <span className="text-gray-300">-</span>}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex space-x-1">
                                                                <Button variant="ghost" size="sm" onClick={() => handleViewDetail(h.id)} title="Detail"><Eye className="h-4 w-4" /></Button>
                                                                {hasPermission("internal.link.update") && (
                                                                    <Button variant="ghost" size="sm" onClick={() => openHistoryModal("edit", h)} title="Edit"><Edit className="h-4 w-4" /></Button>
                                                                )}
                                                                {hasPermission("internal.link.delete") && (
                                                                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete({ type: "history", id: h.id })} title="Hapus"><Trash className="h-4 w-4" /></Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>

                                    {/* Pagination — same style as NEC */}
                                    <div className="flex justify-between items-center pt-4 border-t">
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => fetchHistories(1, searchTerm, selectedLinkId)}>
                                                <ChevronsLeft className="h-4 w-4 mr-1" /> Awal
                                            </Button>
                                            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => fetchHistories(currentPage - 1, searchTerm, selectedLinkId)}>
                                                <ChevronLeft className="h-4 w-4 mr-1" /> Sebelumnya
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">Halaman {currentPage} dari {totalPages}</span>
                                            <span className="text-xs text-gray-400">(Menampilkan {histories.length} data)</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => fetchHistories(currentPage + 1, searchTerm, selectedLinkId)}>
                                                Berikutnya <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => fetchHistories(totalPages, searchTerm, selectedLinkId)}>
                                                Akhir <ChevronsRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Alert className="mt-4">
                                    <AlertDescription className="flex flex-col items-center justify-center py-8">
                                        <Search className="h-12 w-12 text-gray-400 mb-2" />
                                        <p className="text-lg font-medium">Belum ada data history</p>
                                        <p className="text-sm text-gray-500 mt-1">Klik "Tambah Data" untuk menambahkan history baru</p>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============================================ */}
                {/* TAB: PIVOT TABLE — NEC History Style */}
                {/* ============================================ */}
                <TabsContent value="pivot" className="space-y-6">
                    {/* Header Card with Filters */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <CardTitle>RSL History - Pivot Table ({selectedYear})</CardTitle>
                                <div className="flex flex-wrap gap-2">
                                    <Input placeholder="Cari link..." className="w-[160px]" value={pivotLinkFilter ?? ""}
                                        onChange={(e) => setPivotLinkFilter(e.target.value)} />
                                    <Select value={pivotTypeFilter ?? "all"} onValueChange={(v) => setPivotTypeFilter(v === "all" ? null : v)}>
                                        <SelectTrigger className="w-[120px]"><SelectValue placeholder="Tipe" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Tipe</SelectItem>
                                            {LINK_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                                        <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {availableYears().map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" size="sm" onClick={() => fetchAllHistories()} disabled={loading}>
                                        <span className={`mr-2 ${loading ? 'animate-spin' : ''}`}>↻</span> Refresh
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Line Chart — RSL per Link */}
                    {(() => {
                        if (loading) {
                            return (
                                <div className="space-y-6">
                                    <Skeleton className="h-[400px] w-full" />
                                    <Skeleton className="h-[300px] w-full" />
                                    <Skeleton className="h-[400px] w-full" />
                                </div>
                            );
                        }

                        const CHART_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#a855f7'];
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                        // Build pivot data from allHistories
                        const filteredLinks = links.filter(link => {
                            if (pivotLinkFilter && !link.linkName.toLowerCase().includes(pivotLinkFilter.toLowerCase())) return false;
                            if (pivotTypeFilter && link.type !== pivotTypeFilter) return false;
                            return true;
                        });
                        const pivotLinks = filteredLinks.map(link => {
                            const monthlyValues: Record<string, number | null> = {};
                            monthNames.forEach((m, idx) => {
                                const key = `${m}-${selectedYear.toString().slice(-2)}`;
                                const vals = allHistories.filter(h => {
                                    const d = new Date(h.date);
                                    return h.internalLinkId === link.id && d.getFullYear() === selectedYear && d.getMonth() === idx && h.rslNearEnd != null;
                                });
                                monthlyValues[key] = vals.length > 0 ? vals.reduce((acc, h) => acc + h.rslNearEnd!, 0) / vals.length : null;
                            });
                            return { ...link, monthlyValues };
                        });

                        // Line chart data
                        const lineChartData = monthNames.map(month => {
                            const point: Record<string, any> = { month };
                            pivotLinks.forEach(link => {
                                const key = `${month}-${selectedYear.toString().slice(-2)}`;
                                point[link.linkName] = link.monthlyValues[key];
                            });
                            return point;
                        });

                        // Pie chart data
                        const statusCount = { too_strong: 0, optimal: 0, warning: 0, sub_optimal: 0, critical: 0 };
                        pivotLinks.forEach(link => {
                            Object.values(link.monthlyValues).forEach(val => {
                                if (val !== null) {
                                    const s = getRslStatus(val);
                                    if (s !== 'no_data') statusCount[s as keyof typeof statusCount]++;
                                }
                            });
                        });
                        const pieData = [
                            { name: 'Too Strong', value: statusCount.too_strong, fill: '#ef4444' },
                            { name: 'Optimal', value: statusCount.optimal, fill: '#10b981' },
                            { name: 'Warning', value: statusCount.warning, fill: '#f59e0b' },
                            { name: 'Sub-optimal', value: statusCount.sub_optimal, fill: '#fb923c' },
                            { name: 'Critical', value: statusCount.critical, fill: '#dc2626' },
                        ].filter(d => d.value > 0);

                        return (
                            <>
                                {/* Line Chart */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="w-1 h-6 bg-blue-600 rounded" />
                                            Grafik Garis Rata-rata RSL per Link
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                                                <div className="flex items-start gap-2">
                                                    <Activity className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-semibold mb-1">Menampilkan {pivotLinks.length} link</p>
                                                        <p className="text-xs">Hover pada garis untuk melihat detail nilai. Scroll legend di bawah untuk melihat semua link.</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-br from-gray-50 to-white border rounded-lg p-4">
                                                <ResponsiveContainer width="100%" height={500}>
                                                    <LineChart data={lineChartData} margin={{ top: 20, right: 60, left: 20, bottom: 20 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                                                        <YAxis domain={[-95, -30]} label={{ value: 'RSL (dBm)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }} tick={{ fontSize: 11, fill: '#6b7280' }} />
                                                        <Tooltip formatter={(value: any) => value !== null && value !== undefined ? `${value} dBm` : 'No Data'}
                                                            contentStyle={{ backgroundColor: 'rgba(255,255,255,0.96)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                                        <ReferenceLine y={-45} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Optimal (-45)', position: 'right', fill: '#10b981', fontSize: 10, fontWeight: 600 }} />
                                                        <ReferenceLine y={-55} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Warning (-55)', position: 'right', fill: '#f59e0b', fontSize: 10, fontWeight: 600 }} />
                                                        <ReferenceLine y={-60} stroke="#fb923c" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Sub-opt (-60)', position: 'right', fill: '#fb923c', fontSize: 10, fontWeight: 600 }} />
                                                        <ReferenceLine y={-65} stroke="#dc2626" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Critical (-65)', position: 'right', fill: '#dc2626', fontSize: 10, fontWeight: 600 }} />
                                                        {pivotLinks.map((link, idx) => (
                                                            <Line key={link.linkName} type="monotone" dataKey={link.linkName} stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                                                                strokeWidth={2} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} connectNulls={false} name={link.linkName} />
                                                        ))}
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                            {/* Legend */}
                                            <div className="border rounded-lg bg-white">
                                                <div className="bg-gray-50 px-4 py-2 border-b">
                                                    <h4 className="text-sm font-semibold text-gray-700">Legend - Daftar Link</h4>
                                                </div>
                                                <div className="max-h-40 overflow-y-auto p-3">
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                        {pivotLinks.map((link, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 text-xs">
                                                                <div className="w-8 h-0.5 flex-shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                                                                <span className="truncate" title={link.linkName}>{link.linkName}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Pie Chart */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="w-1 h-6 bg-green-600 rounded" />
                                            Distribusi Status Link
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                            <div className="flex justify-center">
                                                <ResponsiveContainer width="100%" height={320}>
                                                    <PieChart>
                                                        <Pie data={pieData} cx="50%" cy="50%" labelLine={true}
                                                            label={(entry) => `${entry.name}: ${((entry.percent ?? 0) * 100).toFixed(0)}%`}
                                                            outerRadius={100} fill="#8884d8" dataKey="value">
                                                            {pieData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                                                        </Pie>
                                                        <Tooltip formatter={(value: any) => [`${value} data points`, 'Jumlah']}
                                                            contentStyle={{ backgroundColor: 'rgba(255,255,255,0.96)', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="space-y-3">
                                                {pieData.map((entry, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-4 h-4 rounded" style={{ backgroundColor: entry.fill }} />
                                                            <span className="font-medium text-sm">{entry.name}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold">{entry.value}</p>
                                                            <p className="text-xs text-gray-500">data points</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Pivot Table */}
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="overflow-x-auto rounded-md border">
                                            <table className="w-full border-collapse text-sm bg-white">
                                                <thead>
                                                    <tr className="bg-blue-600 text-white">
                                                        <th className="border px-4 py-3 sticky left-0 bg-blue-600 z-10 min-w-[60px]">No</th>
                                                        <th className="border px-4 py-3 sticky left-[60px] bg-blue-600 z-10 min-w-[220px]">Link</th>
                                                        <th colSpan={12} className="border px-4 py-3">RSL - dBm</th>
                                                    </tr>
                                                    <tr className="bg-blue-500 text-white">
                                                        <th className="border px-4 py-2"></th>
                                                        <th className="border px-4 py-2"></th>
                                                        {monthNames.map((month, idx) => (
                                                            <th key={idx} className="border px-3 py-2 min-w-[100px]">
                                                                {month}-{selectedYear.toString().slice(-2)}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pivotLinks.map((row, rowIdx) => (
                                                        <tr key={rowIdx} className="group hover:bg-gray-50">
                                                            <td className="border px-4 py-3 text-center sticky left-0 bg-white z-10 group-hover:bg-gray-50">{rowIdx + 1}</td>
                                                            <td className="border px-4 py-3 sticky left-[60px] bg-white z-10 group-hover:bg-gray-50">
                                                                <div className="font-semibold">{row.linkName}</div>
                                                                <div className="text-xs text-gray-500">IP: {row.ipAddress || '-'}</div>
                                                            </td>
                                                            {monthNames.map((month, monthIdx) => {
                                                                const key = `${row.id}-${month}-${selectedYear.toString().slice(-2)}`;
                                                                const value = row.monthlyValues[`${month}-${selectedYear.toString().slice(-2)}`];
                                                                const note = pivotNotes[key];
                                                                const isDataPresent = value !== null && value !== undefined;
                                                                const isHovered = hoveredCell?.rowIdx === rowIdx && hoveredCell?.colIdx === monthIdx;
                                                                return (
                                                                    <td key={monthIdx}
                                                                        onMouseEnter={() => setHoveredCell({ rowIdx, colIdx: monthIdx, linkId: row.id, linkName: row.linkName, month, monthIdx, value })}
                                                                        onMouseLeave={() => setHoveredCell(null)}
                                                                        className={`border px-2 py-2 text-center font-mono relative cursor-pointer ${isDataPresent ? `${getRslColor(value)} ${getRslTextColor(value)}` : 'bg-gray-50'
                                                                            } ${isHovered ? 'ring-2 ring-blue-500' : ''}`}>
                                                                        {isDataPresent ? (
                                                                            <>
                                                                                <div className="font-bold">
                                                                                    {value!.toFixed(1)}
                                                                                    {note && <span className="ml-1 text-blue-600 text-xs">📝</span>}
                                                                                </div>
                                                                                <div className="text-xs opacity-75">dBm</div>
                                                                            </>
                                                                        ) : note ? (
                                                                            <div className="text-xs text-gray-600 italic px-1">
                                                                                {note.length > 20 ? `${note.substring(0, 20)}...` : note}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-gray-400 text-sm">-</div>
                                                                        )}

                                                                        {/* Hover Popup */}
                                                                        {isHovered && (
                                                                            <div className={`absolute left-1/2 transform -translate-x-1/2 ${rowIdx < 3 ? 'top-full mt-2' : 'bottom-full mb-2'} w-64 p-3 bg-gray-900 text-white text-xs rounded shadow-lg z-50`}>
                                                                                <div className="relative">
                                                                                    <div className={`absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-transparent ${rowIdx < 3 ? '-top-2 border-b-8 border-b-gray-900' : '-bottom-2 border-t-8 border-t-gray-900'}`} />
                                                                                    <div className="mb-2">
                                                                                        <h4 className="font-bold">{row.linkName}</h4>
                                                                                        <p className="text-gray-300 text-xs">{month} {selectedYear}</p>
                                                                                    </div>
                                                                                    {isDataPresent && (
                                                                                        <div className="mb-3">
                                                                                            <p className="text-lg font-bold">{value!.toFixed(1)} dBm</p>
                                                                                            <span className={`px-2 py-1 rounded text-xs text-black font-medium ${getRslColor(value)}`}>
                                                                                                {getRslStatusLabel(value)}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                    {note && (
                                                                                        <div className="mb-3 p-2 bg-yellow-900/30 rounded">
                                                                                            <p className="font-semibold">📝 Catatan:</p>
                                                                                            <p className="text-sm">{note}</p>
                                                                                        </div>
                                                                                    )}
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setEditingNote({ linkId: row.id, linkName: row.linkName, monthKey: key, monthLabel: `${month} ${selectedYear}` });
                                                                                            setNoteText(note || '');
                                                                                            setIsNoteModalOpen(true);
                                                                                        }}
                                                                                        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors">
                                                                                        {note ? '✏️ Edit Note' : '📝 Add Note'}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Status Legend */}
                                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                                            <h4 className="font-semibold mb-2">Status Legend</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                                                <div className="flex items-center gap-2"><div className="w-6 h-4 bg-red-200 border rounded" /><span>Too Strong (-30 to -45)</span></div>
                                                <div className="flex items-center gap-2"><div className="w-6 h-4 bg-green-200 border rounded" /><span>Optimal (-45 to -55)</span></div>
                                                <div className="flex items-center gap-2"><div className="w-6 h-4 bg-yellow-200 border rounded" /><span>Warning (-55 to -60)</span></div>
                                                <div className="flex items-center gap-2"><div className="w-6 h-4 bg-orange-200 border rounded" /><span>Sub-optimal (-60 to -65)</span></div>
                                                <div className="flex items-center gap-2"><div className="w-6 h-4 bg-red-300 border rounded" /><span>Critical (&lt; -65)</span></div>
                                                <div className="flex items-center gap-2"><div className="w-6 h-4 bg-gray-100 border rounded" /><span>No Data</span></div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        );
                    })()}
                </TabsContent>

                {/* ============================================ */}
                {/* TAB: KELOLA LINK */}
                {/* ============================================ */}
                <TabsContent value="links">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Kelola Link Internal</CardTitle>
                                {hasPermission("internal.link.create") && (
                                    <Button onClick={() => openLinkModal("create")}><Plus className="mr-2 h-4 w-4" /> Tambah Link</Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-4 mt-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : links.length === 0 ? (
                                <Alert className="mt-4">
                                    <AlertDescription className="flex flex-col items-center justify-center py-8">
                                        <WifiOff className="h-12 w-12 text-gray-400 mb-2" />
                                        <p className="text-lg font-medium">Belum ada link internal</p>
                                        <p className="text-sm text-gray-500 mt-1">Klik "Tambah Link" untuk menambahkan</p>
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>No</TableHead>
                                            <TableHead>Link Name</TableHead>
                                            <TableHead>Group</TableHead>
                                            <TableHead>Dir</TableHead>
                                            <TableHead>Tipe</TableHead>
                                            <TableHead>IP Address</TableHead>
                                            <TableHead>Device</TableHead>
                                            <TableHead>Frequency</TableHead>
                                            <TableHead>Service</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>History</TableHead>
                                            <TableHead>Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {links.map((link, idx) => (
                                            <TableRow key={link.id}>
                                                <TableCell>{idx + 1}</TableCell>
                                                <TableCell className="font-medium">{link.linkName}</TableCell>
                                                <TableCell>{link.linkGroup || "-"}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${link.directionString === 'TX' ? 'bg-indigo-100 text-indigo-700' : link.directionString === 'RX' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {link.directionString !== 'None' ? link.directionString : "-"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getLinkTypeBadgeClass(link.type)}`}>
                                                        {link.type || "-"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{link.ipAddress || "-"}</TableCell>
                                                <TableCell>{link.device || "-"}</TableCell>
                                                <TableCell>{link.usedFrequency || "-"}</TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {getServiceTypeLabel(link.serviceType)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${link.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                        {link.isActive ? "Active" : "Inactive"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{link.historyCount}</TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-1">
                                                        {hasPermission("internal.link.update") && (
                                                            <Button variant="ghost" size="sm" onClick={() => openLinkModal("edit", link)}><Edit className="h-4 w-4" /></Button>
                                                        )}
                                                        {hasPermission("internal.link.delete") && (
                                                            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete({ type: "link", id: link.id })}><Trash className="h-4 w-4" /></Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============================================ */}
                {/* TAB: GRAFIK BULANAN */}
                {/* ============================================ */}
                <TabsContent value="monthly">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Grafik Performa Bulanan</CardTitle>
                                <div className="flex items-center gap-2">
                                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="border rounded-md px-3 py-1.5 text-sm">
                                        {availableYears().map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                        className="border rounded-md px-3 py-1.5 text-sm">
                                        {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                                            <option key={i} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>{renderMonthlyChart()}</CardContent>
                    </Card>
                </TabsContent>

                {/* ============================================ */}
                {/* TAB: GRAFIK TAHUNAN */}
                {/* ============================================ */}
                <TabsContent value="yearly">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Grafik Ringkasan Tahunan</CardTitle>
                                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="border rounded-md px-3 py-1.5 text-sm">
                                    {availableYears().map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </CardHeader>
                        <CardContent>{renderYearlyChart()}</CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* MODAL: LINK CREATE/EDIT */}
            <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{linkModalMode === "edit" ? "Edit Link" : "Tambah Link Baru"}</DialogTitle>
                        <DialogDescription>Isi detail link internal di bawah ini.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleLinkSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Link Name *</Label>
                                <Input value={linkForm.linkName} onChange={(e) => setLinkForm(prev => ({ ...prev, linkName: e.target.value }))} placeholder="e.g. AB to Surya" required />
                            </div>
                            <div>
                                <Label>Link Group</Label>
                                <Input value={linkForm.linkGroup || ""} onChange={(e) => setLinkForm(prev => ({ ...prev, linkGroup: e.target.value }))} placeholder="e.g. AB - Surya (Bisa dikosongi)" title="Gunakan nama yang sama untuk TX dan RX agar digabung di grafik tahunan" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label>Direction (TX/RX)</Label>
                                <select value={linkForm.direction || ""} onChange={(e) => setLinkForm(prev => ({ ...prev, direction: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm">
                                    <option value="None">-- Pilih --</option>
                                    {DIRECTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div><Label>IP Address</Label><Input value={linkForm.ipAddress || ""} onChange={(e) => setLinkForm(prev => ({ ...prev, ipAddress: e.target.value }))} placeholder="192.168.1.1" /></div>
                            <div><Label>Device</Label><Input value={linkForm.device || ""} onChange={(e) => setLinkForm(prev => ({ ...prev, device: e.target.value }))} placeholder="Router/Switch" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Tipe Link</Label>
                                <select value={linkForm.type || ""} onChange={(e) => setLinkForm(prev => ({ ...prev, type: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm">
                                    <option value="">-- Pilih Tipe --</option>
                                    {LINK_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div><Label>Used Frequency</Label><Input value={linkForm.usedFrequency || ""} onChange={(e) => setLinkForm(prev => ({ ...prev, usedFrequency: e.target.value }))} placeholder="5.8 GHz" /></div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <Label>Service Type</Label>
                                <select value={linkForm.serviceType || "LinkInternal"} onChange={(e) => setLinkForm(prev => ({ ...prev, serviceType: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm">
                                    {SERVICE_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={linkForm.isActive} onChange={(e) => setLinkForm(prev => ({ ...prev, isActive: e.target.checked }))} className="rounded" />
                            <Label>Active</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowLinkModal(false)}>Batal</Button>
                            <Button type="submit" disabled={loading}>{loading ? "Menyimpan..." : linkModalMode === "edit" ? "Simpan Perubahan" : "Tambah Link"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL: HISTORY CREATE/EDIT */}
            <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{historyModalMode === "edit" ? "Edit History" : "Tambah History Baru"}</DialogTitle>
                        <DialogDescription>Isi detail history recording link internal.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleHistorySubmit} className="space-y-4">
                        <div>
                            <Label>Link *</Label>
                            <select value={historyForm.internalLinkId} onChange={(e) => setHistoryForm(prev => ({ ...prev, internalLinkId: Number(e.target.value) }))} disabled={historyModalMode === "edit"} className="w-full border rounded-md px-3 py-2 text-sm disabled:opacity-50">
                                <option value={0}>-- Pilih Link --</option>
                                {links.map(l => <option key={l.id} value={l.id}>{l.linkName}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Tanggal *</Label><Input type="date" required value={historyForm.date} onChange={(e) => setHistoryForm(prev => ({ ...prev, date: e.target.value }))} /></div>
                            <div><Label>RSL Near End (dBm)</Label><Input type="number" step="0.01" value={historyForm.rslNearEnd ?? ""} onChange={(e) => setHistoryForm(prev => ({ ...prev, rslNearEnd: e.target.value ? Number(e.target.value) : undefined }))} placeholder="-45.5" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Uptime (Hari)</Label><Input type="number" step="1" min="0" value={historyForm.uptime ?? ""} onChange={(e) => setHistoryForm(prev => ({ ...prev, uptime: e.target.value ? Number(e.target.value) : undefined }))} placeholder="365" /></div>
                            <div>
                                <Label>Status</Label>
                                <select value={historyForm.status || "Active"} onChange={(e) => setHistoryForm(prev => ({ ...prev, status: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm">
                                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <textarea rows={3} value={historyForm.notes || ""} onChange={(e) => setHistoryForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Catatan tambahan..." className="w-full border rounded-md px-3 py-2 text-sm resize-none" />
                        </div>
                        <div>
                            <Label>Screenshot</Label>
                            <div className="border-2 border-dashed rounded-xl p-4 text-center hover:border-blue-300 transition-colors">
                                {screenshotPreview ? (
                                    <div className="relative">
                                        <img src={screenshotPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                                        <button type="button" onClick={() => { setScreenshotPreview(null); setHistoryForm(prev => ({ ...prev, screenshotBase64: null })); }} className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white"><X className="w-3 h-3" /></button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 text-gray-400 hover:text-blue-500 transition-colors mx-auto">
                                        <Image className="w-8 h-8" /><span className="text-sm">Klik untuk upload screenshot</span><span className="text-xs text-gray-400">JPEG/PNG — di-compress otomatis</span>
                                    </button>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleScreenshotUpload} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowHistoryModal(false)}>Batal</Button>
                            <Button type="submit" disabled={loading}>{loading ? "Menyimpan..." : historyModalMode === "edit" ? "Simpan Perubahan" : "Tambah History"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL: DETAIL */}
            <Dialog open={showDetailModal} onOpenChange={(open) => { setShowDetailModal(open); if (!open) setDetailHistory(null); }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Detail History</DialogTitle></DialogHeader>
                    {detailLoading ? (
                        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
                    ) : detailHistory ? (() => {
                        const detailLink = links.find(l => l.id === detailHistory.internalLinkId);
                        return (
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">Link</span>
                                        <p className="font-semibold text-base mt-1">{detailHistory.linkName}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">Tanggal</span>
                                        <p className="mt-1">{format(new Date(detailHistory.date), "dd MMMM yyyy")}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">Status</span>
                                        <p className="mt-1"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusLabel(detailHistory.status) === "Active" ? "bg-green-100 text-green-800" : getStatusLabel(detailHistory.status) === "Down" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{getStatusLabel(detailHistory.status)}</span></p>
                                    </div>
                                </div>

                                {/* Link detail info */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Link2 className="h-4 w-4" /> Informasi Link</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase tracking-wider">IP Address</span>
                                            <p className="font-mono text-sm mt-1">{detailLink?.ipAddress || "-"}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase tracking-wider">Device</span>
                                            <p className="text-sm mt-1">{detailLink?.device || "-"}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase tracking-wider">Frekuensi</span>
                                            <p className="text-sm mt-1">{detailLink?.usedFrequency || "-"}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase tracking-wider">Service Type</span>
                                            <p className="mt-1"><span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{detailLink ? getServiceTypeLabel(detailLink.serviceType) : "-"}</span></p>
                                        </div>
                                    </div>
                                </div>

                                {/* RSL & Uptime */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white border rounded-lg p-4">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">RSL Near End</span>
                                        <p className={`font-mono font-bold text-xl mt-1 ${getRslTextColor(detailHistory.rslNearEnd)}`}>{detailHistory.rslNearEnd != null ? `${detailHistory.rslNearEnd.toFixed(1)} dBm` : "-"}</p>
                                        {detailHistory.rslNearEnd != null && <span className="text-xs text-gray-500">{getRslStatusLabel(detailHistory.rslNearEnd)}</span>}
                                    </div>
                                    <div className="bg-white border rounded-lg p-4">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">Uptime</span>
                                        <p className="font-mono font-bold text-xl mt-1">{detailHistory.uptime != null ? `${detailHistory.uptime} Hari` : "-"}</p>
                                    </div>
                                </div>

                                {detailHistory.notes && (
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">Notes</span>
                                        <p className="text-sm mt-2 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{detailHistory.notes}</p>
                                    </div>
                                )}

                                {detailHistory.screenshotBase64 && (
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">Screenshot</span>
                                        <div className="mt-2 border rounded-lg overflow-hidden bg-gray-100">
                                            <img src={detailHistory.screenshotBase64} alt="Screenshot"
                                                className="w-full h-auto cursor-zoom-in hover:opacity-90 transition-opacity"
                                                onClick={() => window.open(detailHistory.screenshotBase64!, '_blank')} title="Klik untuk zoom" />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 text-center">Klik gambar untuk melihat ukuran penuh</p>
                                    </div>
                                )}
                            </div>
                        );
                    })() : null}
                </DialogContent>
            </Dialog>

            {/* MODAL: GROUP DETAIL (Tahunan) */}
            <Dialog open={showGroupDetailModal} onOpenChange={(open) => { setShowGroupDetailModal(open); if (!open) { setSelectedGroupLinks([]); setSelectedGroupName(""); } }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Group: {selectedGroupName}</DialogTitle>
                        <DialogDescription>Menampilkan daftar link yang tergabung dalam group ini.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedGroupLinks.map(link => {
                            const linkHistories = allHistories.filter(h => h.internalLinkId === link.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                            return (
                                <Card key={link.id} className="border border-gray-200 shadow-sm">
                                    <CardHeader className="py-3 bg-gray-50 border-b">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-blue-800">{link.linkName}</h4>
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${link.directionString === 'TX' ? 'bg-indigo-100 text-indigo-700' : link.directionString === 'RX' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-gray-200 text-gray-700'}`}>
                                                    {link.directionString !== 'None' ? link.directionString : 'No Dir'}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">{link.device || 'No Device'}</span>
                                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border font-mono">{link.ipAddress || 'No IP'}</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {linkHistories.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-gray-500">Belum ada history untuk link ini.</div>
                                        ) : (
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-gray-500 bg-gray-50/50 uppercase border-b">
                                                    <tr>
                                                        <th className="px-4 py-2 font-medium">Tanggal</th>
                                                        <th className="px-4 py-2 font-medium">RSL (dBm)</th>
                                                        <th className="px-4 py-2 font-medium">Uptime</th>
                                                        <th className="px-4 py-2 font-medium">Status</th>
                                                        <th className="px-4 py-2 font-medium">Catatan</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {linkHistories.slice(0, 5).map(h => (
                                                        <tr key={h.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-2 whitespace-nowrap">{format(new Date(h.date), "dd MMM yyyy")}</td>
                                                            <td className="px-4 py-2 font-mono">
                                                                {h.rslNearEnd != null ? (
                                                                    <span className={getRslTextColor(h.rslNearEnd)}>{h.rslNearEnd.toFixed(1)}</span>
                                                                ) : '-'}
                                                            </td>
                                                            <td className="px-4 py-2">{h.uptime != null ? `${h.uptime} hari` : '-'}</td>
                                                            <td className="px-4 py-2">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusLabel(h.status) === "Active" ? "bg-green-100 text-green-800" : getStatusLabel(h.status) === "Down" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                                                                    {getStatusLabel(h.status)}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 max-w-[200px] truncate text-gray-500" title={h.notes || undefined}>{h.notes || '-'}</td>
                                                        </tr>
                                                    ))}
                                                    {linkHistories.length > 5 && (
                                                        <tr>
                                                            <td colSpan={5} className="px-4 py-2 text-center text-xs text-blue-600 bg-blue-50/30">
                                                                Menampilkan 5 history terakhir dari total {linkHistories.length} history.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            {/* MODAL: DELETE CONFIRMATION */}
            <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>Apakah Anda yakin ingin menghapus {confirmDelete?.type === "link" ? "link" : "history"} ini? Aksi ini tidak bisa dibatalkan.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDelete(null)}>Batal</Button>
                        <Button variant="destructive" onClick={() => { if (confirmDelete?.type === "link") handleDeleteLink(confirmDelete.id); else if (confirmDelete?.type === "history") handleDeleteHistory(confirmDelete.id); }}>
                            {loading ? "Menghapus..." : "Hapus"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL: PIVOT NOTE */}
            <Dialog open={isNoteModalOpen} onOpenChange={(open) => { if (!open) { setIsNoteModalOpen(false); setEditingNote(null); } }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingNote ? `${pivotNotes[editingNote.monthKey] ? 'Edit' : 'Add'} Note` : 'Note'}</DialogTitle>
                        <DialogDescription>
                            {editingNote && `${editingNote.linkName} — ${editingNote.monthLabel}`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Catatan</Label>
                            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm min-h-[100px]"
                                placeholder="Tulis catatan di sini..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsNoteModalOpen(false); setEditingNote(null); }}>Batal</Button>
                        <Button onClick={() => {
                            if (editingNote) {
                                setPivotNotes(prev => ({ ...prev, [editingNote.monthKey]: noteText }));
                            }
                            setIsNoteModalOpen(false);
                            setEditingNote(null);
                            setNoteText('');
                            toast({ title: 'Berhasil', description: 'Catatan berhasil disimpan' });
                        }}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* LIGHTBOX: SCREENSHOT ONLY */}
            {screenshotLightbox && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setScreenshotLightbox(null)}>
                    <div className="relative max-w-5xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setScreenshotLightbox(null)} className="absolute -top-3 -right-3 z-10 bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-100 transition-colors">
                            <X className="h-5 w-5 text-gray-700" />
                        </button>
                        {screenshotLightboxLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
                            </div>
                        ) : (
                            <img src={screenshotLightbox} alt="Screenshot" className="w-full h-auto rounded-lg shadow-2xl" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LinkInternalPage;
