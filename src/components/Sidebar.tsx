import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  Phone,
  Upload,
  Download,
  Printer,
  TrendingUp,
  BookOpen,
  Settings,
  LogOut,
  ChevronDown,
  ClipboardList,
  Radio,
  FileText,
  Building2,
  FileType,
  RadioReceiver,
  Trash2,
  Link2,
  CalendarDays,
  Video,
  Wrench,
  Package,
  Warehouse,
  ClipboardCheck,
  Database,
  ShieldAlert,
  X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  id: string;
  permission?: string;
  anyOf?: string[];
  forAll?: boolean;
}

// ─── Permission helper ────────────────────────────────────────────────────────

const hasPermission = (permission: string): boolean => {
  const permissions = localStorage.getItem("permissions");
  if (!permissions) return false;
  try {
    const permList: string[] = JSON.parse(permissions);
    return permList.includes(permission);
  } catch {
    return false;
  }
};

// ─── Nav data ─────────────────────────────────────────────────────────────────

const mainMenu: NavItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, id: "dashboard", forAll: true },
  { name: "Docs", path: "/docs", icon: BookOpen, id: "docs", forAll: true },
];

const pmManagementMenu: NavItem[] = [
  { name: "KPI Tracking", path: "/kpi-tracking", icon: ClipboardList, id: "kpi-tracking", permission: "kpi.view" },
  { name: "PM Schedule", path: "/pm-schedule", icon: CalendarDays, id: "pm-schedule", permission: "pmschedule.menu" },
  { name: "Inspeksi KPC", path: "/inspeksi-kpc", icon: ClipboardList, id: "inspeksi-kpc", permission: "inspeksi.menu" },
  { name: "NEC History", path: "/nec-history", icon: TrendingUp, id: "nec-history", permission: "nec.histori.menu" },
  { name: "Link Internal", path: "/link-internal", icon: Link2, id: "link-internal", permission: "internal.link.menu" },
  { name: "SWR Signal", path: "/swr-signal", icon: Radio, id: "swr-signal", permission: "swr.signal.menu" },
  { name: "Monitoring Dokumen", path: "/operational-documents", icon: ShieldAlert, id: "operational-documents", permission: "operationaldocument.menu" },
];

const radioFleetMenu: NavItem[] = [
  { name: "Radio KPC", path: "/radio-internal", icon: Radio, id: "radio-internal", permission: "radio.kpc.menu" },
  { name: "Radio Contractor", path: "/radio-contractor", icon: Building2, id: "radio-contractor", permission: "radio.view" },
  { name: "Radio Unit", path: "/radio-unit", icon: RadioReceiver, id: "radio-unit", permission: "radio.view" },
  { name: "Radio Scrap", path: "/radio-scrap", icon: Trash2, id: "radio-scrap", permission: "radio.scrap.view" },
  { name: "Dashboard Perbaikan", path: "/radio-repair-dashboard", icon: Wrench, id: "radio-repair-dashboard", permission: "radio.repair.menu" },
  { name: "Serah Terima Radio", path: "/radio-handover", icon: Package, id: "radio-handover", permission: "radio.handover.menu" },
  { name: "Radio Masuk WH", path: "/radio-handover/warehouse", icon: Warehouse, id: "radio-handover-warehouse", permission: "radio.handover.view" },
  { name: "Fleet Statistics", path: "/fleet-statistics", icon: TrendingUp, id: "fleet-statistics", permission: "fleet.menu" },
];

const monitoringMenu: NavItem[] = [
  { name: "CCTV KPC", path: "/cctv-kpc", icon: Video, id: "cctv-kpc", permission: "cctv.kpc.menu" },
];

const warehouseMenu: NavItem[] = [
  { name: "Histori Peminjaman", path: "/warehouse/borrow-history", icon: ClipboardList, id: "warehouse-borrow-history", permission: "warehouse.borrow.view" },
  { name: "Ajuan Pinjam Tools", path: "/warehouse/borrow-request", icon: Package, id: "warehouse-borrow-request", permission: "warehouse.borrow.create" },
  { name: "Supervisi Warehouse", path: "/warehouse/supervision", icon: ClipboardCheck, id: "warehouse-supervision", permission: "warehouse.borrow.supervise" },
  { name: "Master Data Tools", path: "/warehouse/catalog", icon: Database, id: "warehouse-catalog", anyOf: ["warehouse.borrow.supervise", "warehouse.menu.tools"] },
];

const callRecordsMenu: NavItem[] = [
  { name: "View Records", path: "/callrecords", icon: Phone, id: "callrecords", permission: "callrecord.view" },
  { name: "Upload CSV", path: "/upload", icon: Upload, id: "upload", permission: "callrecord.import" },
  { name: "Export Data", path: "/export", icon: Download, id: "export", permission: "callrecord.view-any" },
  { name: "Print Report", path: "/callrecord-print", icon: Printer, id: "callrecord-print", permission: "callrecord.view" },
];

