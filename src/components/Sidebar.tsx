import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Phone,
  Upload,
  Download,
  Printer,
  TrendingUp,
  BookOpen,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Radio,
  FileText,
  Building2,
  FileType,
  RadioReceiver,
  PencilRuler,
  Trash2,
  Link2,
} from "lucide-react";

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
  icon: any;
  id: string;
  permission?: string;
  forAll?: boolean;
}

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

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    id: "dashboard",
    permission: "dashboard.view",
  },
  {
    name: "Docs",
    path: "/docs",
    icon: BookOpen,
    id: "docs",
    permission: "docs.view",
  },
  {
    name: "Inspeksi KPC",
    path: "/inspeksi-kpc",
    icon: ClipboardList,
    id: "inspeksi-kpc",
    permission: "inspeksi.menu",
  },
  {
    name: "Fleet Statistics",
    path: "/fleet-statistics",
    icon: TrendingUp,
    id: "fleet-statistics",
    permission: "fleet.menu",
  },
  {
    name: "NEC History",
    path: "/nec-history",
    icon: TrendingUp,
    id: "nec-history",
    permission: "nec.histori.menu",
  },
  {
    name: "Link Internal",
    path: "/link-internal",
    icon: Link2,
    id: "link-internal",
    permission: "internal.link.menu",
  },
  {
    name: "SWR Signal",
    path: "/swr-signal",
    icon: Radio,
    id: "swr-signal",
    permission: "swr.signal.menu",
  },
];

const letterNumberMenu: NavItem[] = [
  {
    name: "Letter Numbers",
    path: "/letter-numbers",
    icon: FileText,
    id: "letter-numbers",
    permission: "letter.view",
  },
  {
    name: "Companies",
    path: "/companies",
    icon: Building2,
    id: "companies",
    permission: "companies.view",
  },
  {
    name: "Document Types",
    path: "/document-types",
    icon: FileType,
    id: "document-types",
    permission: "document.type.menu",
  },
];

const callRecordsMenu: NavItem[] = [
  {
    name: "View Records",
    path: "/callrecords",
    icon: Phone,
    id: "callrecords",
    permission: "callrecord.view",
  },
  {
    name: "Upload CSV",
    path: "/upload",
    icon: Upload,
    id: "upload",
    permission: "callrecord.import",
  },
  {
    name: "Export Data",
    path: "/export",
    icon: Download,
    id: "export",
    permission: "callrecord.view-any",
  },
  {
    name: "Print Report",
    path: "/callrecord-print",
    icon: Printer,
    id: "callrecord-print",
    permission: "callrecord.view",
  },
];

