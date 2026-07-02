import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { useAuth } from "../contexts/AuthContext";
import { Menu, Search, Bell, Calendar, Clock, LayoutDashboard, CalendarDays, Radio, Warehouse, Wrench, Video, Phone, Link2, TrendingUp, BookOpen, FileText, Package, ClipboardList, Building2, FileType, Settings, ChevronRight, LogOut } from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useSignalR } from "../hooks/useSignalR";
import { NotificationPanel } from "./NotificationPanel";
import MobileBottomNav from "./common/MobileBottomNav";
import BottomSheet from "./common/BottomSheet";

// ─── Permission helper ────────────────────────────────────────────────────────

const hasPerm = (p: string): boolean => {
  try {
    return (JSON.parse(localStorage.getItem("permissions") ?? "[]") as string[]).includes(p);
  } catch { return false; }
};

// ─── "More" menu groups for mobile bottom sheet ───────────────────────────────

interface MoreNavItem { name: string; path: string; icon: React.ElementType; permission?: string; anyOf?: string[]; }
interface MoreNavGroup { label: string; items: MoreNavItem[]; }

const moreNavGroups: MoreNavGroup[] = [
  {
    label: "PM Management",
    items: [
      { name: "PM Schedule", path: "/pm-schedule", icon: CalendarDays, permission: "pmschedule.menu" },
      { name: "KPI Tracking", path: "/kpi-tracking", icon: ClipboardList, permission: "kpi.view" },
      { name: "Inspeksi KPC", path: "/inspeksi-kpc", icon: ClipboardList, permission: "inspeksi.menu" },
      { name: "NEC History", path: "/nec-history", icon: TrendingUp, permission: "nec.histori.menu" },
      { name: "Link Internal", path: "/link-internal", icon: Link2, permission: "internal.link.menu" },
      { name: "SWR Signal", path: "/swr-signal", icon: Radio, permission: "swr.signal.menu" },
    ],
  },
  {
    label: "Radio & Fleet",
    items: [
      { name: "Radio KPC", path: "/radio-internal", icon: Radio, permission: "radio.kpc.menu" },
      { name: "Radio Contractor", path: "/radio-contractor", icon: Building2, permission: "radio.view" },
      { name: "Radio Unit", path: "/radio-unit", icon: Radio, permission: "radio.view" },
      { name: "Radio Scrap", path: "/radio-scrap", icon: Warehouse, permission: "radio.scrap.view" },
      { name: "Dashboard Perbaikan", path: "/radio-repair-dashboard", icon: Wrench, permission: "radio.repair.menu" },
      { name: "Serah Terima Radio", path: "/radio-handover", icon: Package, permission: "radio.handover.menu" },
      { name: "Radio Masuk WH", path: "/radio-handover/warehouse", icon: Warehouse, permission: "radio.handover.view" },
      { name: "Fleet Statistics", path: "/fleet-statistics", icon: TrendingUp, permission: "fleet.menu" },
    ],
  },
  {
    label: "CCTV",
    items: [
      { name: "CCTV KPC", path: "/cctv-kpc", icon: Video, permission: "cctv.kpc.menu" },
    ],
  },
  {
    label: "Warehouse",
    items: [
      { name: "Histori Peminjaman", path: "/warehouse/borrow-history", icon: ClipboardList, permission: "warehouse.borrow.view" },
      { name: "Ajuan Pinjam Tools", path: "/warehouse/borrow-request", icon: Package, permission: "warehouse.borrow.create" },
      { name: "Supervisi Warehouse", path: "/warehouse/supervision", icon: ClipboardList, permission: "warehouse.borrow.supervise" },
      { name: "Master Data Tools", path: "/warehouse/catalog", icon: FileText, anyOf: ["warehouse.borrow.supervise", "warehouse.menu.tools"] },
    ],
  },
  {
    label: "Call Records",
    items: [
      { name: "View Records", path: "/callrecords", icon: Phone, permission: "callrecord.view" },
      { name: "Upload CSV", path: "/upload", icon: FileText, permission: "callrecord.import" },
      { name: "Export Data", path: "/export", icon: ChevronRight, permission: "callrecord.view-any" },
      { name: "Print Report", path: "/callrecord-print", icon: FileText, permission: "callrecord.view" },
    ],
  },
  {
    label: "Administration",
    items: [
      { name: "Letter Numbers", path: "/letter-numbers", icon: FileText, permission: "letter.view" },
      { name: "Companies", path: "/companies", icon: Building2, permission: "companies.view" },
      { name: "Document Types", path: "/document-types", icon: FileType, permission: "document.type.menu" },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { name: "Docs", path: "/docs", icon: BookOpen, permission: "docs.view" },
      { name: "Settings", path: "/settings", icon: Settings, permission:"setting.menu" },
    ],
  },
];