const administrationMenu: NavItem[] = [
  { name: "Letter Numbers", path: "/letter-numbers", icon: FileText, id: "letter-numbers", permission: "letter.view" },
  { name: "Companies", path: "/companies", icon: Building2, id: "companies", permission: "companies.view" },
  { name: "Document Types", path: "/document-types", icon: FileType, id: "document-types", permission: "document.type.menu" },
  { name: "Operational Doc Types", path: "/operational-document-types", icon: FileType, id: "operational-document-types", permission: "operationaldocument.menu" },
];

const hasSettingsAccess = () =>
  hasPermission("setting.menu");

// ─── NavGroup component ────────────────────────────────────────────────────────

interface NavGroupProps {
  label: string;
  items: NavItem[];
  isOpen: boolean;
  onToggle: () => void;
  location: ReturnType<typeof useLocation>;
  setActiveTab: (tab: string) => void;
  isCollapsed?: boolean;
}

const NavGroup: React.FC<NavGroupProps> = ({
  label, items, isOpen, onToggle, location, setActiveTab, isCollapsed
}) => {
  if (items.length === 0) return null;
  // If collapsed, we don't show the group header and we always show the items
  const showItems = isCollapsed || isOpen;
  
  return (
    <div>
      {!isCollapsed && (
        <p 
          onClick={onToggle}
          className="px-4 pt-4 pb-2 text-[12px] font-bold uppercase tracking-[0.05em] text-white/80 select-none cursor-pointer hover:text-white transition-colors flex items-center justify-between group"
        >
          {label}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "" : "-rotate-90"} opacity-100`} />
        </p>
      )}
      
      {showItems && items.map((item) => {
        const Icon = item.icon;
        // Use exact match. For startsWith, only match if no other item in the
        // list is a more specific match for the current pathname.
        const exactMatch = location.pathname === item.path;
        const prefixMatch = location.pathname.startsWith(item.path + "/");
        const moreSpecificExists = items.some(
          other => other.path !== item.path && location.pathname.startsWith(other.path)
        );
        const isActive = exactMatch || (prefixMatch && !moreSpecificExists);
        return (
          <Link
            key={item.id}
            to={item.path}
            data-active={isActive}
            title={isCollapsed ? item.name : undefined}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center h-9 text-[13px] font-medium transition-colors duration-150 relative overflow-hidden
              ${isCollapsed ? "justify-center px-0 mx-2 rounded-lg" : "px-4 gap-3"}
              ${isActive
                ? (isCollapsed ? "bg-[#2B6CB0] text-white" : "bg-[#2B6CB0] text-white before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[#D94F2B] before:rounded-r")
                : "text-white/70 hover:text-white hover:bg-white/8"
              }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="truncate whitespace-nowrap">{item.name}</span>}
          </Link>
        );
      })}
    </div>
  );
};

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function Sidebar({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Helper untuk mendeteksi apakah salah satu rute di grup sedang aktif
  const isGroupActive = (items: NavItem[]) =>
    items.some(item => location.pathname.startsWith(item.path));

  // Group open states - default collapsed kecuali grup yang sedang aktif
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    pm: isGroupActive(pmManagementMenu),
    radio: isGroupActive(radioFleetMenu),
    monitoring: isGroupActive(monitoringMenu),
    warehouse: isGroupActive(warehouseMenu),
    callrecords: isGroupActive(callRecordsMenu),
    administration: isGroupActive(administrationMenu),
  });

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  // ─── Auto-scroll to active nav item when route changes ────────────────────
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!navRef.current) return;
    // Small delay to allow render to complete
    const t = setTimeout(() => {
      const activeEl = navRef.current?.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(t);
  }, [location.pathname]);

  // Filter by permission (supports single permission or anyOf array)
  const hasAccess = (i: NavItem) =>
    i.forAll || (!i.permission && !i.anyOf) || (i.permission && hasPermission(i.permission)) || (i.anyOf && i.anyOf.some(p => hasPermission(p)));

  const filteredMain = mainMenu.filter(hasAccess);
  const filteredPm = pmManagementMenu.filter(hasAccess);
  const filteredRadio = radioFleetMenu.filter(hasAccess);
  const filteredMonitoring = monitoringMenu.filter(hasAccess);
  const filteredWarehouse = warehouseMenu.filter(hasAccess);
  const filteredCallRecords = callRecordsMenu.filter(hasAccess);
  const filteredAdministration = administrationMenu.filter(hasAccess);

  // ─── Sidebar inner content ─────────────────────────────────────────────────

  const SidebarInner = () => (
    <div className="flex flex-col h-full">

      {/* ── Logo strip ── */}
      <div
        className="flex items-center justify-center h-[64px] flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #1B3A6B 0%, #2B6CB0 60%, #D94F2B 100%)",
        }}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center w-full px-0' : 'gap-3 px-4 w-full'}`}>
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs tracking-tight">MKN</span>
          </div>
          {!isCollapsed && (
            <div className="leading-none transition-opacity duration-300">
              <p className="text-white font-bold text-sm tracking-tight">PM DOCS</p>
              <p className="text-white/60 text-[10px] font-medium tracking-wide uppercase">System</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable nav ── */}
      <nav ref={navRef} className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-2">

        <NavGroup label="Main" items={filteredMain} isOpen={true} onToggle={() => {}}
          location={location} setActiveTab={setActiveTab} isCollapsed={isCollapsed} />

        {filteredPm.length > 0 && (
          <NavGroup label="PM Management" items={filteredPm} isOpen={openGroups.pm}
            onToggle={() => toggleGroup("pm")} location={location} setActiveTab={setActiveTab} isCollapsed={isCollapsed} />
        )}

        {filteredRadio.length > 0 && (
          <NavGroup label="Radio & Fleet" items={filteredRadio} isOpen={openGroups.radio}
            onToggle={() => toggleGroup("radio")} location={location} setActiveTab={setActiveTab} isCollapsed={isCollapsed} />
        )}

        {filteredMonitoring.length > 0 && (
          <NavGroup label="CCTV" items={filteredMonitoring} isOpen={openGroups.monitoring}
            onToggle={() => toggleGroup("monitoring")} location={location} setActiveTab={setActiveTab} isCollapsed={isCollapsed} />
        )}

        {filteredWarehouse.length > 0 && (
          <NavGroup label="Warehouse" items={filteredWarehouse} isOpen={openGroups.warehouse}
            onToggle={() => toggleGroup("warehouse")} location={location} setActiveTab={setActiveTab} isCollapsed={isCollapsed} />
        )}

        {filteredCallRecords.length > 0 && (
          <NavGroup label="Call Records" items={filteredCallRecords} isOpen={openGroups.callrecords}
            onToggle={() => toggleGroup("callrecords")} location={location} setActiveTab={setActiveTab} isCollapsed={isCollapsed} />
        )}

        {filteredAdministration.length > 0 && (
          <NavGroup label="Administration" items={filteredAdministration} isOpen={openGroups.administration}
            onToggle={() => toggleGroup("administration")} location={location} setActiveTab={setActiveTab} isCollapsed={isCollapsed} />
        )}
      </nav>

      {/* ── Settings — pinned, standalone ── */}
      {hasSettingsAccess() && (
        <div className="flex-shrink-0">
          <div className="mx-4 h-px bg-white/12" />
          <Link
            to="/settings"
            data-active={location.pathname === "/settings"}
            title={isCollapsed ? "Settings" : undefined}
            onClick={() => setActiveTab("settings")}
            className={`flex items-center h-9 text-[13px] font-medium transition-colors duration-150 relative mt-1 overflow-hidden
              ${isCollapsed ? "justify-center px-0 mx-2 rounded-lg" : "px-4 gap-3"}
              ${location.pathname === "/settings"
                ? (isCollapsed ? "bg-[#2B6CB0] text-white" : "bg-[#2B6CB0] text-white before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[#D94F2B] before:rounded-r")
                : "text-white/70 hover:text-white hover:bg-white/8"
              }`}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Settings</span>}
          </Link>
        </div>
      )}

      {/* ── User profile card ── */}
      <div className={`flex-shrink-0 ${isCollapsed ? 'p-2' : 'p-3'}`} style={{ backgroundColor: "#243F73" }}>
        <Link
          to="/profile"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center p-2 rounded-lg hover:bg-white/8 transition-colors group ${isCollapsed ? 'justify-center' : 'gap-3'}`}
        >
          {user?.photoUrl ? (
            <img src={user.photoUrl} alt={user.fullName}
              className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm border border-white/20 flex-shrink-0">
              {user?.fullName?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-semibold truncate leading-none">
                {user?.fullName || "User"}
              </p>
              <p className="text-white/50 text-[11px] truncate mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                {user?.roleName || "Online"}
              </p>
            </div>
          )}
        </Link>
        <button
          onClick={() => { logout(); window.location.href = "/"; }}
          title={isCollapsed ? "Logout" : undefined}
          className={`mt-2 w-full flex items-center justify-center py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-[13px] font-semibold transition-colors ${isCollapsed ? 'px-0' : 'gap-2'}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Desktop Sidebar only — mobile uses BottomNav + MoreSheet */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 flex-shrink-0 shadow-xl transition-all duration-300 border-r border-white/5 ${isCollapsed ? "w-[72px]" : "w-[220px]"}`}
        style={{ backgroundColor: "#1B3A6B" }}
      >
        <div className="w-full h-full flex flex-col overflow-hidden">
          <SidebarInner />
        </div>
      </aside>
    </>
  );
}
