import React from "react";
import { useNavigate } from "react-router-dom";
import {
  History, PackagePlus, ClipboardCheck, Database,
  Warehouse, ChevronRight, Home,
} from "lucide-react";
import { MobilePageHeader } from "../ui/MobilePageHeader";
import { hasPermission } from "../../utils/permissionUtils";

// ─── Sub-menu definitions ─────────────────────────────────────────────────────

interface WarehouseMenuItem {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  permission: string[]; // Use array of permissions for 'anyOf' logic if needed, or single string. App.tsx uses anyOf mostly.
}

const WAREHOUSE_MENUS: WarehouseMenuItem[] = [
  {
    id: "warehouse-history",
    name: "Histori Peminjaman",
    description: "Riwayat permintaan dan transaksi tools",
    path: "/warehouse/borrow-history",
    icon: History,
    iconBg: "bg-[#EBF4FF]",
    iconColor: "text-[#2B6CB0]",
    permission: ["warehouse.borrow.menu", "warehouse.borrow.view"],
  },
  {
    id: "warehouse-request",
    name: "Ajuan Pinjam Tools",
    description: "Formulir peminjaman tools baru",
    path: "/warehouse/borrow-request",
    icon: PackagePlus,
    iconBg: "bg-[#F0FFF4]",
    iconColor: "text-[#059669]",
    permission: ["warehouse.borrow.menu", "warehouse.borrow.create"],
  },
  {
    id: "warehouse-supervision",
    name: "Supervisi Warehouse",
    description: "Persetujuan dan monitoring peminjaman",
    path: "/warehouse/supervision",
    icon: ClipboardCheck,
    iconBg: "bg-[#FFFBEB]",
    iconColor: "text-[#F59E0B]",
    permission: ["warehouse.borrow.supervise"],
  },
  {
    id: "warehouse-catalog",
    name: "Master Data Tools",
    description: "Katalog tools dan sparepart warehouse",
    path: "/warehouse/catalog",
    icon: Database,
    iconBg: "bg-[#F3E8FF]",
    iconColor: "text-[#7E22CE]",
    permission: ["warehouse.borrow.supervise", "warehouse.menu.tools"],
  },
];

// Helper for permission check
const hasAnyPermission = (permissions: string[]) => {
  return permissions.some(p => hasPermission(p));
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WarehouseHubPage() {
  const navigate = useNavigate();

  const visibleMenus = WAREHOUSE_MENUS.filter(m => hasAnyPermission(m.permission));

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
        label="Warehouse"
        title="Warehouse Management"
        subtitle="Kelola tools, peminjaman, dan master data"
        icon={<Warehouse className="w-5 h-5 text-[#2B6CB0]" strokeWidth={2} />}
        iconBg="bg-[#EBF4FF]"
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
              className="w-full flex items-center gap-4 px-4 py-3.5 bg-white rounded-[10px] border border-[#E2E8F0] shadow-sm hover:border-[#2B6CB0] hover:bg-[#F8FAFC] transition-colors text-left active:scale-[0.98]"
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
        <div className="w-16 h-16 rounded-[14px] bg-[#EBF4FF] flex items-center justify-center mb-4">
          <Warehouse className="w-8 h-8 text-[#2B6CB0]" />
        </div>
        <h2 className="text-lg font-bold text-[#1A202C] mb-2">Warehouse Management</h2>
        <p className="text-[13px] text-[#718096] mb-4">Gunakan sidebar untuk navigasi menu Warehouse pada desktop.</p>
        <button
          onClick={() => navigate("/warehouse/borrow-history")}
          className="px-4 py-2 bg-[#1B3A6B] text-white rounded-[10px] text-sm font-semibold hover:bg-[#2B6CB0] transition-colors"
        >
          Buka Histori Peminjaman
        </button>
      </div>
    </div>
  );
}