const radioMenu: NavItem[] = [
  {
    name: "Radio Trunking",
    path: "/radio-trunking",
    icon: Radio,
    id: "radio-trunking",
    permission: "radio.view",
    forAll: true,
  },
  {
    name: "Radio Conventional",
    path: "/radio-conventional",
    icon: RadioReceiver,
    id: "radio-conventional",
    permission: "radio.view",
    forAll: true,
  },
  {
    name: "Radio Grafir",
    path: "/radio-grafir",
    icon: PencilRuler,
    id: "radio-grafir",
    permission: "radio.view",
    forAll: true,
  },
  {
    name: "Radio Scrap",
    path: "/radio-scrap",
    icon: Trash2,
    id: "radio-scrap",
    permission: "radio.view",
    forAll: true,
  },
];

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
  const [isCallRecordsOpen, setIsCallRecordsOpen] = useState(true);
  const [isLetterNumberOpen, setIsLetterNumberOpen] = useState(true);

  const filteredNavItems = navItems.filter(
    (item) => item.forAll || !item.permission || hasPermission(item.permission)
  );
  const filteredCallRecords = callRecordsMenu.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );
  const filteredLetterNumbers = letterNumberMenu.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );
  const filteredRadioMenu = radioMenu.filter(
    (item) => item.forAll || !item.permission || hasPermission(item.permission)
  );

  const [isRadioOpen, setIsRadioOpen] = useState(true);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active menu item when mobile sidebar opens
  useEffect(() => {
    if (isMobileMenuOpen && mobileNavRef.current) {
      setTimeout(() => {
        const activeEl = mobileNavRef.current?.querySelector('[data-active="true"]');
        if (activeEl) {
          activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 300);
    }
  }, [isMobileMenuOpen]);

  const isMobile = isMobileMenuOpen;

  const NavLink = ({
    item,
    onClick,
  }: {
    item: NavItem;
    onClick?: () => void;
  }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        onClick={() => {
          setActiveTab(item.id);
          onClick?.();
        }}
        title={isCollapsed ? item.name : ""}
        className={`flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative ${isCollapsed && !isMobile ? "justify-center p-3 mx-2" : "space-x-3 px-4 py-2.5 mx-2"
          } ${isActive
            ? "bg-white/15 text-white shadow-sm backdrop-blur-sm"
            : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        data-active={isActive}
      >
        <Icon
          className={`${isCollapsed && !isMobile ? "w-6 h-6" : "w-5 h-5"
            } flex-shrink-0 transition-transform duration-200 group-hover:scale-110`}
        />
        {(!isCollapsed || isMobile) && <span className="truncate">{item.name}</span>}
      </Link>
    );
  };

  // Sub-menu link for mobile: text-only, indented, no icon
  const MobileSubLink = ({
    item,
    onClick,
  }: {
    item: NavItem;
    onClick?: () => void;
  }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        onClick={() => {
          setActiveTab(item.id);
          onClick?.();
        }}
        className={`block pl-4 pr-4 py-1.5 text-[13px] font-medium transition-all duration-200 ${isActive
          ? "text-white"
          : "text-white/55 hover:text-white/80"
          }`}
        data-active={isActive}
      >
        {item.name}
      </Link>
    );
  };

  const SidebarContent = (isMobileView: boolean = false) => (
    <div className={`flex flex-col h-full ${isMobileView ? 'py-4 pb-6' : 'py-6'}`}>
      {/* Logo Section */}
      <div
        className={`flex items-center ${isMobileView ? 'mb-6 px-5' : 'mb-6 px-6'} ${isCollapsed && !isMobileView ? "justify-center" : "justify-between"
          }`}
      >
        <div className="flex items-center space-x-3 overflow-visible">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          {(!isCollapsed || isMobileView) && (
            <span className="text-xl font-bold text-white tracking-tight truncate">
              PM Dashboard
            </span>
          )}
        </div>
        {/* Close button - Mobile only */}
        {isMobileView && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Nav */}
      <div ref={isMobileView ? mobileNavRef : undefined} className={`flex-1 ${isMobileView ? 'space-y-0.5' : 'space-y-1'} overflow-y-auto custom-scrollbar overflow-x-hidden`}>
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.id}
            item={item}
            onClick={() => isMobileView && setIsMobileMenuOpen(false)}
          />
        ))}

        {
          hasPermission("call.record.menu") && filteredCallRecords.length > 0 && (
            <div className={isMobileView ? 'mt-2' : 'mt-4'}>
              {!isCollapsed || isMobileView ? (
                <>
                  <button
                    onClick={() => setIsCallRecordsOpen(!isCallRecordsOpen)}
                    className={`w-full flex items-center justify-between text-xs font-semibold text-white/50 uppercase tracking-wider hover:text-white/80 transition-colors ${isMobileView ? 'px-5 py-1' : 'px-4 py-2'}`}
                  >
                    <span>Call Records</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isCallRecordsOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isCallRecordsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={isMobileView ? '' : 'space-y-1 mt-1'}
                      >
                        {isMobileView ? (
                          <div className="ml-7 border-l-2 border-white/15 pl-0 py-1">
                            {filteredCallRecords.map((item) => (
                              <MobileSubLink
                                key={item.id}
                                item={item}
                                onClick={() => setIsMobileMenuOpen(false)}
                              />
                            ))}
                          </div>
                        ) : (
                          filteredCallRecords.map((item) => (
                            <NavLink
                              key={item.id}
                              item={item}
                            />
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                // Collapsed state - show icons
                filteredCallRecords.map((item) => (
                  <NavLink key={item.id} item={item} />
                ))
              )}
            </div>
          )}

        {
          hasPermission("radio.management.menu") && filteredRadioMenu.length > 0 && (
            <div className={isMobileView ? 'mt-2' : 'mt-4'}>
              {!isCollapsed || isMobileView ? (
                <>
                  <button
                    onClick={() => setIsRadioOpen(!isRadioOpen)}
                    className={`w-full flex items-center justify-between text-xs font-semibold text-white/50 uppercase tracking-wider hover:text-white/80 transition-colors ${isMobileView ? 'px-5 py-1' : 'px-4 py-2'}`}
                  >
                    <span>Radio Management</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isRadioOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isRadioOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={isMobileView ? '' : 'space-y-1 mt-1'}
                      >
                        {isMobileView ? (
                          <div className="ml-7 border-l-2 border-white/15 pl-0 py-1">
                            {filteredRadioMenu.map((item) => (
                              <MobileSubLink
                                key={item.id}
                                item={item}
                                onClick={() => setIsMobileMenuOpen(false)}
                              />
                            ))}
                          </div>
                        ) : (
                          filteredRadioMenu.map((item) => (
                            <NavLink
                              key={item.id}
                              item={item}
                            />
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                // Collapsed state - show icons
                filteredRadioMenu.map((item) => (
                  <NavLink key={item.id} item={item} />
                ))
              )}
            </div>
          )}


        {
          hasPermission("letter.menu") && filteredLetterNumbers.length > 0 && (
            <div className={isMobileView ? 'mt-2' : 'mt-4'}>
              {!isCollapsed || isMobileView ? (
                <>
                  <button
                    onClick={() => setIsLetterNumberOpen(!isLetterNumberOpen)}
                    className={`w-full flex items-center justify-between text-xs font-semibold text-white/50 uppercase tracking-wider hover:text-white/80 transition-colors ${isMobileView ? 'px-5 py-1' : 'px-4 py-2'}`}
                  >
                    <span>Letter Numbering</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isLetterNumberOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isLetterNumberOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={isMobileView ? '' : 'overflow-hidden space-y-1 mt-1'}
                      >
                        {isMobileView ? (
                          <div className="ml-7 border-l-2 border-white/15 pl-0 py-1">
                            {filteredLetterNumbers.map((item) => (
                              <MobileSubLink
                                key={item.id}
                                item={item}
                                onClick={() => setIsMobileMenuOpen(false)}
                              />
                            ))}
                          </div>
                        ) : (
                          filteredLetterNumbers.map((item) => (
                            <NavLink
                              key={item.id}
                              item={item}
                            />
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <div className="h-px bg-white/10 my-4 mx-2" />
              )}
            </div>
          )
        }

        {
          (hasPermission("system.permission.view") ||
            hasPermission("system.role.view") ||
            hasPermission("system.role.permission.view") ||
            hasPermission("system.user.management.view") ||
            hasPermission("system.division.view") ||
            hasPermission("system.audit.view")) && (
            <div className={isCollapsed && !isMobileView ? "mt-2" : "mt-3"}>
              <NavLink
                item={{
                  name: "Settings",
                  path: "/settings",
                  icon: Settings,
                  id: "settings",
                }}
                onClick={() => isMobileView && setIsMobileMenuOpen(false)}
              />
            </div>
          )
        }
      </div >

      {/* Footer / User */}
      <div
        className={`mt-auto ${isMobileView ? 'pt-3 px-4 pb-2' : 'pt-4 px-4 pb-6 border-t border-white/10'} ${isCollapsed && !isMobileView ? "items-center px-2" : ""
          }`}
      >
        {isMobileView || !isCollapsed ? (
          <div className="bg-white/5 rounded-2xl p-3 space-y-2">
            <Link
              to="/profile"
              onClick={() => {
                setActiveTab("profile");
                if (isMobileView) setIsMobileMenuOpen(false);
              }}
              className="flex items-center space-x-3 hover:bg-white/5 rounded-xl px-1 py-1.5 transition-all group"
            >
              {user?.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.fullName}
                  className="w-10 h-10 rounded-full object-cover border border-white/30 group-hover:scale-110 transition-transform flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold border border-white/30 group-hover:scale-110 transition-transform flex-shrink-0">
                  {user?.fullName?.[0] || "U"}
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.fullName || "User"}
                </p>
                <p className="text-xs text-white/60 truncate">
                  {isMobileView
                    ? (user?.roleName || "Role")
                    : `${user?.division || "Division"} `}
                </p>
              </div>
            </Link>
            <button
              onClick={() => {
                logout();
                window.location.href = "/";
              }}
              className="w-full flex items-center justify-center bg-red-600/80 hover:bg-red-600 text-white rounded-xl px-4 py-2.5 gap-2 text-sm font-semibold transition-all"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          /* Desktop Collapsed state */
          <>
            <Link
              to="/profile"
              onClick={() => {
                setActiveTab("profile");
              }}
              title={user?.fullName}
              className="flex items-center justify-center rounded-xl hover:bg-white/10 transition-all group p-2 mx-auto"
            >
              {user?.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.fullName}
                  className="w-10 h-10 min-w-[40px] rounded-full object-cover border border-white/30 group-hover:scale-110 transition-transform shrink-0"
                />
              ) : (
                <div className="w-10 h-10 min-w-[40px] rounded-full bg-white/20 flex items-center justify-center text-white font-bold border border-white/30 group-hover:scale-110 transition-transform shrink-0">
                  {user?.fullName?.[0] || "U"}
                </div>
              )}
            </Link>
            <button
              onClick={() => {
                logout();
                window.location.href = "/";
              }}
              title="Logout"
              className="w-full flex items-center justify-center mt-2 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all p-3"
            >
              <LogOut className="w-6 h-6 flex-shrink-0" />
            </button>
          </>
        )}
      </div >
    </div >
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-900 shadow-2xl border-r border-white/10 transition-all duration-300 ${isCollapsed ? "w-20" : "w-72"
          }`}
      >
        {SidebarContent(false)}
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-900 shadow-2xl md:hidden rounded-r-3xl overflow-hidden"
          >
            {SidebarContent(true)}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
