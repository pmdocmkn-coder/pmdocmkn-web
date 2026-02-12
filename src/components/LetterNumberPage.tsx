import React, { useState, useEffect } from "react";
import { letterNumberApi, companyApi, documentTypeApi } from "../services/letterNumberApi";
import { gatepassApi, quotationApi } from "../services/gatepassQuotationApi";
import {
    LetterNumberList,
    LetterNumberCreate,
    LetterNumberUpdate,
    LetterStatus,
    LetterStatusColors,
    CompanyList,
    DocumentTypeList,
} from "../types/letterNumber";
import {
    GatepassList,
    GatepassCreate,
    GatepassItemCreate,
    GatepassUpdate,
    QuotationList,
    QuotationCreate,
    QuotationUpdate,
    StatusColors,
} from "../types/gatepassQuotation";
import { useToast } from "../hooks/use-toast";
import {
    FileText,
    Plus,
    Search,
    Edit,
    Trash2,
    Truck,
    Receipt,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";

// =============================================
// Tab Type
// =============================================
type TabType = "letters" | "gatepass" | "quotation";

// =============================================
// Status Badge Component
// =============================================
function StatusBadge({ status }: { status: string }) {
    const colorClass = (StatusColors as any)[status] || "bg-gray-100 text-gray-800";
    return (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
            {status || "Unknown"}
        </span>
    );
}

// =============================================
// Pagination Component
// =============================================
function Pagination({ currentPage, totalPages, totalCount, pageSize, onPageChange }: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}) {
    if (totalPages <= 1) return null;
    return (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
                <Button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} variant="outline">Previous</Button>
                <Button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} variant="outline">Next</Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of{" "}
                    <span className="font-medium">{totalCount}</span> results
                </p>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <Button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} variant="outline" className="rounded-r-none">Previous</Button>
                    {Number.isFinite(totalPages) && totalPages > 0 && [...Array(Math.min(totalPages, 5))].map((_, i) => (
                        <Button key={i + 1} onClick={() => onPageChange(i + 1)} variant={currentPage === i + 1 ? "default" : "outline"} className="rounded-none font-medium">{i + 1}</Button>
                    ))}
                    <Button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} variant="outline" className="rounded-l-none">Next</Button>
                </nav>
            </div>
        </div>
    );
}

