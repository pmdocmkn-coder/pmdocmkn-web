import React, { useState, useEffect } from "react";
import { userApi, roleApi, divisionApi } from "../../services/api";
import { User } from "../../types/auth";
import { Role } from "../../types/permission";

interface DivisionItem {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}
import {
  Search,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  X,
  Trash2,
  RefreshCw,
  Clock,
  Building2,
} from "lucide-react";

import { formatDateTimeIndonesian } from "../../utils/dateUtils";
import { hasPermission } from "../../utils/permissionUtils";

import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";

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
    <div className="bg-white py-3 px-4 flex items-center justify-between">
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
            <Button key={i + 1} onClick={() => onPageChange(i + 1)} variant={currentPage === i + 1 ? "default" : "outline"} className="rounded-none font-medium text-gray-700">{i + 1}</Button>
          ))}
          <Button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} variant="outline" className="rounded-l-none">Next</Button>
        </nav>
      </div>
    </div>
  );
}

export default function UsersManagementTab() {
  const { user: currentUser } = useAuth(); // Ambil user yang sedang login
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [divisions, setDivisions] = useState<DivisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData, divisionsData] = await Promise.all([
        userApi.getAll(),
        roleApi.getAll(),
        divisionApi.getAll({ pageSize: 100 }).then((r) => r.data || []).catch(() => []),
      ]);

      console.log("📊 Users data loaded:", usersData);

      setUsers(usersData);
      setRoles(rolesData);
      setDivisions(divisionsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage({ type: "error", text: "Gagal memuat data users" });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setMessage(null);

      const [usersData, rolesData, divisionsData] = await Promise.all([
        userApi.getAll(),
        roleApi.getAll(),
        divisionApi.getAll({ pageSize: 100 }).then((r) => r.data || []).catch(() => []),
      ]);

      setUsers(usersData);
      setRoles(rolesData);
      setDivisions(divisionsData);

      setMessage({ type: "success", text: "Data berhasil diperbarui" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setMessage({ type: "error", text: "Gagal memperbarui data" });
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh setiap 30 detik
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleActivate = async (userId: number) => {
    if (!confirm("Aktifkan user ini?")) {
      return;
    }

    try {
      await userApi.activateUser(userId);
      setMessage({ type: "success", text: "User berhasil diaktifkan" });
      await fetchData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Gagal mengaktifkan user",
      });
    }
  };

  const handleDeactivate = async (userId: number) => {
    if (!confirm("Nonaktifkan user ini?")) {
      return;
    }

    try {
      await userApi.deactivateUser(userId);
      setMessage({ type: "success", text: "User berhasil dinonaktifkan" });
      await fetchData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Gagal menonaktifkan user",
      });
    }
  };

  const handleChangeRole = async (userId: number, newRoleId: number) => {
    if (!confirm("Ubah role user ini?")) {
      return;
    }

    try {
      await userApi.updateRole(userId, newRoleId);
      setMessage({ type: "success", text: "Role user berhasil diubah" });
      await fetchData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Gagal mengubah role",
      });
    }
  };

  const handleChangeDivision = async (userId: number, newDivision: string) => {
    try {
      await userApi.updateUser(userId, { division: newDivision || undefined });
      setMessage({ type: "success", text: "Divisi user berhasil diubah" });
      await fetchData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Gagal mengubah divisi",
      });
    }
  };

  const handleDeleteUser = async (userId: number, fullName: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus user "${fullName}"? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      return;
    }

    try {
      await userApi.deleteUser(userId);
      setMessage({
        type: "success",
        text: `User "${fullName}" berhasil dihapus`,
      });
      await fetchData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Gagal menghapus user",
      });
    }
  };

  const handleViewDetail = async (userId: number) => {
    try {
      const userDetail = await userApi.getById(userId);
      console.log("👤 User detail loaded:", userDetail);
      setSelectedUser(userDetail);
      setIsDetailModalOpen(true);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Gagal memuat detail user",
      });
    }
  };

  const getUserInitials = (fullName: string) => {
    const names = fullName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && user.isActive) ||
      (filterStatus === "inactive" && !user.isActive);

    return matchesSearch && matchesStatus;
  });

  const totalCount = filteredUsers.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
  };

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Kelola aktivasi dan role pengguna
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 transition-all"
          title="Refresh data users"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Total Users</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Active Users</p>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {stats.active}
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-600 font-medium">Inactive Users</p>
          <p className="text-2xl font-bold text-orange-900 mt-1">
            {stats.inactive}
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start ${message.type === "success"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
            }`}
        >
          <p className="flex-1">{message.text}</p>
          <button
            onClick={() => setMessage(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or username..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as "all" | "active" | "inactive")
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Division
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Last Login
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => {
                const isSuperAdminTarget = user.roleId === 1;
                const isCurrentUserSuperAdmin = currentUser?.roleId === 1;
                const disableActions = isSuperAdminTarget && !isCurrentUserSuperAdmin;

                return (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        {user.photoUrl ? (
                          <img
                            src={user.photoUrl}
                            alt={user.fullName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm border-2 border-gray-200">
                            {getUserInitials(user.fullName)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.fullName}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={user.roleId}
                        onChange={(e) =>
                          handleChangeRole(user.userId, parseInt(e.target.value))
                        }
                        disabled={!hasPermission("user.update") || disableActions}
                        className={`text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${(!hasPermission("user.update") || disableActions) ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                      >
                        {roles
                          .filter(role => {
                            // Sembunyikan Role "Super Admin" (ID 1) jika user yang login BUKAN Super Admin
                            if (currentUser?.roleId !== 1 && role.roleId === 1) return false;
                            return true;
                          })
                          .map((role) => (
                            <option key={role.roleId} value={role.roleId}>
                              {role.roleName}
                            </option>
                          ))}
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={user.division || ""}
                        onChange={(e) =>
                          handleChangeDivision(user.userId, e.target.value)
                        }
                        disabled={!hasPermission("division.update") || disableActions}
                        className={`text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${(!hasPermission("division.update") || disableActions) ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                      >
                        <option value="">— Belum ada —</option>
                        {divisions.filter(d => d.isActive).map((div) => (
                          <option key={div.id} value={div.name}>
                            {div.code} - {div.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {user.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* ✅ PERBAIKAN: Gunakan formatDateTimeIndonesian */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 whitespace-nowrap">
                        <Clock className="w-4 h-4 flex-shrink-0 text-gray-400" />
                        <span>{formatDateTimeIndonesian(user.lastLogin)}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleViewDetail(user.userId)}
                          className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>

                        {hasPermission("user.update") && !disableActions && (
                          user.isActive ? (
                            <button
                              onClick={() => handleDeactivate(user.userId)}
                              className="text-orange-600 hover:text-orange-800 p-1 transition-colors"
                              title="Deactivate User"
                            >
                              <UserX className="w-5 h-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(user.userId)}
                              className="text-green-600 hover:text-green-800 p-1 transition-colors"
                              title="Activate User"
                            >
                              <UserCheck className="w-5 h-5" />
                            </button>
                          )
                        )}

                        {hasPermission("user.delete") && !disableActions && (
                          <button
                            onClick={() =>
                              handleDeleteUser(user.userId, user.fullName)
                            }
                            className="text-red-600 hover:text-red-800 p-1 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="border-t border-gray-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* User Detail Modal */}
      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-xl font-bold text-gray-900">User Details</h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Profile Section */}
              <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-200">
                {selectedUser.photoUrl ? (
                  <img
                    src={selectedUser.photoUrl}
                    alt={selectedUser.fullName}
                    className="w-20 h-20 rounded-full object-cover border-4 border-blue-500 shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-blue-500 shadow-lg">
                    {getUserInitials(selectedUser.fullName)}
                  </div>
                )}
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">
                    {selectedUser.fullName}
                  </h4>
                  <p className="text-gray-600">@{selectedUser.username}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {selectedUser.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Email
                  </label>
                  <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-gray-900 text-sm">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Role
                  </label>
                  <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                    <Shield className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-gray-900 text-sm font-semibold">
                      {selectedUser.roleName}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Division
                  </label>
                  <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                    <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-gray-900 text-sm font-semibold">
                      {selectedUser.division || "Belum ditentukan"}
                    </p>
                  </div>
                </div>

                {/* ✅ PERBAIKAN: Created At dengan timezone WITA */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Created At
                  </label>
                  <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-gray-900 text-sm">
                      {formatDateTimeIndonesian(
                        selectedUser.createdAt?.toString()
                      )}
                    </p>
                  </div>
                </div>

                {/* ✅ PERBAIKAN: Last Login dengan timezone WITA */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Last Login
                  </label>
                  <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <p className="text-gray-900 text-sm font-medium">
                      {formatDateTimeIndonesian(
                        selectedUser.lastLogin?.toString()
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              {selectedUser.permissions &&
                selectedUser.permissions.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      Permissions ({selectedUser.permissions.length})
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.permissions.map((permission, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full border border-blue-200"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
