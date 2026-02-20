import React, { useState, useEffect, useMemo } from 'react';
import { rolePermissionApi, roleApi, permissionApi } from '../../services/api';
import { RolePermissionMatrix, Role, Permission } from '../../types/permission';
import { Save, RefreshCw, X, Search, ChevronDown, ChevronRight, CheckSquare, Square, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission as hasUserPermission } from '../../utils/permissionUtils';

type ViewMode = 'matrix' | 'list';

export default function RolePermissionsTab() {
  const [matrix, setMatrix] = useState<RolePermissionMatrix[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [changes, setChanges] = useState<{ [roleId: number]: { [permissionId: number]: boolean } }>({});

  // UI States
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // AMBIL USER YANG SEDANG LOGIN
  const { user } = useAuth();
  const isSuperAdmin = user?.roleName === "Super Admin";

  // HELPER: BISA EDIT ROLE?
  const canEditRole = (roleId: number): boolean => {
    // Super Admin (ID 1) hanya bisa diedit oleh Super Admin asli
    if (roleId === 1 && !isSuperAdmin) return false;

    // User lain butuh permission edit
    return hasUserPermission("role.permission.edit");
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matrixData, rolesData, permissionsData] = await Promise.all([
        rolePermissionApi.getMatrix(),
        roleApi.getAll(),
        permissionApi.getAll(),
      ]);

      setMatrix(matrixData);
      setRoles(rolesData);
      setPermissions(permissionsData);
      setChanges({});

      // Default select first role if not set
      if (!selectedRoleId && rolesData.length > 0) {
        setSelectedRoleId(rolesData[0].roleId);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Gagal memuat data' });
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (roleId: number, permissionId: number): boolean => {
    if (changes[roleId]?.[permissionId] !== undefined) return changes[roleId][permissionId];
    const roleMatrix = matrix.find(m => m.roleId === roleId);
    const perm = roleMatrix?.permissions.find(p => p.permissionId === permissionId);
    return perm?.isAssigned === true;
  };

  const togglePermission = (roleId: number, permissionId: number) => {
    const current = hasPermission(roleId, permissionId);
    setChanges(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [permissionId]: !current,
      },
    }));
  };

  const toggleGroupPermission = (roleId: number, permissionsInGroup: Permission[], targetValue: boolean) => {
    const newChanges = { ...changes };
    if (!newChanges[roleId]) newChanges[roleId] = {};

    permissionsInGroup.forEach(p => {
      // Only update if current value differs from target
      if (hasPermission(roleId, p.permissionId) !== targetValue) {
        newChanges[roleId][p.permissionId] = targetValue;
      }
    });

    setChanges(newChanges);
  };

  const hasChanges = () => Object.keys(changes).length > 0;

  const handleSaveChanges = async () => {
    if (!hasChanges()) return setMessage({ type: 'error', text: 'Tidak ada perubahan' });

    setSaving(true);
    try {
      for (const [roleIdStr, perms] of Object.entries(changes)) {
        const roleId = parseInt(roleIdStr);
        const current = matrix.find(m => m.roleId === roleId)?.permissions
          .filter(p => p.isAssigned).map(p => p.permissionId) || [];

        const updated = new Set(current);
        Object.entries(perms).forEach(([pid, enabled]) => {
          const id = parseInt(pid);
          enabled ? updated.add(id) : updated.delete(id);
        });

        await rolePermissionApi.assignPermissions(roleId, Array.from(updated));
      }

      setMessage({ type: 'success', text: 'Semua perubahan berhasil disimpan!' });
      setChanges({});
      await fetchData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Gagal menyimpan' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (hasChanges() && !confirm('Batalkan semua perubahan?')) return;
    setChanges({});
    setMessage(null);
  };

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Grouping & Filtering Logic
  const groupedPermissions = useMemo(() => {
    const filtered = permissions.filter(p =>
      p.permissionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.group && p.group.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const groups: Record<string, Permission[]> = {};

    filtered.forEach(p => {
      const groupName = p.group || 'Other';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(p);
    });

    // Sort groups alphabetically, put 'Other' last
    return Object.keys(groups).sort((a, b) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
    }).map(groupName => ({
      name: groupName,
      permissions: groups[groupName]
    }));
  }, [permissions, searchTerm]);


  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  // Helper for List View
  const activeRole = roles.find(r => r.roleId === selectedRoleId) || roles[0];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Role Permission Matrix</h2>
            <p className="text-sm text-gray-600 mt-1">Kelola permission per role dengan mudah</p>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges() && (
              <>
                <button onClick={handleReset} disabled={saving} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-2 disabled:opacity-50 text-sm font-medium transition-colors">
                  <RefreshCw className="w-4 h-4" /> Reset
                </button>
                <button onClick={handleSaveChanges} disabled={saving} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:bg-blue-400 text-sm font-medium shadow-sm transition-colors">
                  {saving ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
          {/* View Toggle */}
          <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'matrix' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Matrix View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" /> Role View
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari permission atau group..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg border flex items-center justify-between ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}><X className="w-5 h-5" /></button>
        </div>
      )}

      {hasChanges() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800"><strong>Perhatian:</strong> Ada {Object.keys(changes).length} role dengan perubahan belum disimpan.</p>
        </div>
      )}

      {/* VIEW: LIST (ROLE-CENTRIC) */}
      {viewMode === 'list' && activeRole && (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Role Selection */}
          <div className="w-full md:w-64 flex-none space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-2">Select Role</label>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {roles.map(role => (
                <button
                  key={role.roleId}
                  onClick={() => setSelectedRoleId(role.roleId)}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${selectedRoleId === role.roleId ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-700 font-medium' : 'text-gray-700 border-l-4 border-transparent'}`}
                >
                  <span>{role.roleName}</span>
                  {role.roleId === 1 && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">SA</span>}
                  {changes[role.roleId] && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />}
                </button>
              ))}
            </div>
          </div>

          {/* Permission List for Selected Role */}
          <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{activeRole.roleName} Permissions</h3>
                <p className="text-sm text-gray-500">Mengelola {groupedPermissions.reduce((acc, g) => acc + g.permissions.length, 0)} permissions</p>
              </div>
            </div>

            <div className="dividing-y divide-gray-100">
              {groupedPermissions.map(group => {
                const isCollapsed = collapsedGroups[group.name];
                // Check status for group select all
                const allChecked = group.permissions.every(p => hasPermission(activeRole.roleId, p.permissionId));
                const someChecked = group.permissions.some(p => hasPermission(activeRole.roleId, p.permissionId));
                const editable = canEditRole(activeRole.roleId);

                return (
                  <div key={group.name} className="group">
                    <div className="bg-gray-50/50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleGroup(group.name)}>
                      <div className="flex items-center gap-2">
                        {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        <span className="font-semibold text-gray-700">{group.name}</span>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{group.permissions.length}</span>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          className={`text-xs px-2 py-1 rounded border ${allChecked ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                          onClick={() => editable && toggleGroupPermission(activeRole.roleId, group.permissions, !allChecked)}
                          disabled={!editable}
                        >
                          {allChecked ? 'Unselect All' : 'Select All'}
                        </button>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                        {group.permissions.map(permission => {
                          const checked = hasPermission(activeRole.roleId, permission.permissionId);
                          const changed = changes[activeRole.roleId]?.[permission.permissionId] !== undefined;

                          return (
                            <div
                              key={permission.permissionId}
                              onClick={() => editable && togglePermission(activeRole.roleId, permission.permissionId)}
                              className={`
                                                        flex items-start p-3 rounded-lg border transition-all cursor-pointer
                                                        ${checked ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-300'}
                                                        ${!editable ? 'opacity-50 cursor-not-allowed' : ''}
                                                        ${changed ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}
                                                    `}
                            >
                              <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-none transition-colors ${checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                {checked && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <div className="ml-3">
                                <p className={`text-sm font-medium ${checked ? 'text-blue-900' : 'text-gray-700'}`}>{permission.permissionName}</p>
                                {permission.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{permission.description}</p>}
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
        </div>
      )}


      {/* VIEW: MATRIX (TABLE-CENTRIC) */}
      {viewMode === 'matrix' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[70vh]">
          {/* Sticky Header */}
          <div className="overflow-x-auto custom-scrollbar flex-none z-20 bg-gray-50 border-b border-gray-200">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-gray-50 z-30 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-[300px]">
                    Permission Group
                  </th>
                  {roles.map(role => (
                    <th key={role.roleId} className="px-4 py-4 text-center min-w-[120px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-gray-700 uppercase">{role.roleName}</span>
                        {role.roleId === 1 && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Super Admin</span>}
                        {changes[role.roleId] && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium animate-pulse">Modified</span>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
            </table>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full min-w-[800px]">
              <tbody className="divide-y divide-gray-100">
                {groupedPermissions.length === 0 ? (
                  <tr>
                    <td colSpan={roles.length + 1} className="px-6 py-12 text-center text-gray-500">
                      Tidak ada permission yang cocok dengan pencarian "{searchTerm}"
                    </td>
                  </tr>
                ) : (
                  groupedPermissions.map(group => {
                    const isCollapsed = collapsedGroups[group.name];
                    return (
                      <React.Fragment key={group.name}>
                        {/* Group Header */}
                        <tr
                          onClick={() => toggleGroup(group.name)}
                          className="bg-gray-50/80 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-200"
                        >
                          <td className="sticky left-0 bg-gray-50/80 z-10 px-6 py-3 border-r border-gray-200" colSpan={1}>
                            <div className="flex items-center gap-2 font-semibold text-gray-800">
                              {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                              {group.name}
                              <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                                {group.permissions.length}
                              </span>
                            </div>
                          </td>
                          {/* Blank cells for roles in header row to maintain column alignment if needed, or just colspan */}
                          <td colSpan={roles.length} className="bg-gray-50/80"></td>
                        </tr>

                        {/* Permissions Rows */}
                        {!isCollapsed && group.permissions.map(permission => (
                          <tr key={permission.permissionId} className="hover:bg-blue-50/50 transition-colors group">
                            <td className="sticky left-0 bg-white group-hover:bg-blue-50/50 px-6 py-3 border-r border-gray-100 border-b border-gray-100">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-700">{permission.permissionName}</span>
                                {permission.description && <span className="text-xs text-gray-400 mt-0.5 truncate max-w-[250px]">{permission.description}</span>}
                              </div>
                            </td>
                            {roles.map(role => {
                              const checked = hasPermission(role.roleId, permission.permissionId);
                              const changed = changes[role.roleId]?.[permission.permissionId] !== undefined;
                              const editable = canEditRole(role.roleId);

                              return (
                                <td key={`${role.roleId}-${permission.permissionId}`} className="px-4 py-3 text-center border-b border-gray-100 relative">
                                  <div className="flex items-center justify-center">
                                    <button
                                      onClick={() => editable && togglePermission(role.roleId, permission.permissionId)}
                                      disabled={!editable}
                                      className={`
                                                                    relative flex items-center justify-center w-6 h-6 rounded transition-all duration-200
                                                                    ${!editable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}
                                                                    ${checked
                                          ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                                          : 'bg-white border-2 border-gray-300 text-transparent hover:border-blue-400'
                                        }
                                                                    ${changed ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}
                                                                `}
                                    >
                                      <CheckSquare className={`w-4 h-4 ${checked ? 'opacity-100' : 'opacity-0'}`} />
                                    </button>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-6 text-sm text-gray-600 px-2">
        <div className="flex items-center gap-2"><div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center"><CheckSquare className="w-3 h-3 text-white" /></div><span>Granted</span></div>
        <div className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-gray-300 rounded"></div><span>Not granted</span></div>
        <div className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-yellow-500 rounded bg-yellow-50"></div><span>Unsaved change</span></div>
        <div className="flex items-center gap-2"><div className="w-5 h-5 bg-blue-100 rounded-lg opacity-50 border border-blue-200"></div><span>Super Admin (Locked)</span></div>
      </div>
    </div>
  );
}