// =============================================
// MAIN PAGE
// =============================================
export default function LetterNumberPage() {
    const [activeTab, setActiveTab] = useState<TabType>("letters");

    const tabs = [
        { id: "letters" as TabType, label: "Surat Umum", icon: FileText, color: "indigo" },
        { id: "gatepass" as TabType, label: "Gatepass", icon: Truck, color: "emerald" },
        { id: "quotation" as TabType, label: "Quotation", icon: Receipt, color: "violet" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                        <FileText className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Letter Management</h1>
                        <p className="text-sm text-gray-500">Manage letters, gatepass, and quotations</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm border">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                ? `bg-${tab.color}-600 text-white shadow-sm`
                                : "text-gray-600 hover:bg-gray-100"
                                }`}
                            style={activeTab === tab.id ? {
                                backgroundColor: tab.color === "indigo" ? "#4f46e5" : tab.color === "emerald" ? "#059669" : "#7c3aed"
                            } : {}}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content */}
            {activeTab === "letters" && <LetterTab />}
            {activeTab === "gatepass" && <GatepassTab />}
            {activeTab === "quotation" && <QuotationTab />}
        </div>
    );
}

// =============================================
// LETTER TAB
// =============================================
function LetterTab() {
    const { toast } = useToast();
    const [letters, setLetters] = useState<LetterNumberList[]>([]);
    const [companies, setCompanies] = useState<CompanyList[]>([]);
    const [documentTypes, setDocumentTypes] = useState<DocumentTypeList[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCompany, setSelectedCompany] = useState<number | undefined>();
    const [selectedDocType, setSelectedDocType] = useState<number | undefined>();
    const [isCreating, setIsCreating] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedLetter, setSelectedLetter] = useState<LetterNumberList | null>(null);
    const [formData, setFormData] = useState<LetterNumberCreate>({
        companyId: 0, documentTypeId: 0, letterDate: new Date().toISOString().split("T")[0],
        subject: "", recipient: "", attachmentUrl: "", status: LetterStatus.Draft,
    });

    useEffect(() => { loadLetters(); loadCompanies(); loadDocumentTypes(); }, [currentPage, searchTerm, selectedCompany, selectedDocType]);

    const loadLetters = async () => {
        try {
            setLoading(true);
            const result = await letterNumberApi.getAll({ page: currentPage, pageSize, search: searchTerm || undefined, companyId: selectedCompany, documentTypeId: selectedDocType });
            setLetters(result.data || []);
            setTotalCount(result.meta?.pagination?.totalCount || 0);
            setTotalPages(result.meta?.pagination?.totalPages || 0);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to load letters", variant: "destructive" });
        } finally { setLoading(false); }
    };

    const loadCompanies = async () => {
        try { const result = await companyApi.getAll({ pageSize: 100, isActive: true }); setCompanies(result.data); } catch (e) { console.error(e); }
    };
    const loadDocumentTypes = async () => {
        try { const result = await documentTypeApi.getAll({ pageSize: 100, isActive: true }); setDocumentTypes(result.data); } catch (e) { console.error(e); }
    };

    const handleCreate = async () => {
        if (!formData.companyId || formData.companyId <= 0) { toast({ title: "Error", description: "Pilih company", variant: "destructive" }); return; }
        if (!formData.documentTypeId || formData.documentTypeId <= 0) { toast({ title: "Error", description: "Pilih document type", variant: "destructive" }); return; }
        try {
            setIsCreating(true);
            await letterNumberApi.create(formData);
            toast({ title: "Success", description: "Letter number berhasil dibuat" });
            setIsCreateDialogOpen(false); resetForm(); loadLetters();
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message || "Gagal membuat letter number";
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally { setIsCreating(false); }
    };

    const handleUpdate = async () => {
        if (!selectedLetter) return;
        try {
            await letterNumberApi.update(selectedLetter.id, { subject: formData.subject, recipient: formData.recipient, attachmentUrl: formData.attachmentUrl, status: formData.status });
            toast({ title: "Success", description: "Letter number berhasil diupdate" });
            setIsEditDialogOpen(false); resetForm(); loadLetters();
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || error.message, variant: "destructive" });
        }
    };

    const handleDelete = async (id: number, status: string) => {

        if (!confirm("Yakin ingin menghapus letter number ini?")) return;
        try {
            await letterNumberApi.delete(id);
            toast({ title: "Success", description: "Letter number berhasil dihapus" });
            loadLetters();
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || error.message, variant: "destructive" });
        }
    };

    const openEditDialog = (letter: LetterNumberList) => {
        setSelectedLetter(letter);
        let statusValue = LetterStatus.Draft;
        if (letter.status === "Sent") statusValue = LetterStatus.Sent;
        setFormData({ companyId: 0, documentTypeId: 0, letterDate: "", subject: letter.subject || "", recipient: letter.recipient || "", attachmentUrl: "", status: statusValue });
        setIsEditDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({ companyId: 0, documentTypeId: 0, letterDate: new Date().toISOString().split("T")[0], subject: "", recipient: "", attachmentUrl: "", status: LetterStatus.Draft });
        setSelectedLetter(null);
    };

    return (
        <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Cari nomor, subject, recipient..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                        </div>
                    </div>
                    <Select value={selectedCompany?.toString() || "all"} onValueChange={(v) => setSelectedCompany(v === "all" ? undefined : parseInt(v))}>
                        <SelectTrigger><SelectValue placeholder="Semua Company" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Company</SelectItem>
                            {companies.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={selectedDocType?.toString() || "all"} onValueChange={(v) => setSelectedDocType(v === "all" ? undefined : parseInt(v))}>
                        <SelectTrigger><SelectValue placeholder="Semua Tipe" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Tipe</SelectItem>
                            {documentTypes.map((t) => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="h-4 w-4 mr-2" />Buat Surat
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Penerima</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={8} className="px-6 py-12 text-center"><div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div></td></tr>
                            ) : letters.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Tidak ada data surat</td></tr>
                            ) : letters.map((letter) => (
                                <tr key={letter.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{letter.formattedNumber}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(letter.letterDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{letter.subject}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{letter.recipient}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{letter.companyCode}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{letter.documentTypeCode}</td>
                                    <td className="px-6 py-4"><StatusBadge status={letter.status} /></td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(letter)}><Edit className="h-4 w-4" /></Button>
                                            {(
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(letter.id, letter.status)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={pageSize} onPageChange={setCurrentPage} />
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Buat Nomor Surat Baru</DialogTitle>
                        <DialogDescription>Isi data untuk generate nomor surat baru.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Company *</Label>
                                <Select value={formData.companyId.toString()} onValueChange={(v) => setFormData({ ...formData, companyId: parseInt(v) })}>
                                    <SelectTrigger><SelectValue placeholder="Pilih company" /></SelectTrigger>
                                    <SelectContent>
                                        {companies.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tipe Dokumen *</Label>
                                <Select value={formData.documentTypeId.toString()} onValueChange={(v) => setFormData({ ...formData, documentTypeId: parseInt(v) })}>
                                    <SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
                                    <SelectContent>
                                        {documentTypes.map((t) => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Tanggal Surat *</Label>
                            <Input type="date" value={formData.letterDate} onChange={(e) => setFormData({ ...formData, letterDate: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Subject *</Label>
                            <Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="Masukkan subject surat" />
                        </div>
                        <div className="space-y-2">
                            <Label>Penerima</Label>
                            <Input value={formData.recipient} onChange={(e) => setFormData({ ...formData, recipient: e.target.value })} placeholder="Masukkan nama penerima" />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={formData.status.toString()} onValueChange={(v) => setFormData({ ...formData, status: parseInt(v) })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Draft</SelectItem>
                                    <SelectItem value="1">Sent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700" disabled={isCreating}>
                            {isCreating ? "Membuat..." : "Buat Surat"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Surat</DialogTitle>
                        <DialogDescription>Update detail surat di bawah.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Subject *</Label>
                            <Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Penerima</Label>
                            <Input value={formData.recipient} onChange={(e) => setFormData({ ...formData, recipient: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={formData.status.toString()} onValueChange={(v) => setFormData({ ...formData, status: parseInt(v) })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Draft</SelectItem>
                                    <SelectItem value="1">Sent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleUpdate} className="bg-indigo-600 hover:bg-indigo-700">Update</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// =============================================
// GATEPASS TAB
// =============================================
function GatepassTab() {
    const { toast } = useToast();
    const [items, setItems] = useState<GatepassList[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<GatepassList | null>(null);

    const [formData, setFormData] = useState<GatepassCreate>({
        destination: "", picName: "", picContact: "", gatepassDate: new Date().toISOString().split("T")[0],
        notes: "", status: 0, items: [{ itemName: "", quantity: 1, unit: "unit", description: "", serialNumber: "" }],
    });

    const [editFormData, setEditFormData] = useState<GatepassUpdate>({
        destination: "", picName: "", picContact: "", notes: "", status: 0,
    });

    useEffect(() => { loadItems(); }, [currentPage, searchTerm]);

    const loadItems = async () => {
        try {
            setLoading(true);
            const result = await gatepassApi.getAll({ page: currentPage, pageSize, search: searchTerm || undefined });
            setItems(result.data || []);
            setTotalCount(result.meta?.pagination?.totalCount || 0);
            setTotalPages(result.meta?.pagination?.totalPages || 0);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to load gatepasses", variant: "destructive" });
        } finally { setLoading(false); }
    };

    const addItem = () => {
        setFormData({ ...formData, items: [...formData.items, { itemName: "", quantity: 1, unit: "unit", description: "", serialNumber: "" }] });
    };

    const removeItem = (index: number) => {
        if (formData.items.length <= 1) return;
        setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
    };

    const updateItem = (index: number, field: keyof GatepassItemCreate, value: any) => {
        const updated = [...formData.items];
        (updated[index] as any)[field] = value;
        setFormData({ ...formData, items: updated });
    };

    const handleCreate = async () => {
        if (!formData.destination.trim()) { toast({ title: "Error", description: "Tujuan harus diisi", variant: "destructive" }); return; }
        if (!formData.picName.trim()) { toast({ title: "Error", description: "Nama PIC harus diisi", variant: "destructive" }); return; }
        if (!formData.items.some(i => i.itemName.trim())) { toast({ title: "Error", description: "Minimal 1 item harus diisi", variant: "destructive" }); return; }
        try {
            setIsCreating(true);
            const cleanItems = formData.items.filter(i => i.itemName.trim());
            await gatepassApi.create({ ...formData, items: cleanItems });
            toast({ title: "Success", description: "Gatepass berhasil dibuat" });
            setIsCreateDialogOpen(false); resetForm(); loadItems();
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || error.message, variant: "destructive" });
        } finally { setIsCreating(false); }
    };

    const handleUpdate = async () => {
        if (!selectedItem) return;
        try {
            await gatepassApi.update(selectedItem.id, editFormData);
            toast({ title: "Success", description: "Gatepass berhasil diupdate" });
            setIsEditDialogOpen(false); loadItems();
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || error.message, variant: "destructive" });
        }
    };

    const handleDelete = async (id: number, status: string) => {

        if (!confirm("Yakin ingin menghapus gatepass ini?")) return;
        try {
            await gatepassApi.delete(id);
            toast({ title: "Success", description: "Gatepass berhasil dihapus" });
            loadItems();
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || error.message, variant: "destructive" });
        }
    };

    const openEditDialog = (item: GatepassList) => {
        setSelectedItem(item);
        setEditFormData({ destination: item.destination, picName: item.picName, picContact: item.picContact || "", notes: "", status: item.status === "Sent" ? 1 : 0 });
        setIsEditDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({ destination: "", picName: "", picContact: "", gatepassDate: new Date().toISOString().split("T")[0], notes: "", status: 0, items: [{ itemName: "", quantity: 1, unit: "unit", description: "", serialNumber: "" }] });
        setSelectedItem(null);
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Cari gatepass..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                        </div>
                    </div>
                    <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="h-4 w-4 mr-2" />Buat Gatepass
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tujuan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PIC</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center"><div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div></td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Tidak ada data gatepass</td></tr>
                            ) : items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.formattedNumber}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.gatepassDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{item.destination}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{item.picName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{item.itemCount} item(s)</td>
                                    <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}><Edit className="h-4 w-4" /></Button>
                                            {(
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id, item.status)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={pageSize} onPageChange={setCurrentPage} />
            </div>

            {/* Create Gatepass Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Buat Gatepass Baru</DialogTitle>
                        <DialogDescription>Isi data untuk membuat gatepass baru.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tujuan *</Label>
                                <Input value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} placeholder="Tujuan pengiriman" />
                            </div>
                            <div className="space-y-2">
                                <Label>Tanggal *</Label>
                                <Input type="date" value={formData.gatepassDate} onChange={(e) => setFormData({ ...formData, gatepassDate: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nama PIC *</Label>
                                <Input value={formData.picName} onChange={(e) => setFormData({ ...formData, picName: e.target.value })} placeholder="Nama PIC" />
                            </div>
                            <div className="space-y-2">
                                <Label>Kontak PIC</Label>
                                <Input value={formData.picContact || ""} onChange={(e) => setFormData({ ...formData, picContact: e.target.value })} placeholder="No. HP / Email" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Catatan</Label>
                            <Input value={formData.notes || ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Catatan tambahan" />
                        </div>

                        {/* Items */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Daftar Barang</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Tambah</Button>
                            </div>
                            {formData.items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-lg">
                                    <div className="col-span-4">
                                        <Input placeholder="Nama barang *" value={item.itemName} onChange={(e) => updateItem(index, "itemName", e.target.value)} />
                                    </div>
                                    <div className="col-span-2">
                                        <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)} />
                                    </div>
                                    <div className="col-span-2">
                                        <Input placeholder="Unit" value={item.unit || ""} onChange={(e) => updateItem(index, "unit", e.target.value)} />
                                    </div>
                                    <div className="col-span-3">
                                        <Input placeholder="Serial Number" value={item.serialNumber || ""} onChange={(e) => updateItem(index, "serialNumber", e.target.value)} />
                                    </div>
                                    <div className="col-span-1 flex items-center">
                                        {formData.items.length > 1 && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-red-500"><Trash2 className="h-3 w-3" /></Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700" disabled={isCreating}>
                            {isCreating ? "Membuat..." : "Buat Gatepass"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Gatepass Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Gatepass</DialogTitle>
                        <DialogDescription>Update detail gatepass.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Tujuan *</Label>
                            <Input value={editFormData.destination} onChange={(e) => setEditFormData({ ...editFormData, destination: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nama PIC *</Label>
                                <Input value={editFormData.picName} onChange={(e) => setEditFormData({ ...editFormData, picName: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Kontak PIC</Label>
                                <Input value={editFormData.picContact || ""} onChange={(e) => setEditFormData({ ...editFormData, picContact: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Catatan</Label>
                            <Input value={editFormData.notes || ""} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={editFormData.status.toString()} onValueChange={(v) => setEditFormData({ ...editFormData, status: parseInt(v) })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Draft</SelectItem>
                                    <SelectItem value="1">Sent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleUpdate} className="bg-emerald-600 hover:bg-emerald-700">Update</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// =============================================
// QUOTATION TAB
// =============================================
function QuotationTab() {
    const { toast } = useToast();
    const [items, setItems] = useState<QuotationList[]>([]);
    const [companies, setCompanies] = useState<CompanyList[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<QuotationList | null>(null);

    const [formData, setFormData] = useState<QuotationCreate>({
        customerId: 0, description: "", quotationDate: new Date().toISOString().split("T")[0], notes: "", status: 0,
    });
    const [editFormData, setEditFormData] = useState<QuotationUpdate>({
        description: "", notes: "", status: 0,
    });

    useEffect(() => { loadItems(); loadCompanies(); }, [currentPage, searchTerm]);

    const loadItems = async () => {
        try {
            setLoading(true);
            const result = await quotationApi.getAll({ page: currentPage, pageSize, search: searchTerm || undefined });
            setItems(result.data || []);
            setTotalCount(result.meta?.pagination?.totalCount || 0);
            setTotalPages(result.meta?.pagination?.totalPages || 0);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to load quotations", variant: "destructive" });
        } finally { setLoading(false); }
    };

    const loadCompanies = async () => {
        try {
            const result = await companyApi.getAll({ pageSize: 100, isActive: true });
            setCompanies(result.data);
        } catch (e) { console.error(e); }
    };

    const handleCreate = async () => {
        if (!formData.customerId || formData.customerId <= 0) { toast({ title: "Error", description: "Pilih customer", variant: "destructive" }); return; }
        if (!formData.description.trim()) { toast({ title: "Error", description: "Deskripsi harus diisi", variant: "destructive" }); return; }
        try {
            setIsCreating(true);
            await quotationApi.create(formData);
            toast({ title: "Success", description: "Quotation berhasil dibuat" });
            setIsCreateDialogOpen(false); resetForm(); loadItems();
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || error.message, variant: "destructive" });
        } finally { setIsCreating(false); }
    };

    const handleUpdate = async () => {
        if (!selectedItem) return;
        try {
            await quotationApi.update(selectedItem.id, editFormData);
            toast({ title: "Success", description: "Quotation berhasil diupdate" });
            setIsEditDialogOpen(false); loadItems();
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || error.message, variant: "destructive" });
        }
    };

    const handleDelete = async (id: number, status: string) => {

        if (!confirm("Yakin ingin menghapus quotation ini?")) return;
        try {
            await quotationApi.delete(id);
            toast({ title: "Success", description: "Quotation berhasil dihapus" });
            loadItems();
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || error.message, variant: "destructive" });
        }
    };

    const openEditDialog = (item: QuotationList) => {
        setSelectedItem(item);
        setEditFormData({ description: item.description, notes: "", status: item.status === "Sent" ? 1 : 0 });
        setIsEditDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({ customerId: 0, description: "", quotationDate: new Date().toISOString().split("T")[0], notes: "", status: 0 });
        setSelectedItem(null);
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Cari quotation..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                        </div>
                    </div>
                    <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-violet-600 hover:bg-violet-700">
                        <Plus className="h-4 w-4 mr-2" />Buat Quotation
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center"><div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div></div></td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Tidak ada data quotation</td></tr>
                            ) : items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.formattedNumber}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.quotationDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{item.customerName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{item.description}</td>
                                    <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}><Edit className="h-4 w-4" /></Button>
                                            {(
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id, item.status)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={pageSize} onPageChange={setCurrentPage} />
            </div>

            {/* Create Quotation Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Buat Quotation Baru</DialogTitle>
                        <DialogDescription>Isi data untuk membuat quotation baru.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Customer *</Label>
                                <Select value={formData.customerId.toString()} onValueChange={(v) => setFormData({ ...formData, customerId: parseInt(v) })}>
                                    <SelectTrigger><SelectValue placeholder="Pilih customer" /></SelectTrigger>
                                    <SelectContent>
                                        {companies.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tanggal *</Label>
                                <Input type="date" value={formData.quotationDate} onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Deskripsi *</Label>
                            <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi quotation" />
                        </div>
                        <div className="space-y-2">
                            <Label>Catatan</Label>
                            <Input value={formData.notes || ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Catatan tambahan" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleCreate} className="bg-violet-600 hover:bg-violet-700" disabled={isCreating}>
                            {isCreating ? "Membuat..." : "Buat Quotation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Quotation Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Quotation</DialogTitle>
                        <DialogDescription>Update detail quotation.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Deskripsi *</Label>
                            <Input value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Catatan</Label>
                            <Input value={editFormData.notes || ""} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={editFormData.status.toString()} onValueChange={(v) => setEditFormData({ ...editFormData, status: parseInt(v) })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Draft</SelectItem>
                                    <SelectItem value="1">Sent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleUpdate} className="bg-violet-600 hover:bg-violet-700">Update</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
