// components/SettingsPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Shield,
  Users,
  Key,
  UserCog,
  Building2,
  ScrollText,
} from 'lucide-react';
import PermissionsTab from './settings/PermissionsTab';
import RolesTab from './settings/RolesTab';
import RolePermissionsTab from './settings/RolePermissionsTab';
import UsersManagementTab from './settings/UsersManagementTab';
import DivisionsTab from './settings/DivisionsTab';
import ActivityLogTab from './settings/ActivityLogTab';
import { hasPermission } from '../utils/permissionUtils';

type TabType = 'permissions' | 'roles' | 'role-permissions' | 'users' | 'divisions' | 'activity-logs';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('permissions');

  // ✅ FILTER TABS BASED ON PERMISSION
  const tabs = [
    {
      id: 'permissions' as TabType,
      name: 'Permissions',
      icon: Key,
      description: 'Kelola daftar permission',
      permission: 'system.permission.view',
    },
    {
      id: 'roles' as TabType,
      name: 'Roles',
      icon: Shield,
      description: 'Kelola role pengguna',
      permission: 'system.role.view',
    },
    {
      id: 'role-permissions' as TabType,
      name: 'Role Permissions',
      icon: UserCog,
      description: 'Atur permission untuk setiap role',
      permission: 'system.role.permission.view',
    },
    {
      id: 'users' as TabType,
      name: 'User Management',
      icon: Users,
      description: 'Kelola pengguna dan aktivasi akun',
      permission: 'system.user.management.view',
    },
    {
      id: 'divisions' as TabType,
      name: 'Divisions',
      icon: Building2,
      description: 'Kelola data divisi',
      permission: 'system.division.view',
    },
    {
      id: 'activity-logs' as TabType,
      name: 'Audit Logs',
      icon: ScrollText,
      description: 'Riwayat aktivitas pengguna',
      permission: 'system.audit.view',
    },
  ].filter(tab => hasPermission(tab.permission));

  // ✅ CEK PERMISSION HALAMAN (Bisa akses jika punya minimal salah satu permission tab)
  if (tabs.length === 0) {
    return <Navigate to="/dashboard" replace />;
  }

  // ✅ REDIRECT IF ACTIVE TAB IS NOT ALLOWED
  if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
    setActiveTab(tabs[0].id);
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'permissions':
        return <PermissionsTab />;
      case 'roles':
        return <RolesTab />;
      case 'role-permissions':
        return <RolePermissionsTab />;
      case 'users':
        return <UsersManagementTab />;
      case 'divisions':
        return <DivisionsTab />;
      case 'activity-logs':
        return <ActivityLogTab />;
      default:
        return <PermissionsTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Kelola permission, role, dan pengguna sistem
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center p-4 border-b sm:border-b-0 sm:border-r border-gray-200 transition-colors ${isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-semibold text-sm">{tab.name}</p>
                    <p className="text-xs opacity-75 hidden lg:block">
                      {tab.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}