export const searchableItems = [
  { name: "Dashboard", path: "/dashboard", section: "Main" },
  { name: "Docs", path: "/docs", section: "Main" },
  { name: "KPI Tracking", path: "/kpi-tracking", section: "PM Management" },
  { name: "PM Schedule", path: "/pm-schedule", section: "PM Management" },
  { name: "Inspeksi KPC", path: "/inspeksi-kpc", section: "PM Management" },
  { name: "NEC History", path: "/nec-history", section: "PM Management" },
  { name: "Link Internal", path: "/link-internal", section: "PM Management" },
  { name: "SWR Signal", path: "/swr-signal", section: "PM Management" },
  { name: "Radio KPC", path: "/radio-internal", section: "Radio & Fleet" },
  { name: "Radio Contractor", path: "/radio-contractor", section: "Radio & Fleet" },
  { name: "Radio Unit", path: "/radio-unit", section: "Radio & Fleet" },
  { name: "Radio Scrap", path: "/radio-scrap", section: "Radio & Fleet" },
  { name: "Dashboard Perbaikan", path: "/radio-repair-dashboard", section: "Radio & Fleet" },
  { name: "Serah Terima Radio", path: "/radio-handover", section: "Radio & Fleet" },
  { name: "Radio Masuk WH", path: "/radio-handover/warehouse", section: "Radio & Fleet" },
  { name: "Fleet Statistics", path: "/fleet-statistics", section: "Radio & Fleet" },
  { name: "CCTV KPC", path: "/cctv-kpc", section: "CCTV" },
  { name: "Histori Peminjaman", path: "/warehouse/borrow-history", section: "Warehouse" },
  { name: "Ajuan Pinjam Tools", path: "/warehouse/borrow-request", section: "Warehouse" },
  { name: "Supervisi Warehouse", path: "/warehouse/supervision", section: "Warehouse" },
  { name: "Master Data Tools", path: "/warehouse/catalog", section: "Warehouse" },
  { name: "View Records", path: "/callrecords", section: "Call Records" },
  { name: "Upload CSV", path: "/upload", section: "Call Records" },
  { name: "Export Data", path: "/export", section: "Call Records" },
  { name: "Print Report", path: "/callrecord-print", section: "Call Records" },
  { name: "Letter Numbers", path: "/letter-numbers", section: "Administration" },
  { name: "Companies", path: "/companies", section: "Administration" },
  { name: "Document Types", path: "/document-types", section: "Administration" },
  { name: "Settings", path: "/settings", section: "System" },
  { name: "Profile", path: "/profile", section: "System" },
];

// ─── Date/time hook ───────────────────────────────────────────────────────────

