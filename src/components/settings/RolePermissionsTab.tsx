import React, { useState, useEffect, useMemo, useRef } from 'react';
import { rolePermissionApi, roleApi, permissionApi } from '../../services/api';
import { RolePermissionMatrix, Role, Permission } from '../../types/permission';
import {
  Save, RefreshCw, X, Search, ChevronDown, ChevronRight,
  LayoutGrid, List, GitCompare, Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission as hasUserPermission } from '../../utils/permissionUtils';
import BottomSheet from '../common/BottomSheet';

type ViewMode = 'single' | 'compare' | 'matrix';

const KPC_COLORS = ['#1B3A6B', '#2B6CB0', '#D94F2B', '#059669', '#F59E0B', '#718096'];
const roleColor = (idx: number) => KPC_COLORS[idx % KPC_COLORS.length];

// ─── Mobile Role Picker (custom, no native select) ────────────────────────────

interface MobileRolePickerProps {
  roles: Role[];
  selectedRoleId: number | null;
  onChange: (id: number) => void;
  changes: Record<number, Record<number, boolean>>;
}

function MobileRolePicker({ roles, selectedRoleId, onChange, changes }: MobileRolePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedRole = roles.find(r => r.roleId === selectedRoleId) ?? roles[0];
  const selectedIdx = roles.findIndex(r => r.roleId === selectedRoleId);

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full flex items-center gap-3 px-4 py-3 border-2 rounded-[10px] bg-white transition-colors text-left ${
          open ? 'border-[#2B6CB0]' : 'border-[#E2E8F0]'
        }`}
        style={{ minHeight: 52 }}
      >
        {/* Color dot for selected role */}
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: roleColor(selectedIdx >= 0 ? selectedIdx : 0) }}
        />
        <span className="flex-1 text-[15px] font-semibold text-[#1A202C]">
          {selectedRole?.roleName ?? 'Pilih Role'}
        </span>
        {changes[selectedRole?.roleId] && (
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
        )}
        <ChevronDown className="w-5 h-5 text-[#718096] flex-shrink-0" />
      </button>

      {/* BottomSheet list */}
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Pilih Role" size="lg">
        <div className="space-y-1 pb-2">
          {roles.map((role, idx) => {
            const isSelected = role.roleId === selectedRoleId;
            const color = roleColor(idx);
            return (
              <button
                key={role.roleId}
                type="button"
                onClick={() => { onChange(role.roleId); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[10px] text-[14px] font-medium transition-colors text-left ${
                  isSelected ? 'bg-[#EBF4FF] text-[#1B3A6B]' : 'text-[#1A202C] hover:bg-[#F7F8FA]'
                }`}
              >
                {/* Color dot */}
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="flex-1">{role.roleName}</span>
                {changes[role.roleId] && (
                  <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                    edited
                  </span>
                )}
                {isSelected && <Check className="w-4 h-4 text-[#2B6CB0] flex-shrink-0" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}

