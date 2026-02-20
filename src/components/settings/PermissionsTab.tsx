// components/settings/PermissionsTab.tsx - WITH GROUP SUPPORT
import React, { useState, useEffect } from 'react';
import { permissionApi } from '../../services/api';
import { Permission } from '../../types/permission';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Search,
  Tag,
} from 'lucide-react';
import { hasPermission } from '../../utils/permissionUtils';

export default function PermissionsTab() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    permissionName: '',
    description: '',
    group: '', // ✅ TAMBAHKAN GROUP
  });

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const data = await permissionApi.getAll();
      setPermissions(data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setMessage({ type: 'error', text: 'Gagal memuat data permissions' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.permissionName.trim()) {
      setMessage({ type: 'error', text: 'Nama permission tidak boleh kosong' });
      return;
    }

    try {
      if (editingId) {
        await permissionApi.update(editingId, formData);
        setMessage({ type: 'success', text: 'Permission berhasil diupdate' });
      } else {
        await permissionApi.create(formData);
        setMessage({ type: 'success', text: 'Permission berhasil ditambahkan' });
      }

      setFormData({ permissionName: '', description: '', group: '' });
      setIsAddingNew(false);
      setEditingId(null);
      fetchPermissions();

      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Gagal menyimpan permission',
      });
    }
  };

  const handleEdit = (permission: Permission) => {
    setEditingId(permission.permissionId);
    setFormData({
      permissionName: permission.permissionName,
      description: permission.description || '',
      group: permission.group || '',
    });
    setIsAddingNew(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus permission ini?')) {
      return;
    }

    try {
      await permissionApi.delete(id);
      setMessage({ type: 'success', text: 'Permission berhasil dihapus' });
      fetchPermissions();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Gagal menghapus permission',
      });
    }
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setFormData({ permissionName: '', description: '', group: '' });
  };

  // ✅ GET UNIQUE GROUPS
  const groups = [...new Set(permissions.map(p => p.group).filter(Boolean))].sort();

  const filteredPermissions = permissions.filter(
    (p) => {
      const matchesSearch = p.permissionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesGroup = !filterGroup || p.group === filterGroup;

      return matchesSearch && matchesGroup;
    }
  );

  // ✅ GROUP BY GROUP
  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    const group = perm.group || 'Uncategorized';
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

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
          <h2 className="text-xl font-bold text-gray-900">Manage Permissions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Total: {permissions.length} permissions | Groups: {groups.length}
          </p>
        </div>

        {!isAddingNew && hasPermission("role.permission.create") && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Permission
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
            }`}
        >
          {message.text}
        </div>
      )}

      {/* Add/Edit Form */}
      {isAddingNew && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Permission' : 'Add New Permission'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permission Name * <span className="text-xs text-gray-500">(e.g., inspeksi.temuan-kpc.view)</span>
                </label>
                <input
                  type="text"
                  value={formData.permissionName}
                  onChange={(e) =>
                    setFormData({ ...formData, permissionName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., module.resource.action"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group <span className="text-xs text-gray-500">(for organization)</span>
                </label>
                <input
                  type="text"
                  value={formData.group}
                  onChange={(e) =>
                    setFormData({ ...formData, group: e.target.value })
                  }
                  list="groups-list"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Inspeksi KPC"
                />
                <datalist id="groups-list">
                  {groups.map(g => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Permission description"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition inline-flex items-center"
              >
                <Save className="w-5 h-5 mr-2" />
                {editingId ? 'Update' : 'Save'}
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
      )}

      {/* Search & Filter */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search permissions..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="relative">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Groups</option>
            {groups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Permissions by Group */}
      {Object.keys(groupedPermissions).length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm || filterGroup ? 'No permissions found' : 'No permissions yet'}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPermissions).sort().map(([group, perms]) => (
            <div key={group} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  {group}
                  <span className="text-xs font-normal text-gray-500">({perms.length})</span>
                </h3>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Permission Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {perms.map((permission) => (
                    <tr key={permission.permissionId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-gray-900">
                          {permission.permissionName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {permission.description || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center space-x-2">
                          {hasPermission("role.permission.edit") && (
                            <button
                              onClick={() => handleEdit(permission)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission("role.permission.delete") && (
                            <button
                              onClick={() => handleDelete(permission.permissionId)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}