import React, { useState, useEffect } from "react";
import { companyApi } from "../services/letterNumberApi";
import { CompanyList, CompanyCreate, CompanyUpdate } from "../types/letterNumber";
import { useToast } from "../hooks/use-toast";
import { Building2, Plus, Search, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
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
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create company",
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
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update company",
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
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-blue-100 rounded-lg">
                        <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Company Management</h1>
                        <p className="text-sm text-gray-500">Manage companies for letter numbering</p>
                    </div>
                </div>
            </div>

            {/* Filters and Actions */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search companies..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={showInactiveOnly}
                                onCheckedChange={setShowInactiveOnly}
                            />
                            <Label>Show Inactive Only</Label>
                        </div>
                        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Company
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Code
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : companies.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No companies found
                                    </td>
                                </tr>
                            ) : (
                                companies.map((company) => (
                                    <tr key={company.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{company.code}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{company.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {company.isActive ? (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    <XCircle className="h-3 w-3 mr-1" />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => openEditDialog(company)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(company.id)}
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
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add New Company</DialogTitle>
                        <DialogDescription>Create a new company for letter numbering.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Company Code *</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="e.g., KPC"
                                maxLength={50}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Company Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., PT. Kaltim Prima Coal"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Company address"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                            Create Company
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Company</DialogTitle>
                        <DialogDescription>Update company information.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Company Code</Label>
                            <Input value={formData.code} disabled className="bg-gray-100" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Company Name *</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-address">Address</Label>
                            <Input
                                id="edit-address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                            <Label>Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700">
                            Update
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
