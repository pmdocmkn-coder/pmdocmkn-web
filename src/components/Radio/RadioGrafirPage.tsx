import React, { useState, useEffect } from "react";
import { hasPermission } from "../../utils/permissionUtils";
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
    Upload,
    FileDown,
    Info,
} from "lucide-react";
import { radioGrafirApi } from "../../services/radioApi";
import {
    RadioGrafir,
    RadioGrafirQuery,
    CreateRadioGrafirDto,
} from "../../types/radio";
import { useToast } from "../../hooks/use-toast";
import RadioImportModal from "./RadioImportModal";

export default function RadioGrafirPage() {
    const { toast } = useToast();
    const [data, setData] = useState<RadioGrafir[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Query State
    const [queryParams, setQueryParams] = useState<RadioGrafirQuery>({
        page: 1,
        pageSize: 10,
        search: "",
        sortBy: "updatedAt",
        sortDir: "desc",
        status: undefined,
        div: undefined,
        dept: undefined,
    });

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [selectedRadio, setSelectedRadio] = useState<RadioGrafir | null>(null);

    // Form State
    const [formData, setFormData] = useState<CreateRadioGrafirDto>({
        noAsset: "",
        serialNumber: "",
        typeRadio: "",
        div: "",
        dept: "",
        fleetId: "",
        tanggal: "",
        status: "Active",
    });

    useEffect(() => {
        loadData();
    }, [queryParams]);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await radioGrafirApi.getAll(queryParams);
            setData(response.data.data);
            setTotalCount(response.data.meta.pagination.totalCount);
            setTotalPages(response.data.meta.pagination.totalPages);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load grafir radios",
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
            await radioGrafirApi.create(formData);
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
            await radioGrafirApi.update(selectedRadio.id, formData);
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
            await radioGrafirApi.delete(id);
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

    const handleClearAll = async () => {
        if (!window.confirm("WARNING: Are you sure you want to delete ALL radio grafir data? This cannot be undone.")) return;
        try {
            await radioGrafirApi.clearAll();
            toast({ title: "Success", description: "All radio grafir data deleted successfully" });
            loadData();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to clear radio grafir data",
                variant: "destructive",
            });
        }
    };

    const openEditModal = (radio: RadioGrafir) => {
        setSelectedRadio(radio);
        setFormData({
            noAsset: radio.noAsset,
            serialNumber: radio.serialNumber,
            typeRadio: radio.typeRadio,
            div: radio.div,
            dept: radio.dept,
            fleetId: radio.fleetId,
            tanggal: radio.tanggal ? radio.tanggal.split("T")[0] : "",
            status: radio.status,
        });
        setIsEditOpen(true);
    };

    const resetForm = () => {
        setFormData({
            noAsset: "",
            serialNumber: "",
            typeRadio: "",
            div: "",
            dept: "",
            fleetId: "",
            tanggal: "",
            status: "Active",
        });
        setSelectedRadio(null);
    };

    // handleImport is now handled by RadioImportModal

    const handleExport = async () => {
        try {
            const response = await radioGrafirApi.exportCsv(queryParams);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `radio_grafir_${new Date().toISOString().split("T")[0]}.csv`);
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
            const response = await radioGrafirApi.getTemplate();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "radio_grafir_template.csv");
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
                    <h1 className="text-2xl font-bold tracking-tight">Radio Grafir</h1>
                    <p className="text-muted-foreground">Manage grafir radio assets and linking</p>
                </div>
                <div className="flex gap-2">
                    {hasPermission("radio.delete") && (
                        <Button variant="destructive" onClick={handleClearAll}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus Semua
                        </Button>
                    )}
                    {hasPermission("radio.import") && (
                        <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                            <Upload className="w-4 h-4 mr-2" />
                            Import
                        </Button>
                    )}
                    {hasPermission("radio.export") && (
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    )}
                    {hasPermission("radio.import") && (
                        <Button variant="outline" onClick={handleDownloadTemplate}>
                            <FileDown className="w-4 h-4 mr-2" />
                            Template
                        </Button>
                    )}
                    {hasPermission("radio.create") && (
                        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add New
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search asset, serial..."
                        className="pl-8"
                        value={queryParams.search}
                        onChange={(e) => setQueryParams({ ...queryParams, search: e.target.value, page: 1 })}
                    />
                </div>
                <Input
                    placeholder="Filter Div..."
                    value={queryParams.div || ""}
                    onChange={(e) => setQueryParams({ ...queryParams, div: e.target.value, page: 1 })}
                />
                <Input
                    placeholder="Filter Dept..."
                    value={queryParams.dept || ""}
                    onChange={(e) => setQueryParams({ ...queryParams, dept: e.target.value, page: 1 })}
                />
                <Input
                    placeholder="Filter Fleet ID..."
                    value={queryParams.fleetId || ""}
                    onChange={(e) => setQueryParams({ ...queryParams, fleetId: e.target.value, page: 1 })}
                />
                <Input
                    placeholder="Filter Radio Type..."
                    value={queryParams.typeRadio || ""}
                    onChange={(e) => setQueryParams({ ...queryParams, typeRadio: e.target.value, page: 1 })}
                />
                <Select
                    value={queryParams.status || "all"}
                    onValueChange={(val) => setQueryParams({ ...queryParams, status: val === "all" ? undefined : val, page: 1 })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Used">Used</SelectItem>
                        <SelectItem value="Scrap">Scrap</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No Asset</TableHead>
                            <TableHead>Serial Number</TableHead>
                            <TableHead>Type Radio</TableHead>
                            <TableHead>Fleet ID</TableHead>
                            <TableHead>Div/Dept</TableHead>
                            <TableHead>Linked</TableHead>
                            <TableHead>Status</TableHead>
                            {(hasPermission("radio.update") || hasPermission("radio.delete")) && <TableHead className="text-right">Actions</TableHead>}
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
                                    <TableCell className="font-medium">{item.noAsset}</TableCell>
                                    <TableCell>{item.serialNumber}</TableCell>
                                    <TableCell>{item.typeRadio || "-"}</TableCell>
                                    <TableCell>{item.fleetId || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span>{item.div || "-"}</span>
                                            <span className="text-xs text-muted-foreground">{item.dept}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {item.trunkingCount > 0 && <Badge variant="secondary" className="text-xs">T: {item.trunkingCount}</Badge>}
                                            {item.conventionalCount > 0 && <Badge variant="outline" className="text-xs">C: {item.conventionalCount}</Badge>}
                                            {item.trunkingCount === 0 && item.conventionalCount === 0 && <span className="text-xs text-muted-foreground">-</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.status === "Active" ? "default" : item.status === "Used" ? "secondary" : "destructive"}>
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                    {(hasPermission("radio.update") || hasPermission("radio.delete")) && (
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {hasPermission("radio.update") && (
                                                        <DropdownMenuItem onClick={() => openEditModal(item)}>
                                                            <Edit2 className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                    )}
                                                    {hasPermission("radio.delete") && (
                                                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(item.id)}>
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )}
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

                    <div className="hidden sm:flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - queryParams.page!) <= 1)
                            .reduce((acc: React.ReactNode[], p, i, arr) => {
                                if (i > 0 && p - arr[i - 1] > 1) {
                                    acc.push(<span key={`ellipsis-${p}`} className="px-2 text-muted-foreground self-center">...</span>);
                                }
                                acc.push(
                                    <Button
                                        key={p}
                                        variant={p === queryParams.page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setQueryParams({ ...queryParams, page: p })}
                                        className={p === queryParams.page ? "bg-black text-white px-3" : "px-3"}
                                    >
                                        {p}
                                    </Button>
                                );
                                return acc;
                            }, [])}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQueryParams({ ...queryParams, page: queryParams.page! + 1 })}
                        disabled={queryParams.page === totalPages || totalPages === 0}
                    >
                        Next
                    </Button>
                </div>
            </div>

            {/* Create Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Radio Grafir</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">No Asset *</label>
                            <Input value={formData.noAsset} onChange={(e) => setFormData({ ...formData, noAsset: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Serial Number *</label>
                            <Input value={formData.serialNumber} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type Radio</label>
                                <Input value={formData.typeRadio} onChange={(e) => setFormData({ ...formData, typeRadio: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Fleet ID</label>
                                <Input value={formData.fleetId} onChange={(e) => setFormData({ ...formData, fleetId: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Division</label>
                                <Input value={formData.div} onChange={(e) => setFormData({ ...formData, div: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Department</label>
                                <Input value={formData.dept} onChange={(e) => setFormData({ ...formData, dept: e.target.value })} />
                            </div>
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
                                        <SelectItem value="Used">Used</SelectItem>
                                        <SelectItem value="Scrap">Scrap</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tanggal</label>
                                <Input type="date" value={formData.tanggal} onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })} />
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
                        <DialogTitle>Edit Radio Grafir</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">No Asset *</label>
                            <Input value={formData.noAsset} onChange={(e) => setFormData({ ...formData, noAsset: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Serial Number *</label>
                            <Input value={formData.serialNumber} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type Radio</label>
                                <Input value={formData.typeRadio} onChange={(e) => setFormData({ ...formData, typeRadio: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Fleet ID</label>
                                <Input value={formData.fleetId} onChange={(e) => setFormData({ ...formData, fleetId: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Division</label>
                                <Input value={formData.div} onChange={(e) => setFormData({ ...formData, div: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Department</label>
                                <Input value={formData.dept} onChange={(e) => setFormData({ ...formData, dept: e.target.value })} />
                            </div>
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
                                        <SelectItem value="Used">Used</SelectItem>
                                        <SelectItem value="Scrap">Scrap</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tanggal</label>
                                <Input type="date" value={formData.tanggal} onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdate}>Update</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <RadioImportModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                title="Import Radio Grafir"
                onImportSuccess={() => loadData()}
                importApiCall={radioGrafirApi.importCsv}
            />
        </div>
    );
}
