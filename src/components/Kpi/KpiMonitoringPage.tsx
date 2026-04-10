import React, { useState, useEffect } from "react";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "../ui/table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { 
    Search, Plus, Calendar, Edit2, Clock, Trash2, CheckCircle2, ChevronLeft, ChevronRight, Copy, Download, Upload, Link2
} from "lucide-react";
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
            const response = await kpiApi.exportExcel(queryParams);
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
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Selesai</Badge>;
            case "Approved":
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Approved</Badge>;
            case "Menunggu Balasan (Email)":
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">Menunggu Balasan Email</Badge>;
            case "Menunggu Sign (Office)":
                return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200">Menunggu Sign Office</Badge>;
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

    // Extract unique group tags for autocomplete
    const existingTags = Array.from(new Set(data.filter(d => !!d.groupTag).map(d => d.groupTag!))).sort();

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">KPI Document Monitoring</h2>
                    <p className="text-sm text-gray-500">Track and manage monthly KPI document flows.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <input 
                            type="month" 
                            className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 w-32"
                            value={currentMonth.substring(0, 7)}
                            onChange={handleMonthChange}
                        />
                    </div>
                    {hasPermission("kpi.view") && (
                        <Button variant="outline" onClick={handleExportExcel} disabled={exporting} className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                            <Download className="w-4 h-4 mr-2" />
                            {exporting ? "Mengekspor..." : "Export"}
                        </Button>
                    )}
                    {hasPermission("kpi.create") && (
                        <>
                            <input 
                                type="file" 
                                accept=".xlsx, .xls" 
                                hidden 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                            />
                            <Button variant="outline" onClick={handleImportClick} disabled={importing} className="bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100">
                                <Upload className="w-4 h-4 mr-2" />
                                {importing ? "Mengimpor..." : "Import"}
                            </Button>
                            <Button variant="outline" onClick={handleCloneMonth} className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                                <Copy className="w-4 h-4 mr-2" />
                                Clone Bulan Lalu
                            </Button>
                            <Button onClick={() => { setSelectedDoc(null); setIsFormOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Baru
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4 max-w-md">
                    <Search className="w-5 h-5 text-gray-400" />
                    <Input 
                        placeholder="Cari nama dokumen atau sumber asalnya..." 
                        onChange={handleSearch}
                        className="bg-gray-50 border-gray-200"
                    />
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-5">
                    {loading && data.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 text-sm">Loading data...</div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 text-sm border border-dashed rounded-xl">
                            Tidak ada data. Klik 'Clone Bulan Lalu' untuk membuat template bulan ini.
                        </div>
                    ) : (
                        Object.entries(groupedData).map(([group, items]) => (
                            <div key={group} className="space-y-3">
                                <div className="bg-indigo-50/70 border border-indigo-100 py-2 px-3 rounded-xl flex items-center justify-center shadow-sm">
                                    <span className="font-bold text-indigo-900 text-xs tracking-widest">{group.toUpperCase()}</span>
                                </div>
                                {items.map((item) => (
                                    <div key={item.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 space-y-4">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 leading-tight text-sm truncate">{item.documentName}</h3>
                                                <p className="text-xs text-gray-500 mt-1 truncate"><span className="font-semibold">Asal:</span> {item.dataSource}</p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                {getStatusBadge(item.status)}
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-xs border-y border-gray-100 py-3 bg-gray-50/50 -mx-4 px-4">
                                            <div className="space-y-1">
                                                <p className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">1. Received</p>
                                                <p className="font-medium text-gray-900">{formatDateStr(item.dateReceived)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">2. Subm. User</p>
                                                <p className="font-medium text-gray-900">{formatDateStr(item.dateSubmittedToReviewer)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">3. Approved</p>
                                                <p className="font-medium text-gray-900">{formatDateStr(item.dateApproved)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-indigo-400 font-bold uppercase text-[9px] tracking-wider">4. Subm. RQM</p>
                                                <p className="font-bold text-indigo-700">{formatDateStr(item.dateSubmittedToRqm)}</p>
                                                {item.remarks && <p className="text-[10px] text-red-500 font-bold leading-tight mt-0.5">{item.remarks}</p>}
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-end gap-2 pt-1">
                                            {hasPermission("kpi.update") && (
                                                <>
                                                    <Button variant="outline" size="sm" onClick={() => { setSelectedDoc(item); setIsDatesOpen(true); }} className="text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 h-8 text-xs font-semibold">
                                                        <Clock className="w-3.5 h-3.5 mr-1.5" /> Progress
                                                    </Button>
                                                    <Button variant="outline" size="icon" onClick={() => { setSelectedDoc(item); setIsFormOpen(true); }} className="text-gray-600 h-8 w-8 hover:bg-gray-100">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </>
                                            )}
                                            {hasPermission("kpi.delete") && (
                                                <Button variant="outline" size="icon" onClick={() => handleDelete(item.id)} className="text-red-500 border-red-100 bg-red-50 hover:bg-red-100 h-8 w-8">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))
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
                                    const dsGroups = processGroupsForMerge(items);
                                    return (
                                        <React.Fragment key={group}>
                                            {/* Area Group Header */}
                                            <TableRow className="bg-indigo-50 hover:bg-indigo-50 border-t-2 border-indigo-200">
                                                <TableCell colSpan={9} className="py-2 text-center font-bold text-indigo-800 tracking-widest text-xs">
                                                    {group.toUpperCase()}
                                                </TableCell>
                                            </TableRow>

                                            {/* Data rows with rowspan merging */}
                                            {dsGroups.map((dsGroup, groupIdx) => (
                                                dsGroup.items.map((item, itemIdx) => (
                                                    <TableRow
                                                        key={item.id}
                                                        className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100"
                                                    >
                                                        {/* No — merged across the group */}
                                                        {itemIdx === 0 && (
                                                            <TableCell
                                                                rowSpan={dsGroup.items.length}
                                                                className="text-center text-gray-500 font-semibold border-r align-middle bg-gray-50/60"
                                                            >
                                                                {groupIdx + 1}
                                                            </TableCell>
                                                        )}

                                                        {/* Nama Data — individual per row */}
                                                        <TableCell className="font-medium text-gray-900 py-2.5">
                                                            {item.documentName}
                                                        </TableCell>

                                                        {/* Asal Data — merged when same dataSource */}
                                                        {itemIdx === 0 && (
                                                            <TableCell
                                                                rowSpan={dsGroup.items.length}
                                                                className="text-gray-600 text-sm border-l border-r align-middle bg-white"
                                                            >
                                                                <span className="font-medium">{dsGroup.dataSource}</span>
                                                            </TableCell>
                                                        )}

                                                        {/* Date Received — Always per row */}
                                                        <TableCell
                                                            className="text-center text-sm font-medium cursor-pointer hover:bg-indigo-50 transition-colors border-r"
                                                            onClick={() => { setSelectedDoc(item); setIsDatesOpen(true); }}
                                                        >
                                                            {formatDateStr(item.dateReceived)}
                                                        </TableCell>

                                                        {/* Submitted To User — Always per row */}
                                                        <TableCell
                                                            className="text-center text-sm font-medium cursor-pointer hover:bg-indigo-50 transition-colors border-r"
                                                            onClick={() => { setSelectedDoc(item); setIsDatesOpen(true); }}
                                                        >
                                                            {formatDateStr(item.dateSubmittedToReviewer)}
                                                        </TableCell>

                                                        {/* Approved By User — Always per row */}
                                                        <TableCell
                                                            className="text-center text-sm font-medium cursor-pointer hover:bg-indigo-50 transition-colors border-r"
                                                            onClick={() => { setSelectedDoc(item); setIsDatesOpen(true); }}
                                                        >
                                                            {formatDateStr(item.dateApproved)}
                                                        </TableCell>

                                                        {/* Submitted RQM — Always per row */}
                                                        <TableCell
                                                            className="text-center text-sm font-medium cursor-pointer hover:bg-indigo-50 transition-colors border-r"
                                                            onClick={() => { setSelectedDoc(item); setIsDatesOpen(true); }}
                                                        >
                                                            <div className="flex flex-col items-center">
                                                                <span>{formatDateStr(item.dateSubmittedToRqm)}</span>
                                                                {item.remarks && <span className="text-[10px] text-red-500 font-bold">{item.remarks}</span>}
                                                            </div>
                                                        </TableCell>

                                                        {/* Status */}
                                                        <TableCell className="text-center">{getStatusBadge(item.status)}</TableCell>

                                                        {/* Actions */}
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-1">
                                                                {hasPermission("kpi.update") && (
                                                                    <>
                                                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedDoc(item); setIsDatesOpen(true); }} className="text-indigo-600 hover:text-indigo-800 focus:ring-0">
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
                document={selectedDoc} 
                onSuccess={fetchData} 
            />
        </div>
    );
}
