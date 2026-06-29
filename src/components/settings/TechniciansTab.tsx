import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Edit2, Trash2, CheckCircle, XCircle,
  Link2, User, Search, Check, Building2, ChevronDown, X,
} from 'lucide-react';
import { workshopTechnicianApi, type WorkshopTechnicianDto } from '../../services/workshopTechnicianApi';
import { api } from '../../services/api';
import { useToast } from '../../hooks/use-toast';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';

interface UserLookupItem {
  id: number;
  name: string;
  username: string;
  roleName?: string | null;
  division?: string | null;
}

const NO_LINK_ID = -1;

// ─── Reusable inline user picker ─────────────────────────────────────────────
interface UserPickerProps {
  selectedId: number | null;
  users: UserLookupItem[];
  onChange: (id: number | null) => void;
  placeholder?: string;
}

function UserPicker({ selectedId, users, onChange, placeholder = '— Tidak dilink ke akun —' }: UserPickerProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selectedUser = users.find(u => u.id === selectedId);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = users.filter(u =>
    !q || u.name.toLowerCase().includes(q.toLowerCase()) ||
    u.username.toLowerCase().includes(q.toLowerCase()) ||
    (u.division ?? '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-[8px] bg-white text-[13px] transition-colors text-left ${open ? 'border-[#2B6CB0] ring-1 ring-[#2B6CB0]' : 'border-[#E2E8F0] hover:border-[#2B6CB0]'}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedUser ? (
            <>
              <User className="w-3.5 h-3.5 text-[#2B6CB0] flex-shrink-0" />
              <span className="font-medium text-[#1A202C] truncate">{selectedUser.name}</span>
              {selectedUser.division && <span className="text-[11px] text-[#718096] flex-shrink-0">· {selectedUser.division}</span>}
            </>
          ) : (
            <span className="text-[#A0AEC0] italic">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedId && (
            <span onClick={e => { e.stopPropagation(); onChange(null); }}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-[#F7F8FA] text-[#718096] cursor-pointer">
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-[#718096] transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-[10px] shadow-xl z-50 overflow-hidden"
          style={{ maxHeight: 260 }}>
          {/* Search */}
          <div className="p-2 border-b border-[#F0F0F0]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#718096]" />
              <input autoFocus type="text" value={q} onChange={e => setQ(e.target.value)}
                placeholder="Cari nama atau username..."
                className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-[#E2E8F0] rounded-[6px] bg-[#F7F8FA] focus:outline-none focus:border-[#2B6CB0]" />
            </div>
          </div>
          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
            {/* No link option */}
            <button type="button" onClick={() => { onChange(null); setOpen(false); setQ(''); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] hover:bg-[#F7F8FA] transition-colors text-left ${!selectedId ? 'bg-[#EBF4FF]' : ''}`}>
              <span className="text-[#A0AEC0] italic">{placeholder}</span>
              {!selectedId && <Check className="w-3.5 h-3.5 text-[#2B6CB0]" />}
            </button>
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-[#718096]">Tidak ditemukan</div>
            ) : filtered.map(u => (
              <button type="button" key={u.id} onClick={() => { onChange(u.id); setOpen(false); setQ(''); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] hover:bg-[#F7F8FA] transition-colors text-left gap-2 ${selectedId === u.id ? 'bg-[#EBF4FF]' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className={`truncate ${selectedId === u.id ? 'font-semibold text-[#1B3A6B]' : 'text-[#1A202C]'}`}>{u.name}</p>
                  <p className="text-[11px] text-[#718096] truncate">
                    @{u.username}
                    {u.division ? ` · ${u.division}` : ''}
                    {u.roleName ? ` · ${u.roleName}` : ''}
                  </p>
                </div>
                {selectedId === u.id && <Check className="w-3.5 h-3.5 text-[#2B6CB0] flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#059669]' : 'bg-[#CBD5E0]'}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${checked ? 'left-5' : 'left-1'}`} />
    </button>
  );
}

// ─── Confirm Delete dialog (inline, no portal issues) ─────────────────────────
function DeleteConfirm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[14px] shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h3 className="text-[16px] font-bold text-[#1A202C]">Hapus Teknisi</h3>
        <p className="text-[14px] text-[#718096]">
          Yakin ingin menghapus <span className="font-semibold text-[#1A202C]">{name}</span>?
          Data riwayat perbaikan tidak akan berubah.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 border border-[#E2E8F0] rounded-[10px] text-[14px] font-semibold text-[#718096] hover:bg-[#F7F8FA]">Batal</button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 bg-[#DC2626] hover:bg-red-700 text-white rounded-[10px] text-[14px] font-semibold transition-colors">Hapus</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main TechniciansTab ──────────────────────────────────────────────────────
export default function TechniciansTab() {
  const { toast } = useToast();
  const [technicians, setTechnicians] = useState<WorkshopTechnicianDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [allUsers, setAllUsers] = useState<UserLookupItem[]>([]);

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createUserId, setCreateUserId] = useState<number | null>(null);
  const [createActive, setCreateActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editActive, setEditActive] = useState(true);

  // Delete
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await workshopTechnicianApi.getAll();
      setTechnicians(res.data.data);
    } catch (e: any) {
      toast({ title: 'Gagal memuat data', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get<{ data: UserLookupItem[] }>('/api/users/lookup');
      setAllUsers(res.data?.data ?? []);
    } catch { setAllUsers([]); }
  };

  useEffect(() => { loadData(); loadUsers(); }, []);

  const userById = (id?: number | null) => allUsers.find(u => u.id === id);

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setSaving(true);
    try {
      await workshopTechnicianApi.create({ name: createName.trim(), isActive: createActive, userId: createUserId });
      toast({ title: 'Teknisi berhasil ditambahkan' });
      setShowCreate(false); setCreateName(''); setCreateUserId(null); setCreateActive(true);
      loadData();
    } catch (e: any) {
      toast({ title: 'Gagal', description: e.response?.data?.message || e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await workshopTechnicianApi.update(id, { name: editName.trim(), isActive: editActive, userId: editUserId });
      toast({ title: 'Teknisi berhasil diupdate' });
      setEditingId(null); loadData();
    } catch (e: any) {
      toast({ title: 'Gagal', description: e.response?.data?.message || e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await workshopTechnicianApi.delete(id);
      toast({ title: 'Teknisi dihapus' });
      setDeletingId(null); loadData();
    } catch (e: any) {
      toast({ title: 'Gagal hapus', description: e.response?.data?.message || e.message, variant: 'destructive' });
    }
  };

  const filtered = technicians.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    const matchActive = filterActive === 'all' || (filterActive === 'active' ? t.isActive : !t.isActive);
    return matchSearch && matchActive;
  });

  const stats = {
    total: technicians.length,
    active: technicians.filter(t => t.isActive).length,
    inactive: technicians.filter(t => !t.isActive).length,
    linked: technicians.filter(t => t.userId).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold text-[#1A202C]">Master Teknisi Workshop</h2>
          <p className="text-[12px] text-[#718096] mt-0.5">Kelola daftar teknisi fisik yang bekerja di workshop radio</p>
        </div>
        <button onClick={() => { setShowCreate(true); setEditingId(null); }}
          className="flex items-center gap-2 px-3 py-2 bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white text-[13px] font-semibold rounded-[8px] transition-colors min-h-[40px]">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah Teknisi</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, cls: 'bg-[#EBF4FF] text-[#1B3A6B] border-blue-100' },
          { label: 'Aktif', value: stats.active, cls: 'bg-[#F0FFF4] text-[#059669] border-emerald-100' },
          { label: 'Nonaktif', value: stats.inactive, cls: 'bg-[#FFFBEB] text-[#F59E0B] border-amber-100' },
          { label: 'Linked Akun', value: stats.linked, cls: 'bg-[#FFF0EC] text-[#D94F2B] border-orange-100' },
        ].map(s => (
          <div key={s.label} className={`${s.cls} border rounded-[10px] p-3 text-center`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama teknisi..."
            className="w-full pl-9 pr-3 py-2.5 text-[13px] border border-[#E2E8F0] rounded-[8px] bg-[#F7F8FA] focus:outline-none focus:border-[#2B6CB0] min-h-[40px]" />
        </div>
        <Select value={filterActive} onValueChange={v => setFilterActive(v as any)}>
          <SelectTrigger className="sm:w-44 h-10 border-[#E2E8F0] bg-[#F7F8FA] text-[13px] focus:ring-[#2B6CB0] focus:border-[#2B6CB0] rounded-[8px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif Saja</SelectItem>
            <SelectItem value="inactive">Nonaktif Saja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-[#F7F8FA] border border-[#E2E8F0] rounded-[12px] p-4 space-y-3">
          <p className="text-[12px] font-bold text-[#1B3A6B] uppercase tracking-wide">Tambah Teknisi Baru</p>
          <div>
            <label className="text-[12px] font-semibold text-[#718096] mb-1 block">Nama Teknisi *</label>
            <input autoFocus value={createName} onChange={e => setCreateName(e.target.value)}
              placeholder="Contoh: Jacky Marlika" onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="w-full px-3 py-2.5 text-[13px] border border-[#E2E8F0] rounded-[8px] bg-white focus:outline-none focus:border-[#2B6CB0]" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#718096] mb-1 block flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5" /> Link ke Akun User (Opsional)
            </label>
            <UserPicker selectedId={createUserId} users={allUsers} onChange={setCreateUserId} />
          </div>
          <div className="flex items-center gap-3">
            <Toggle checked={createActive} onChange={setCreateActive} />
            <span className="text-[13px] font-medium text-[#1A202C]">{createActive ? 'Aktif' : 'Nonaktif'}</span>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => { setShowCreate(false); setCreateName(''); setCreateUserId(null); setCreateActive(true); }}
              className="px-4 py-2 text-[13px] font-semibold border border-[#E2E8F0] rounded-[8px] text-[#718096] hover:bg-[#F7F8FA]">Batal</button>
            <button onClick={handleCreate} disabled={!createName.trim() || saving}
              className="px-4 py-2 text-[13px] font-semibold bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white rounded-[8px] disabled:opacity-50 transition-colors">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="border border-[#E2E8F0] rounded-[10px] overflow-hidden bg-white">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B6CB0]" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-[#718096] text-[13px]">
            {search ? `Tidak ada teknisi dengan nama "${search}"` : 'Belum ada data teknisi. Klik Tambah Teknisi.'}
          </div>
        ) : (
          <div className="divide-y divide-[#F0F0F0]">
            {filtered.map(t => {
              const linkedUser = userById(t.userId);
              const isEditing = editingId === t.id;
              return (
                <div key={t.id} className="p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wide">Edit Teknisi</p>
                      <div>
                        <label className="text-[12px] font-semibold text-[#718096] mb-1 block">Nama</label>
                        <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                          className="w-full px-3 py-2.5 text-[13px] border border-[#E2E8F0] rounded-[8px] bg-white focus:outline-none focus:border-[#2B6CB0]" />
                      </div>
                      <div>
                        <label className="text-[12px] font-semibold text-[#718096] mb-1 block flex items-center gap-1">
                          <Link2 className="w-3.5 h-3.5" /> Link ke Akun User
                        </label>
                        <UserPicker selectedId={editUserId} users={allUsers} onChange={setEditUserId} />
                      </div>
                      <div className="flex items-center gap-3">
                        <Toggle checked={editActive} onChange={setEditActive} />
                        <span className="text-[13px] font-medium">{editActive ? 'Aktif' : 'Nonaktif'}</span>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-[12px] font-semibold border border-[#E2E8F0] rounded-[8px] text-[#718096] hover:bg-[#F7F8FA]">Batal</button>
                        <button onClick={() => handleUpdate(t.id)} disabled={!editName.trim() || saving}
                          className="px-3 py-1.5 text-[12px] font-semibold bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white rounded-[8px] disabled:opacity-50">
                          {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${t.isActive ? 'bg-[#F0FFF4]' : 'bg-[#F7F8FA]'}`}>
                        {t.isActive ? <CheckCircle className="w-5 h-5 text-[#059669]" /> : <XCircle className="w-5 h-5 text-[#718096]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[14px] font-semibold text-[#1A202C]">{t.name}</p>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${t.isActive ? 'bg-[#F0FFF4] text-[#059669] border-emerald-200' : 'bg-[#F7F8FA] text-[#718096] border-[#E2E8F0]'}`}>
                            {t.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                        {linkedUser ? (
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#2B6CB0] bg-[#EBF4FF] border border-blue-100 px-2 py-0.5 rounded-full font-semibold">
                              <User className="w-3 h-3" />{linkedUser.name}
                            </span>
                            {linkedUser.division && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#718096] bg-[#F7F8FA] border border-[#E2E8F0] px-2 py-0.5 rounded-full">
                                <Building2 className="w-3 h-3" />{linkedUser.division}
                              </span>
                            )}
                            {linkedUser.roleName && <span className="text-[11px] text-[#718096]">· {linkedUser.roleName}</span>}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#A0AEC0] italic mt-0.5">Belum dilink ke akun sistem</p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => { setEditingId(t.id); setEditName(t.name); setEditUserId(t.userId ?? null); setEditActive(t.isActive); setShowCreate(false); }}
                          className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeletingId(t.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#718096] hover:bg-red-50 hover:text-[#DC2626] transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deletingId && (
        <DeleteConfirm
          name={technicians.find(t => t.id === deletingId)?.name ?? ''}
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
