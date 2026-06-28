import React, { useState, useEffect } from 'react';
import { roleApi } from '../../services/api';
import { Role } from '../../types/permission';
import { Plus, Edit2, Trash2, Save, X, Search, Shield, Users, Key } from 'lucide-react';
import { hasPermission } from '../../utils/permissionUtils';

export default function RolesTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({ roleName: '', description: '' });

  useEffect(() => { fetchRoles(); }, []);

  const fetchRoles = async () => {
    try {
      const basicRoles = await roleApi.getAll();
      const detailed = await Promise.all(
        basicRoles.map(async role => {
          try {
            const d = await roleApi.getById(role.roleId);
            return { ...role, userCount: d.userCount, permissionCount: d.permissionCount };
          } catch { return role; }
        })
      );
      setRoles(detailed);
    } catch {
      showMsg('error', 'Gagal memuat data roles');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roleName.trim()) { showMsg('error', 'Nama role tidak boleh kosong'); return; }
    try {
      if (editingId) { await roleApi.update(editingId, formData); showMsg('success', 'Role berhasil diupdate'); }
      else { await roleApi.create(formData); showMsg('success', 'Role berhasil ditambahkan'); }
      resetForm();
      fetchRoles();
    } catch (err: any) { showMsg('error', err.response?.data?.message || 'Gagal menyimpan role'); }
  };

  const handleEdit = (role: Role) => {
    setEditingId(role.roleId);
    setFormData({ roleName: role.roleName, description: role.description || '' });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus role ini?')) return;
    try { await roleApi.delete(id); showMsg('success', 'Role berhasil dihapus'); fetchRoles(); }
    catch (err: any) { showMsg('error', err.response?.data?.message || 'Gagal menghapus role'); }
  };

  const resetForm = () => { setIsFormOpen(false); setEditingId(null); setFormData({ roleName: '', description: '' }); };

  const filtered = roles.filter(r =>
    r.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B6CB0]" />
    </div>
  );

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold text-[#1A202C]">Roles</h2>
          <p className="text-[12px] text-[#718096] mt-0.5">{roles.length} role terdaftar</p>
        </div>
        {!isFormOpen && hasPermission('role.create') && (
          <button onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white text-[13px] font-semibold rounded-[8px] transition-colors min-h-[40px]">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Role</span>
          </button>
        )}
      </div>

      {/* ── Toast ── */}
      {message && (
        <div className={`px-4 py-3 rounded-[8px] text-[13px] font-medium border ${
          message.type === 'success' ? 'bg-[#F0FFF4] text-[#059669] border-emerald-200' : 'bg-red-50 text-[#DC2626] border-red-200'
        }`}>{message.text}</div>
      )}

      {/* ── Form ── */}
      {isFormOpen && (
        <div className="bg-[#EBF4FF] border border-blue-200 rounded-[10px] p-4">
          <h3 className="text-[14px] font-bold text-[#1B3A6B] mb-3">
            {editingId ? 'Edit Role' : 'Tambah Role Baru'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#1A202C] mb-1">
                  Nama Role <span className="text-[#DC2626]">*</span>
                </label>
                <input type="text" value={formData.roleName}
                  onChange={e => setFormData({ ...formData, roleName: e.target.value })}
                  placeholder="e.g., Manager, Teknisi"
                  required
                  className="w-full px-3 py-2 text-[13px] border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:border-[#2B6CB0] bg-white" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#1A202C] mb-1">Deskripsi</label>
                <input type="text" value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi role (opsional)"
                  className="w-full px-3 py-2 text-[13px] border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:border-[#2B6CB0] bg-white" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white text-[13px] font-semibold rounded-[8px] transition-colors">
                <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Simpan'}
              </button>
              <button type="button" onClick={resetForm}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] text-[#718096] text-[13px] font-semibold rounded-[8px] hover:bg-[#F7F8FA] transition-colors">
                <X className="w-4 h-4" /> Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="Cari role..."
          className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#E2E8F0] rounded-[8px] bg-[#F7F8FA] focus:outline-none focus:border-[#2B6CB0]" />
      </div>

      {/* ── Roles grid ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-[#718096] text-[13px]">
          {searchTerm ? 'Tidak ada role ditemukan' : 'Belum ada role'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(role => (
            <div key={role.roleId}
              className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 hover:shadow-md transition-shadow">

              {/* Role header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-[#EBF4FF] rounded-[10px] flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-[#2B6CB0]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-bold text-[#1A202C] truncate">{role.roleName}</h3>
                  <p className="text-[12px] text-[#718096] mt-0.5 line-clamp-2">
                    {role.description || <span className="italic">Tidak ada deskripsi</span>}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-[#F7F8FA] rounded-[8px] px-3 py-2 flex items-center gap-2 border border-[#E2E8F0]">
                  <Users className="w-4 h-4 text-[#718096] flex-shrink-0" />
                  <div>
                    <p className="text-[9px] font-bold text-[#718096] uppercase tracking-wide">Users</p>
                    <p className="text-[14px] font-bold text-[#1A202C]">{role.userCount ?? 0}</p>
                  </div>
                </div>
                <div className="bg-[#F7F8FA] rounded-[8px] px-3 py-2 flex items-center gap-2 border border-[#E2E8F0]">
                  <Key className="w-4 h-4 text-[#718096] flex-shrink-0" />
                  <div>
                    <p className="text-[9px] font-bold text-[#718096] uppercase tracking-wide">Permissions</p>
                    <p className="text-[14px] font-bold text-[#1A202C]">{role.permissionCount ?? 0}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                <span className="text-[11px] text-[#718096]">
                  {role.createdAt ? new Date(role.createdAt).toLocaleDateString('id-ID') : '—'}
                </span>
                <div className="flex gap-1">
                  {hasPermission('role.update') && (
                    <button onClick={() => handleEdit(role)}
                      className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-[#EBF4FF] text-[#2B6CB0] hover:bg-[#DBEAFE] transition-colors"
                      title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {hasPermission('role.delete') && (
                    <button onClick={() => handleDelete(role.roleId)}
                      className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-red-50 text-[#DC2626] hover:bg-red-100 transition-colors"
                      title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
