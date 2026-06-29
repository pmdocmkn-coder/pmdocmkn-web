import React, { useState, useEffect } from 'react';
import { userApi, roleApi, divisionApi } from '../../services/api';
import { User } from '../../types/auth';
import { Role } from '../../types/permission';
import {
  Search, UserCheck, UserX, Shield, Mail, Calendar,
  CheckCircle, XCircle, Eye, X, Trash2, RefreshCw,
  Clock, Building2, ChevronLeft, ChevronRight, ChevronDown, Check,
} from 'lucide-react';
import { formatDateTimeIndonesian } from '../../utils/dateUtils';
import { hasPermission } from '../../utils/permissionUtils';
import { useAuth } from '../../contexts/AuthContext';
import BottomSheet from '../common/BottomSheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';

interface DivisionItem { id: number; code: string; name: string; isActive: boolean; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name[0].toUpperCase();
}

function Avatar({ user }: { user: User }) {
  if (user.photoUrl) return (
    <img src={user.photoUrl} alt={user.fullName}
      className="w-10 h-10 rounded-full object-cover border-2 border-[#E2E8F0] flex-shrink-0" />
  );
  return (
    <div className="w-10 h-10 rounded-full bg-[#1B3A6B] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
      {getInitials(user.fullName)}
    </div>
  );
}

