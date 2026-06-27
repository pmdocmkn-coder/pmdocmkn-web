import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Shield, Users, Key, UserCog, Building2, ScrollText,
  ChevronRight, ArrowLeft, Settings,
} from 'lucide-react';
import PermissionsTab from './settings/PermissionsTab';
import RolesTab from './settings/RolesTab';
import RolePermissionsTab from './settings/RolePermissionsTab';
import UsersManagementTab from './settings/UsersManagementTab';
import DivisionsTab from './settings/DivisionsTab';
import ActivityLogTab from './settings/ActivityLogTab';
import { hasPermission } from '../utils/permissionUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId =
  | 'permissions' | 'roles' | 'role-permissions'
  | 'users' | 'divisions' | 'activity-logs';

interface TabDef {
  id: TabId;
  name: string;
  icon: React.ElementType;
  description: string;
  permission: string;
  iconBg: string;
  iconColor: string;
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS: TabDef[] = [
  {
    id: 'permissions',
    name: 'Permissions',
    icon: Key,
    description: 'Kelola daftar permission sistem',
    permission: 'system.permission.view',
    iconBg: 'bg-[#EBF4FF]',
    iconColor: 'text-[#2B6CB0]',
  },
  {
    id: 'roles',
    name: 'Roles',
    icon: Shield,
    description: 'Kelola role pengguna',
    permission: 'system.role.view',
    iconBg: 'bg-[#F0FFF4]',
    iconColor: 'text-[#059669]',
  },
  {
    id: 'role-permissions',
    name: 'Role Permissions',
    icon: UserCog,
    description: 'Atur permission untuk setiap role',
    permission: 'system.role.permission.view',
    iconBg: 'bg-[#FFF7ED]',
    iconColor: 'text-[#D94F2B]',
  },
  {
    id: 'users',
    name: 'User Management',
    icon: Users,
    description: 'Kelola pengguna dan aktivasi akun',
    permission: 'system.user.management.view',
    iconBg: 'bg-[#F0F4FF]',
    iconColor: 'text-[#1B3A6B]',
  },
  {
    id: 'divisions',
    name: 'Divisions',
    icon: Building2,
    description: 'Kelola data divisi organisasi',
    permission: 'system.division.view',
    iconBg: 'bg-[#F0FFF4]',
    iconColor: 'text-[#059669]',
  },
  {
    id: 'activity-logs',
    name: 'Audit Logs',
    icon: ScrollText,
    description: 'Riwayat aktivitas pengguna',
    permission: 'system.audit.view',
    iconBg: 'bg-[#FFFBEB]',
    iconColor: 'text-[#F59E0B]',
  },
];

// ─── Tab content renderer ─────────────────────────────────────────────────────

function TabContent({ id }: { id: TabId }) {
  switch (id) {
    case 'permissions':      return <PermissionsTab />;
    case 'roles':            return <RolesTab />;
    case 'role-permissions': return <RolePermissionsTab />;
    case 'users':            return <UsersManagementTab />;
    case 'divisions':        return <DivisionsTab />;
    case 'activity-logs':    return <ActivityLogTab />;
    default:                 return null;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [mobileActive, setMobileActive] = useState<TabId | null>(null);
  const [desktopActive, setDesktopActive] = useState<TabId>('permissions');

  const visibleTabs = TABS.filter(t => hasPermission(t.permission));

  if (visibleTabs.length === 0) {
    return <Navigate to="/dashboard" replace />;
  }

  const validDesktop = visibleTabs.find(t => t.id === desktopActive)
    ? desktopActive
    : visibleTabs[0].id;

  const activeDesktopTab = visibleTabs.find(t => t.id === validDesktop)!;
  const activeMobileTab = visibleTabs.find(t => t.id === mobileActive);

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {/* ── MOBILE: Header ── */}
      <div className="md:hidden sticky top-0 z-10 bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center gap-3">
        {mobileActive ? (
          <button
            onClick={() => setMobileActive(null)}
            className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-[#F7F8FA] border border-[#E2E8F0] text-[#718096] flex-shrink-0"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-[#1B3A6B] flex-shrink-0">
            <Settings className="w-4 h-4 text-white" />
          </div>
        )}
        <div>
          <p className="text-[10px] font-semibold text-[#2B6CB0] uppercase tracking-wider">System</p>
          <h1 className="text-[16px] font-bold text-[#1A202C] leading-none">
            {mobileActive ? (activeMobileTab?.name ?? 'Settings') : 'Settings'}
          </h1>
        </div>
      </div>

      {/* ── MOBILE: Menu list ── */}
      {mobileActive === null && (
        <div className="md:hidden px-4 py-4 space-y-2">
          <p className="text-[11px] text-[#718096] font-medium px-1 mb-3">Pilih menu untuk dikonfigurasi</p>
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setMobileActive(tab.id)}
                className="w-full flex items-center gap-4 px-4 py-3.5 bg-white rounded-[10px] border border-[#E2E8F0] shadow-sm hover:border-[#2B6CB0] hover:bg-[#F7FBFF] transition-colors text-left active:scale-[0.98]"
              >
                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${tab.iconBg}`}>
                  <Icon className={`w-5 h-5 ${tab.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#1A202C]">{tab.name}</p>
                  <p className="text-[12px] text-[#718096] mt-0.5 truncate">{tab.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#CBD5E0] flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* ── MOBILE: Tab content ── */}
      {mobileActive !== null && (
        <div className="md:hidden px-4 py-4">
          {activeMobileTab && (
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${activeMobileTab.iconBg}`}>
                <activeMobileTab.icon className={`w-4 h-4 ${activeMobileTab.iconColor}`} />
              </div>
              <p className="text-[12px] text-[#718096]">{activeMobileTab.description}</p>
            </div>
          )}
          <div className="bg-white rounded-[10px] border border-[#E2E8F0] shadow-sm p-4">
            <TabContent id={mobileActive} />
          </div>
        </div>
      )}

      {/* ── DESKTOP: Header ── */}
      <div className="hidden md:flex items-center gap-3 px-6 pt-6 pb-4">
        <div className="w-10 h-10 rounded-[10px] bg-[#1B3A6B] flex items-center justify-center flex-shrink-0">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1A202C]">Settings</h1>
          <p className="text-[13px] text-[#718096]">Kelola permission, role, dan pengguna sistem</p>
        </div>
      </div>

      {/* ── DESKTOP: Side-by-side ── */}
      <div className="hidden md:flex gap-5 px-6 pb-8">
        {/* Left: Tab sidebar */}
        <div className="w-56 flex-shrink-0">
          <nav className="bg-white rounded-[10px] border border-[#E2E8F0] shadow-sm overflow-hidden">
            {visibleTabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = validDesktop === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDesktopActive(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors relative
                    ${idx < visibleTabs.length - 1 ? 'border-b border-[#E2E8F0]' : ''}
                    ${isActive
                      ? 'bg-[#EBF4FF] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[#D94F2B] before:rounded-r'
                      : 'hover:bg-[#F7F8FA]'
                    }`}
                >
                  <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 ${isActive ? tab.iconBg : 'bg-[#F7F8FA]'}`}>
                    <Icon className={`w-4 h-4 ${isActive ? tab.iconColor : 'text-[#718096]'}`} />
                  </div>
                  <span className={`text-[13px] font-semibold truncate ${isActive ? 'text-[#1B3A6B]' : 'text-[#1A202C]'}`}>
                    {tab.name}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Content panel */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${activeDesktopTab.iconBg}`}>
              <activeDesktopTab.icon className={`w-4 h-4 ${activeDesktopTab.iconColor}`} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1A202C]">{activeDesktopTab.name}</h2>
              <p className="text-[12px] text-[#718096]">{activeDesktopTab.description}</p>
            </div>
          </div>
          <div className="bg-white rounded-[10px] border border-[#E2E8F0] shadow-sm p-5">
            <TabContent id={validDesktop} />
          </div>
        </div>
      </div>
    </div>
  );
}
