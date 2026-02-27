import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "../contexts/AuthContext";
import { hasPermission } from "../utils/permissionUtils";
import {
    FileText,
    Plus,
    Search,
    Edit,
    Trash2,
    Truck,
    Receipt,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Check,
    ChevronsUpDown,
    Menu,
    Bell,
    Eye,
} from "lucide-react";
import { DatePicker } from "./ui/date-picker";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "../lib/utils";
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
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>("letters");

    const tabs = [
        { id: "letters" as TabType, label: "Surat Umum", icon: FileText, color: "indigo" },
        { id: "gatepass" as TabType, label: "Gatepass", icon: Truck, color: "emerald" },
        { id: "quotation" as TabType, label: "Quotation", icon: Receipt, color: "violet" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Desktop Header */}
            <div className="hidden md:block mb-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 rounded-lg">
                            <FileText className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Letter Management</h1>
                            <p className="text-sm text-gray-500">Manage letters, gatepass, and quotations</p>
                        </div>
                    </div>
                    <Button onClick={() => navigate("/dashboard")} variant="outline" size="sm">
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Kembali ke Dashboard
                    </Button>
                </div>
            </div>

            {/* Mobile Header Elements (Removed - superseded by Top App Bar) */}

            {/* Tabs Container */}
            <div className="mb-6">
                {/* Tabs - Mobile: Underline Style Header Tab */}
                <div className="md:hidden flex border-b border-gray-200 mb-4 bg-transparent overflow-x-auto hide-scrollbar">
                    {tabs.map((tab) => {
                        const activeColor = tab.color === 'indigo' ? '#4f46e5' : tab.color === 'emerald' ? '#059669' : '#7c3aed';
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex flex-1 items-center justify-center whitespace-nowrap min-w-fit px-4 py-3 text-[13px] font-bold transition-all border-b-2`}
                                style={activeTab === tab.id ? { color: activeColor, borderColor: activeColor } : { borderColor: 'transparent', color: '#64748b' }}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
                {/* Tabs - Desktop: pill style */}
                <div className="hidden md:flex gap-1 bg-white rounded-lg p-1 shadow-sm border overflow-x-auto hide-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center justify-center whitespace-nowrap flex-shrink-0 gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            style={activeTab === tab.id ? {
                                backgroundColor: tab.color === 'indigo' ? '#4f46e5' : tab.color === 'emerald' ? '#059669' : '#7c3aed'
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
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [selectedDetailLetter, setSelectedDetailLetter] = useState<LetterNumberList | null>(null);
    const [openCompanyBox, setOpenCompanyBox] = useState(false);
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
                {/* Desktop Filters */}
                <div className="hidden md:grid grid-cols-5 gap-4">
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
                    {hasPermission("letter.create") && <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="h-4 w-4 mr-2" />Buat Surat
                    </Button>}
                </div>

                {/* Mobile Filters */}
                <div className="md:hidden flex flex-col gap-3 bg-[#fbf8ff] p-4 rounded-xl mb-4 border border-purple-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b5cf6]" />
                        <Input placeholder="Search letters..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2.5 h-10 border-none rounded-xl focus:ring-2 focus:ring-purple-500 text-sm bg-[#f3e8ff] text-gray-900 placeholder-[#c084fc]" />
                    </div>

                    <div className="flex flex-wrap gap-2 relative z-30 pb-1">
                        <div className="relative shrink-0">
                            <button onClick={() => {
                                document.getElementById("mobile-dropdown-company")?.classList.remove("hidden");
                            }} className="flex items-center justify-between h-8 rounded-lg bg-[#f3e8ff] px-3 text-gray-800 text-xs font-medium select-none min-w-[100px]">
                                <span className="truncate max-w-[120px]">{selectedCompany ? companies.find(c => c.id === selectedCompany)?.name : "Company"}</span>
                                <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
                            </button>
                        </div>
                        <div className="relative shrink-0">
                            <button onClick={() => {
                                document.getElementById("mobile-dropdown-doctype")?.classList.remove("hidden");
                            }} className="flex items-center justify-between h-8 rounded-lg bg-[#f3e8ff] px-3 text-gray-800 text-xs font-medium select-none min-w-[90px]">
                                <span className="truncate max-w-[110px]">{selectedDocType ? documentTypes.find(d => d.id === selectedDocType)?.name : "Type"}</span>
                                <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table - Desktop */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Nomor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Tanggal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Subject</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Penerima</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Company</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Tipe</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Pembuat</th>
                                {(hasPermission("letter.update") || hasPermission("letter.delete")) && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={9} className="px-6 py-12 text-center"><div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div></td></tr>
                            ) : letters.length === 0 ? (
                                <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-500">Tidak ada data surat</td></tr>
                            ) : letters.map((letter) => (
                                <tr key={letter.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{letter.formattedNumber}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{new Date(letter.letterDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{letter.subject}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{letter.recipient}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{letter.companyCode}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{letter.documentTypeCode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={letter.status} /></td>
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{letter.createdByName || "-"}</td>
                                    {(hasPermission("letter.update") || hasPermission("letter.delete")) && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {hasPermission("letter.update") && <Button variant="ghost" size="sm" onClick={() => openEditDialog(letter)}><Edit className="h-4 w-4" /></Button>}
                                                {hasPermission("letter.delete") && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(letter.id, letter.status)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={pageSize} onPageChange={setCurrentPage} />
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-3">
                {loading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                ) : letters.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm">Tidak ada data surat</div>
                ) : letters.map((letter) => (
                    <div key={letter.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <StatusBadge status={letter.status} />
                            <span className="text-xs text-gray-400 font-medium">{new Date(letter.letterDate).toLocaleDateString()}</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">{letter.formattedNumber}</p>
                            <p className="text-sm text-gray-700 mt-1 line-clamp-1">{letter.subject}</p>
                        </div>
                        {letter.recipient && (
                            <p className="text-xs text-gray-500">Penerima: {letter.recipient}</p>
                        )}
                        <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100">
                            <div className="flex items-center flex-wrap gap-1.5 text-xs text-gray-500 min-w-0 pr-2">
                                <span className="font-medium shrink-0">{letter.companyCode}</span>
                                <span className="shrink-0">•</span>
                                <span className="shrink-0">{letter.documentTypeCode}</span>
                                <span className="shrink-0">•</span>
                                <span className="truncate">{letter.createdByName || "-"}</span>
                            </div>
                            <div className="flex gap-1 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" onClick={() => { setSelectedDetailLetter(letter); setIsDetailDialogOpen(true); }} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                    <Eye className="h-4 w-4" />
                                </Button>
                                {(hasPermission("letter.update") || hasPermission("letter.delete")) && (
                                    <>
                                        {hasPermission("letter.update") && <Button variant="ghost" size="sm" onClick={() => openEditDialog(letter)}><Edit className="h-4 w-4" /></Button>}
                                        {hasPermission("letter.delete") && (
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(letter.id, letter.status)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <Pagination currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={pageSize} onPageChange={setCurrentPage} />
            </div>

            {/* Mobile Floating Action Button */}
            {hasPermission("letter.create") && (
                <button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="md:hidden fixed bottom-24 right-4 z-30 flex items-center gap-2 bg-[#9333ea] hover:bg-purple-700 text-white px-5 py-3.5 rounded-full shadow-lg font-bold shadow-purple-500/40 transition-all active:scale-95 text-[15px]"
                >
                    <Plus className="w-5 h-5" /> Buat Surat
                </button>
            )}

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Buat Nomor Surat Baru</DialogTitle>
                        <DialogDescription>Isi data untuk generate nomor surat baru.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Company *</Label>
                                <Popover open={openCompanyBox} onOpenChange={setOpenCompanyBox} modal={true}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCompanyBox}
                                            className="w-full justify-between font-normal"
                                        >
                                            {formData.companyId
                                                ? companies.find((c) => c.id === formData.companyId)?.name
                                                : "Pilih company"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0 pointer-events-auto" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari company..." />
                                            <CommandList>
                                                <CommandEmpty>Company tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {companies.map((c) => (
                                                        <CommandItem
                                                            key={c.id}
                                                            value={c.name}
                                                            onSelect={() => {
                                                                setFormData({ ...formData, companyId: c.id });
                                                                setOpenCompanyBox(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    formData.companyId === c.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {c.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
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
                            <DatePicker
                                date={formData.letterDate ? new Date(formData.letterDate) : undefined}
                                onSelect={(d) => setFormData({ ...formData, letterDate: d ? format(d, "yyyy-MM-dd") : "" })}
                                className="w-full"
                            />
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

            {/* Detail Surat Mobile Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="sm:max-w-[500px] w-[95vw] rounded-xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Surat Umum</DialogTitle>
                    </DialogHeader>
                    {selectedDetailLetter && (
                        <div className="grid gap-3 py-4 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Nomor Surat</span>
                                <span className="font-bold text-gray-900">{selectedDetailLetter.formattedNumber}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Tanggal</span>
                                <span className="text-gray-900">{new Date(selectedDetailLetter.letterDate).toLocaleDateString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Status</span>
                                <span><StatusBadge status={selectedDetailLetter.status} /></span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Perusahaan</span>
                                <span className="text-gray-900">{selectedDetailLetter.companyCode}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Tipe Dokumen</span>
                                <span className="text-gray-900">{selectedDetailLetter.documentTypeCode}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Pembuat</span>
                                <span className="text-gray-900">{selectedDetailLetter.createdByName || "-"}</span>
                            </div>
                            <div className="flex flex-col gap-1 border-b pb-2">
                                <span className="text-gray-500">Subjek</span>
                                <span className="text-gray-900">{selectedDetailLetter.subject}</span>
                            </div>
                            <div className="flex flex-col gap-1 border-b pb-2">
                                <span className="text-gray-500">Penerima</span>
                                <span className="text-gray-900">{selectedDetailLetter.recipient || "-"}</span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setIsDetailDialogOpen(false)}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========== MOBILE FILTER MODALS ========== */}
            <div id="mobile-dropdown-company" className="hidden fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={() => document.getElementById("mobile-dropdown-company")?.classList.add("hidden")}>
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[70vh] animate-in slide-in-from-bottom-8 duration-200"
                    onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                        <h3 className="font-bold text-gray-800">Pilih Company</h3>
                    </div>
                    <div className="overflow-y-auto p-2 space-y-1">
                        <div className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${!selectedCompany ? 'font-bold text-indigo-700 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'}`}
                            onClick={() => { setSelectedCompany(undefined); setCurrentPage(1); document.getElementById("mobile-dropdown-company")?.classList.add("hidden"); }}>
                            Semua Company {!selectedCompany && <Check className="w-4 h-4" />}
                        </div>
                        {companies.map((c) => (
                            <div key={c.id} className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${selectedCompany === c.id ? 'font-bold text-indigo-700 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'}`}
                                onClick={() => { setSelectedCompany(c.id); setCurrentPage(1); document.getElementById("mobile-dropdown-company")?.classList.add("hidden"); }}>
                                {c.name} {selectedCompany === c.id && <Check className="w-4 h-4" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div id="mobile-dropdown-doctype" className="hidden fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={() => document.getElementById("mobile-dropdown-doctype")?.classList.add("hidden")}>
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[70vh] animate-in slide-in-from-bottom-8 duration-200"
                    onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                        <h3 className="font-bold text-gray-800">Pilih Tipe Dokumen</h3>
                    </div>
                    <div className="overflow-y-auto p-2 space-y-1">
                        <div className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${!selectedDocType ? 'font-bold text-indigo-700 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'}`}
                            onClick={() => { setSelectedDocType(undefined); setCurrentPage(1); document.getElementById("mobile-dropdown-doctype")?.classList.add("hidden"); }}>
                            Semua Tipe {!selectedDocType && <Check className="w-4 h-4" />}
                        </div>
                        {documentTypes.map((t) => (
                            <div key={t.id} className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${selectedDocType === t.id ? 'font-bold text-indigo-700 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'}`}
                                onClick={() => { setSelectedDocType(t.id); setCurrentPage(1); document.getElementById("mobile-dropdown-doctype")?.classList.add("hidden"); }}>
                                {t.name} {selectedDocType === t.id && <Check className="w-4 h-4" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
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
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [selectedDetailItem, setSelectedDetailItem] = useState<GatepassList | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [expandedItemDetails, setExpandedItemDetails] = useState<Record<number, any>>({});

    const [formData, setFormData] = useState<GatepassCreate>({
        destination: "", picName: "", picContact: "", gatepassDate: new Date().toISOString().split("T")[0],
        notes: "", status: 0, items: [{ itemName: "", quantity: 1, unit: "EA", description: "", serialNumber: "" }],
    });

    const [editFormData, setEditFormData] = useState<GatepassUpdate>({
        destination: "", picName: "", picContact: "", notes: "", status: 0,
        items: [{ itemName: "", quantity: 1, unit: "EA", description: "", serialNumber: "" }],
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
        setFormData({ ...formData, items: [...formData.items, { itemName: "", quantity: 1, unit: "EA", description: "", serialNumber: "" }] });
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

    const openEditDialog = async (item: GatepassList) => {
        setSelectedItem(item);
        try {
            const detail = await gatepassApi.getById(item.id);
            setEditFormData({
                destination: detail.destination,
                picName: detail.picName,
                picContact: detail.picContact || "",
                notes: detail.notes || "",
                status: detail.status === "Sent" ? 1 : 0,
                items: detail.items.map(i => ({
                    itemName: i.itemName,
                    quantity: i.quantity,
                    unit: i.unit || "EA",
                    description: i.description || "",
                    serialNumber: i.serialNumber || "",
                })),
            });
        } catch {
            setEditFormData({ destination: item.destination, picName: item.picName, picContact: item.picContact || "", notes: "", status: item.status === "Sent" ? 1 : 0, items: [] });
        }
        setIsEditDialogOpen(true);
    };

    const addEditItem = () => {
        setEditFormData({ ...editFormData, items: [...(editFormData.items || []), { itemName: "", quantity: 1, unit: "EA", description: "", serialNumber: "" }] });
    };

    const removeEditItem = (index: number) => {
        if (!editFormData.items || editFormData.items.length <= 1) return;
        setEditFormData({ ...editFormData, items: editFormData.items.filter((_, i) => i !== index) });
    };

    const updateEditItem = (index: number, field: keyof GatepassItemCreate, value: any) => {
        const updated = [...(editFormData.items || [])];
        (updated[index] as any)[field] = value;
        setEditFormData({ ...editFormData, items: updated });
    };

    const toggleExpandRow = async (id: number) => {
        const next = new Set(expandedRows);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
            if (!expandedItemDetails[id]) {
                try {
                    const detail = await gatepassApi.getById(id);
                    setExpandedItemDetails(prev => ({ ...prev, [id]: detail }));
                } catch (e) { console.error(e); }
            }
        }
        setExpandedRows(next);
    };

    const resetForm = () => {
        setFormData({ destination: "", picName: "", picContact: "", gatepassDate: new Date().toISOString().split("T")[0], notes: "", status: 0, items: [{ itemName: "", quantity: 1, unit: "EA", description: "", serialNumber: "" }] });
        setSelectedItem(null);
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                {/* Desktop Filters */}
                <div className="hidden md:grid grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Cari gatepass..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                        </div>
                    </div>
                    {hasPermission("gatepass.create") && <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="h-4 w-4 mr-2" />Buat Gatepass
                    </Button>}
                </div>

                {/* Mobile Filters */}
                <div className="md:hidden flex flex-col gap-3 bg-[#fbf8ff] p-4 rounded-xl mb-4 border border-purple-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b5cf6]" />
                        <Input placeholder="Search gatepass..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2.5 h-10 border-none rounded-xl focus:ring-2 focus:ring-purple-500 text-sm bg-[#f3e8ff] text-gray-900 placeholder-[#c084fc]" />
                    </div>
                </div>
            </div>

            {/* Table - Desktop */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Nomor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Tanggal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Tujuan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">PIC</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Pembuat</th>
                                {(hasPermission("gatepass.update") || hasPermission("gatepass.delete")) && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={(hasPermission("gatepass.update") || hasPermission("gatepass.delete")) ? 8 : 7} className="px-6 py-12 text-center"><div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div></td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={(hasPermission("gatepass.update") || hasPermission("gatepass.delete")) ? 8 : 7} className="px-6 py-12 text-center text-gray-500">Tidak ada data gatepass</td></tr>
                            ) : items.map((item) => (
                                <React.Fragment key={item.id}>
                                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpandRow(item.id)}>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{item.formattedNumber}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{new Date(item.gatepassDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.destination}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{item.picName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                            <span className="flex items-center gap-1">
                                                {expandedRows.has(item.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                                {item.itemCount} item(s)
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <StatusBadge status={item.status} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{item.createdByName || "-"}</td>
                                        {(hasPermission("gatepass.update") || hasPermission("gatepass.delete")) && (
                                            <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1">
                                                    {hasPermission("gatepass.update") && <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}><Edit className="h-4 w-4" /></Button>}
                                                    {hasPermission("gatepass.delete") && <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id, item.status)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                    {expandedRows.has(item.id) && (
                                        <tr className="bg-emerald-50">
                                            <td colSpan={(hasPermission("gatepass.update") || hasPermission("gatepass.delete")) ? 8 : 7} className="px-6 py-3">
                                                {expandedItemDetails[item.id] ? (
                                                    <div className="space-y-4 pt-2">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-white p-3 rounded border border-emerald-100 shadow-sm">
                                                            <div>
                                                                <span className="font-semibold text-gray-600 block mb-1">Nama Driver / Pembawa Gatepass:</span>
                                                                <span className="text-gray-900">{expandedItemDetails[item.id].picContact || "-"}</span>
                                                            </div>
                                                            <div>
                                                                <span className="font-semibold text-gray-600 block mb-1">Catatan Tambahan:</span>
                                                                <span className="text-gray-900">{expandedItemDetails[item.id].notes || "-"}</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1 bg-white p-3 rounded border border-emerald-100 shadow-sm">
                                                            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Detail Barang</p>
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="text-xs text-gray-500">
                                                                        <th className="text-left py-1 w-1/3">Nama Barang</th>
                                                                        <th className="text-left py-1 w-16">Qty</th>
                                                                        <th className="text-left py-1 w-16">Unit</th>
                                                                        <th className="text-left py-1 w-1/4">Serial Number</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {expandedItemDetails[item.id].items.map((detail: any, i: number) => (
                                                                        <tr key={i} className="border-t border-emerald-50">
                                                                            <td className="py-2 text-gray-900 font-medium">{detail.itemName}</td>
                                                                            <td className="py-2 text-gray-700">{detail.quantity}</td>
                                                                            <td className="py-2 text-gray-700">{detail.unit}</td>
                                                                            <td className="py-2 text-gray-500">{detail.serialNumber || "-"}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-gray-400 py-4"><div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>Memuat detail...</div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={pageSize} onPageChange={setCurrentPage} />
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-3">
                {loading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm">Tidak ada data gatepass</div>
                ) : items.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 cursor-pointer flex flex-col gap-2" onClick={() => toggleExpandRow(item.id)}>
                            <div className="flex justify-between items-start">
                                <StatusBadge status={item.status} />
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 font-medium">{new Date(item.gatepassDate).toLocaleDateString()}</span>
                                    <div className={`text-gray-400 transition-transform duration-200 ${expandedRows.has(item.id) ? 'rotate-180' : ''}`}>
                                        <ChevronDown className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{item.formattedNumber}</p>
                                <p className="text-sm text-gray-700 mt-1 line-clamp-1">{item.destination}</p>
                            </div>
                            <p className="text-xs text-gray-500">PIC: {item.picName}</p>
                            <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100">
                                <div className="flex items-center flex-wrap gap-1.5 text-xs text-gray-500 min-w-0 pr-2">
                                    <span className="font-medium shrink-0">Gatepass</span>
                                    <span className="shrink-0">•</span>
                                    <span className="whitespace-nowrap shrink-0">{item.itemCount} items</span>
                                    <span className="shrink-0">•</span>
                                    <span className="truncate">{item.createdByName || "-"}</span>
                                </div>
                                <div className="flex gap-1 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedDetailItem(item); setIsDetailDialogOpen(true); }} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    {(hasPermission("gatepass.update") || hasPermission("gatepass.delete")) && (
                                        <>
                                            {hasPermission("gatepass.update") && <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}><Edit className="h-4 w-4" /></Button>}
                                            {hasPermission("gatepass.delete") && (
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id, item.status)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        {expandedRows.has(item.id) && (
                            <div className="px-4 pb-4 border-t border-gray-100 pt-3 bg-gray-50/50">
                                {expandedItemDetails[item.id] ? (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Driver</span>
                                            <p className="text-sm font-medium text-gray-700">{expandedItemDetails[item.id].picContact || "-"}</p>
                                        </div>
                                        {expandedItemDetails[item.id].notes && (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Catatan</span>
                                                <p className="text-sm text-gray-700">{expandedItemDetails[item.id].notes}</p>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Items</span>
                                            <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                                                <table className="w-full text-left text-sm">
                                                    <thead>
                                                        <tr className="text-gray-400 text-xs border-b border-gray-100">
                                                            <th className="pb-1 font-medium">Nama Barang</th>
                                                            <th className="pb-1 font-medium text-right">Qty</th>
                                                            <th className="pb-1 font-medium text-right">S/N</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-gray-600">
                                                        {expandedItemDetails[item.id].items.map((detail: any, i: number) => (
                                                            <tr key={i}>
                                                                <td className="pt-2">{detail.itemName}</td>
                                                                <td className="pt-2 text-right">{detail.quantity} {detail.unit}</td>
                                                                <td className="pt-2 text-right text-gray-400">{detail.serialNumber || "-"}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400 py-4"><div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>Memuat detail...</div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                <Pagination currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={pageSize} onPageChange={setCurrentPage} />
            </div>

            {/* Mobile Floating Action Button */}
            {hasPermission("gatepass.create") && (
                <button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="md:hidden fixed bottom-24 right-4 z-30 flex items-center gap-2 bg-[#9333ea] hover:bg-purple-700 text-white px-5 py-3.5 rounded-full shadow-lg font-bold shadow-purple-500/40 transition-all active:scale-95 text-[15px]"
                >
                    <Plus className="w-5 h-5" /> Buat Gatepass
                </button>
            )}

            {/* Create Gatepass Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Buat Gatepass Baru</DialogTitle>
                        <DialogDescription>Isi data untuk membuat gatepass baru.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label>Tujuan *</Label>
                                <Input value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} placeholder="Tujuan pengiriman" />
                            </div>
                            <div className="space-y-2">
                                <Label>Tanggal *</Label>
                                <DatePicker
                                    date={formData.gatepassDate ? new Date(formData.gatepassDate) : undefined}
                                    onSelect={(d) => setFormData({ ...formData, gatepassDate: d ? format(d, "yyyy-MM-dd") : "" })}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label>Nama PIC *</Label>
                                <Input value={formData.picName} onChange={(e) => setFormData({ ...formData, picName: e.target.value })} placeholder="Nama PIC" />
                            </div>
                            <div className="space-y-2">
                                <Label>Nama Driver / Pembawa Gatepass</Label>
                                <Input value={formData.picContact || ""} onChange={(e) => setFormData({ ...formData, picContact: e.target.value })} placeholder="Masukkan nama driver / pembawa" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label>Catatan</Label>
                                <Input value={formData.notes || ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Catatan tambahan" />
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

                        {/* Items */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Daftar Barang</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Tambah</Button>
                            </div>
                            {formData.items.map((item, index) => (
                                <div key={index} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Input placeholder="Nama barang *" value={item.itemName} onChange={(e) => updateItem(index, "itemName", e.target.value)} />
                                        </div>
                                        <div className="w-16">
                                            <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)} />
                                        </div>
                                        <div className="w-16">
                                            <Input placeholder="Unit" value={item.unit || ""} onChange={(e) => updateItem(index, "unit", e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <div className="flex-1">
                                            <Input placeholder="Serial Number" value={item.serialNumber || ""} onChange={(e) => updateItem(index, "serialNumber", e.target.value)} />
                                        </div>
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
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Gatepass</DialogTitle>
                        <DialogDescription>Update detail gatepass.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label>Tujuan *</Label>
                                <Input value={editFormData.destination} onChange={(e) => setEditFormData({ ...editFormData, destination: e.target.value })} placeholder="Tujuan pengiriman" />
                            </div>
                            <div className="space-y-2">
                                <Label>Nama PIC *</Label>
                                <Input value={editFormData.picName} onChange={(e) => setEditFormData({ ...editFormData, picName: e.target.value })} placeholder="Nama PIC" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label>Nama Driver / Pembawa Gatepass</Label>
                                <Input value={editFormData.picContact || ""} onChange={(e) => setEditFormData({ ...editFormData, picContact: e.target.value })} placeholder="Masukkan nama driver / pembawa" />
                            </div>
                            <div className="space-y-2">
                                <Label>Catatan</Label>
                                <Input value={editFormData.notes || ""} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} placeholder="Catatan tambahan" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
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

                        {/* Items */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Daftar Barang</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addEditItem}><Plus className="h-3 w-3 mr-1" />Tambah</Button>
                            </div>
                            {(editFormData.items || []).map((item, index) => (
                                <div key={index} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Input placeholder="Nama barang *" value={item.itemName} onChange={(e) => updateEditItem(index, "itemName", e.target.value)} />
                                        </div>
                                        <div className="w-16">
                                            <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateEditItem(index, "quantity", parseInt(e.target.value) || 1)} />
                                        </div>
                                        <div className="w-16">
                                            <Input placeholder="Unit" value={item.unit || ""} onChange={(e) => updateEditItem(index, "unit", e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <div className="flex-1">
                                            <Input placeholder="Serial Number" value={item.serialNumber || ""} onChange={(e) => updateEditItem(index, "serialNumber", e.target.value)} />
                                        </div>
                                        {(editFormData.items || []).length > 1 && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeEditItem(index)} className="text-red-500"><Trash2 className="h-3 w-3" /></Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleUpdate} className="bg-emerald-600 hover:bg-emerald-700">Update</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Gatepass Mobile Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="sm:max-w-[500px] w-[95vw] rounded-xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Gatepass</DialogTitle>
                    </DialogHeader>
                    {selectedDetailItem && (
                        <div className="grid gap-3 py-4 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Nomor Gatepass</span>
                                <span className="font-bold text-gray-900">{selectedDetailItem.formattedNumber}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Tanggal</span>
                                <span className="text-gray-900">{new Date(selectedDetailItem.gatepassDate).toLocaleDateString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Status</span>
                                <span><StatusBadge status={selectedDetailItem.status} /></span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Tujuan</span>
                                <span className="text-gray-900">{selectedDetailItem.destination}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Nama PIC</span>
                                <span className="text-gray-900">{selectedDetailItem.picName}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Driver</span>
                                <span className="text-gray-900">{selectedDetailItem.picContact || "-"}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Total Item</span>
                                <span className="text-gray-900 font-bold">{selectedDetailItem.itemCount}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Pembuat</span>
                                <span className="text-gray-900">{selectedDetailItem.createdByName || "-"}</span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setIsDetailDialogOpen(false)}>Tutup</Button>
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
    const { user } = useAuth();
    const isAdmin = user?.roleName === "Super Admin" || user?.roleName === "Admin";
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
    const [openCreateCompanyBox, setOpenCreateCompanyBox] = useState(false);
    const [openEditCompanyBox, setOpenEditCompanyBox] = useState(false);

    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [selectedDetailItem, setSelectedDetailItem] = useState<QuotationList | null>(null);

    const [formData, setFormData] = useState<QuotationCreate>({
        customerId: 0, description: "", quotationDate: new Date().toISOString().split("T")[0], notes: "", status: 1,
    });
    const [editFormData, setEditFormData] = useState<QuotationUpdate>({
        description: "", notes: "", status: 0, customerId: 0, quotationDate: "",
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

    const openEditDialog = async (item: QuotationList) => {
        setSelectedItem(item);
        try {
            const detail = await quotationApi.getById(item.id);
            setEditFormData({
                description: detail.description,
                notes: detail.notes || "",
                status: detail.status === "Sent" ? 1 : 0,
                customerId: detail.customerId,
                quotationDate: detail.quotationDate ? new Date(detail.quotationDate).toISOString().split("T")[0] : "",
            });
        } catch {
            setEditFormData({
                description: item.description,
                notes: "",
                status: item.status === "Sent" ? 1 : 0,
            });
        }
        setIsEditDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({ customerId: 0, description: "", quotationDate: new Date().toISOString().split("T")[0], notes: "", status: 1 });
        setSelectedItem(null);
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                {/* Desktop Filters */}
                <div className="hidden md:grid grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Cari quotation..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                        </div>
                    </div>
                    {hasPermission("quotation.create") && <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-violet-600 hover:bg-violet-700">
                        <Plus className="h-4 w-4 mr-2" />Buat Quotation
                    </Button>}
                </div>

                {/* Mobile Filters */}
                <div className="md:hidden flex flex-col gap-3 bg-[#fbf8ff] p-4 rounded-xl mb-4 border border-purple-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b5cf6]" />
                        <Input placeholder="Search quotation..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2.5 h-10 border-none rounded-xl focus:ring-2 focus:ring-purple-500 text-sm bg-[#f3e8ff] text-gray-900 placeholder-[#c084fc]" />
                    </div>
                </div>
            </div>


            {/* Table - Desktop */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Nomor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Tanggal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Deskripsi</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Pembuat</th>
                                {(hasPermission("quotation.update") || hasPermission("quotation.delete")) && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center"><div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div></div></td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Tidak ada data quotation</td></tr>
                            ) : items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{item.formattedNumber}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{new Date(item.quotationDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.customerName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{item.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={item.status} /></td>
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{item.createdByName || "-"}</td>
                                    {(hasPermission("quotation.update") || hasPermission("quotation.delete")) && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {hasPermission("quotation.update") && <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}><Edit className="h-4 w-4" /></Button>}
                                                {hasPermission("quotation.delete") && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id, item.status)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={pageSize} onPageChange={setCurrentPage} />
            </div >

            {/* Mobile Card View */}
            < div className="md:hidden flex flex-col gap-3" >
                {
                    loading ? (
                        <div className="flex justify-center py-12" > <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div></div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm">Tidak ada data quotation</div>
                    ) : items.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <StatusBadge status={item.status} />
                                <span className="text-xs text-gray-400 font-medium">{new Date(item.quotationDate).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{item.formattedNumber}</p>
                                <p className="text-sm text-gray-500 mt-1 italic line-clamp-1">{item.description}</p>
                            </div>
                            {item.customerName && (
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center">
                                        <Receipt className="h-2.5 w-2.5 text-violet-600" />
                                    </div>
                                    <p className="text-xs text-gray-800 font-medium">{item.customerName}</p>
                                </div>
                            )}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="font-medium">Quotation</span>
                                    <span>•</span>
                                    <span>{item.createdByName || "-"}</span>
                                </div>
                                <div className="flex gap-1 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedDetailItem(item); setIsDetailDialogOpen(true); }} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    {(hasPermission("quotation.update") || hasPermission("quotation.delete")) && (
                                        <>
                                            {hasPermission("quotation.update") && <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}><Edit className="h-4 w-4" /></Button>}
                                            {hasPermission("quotation.delete") && (
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id, item.status)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                <Pagination currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={pageSize} onPageChange={setCurrentPage} />
            </div >

            {/* Mobile Floating Action Button */}
            {hasPermission("quotation.create") && (
                <button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="md:hidden fixed bottom-24 right-4 z-30 flex items-center gap-2 bg-[#9333ea] hover:bg-purple-700 text-white px-5 py-3.5 rounded-full shadow-lg font-bold shadow-purple-500/40 transition-all active:scale-95 text-[15px]"
                >
                    <Plus className="w-5 h-5" /> Buat Quotation
                </button>
            )}

            {/* Create Quotation Dialog */}
            < Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} >
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Buat Quotation Baru</DialogTitle>
                        <DialogDescription>Isi data untuk membuat quotation baru.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Customer *</Label>
                                <Popover open={openCreateCompanyBox} onOpenChange={setOpenCreateCompanyBox} modal={true}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCreateCompanyBox}
                                            className="w-full justify-between font-normal"
                                        >
                                            {formData.customerId
                                                ? companies.find((c) => c.id === formData.customerId)?.name
                                                : "Pilih customer"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0 pointer-events-auto" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari customer..." />
                                            <CommandList>
                                                <CommandEmpty>Customer tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {companies.map((c) => (
                                                        <CommandItem
                                                            key={c.id}
                                                            value={c.name}
                                                            onSelect={() => {
                                                                setFormData({ ...formData, customerId: c.id });
                                                                setOpenCreateCompanyBox(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    formData.customerId === c.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {c.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label>Tanggal Quotation *</Label>
                                <DatePicker
                                    date={formData.quotationDate ? new Date(formData.quotationDate) : undefined}
                                    onSelect={(d) => setFormData({ ...formData, quotationDate: d ? format(d, "yyyy-MM-dd") : "" })}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Deskripsi *</Label>
                                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi quotation" />
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
            </Dialog >

            {/* Edit Quotation Dialog */}
            < Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} >
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Quotation</DialogTitle>
                        <DialogDescription>Update detail quotation.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Customer</Label>
                                <Popover open={openEditCompanyBox} onOpenChange={setOpenEditCompanyBox} modal={true}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openEditCompanyBox}
                                            className="w-full justify-between font-normal"
                                        >
                                            {editFormData.customerId
                                                ? companies.find((c) => c.id === editFormData.customerId)?.name
                                                : "Pilih customer"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0 pointer-events-auto" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari customer..." />
                                            <CommandList>
                                                <CommandEmpty>Customer tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {companies.map((c) => (
                                                        <CommandItem
                                                            key={c.id}
                                                            value={c.name}
                                                            onSelect={() => {
                                                                setEditFormData({ ...editFormData, customerId: c.id });
                                                                setOpenEditCompanyBox(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    editFormData.customerId === c.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {c.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            {isAdmin && (
                                <div className="space-y-2">
                                    <Label>Tanggal</Label>
                                    <DatePicker
                                        date={editFormData.quotationDate ? new Date(editFormData.quotationDate) : undefined}
                                        onSelect={(d) => setEditFormData({ ...editFormData, quotationDate: d ? format(d, "yyyy-MM-dd") : "" })}
                                        className="w-full"
                                    />
                                </div>
                            )}
                        </div>
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

            {/* Detail Quotation Mobile Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="sm:max-w-[500px] w-[95vw] rounded-xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Quotation</DialogTitle>
                    </DialogHeader>
                    {selectedDetailItem && (
                        <div className="grid gap-3 py-4 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Nomor Quotation</span>
                                <span className="font-bold text-gray-900">{selectedDetailItem.formattedNumber}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Tanggal</span>
                                <span className="text-gray-900">{new Date(selectedDetailItem.quotationDate).toLocaleDateString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Status</span>
                                <span><StatusBadge status={selectedDetailItem.status} /></span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Customer</span>
                                <span className="text-gray-900">{selectedDetailItem.customerName}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Pembuat</span>
                                <span className="text-gray-900">{selectedDetailItem.createdByName || "-"}</span>
                            </div>
                            <div className="flex flex-col gap-1 pb-2">
                                <span className="text-gray-500">Deskripsi</span>
                                <span className="text-gray-900">{selectedDetailItem.description}</span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setIsDetailDialogOpen(false)}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </>
    );
}
