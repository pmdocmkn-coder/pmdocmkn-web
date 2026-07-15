import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  ClipboardList, CalendarDays, Radio, Package, Wrench, Video,
  Link2, TrendingUp, BookOpen, Phone, ArrowRight, MapPin,
  Clock, CheckCircle2, AlertTriangle, Info, ChevronRight,
  Warehouse, Database, Upload, FileText, Shield,
} from "lucide-react";
import { radioApi } from "../services/radioApi";
import { radioRepairApi } from "../services/radioRepairApi";
import { warehouseBorrowApi } from "../services/warehouseBorrowApi";
import { internalLinkApi } from "../services/internalLinkService";
import { pmScheduleApi } from "../services/pmScheduleService";
import { kpiApi } from "../services/kpiApi";
import { operationalDocumentApi } from "../services/operationalDocumentApi";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const MONTHS_FULL = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// ─── Permission helper ────────────────────────────────────────────────────────

const hasPerm = (p: string): boolean => {
  try {
    return (JSON.parse(localStorage.getItem("permissions") ?? "[]") as string[]).includes(p);
  } catch { return false; }
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  radioTotal: number | null;
  radioRepairOpen: number | null;
  networkLinks: number | null;
  warehousePending: number | null;
}

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number | null;
  sub: string;
  ring?: string;
  ringValue?: number;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  icon, iconBg, label, value, sub, ring, ringValue, onClick,
}) => (
  <button
    onClick={onClick}
    className="bg-white border border-[#E2E8F0]/80 rounded-[16px] p-5 flex items-center gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] transition-all duration-300 text-left w-full group"
  >
    <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#718096] mb-1">{label}</p>
      <p className="text-[26px] font-extrabold text-[#1A202C] leading-none tracking-tight">
        {value === null ? <span className="text-base text-[#718096]">—</span> : value.toLocaleString("id-ID")}
      </p>
      {sub && <p className="text-[12px] text-[#718096] truncate mt-1">{sub}</p>}
    </div>
    {ringValue !== undefined && (
      <div className="flex-shrink-0 text-right">
        <p className={`text-sm font-bold ${ring}`}>{ringValue}%</p>
      </div>
    )}
    <ChevronRight className="w-5 h-5 text-[#E2E8F0] group-hover:text-[#2B6CB0] transition-colors flex-shrink-0" />
  </button>
);

// ─── Module Card ──────────────────────────────────────────────────────────────

interface ModuleCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  statLabel?: string;
  onClick: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  icon, iconBg, title, description, statLabel, onClick,
}) => (
  <button
    onClick={onClick}
    className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 text-left hover:shadow-md transition-all group flex flex-col h-full"
  >
    <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0 mb-3 ${iconBg}`}>
      {icon}
    </div>
    <p className="text-[14px] font-semibold text-[#1A202C] leading-snug">{title}</p>
    <p className="text-[12px] text-[#718096] mt-1 flex-1 leading-relaxed">{description}</p>
    {statLabel && (
      <p className="text-[11px] text-[#718096] mt-2 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#059669] inline-block" />
        {statLabel}
      </p>
    )}
    <div className="mt-3 flex items-center gap-1 text-[#2B6CB0] text-[13px] font-medium">
      Lihat
      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
    </div>
  </button>
);

// ─── Recent Activity Item ─────────────────────────────────────────────────────

interface ActivityItem {
  type: "success" | "warning" | "info" | "error";
  message: string;
  time: string;
}

const ActivityRow: React.FC<{ item: ActivityItem }> = ({ item }) => {
  const iconMap = {
    success: <CheckCircle2 className="w-4 h-4 text-[#059669]" />,
    warning: <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />,
    info: <Info className="w-4 h-4 text-[#2B6CB0]" />,
    error: <AlertTriangle className="w-4 h-4 text-[#DC2626]" />,
  };
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#E2E8F0] last:border-0">
      <div className="mt-0.5 flex-shrink-0">{iconMap[item.type]}</div>
      <p className="flex-1 text-[13px] text-[#1A202C] leading-snug">{item.message}</p>
      <span className="text-[11px] text-[#718096] flex-shrink-0 font-mono">{item.time}</span>
    </div>
  );
};

// ─── Placeholder Donut (for charts not yet connected to API) ──────────────────

interface PlaceholderChartProps {
  title: string;
  subtitle?: string;
}

const PlaceholderChart: React.FC<PlaceholderChartProps> = ({ title, subtitle }) => (
  <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-5 flex flex-col items-center justify-center min-h-[200px] gap-2">
    <div className="w-16 h-16 rounded-full border-4 border-[#E2E8F0] border-t-[#2B6CB0] opacity-30" />
    <p className="text-[13px] font-semibold text-[#718096]">{title}</p>
    {subtitle && <p className="text-[11px] text-[#718096]">{subtitle}</p>}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AppIcon: React.FC<{ icon: React.ReactNode; iconBg: string; title: string; onClick: () => void }> = ({ icon, iconBg, title, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2.5 group cursor-pointer w-full">
    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] group-hover:shadow-[0_8px_20px_-4px_rgba(43,108,176,0.25)] group-hover:-translate-y-1 transition-all duration-300 ${iconBg}`}>
      {icon}
    </div>
    <span className="text-[11px] md:text-[12px] font-medium text-[#1A202C] text-center leading-tight line-clamp-2 px-1">
      {title}
    </span>
  </button>
);

