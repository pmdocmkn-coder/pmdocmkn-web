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
import { Badge } from "../ui/badge";
import {
    Search,
    Plus,
    MoreVertical,
    History,
    Trash2,
    Edit2,
    Upload,
} from "lucide-react";
import { radioApi, RadioDto, CreateRadioDto } from "../../services/radioApi";
import RadioHistoryModal from "./RadioHistoryModal";
import ScrapRadioModal from "./ScrapRadioModal";
import RadioImportModal from "./RadioImportModal";
import { useToast } from "../../hooks/use-toast";

export default function RadioUnitPage() {
    const { toast } = useToast();
    const [data, setData] = useState<RadioDto[]>([]);
    const [loading, setLoading] = useState(false);

    // Query State
    const [search, setSearch] = useState("");

    // Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isScrapOpen, setIsScrapOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [selectedRadio, setSelectedRadio] = useState<RadioDto | null>(null);

    // Form State
    const [formData, setFormData] = useState<CreateRadioDto>({
        category: "Unit",
        nomorAset: "",
        nomorUnit: "",
        nomorLv: "",
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
        isScrap: false
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await radioApi.getAll("Unit", false);
            setData(response.data.data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load Unit radios",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

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
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete radio",
                variant: "destructive",
            });
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm("WARNING: Are you sure you want to delete ALL radio data? This cannot be undone!")) return;
        try {
            await radioApi.deleteAll();
            toast({ title: "Success", description: "All radio data deleted successfully" });
            loadData();
        } catch (error) {
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
            category: "Unit",
            nomorAset: radio.nomorAset || "",
            nomorUnit: radio.nomorUnit || "",
            nomorLv: radio.nomorLv || "",
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
            isScrap: radio.isScrap
        });
        setIsEditOpen(true);
    };

    const resetForm = () => {
        setFormData({
            category: "Unit",
            nomorAset: "",
            nomorUnit: "",
            nomorLv: "",
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
            isScrap: false
        });
        setSelectedRadio(null);
    };

    // Filter Data client-side for simplicity, or we could add search to API
    const filteredData = data.filter(item => 
        (item.nomorLv?.toLowerCase().includes(search.toLowerCase())) ||
        (item.serialNumber?.toLowerCase().includes(search.toLowerCase())) ||
        (item.radioId?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Radio Unit</h1>
                    <p className="text-muted-foreground">Manage unit radio assets</p>
                </div>
                <div className="flex gap-2">
                    {hasPermission("radio.delete") && (
                        <Button variant="destructive" onClick={handleDeleteAll}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete All
                        </Button>
                    )}
                    {hasPermission("radio.import") && (
                        <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                            <Upload className="w-4 h-4 mr-2" />
                            Import
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative col-span-1 md:col-span-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search LV, SN, ID..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nomor LV</TableHead>
                            <TableHead>Serial Number</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Trunking</TableHead>
                            <TableHead>Konvensional</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Fleet</TableHead>
                            <TableHead>ID Radio</TableHead>
                            <TableHead>Mark</TableHead>
                            {(hasPermission("radio.update") || hasPermission("radio.delete") || hasPermission("radio.scrap.create")) && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center py-8">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                                    No records found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((item) => (
                                <TableRow key={item.id} className={item.isDuplicateId ? "bg-red-50" : ""}>
                                    <TableCell className="font-medium">{item.nomorLv || "-"}</TableCell>
                                    <TableCell>{item.serialNumber || "-"}</TableCell>
                                    <TableCell>{item.type || "-"}</TableCell>
                                    <TableCell>
                                        {item.isTrunking ? <Badge variant="default">Yes</Badge> : <Badge variant="outline">No</Badge>}
                                    </TableCell>
                                    <TableCell>
                                        {item.isConventional ? <Badge variant="default">Yes</Badge> : <Badge variant="outline">No</Badge>}
                                    </TableCell>
                                    <TableCell>{item.channel || "-"}</TableCell>
                                    <TableCell>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : "-"}</TableCell>
                                    <TableCell>{item.fleet || "-"}</TableCell>
                                    <TableCell>
                                        <span className={item.isDuplicateId ? "text-red-600 font-bold" : ""}>
                                            {item.radioId || "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell>{item.mark || "-"}</TableCell>
                                    {(hasPermission("radio.update") || hasPermission("radio.delete") || hasPermission("radio.scrap.create")) && (
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreVertical className="h-4 w-4" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {hasPermission("radio.update") && (
                                                        <DropdownMenuItem onClick={() => openEditModal(item)}>
                                                            <Edit2 className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                    )}
                                                    {hasPermission("radio.scrap.create") && (
                                                        <DropdownMenuItem onClick={() => { setSelectedRadio(item); setIsScrapOpen(true); }}>
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Scrap
                                                        </DropdownMenuItem>
                                                    )}
                                                    {hasPermission("radio.view") && (
                                                        <DropdownMenuItem onClick={() => { setSelectedRadio(item); setIsHistoryOpen(true); }}>
                                                            <History className="mr-2 h-4 w-4" />
                                                            History
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

            {/* Create/Edit Modal */}
            <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsCreateOpen(false);
                    setIsEditOpen(false);
                    resetForm();
                }
            }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditOpen ? "Edit Radio Unit" : "Add Radio Unit"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nomor LV</label>
                            <Input value={formData.nomorLv} onChange={e => setFormData({...formData, nomorLv: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Serial Number</label>
                            <Input value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type</label>
                            <Input value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Channel</label>
                            <Input value={formData.channel} onChange={e => setFormData({...formData, channel: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tanggal</label>
                            <Input type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Fleet</label>
                            <Input value={formData.fleet} onChange={e => setFormData({...formData, fleet: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">ID Radio</label>
                            <Input value={formData.radioId} onChange={e => setFormData({...formData, radioId: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mark</label>
                            <Input value={formData.mark} onChange={e => setFormData({...formData, mark: e.target.value})} />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <label className="text-sm font-medium">Jenis Radio</label>
                            <div className="flex gap-6 mt-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="radioType" checked={formData.isTrunking} onChange={() => setFormData({...formData, isTrunking: true, isConventional: false})} className="w-4 h-4 text-primary border-gray-300 focus:ring-primary" />
                                    <span className="text-sm text-gray-700">Trunking</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="radioType" checked={formData.isConventional} onChange={() => setFormData({...formData, isTrunking: false, isConventional: true})} className="w-4 h-4 text-primary border-gray-300 focus:ring-primary" />
                                    <span className="text-sm text-gray-700">Konvensional</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); }}>Cancel</Button>
                        <Button onClick={isEditOpen ? handleUpdate : handleCreate}>
                            {isEditOpen ? "Update" : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ScrapRadioModal
                isOpen={isScrapOpen}
                onClose={() => setIsScrapOpen(false)}
                radioId={selectedRadio?.id || 0}
                radioIdentifier={selectedRadio?.nomorLv || selectedRadio?.serialNumber || selectedRadio?.radioId || ""}
                onSuccess={() => {
                    setIsScrapOpen(false);
                    loadData();
                }}
            />

            <RadioImportModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                title="Import Radio Unit"
                onImportSuccess={() => loadData()}
                importApiCall={radioApi.importUnit}
            />

            <RadioHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                radioId={selectedRadio?.id || null}
            />
        </div>
    );
}
