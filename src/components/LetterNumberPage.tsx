import React, { useState, useEffect } from "react";
import { letterNumberApi, companyApi, documentTypeApi } from "../services/letterNumberApi";
import {
    LetterNumberList,
    LetterNumberCreate,
    LetterNumberUpdate,
    LetterStatus,
    LetterStatusLabels,
    LetterStatusColors,
    CompanyList,
    DocumentTypeList,
} from "../types/letterNumber";
import { useToast } from "../hooks/use-toast";
import {
    FileText,
    Plus,
    Search,
    Filter,
    Download,
    Edit,
    Trash2,
    Eye,
    Calendar,
    Building2,
    FileType,
    User,
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

export default function LetterNumberPage() {
    const { toast } = useToast();
    const [letters, setLetters] = useState<LetterNumberList[]>([]);
    const [companies, setCompanies] = useState<CompanyList[]>([]);
    const [documentTypes, setDocumentTypes] = useState<DocumentTypeList[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCompany, setSelectedCompany] = useState<number | undefined>();
    const [selectedDocType, setSelectedDocType] = useState<number | undefined>();
    const [selectedStatus, setSelectedStatus] = useState<number | undefined>();
    const [isCreating, setIsCreating] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Dialog states
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [selectedLetter, setSelectedLetter] = useState<LetterNumberList | null>(null);

    // Form states
    const [formData, setFormData] = useState<LetterNumberCreate>({
        companyId: 0,
        documentTypeId: 0,
        letterDate: new Date().toISOString().split("T")[0],
        subject: "",
        recipient: "",
        attachmentUrl: "",
        status: LetterStatus.Draft,
    });

    useEffect(() => {
        loadLetters();
        loadCompanies();
        loadDocumentTypes();
    }, [currentPage, searchTerm, selectedCompany, selectedDocType, selectedStatus]);

    const loadLetters = async () => {
        try {
            setLoading(true);
            const result = await letterNumberApi.getAll({
                page: currentPage,
                pageSize,
                search: searchTerm || undefined,
                companyId: selectedCompany,
                documentTypeId: selectedDocType,
                status: selectedStatus,
            });

            setLetters(result.data || []);
            setTotalCount(result.meta?.pagination?.totalCount || 0);
            setTotalPages(result.meta?.pagination?.totalPages || 0);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load letter numbers",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const loadCompanies = async () => {
        try {
            const result = await companyApi.getAll({ pageSize: 100, isActive: true });
            setCompanies(result.data);
        } catch (error) {
            console.error("Failed to load companies:", error);
        }
    };

    const loadDocumentTypes = async () => {
        try {
            const result = await documentTypeApi.getAll({ pageSize: 100, isActive: true });
            setDocumentTypes(result.data);
        } catch (error) {
            console.error("Failed to load document types:", error);
        }
    };

    const handleCreate = async () => {
        if (!formData.companyId || formData.companyId <= 0) {
            toast({
                title: "Validation Error",
                description: "Please select a company",
                variant: "destructive",
            });
            return;
        }

        if (!formData.documentTypeId || formData.documentTypeId <= 0) {
            toast({
                title: "Validation Error",
                description: "Please select a document type",
                variant: "destructive",
            });
            return;
        }

        if (!formData.subject.trim()) {
            toast({
                title: "Validation Error",
                description: "Subject is required",
                variant: "destructive",
            });
            return;
        }

        if (!formData.recipient.trim()) {
            toast({
                title: "Validation Error",
                description: "Recipient is required",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsCreating(true);
            await letterNumberApi.create(formData);
            toast({
                title: "Success",
                description: "Letter number generated successfully",
            });
            setIsCreateDialogOpen(false);
            resetForm();
            loadLetters();
        } catch (error: any) {
            console.error("Create error:", error);
            const errorData = error.response?.data;
            const message = errorData?.message || errorData?.data?.message || (typeof errorData === 'string' ? errorData : null) || error.message || "Failed to create letter number";

            toast({
                title: "Error Generating Letter Number",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedLetter) return;

        try {
            const updateData: LetterNumberUpdate = {
                subject: formData.subject,
                recipient: formData.recipient,
                attachmentUrl: formData.attachmentUrl,
                status: formData.status,
            };

            await letterNumberApi.update(selectedLetter.id, updateData);
            toast({
                title: "Success",
                description: "Letter number updated successfully",
            });
            setIsEditDialogOpen(false);
            resetForm();
            loadLetters();
        } catch (error: any) {
            const errorData = error.response?.data;
            const message = errorData?.message || errorData?.data?.message || error.message || "Failed to update letter number";

            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this letter number?")) return;

        try {
            await letterNumberApi.delete(id);
            toast({
                title: "Success",
                description: "Letter number deleted successfully",
            });
            loadLetters();
        } catch (error: any) {
            const errorData = error.response?.data;
            const message = errorData?.message || errorData?.data?.message || error.message || "Failed to delete letter number";

            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        }
    };

    const openEditDialog = (letter: LetterNumberList) => {
        setSelectedLetter(letter);
        setFormData({
            companyId: 0,
            documentTypeId: 0,
            letterDate: "",
            subject: letter.subject,
            recipient: letter.recipient,
            attachmentUrl: "",
            status: LetterStatus[letter.status as keyof typeof LetterStatus],
        });
        setIsEditDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({
            companyId: 0,
            documentTypeId: 0,
            letterDate: new Date().toISOString().split("T")[0],
            subject: "",
            recipient: "",
            attachmentUrl: "",
            status: LetterStatus.Draft,
        });
        setSelectedLetter(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                        <FileText className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Letter Numbering</h1>
                        <p className="text-sm text-gray-500">Manage your letter numbers</p>
                    </div>
                </div>
            </div>

            {/* Filters and Actions */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by number, subject, or recipient..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Company Filter */}
                    <Select
                        value={selectedCompany?.toString() || "all"}
                        onValueChange={(value) => setSelectedCompany(value === "all" ? undefined : parseInt(value))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All Companies" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Companies</SelectItem>
                            {companies.map((company) => (
                                <SelectItem key={company.id} value={company.id.toString()}>
                                    {company.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Document Type Filter */}
                    <Select
                        value={selectedDocType?.toString() || "all"}
                        onValueChange={(value) => setSelectedDocType(value === "all" ? undefined : parseInt(value))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {documentTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                    {type.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Create Button */}
                    <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create New
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Number
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Recipient
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Company
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created By
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : letters.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                        No letter numbers found
                                    </td>
                                </tr>
                            ) : (
                                letters.map((letter) => (
                                    <tr key={letter.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{letter.formattedNumber}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {new Date(letter.letterDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">{letter.subject}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500 max-w-xs truncate">{letter.recipient}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{letter.companyCode}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{letter.documentTypeCode}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${letter.status && (LetterStatusColors as any)[LetterStatus[letter.status as any]]
                                                    ? (LetterStatusColors as any)[LetterStatus[letter.status as any]]
                                                    : (LetterStatusColors as any)[letter.status] || "bg-gray-100 text-gray-800"
                                                    }`}
                                            >
                                                {letter.status || "Unknown"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{letter.createdByName || "-"}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditDialog(letter)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(letter.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <Button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                variant="outline"
                            >
                                Previous
                            </Button>
                            <Button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                variant="outline"
                            >
                                Next
                            </Button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                                    <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of{" "}
                                    <span className="font-medium">{totalCount}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <Button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        variant="outline"
                                        className="rounded-r-none"
                                    >
                                        Previous
                                    </Button>
                                    {Number.isFinite(totalPages) && totalPages > 0 && [...Array(totalPages)].map((_, i) => (
                                        <Button
                                            key={i + 1}
                                            onClick={() => setCurrentPage(i + 1)}
                                            variant={currentPage === i + 1 ? "default" : "outline"}
                                            className="rounded-none font-medium"
                                        >
                                            {i + 1}
                                        </Button>
                                    ))}
                                    <Button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        variant="outline"
                                        className="rounded-l-none"
                                    >
                                        Next
                                    </Button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Create New Letter Number</DialogTitle>
                        <DialogDescription>Fill in the details to generate a new letter number.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="company">Company *</Label>
                                <Select
                                    value={formData.companyId.toString()}
                                    onValueChange={(value) => setFormData({ ...formData, companyId: parseInt(value) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select company" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map((company) => (
                                            <SelectItem key={company.id} value={company.id.toString()}>
                                                {company.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="documentType">Document Type *</Label>
                                <Select
                                    value={formData.documentTypeId.toString()}
                                    onValueChange={(value) => setFormData({ ...formData, documentTypeId: parseInt(value) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {documentTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id.toString()}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="letterDate">Letter Date *</Label>
                            <Input
                                id="letterDate"
                                type="date"
                                value={formData.letterDate}
                                onChange={(e) => setFormData({ ...formData, letterDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject *</Label>
                            <Input
                                id="subject"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="Enter letter subject"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="recipient">Recipient *</Label>
                            <Input
                                id="recipient"
                                value={formData.recipient}
                                onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                                placeholder="Enter recipient name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="attachmentUrl">Attachment URL</Label>
                            <Input
                                id="attachmentUrl"
                                value={formData.attachmentUrl}
                                onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
                                placeholder="https://example.com/file.pdf"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status.toString()}
                                onValueChange={(value) => setFormData({ ...formData, status: parseInt(value) })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Draft</SelectItem>
                                    <SelectItem value="1">Sent</SelectItem>
                                    <SelectItem value="2">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            className="bg-indigo-600 hover:bg-indigo-700"
                            disabled={isCreating}
                        >
                            {isCreating ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creating...
                                </>
                            ) : (
                                "Create Letter Number"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Letter Number</DialogTitle>
                        <DialogDescription>Update the letter details below.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-subject">Subject *</Label>
                            <Input
                                id="edit-subject"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-recipient">Recipient *</Label>
                            <Input
                                id="edit-recipient"
                                value={formData.recipient}
                                onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-attachmentUrl">Attachment URL</Label>
                            <Input
                                id="edit-attachmentUrl"
                                value={formData.attachmentUrl}
                                onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-status">Status</Label>
                            <Select
                                value={formData.status.toString()}
                                onValueChange={(value) => setFormData({ ...formData, status: parseInt(value) })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Draft</SelectItem>
                                    <SelectItem value="1">Sent</SelectItem>
                                    <SelectItem value="2">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} className="bg-indigo-600 hover:bg-indigo-700">
                            Update
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
