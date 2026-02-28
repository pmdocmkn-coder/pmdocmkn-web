import React, { useState, useEffect } from "react";
import { hasPermission } from "../utils/permissionUtils";
import { companyApi } from "../services/letterNumberApi";
import { CompanyList, CompanyCreate, CompanyUpdate } from "../types/letterNumber";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, Search, Edit, Trash2, CheckCircle, XCircle, Home, ChevronLeft } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

export default function CompanyPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [companies, setCompanies] = useState<CompanyList[]>([]);
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
    const [selectedCompany, setSelectedCompany] = useState<CompanyList | null>(null);

    // Form states
    const [formData, setFormData] = useState<CompanyCreate & { isActive?: boolean }>({
        code: "",
        name: "",
        address: "",
        isActive: true,
    });

    useEffect(() => {
        loadCompanies();
    }, [currentPage, searchTerm, showInactiveOnly]);

    const loadCompanies = async () => {
        try {
            setLoading(true);
            const result = await companyApi.getAll({
                page: currentPage,
                pageSize,
                search: searchTerm || undefined,
                isActive: showInactiveOnly ? false : undefined,
            });

            setCompanies(result.data);
            setTotalCount(result.meta.pagination.totalCount);
            setTotalPages(result.meta.pagination.totalPages);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load companies",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            await companyApi.create(formData);
            toast({
                title: "Success",
                description: "Company created successfully",
            });
            setIsCreateDialogOpen(false);
            resetForm();
            loadCompanies();
        } catch (error: any) {
            const errorData = error.response?.data;
            const message = errorData?.message || errorData?.data?.message || error.message || "Failed to create company";

            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        }
    };

    const handleUpdate = async () => {
        if (!selectedCompany) return;

        try {
            const updateData: CompanyUpdate = {
                name: formData.name,
                address: formData.address,
                isActive: formData.isActive ?? true,
            };

            await companyApi.update(selectedCompany.id, updateData);
            toast({
                title: "Success",
                description: "Company updated successfully",
            });
            setIsEditDialogOpen(false);
            resetForm();
            loadCompanies();
        } catch (error: any) {
            const errorData = error.response?.data;
            const message = errorData?.message || errorData?.data?.message || error.message || "Failed to update company";

            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this company?")) return;

        try {
            await companyApi.delete(id);
            toast({
                title: "Success",
                description: "Company deleted successfully",
            });
            loadCompanies();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to delete company",
                variant: "destructive",
            });
        }
    };

    const openEditDialog = (company: CompanyList) => {
        setSelectedCompany(company);
        setFormData({
            code: company.code,
            name: company.name,
            address: "",
            isActive: company.isActive,
        });
        setIsEditDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({
            code: "",
            name: "",
            address: "",
            isActive: true,
        });
        setSelectedCompany(null);
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#f7f6f8] text-slate-900">
            {/* ====== MOBILE INTEGRATED HEADER ====== */}
            <div className="md:hidden pt-4 pb-4 mb-4 px-4 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] rounded-b-3xl">
                <div className="flex items-start justify-between pb-4">
                    <div>
                        <div className="flex items-center gap-1.5 mb-1 opacity-80">
                            <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">Master Data</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                            Company
                        </h1>
                    </div>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors shrink-0"
                    >
                        <Home className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Default Header for Desktop */}
            <header className="hidden md:flex sticky top-0 z-10 items-center bg-[#f7f6f8] p-4 border-b border-[#9311d4]/10 justify-between">
                <div className="flex-1">
                    <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight">Company</h2>
                    <p className="text-xs text-slate-500 font-medium">Manage master companies</p>
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
                            placeholder="Search companies by name or code..."
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
                        <p className="text-slate-500 text-xs font-medium">Filter to see only deactivated companies</p>
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
                        <span className="truncate">Add Company</span>
                    </button>
                </div>
            )}

            {/* Company Cards List */}
            <div className="flex flex-col gap-3 p-4 pb-24">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9311d4]"></div>
                    </div>
                ) : companies.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-[#9311d4]/10 shadow-sm font-medium">
                        No companies found matching your criteria.
                    </div>
                ) : (
                    companies.map((company) => (
                        <div key={company.id} className="flex flex-col gap-3 rounded-xl border border-[#9311d4]/10 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9311d4] bg-[#9311d4]/10 px-2.5 py-1 rounded-full w-fit">
                                        CODE: {company.code}
                                    </span>
                                    <h3 className="text-slate-900 font-bold text-base leading-tight mt-1">{company.name}</h3>
                                </div>
                                <div className="flex gap-1 ml-2">
                                    {hasPermission('letter.update') && (
                                        <button
                                            onClick={() => openEditDialog(company)}
                                            className="p-2 text-slate-400 hover:text-[#9311d4] hover:bg-slate-50 rounded-lg transition-colors"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                    )}
                                    {hasPermission('letter.delete') && (
                                        <button
                                            onClick={() => handleDelete(company.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${company.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                    <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                        {company.isActive ? 'Active Status' : 'Inactive Status'}
                                    </span>
                                </div>
                                {company.isActive ? (
                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-lg tracking-wider">ACTIVE</span>
                                ) : (
                                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-lg tracking-wider">INACTIVE</span>
                                )}
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
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-[#9311d4] text-xl font-bold">Add New Company</DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Create a new company to be used in letter numbering.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="code" className="font-bold text-slate-700">Company Code *</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="e.g., KPC"
                                maxLength={50}
                                className="h-11 rounded-xl border-slate-200 focus-visible:ring-[#9311d4]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name" className="font-bold text-slate-700">Company Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., PT. Kaltim Prima Coal"
                                className="h-11 rounded-xl border-slate-200 focus-visible:ring-[#9311d4]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address" className="font-bold text-slate-700">Address (Optional)</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Company address"
                                className="h-11 rounded-xl border-slate-200 focus-visible:ring-[#9311d4]"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="rounded-xl h-11 font-bold text-slate-600 border-slate-200">
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} className="rounded-xl h-11 bg-[#9311d4] hover:bg-[#9311d4]/90 text-white font-bold px-6">
                            Create Company
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-[#9311d4] text-xl font-bold">Edit Company</DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Update existing company information.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-700">Company Code</Label>
                            <Input value={formData.code} disabled className="bg-slate-100 h-11 rounded-xl opacity-70 font-semibold" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-name" className="font-bold text-slate-700">Company Name *</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-11 rounded-xl border-slate-200 focus-visible:ring-[#9311d4]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-address" className="font-bold text-slate-700">Address</Label>
                            <Input
                                id="edit-address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="h-11 rounded-xl border-slate-200 focus-visible:ring-[#9311d4]"
                            />
                        </div>

                        <div className="flex items-center justify-between mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex flex-col">
                                <Label className="font-bold text-slate-900 text-sm">Active Status</Label>
                                <span className="text-xs text-slate-500">Toggle whether this company can be used</span>
                            </div>
                            <Switch
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                className="data-[state=checked]:bg-[#9311d4]"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl h-11 font-bold text-slate-600 border-slate-200">
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} className="rounded-xl h-11 bg-[#9311d4] hover:bg-[#9311d4]/90 text-white font-bold px-6">
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