function useDatetime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }) + " WIB";

  return { dateStr, timeStr };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { dateStr, timeStr } = useDatetime();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  // Ref for More Sheet content — to scroll active item into view when opened
  const moreSheetRef = React.useRef<HTMLDivElement>(null);

  // Scroll More Sheet to active item when opened
  React.useEffect(() => {
    if (!isMoreSheetOpen) return;
    const t = setTimeout(() => {
      const activeEl = moreSheetRef.current?.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }, 200); // wait for sheet animation
    return () => clearTimeout(t);
  }, [isMoreSheetOpen]);

  const { notifications, unreadCount, markAsRead, markAllAsRead, isConnected } =
    useSignalR();

  const filteredSearch = searchableItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.section.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <>
    <div className="flex min-h-[100dvh] bg-[#F7F8FA]">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className="flex-1 flex flex-col h-[100dvh] overflow-x-hidden">

        {/* ── Desktop Top Bar ─────────────────────────────────────────────── */}
        <header className="hidden md:flex items-center justify-between px-6 h-16 bg-white sticky top-0 z-30 border-b border-[#E2E8F0] flex-shrink-0">

          {/* Left: hamburger + page title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 text-[#718096] hover:text-[#1B3A6B] hover:bg-[#F7F8FA] rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Cari fitur..."
                className="pl-9 pr-4 py-2 w-64 bg-[#F7F8FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1A202C] placeholder:text-[#718096] outline-none focus:border-[#2B6CB0] focus:bg-white transition-colors"
              />
              {/* Search dropdown */}
              {isSearchFocused && searchQuery && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-[10px] shadow-lg border border-[#E2E8F0] overflow-hidden max-h-72 overflow-y-auto z-50">
                  {filteredSearch.length > 0 ? (
                    <div className="py-1">
                      {filteredSearch.map((item, idx) => (
                        <Link
                          key={idx}
                          to={item.path}
                          onClick={() => { setSearchQuery(""); setIsSearchFocused(false); }}
                          className="flex flex-col px-4 py-2.5 hover:bg-[#F7F8FA] transition-colors"
                        >
                          <span className="text-sm font-semibold text-[#1A202C]">{item.name}</span>
                          <span className="text-xs text-[#718096]">{item.section}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-5 text-center text-sm text-[#718096]">
                      Tidak ada hasil untuk "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: date/time + notification + user */}
          <div className="flex items-center gap-5">

            {/* Date & time */}
            <div className="hidden lg:flex items-center gap-4 text-[#718096]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#2B6CB0]" />
                <span className="text-[13px] font-medium">{dateStr}</span>
              </div>
              <div className="w-px h-4 bg-[#E2E8F0]" />
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#2B6CB0]" />
                <span className="text-[13px] font-medium">{timeStr}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-[#E2E8F0]" />

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-[#718096] hover:text-[#1B3A6B] hover:bg-[#F7F8FA] rounded-lg transition-colors"
                title={isConnected ? "Notifikasi (Live)" : "Notifikasi (Offline)"}
              >
                <Bell className="w-5 h-5" />
                {/* Unread badge */}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#D94F2B] rounded-full border-2 border-white text-[9px] font-bold text-white flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {/* Connection dot */}
                <span
                  className={`absolute bottom-1 left-1 w-2 h-2 rounded-full border border-white ${
                    isConnected ? "bg-[#059669]" : "bg-[#718096]"
                  }`}
                />
              </button>
              {isNotificationOpen && (
                <NotificationPanel
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onClose={() => setIsNotificationOpen(false)}
                />
              )}
            </div>

            {/* User info */}
            <Link
              to="/profile"
              className="flex items-center gap-3 pl-2 hover:opacity-80 transition-opacity"
            >
              <div className="text-right">
                <p className="text-[13px] font-semibold text-[#1A202C] leading-none">
                  {user?.fullName || "User"}
                </p>
                <p className="text-[11px] text-[#718096] mt-0.5">
                  {user?.roleName || "Administrator"}
                </p>
              </div>
              {user?.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt="profile"
                  className="w-9 h-9 rounded-full object-cover border border-[#E2E8F0]"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#1B3A6B] flex items-center justify-center text-white font-bold text-sm border border-[#E2E8F0]">
                  {user?.fullName?.[0]?.toUpperCase() || "U"}
                </div>
              )}

            </Link>
          </div>
        </header>

        {/* ── Mobile Top Bar ───────────────────────────────────────────────── */}
        <header className="flex md:hidden items-center justify-between px-4 h-14 bg-white sticky top-0 z-30 border-b border-[#E2E8F0] flex-shrink-0">

          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMoreSheetOpen(true)}
              className="p-2 text-[#718096] hover:text-[#1B3A6B] hover:bg-[#F7F8FA] rounded-lg transition-colors"
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #1B3A6B, #2B6CB0)" }}>
                <span className="text-white text-[9px] font-bold">MKN</span>
              </div>
              <span className="text-[14px] font-bold text-[#1A202C]">PM Dashboard</span>
            </div>
          </div>

          {/* Right: search + bell + avatar */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSearchFocused(!isSearchFocused)}
              className="p-2 text-[#718096] hover:text-[#1B3A6B] rounded-lg transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-[#718096] hover:text-[#1B3A6B] rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#D94F2B] rounded-full border-2 border-white text-[9px] font-bold text-white flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {isNotificationOpen && (
                <NotificationPanel
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onClose={() => setIsNotificationOpen(false)}
                />
              )}
            </div>
            <Link to="/profile" className="ml-1">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="profile" className="w-8 h-8 rounded-full object-cover border border-[#E2E8F0]" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#1B3A6B] flex items-center justify-center text-white text-xs font-bold">
                  {user?.fullName?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </Link>
          </div>

          {/* Mobile search overlay */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 bg-white border-b border-[#E2E8F0] p-3 shadow-lg z-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari fitur..."
                  className="w-full pl-9 pr-4 py-2 bg-[#F7F8FA] border border-[#E2E8F0] rounded-lg text-sm outline-none"
                />
              </div>
              {searchQuery && (
                <div className="mt-2 max-h-60 overflow-y-auto">
                  {filteredSearch.length > 0 ? (
                    filteredSearch.map((item, idx) => (
                      <Link
                        key={idx}
                        to={item.path}
                        onClick={() => { setSearchQuery(""); setIsSearchFocused(false); }}
                        className="flex flex-col px-3 py-2 hover:bg-[#F7F8FA] rounded-lg"
                      >
                        <span className="text-sm font-semibold text-[#1A202C]">{item.name}</span>
                        <span className="text-xs text-[#718096]">{item.section}</span>
                      </Link>
                    ))
                  ) : (
                    <div className="py-4 text-center text-sm text-[#718096]">
                      Tidak ada hasil untuk "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </header>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="flex-1 p-4 md:p-6 pb-32 md:pb-6">
          <div className="w-full mx-auto">
            {children}
          </div>
        </main>

        <Footer />
      </div>
    </div>

    {/* ── Mobile Bottom Nav — OUTSIDE flex container for proper fixed positioning ── */}
    <MobileBottomNav onMoreClick={() => setIsMoreSheetOpen(true)} />

    {/* ── "More" Bottom Sheet ──────────────────────────────────────────── */}
    <BottomSheet
      open={isMoreSheetOpen}
      onClose={() => setIsMoreSheetOpen(false)}
      title="Menu Lainnya"
      size="xl"
    >
      <div ref={moreSheetRef} className="space-y-5 pb-4">
        {moreNavGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.permission && !item.anyOf || (item.permission && hasPerm(item.permission)) || (item.anyOf && item.anyOf.some(p => hasPerm(p)))
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#718096] mb-2 px-1">
                {group.label}
              </p>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const exactMatch = location.pathname === item.path;
                  const prefixMatch = location.pathname.startsWith(item.path + "/");
                  const groupPaths = visibleItems.map(i => i.path);
                  const moreSpecificExists = groupPaths.some(
                    p => p !== item.path && location.pathname.startsWith(p)
                  );
                  const isActive = exactMatch || (prefixMatch && !moreSpecificExists);
                  return (
                    <button
                      key={item.path}
                      data-active={isActive ? "true" : undefined}
                      onClick={() => {
                        setActiveTab(item.path.replace("/", ""));
                        navigate(item.path);
                        setIsMoreSheetOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[14px] font-medium transition-colors text-left ${
                        isActive
                          ? "bg-[#EBF4FF] text-[#2B6CB0]"
                          : "text-[#1A202C] hover:bg-[#F7F8FA]"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-[6px] flex items-center justify-center flex-shrink-0 ${
                        isActive ? "bg-[#2B6CB0]" : "bg-[#F7F8FA]"
                      }`}>
                        <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#718096]"}`} />
                      </div>
                      {item.name}
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D94F2B] flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ── Logout Button ── */}
        <div className="pt-2 border-t border-[#E2E8F0]">
          <button
            onClick={() => {
              logout();
              setIsMoreSheetOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[14px] font-medium transition-colors text-left text-[#D94F2B] hover:bg-[#FFF5F5]"
          >
            <div className="w-8 h-8 rounded-[6px] flex items-center justify-center flex-shrink-0 bg-[#FFF5F5]">
              <LogOut className="w-4 h-4 text-[#D94F2B]" />
            </div>
            Keluar
          </button>
        </div>
      </div>
    </BottomSheet>
    </>
  );
};

export default Layout;