function StatusBadge({ isActive }: { isActive?: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0FFF4] text-[#059669] border border-emerald-200">
      <CheckCircle className="w-3 h-3" /> Aktif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-[#DC2626] border border-red-200">
      <XCircle className="w-3 h-3" /> Nonaktif
    </span>
  );
}

// ─── Mobile BottomSheet picker ────────────────────────────────────────────────

interface PickerSheetProps<T> {
  open: boolean;
  onClose: () => void;
  title: string;
  items: T[];
  getKey: (item: T) => string | number;
  getLabel: (item: T) => string;
  selectedKey: string | number;
  onSelect: (key: string | number) => void;
}

function PickerSheet<T>({ open, onClose, title, items, getKey, getLabel, selectedKey, onSelect }: PickerSheetProps<T>) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} size="lg">
      <div className="space-y-1 pb-2">
        {items.map(item => {
          const key = getKey(item);
          const isSelected = key === selectedKey;
          return (
            <button key={key} type="button"
              onClick={() => { onSelect(key); onClose(); }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-[10px] text-[14px] font-medium transition-colors text-left ${
                isSelected ? 'bg-[#EBF4FF] text-[#1B3A6B]' : 'text-[#1A202C] hover:bg-[#F7F8FA]'
              }`}>
              <span>{getLabel(item)}</span>
              {isSelected && <Check className="w-4 h-4 text-[#2B6CB0] flex-shrink-0" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UsersManagementTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [divisions, setDivisions] = useState<DivisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Mobile pickers state
  const [rolePickerUser, setRolePickerUser] = useState<User | null>(null);
  const [divPickerUser, setDivPickerUser] = useState<User | null>(null);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus]);
  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const t = setInterval(fetchData, 30000);
    return () => clearInterval(t);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData, divsData] = await Promise.all([
        userApi.getAll(),
        roleApi.getAll(),
        divisionApi.getAll({ pageSize: 100 }).then(r => r.data || []).catch(() => []),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setDivisions(divsData);
    } catch {
      showMsg('error', 'Gagal memuat data users');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage(null);
    await fetchData();
    showMsg('success', 'Data berhasil diperbarui');
    setRefreshing(false);
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleActivate = async (userId: number) => {
    if (!confirm('Aktifkan user ini?')) return;
    try { await userApi.activateUser(userId); showMsg('success', 'User berhasil diaktifkan'); fetchData(); }
    catch (e: any) { showMsg('error', e.response?.data?.message || 'Gagal mengaktifkan user'); }
  };

  const handleDeactivate = async (userId: number) => {
    if (!confirm('Nonaktifkan user ini?')) return;
    try { await userApi.deactivateUser(userId); showMsg('success', 'User berhasil dinonaktifkan'); fetchData(); }
    catch (e: any) { showMsg('error', e.response?.data?.message || 'Gagal menonaktifkan user'); }
  };

  const handleChangeRole = async (userId: number, newRoleId: number) => {
    if (!confirm('Ubah role user ini?')) return;
    try { await userApi.updateRole(userId, newRoleId); showMsg('success', 'Role berhasil diubah'); fetchData(); }
    catch (e: any) { showMsg('error', e.response?.data?.message || 'Gagal mengubah role'); }
  };

  const handleChangeDivision = async (userId: number, newDiv: string) => {
    try { await userApi.updateUser(userId, { division: newDiv || undefined }); showMsg('success', 'Divisi berhasil diubah'); fetchData(); }
    catch (e: any) { showMsg('error', e.response?.data?.message || 'Gagal mengubah divisi'); }
  };

  const handleDelete = async (userId: number, name: string) => {
    if (!confirm(`Hapus user "${name}"? Tindakan tidak dapat dibatalkan.`)) return;
    try { await userApi.deleteUser(userId); showMsg('success', `User "${name}" berhasil dihapus`); fetchData(); }
    catch (e: any) { showMsg('error', e.response?.data?.message || 'Gagal menghapus user'); }
  };

  const handleViewDetail = async (userId: number) => {
    try { const u = await userApi.getById(userId); setSelectedUser(u); setIsDetailOpen(true); }
    catch (e: any) { showMsg('error', e.response?.data?.message || 'Gagal memuat detail user'); }
  };

  // Filter logic
  const filteredRoles = roles.filter(r => {
    if (currentUser?.roleName === 'Supv MKN') return r.roleName === 'Teknisi' || r.roleName === 'Office';
    if (currentUser?.roleId !== 1 && r.roleId === 1) return false;
    return true;
  });

  const filteredUsers = users.filter(u => {
    if (currentUser?.roleName === 'Supv MKN') { if (u.roleName !== 'Teknisi' && u.roleName !== 'Office') return false; }
    else if (currentUser?.roleId !== 1 && u.roleId === 1) return false;
    const q = searchTerm.toLowerCase();
    const matchSearch = u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' && u.isActive) || (filterStatus === 'inactive' && !u.isActive);
    return matchSearch && matchStatus;
  });

  const totalCount = filteredUsers.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paged = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const stats = { total: filteredUsers.length, active: filteredUsers.filter(u => u.isActive).length, inactive: filteredUsers.filter(u => !u.isActive).length };

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
          <h2 className="text-[15px] font-bold text-[#1A202C]">User Management</h2>
          <p className="text-[12px] text-[#718096] mt-0.5">Kelola aktivasi dan role pengguna</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-[#F7F8FA] border border-[#E2E8F0] rounded-[8px] text-[13px] font-semibold text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors min-h-[40px] disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#EBF4FF] border border-blue-100 rounded-[10px] p-3 text-center">
          <p className="text-[11px] font-semibold text-[#2B6CB0] uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-[#1B3A6B] mt-0.5">{stats.total}</p>
        </div>
        <div className="bg-[#F0FFF4] border border-emerald-100 rounded-[10px] p-3 text-center">
          <p className="text-[11px] font-semibold text-[#059669] uppercase tracking-wide">Aktif</p>
          <p className="text-2xl font-bold text-[#059669] mt-0.5">{stats.active}</p>
        </div>
        <div className="bg-[#FFFBEB] border border-amber-100 rounded-[10px] p-3 text-center">
          <p className="text-[11px] font-semibold text-[#F59E0B] uppercase tracking-wide">Nonaktif</p>
          <p className="text-2xl font-bold text-[#F59E0B] mt-0.5">{stats.inactive}</p>
        </div>
      </div>

      {/* ── Toast ── */}
      {message && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-[8px] border text-[13px] font-medium ${
          message.type === 'success' ? 'bg-[#F0FFF4] border-emerald-200 text-[#059669]' : 'bg-red-50 border-red-200 text-[#DC2626]'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari nama, email, atau username..."
            className="w-full pl-9 pr-3 py-2.5 text-[13px] border border-[#E2E8F0] rounded-[8px] bg-[#F7F8FA] focus:outline-none focus:border-[#2B6CB0] min-h-[40px]" />
        </div>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as 'all' | 'active' | 'inactive')}>
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

      {/* ── MOBILE: card per user ── */}
      <div className="md:hidden space-y-3">
        {paged.length === 0 ? (
          <div className="text-center py-10 text-[#718096] text-[13px] bg-white border border-[#E2E8F0] rounded-[10px]">
            Tidak ada user ditemukan
          </div>
        ) : paged.map(u => {
          const isSATarget = u.roleId === 1;
          const isSA = currentUser?.roleId === 1;
          const disabled = isSATarget && !isSA;
          return (
            <div key={u.userId} className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 space-y-3">
              {/* User info row */}
              <div className="flex items-center gap-3">
                <Avatar user={u} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#1A202C] truncate">{u.fullName}</p>
                  <p className="text-[12px] text-[#718096]">@{u.username}</p>
                  <p className="text-[11px] text-[#718096] truncate">{u.email}</p>
                </div>
                <StatusBadge isActive={u.isActive} />
              </div>

              {/* Role + Division */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => !disabled && hasPermission('user.update') && setRolePickerUser(u)}
                  disabled={!!(disabled || !hasPermission('user.update'))}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] border text-left transition-colors ${
                    disabled || !hasPermission('user.update')
                      ? 'bg-[#F7F8FA] border-[#E2E8F0] cursor-not-allowed'
                      : 'bg-white border-[#E2E8F0] hover:border-[#2B6CB0] active:bg-[#EBF4FF]'
                  }`}>
                  <div>
                    <p className="text-[10px] text-[#718096] font-medium uppercase tracking-wide">Role</p>
                    <p className="text-[13px] font-semibold text-[#1A202C]">{u.roleName || '—'}</p>
                  </div>
                  {hasPermission('user.update') && !disabled && (
                    <ChevronDown className="w-4 h-4 text-[#718096] flex-shrink-0" />
                  )}
                </button>
                <button
                  onClick={() => !disabled && hasPermission('division.update') && setDivPickerUser(u)}
                  disabled={!!(disabled || !hasPermission('division.update'))}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] border text-left transition-colors ${
                    disabled || !hasPermission('division.update')
                      ? 'bg-[#F7F8FA] border-[#E2E8F0] cursor-not-allowed'
                      : 'bg-white border-[#E2E8F0] hover:border-[#2B6CB0] active:bg-[#EBF4FF]'
                  }`}>
                  <div>
                    <p className="text-[10px] text-[#718096] font-medium uppercase tracking-wide">Divisi</p>
                    <p className="text-[13px] font-semibold text-[#1A202C]">{u.division || '—'}</p>
                  </div>
                  {hasPermission('division.update') && !disabled && (
                    <ChevronDown className="w-4 h-4 text-[#718096] flex-shrink-0" />
                  )}
                </button>
              </div>

              {/* Last login */}
              <p className="text-[11px] text-[#718096] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDateTimeIndonesian(u.lastLogin)}
              </p>

              {/* Action buttons */}
              <div className="flex gap-2 pt-1 border-t border-[#E2E8F0]">
                <button onClick={() => handleViewDetail(u.userId)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] bg-[#EBF4FF] text-[#2B6CB0] text-[12px] font-semibold">
                  <Eye className="w-4 h-4" /> Detail
                </button>
                {hasPermission('user.update') && !disabled && (
                  u.isActive ? (
                    <button onClick={() => handleDeactivate(u.userId)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] bg-amber-50 text-[#F59E0B] text-[12px] font-semibold">
                      <UserX className="w-4 h-4" /> Nonaktifkan
                    </button>
                  ) : (
                    <button onClick={() => handleActivate(u.userId)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] bg-[#F0FFF4] text-[#059669] text-[12px] font-semibold">
                      <UserCheck className="w-4 h-4" /> Aktifkan
                    </button>
                  )
                )}
                {hasPermission('user.delete') && !disabled && (
                  <button onClick={() => handleDelete(u.userId, u.fullName)}
                    className="w-10 h-10 flex items-center justify-center rounded-[8px] bg-red-50 text-[#DC2626]">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DESKTOP: table ── */}
      <div className="hidden md:block border border-[#E2E8F0] rounded-[10px] overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-[#E2E8F0]">
                {['User', 'Role', 'Divisi', 'Status', 'Last Login', 'Aksi'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {paged.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[13px] text-[#718096]">Tidak ada user ditemukan</td></tr>
              ) : paged.map(u => {
                const isSATarget = u.roleId === 1;
                const isSA = currentUser?.roleId === 1;
                const disabled = isSATarget && !isSA;
                return (
                  <tr key={u.userId} className="hover:bg-[#F7F8FA] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={u} />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[#1A202C]">{u.fullName}</p>
                          <p className="text-[11px] text-[#718096]">{u.email}</p>
                          <p className="text-[11px] text-[#718096]">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select value={u.roleId}
                        onChange={e => handleChangeRole(u.userId, parseInt(e.target.value))}
                        disabled={!!(!hasPermission('user.update') || disabled)}
                        className="text-[13px] px-2 py-1.5 border border-[#E2E8F0] rounded-[6px] focus:outline-none focus:border-[#2B6CB0] bg-white disabled:bg-[#F7F8FA] disabled:text-[#718096] disabled:cursor-not-allowed">
                        {filteredRoles.map(r => <option key={r.roleId} value={r.roleId}>{r.roleName}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select value={u.division || ''}
                        onChange={e => handleChangeDivision(u.userId, e.target.value)}
                        disabled={!!(!hasPermission('division.update') || disabled)}
                        className="text-[13px] px-2 py-1.5 border border-[#E2E8F0] rounded-[6px] focus:outline-none focus:border-[#2B6CB0] bg-white disabled:bg-[#F7F8FA] disabled:text-[#718096] disabled:cursor-not-allowed">
                        <option value="">— Belum ada —</option>
                        {divisions.filter(d => d.isActive).map(d => (
                          <option key={d.id} value={d.name}>{d.code} - {d.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3"><StatusBadge isActive={u.isActive} /></td>
                    <td className="px-4 py-3">
                      <p className="text-[12px] text-[#718096] whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        {formatDateTimeIndonesian(u.lastLogin)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleViewDetail(u.userId)}
                          className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#2B6CB0] hover:bg-[#EBF4FF] transition-colors" title="Detail">
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasPermission('user.update') && !disabled && (
                          u.isActive ? (
                            <button onClick={() => handleDeactivate(u.userId)}
                              className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#F59E0B] hover:bg-amber-50 transition-colors" title="Nonaktifkan">
                              <UserX className="w-4 h-4" />
                            </button>
                          ) : (
                            <button onClick={() => handleActivate(u.userId)}
                              className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#059669] hover:bg-[#F0FFF4] transition-colors" title="Aktifkan">
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )
                        )}
                        {hasPermission('user.delete') && !disabled && (
                          <button onClick={() => handleDelete(u.userId, u.fullName)}
                            className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#DC2626] hover:bg-red-50 transition-colors" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#E2E8F0] flex items-center justify-between">
            <p className="text-[12px] text-[#718096]">
              {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)} dari {totalCount} user
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#E2E8F0] text-[#718096] hover:bg-[#F7F8FA] disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[13px] text-[#1A202C] font-medium px-2">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#E2E8F0] text-[#718096] hover:bg-[#F7F8FA] disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile pagination */}
      {totalPages > 1 && (
        <div className="md:hidden flex items-center justify-between px-1">
          <p className="text-[12px] text-[#718096]">{(currentPage-1)*pageSize+1}–{Math.min(currentPage*pageSize,totalCount)} dari {totalCount}</p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage===1}
              className="px-3 py-2 text-[12px] font-semibold border border-[#E2E8F0] rounded-[8px] text-[#718096] disabled:opacity-40 bg-white">← Prev</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} disabled={currentPage===totalPages}
              className="px-3 py-2 text-[12px] font-semibold border border-[#E2E8F0] rounded-[8px] text-[#718096] disabled:opacity-40 bg-white">Next →</button>
          </div>
        </div>
      )}

      {/* ── Mobile Role Picker BottomSheet ── */}
      {rolePickerUser && (
        <PickerSheet
          open={!!rolePickerUser}
          onClose={() => setRolePickerUser(null)}
          title="Pilih Role"
          items={filteredRoles}
          getKey={r => r.roleId}
          getLabel={r => r.roleName}
          selectedKey={rolePickerUser.roleId}
          onSelect={key => handleChangeRole(rolePickerUser.userId, Number(key))}
        />
      )}

      {/* ── Mobile Division Picker BottomSheet ── */}
      {divPickerUser && (
        <PickerSheet
          open={!!divPickerUser}
          onClose={() => setDivPickerUser(null)}
          title="Pilih Divisi"
          items={[{ id: 0, code: '', name: '— Belum ada —', isActive: true }, ...divisions.filter(d => d.isActive)]}
          getKey={d => d.name}
          getLabel={d => d.id === 0 ? '— Belum ada —' : `${d.code} - ${d.name}`}
          selectedKey={divPickerUser.division || ''}
          onSelect={key => handleChangeDivision(divPickerUser.userId, String(key))}
        />
      )}

      {/* ── User Detail (Desktop: Modal, Mobile: BottomSheet) ── */}
      {/* Desktop Modal */}
      {isDetailOpen && selectedUser && (
        <div className="hidden md:flex fixed inset-0 bg-black/50 items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[14px] shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h3 className="text-[16px] font-bold text-[#1A202C]">Detail User</h3>
              <button onClick={() => setIsDetailOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#718096] hover:bg-[#F7F8FA] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <Avatar user={selectedUser} />
                <div>
                  <h4 className="text-[17px] font-bold text-[#1A202C]">{selectedUser.fullName}</h4>
                  <p className="text-[13px] text-[#718096]">@{selectedUser.username}</p>
                  <div className="mt-1"><StatusBadge isActive={selectedUser.isActive} /></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Email', icon: <Mail className="w-4 h-4" />, value: selectedUser.email },
                  { label: 'Role', icon: <Shield className="w-4 h-4" />, value: selectedUser.roleName },
                  { label: 'Divisi', icon: <Building2 className="w-4 h-4" />, value: selectedUser.division || 'Belum ditentukan' },
                  { label: 'Dibuat', icon: <Calendar className="w-4 h-4" />, value: formatDateTimeIndonesian(selectedUser.createdAt?.toString()) },
                  { label: 'Last Login', icon: <Clock className="w-4 h-4" />, value: formatDateTimeIndonesian(selectedUser.lastLogin?.toString()) },
                ].map(({ label, icon, value }) => (
                  <div key={label} className={label === 'Email' || label === 'Last Login' ? 'col-span-2' : ''}>
                    <p className="text-[11px] font-semibold text-[#718096] uppercase tracking-wide mb-1">{label}</p>
                    <div className="flex items-center gap-2 bg-[#F7F8FA] px-3 py-2 rounded-[8px] border border-[#E2E8F0]">
                      <span className="text-[#718096] flex-shrink-0">{icon}</span>
                      <p className="text-[13px] text-[#1A202C] font-medium truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#E2E8F0]">
              <button onClick={() => setIsDetailOpen(false)}
                className="w-full py-2.5 border border-[#E2E8F0] rounded-[8px] text-[13px] font-semibold text-[#718096] hover:bg-[#F7F8FA] transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile detail as BottomSheet */}
      {selectedUser && (
        <BottomSheet open={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detail User" size="xl">
          <div className="space-y-4 pb-4">
            <div className="flex items-center gap-3">
              <Avatar user={selectedUser} />
              <div>
                <h4 className="text-[15px] font-bold text-[#1A202C]">{selectedUser.fullName}</h4>
                <p className="text-[12px] text-[#718096]">@{selectedUser.username}</p>
                <div className="mt-1"><StatusBadge isActive={selectedUser.isActive} /></div>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Email', icon: <Mail className="w-4 h-4" />, value: selectedUser.email },
                { label: 'Role', icon: <Shield className="w-4 h-4" />, value: selectedUser.roleName },
                { label: 'Divisi', icon: <Building2 className="w-4 h-4" />, value: selectedUser.division || 'Belum ditentukan' },
                { label: 'Dibuat', icon: <Calendar className="w-4 h-4" />, value: formatDateTimeIndonesian(selectedUser.createdAt?.toString()) },
                { label: 'Last Login', icon: <Clock className="w-4 h-4" />, value: formatDateTimeIndonesian(selectedUser.lastLogin?.toString()) },
              ].map(({ label, icon, value }) => (
                <div key={label} className="flex items-center gap-3 bg-[#F7F8FA] px-4 py-3 rounded-[10px] border border-[#E2E8F0]">
                  <span className="text-[#718096] flex-shrink-0">{icon}</span>
                  <div>
                    <p className="text-[10px] font-semibold text-[#718096] uppercase tracking-wide">{label}</p>
                    <p className="text-[13px] text-[#1A202C] font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
