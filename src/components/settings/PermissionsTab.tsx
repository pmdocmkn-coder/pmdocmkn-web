import React, { useState, useEffect, useRef } from 'react';
import { permissionApi } from '../../services/api';
import { Permission } from '../../types/permission';
import { Plus, Edit2, Trash2, Save, X, Search, Tag, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { hasPermission } from '../../utils/permissionUtils';
import BottomSheet from '../common/BottomSheet';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  permissionName: string;
  description: string;
  group: string;
}

const EMPTY_FORM: FormState = { permissionName: '', description: '', group: '' };

// ─── Custom Group Picker ──────────────────────────────────────────────────────

interface GroupPickerProps {
  value: string;
  groups: string[];
  onChange: (val: string) => void;
  placeholder?: string;
}

function GroupPicker({ value, groups, onChange, placeholder = 'Semua Group' }: GroupPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const label = value || placeholder;

  const OptionList = ({ includeAll = true }: { includeAll?: boolean }) => (
    <>
      {includeAll && (
        <>
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[13px] font-medium transition-colors
              ${value === '' ? 'bg-[#EBF4FF] text-[#1B3A6B]' : 'text-[#1A202C] hover:bg-[#F7F8FA]'}`}
          >
            <span>Semua Group</span>
            {value === '' && <Check className="w-3.5 h-3.5 text-[#2B6CB0] flex-shrink-0" />}
          </button>
          <div className="h-px bg-[#E2E8F0] my-1" />
        </>
      )}
      {groups.map(g => (
        <button
          key={g}
          type="button"
          onClick={() => { onChange(g); setOpen(false); }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[13px] font-medium transition-colors
            ${value === g ? 'bg-[#EBF4FF] text-[#1B3A6B]' : 'text-[#1A202C] hover:bg-[#F7F8FA]'}`}
        >
          <span>{g}</span>
          {value === g && <Check className="w-3.5 h-3.5 text-[#2B6CB0] flex-shrink-0" />}
        </button>
      ))}
    </>
  );

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] border rounded-[8px] bg-[#F7F8FA] hover:border-[#2B6CB0] transition-colors text-left
          ${open ? 'border-[#2B6CB0] ring-1 ring-[#2B6CB0]' : 'border-[#E2E8F0]'}`}
      >
        <Tag className="w-4 h-4 text-[#718096] flex-shrink-0" />
        <span className={`flex-1 truncate ${value ? 'text-[#1A202C] font-medium' : 'text-[#718096]'}`}>
          {label}
        </span>
        <ChevronDown className={`w-4 h-4 text-[#718096] flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Desktop: dropdown panel (hidden on mobile) */}
      {open && (
        <div className="hidden md:block absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-[#E2E8F0] rounded-[10px] shadow-lg overflow-hidden">
          <div className="max-h-56 overflow-y-auto p-1">
            <OptionList includeAll={true} />
          </div>
        </div>
      )}

      {/* Mobile: BottomSheet (hidden on desktop) */}
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Pilih Group"
        size="lg"
      >
        <div className="pb-2">
          <OptionList includeAll={true} />
        </div>
      </BottomSheet>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PermissionsTab() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const canCreate = hasPermission('role.permission.create');
  const canEdit   = hasPermission('role.permission.edit');
  const canDelete = hasPermission('role.permission.delete');

  useEffect(() => { fetchPermissions(); }, []);

  // Auto-collapse ALL groups when permissions load
  useEffect(() => {
    if (permissions.length > 0) {
      const allGroups = new Set(permissions.map(p => p.group || 'Uncategorized'));
      setCollapsedGroups(allGroups);
    }
  }, [permissions.length]);

  const fetchPermissions = async () => {
    try {
      const data = await permissionApi.getAll();
      setPermissions(data);
    } catch {
      showMessage('error', 'Gagal memuat data permissions');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.permissionName.trim()) {
      showMessage('error', 'Nama permission tidak boleh kosong');
      return;
    }
    try {
      if (editingId) {
        await permissionApi.update(editingId, formData);
        showMessage('success', 'Permission berhasil diupdate');
      } else {
        await permissionApi.create(formData);
        showMessage('success', 'Permission berhasil ditambahkan');
      }
      resetForm();
      fetchPermissions();
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Gagal menyimpan permission');
    }
  };

  const handleEdit = (p: Permission) => {
    setEditingId(p.permissionId);
    setFormData({ permissionName: p.permissionName, description: p.description || '', group: p.group || '' });
    setIsFormOpen(true);
    // Scroll to form on mobile
    setTimeout(() => document.getElementById('perm-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus permission ini?')) return;
    try {
      await permissionApi.delete(id);
      showMessage('success', 'Permission berhasil dihapus');
      fetchPermissions();
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Gagal menghapus permission');
    }
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  // ─── Derived data ──────────────────────────────────────────────────────────

  const groups = [...new Set(permissions.map(p => p.group).filter(Boolean))].sort() as string[];

  const filtered = permissions.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch = p.permissionName.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q));
    const matchGroup = !filterGroup || p.group === filterGroup;
    return matchSearch && matchGroup;
  });

  const grouped = filtered.reduce((acc, p) => {
    const g = p.group || 'Uncategorized';
    if (!acc[g]) acc[g] = [];
    acc[g].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B6CB0]" />
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold text-[#1A202C]">Permissions</h2>
          <p className="text-[12px] text-[#718096] mt-0.5">
            {permissions.length} permission • {groups.length} group
          </p>
        </div>
        {canCreate && !isFormOpen && (
          <button
            onClick={() => { setIsFormOpen(true); setEditingId(null); setFormData(EMPTY_FORM); }}
            className="flex items-center gap-2 px-3 py-2 bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white text-[13px] font-semibold rounded-[8px] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah</span>
          </button>
        )}
      </div>

      {/* ── Toast message ── */}
      {message && (
        <div className={`px-4 py-3 rounded-[8px] text-[13px] font-medium border ${
          message.type === 'success'
            ? 'bg-[#F0FFF4] text-[#059669] border-emerald-200'
            : 'bg-red-50 text-[#DC2626] border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* ── Add / Edit Form ── */}
      {isFormOpen && (
        <div id="perm-form" className="bg-[#EBF4FF] border border-blue-200 rounded-[10px] p-4">
          <h3 className="text-[14px] font-bold text-[#1B3A6B] mb-3">
            {editingId ? 'Edit Permission' : 'Tambah Permission Baru'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Permission name */}
            <div>
              <label className="block text-[12px] font-semibold text-[#1A202C] mb-1">
                Permission Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                value={formData.permissionName}
                onChange={e => setFormData({ ...formData, permissionName: e.target.value })}
                placeholder="e.g., module.resource.action"
                className="w-full px-3 py-2 text-[13px] border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:border-[#2B6CB0] focus:ring-1 focus:ring-[#2B6CB0] bg-white font-mono"
                required
              />
            </div>
            {/* Group */}
            <div>
              <label className="block text-[12px] font-semibold text-[#1A202C] mb-1">Group</label>
              <GroupPicker
                value={formData.group}
                groups={groups}
                onChange={val => setFormData({ ...formData, group: val })}
                placeholder="Pilih atau ketik group..."
              />
              {/* Manual input jika group baru (tidak ada di list) */}
              <input
                type="text"
                value={formData.group}
                onChange={e => setFormData({ ...formData, group: e.target.value })}
                placeholder="Atau ketik nama group baru..."
                className="mt-2 w-full px-3 py-2 text-[13px] border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:border-[#2B6CB0] focus:ring-1 focus:ring-[#2B6CB0] bg-white"
              />
              <p className="text-[11px] text-[#718096] mt-1">Pilih dari list atau ketik nama group baru</p>
            </div>
            {/* Description */}
            <div>
              <label className="block text-[12px] font-semibold text-[#1A202C] mb-1">Deskripsi</label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi permission"
                className="w-full px-3 py-2 text-[13px] border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:border-[#2B6CB0] focus:ring-1 focus:ring-[#2B6CB0] bg-white"
              />
            </div>
            {/* Actions */}
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

      {/* ── Search + Filter ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari permission..."
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:border-[#2B6CB0] bg-[#F7F8FA]"
          />
        </div>
        <div className="relative sm:w-48">
          <GroupPicker
            value={filterGroup}
            groups={groups}
            onChange={setFilterGroup}
          />
        </div>
      </div>

      {/* ── Grouped permission list ── */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-10 text-[#718096] text-[13px]">
          {searchTerm || filterGroup ? 'Tidak ada hasil' : 'Belum ada permission'}
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).sort().map(([group, perms]) => {
            const isCollapsed = collapsedGroups.has(group);
            return (
              <div key={group} className="border border-[#E2E8F0] rounded-[10px] overflow-hidden bg-white">

                {/* Group header — tappable */}
                <button
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#F7F8FA] border-b border-[#E2E8F0] hover:bg-[#EBF4FF] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#2B6CB0] flex-shrink-0" />
                    <span className="text-[13px] font-bold text-[#1A202C]">{group}</span>
                    <span className="text-[11px] text-[#718096] font-medium bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-full">
                      {perms.length}
                    </span>
                  </div>
                  {isCollapsed
                    ? <ChevronDown className="w-4 h-4 text-[#718096]" />
                    : <ChevronUp className="w-4 h-4 text-[#718096]" />
                  }
                </button>

                {/* Items */}
                {!isCollapsed && (
                  <>
                    {/* Desktop: table */}
                    <table className="hidden sm:table w-full">
                      <thead>
                        <tr className="border-b border-[#E2E8F0]">
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-[#718096] uppercase tracking-wide w-[40%]">
                            Permission Name
                          </th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-[#718096] uppercase tracking-wide">
                            Deskripsi
                          </th>
                          {(canEdit || canDelete) && (
                            <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-[#718096] uppercase tracking-wide w-24">
                              Aksi
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {perms.map(p => (
                          <tr key={p.permissionId} className="hover:bg-[#F7F8FA] transition-colors">
                            <td className="px-4 py-3">
                              <span className="text-[13px] font-mono text-[#1A202C]">{p.permissionName}</span>
                            </td>
                            <td className="px-4 py-3 text-[13px] text-[#718096]">
                              {p.description || <span className="text-[#CBD5E0]">—</span>}
                            </td>
                            {(canEdit || canDelete) && (
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-1">
                                  {canEdit && (
                                    <button onClick={() => handleEdit(p)}
                                      className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#2B6CB0] hover:bg-[#EBF4FF] transition-colors"
                                      title="Edit">
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button onClick={() => handleDelete(p.permissionId)}
                                      className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#DC2626] hover:bg-red-50 transition-colors"
                                      title="Hapus">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Mobile: card list */}
                    <div className="sm:hidden divide-y divide-[#E2E8F0]">
                      {perms.map(p => (
                        <div key={p.permissionId} className="px-4 py-3 flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Permission name */}
                            <p className="text-[13px] font-mono font-semibold text-[#1A202C] break-all leading-snug">
                              {p.permissionName}
                            </p>
                            {/* Description — full width, no truncate */}
                            {p.description && (
                              <p className="text-[12px] text-[#718096] mt-1 leading-relaxed">
                                {p.description}
                              </p>
                            )}
                          </div>
                          {/* Action buttons — always visible, large touch targets */}
                          {(canEdit || canDelete) && (
                            <div className="flex gap-1 flex-shrink-0 mt-0.5">
                              {canEdit && (
                                <button
                                  onClick={() => handleEdit(p)}
                                  className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-[#EBF4FF] text-[#2B6CB0] active:scale-95 transition-transform"
                                  aria-label="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(p.permissionId)}
                                  className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-red-50 text-[#DC2626] active:scale-95 transition-transform"
                                  aria-label="Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
