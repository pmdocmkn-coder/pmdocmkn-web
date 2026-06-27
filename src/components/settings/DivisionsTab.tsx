import React, { useState, useEffect } from 'react';
import { divisionApi } from '../../services/api';
import { Plus, Edit2, Trash2, Save, X, Search, Building2, CheckCircle, XCircle } from 'lucide-react';
import { hasPermission } from '../../utils/permissionUtils';

interface Division {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

export default function DivisionsTab() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', isActive: true });

  useEffect(() => {
    checkSuperAdmin();
    fetchDivisions();
  }, []);

  const checkSuperAdmin = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setIsSuperAdmin(u.roleName === 'Super Admin');
      } catch {}
    }
  };

  const fetchDivisions = async () => {
    try {
      setLoading(true);
      const result = await divisionApi.getAll({ pageSize: 100 });
      setDivisions(result.data || []);
    } catch {
      showMsg('error', 'Gagal memuat data divisi');
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
    if (!formData.code.trim() || !formData.name.trim()) {
      showMsg('error', 'Code dan nama divisi tidak boleh kosong');
      return;
    }
    try {
      if (editingId) {
        await divisionApi.update(editingId, {
          code: isSuperAdmin ? formData.code.trim().toUpperCase() : undefined,
          name: formData.name.trim(),
          isActive: formData.isActive,
        });
        showMsg('success', 'Divisi berhasil diupdate');
      } else {
        await divisionApi.create({ code: formData.code.trim().toUpperCase(), name: formData.name.trim() });
        showMsg('success', 'Divisi berhasil ditambahkan');
      }
      resetForm();
      fetchDivisions();
    } catch (err: any) {
      showMsg('error', err.response?.data?.message || err.response?.data?.data?.message || 'Gagal menyimpan divisi');
    }
  };

  const handleEdit = (div: Division) => {
    setEditingId(div.id);
    setFormData({ code: div.code, name: div.name, isActive: div.isActive });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus divisi ini?')) return;
    try {
      await divisionApi.delete(id);
      showMsg('success', 'Divisi berhasil dihapus');
      fetchDivisions();
    } catch (err: any) {
      showMsg('error', err.response?.data?.message || err.response?.data?.data?.message || 'Gagal menghapus divisi');
    }
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ code: '', name: '', isActive: true });
  };

  const filtered = divisions.filter(d =>
    d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-[15px] font-bold text-[#1A202C]">Divisions</h2>
          <p className="text-[12px] text-[#718096] mt-0.5">{divisions.length} divisi terdaftar</p>
        </div>
        {!isFormOpen && hasPermission('division.create') && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white text-[13px] font-semibold rounded-[8px] transition-colors min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Divisi</span>
          </button>
        )}
      </div>

      {/* ── Toast ── */}
      {message && (
        <div className={`px-4 py-3 rounded-[8px] text-[13px] font-medium border ${
          message.type === 'success'
            ? 'bg-[#F0FFF4] text-[#059669] border-emerald-200'
            : 'bg-red-50 text-[#DC2626] border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* ── Form ── */}
      {isFormOpen && (
        <div className="bg-[#EBF4FF] border border-blue-200 rounded-[10px] p-4">
          <h3 className="text-[14px] font-bold text-[#1B3A6B] mb-3">
            {editingId ? 'Edit Divisi' : 'Tambah Divisi Baru'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#1A202C] mb-1">
                  Kode <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., IT, HR, FIN"
                  required
                  disabled={!!editingId && !isSuperAdmin}
                  className="w-full px-3 py-2 text-[13px] border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:border-[#2B6CB0] bg-white disabled:bg-[#F7F8FA] disabled:text-[#718096] font-mono uppercase"
                />
                {editingId && !isSuperAdmin && (
                  <p className="text-[11px] text-[#718096] mt-1">Kode tidak dapat diubah</p>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#1A202C] mb-1">
                  Nama <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Information Technology"
                  required
                  className="w-full px-3 py-2 text-[13px] border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:border-[#2B6CB0] bg-white"
                />
              </div>
            </div>

            {editingId && (
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <div
                  onClick={() => setFormData(f => ({ ...f, isActive: !f.isActive }))}
                  className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${formData.isActive ? 'bg-[#2B6CB0]' : 'bg-[#E2E8F0]'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${formData.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-[13px] text-[#1A202C] font-medium">{formData.isActive ? 'Aktif' : 'Tidak Aktif'}</span>
              </label>
            )}

            <div className="flex gap-2 pt-1">
              <button type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white text-[13px] font-semibold rounded-[8px] transition-colors">
                <Save className="w-4 h-4" />
                {editingId ? 'Update' : 'Simpan'}
              </button>
              <button type="button" onClick={resetForm}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] text-[#718096] text-[13px] font-semibold rounded-[8px] hover:bg-[#F7F8FA] transition-colors">
                <X className="w-4 h-4" />
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Cari divisi..."
          className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#E2E8F0] rounded-[8px] bg-[#F7F8FA] focus:outline-none focus:border-[#2B6CB0]"
        />
      </div>

      {/* ── Division grid ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-[#718096] text-[13px]">
          {searchTerm ? 'Tidak ada divisi ditemukan' : 'Belum ada divisi'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(div => (
            <div key={div.id} className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#EBF4FF] rounded-[10px] flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-[#2B6CB0]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold text-[#1A202C] truncate">{div.name}</h3>
                    <p className="text-[11px] font-mono text-[#718096] uppercase">{div.code}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                {/* Status */}
                {div.isActive ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#059669] bg-[#F0FFF4] border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626] bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                    <XCircle className="w-3 h-3" /> Nonaktif
                  </span>
                )}

                {/* Actions */}
                <div className="flex gap-1">
                  {hasPermission('division.update') && (
                    <button onClick={() => handleEdit(div)}
                      className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-[#EBF4FF] text-[#2B6CB0] hover:bg-[#DBEAFE] transition-colors"
                      title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {hasPermission('division.delete') && (
                    <button onClick={() => handleDelete(div.id)}
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