const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.roleId === 1 || user?.roleId === 2;
  const firstName = user?.fullName?.split(" ")[0] || "User";

  // date/time
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }) + " WIB";

  // Stats state
  const [stats, setStats] = useState<Stats>({
    radioTotal: null,
    radioRepairOpen: null,
    networkLinks: null,
    warehousePending: null,
  });
  const [pmDashboard, setPmDashboard] = useState<any>(null);
  const [kpiDashboard, setKpiDashboard] = useState<{ total: number; selesai: number; pending: number; menunggu: number; pct: number; byArea: { area: string; total: number; selesai: number }[] } | null>(null);
  const [showAllModules, setShowAllModules] = useState(false);
  const [docSummary, setDocSummary] = useState<{ totalDocuments: number; expiringSoon: number; expired: number } | null>(null);

  const go = (tab: string, path: string) => {
    setActiveTab(tab);
    navigate(path);
  };

  // Load stats from available APIs
  useEffect(() => {
    const load = async () => {
      // Radio total
      if (hasPerm("radio.view") || hasPerm("radio.kpc.menu")) {
        try {
          const res = await radioApi.getAll({ page: 1, pageSize: 1, isScrap: false });
          const total = res.data?.meta?.pagination?.totalCount ?? null;
          setStats(s => ({ ...s, radioTotal: total }));
        } catch { /* silent */ }
      }

      // Radio repair open
      if (hasPerm("radio.repair.menu")) {
        try {
          const dash = await radioRepairApi.getDashboard();
          const open = (dash.received ?? 0) + (dash.inProgress ?? 0) + (dash.monitoring ?? 0);
          setStats(s => ({ ...s, radioRepairOpen: open }));
        } catch { /* silent */ }
      }

      // Network links
      if (hasPerm("internal.link.menu")) {
        try {
          const links = await internalLinkApi.getLinks();
          setStats(s => ({ ...s, networkLinks: links.length }));
        } catch { /* silent */ }
      }

      // Warehouse pending borrows
      if (hasPerm("warehouse.borrow.view")) {
        try {
          const pending = await warehouseBorrowApi.getPending();
          setStats(s => ({ ...s, warehousePending: pending.length }));
        } catch { /* silent */ }
      }

      // PM Dashboard — fetch for all logged-in users (API handles auth)
      try {
        const dash = await pmScheduleApi.getComplianceDashboard(new Date().getFullYear());
        setPmDashboard(dash);
      } catch { /* silent */ }

      // KPI Dashboard (bulan ini) — fetch for all logged-in users
      try {
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const res = await kpiApi.getAll({ periodMonth: monthStr, pageSize: 500, page: 1 });
        const docs = res.data?.data ?? [];
        const total = docs.length;
        const selesai = docs.filter((d: any) => d.status?.includes('Selesai') || d.status === 'Approved').length;
        const pending = docs.filter((d: any) => d.status?.includes('Menunggu Sign')).length;
        const menunggu = Math.max(0, total - selesai - pending);
        const pct = total > 0 ? Math.round((selesai / total) * 100) : 0;
        // group by areaGroup
        const areaMap: Record<string, { total: number; selesai: number }> = {};
        docs.forEach((d: any) => {
          const area = d.areaGroup || 'Lainnya';
          if (!areaMap[area]) areaMap[area] = { total: 0, selesai: 0 };
          areaMap[area].total++;
          if (d.status?.includes('Selesai') || d.status === 'Approved') areaMap[area].selesai++;
        });
        const byArea = Object.entries(areaMap).map(([area, v]) => ({
          area: area.length > 12 ? area.substring(0, 12) + '…' : area,
          ...v,
        }));
        setKpiDashboard({ total, selesai, pending, menunggu, pct, byArea });
      } catch { /* silent */ }

      // Operational Document Expiry — fetch for all logged-in users
      try {
        const res = await operationalDocumentApi.getSummary();
        const d = res.data?.data ?? res.data ?? {};
        setDocSummary({
          totalDocuments: d.totalDocuments ?? 0,
          expiringSoon: d.expiringSoon ?? 0,
          expired: d.expired ?? 0,
        });
      } catch { /* silent */ }
    };
    load();
  }, []);

  // Module list — permission filtered
  const allModules = [
    {
      id: "kpi-tracking", title: "KPI Tracking", description: "Pantau performa KPI operasional secara real-time.",
      icon: <ClipboardList className="w-5 h-5 text-white" />, iconBg: "bg-[#2B6CB0]",
      path: "/kpi-tracking", tab: "kpi-tracking", permission: "kpi.view",
    },
    {
      id: "pm-schedule", title: "PM Schedule", description: "Jadwal preventive maintenance seluruh unit dan sistem.",
      icon: <CalendarDays className="w-5 h-5 text-white" />, iconBg: "bg-[#1B3A6B]",
      path: "/pm-schedule", tab: "pm-schedule", permission: "pmschedule.menu",
    },
    {
      id: "radio-internal", title: "Radio KPC", description: "Kelola data, status, dan monitoring radio KPC.",
      icon: <Radio className="w-5 h-5 text-white" />, iconBg: "bg-[#D94F2B]",
      path: "/radio-internal", tab: "radio-internal", permission: "radio.kpc.menu",
    },
    {
      id: "warehouse-borrow", title: "Warehouse", description: "Kelola inventori, peminjaman, dan master data tools.",
      icon: <Warehouse className="w-5 h-5 text-white" />, iconBg: "bg-[#059669]",
      path: "/warehouse/borrow-history", tab: "warehouse-borrow-history", permission: "warehouse.borrow.view",
    },
    {
      id: "radio-repair-dashboard", title: "Dashboard Perbaikan", description: "Monitoring status perbaikan radio dan riwayat servis.",
      icon: <Wrench className="w-5 h-5 text-white" />, iconBg: "bg-[#2B6CB0]",
      path: "/radio-repair-dashboard", tab: "radio-repair-dashboard", permission: "radio.repair.menu",
    },
    {
      id: "cctv-kpc", title: "CCTV KPC", description: "Pantau monitoring CCTV untuk area operasional.",
      icon: <Video className="w-5 h-5 text-white" />, iconBg: "bg-[#1B3A6B]",
      path: "/cctv-kpc", tab: "cctv-kpc", permission: "cctv.kpc.menu",
    },
    {
      id: "inspeksi-kpc", title: "Inspeksi KPC", description: "Laporan dan data inspeksi area KPC.",
      icon: <ClipboardList className="w-5 h-5 text-white" />, iconBg: "bg-[#D94F2B]",
      path: "/inspeksi-kpc", tab: "inspeksi-kpc", permission: "inspeksi.menu",
    },
    {
      id: "fleet-statistics", title: "Fleet Statistics", description: "Pemantauan performa dan statistik armada.",
      icon: <TrendingUp className="w-5 h-5 text-white" />, iconBg: "bg-[#059669]",
      path: "/fleet-statistics", tab: "fleet-statistics", permission: "fleet.menu",
    },
    {
      id: "callrecords", title: "Call Records", description: "Analisis dan riwayat panggilan radio.",
      icon: <Phone className="w-5 h-5 text-white" />, iconBg: "bg-[#2B6CB0]",
      path: "/callrecords", tab: "callrecords", permission: "callrecord.view",
    },
    {
      id: "letter-numbers", title: "Letter Numbers", description: "Penomoran persuratan dan dokumen resmi.",
      icon: <FileText className="w-5 h-5 text-white" />, iconBg: "bg-[#1B3A6B]",
      path: "/letter-numbers", tab: "letter-numbers", permission: "letter.view",
    },
    {
      id: "link-internal", title: "Link Internal", description: "Tautan dan monitoring jaringan link internal.",
      icon: <Link2 className="w-5 h-5 text-white" />, iconBg: "bg-[#D94F2B]",
      path: "/link-internal", tab: "link-internal", permission: "internal.link.menu",
    },
    {
      id: "docs", title: "Dokumentasi", description: "Panduan penggunaan dan referensi sistem.",
      icon: <BookOpen className="w-5 h-5 text-white" />, iconBg: "bg-[#718096]",
      path: "/docs", tab: "docs", permission: "docs.view",
    },
  ];

  const visibleModules = allModules.filter(
    (m) => !m.permission || hasPerm(m.permission)
  );

  // Quick actions in banner (permission-based)
  const quickActions = [
    { label: "PM Schedule", icon: <CalendarDays className="w-4 h-4" />, path: "/pm-schedule", tab: "pm-schedule", permission: "pmschedule.menu" },
    { label: "Radio KPC", icon: <Radio className="w-4 h-4" />, path: "/radio-internal", tab: "radio-internal", permission: "radio.kpc.menu" },
    { label: "Ajuan Pinjam", icon: <Package className="w-4 h-4" />, path: "/warehouse/borrow-request", tab: "warehouse-borrow-request", permission: "warehouse.borrow.create" },
    { label: "Upload CSV", icon: <Upload className="w-4 h-4" />, path: "/upload", tab: "upload", permission: "callrecord.import" },
  ].filter((a) => !a.permission || hasPerm(a.permission));

  return (
    <div className="space-y-5">

      {/* ── ZONE 1: Welcome Banner ─────────────────────────────────────── */}

      {/* ─── DESKTOP Banner ─────────────────────────────────────────────── */}
      <div
        className="hidden md:block relative overflow-hidden rounded-[14px] text-white"
        style={{ background: "#1B3A6B", minHeight: 140 }}
      >
        {/* Background photo — telecom tower + building */}
        <div className="absolute inset-0 select-none pointer-events-none">
          <img
            src="/bg.png"
            alt=""
            className="w-full h-full object-cover object-right"
            style={{ opacity: 0.55 }}
          />
          {/* Gradient mask — left side very dark for text, fades to transparent right */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to right, rgba(27,58,107,0.97) 0%, rgba(27,58,107,0.88) 30%, rgba(27,58,107,0.5) 55%, rgba(0,0,0,0.05) 100%)'
          }} />
        </div>

        <div className="relative z-10 p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            {/* Left */}
            <div>
              <h1 className="text-xl md:text-2xl font-bold leading-tight">
                Selamat datang, {firstName}!
              </h1>
              <p className="text-white/70 text-[13px] mt-0.5">
                Monitoring Preventive Maintenance, Asset &amp; Radio Communication
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-[12px] text-white/80">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />{dateStr}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />{timeStr}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />Semua Lokasi
                </span>
              </div>
              {quickActions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {quickActions.map((a) => (
                    <button key={a.tab} onClick={() => go(a.tab, a.path)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/30 rounded-full text-[13px] font-semibold text-white transition-colors backdrop-blur-sm">
                      {a.icon}{a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Role badge */}
            <div className="flex-shrink-0 self-start">
              <span className="flex items-center gap-2 px-5 py-2.5 bg-[#D94F2B] rounded-full text-[14px] font-bold text-white shadow-lg cursor-default">
                {user?.roleName || "Administrator"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MOBILE Banner ─────────────────────────────────────────────── */}
      <div
        className="md:hidden relative overflow-hidden rounded-[18px] text-white"
        style={{ background: "#1B3A6B" }}
      >
        {/* Background photo — same image, portrait crop */}
        <div className="absolute inset-0 select-none pointer-events-none">
          <img
            src="/bg.png"
            alt=""
            className="w-full h-full object-cover object-right"
            style={{ opacity: 0.5 }}
          />
          {/* Gradient overlay — left very dark for text readability */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to right, rgba(27,58,107,0.97) 0%, rgba(27,58,107,0.88) 25%, rgba(27,58,107,0.55) 55%, rgba(0,0,0,0.05) 100%)'
          }} />
        </div>

        <div className="relative z-10 p-5 pb-4">
          {/* Greeting */}
          <h1 className="text-[22px] font-bold leading-tight">
            Selamat datang, {firstName}!
          </h1>
          <p className="text-white/70 text-[13px] mt-1 leading-snug">
            Monitoring Preventive Maintenance,{"\n"}Asset &amp; Radio Communication
          </p>

          {/* Date / time / location strip */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[12px] text-white/80">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />{dateStr}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />{timeStr}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />Semua Lokasi
            </span>
          </div>

          {/* Quick action grid — 3 per row */}
          {quickActions.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {quickActions.map((a) => (
                <button key={a.tab} onClick={() => go(a.tab, a.path)}
                  className="flex flex-col items-center justify-center gap-1.5 py-3 bg-white/12 hover:bg-white/20 border border-white/25 rounded-[12px] text-[12px] font-semibold text-white transition-colors active:scale-95 backdrop-blur-sm">
                  <span className="opacity-90">{a.icon}</span>
                  <span className="leading-tight text-center">{a.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Role badge — orange pill at bottom */}
          <div className="mt-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#D94F2B] rounded-full text-[13px] font-bold text-white shadow">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {user?.roleName || "Administrator"}
            </span>
          </div>
        </div>
      </div>

      {/* ── ZONE 2: Stats Strip ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Radio className="w-6 h-6 text-white" />}
          iconBg="bg-[#2B6CB0]"
          label="Radio"
          value={stats.radioTotal}
          sub="Registered Unit"
          onClick={() => go("radio-internal", "/radio-internal")}
        />
        <StatCard
          icon={<Link2 className="w-6 h-6 text-white" />}
          iconBg="bg-[#1B3A6B]"
          label="Network"
          value={stats.networkLinks}
          sub="Link Internal"
          onClick={() => go("link-internal", "/link-internal")}
        />
        <StatCard
          icon={<Package className="w-6 h-6 text-white" />}
          iconBg="bg-[#059669]"
          label="Warehouse"
          value={stats.warehousePending}
          sub="Peminjaman Pending"
          onClick={() => go("warehouse-borrow-history", "/warehouse/borrow-history")}
        />
        <StatCard
          icon={<Wrench className="w-6 h-6 text-white" />}
          iconBg="bg-[#D94F2B]"
          label="Radio Repair"
          value={stats.radioRepairOpen}
          sub="Open Case"
          onClick={() => go("radio-repair-dashboard", "/radio-repair-dashboard")}
        />
      </div>

      {/* ── ZONE 3: Modules + Sidebar ──────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Left: Modul Utama (2/3 width) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white border border-[#E2E8F0]/80 rounded-[16px] p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.03)]">
            <h2 className="text-[14px] font-bold text-[#1A202C] mb-5">Modul Utama</h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-y-6 gap-x-2">
              {visibleModules.slice(0, showAllModules ? visibleModules.length : 3).map((m) => (
                <AppIcon
                  key={m.id}
                  icon={m.icon}
                  iconBg={m.iconBg}
                  title={m.title}
                  onClick={() => go(m.tab, m.path)}
                />
              ))}
              {!showAllModules && visibleModules.length > 3 && (
                <AppIcon
                  icon={
                    <div className="grid grid-cols-2 gap-[2px] w-5 h-5">
                      <div className="bg-white rounded-full" /><div className="bg-white rounded-full" />
                      <div className="bg-white rounded-full" /><div className="bg-white rounded-full" />
                    </div>
                  }
                  iconBg="bg-[#718096]"
                  title="Semua Modul"
                  onClick={() => setShowAllModules(true)}
                />
              )}
              {showAllModules && (
                <AppIcon
                  icon={<ChevronRight className="w-6 h-6 text-white rotate-[-90deg]" />}
                  iconBg="bg-[#718096]"
                  title="Sembunyikan"
                  onClick={() => setShowAllModules(false)}
                />
              )}
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {pmDashboard ? (
              <>
                <div className="bg-white border border-[#E2E8F0]/80 rounded-[16px] p-5 md:p-6 flex flex-col items-center min-h-[220px] shadow-[0_2px_10px_-3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-shadow duration-300">
                  <h3 className="text-[13px] font-semibold text-[#1A202C] mb-2 self-start w-full text-center tracking-wide">Yearly PM Compliance</h3>
                  <div className="w-full h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Selesai', value: pmDashboard.totalCompleted },
                            { name: 'Belum Selesai', value: pmDashboard.totalScheduled - pmDashboard.totalCompleted }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell key="cell-0" fill="#059669" />
                          <Cell key="cell-1" fill="#E2E8F0" />
                        </Pie>
                        <RechartsTooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center -mt-24 pointer-events-none">
                    <p className="text-[20px] font-bold text-[#1A202C]">{Math.round(pmDashboard.compliancePercentage)}%</p>
                    <p className="text-[10px] text-[#718096]">Selesai / Terjadwal</p>
                  </div>
                  <div className="mt-10 flex items-center justify-center gap-4 w-full">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
                      <span className="text-[11px] text-[#718096]">Selesai ({pmDashboard.totalCompleted})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#E2E8F0]"></span>
                      <span className="text-[11px] text-[#718096]">Total ({pmDashboard.totalScheduled})</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#E2E8F0]/80 rounded-[16px] p-5 md:p-6 flex flex-col min-h-[220px] md:col-span-2 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-shadow duration-300">
                  <h3 className="text-[13px] font-semibold text-[#1A202C] mb-4 tracking-wide">Tren PM 6 Bulan</h3>
                  <div className="w-full h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pmDashboard.trend6Months.slice().reverse()} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#718096' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#718096' }} dx={-10} />
                        <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="completed" name="Selesai" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={30} />
                        <Bar dataKey="overdue" name="Overdue" fill="#DC2626" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <>
                <PlaceholderChart
                  title="PM Compliance"
                  subtitle="Data sedang dimuat..."
                />
                <PlaceholderChart
                  title="PM Trend (6 Bulan)"
                  subtitle="Data sedang dimuat..."
                />
                <PlaceholderChart
                  title="Aset Condition"
                  subtitle="Data belum tersedia"
                />
              </>
            )}
          </div>

          {/* Third Row: KPI & Doc Expiry Charts */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
            
            {/* KPI Donut */}
            {kpiDashboard ? (
              <div className="bg-white border border-[#E2E8F0]/80 rounded-[16px] p-5 md:p-6 flex flex-col items-center min-h-[220px] shadow-[0_2px_10px_-3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-shadow duration-300">
                <h3 className="text-[13px] font-semibold text-[#1A202C] mb-2 self-start w-full text-center tracking-wide">KPI Bulan Ini — Status</h3>
                <div className="w-full h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Selesai', value: kpiDashboard.selesai },
                          { name: 'Pending TTD', value: kpiDashboard.pending },
                          { name: 'Menunggu Data', value: kpiDashboard.menunggu },
                        ].filter(d => d.value > 0)}
                        cx="50%" cy="50%"
                        innerRadius={45} outerRadius={60}
                        paddingAngle={2} dataKey="value" stroke="none"
                      >
                        <Cell fill="#059669" />
                        <Cell fill="#F59E0B" />
                        <Cell fill="#E2E8F0" />
                      </Pie>
                      <RechartsTooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center -mt-24 pointer-events-none">
                  <p className="text-[20px] font-bold text-[#1A202C]">{kpiDashboard.pct}%</p>
                  <p className="text-[10px] text-[#718096]">Selesai / Total</p>
                </div>
                <div className="mt-10 flex items-center justify-center gap-4 w-full">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#059669]" />
                    <span className="text-[11px] text-[#718096]">Selesai ({kpiDashboard.selesai})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    <span className="text-[11px] text-[#718096]">Pending ({kpiDashboard.pending})</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* KPI Bar Chart per Area */}
            {kpiDashboard ? (
              <div className="bg-white border border-[#E2E8F0]/80 rounded-[16px] p-5 md:p-6 flex flex-col min-h-[220px] md:col-span-2 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-shadow duration-300">
                <h3 className="text-[13px] font-semibold text-[#1A202C] mb-4 tracking-wide">KPI Dokumen per Area</h3>
                <div className="w-full h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kpiDashboard.byArea} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="area" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#718096' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#718096' }} dx={-10} allowDecimals={false} />
                      <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="total" name="Total" fill="#2B6CB0" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="selesai" name="Selesai" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-[3px] bg-[#2B6CB0]" />
                    <span className="text-[11px] text-[#718096]">Total</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-[3px] bg-[#059669]" />
                    <span className="text-[11px] text-[#718096]">Selesai</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Doc Expiry Donut */}
            {docSummary ? (
              <div className="bg-white border border-[#E2E8F0]/80 rounded-[16px] p-5 md:p-6 flex flex-col items-center min-h-[220px] shadow-[0_2px_10px_-3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-shadow duration-300">
                <h3 className="text-[13px] font-semibold text-[#1A202C] mb-2 self-start w-full text-center tracking-wide">Masa Berlaku Dokumen</h3>
                <div className="w-full h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Aman', value: Math.max(0, docSummary.totalDocuments - docSummary.expiringSoon - docSummary.expired) },
                          { name: 'Segera', value: docSummary.expiringSoon },
                          { name: 'Expired', value: docSummary.expired },
                        ].filter(d => d.value > 0)}
                        cx="50%" cy="50%"
                        innerRadius={45} outerRadius={60}
                        paddingAngle={2} dataKey="value" stroke="none"
                      >
                        <Cell fill="#059669" />
                        <Cell fill="#F59E0B" />
                        <Cell fill="#DC2626" />
                      </Pie>
                      <RechartsTooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center -mt-24 pointer-events-none">
                  <p className="text-[20px] font-bold text-[#1A202C]">{docSummary.totalDocuments}</p>
                  <p className="text-[10px] text-[#718096]">Total Dokumen</p>
                </div>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 w-full">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#059669]" />
                    <span className="text-[10px] text-[#718096]">Aman</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    <span className="text-[10px] text-[#718096]">Segera ({docSummary.expiringSoon})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                    <span className="text-[10px] text-[#718096]">Expired ({docSummary.expired})</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right: Info widgets (1/3 width) */}
        <div className="space-y-4">

          {/* PM Bulanan widget — ready for future API */}
          {pmDashboard ? (
            <div className="bg-white border border-[#E2E8F0]/80 rounded-[16px] p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-semibold text-[#1A202C] tracking-wide">PM Bulan Ini</h3>
                <span className="text-[11px] text-[#718096]">
                  {MONTHS_FULL[new Date().getMonth()]} {new Date().getFullYear()}
                </span>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-[12px] text-[#718096] mb-2">
                  <span>Progress</span>
                  <span className="font-bold text-[#1A202C]">{Math.round(pmDashboard.currentMonth.progressPercentage)}%</span>
                </div>
                <div className="h-2.5 bg-[#F7F8FA] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#059669] to-[#34D399] rounded-full transition-all duration-700" style={{ width: `${Math.round(pmDashboard.currentMonth.progressPercentage)}%` }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="flex items-center gap-1.5 text-[#718096]">
                    <span className="w-2 h-2 rounded-full bg-[#059669]" />Selesai
                  </span>
                  <span className="font-semibold text-[#1A202C]">{pmDashboard.currentMonth.completed}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="flex items-center gap-1.5 text-[#718096]">
                    <span className="w-2 h-2 rounded-full bg-[#2B6CB0]" />Terjadwal
                  </span>
                  <span className="font-semibold text-[#1A202C]">{pmDashboard.currentMonth.totalScheduled - pmDashboard.currentMonth.completed - pmDashboard.currentMonth.overdue}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="flex items-center gap-1.5 text-[#718096]">
                    <span className="w-2 h-2 rounded-full bg-[#DC2626]" />Overdue
                  </span>
                  <span className="font-semibold text-[#1A202C]">{pmDashboard.currentMonth.overdue}</span>
                </div>
              </div>
              {hasPerm("pmschedule.menu") && (
                <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
                  <button
                    onClick={() => go("pm-schedule", "/pm-schedule")}
                    className="w-full text-center text-[12px] text-[#2B6CB0] font-medium py-1.5 bg-[#EBF4FF] rounded-md hover:bg-[#D5E3FF] transition-colors"
                  >
                    Lihat Detail →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0]/80 rounded-[16px] p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.03)] opacity-70">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-bold text-[#1A202C]">PM Bulan Ini</h3>
                <span className="text-[11px] text-[#718096]">
                  {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-[12px] text-[#718096] mb-2">
                  <span>Progress</span>
                  <span className="font-bold text-[#1A202C]">— %</span>
                </div>
                <div className="h-2.5 bg-[#F7F8FA] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#2B6CB0] to-[#63B3ED] rounded-full" style={{ width: "0%" }} />
                </div>
              </div>
              <div className="space-y-2">
                {["Selesai","Terjadwal","Overdue"].map((lbl, i) => (
                  <div key={lbl} className="flex justify-between text-[12px]">
                    <span className="flex items-center gap-1.5 text-[#718096]">
                      <span className={`w-2 h-2 rounded-full ${["bg-[#059669]","bg-[#2B6CB0]","bg-[#DC2626]"][i]}`} />{lbl}
                    </span>
                    <span className="font-semibold text-[#1A202C]">—</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
                <p className="text-[11px] text-[#718096] italic">Data PM Bulanan akan tersedia setelah modul terhubung</p>
              </div>
            </div>
          )}

          {/* Status Sistem */}
          <div className="bg-white border border-[#E2E8F0]/80 rounded-[16px] p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.03)]">
            <h3 className="text-[14px] font-bold text-[#1A202C] mb-4">Status Sistem</h3>
            <div className="space-y-3">
              {[
                { label: "Koneksi Server", status: true },
                { label: "Database", status: true },
                { label: "SignalR Live", status: true },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between text-[13px]">
                  <span className="text-[#718096]">{s.label}</span>
                  <span className={`flex items-center gap-1.5 font-semibold text-[12px] ${s.status ? "text-[#059669]" : "text-[#DC2626]"}`}>
                    <span className="relative flex w-2 h-2">
                      {s.status && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#059669] opacity-40" />}
                      <span className={`relative inline-flex rounded-full w-2 h-2 ${s.status ? "bg-[#059669]" : "bg-[#DC2626]"}`} />
                    </span>
                    {s.status ? "Online" : "Offline"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);