export default function RolePermissionsTab() {
  const [matrix, setMatrix] = useState<RolePermissionMatrix[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [changes, setChanges] = useState<Record<number, Record<number, boolean>>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [compareRoleIds, setCompareRoleIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const { user } = useAuth();
  const isSuperAdmin = user?.roleName === 'Super Admin';

  const canEditRole = (roleId: number) => {
    if (roleId === 1 && !isSuperAdmin) return false;
    return hasUserPermission('role.permission.edit');
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (permissions.length > 0) {
      const all: Record<string, boolean> = {};
      permissions.forEach(p => { all[p.group || 'Other'] = true; });
      setCollapsedGroups(all);
    }
  }, [permissions.length]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matrixData, rolesData, permsData] = await Promise.all([
        rolePermissionApi.getMatrix(),
        roleApi.getAll(),
        permissionApi.getAll(),
      ]);
      setMatrix(matrixData);
      setRoles(rolesData);
      setPermissions(permsData);
      setChanges({});
      if (!selectedRoleId && rolesData.length > 0) setSelectedRoleId(rolesData[0].roleId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal memuat data' });
    } finally {
      setLoading(false);
    }
  };

  const hasPerm = (roleId: number, permId: number): boolean => {
    if (changes[roleId]?.[permId] !== undefined) return changes[roleId][permId];
    return matrix.find(m => m.roleId === roleId)?.permissions
      .find(p => p.permissionId === permId)?.isAssigned === true;
  };

  const togglePerm = (roleId: number, permId: number) => {
    if (!canEditRole(roleId)) return;
    setChanges(prev => ({
      ...prev,
      [roleId]: { ...prev[roleId], [permId]: !hasPerm(roleId, permId) },
    }));
  };

  const toggleGroupAll = (roleId: number, perms: Permission[], target: boolean) => {
    if (!canEditRole(roleId)) return;
    const next = { ...changes, [roleId]: { ...changes[roleId] } };
    perms.forEach(p => { if (hasPerm(roleId, p.permissionId) !== target) next[roleId][p.permissionId] = target; });
    setChanges(next);
  };

  const hasChanges = () => Object.keys(changes).length > 0;

  const handleSave = async () => {
    if (!hasChanges()) return;
    setSaving(true);
    try {
      for (const [ridStr, perms] of Object.entries(changes)) {
        const rid = parseInt(ridStr);
        const current = new Set(
          matrix.find(m => m.roleId === rid)?.permissions.filter(p => p.isAssigned).map(p => p.permissionId) || []
        );
        Object.entries(perms).forEach(([pid, on]) => { on ? current.add(+pid) : current.delete(+pid); });
        await rolePermissionApi.assignPermissions(rid, Array.from(current));
      }
      setMessage({ type: 'success', text: 'Perubahan berhasil disimpan!' });
      setChanges({});
      await fetchData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal menyimpan' });
    } finally {
      setSaving(false);
    }
  };

  const toggleCompareRole = (id: number) => {
    setCompareRoleIds(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const toggleGroup = (g: string) =>
    setCollapsedGroups(prev => ({ ...prev, [g]: !prev[g] }));

  const groupedPermissions = useMemo(() => {
    const filtered = permissions.filter(p =>
      p.permissionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.group && p.group.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const groups: Record<string, Permission[]> = {};
    filtered.forEach(p => { const g = p.group || 'Other'; if (!groups[g]) groups[g] = []; groups[g].push(p); });
    return Object.keys(groups)
      .sort((a, b) => a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b))
      .map(name => ({ name, permissions: groups[name] }));
  }, [permissions, searchTerm]);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B6CB0]" />
    </div>
  );

  const activeRole = roles.find(r => r.roleId === selectedRoleId) ?? roles[0];
  const compareRoles = roles.filter(r => compareRoleIds.includes(r.roleId));

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-[#1A202C]">Role Permission Matrix</h2>
          <p className="text-[12px] text-[#718096] mt-0.5">{permissions.length} permission • {roles.length} role</p>
        </div>
        {hasChanges() && (
          <div className="flex gap-2">
            <button onClick={() => setChanges({})} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold border border-[#E2E8F0] rounded-[8px] text-[#718096] hover:bg-[#F7F8FA] transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white rounded-[8px] transition-colors">
              {saving
                ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                : <Save className="w-3.5 h-3.5" />}
              Simpan
            </button>
          </div>
        )}
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

      {hasChanges() && (
        <div className="bg-[#FFFBEB] border border-amber-200 rounded-[8px] px-4 py-2.5 text-[12px] text-amber-700 font-medium">
          ⚠️ {Object.keys(changes).length} role memiliki perubahan yang belum disimpan
        </div>
      )}

      {/* ── View Mode Tabs + Search ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex bg-[#F7F8FA] p-1 rounded-[8px] border border-[#E2E8F0] gap-1">
          {([
            { id: 'single' as const, label: 'Per Role', icon: List },
            { id: 'compare' as const, label: 'Compare', icon: GitCompare },
            { id: 'matrix' as const, label: 'Matrix', icon: LayoutGrid },
          ]).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setViewMode(id)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-semibold rounded-[6px] transition-all min-h-[40px] ${
                viewMode === id ? 'bg-white text-[#1B3A6B] shadow-sm border border-[#E2E8F0]' : 'text-[#718096] hover:text-[#1A202C]'
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-[11px] sm:text-[13px]">{label}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari permission atau group..."
            className="w-full pl-9 pr-3 py-2.5 text-[13px] border border-[#E2E8F0] rounded-[8px] bg-[#F7F8FA] focus:outline-none focus:border-[#2B6CB0] min-h-[40px]" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          VIEW: SINGLE ROLE (Per Role)
      ═══════════════════════════════════════════ */}
      {viewMode === 'single' && activeRole && (
        <div className="flex flex-col md:flex-row gap-4">

          {/* Role selector */}
          <div className="md:w-48 flex-shrink-0">
            <p className="text-[11px] font-semibold text-[#718096] uppercase tracking-wide mb-2">Pilih Role</p>

          {/* Mobile: custom dropdown → BottomSheet */}
          <div className="md:hidden">
            <MobileRolePicker
              roles={roles}
              selectedRoleId={selectedRoleId}
              onChange={setSelectedRoleId}
              changes={changes}
            />
            <p className="mt-2 text-[12px] text-[#718096]">
              {permissions.filter(p => hasPerm(activeRole.roleId, p.permissionId)).length} / {permissions.length} permission granted
            </p>
          </div>

            {/* Desktop: vertical list */}
            <div className="hidden md:block bg-white border border-[#E2E8F0] rounded-[10px] overflow-hidden">
              {roles.map((role, idx) => (
                <button key={role.roleId} onClick={() => setSelectedRoleId(role.roleId)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-medium transition-colors relative
                    ${idx < roles.length - 1 ? 'border-b border-[#E2E8F0]' : ''}
                    ${selectedRoleId === role.roleId ? 'bg-[#EBF4FF] text-[#1B3A6B]' : 'text-[#1A202C] hover:bg-[#F7F8FA]'}`}>
                  {selectedRoleId === role.roleId && (
                    <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r"
                      style={{ backgroundColor: roleColor(idx) }} />
                  )}
                  <span className="truncate pl-1">{role.roleName}</span>
                  {changes[role.roleId] && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0 ml-1" />}
                </button>
              ))}
            </div>
          </div>

          {/* Permission groups for selected role */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-bold text-[#1A202C]">{activeRole.roleName}</p>
              <span className="text-[11px] text-[#718096]">
                {permissions.filter(p => hasPerm(activeRole.roleId, p.permissionId)).length} / {permissions.length} granted
              </span>
            </div>

            {groupedPermissions.map(group => {
              const collapsed = collapsedGroups[group.name];
              const allChecked = group.permissions.every(p => hasPerm(activeRole.roleId, p.permissionId));
              const editable = canEditRole(activeRole.roleId);

              return (
                <div key={group.name} className="border border-[#E2E8F0] rounded-[10px] overflow-hidden bg-white">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#F7F8FA] border-b border-[#E2E8F0]">
                    <button onClick={() => toggleGroup(group.name)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                      {collapsed
                        ? <ChevronRight className="w-4 h-4 text-[#718096] flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-[#718096] flex-shrink-0" />}
                      <span className="text-[13px] font-semibold text-[#1A202C] truncate">{group.name}</span>
                      <span className="text-[11px] text-[#718096] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-full flex-shrink-0">{group.permissions.length}</span>
                    </button>
                    {editable && (
                      <button onClick={() => toggleGroupAll(activeRole.roleId, group.permissions, !allChecked)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-[6px] border ml-2 flex-shrink-0 transition-colors ${
                          allChecked ? 'bg-[#EBF4FF] text-[#2B6CB0] border-blue-200' : 'bg-white text-[#718096] border-[#E2E8F0] hover:bg-[#F7F8FA]'
                        }`}>
                        {allChecked ? 'Uncheck All' : 'Check All'}
                      </button>
                    )}
                  </div>

                  {!collapsed && (
                    <div className="divide-y divide-[#E2E8F0]">
                      {group.permissions.map(perm => {
                        const checked = hasPerm(activeRole.roleId, perm.permissionId);
                        const changed = changes[activeRole.roleId]?.[perm.permissionId] !== undefined;
                        return (
                          <div key={perm.permissionId}
                            onClick={() => togglePerm(activeRole.roleId, perm.permissionId)}
                            className={`flex items-center gap-3 px-4 py-2.5 transition-colors
                              ${editable ? 'cursor-pointer active:bg-[#F7F8FA]' : 'cursor-not-allowed opacity-60'}
                              ${changed ? 'bg-amber-50' : ''}`}>
                            <div className="flex-shrink-0">
                              {/* Mobile: toggle switch */}
                              <div className={`sm:hidden w-10 h-6 rounded-full relative transition-colors duration-200
                                ${checked ? 'bg-[#2B6CB0]' : 'bg-[#E2E8F0]'}
                                ${changed ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}>
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
                              </div>
                              {/* Desktop: checkbox */}
                              <div className={`hidden sm:flex mt-0.5 w-5 h-5 rounded-[4px] border-2 items-center justify-center flex-shrink-0 transition-colors
                                ${checked ? 'bg-[#2B6CB0] border-[#2B6CB0]' : 'bg-white border-[#CBD5E0]'}
                                ${changed ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}>
                                {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] sm:text-[13px] font-mono font-medium text-[#1A202C] break-all leading-snug">{perm.permissionName}</p>
                              {perm.description && (
                                <p className="text-[11px] text-[#718096] mt-0.5 hidden sm:block">{perm.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          VIEW: COMPARE (2-4 roles)
      ═══════════════════════════════════════════ */}
      {viewMode === 'compare' && (
        <div className="space-y-3">
          {/* Role chips */}
          <div>
            <p className="text-[12px] font-semibold text-[#718096] mb-2">Pilih role yang ingin dibandingkan (maks 4):</p>
            <div className="flex flex-wrap gap-2">
              {roles.map((role, idx) => {
                const selected = compareRoleIds.includes(role.roleId);
                const color = roleColor(idx);
                return (
                  <button key={role.roleId} onClick={() => toggleCompareRole(role.roleId)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-[8px] text-[13px] font-semibold border transition-all min-h-[40px] ${
                      selected ? 'text-white border-transparent' : 'bg-white text-[#718096] border-[#E2E8F0] hover:border-[#2B6CB0]'
                    }`}
                    style={selected ? { backgroundColor: color, borderColor: color } : {}}>
                    {selected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                    {role.roleName}
                    {changes[role.roleId] && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {compareRoles.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-[10px] py-12 text-center">
              <GitCompare className="w-8 h-8 text-[#E2E8F0] mx-auto mb-2" />
              <p className="text-[13px] text-[#718096]">Pilih minimal 2 role untuk membandingkan</p>
            </div>
          ) : (
            <>
              {/* Mobile: card per group */}
              <div className="md:hidden space-y-2">
                {groupedPermissions.map(group => {
                  const collapsed = collapsedGroups[group.name];
                  return (
                    <div key={group.name} className="bg-white border border-[#E2E8F0] rounded-[10px] overflow-hidden">
                      <button onClick={() => toggleGroup(group.name)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-[#F7F8FA] border-b border-[#E2E8F0]">
                        <div className="flex items-center gap-2">
                          {collapsed ? <ChevronRight className="w-4 h-4 text-[#718096]" /> : <ChevronDown className="w-4 h-4 text-[#718096]" />}
                          <span className="text-[13px] font-bold text-[#1A202C]">{group.name}</span>
                          <span className="text-[11px] text-[#718096] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-full">{group.permissions.length}</span>
                        </div>
                        <div className="flex gap-1.5">
                          {compareRoles.map(role => {
                            const granted = group.permissions.filter(p => hasPerm(role.roleId, p.permissionId)).length;
                            const total = group.permissions.length;
                            const color = roleColor(roles.findIndex(r => r.roleId === role.roleId));
                            return (
                              <div key={role.roleId} className="w-4 h-4 rounded-full border-2"
                                style={{
                                  backgroundColor: granted === total ? color : granted > 0 ? `${color}60` : 'transparent',
                                  borderColor: color,
                                }} />
                            );
                          })}
                        </div>
                      </button>
                      {!collapsed && group.permissions.map(perm => (
                        <div key={perm.permissionId} className="px-4 py-3 border-b border-[#E2E8F0] last:border-0">
                          <p className="text-[12px] font-mono font-semibold text-[#1A202C] break-all mb-2">{perm.permissionName}</p>
                          {perm.description && <p className="text-[11px] text-[#718096] mb-2">{perm.description}</p>}
                          <div className="flex flex-wrap gap-2">
                            {compareRoles.map(role => {
                              const checked = hasPerm(role.roleId, perm.permissionId);
                              const changed = changes[role.roleId]?.[perm.permissionId] !== undefined;
                              const editable = canEditRole(role.roleId);
                              const color = roleColor(roles.findIndex(r => r.roleId === role.roleId));
                              return (
                                <button key={role.roleId}
                                  onClick={() => togglePerm(role.roleId, perm.permissionId)}
                                  disabled={!editable}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border-2 transition-all min-h-[36px]
                                    ${editable ? 'active:scale-95' : 'opacity-50 cursor-not-allowed'}
                                    ${changed ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
                                  style={{
                                    backgroundColor: checked ? color : 'white',
                                    borderColor: color,
                                    color: checked ? 'white' : color,
                                  }}>
                                  {checked && <Check className="w-3 h-3" strokeWidth={3} />}
                                  {role.roleName}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Desktop: sticky table */}
              <div className="hidden md:block border border-[#E2E8F0] rounded-[10px] bg-white overflow-hidden">
                <div className="overflow-auto" style={{ maxHeight: '65vh' }}>
                  <table className="w-full border-collapse" style={{ minWidth: `${200 + compareRoles.length * 120}px` }}>
                    <thead>
                      <tr style={{ position: 'sticky', top: 0, zIndex: 20, background: 'white', borderBottom: '2px solid #E2E8F0' }}>
                        <th style={{ position: 'sticky', left: 0, top: 0, zIndex: 30, background: 'white' }}
                          className="px-4 py-3 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wide border-r border-[#E2E8F0] w-48">
                          Permission
                        </th>
                        {compareRoles.map(role => (
                          <th key={role.roleId} className="px-4 py-3 text-center min-w-[120px]" style={{ background: 'white' }}>
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[13px] font-bold"
                                style={{ color: roleColor(roles.findIndex(r => r.roleId === role.roleId)) }}>
                                {role.roleName}
                              </span>
                              <span className="text-[11px] text-[#718096] bg-[#F7F8FA] px-2 py-0.5 rounded-full border border-[#E2E8F0]">
                                {permissions.filter(p => hasPerm(role.roleId, p.permissionId)).length} granted
                              </span>
                              {changes[role.roleId] && (
                                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse">edited</span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {groupedPermissions.map(group => {
                        const collapsed = collapsedGroups[group.name];
                        return (
                          <React.Fragment key={group.name}>
                            <tr onClick={() => toggleGroup(group.name)}
                              className="cursor-pointer hover:bg-[#EBF4FF] transition-colors"
                              style={{ background: '#F7F8FA', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                              <td className="px-4 py-2.5 border-r border-[#E2E8F0]"
                                style={{ position: 'sticky', left: 0, zIndex: 10, background: '#F7F8FA' }}>
                                <div className="flex items-center gap-2">
                                  {collapsed ? <ChevronRight className="w-4 h-4 text-[#718096] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#718096] flex-shrink-0" />}
                                  <span className="text-[13px] font-bold text-[#1A202C]">{group.name}</span>
                                  <span className="text-[11px] text-[#718096] bg-white border border-[#E2E8F0] px-1.5 py-0.5 rounded-full flex-shrink-0">{group.permissions.length}</span>
                                </div>
                              </td>
                              <td colSpan={compareRoles.length} style={{ background: '#F7F8FA' }} />
                            </tr>
                            {!collapsed && group.permissions.map(perm => (
                              <tr key={perm.permissionId} className="hover:bg-[#F7FBFF] transition-colors" style={{ borderBottom: '1px solid #E2E8F0' }}>
                                <td className="px-4 py-3 border-r border-[#E2E8F0]"
                                  style={{ position: 'sticky', left: 0, zIndex: 10, background: 'white' }}>
                                  <p className="text-[12px] font-mono font-semibold text-[#1A202C]">{perm.permissionName}</p>
                                  {perm.description && <p className="text-[11px] text-[#718096] mt-0.5">{perm.description}</p>}
                                </td>
                                {compareRoles.map(role => {
                                  const checked = hasPerm(role.roleId, perm.permissionId);
                                  const changed = changes[role.roleId]?.[perm.permissionId] !== undefined;
                                  const editable = canEditRole(role.roleId);
                                  const color = roleColor(roles.findIndex(r => r.roleId === role.roleId));
                                  return (
                                    <td key={role.roleId} className="px-2 py-2 text-center">
                                      <button onClick={() => togglePerm(role.roleId, perm.permissionId)} disabled={!editable}
                                        className={`w-10 h-10 mx-auto rounded-[8px] flex items-center justify-center border-2 transition-all
                                          ${checked ? 'text-white border-transparent' : 'bg-white border-[#E2E8F0] hover:border-[#2B6CB0]'}
                                          ${editable ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed opacity-40'}
                                          ${changed ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
                                        style={checked ? { backgroundColor: color } : {}}>
                                        {checked && <Check className="w-5 h-5" strokeWidth={3} />}
                                      </button>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          VIEW: MATRIX (All roles)
      ═══════════════════════════════════════════ */}
      {viewMode === 'matrix' && (
        <div className="space-y-3">

          {/* ── Mobile Matrix ── */}
          <div className="md:hidden space-y-3">
            {/* Role highlighter */}
            <div className="bg-[#EBF4FF] border border-[#2B6CB0]/20 rounded-[10px] p-3">
              <p className="text-[11px] font-semibold text-[#2B6CB0] uppercase tracking-wide mb-2">
                Sorot role untuk lihat statusnya:
              </p>
              <div className="flex flex-wrap gap-2">
                {roles.map((role, idx) => {
                  const highlighted = selectedRoleId === role.roleId;
                  const color = roleColor(idx);
                  return (
                    <button key={role.roleId}
                      onClick={() => setSelectedRoleId(highlighted ? null : role.roleId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border-2 transition-all min-h-[36px]"
                      style={{
                        backgroundColor: highlighted ? color : 'white',
                        borderColor: color,
                        color: highlighted ? 'white' : color,
                      }}>
                      {role.roleName}
                      {changes[role.roleId] && <span className="w-1.5 h-1.5 rounded-full bg-amber-300 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Group cards */}
            {groupedPermissions.map(group => {
              const collapsed = collapsedGroups[group.name];
              const highlightedRole = roles.find(r => r.roleId === selectedRoleId);
              const highlightIdx = highlightedRole ? roles.findIndex(r => r.roleId === highlightedRole.roleId) : -1;
              return (
                <div key={group.name} className="bg-white border border-[#E2E8F0] rounded-[10px] overflow-hidden">
                  <button onClick={() => toggleGroup(group.name)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#F7F8FA] border-b border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      {collapsed ? <ChevronRight className="w-4 h-4 text-[#718096]" /> : <ChevronDown className="w-4 h-4 text-[#718096]" />}
                      <span className="text-[13px] font-bold text-[#1A202C]">{group.name}</span>
                      <span className="text-[11px] text-[#718096] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-full">{group.permissions.length}</span>
                    </div>
                    {/* Role coverage dots (max 6) */}
                    <div className="flex gap-1">
                      {roles.slice(0, 6).map((role, idx) => {
                        const granted = group.permissions.filter(p => hasPerm(role.roleId, p.permissionId)).length;
                        const total = group.permissions.length;
                        const color = roleColor(idx);
                        return (
                          <div key={role.roleId} className="w-3 h-3 rounded-full border"
                            title={`${role.roleName}: ${granted}/${total}`}
                            style={{
                              backgroundColor: granted === total ? color : granted > 0 ? `${color}55` : 'transparent',
                              borderColor: color,
                            }} />
                        );
                      })}
                      {roles.length > 6 && <span className="text-[10px] text-[#718096]">+{roles.length - 6}</span>}
                    </div>
                  </button>

                  {!collapsed && (
                    <div className="divide-y divide-[#E2E8F0]">
                      {group.permissions.map(perm => {
                        const highlightChecked = highlightedRole ? hasPerm(highlightedRole.roleId, perm.permissionId) : null;
                        const highlightChanged = highlightedRole ? changes[highlightedRole.roleId]?.[perm.permissionId] !== undefined : false;
                        const editable = highlightedRole ? canEditRole(highlightedRole.roleId) : false;
                        return (
                          <div key={perm.permissionId}
                            className={`flex items-center gap-3 px-4 py-2.5 ${highlightChanged ? 'bg-amber-50' : ''}
                              ${highlightedRole && editable ? 'cursor-pointer active:bg-[#F7F8FA]' : ''}`}
                            onClick={() => { if (highlightedRole && editable) togglePerm(highlightedRole.roleId, perm.permissionId); }}>
                            {highlightedRole ? (
                              <div className={`w-10 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0
                                ${highlightChecked ? '' : 'bg-[#E2E8F0]'}
                                ${editable ? 'cursor-pointer' : 'opacity-50'}
                                ${highlightChanged ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
                                style={highlightChecked ? { backgroundColor: roleColor(highlightIdx) } : {}}>
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${highlightChecked ? 'translate-x-5' : 'translate-x-1'}`} />
                              </div>
                            ) : (
                              <div className="flex gap-1 flex-shrink-0">
                                {roles.slice(0, 4).map((role, idx) => (
                                  <div key={role.roleId} className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: hasPerm(role.roleId, perm.permissionId) ? roleColor(idx) : '#E2E8F0' }} />
                                ))}
                              </div>
                            )}
                            <p className="text-[12px] font-mono font-medium text-[#1A202C] break-all leading-snug flex-1">{perm.permissionName}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Desktop Matrix: full sticky table ── */}
          <div className="hidden md:block border border-[#E2E8F0] rounded-[10px] bg-white overflow-hidden">
            <div className="overflow-auto" style={{ maxHeight: '65vh' }}>
              <table className="w-full border-collapse" style={{ minWidth: `${260 + roles.length * 100}px` }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, zIndex: 20, background: 'white', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ position: 'sticky', left: 0, top: 0, zIndex: 30, background: 'white' }}
                      className="px-4 py-3 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wide border-r border-[#E2E8F0] w-56">
                      Permission
                    </th>
                    {roles.map((role, idx) => (
                      <th key={role.roleId} className="px-3 py-3 text-center min-w-[90px]" style={{ background: 'white' }}>
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[11px] font-bold" style={{ color: roleColor(idx) }}>{role.roleName}</span>
                          {changes[role.roleId] && (
                            <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 rounded-full animate-pulse">edited</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupedPermissions.map(group => {
                    const collapsed = collapsedGroups[group.name];
                    return (
                      <React.Fragment key={group.name}>
                        <tr onClick={() => toggleGroup(group.name)}
                          className="cursor-pointer hover:bg-[#EBF4FF] transition-colors"
                          style={{ background: '#F7F8FA', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                          <td className="px-4 py-2 border-r border-[#E2E8F0]"
                            style={{ position: 'sticky', left: 0, zIndex: 10, background: '#F7F8FA' }}>
                            <div className="flex items-center gap-2">
                              {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-[#718096]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#718096]" />}
                              <span className="text-[12px] font-bold text-[#1A202C]">{group.name}</span>
                              <span className="text-[10px] text-[#718096] bg-white border border-[#E2E8F0] px-1.5 py-0.5 rounded-full">{group.permissions.length}</span>
                            </div>
                          </td>
                          <td colSpan={roles.length} style={{ background: '#F7F8FA' }} />
                        </tr>
                        {!collapsed && group.permissions.map(perm => (
                          <tr key={perm.permissionId} className="hover:bg-[#F7FBFF] transition-colors" style={{ borderBottom: '1px solid #E2E8F0' }}>
                            <td className="px-4 py-2.5 border-r border-[#E2E8F0]"
                              style={{ position: 'sticky', left: 0, zIndex: 10, background: 'white' }}>
                              <p className="text-[12px] font-mono font-medium text-[#1A202C]">{perm.permissionName}</p>
                              {perm.description && (
                                <p className="text-[10px] text-[#718096] mt-0.5 truncate max-w-[200px]">{perm.description}</p>
                              )}
                            </td>
                            {roles.map((role, idx) => {
                              const checked = hasPerm(role.roleId, perm.permissionId);
                              const changed = changes[role.roleId]?.[perm.permissionId] !== undefined;
                              const editable = canEditRole(role.roleId);
                              return (
                                <td key={role.roleId} className="px-2 py-2 text-center">
                                  <button onClick={() => togglePerm(role.roleId, perm.permissionId)} disabled={!editable}
                                    className={`w-10 h-10 mx-auto rounded-[8px] flex items-center justify-center border-2 transition-all
                                      ${checked ? 'text-white border-transparent' : 'bg-white border-[#E2E8F0]'}
                                      ${editable ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed opacity-40'}
                                      ${changed ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
                                    style={checked ? { backgroundColor: roleColor(idx) } : {}}>
                                    {checked && <Check className="w-5 h-5" strokeWidth={3} />}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-4 text-[12px] text-[#718096] pt-1">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-[4px] bg-[#2B6CB0] flex items-center justify-center">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
          <span>Granted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-[4px] border-2 border-[#E2E8F0] bg-white" />
          <span>Not granted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-[4px] border-2 border-[#E2E8F0] bg-amber-50 ring-2 ring-amber-400 ring-offset-1" />
          <span>Unsaved change</span>
        </div>
      </div>

    </div>
  );
}
