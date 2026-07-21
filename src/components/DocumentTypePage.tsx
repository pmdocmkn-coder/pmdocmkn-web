import React, { useState, useEffect } from "react";
import { hasPermission } from "../utils/permissionUtils";
import { documentTypeApi } from "../services/letterNumberApi";
import { DocumentTypeList, DocumentTypeCreate, DocumentTypeUpdate } from "../types/letterNumber";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { FileType, Plus, Search, Edit, Trash2, CheckCircle, XCircle, Home, ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ResponsiveModal } from "./common/ResponsiveModal";
import { Label } from "./ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function DocumentTypePage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [documentTypes, setDocumentTypes] = useState<DocumentTypeList[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showInactiveOnly, setShowInactiveOnly] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Dialog states
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState<DocumentTypeList | null>(null);

    // Form states
    const [formData, setFormData] = useState<DocumentTypeCreate & { isActive?: boolean }>({
        code: "",
        name: "",
        description: "",
        isActive: true,
    });

    useEffect(() => {
        loadDocumentTypes();
    }, [currentPage, searchTerm, showInactiveOnly]);

    const loadDocumentTypes = async () => {
        try {
            setLoading(true);
            const result = await documentTypeApi.getAll({
                page: currentPage,
                pageSize,
                search: searchTerm || undefined,
                isActive: showInactiveOnly ? false : undefined,
            });

            setDocumentTypes(result.data);
            setTotalCount(result.meta.pagination.totalCount);
            setTotalPages(result.meta.pagination.totalPages);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load document types",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            await documentTypeApi.create(formData);
            toast({
                title: "Success",
                description: "Document type created successfully",
            });
            setIsCreateDialogOpen(false);
            resetForm();
            loadDocumentTypes();
        } catch (error: any) {
            const errorData = error.response?.data;
            const message = errorData?.message || errorData?.data?.message || error.message || "Failed to create document type";

            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        }
    };

    const handleUpdate = async () => {
        if (!selectedDocType) return;

        try {
            const updateData: DocumentTypeUpdate = {
                name: formData.name,
                description: formData.description,
                isActive: formData.isActive ?? true,
            };

            await documentTypeApi.update(selectedDocType.id, updateData);
            toast({
                title: "Success",
                description: "Document type updated successfully",
            });
            setIsEditDialogOpen(false);
            resetForm();
            loadDocumentTypes();
        } catch (error: any) {
            const errorData = error.response?.data;
            const message = errorData?.message || errorData?.data?.message || error.message || "Failed to update document type";

            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this document type?")) return;

        try {
            await documentTypeApi.delete(id);
            toast({
                title: "Success",
                description: "Document type deleted successfully",
            });
            loadDocumentTypes();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to delete document type",
                variant: "destructive",
            });
        }
    };

    const openEditDialog = (docType: DocumentTypeList) => {
        setSelectedDocType(docType);
        setFormData({
            code: docType.code,
            name: docType.name,
            description: docType.description || "",
            isActive: docType.isActive,
        });
        setIsEditDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({
            code: "",
            name: "",
            description: "",
            isActive: true,
        });
        setSelectedDocType(null);
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#f7f6f8] text-slate-900">
            {/* ====== MOBILE INTEGRATED HEADER ====== */}
            <div className="md:hidden bg-white rounded-[14px] border border-[#E2E8F0] shadow-sm mb-4 mx-4 mt-4">
                <div className="flex items-start gap-4 p-4">
                    <div className="w-12 h-12 rounded-[12px] bg-[#EBF4FF] flex items-center justify-center flex-shrink-0">
                        <FileType className="w-5 h-5 text-[#2B6CB0]" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-[#2B6CB0] tracking-[0.1em] uppercase mb-0.5">Administration</p>
                        <h1 className="text-[20px] font-bold text-[#1A202C] leading-tight">Document Type</h1>
                        <p className="text-[12px] text-[#718096] mt-0.5">Kelola tipe dokumen surat</p>
                    </div>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-[#F7F8FA] border border-[#E2E8F0] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors flex-shrink-0"
                    >
                        <Home className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Default Header for Desktop */}
            <header className="hidden md:flex sticky top-0 z-10 items-center bg-[#f7f6f8] p-4 border-b border-[#9311d4]/10 justify-between">
                <div className="flex-1">
                    <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight">Document Type</h2>
                    <p className="text-xs text-slate-500 font-medium">Manage letter number types</p>
                </div>
                <Button onClick={() => navigate("/dashboard")} variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Dashboard
                </Button>
            </header>

            {/* Search Bar Section */}
            <div className="px-4 py-4 bg-[#f7f6f8]">
                <label className="flex flex-col min-w-40 h-12 w-full">
                    <div className="flex w-full flex-1 items-stretch rounded-xl h-full shadow-sm border border-[#9311d4]/10 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#9311d4]/50 transition-all">
                        <div className="text-[#9311d4] flex bg-white items-center justify-center pl-4 pr-2">
                            <Search className="w-5 h-5" />
                        </div>
                        <input
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden text-slate-900 focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-slate-400 px-2 text-base font-medium"
                            placeholder="Search document types..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </label>
            </div>

            {/* Filter and Toggle Section */}
            <div className="px-4 py-2 @container">
                <div className="flex flex-1 flex-col items-start justify-between gap-4 rounded-xl border border-[#9311d4]/10 bg-white p-4 sm:flex-row sm:items-center shadow-sm">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-slate-900 text-sm font-bold leading-tight">Show Inactive Data Only</p>
                        <p className="text-slate-500 text-xs font-medium">Filter to see only deactivated types</p>
                    </div>
                    <Switch
                        checked={showInactiveOnly}
                        onCheckedChange={setShowInactiveOnly}
                        className="data-[state=checked]:bg-[#9311d4]"
                    />
                </div>
            </div>

            {/* Action Button Section */}
            {hasPermission('letter.create') && (
                <div className="flex px-4 py-4">
                    <button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="flex h-12 px-6 flex-1 items-center justify-center overflow-hidden rounded-xl bg-[#9311d4] text-white gap-2 font-bold shadow-lg shadow-[#9311d4]/20 hover:bg-[#9311d4]/90 transition-all active:scale-[0.98]"
                    >
                        <Plus className="w-5 h-5 tracking-wide" />
                        <span className="truncate">Add Document Type</span>
                    </button>
                </div>
            )}

            {/* Card List */}
            <div className="flex flex-col gap-3 p-4 pb-24">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9311d4]"></div>
                    </div>
                ) : documentTypes.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-[#9311d4]/10 shadow-sm font-medium">
                        No document types found.
                    </div>
                ) : (
                    documentTypes.map((docType) => (
                        <div key={docType.id} className="flex flex-col gap-3 rounded-xl border border-[#9311d4]/10 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-1.5 flex-1 pr-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9311d4] bg-[#9311d4]/10 px-2.5 py-1 rounded-full w-fit">
                                        {docType.code}
                                    </span>
                                    <h3 className="text-slate-900 font-bold text-base leading-tight mt-1">{docType.name}</h3>
                                    {docType.description && (
                                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                            {docType.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-1 ml-2 shrink-0">
                                    {hasPermission('letter.update') && (
                                        <button
                                            onClick={() => openEditDialog(docType)}
                                            className="p-2 text-[#9311d4] hover:bg-purple-50 rounded-lg transition-colors"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                    )}
                                    {hasPermission('letter.delete') && (
                                        <button
                                            onClick={() => handleDelete(docType.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`h-2 w-2 rounded-full ${docType.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                <span className={`text-sm font-semibold tracking-wide ${docType.isActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                                    {docType.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    ))
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-between gap-4 pt-4 mt-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex-1 py-2.5 px-4 rounded-xl border border-[#9311d4]/20 text-[#9311d4] font-semibold text-sm disabled:opacity-50 disabled:bg-slate-50 hover:bg-[#9311d4]/5 transition-colors"
                        >
                            Previous
                        </button>
                        <div className="flex items-center justify-center px-4 font-bold text-slate-700 text-sm">
                            {currentPage} / {totalPages}
                        </div>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="flex-1 py-2.5 px-4 rounded-xl border border-[#9311d4]/20 text-[#9311d4] font-semibold text-sm disabled:opacity-50 disabled:bg-slate-50 hover:bg-[#9311d4]/5 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Create Dialog */}
            <ResponsiveModal
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                bottomSheetSize="xl"
                desktopClassName="max-w-[500px]"
                title="Tambah Tipe Dokumen"
                description="Buat tipe dokumen baru untuk penomoran surat."
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="rounded-[10px] h-11 font-semibold">Batal</Button>
                        <Button onClick={handleCreate} className="rounded-[10px] h-11 bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white font-semibold px-6">Buat Tipe Dokumen</Button>
                    </>
                }
            >
                <div className="grid gap-5">
                    <div className="space-y-2">
                        <Label htmlFor="code" className="font-semibold text-[#1A202C]">Kode Dokumen *</Label>
                        <Input id="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="cth: BAO" maxLength={50} className="h-11 rounded-[10px] border-[#E2E8F0]" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name" className="font-semibold text-[#1A202C]">Nama Dokumen *</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="cth: Berita Acara" className="h-11 rounded-[10px] border-[#E2E8F0]" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description" className="font-semibold text-[#1A202C]">Deskripsi</Label>
                        <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi tipe dokumen" rows={3} className="rounded-[10px] border-[#E2E8F0]" />
                    </div>
                </div>
            </ResponsiveModal>

            {/* Edit Dialog */}
            <ResponsiveModal
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                bottomSheetSize="xl"
                desktopClassName="max-w-[500px]"
                title="Edit Tipe Dokumen"
                description="Perbarui informasi tipe dokumen."
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-[10px] h-11 font-semibold">Batal</Button>
                        <Button onClick={handleUpdate} className="rounded-[10px] h-11 bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white font-semibold px-6">Simpan Perubahan</Button>
                    </>
                }
            >
                <div className="grid gap-5">
                    <div className="space-y-2">
                        <Label className="font-semibold text-[#1A202C]">Kode Dokumen</Label>
                        <Input value={formData.code} disabled className="bg-[#F7F8FA] h-11 rounded-[10px] opacity-70 font-semibold" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-name" className="font-semibold text-[#1A202C]">Nama Dokumen *</Label>
                        <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11 rounded-[10px] border-[#E2E8F0]" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-description" className="font-semibold text-[#1A202C]">Deskripsi</Label>
                        <Textarea id="edit-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="rounded-[10px] border-[#E2E8F0]" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#F7F8FA] rounded-[10px] border border-[#E2E8F0]">
                        <div className="flex flex-col">
                            <Label className="font-semibold text-[#1A202C] text-sm">Status Aktif</Label>
                            <span className="text-xs text-[#718096]">Toggle apakah tipe ini aktif</span>
                        </div>
                        <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} />
                    </div>
                </div>
            </ResponsiveModal>
        </div>
    );
}
