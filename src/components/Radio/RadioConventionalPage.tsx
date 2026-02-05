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
    History,
    Trash2,
    Edit2,
    Download,
    Upload,
    FileDown,
} from "lucide-react";
import { radioConventionalApi, radioScrapApi } from "../../services/radioApi";
import {
    RadioConventional,
    RadioConventionalQuery,
    CreateRadioConventionalDto,
    ScrapFromRadioDto,
} from "../../types/radio";
import RadioHistoryModal from "./RadioHistoryModal";
import ScrapRadioModal from "./ScrapRadioModal";
import { useToast } from "../../hooks/use-toast";

export default function RadioConventionalPage() {
    const { toast } = useToast();
    const [data, setData] = useState<RadioConventional[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Query State
    const [queryParams, setQueryParams] = useState<RadioConventionalQuery>({
        page: 1,
        pageSize: 10,
        search: "",
        sortBy: "updatedAt",
        sortDir: "desc",
        status: undefined,
        dept: undefined,
        fleet: undefined,
    });

    // Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isScrapOpen, setIsScrapOpen] = useState(false);
    const [selectedRadio, setSelectedRadio] = useState<RadioConventional | null>(null);

    // Form State
    const [formData, setFormData] = useState<CreateRadioConventionalDto>({
        unitNumber: "",
        radioId: "",
        status: "Active",
        dept: "",
        fleet: "",
        serialNumber: "",
        radioType: "",
        frequency: "",
    });

    useEffect(() => {
        loadData();
    }, [queryParams]);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await radioConventionalApi.getAll(queryParams);
            setData(response.data.data);
            setTotalCount(response.data.meta.pagination.totalCount);
            setTotalPages(response.data.meta.pagination.totalPages);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load conventional radios",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setQueryParams((prev) => ({ ...prev, page: 1 }));
    };

    const handleCreate = async () => {
        try {
            await radioConventionalApi.create(formData);
            toast({ title: "Success", description: "Radio created successfully" });
            setIsCreateOpen(false);
            loadData();
            resetForm();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create radio",
                variant: "destructive",
            });
        }
    };

    const handleUpdate = async () => {
        if (!selectedRadio) return;
        try {
            await radioConventionalApi.update(selectedRadio.id, formData);
            toast({ title: "Success", description: "Radio updated successfully" });
            setIsEditOpen(false);
            loadData();
            resetForm();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update radio",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this radio?")) return;
        try {
            await radioConventionalApi.delete(id);
            toast({ title: "Success", description: "Radio deleted successfully" });
            loadData();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete radio",
                variant: "destructive",
            });
        }
    };

    const handleScrap = async (data: ScrapFromRadioDto) => {
        if (!selectedRadio) return;
        try {
            await radioScrapApi.scrapFromConventional(selectedRadio.id, data);
            toast({ title: "Success", description: "Radio scrapped successfully" });
            setIsScrapOpen(false);
            loadData();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to scrap radio",
                variant: "destructive",
            });
        }
    };

    const openEditModal = (radio: RadioConventional) => {
        setSelectedRadio(radio);
        setFormData({
            unitNumber: radio.unitNumber,
            radioId: radio.radioId,
            status: radio.status,
            dept: radio.dept,
            fleet: radio.fleet,
            serialNumber: radio.serialNumber,
            radioType: radio.radioType,
            frequency: radio.frequency,
            grafirId: radio.grafirId,
        });
        setIsEditOpen(true);
    };

    const resetForm = () => {
        setFormData({
            unitNumber: "",
            radioId: "",
            status: "Active",
            dept: "",
            fleet: "",
            serialNumber: "",
            radioType: "",
            frequency: "",
        });
        setSelectedRadio(null);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const response = await radioConventionalApi.importCsv(file);
                const { success, failed, errors } = response.data;
                toast({
                    title: "Import Completed",
                    description: `Success: ${success}, Failed: ${failed}`,
                    variant: failed > 0 ? "destructive" : "default",
                });
                loadData();
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Import failed",
                    variant: "destructive",
                });
            }
        }
    };

    const handleExport = async () => {
        try {
            const response = await radioConventionalApi.exportCsv(queryParams);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `radio_conventional_${new Date().toISOString().split("T")[0]}.csv`);
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

    const handleDownloadTemplate = async () => {
        try {
            const response = await radioConventionalApi.getTemplate();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "radio_conventional_template.csv");
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to download template",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Radio Conventional</h1>
                    <p className="text-muted-foreground">Manage conventional radio assets</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <input
                            type="file"
                            id="import-conventional"
                            className="hidden"
                            accept=".csv"
                            onChange={handleImport}
                        />
                        <Button variant="outline" onClick={() => document.getElementById('import-conventional')?.click()}>
                            <Upload className="w-4 h-4 mr-2" />
                            Import CSV
                        </Button>
                    </div>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="outline" onClick={handleDownloadTemplate}>
                        <FileDown className="w-4 h-4 mr-2" />
                        Template
                    </Button>
                    <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add New
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search unit number, radio id..."
                        className="pl-8"
                        value={queryParams.search}
                        onChange={(e) => setQueryParams({ ...queryParams, search: e.target.value, page: 1 })}
                    />
                </div>
                <Select
                    value={queryParams.status || "all"}
                    onValueChange={(val) => setQueryParams({ ...queryParams, status: val === "all" ? undefined : val, page: 1 })}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Spare">Spare</SelectItem>
                        <SelectItem value="Repair">Repair</SelectItem>
                        <SelectItem value="Scrap">Scrap</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Unit Number</TableHead>
                            <TableHead>Radio ID</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Fleet</TableHead>
                            <TableHead>Serial Number</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No records found
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.unitNumber}</TableCell>
                                    <TableCell>{item.radioId}</TableCell>
                                    <TableCell>{item.dept || "-"}</TableCell>
                                    <TableCell>{item.fleet || "-"}</TableCell>
                                    <TableCell>{item.serialNumber || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.status === "Active" ? "default" : item.status === "Repair" ? "secondary" : "destructive"}>
                                            {item.status}
                                        </Badge>
                                    </TableCell>
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
                                                <DropdownMenuItem onClick={() => { setSelectedRadio(item); setIsHistoryOpen(true); }}>
                                                    <History className="mr-2 h-4 w-4" />
                                                    History
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setSelectedRadio(item); setIsScrapOpen(true); }}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Scrap
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
                        <DialogTitle>Add New Radio Conventional</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Unit Number *</label>
                                <Input value={formData.unitNumber} onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Radio ID *</label>
                                <Input value={formData.radioId} onChange={(e) => setFormData({ ...formData, radioId: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Department</label>
                                <Input value={formData.dept} onChange={(e) => setFormData({ ...formData, dept: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Fleet</label>
                                <Input value={formData.fleet} onChange={(e) => setFormData({ ...formData, fleet: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Serial Number</label>
                            <Input value={formData.serialNumber} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Spare">Spare</SelectItem>
                                        <SelectItem value="Repair">Repair</SelectItem>
                                        <SelectItem value="Scrap">Scrap</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Frequency</label>
                                <Input value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })} />
                            </div>
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
                        <DialogTitle>Edit Radio Conventional</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Unit Number *</label>
                                <Input value={formData.unitNumber} onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Radio ID *</label>
                                <Input value={formData.radioId} onChange={(e) => setFormData({ ...formData, radioId: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Department</label>
                                <Input value={formData.dept} onChange={(e) => setFormData({ ...formData, dept: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Fleet</label>
                                <Input value={formData.fleet} onChange={(e) => setFormData({ ...formData, fleet: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Serial Number</label>
                            <Input value={formData.serialNumber} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Spare">Spare</SelectItem>
                                        <SelectItem value="Repair">Repair</SelectItem>
                                        <SelectItem value="Scrap">Scrap</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Frequency</label>
                                <Input value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdate}>Update</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <RadioHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                radioId={selectedRadio?.id || null}
                type="conventional"
            />

            <ScrapRadioModal
                isOpen={isScrapOpen}
                onClose={() => setIsScrapOpen(false)}
                onConfirm={handleScrap}
                radioUnitNumber={selectedRadio?.unitNumber}
            />
        </div>
    );
}
