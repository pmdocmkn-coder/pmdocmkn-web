// components/settings/DivisionsTab.tsx
import React, { useState, useEffect } from "react";
import { divisionApi } from "../../services/api";
import {
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    Search,
    Building2,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { hasPermission } from "../../utils/permissionUtils";

interface Division {
    id: number;
    code: string;
    name: string;
    isActive: boolean;
}

export default function DivisionsTab() {
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        isActive: true,
    });

    useEffect(() => {
        checkSuperAdmin();
        fetchDivisions();
    }, []);

    const checkSuperAdmin = () => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setIsSuperAdmin(user.roleName === "Super Admin");
            } catch (e) {
                console.error("Error parsing user for super admin check", e);
            }
        }
    };

    const fetchDivisions = async () => {
        try {
            setLoading(true);
            const result = await divisionApi.getAll({ pageSize: 100 });
            setDivisions(result.data || []);
        } catch (error) {
            console.error("Error fetching divisions:", error);
            setMessage({ type: "error", text: "Gagal memuat data divisi" });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.code.trim() || !formData.name.trim()) {
            setMessage({
                type: "error",
                text: "Code dan nama divisi tidak boleh kosong",
            });
            return;
        }

        try {
            if (editingId) {
                await divisionApi.update(editingId, {
                    code: isSuperAdmin ? formData.code.trim().toUpperCase() : undefined,
                    name: formData.name.trim(),
                    isActive: formData.isActive,
                });
                setMessage({ type: "success", text: "Divisi berhasil diupdate" });
            } else {
                await divisionApi.create({
                    code: formData.code.trim().toUpperCase(),
                    name: formData.name.trim(),
                });
                setMessage({ type: "success", text: "Divisi berhasil ditambahkan" });
            }

            setFormData({ code: "", name: "", isActive: true });
            setIsAddingNew(false);
            setEditingId(null);
            fetchDivisions();

            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            const errMsg =
                error.response?.data?.message ||
                error.response?.data?.data?.message ||
                "Gagal menyimpan divisi";
            setMessage({ type: "error", text: errMsg });
        }
    };

    const handleEdit = (division: Division) => {
        setEditingId(division.id);
        setFormData({
            code: division.code,
            name: division.name,
            isActive: division.isActive,
        });
        setIsAddingNew(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Apakah Anda yakin ingin menghapus divisi ini?")) {
            return;
        }

        try {
            await divisionApi.delete(id);
            setMessage({ type: "success", text: "Divisi berhasil dihapus" });
            fetchDivisions();
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: "error",
                text:
                    error.response?.data?.message ||
                    error.response?.data?.data?.message ||
                    "Gagal menghapus divisi",
            });
        }
    };

    const handleCancel = () => {
        setIsAddingNew(false);
        setEditingId(null);
        setFormData({ code: "", name: "", isActive: true });
    };



    const filteredDivisions = divisions.filter(
        (d) =>
            d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Manage Divisions</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Total: {divisions.length} divisi
                    </p>
                </div>

                {!isAddingNew && hasPermission("division.create") && (
                    <button
                        onClick={() => setIsAddingNew(true)}
                        className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition inline-flex items-center"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Division
                    </button>
                )}
            </div>


            {/* Message */}
            {
                message && (
                    <div
                        className={`mb-6 p-4 rounded-lg ${message.type === "success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                    >
                        {message.text}
                    </div>
                )
            }

            {/* Add/Edit Form */}
            {
                isAddingNew && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {editingId ? "Edit Division" : "Add New Division"}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Code *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) =>
                                            setFormData({ ...formData, code: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., IT, HR, FIN"
                                        required
                                        disabled={!!editingId && !isSuperAdmin}
                                    />
                                    {editingId && !isSuperAdmin && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Code tidak dapat diubah
                                        </p>
                                    )}
                                    {editingId && isSuperAdmin && (
                                        <p className="text-xs text-blue-600 mt-1">
                                            Anda dapat mengubah Code sebagai Super Admin
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Information Technology"
                                        required
                                    />
                                </div>
                            </div>

                            {editingId && (
                                <div className="flex items-center space-x-3">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) =>
                                                setFormData({ ...formData, isActive: e.target.checked })
                                            }
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Active</span>
                                    </label>
                                </div>
                            )}

                            <div className="flex space-x-3">
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition inline-flex items-center"
                                >
                                    <Save className="w-5 h-5 mr-2" />
                                    {editingId ? "Update" : "Save"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition inline-flex items-center"
                                >
                                    <X className="w-5 h-5 mr-2" />
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )
            }

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search divisions..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Divisions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDivisions.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        {searchTerm ? "No divisions found" : "No divisions yet"}
                    </div>
                ) : (
                    filteredDivisions.map((division) => (
                        <div
                            key={division.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {division.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 font-mono">
                                            {division.code}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center mb-4">
                                {division.isActive ? (
                                    <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-full">
                                        <XCircle className="w-3 h-3 mr-1" />
                                        Inactive
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center justify-end pt-3 border-t border-gray-200">
                                <div className="flex space-x-2">
                                    {hasPermission("division.update") && (
                                        <button
                                            onClick={() => handleEdit(division)}
                                            className="text-blue-600 hover:text-blue-800 p-1"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    {hasPermission("division.delete") && (
                                        <button
                                            onClick={() => handleDelete(division.id)}
                                            className="text-red-600 hover:text-red-800 p-1"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div >
    );
}
