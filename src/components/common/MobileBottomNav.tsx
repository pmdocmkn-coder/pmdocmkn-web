import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, Radio,
  Warehouse, MoreHorizontal, FileText,
} from "lucide-react";

/**
 * MobileBottomNav — Floating pill style (sesuai mockup)
 * - Floating dengan margin dari tepi layar
 * - Rounded pill shape (rounded-[24px])
 * - Dark background: #1A2744
 * - Active: orange background pill per item dengan garis atas
 * - Inactive: gray icon + label
 */

interface MobileBottomNavProps {
  onMoreClick: () => void;
}

interface NavTab {
  id: string;
  label: string;
  icon: React.ElementType;
  paths: string[];
  navigate: string;
}

const hasPerm = (p: string): boolean => {
  try {
    return (JSON.parse(localStorage.getItem("permissions") ?? "[]") as string[]).includes(p);
  } catch { return false; }
};

const hasAdminAccess = () =>
  hasPerm("letter.view") || hasPerm("companies.view") || hasPerm("document.type.menu");

const hasWarehouseAccess = () =>
  hasPerm("warehouse.borrow.view") || hasPerm("warehouse.borrow.create") || hasPerm("warehouse.borrow.supervise");

const fixedTabs: NavTab[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    paths: ["/dashboard"],
    navigate: "/dashboard",
  },
  {
    id: "pm",
    label: "PM",
    icon: CalendarDays,
    paths: ["/pm-schedule", "/kpi-tracking", "/inspeksi-kpc", "/nec-history", "/link-internal", "/swr-signal"],
    navigate: "/pm-schedule",
  },
  {
    id: "radio",
    label: "Radio",
    icon: Radio,
    paths: ["/radio", "/radio-internal", "/radio-contractor", "/radio-unit", "/radio-scrap", "/radio-repair-dashboard", "/radio-handover", "/fleet-statistics"],
    navigate: "/radio",
  },
];

const adminTab: NavTab = {
  id: "administration",
  label: "Admin",
  icon: FileText,
  paths: ["/letter-numbers", "/companies", "/document-types"],
  navigate: "/letter-numbers",
};

const warehouseTab: NavTab = {
  id: "warehouse",
  label: "Warehouse",
  icon: Warehouse,
  paths: ["/warehouse", "/warehouse/borrow-history", "/warehouse/borrow-request", "/warehouse/supervision", "/warehouse/catalog"],
  navigate: "/warehouse",
};

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onMoreClick }) => {
  const location = useLocation();
  const nav = useNavigate();

  const tab4 = hasAdminAccess() && !hasWarehouseAccess() ? adminTab : warehouseTab;
  const tabs = [...fixedTabs, tab4];

  const isActive = (tab: NavTab) =>
    tab.paths.some(p => location.pathname === p || location.pathname.startsWith(p + "/"));

  const isMoreActive = !tabs.some(t => isActive(t)) && location.pathname !== "/dashboard";

  return (
    /* Floating container — margin dari tepi, tidak full-width */
    <nav
      className="fixed left-3 right-3 z-40 md:hidden"
      style={{
        bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        willChange: 'transform',
      }}
      aria-label="Bottom navigation"
    >
      {/* Pill container */}
      <div
        className="flex items-center px-2 py-2 gap-1"
        style={{
          background: '#1A2744',
          borderRadius: 24,
          height: 68,
          boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        {tabs.map(tab => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => nav(tab.navigate)}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-200 pt-1"
              style={{ minWidth: 0, height: 52 }}
            >
              {/* Active top orange bar */}
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
                  style={{ width: 28, height: 3, backgroundColor: '#D94F2B' }}
                />
              )}
              <Icon
                className="w-5 h-5 flex-shrink-0"
                style={{ color: active ? '#D94F2B' : '#8B9EC8' }}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className="text-[10px] font-semibold leading-none truncate"
                style={{ color: active ? '#D94F2B' : '#8B9EC8' }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* More button */}
        <button
          onClick={onMoreClick}
          aria-label="Lebih banyak menu"
          className="flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200"
          style={{
            minWidth: 0,
            height: 52,
            borderRadius: 16,
            backgroundColor: isMoreActive ? '#D94F2B' : 'transparent',
          }}
        >
          <MoreHorizontal
            className="w-5 h-5 flex-shrink-0"
            style={{ color: isMoreActive ? '#FFFFFF' : '#8B9EC8' }}
            strokeWidth={isMoreActive ? 2.5 : 2}
          />
          <span
            className="text-[10px] font-semibold leading-none"
            style={{ color: isMoreActive ? '#FFFFFF' : '#8B9EC8' }}
          >
            Lainnya
          </span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
