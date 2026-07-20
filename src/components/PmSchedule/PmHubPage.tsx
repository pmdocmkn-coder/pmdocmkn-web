import React from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import {
  CalendarDays, ClipboardList, TrendingUp, Link2,
  Radio, ShieldAlert, ChevronRight, Home,
} from "lucide-react";
import { MobilePageHeader } from "../ui/MobilePageHeader";
import { hasPermission } from "../../utils/permissionUtils";

// ─── Sub-menu definitions ─────────────────────────────────────────────────────

interface PmMenuItem {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  permission: string;
}

const PM_MENUS: PmMenuItem[] = [
  {
    id: "pm-schedule",
    name: "PM Schedule",
    description: "Jadwal preventive maintenance tahunan",
    path: "/pm-schedule",
    icon: CalendarDays,
    iconBg: "bg-[#EBF4FF]",
    iconColor: "text-[#2B6CB0]",
    permission: "pmschedule.menu",
  },
  {
    id: "kpi-tracking",
    name: "KPI Tracking",
    description: "Pantau pencapaian KPI divisi",
    path: "/kpi-tracking",
    icon: ClipboardList,
    iconBg: "bg-[#F0FFF4]",
    iconColor: "text-[#059669]",
    permission: "kpi.view",
  },
  {
    id: "inspeksi-kpc",
    name: "Inspeksi KPC",
    description: "Inspeksi dan monitoring KPC",
    path: "/inspeksi-kpc",
    icon: ClipboardList,
    iconBg: "bg-[#FFF0EC]",
    iconColor: "text-[#D94F2B]",
    permission: "inspeksi.menu",
  },
  {
    id: "nec-history",
    name: "NEC History",
    description: "Riwayat Network Equipment Check",
    path: "/nec-history",
    icon: TrendingUp,
    iconBg: "bg-[#FFFBEB]",
    iconColor: "text-[#F59E0B]",
    permission: "nec.histori.menu",
  },
  {
    id: "link-internal",
    name: "Link Internal",
    description: "Kelola link internal perusahaan",
    path: "/link-internal",
    icon: Link2,
    iconBg: "bg-[#EBF4FF]",
    iconColor: "text-[#2B6CB0]",
    permission: "internal.link.menu",
  },
  {
    id: "swr-signal",
    name: "SWR Signal",
    description: "Monitoring SWR & kualitas sinyal",
    path: "/swr-signal",
    icon: Radio,
    iconBg: "bg-[#F0F4FF]",
    iconColor: "text-[#1B3A6B]",
    permission: "swr.signal.menu",
  },
  {
    id: "operational-documents",
    name: "Monitoring Dokumen",
    description: "Kelola dokumen operasional",
    path: "/operational-documents",
    icon: ShieldAlert,
    iconBg: "bg-[#FEF2F2]",
    iconColor: "text-[#DC2626]",
    permission: "operationaldocument.menu",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PmHubPage() {
  const navigate = useNavigate();

  const visibleMenus = PM_MENUS.filter(m => hasPermission(m.permission));

  // Jika hanya 1 menu visible, langsung redirect
  if (visibleMenus.length === 1) {
    return <Navigate to={visibleMenus[0].path} replace />;
  }

  // Jika tidak ada menu visible, kembali ke dashboard
  if (visibleMenus.length === 0) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* ── Mobile: Header ── */}
      <MobilePageHeader
        label="PM Management"
        title="PM & Monitoring"
        subtitle="Kelola jadwal PM, inspeksi & monitoring"
        icon={<CalendarDays className="w-5 h-5 text-[#2B6CB0]" strokeWidth={2} />}
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
            <Link
              key={menu.id}
              to={menu.path}
              className="w-full flex items-center gap-4 px-4 py-3.5 bg-white rounded-[10px] border border-[#E2E8F0] shadow-sm hover:border-[#2B6CB0] hover:bg-[#F0F7FF] transition-colors text-left active:scale-[0.98]"
            >
              <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${menu.iconBg}`}>
                <Icon className={`w-5 h-5 ${menu.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#1A202C]">{menu.name}</p>
                <p className="text-[12px] text-[#718096] mt-0.5 truncate">{menu.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#CBD5E0] flex-shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* ── Desktop: Redirect info (desktop users use sidebar, not this page) ── */}
      <div className="hidden md:flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-[14px] bg-[#EBF4FF] flex items-center justify-center mb-4">
          <CalendarDays className="w-8 h-8 text-[#2B6CB0]" />
        </div>
        <h2 className="text-lg font-bold text-[#1A202C] mb-2">PM Management</h2>
        <p className="text-[13px] text-[#718096] mb-4">Gunakan sidebar untuk navigasi menu PM pada desktop.</p>
        <button
          onClick={() => navigate("/pm-schedule")}
          className="px-4 py-2 bg-[#1B3A6B] text-white rounded-[10px] text-sm font-semibold hover:bg-[#2B6CB0] transition-colors"
        >
          Buka PM Schedule
        </button>
      </div>
    </div>
  );
}
