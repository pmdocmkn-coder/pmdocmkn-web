import React, { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import {
    Search,
    Plus,
    MoreVertical,
    Trash2,
    Edit2,
    Download,
    Calendar,
} from "lucide-react";
import { radioScrapApi } from "../../services/radioApi";
import {
    RadioScrap,
    RadioScrapQuery,
    CreateRadioScrapDto,
    YearlyScrapSummary,
} from "../../types/radio";
import { useToast } from "../../hooks/use-toast";
import YearlySummaryChart from "./YearlySummaryChart";

export default function RadioScrapPage() {
    const { toast } = useToast();
    const [data, setData] = useState<RadioScrap[]>([]);
    const [summaryData, setSummaryData] = useState<YearlyScrapSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Query State
    const [queryParams, setQueryParams] = useState<RadioScrapQuery>({
        page: 1,
        pageSize: 10,
        search: "",
        sortBy: "dateScrap",
        sortDir: "desc",
        scrapCategory: undefined,
    });

    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    // Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedScrap, setSelectedScrap] = useState<RadioScrap | null>(null);

    // Form State
    const [formData, setFormData] = useState<CreateRadioScrapDto>({
        scrapCategory: "Trunking",
        typeRadio: "",
        serialNumber: "",
        jobNumber: "",
        dateScrap: new Date().toISOString().split("T")[0],
        remarks: "",
    });

    useEffect(() => {
        loadData();
    }, [queryParams]);

    useEffect(() => {
        loadSummary();
    }, [selectedYear]);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await radioScrapApi.getAll(queryParams);
            setData(response.data.data);
            setTotalCount(response.data.meta.pagination.totalCount);
            setTotalPages(response.data.meta.pagination.totalPages);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load scrap records",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const loadSummary = async () => {
        setLoadingSummary(true);
        try {
            const response = await radioScrapApi.getYearlySummary(selectedYear);
            setSummaryData(response.data);
        } catch (error) {
            console.error("Failed to load summary", error);
        } finally {
            setLoadingSummary(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setQueryParams((prev) => ({ ...prev, page: 1 }));
    };

    const handleCreate = async () => {
        try {
            await radioScrapApi.create(formData);
            toast({ title: "Success", description: "Scrap record added successfully" });
            setIsCreateOpen(false);
            loadData();
            loadSummary(); // Refresh summary as well
            resetForm();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to add scrap record",
                variant: "destructive",
            });
        }
    };

    const handleUpdate = async () => {
        if (!selectedScrap) return;
        try {
            await radioScrapApi.update(selectedScrap.id, formData);
            toast({ title: "Success", description: "Scrap record updated successfully" });
            setIsEditOpen(false);
            loadData();
            loadSummary();
            resetForm();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update scrap record",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this scrap record?")) return;
        try {
            await radioScrapApi.delete(id);
            toast({ title: "Success", description: "Scrap record deleted successfully" });
            loadData();
            loadSummary();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete scrap record",
                variant: "destructive",
            });
        }
    };

    const openEditModal = (scrap: RadioScrap) => {
        setSelectedScrap(scrap);
        setFormData({
            scrapCategory: scrap.scrapCategory,
            typeRadio: scrap.typeRadio,
            serialNumber: scrap.serialNumber,
            jobNumber: scrap.jobNumber,
            dateScrap: scrap.dateScrap.split("T")[0],
            remarks: scrap.remarks,
        });
        setIsEditOpen(true);
    };

    const resetForm = () => {
        setFormData({
            scrapCategory: "Trunking",
            typeRadio: "",
            serialNumber: "",
            jobNumber: "",
            dateScrap: new Date().toISOString().split("T")[0],
            remarks: "",
        });
        setSelectedScrap(null);
    };

    const handleExport = async () => {
        try {
            const response = await radioScrapApi.exportCsv(queryParams);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `radio_scrap_${new Date().toISOString().split("T")[0]}.csv`);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            toast({
                title: "Error",
                description: "Export failed",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Radio Scrap</h1>
                    <p className="text-muted-foreground">Manage scrapped radio assets</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Manual Scrap
                    </Button>
                </div>
            </div>

            {/* Yearly Summary Chart */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Scrap Summary</h2>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedYear(selectedYear - 1)}
                        >
                            Previous Year
                        </Button>
                        <span className="font-bold">{selectedYear}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedYear(selectedYear + 1)}
                            disabled={selectedYear >= new Date().getFullYear()}
                        >
                            Next Year
                        </Button>
                    </div>
                </div>
                <YearlySummaryChart data={summaryData} loading={loadingSummary} />
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-white p-4 rounded-lg border shadow-sm mt-8">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search serial number, remarks..."
                        className="pl-8"
                        value={queryParams.search}
                        onChange={(e) => setQueryParams({ ...queryParams, search: e.target.value, page: 1 })}
                    />
                </div>
                <Select
                    value={queryParams.scrapCategory || "all"}
                    onValueChange={(val) => setQueryParams({ ...queryParams, scrapCategory: val === "all" ? undefined : val, page: 1 })}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Trunking">Trunking</SelectItem>
                        <SelectItem value="Conventional">Conventional</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date Scrap</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Serial Number</TableHead>
                            <TableHead>Source Radio</TableHead>
                            <TableHead>Type Radio</TableHead>
                            <TableHead>Job Number</TableHead>
                            <TableHead>Remarks</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No records found
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.dateScrap ? item.dateScrap.split("T")[0] : "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.scrapCategory === "Trunking" ? "default" : "outline"}>
                                            {item.scrapCategory}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{item.serialNumber || "-"}</TableCell>
                                    <TableCell>
                                        {item.sourceUnitNumber ? (
                                            <div className="flex flex-col text-sm">
                                                <span className="font-semibold">{item.sourceUnitNumber}</span>
                                                <span className="text-xs text-muted-foreground">{item.sourceRadioId}</span>
                                            </div>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    <TableCell>{item.typeRadio || "-"}</TableCell>
                                    <TableCell>{item.jobNumber || "-"}</TableCell>
                                    <TableCell className="max-w-xs truncate" title={item.remarks}>{item.remarks || "-"}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditModal(item)}>
                                                    <Edit2 className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {(queryParams.page! - 1) * queryParams.pageSize! + 1} to {Math.min(queryParams.page! * queryParams.pageSize!, totalCount)} of {totalCount} entries
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQueryParams({ ...queryParams, page: queryParams.page! - 1 })}
                        disabled={queryParams.page === 1}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQueryParams({ ...queryParams, page: queryParams.page! + 1 })}
                        disabled={queryParams.page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            </div>

            {/* Create Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Manual Scrap Record</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <Select value={formData.scrapCategory} onValueChange={(val: any) => setFormData({ ...formData, scrapCategory: val })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Trunking">Trunking</SelectItem>
                                    <SelectItem value="Conventional">Conventional</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Serial Number</label>
                                <Input value={formData.serialNumber} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Job Number</label>
                                <Input value={formData.jobNumber} onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type Radio</label>
                                <Input value={formData.typeRadio} onChange={(e) => setFormData({ ...formData, typeRadio: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date Scrap</label>
                                <Input type="date" value={formData.dateScrap} onChange={(e) => setFormData({ ...formData, dateScrap: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Remarks</label>
                            <Input value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Scrap Record</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <Select value={formData.scrapCategory} onValueChange={(val: any) => setFormData({ ...formData, scrapCategory: val })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Trunking">Trunking</SelectItem>
                                    <SelectItem value="Conventional">Conventional</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Serial Number</label>
                                <Input value={formData.serialNumber} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Job Number</label>
                                <Input value={formData.jobNumber} onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type Radio</label>
                                <Input value={formData.typeRadio} onChange={(e) => setFormData({ ...formData, typeRadio: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date Scrap</label>
                                <Input type="date" value={formData.dateScrap} onChange={(e) => setFormData({ ...formData, dateScrap: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Remarks</label>
                            <Input value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdate}>Update</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
