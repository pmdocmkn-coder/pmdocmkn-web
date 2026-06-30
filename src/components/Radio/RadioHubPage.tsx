import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Radio, Building2, Wifi, Trash2, Wrench,
  Package, Warehouse, TrendingUp, ChevronRight, Home,
} from "lucide-react";
import { MobilePageHeader } from "../ui/MobilePageHeader";
import { hasPermission } from "../../utils/permissionUtils";

// ─── Sub-menu definitions ─────────────────────────────────────────────────────

interface RadioMenuItem {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  permission: string;
}

const RADIO_MENUS: RadioMenuItem[] = [
  {
    id: "radio-handover",
    name: "Serah Terima Radio",
    description: "Proses serah terima radio antar divisi",
    path: "/radio-handover",
    icon: Package,
    iconBg: "bg-[#F0F4FF]",
    iconColor: "text-[#1B3A6B]",
    permission: "radio.handover.menu",
  },
  {
    id: "radio-repair",
    name: "Dashboard Perbaikan",
    description: "Kelola perbaikan dan workshop radio",
    path: "/radio-repair-dashboard",
    icon: Wrench,
    iconBg: "bg-[#FFFBEB]",
    iconColor: "text-[#F59E0B]",
    permission: "radio.repair.menu",
  },

  {
    id: "radio-warehouse",
    name: "Radio Masuk WH",
    description: "Radio yang masuk ke warehouse",
    path: "/radio-handover/warehouse",
    icon: Warehouse,
    iconBg: "bg-[#F0FFF4]",
    iconColor: "text-[#059669]",
    permission: "radio.handover.view",
  },
  {
    id: "radio-kpc",
    name: "Radio KPC",
    description: "Kelola data dan status radio KPC",
    path: "/radio-internal",
    icon: Radio,
    iconBg: "bg-[#FFF0EC]",
    iconColor: "text-[#D94F2B]",
    permission: "radio.kpc.menu",
  },
  {
    id: "radio-contractor",
    name: "Radio Contractor",
    description: "Data radio kontraktor",
    path: "/radio-contractor",
    icon: Building2,
    iconBg: "bg-[#EBF4FF]",
    iconColor: "text-[#2B6CB0]",
    permission: "radio.view",
  },
  {
    id: "radio-unit",
    name: "Radio Unit",
    description: "Data radio per unit",
    path: "/radio-unit",
    icon: Wifi,
    iconBg: "bg-[#F0FFF4]",
    iconColor: "text-[#059669]",
    permission: "radio.view",
  },
  {
    id: "radio-scrap",
    name: "Radio Scrap",
    description: "Radio yang di-scrap",
    path: "/radio-scrap",
    icon: Trash2,
    iconBg: "bg-[#FEF2F2]",
    iconColor: "text-[#DC2626]",
    permission: "radio.scrap.view",
  },
  {
    id: "fleet-statistics",
    name: "Fleet Statistics",
    description: "Statistik dan analisis data fleet",
    path: "/fleet-statistics",
    icon: TrendingUp,
    iconBg: "bg-[#EBF4FF]",
    iconColor: "text-[#2B6CB0]",
    permission: "fleet.menu",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RadioHubPage() {
  const navigate = useNavigate();

  const visibleMenus = RADIO_MENUS.filter(m => hasPermission(m.permission));

  // Jika hanya 1 menu visible, langsung redirect
  if (visibleMenus.length === 1) {
    navigate(visibleMenus[0].path, { replace: true });
    return null;
  }

  // Jika tidak ada menu visible, kembali ke dashboard
  if (visibleMenus.length === 0) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* ── Mobile: Header ── */}
      <MobilePageHeader
        label="Radio & Fleet"
        title="Radio Management"
        subtitle="Kelola data radio dan fleet"
        icon={<Radio className="w-5 h-5 text-[#D94F2B]" strokeWidth={2} />}
        iconBg="bg-[#FFF0EC]"
        rightAction={
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-[#F7F8FA] border border-[#E2E8F0] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors flex-shrink-0"
            aria-label="Kembali ke Dashboard"
          >
            <Home className="h-4 w-4" strokeWidth={2.5} />
          </button>
        }
      />

      {/* ── Mobile: Menu list ── */}
      <div className="md:hidden space-y-3">
        <p className="text-[11px] text-[#718096] font-medium px-1">Pilih menu untuk dikelola</p>
        {visibleMenus.map(menu => {
          const Icon = menu.icon;
          return (
            <button
              key={menu.id}
              onClick={() => navigate(menu.path)}
              className="w-full flex items-center gap-4 px-4 py-3.5 bg-white rounded-[10px] border border-[#E2E8F0] shadow-sm hover:border-[#D94F2B] hover:bg-[#FFFAF8] transition-colors text-left active:scale-[0.98]"
            >
              <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${menu.iconBg}`}>
                <Icon className={`w-5 h-5 ${menu.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#1A202C]">{menu.name}</p>
                <p className="text-[12px] text-[#718096] mt-0.5 truncate">{menu.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#CBD5E0] flex-shrink-0" />
            </button>
          );
        })}
      </div>

      {/* ── Desktop: Redirect info (desktop users use sidebar, not this page) ── */}
      <div className="hidden md:flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-[14px] bg-[#FFF0EC] flex items-center justify-center mb-4">
          <Radio className="w-8 h-8 text-[#D94F2B]" />
        </div>
        <h2 className="text-lg font-bold text-[#1A202C] mb-2">Radio & Fleet</h2>
        <p className="text-[13px] text-[#718096] mb-4">Gunakan sidebar untuk navigasi menu Radio pada desktop.</p>
        <button
          onClick={() => navigate("/radio-internal")}
          className="px-4 py-2 bg-[#1B3A6B] text-white rounded-[10px] text-sm font-semibold hover:bg-[#2B6CB0] transition-colors"
        >
          Buka Radio KPC
        </button>
      </div>
    </div>
  );
}
