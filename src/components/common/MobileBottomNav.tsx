import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, Radio,
  Warehouse, MoreHorizontal, FileText,
} from "lucide-react";

/**
 * MobileBottomNav — Dark pill style (sesuai mockup)
 * - Dark background: #1A1A2E / #111827
 * - Active: orange pill background #D94F2B with white icon+text
 * - Inactive: gray icon+text
 * - Height: 72px
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
    paths: ["/radio-internal", "/radio-contractor", "/radio-unit", "/radio-scrap", "/radio-repair-dashboard", "/radio-handover", "/fleet-statistics"],
    navigate: "/radio-internal",
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
  paths: ["/warehouse"],
  navigate: "/warehouse/borrow-history",
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
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden pb-safe"
      style={{ background: '#111827' }}
      aria-label="Bottom navigation"
    >
      <div className="flex items-center px-3 py-2 gap-1" style={{ height: 64 }}>
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => nav(tab.navigate)}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-150 rounded-[12px] py-1.5"
              style={{
                backgroundColor: active ? '#D94F2B' : 'transparent',
                minWidth: 0,
              }}
            >
              <Icon
                className="w-5 h-5 flex-shrink-0"
                style={{ color: active ? '#FFFFFF' : '#9CA3AF' }}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className="text-[10px] font-medium leading-none truncate"
                style={{ color: active ? '#FFFFFF' : '#9CA3AF' }}
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
          className="flex-1 flex flex-col items-center justify-center gap-1 rounded-[12px] py-1.5 transition-all duration-150"
          style={{
            backgroundColor: isMoreActive ? '#D94F2B' : 'transparent',
            minWidth: 0,
          }}
        >
          <MoreHorizontal
            className="w-5 h-5 flex-shrink-0"
            style={{ color: isMoreActive ? '#FFFFFF' : '#9CA3AF' }}
            strokeWidth={isMoreActive ? 2.5 : 2}
          />
          <span
            className="text-[10px] font-medium leading-none"
            style={{ color: isMoreActive ? '#FFFFFF' : '#9CA3AF' }}
          >
            Lainnya
          </span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
