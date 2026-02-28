import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { useAuth } from "../contexts/AuthContext";
import { Menu, Search, Bell } from "lucide-react";
import { useLocation, Link } from "react-router-dom";

export const searchableItems = [
  { name: "Dashboard", path: "/dashboard", section: "Main" },
  { name: "Docs", path: "/docs", section: "Main" },
  { name: "Inspeksi KPC", path: "/inspeksi-kpc", section: "Main" },
  { name: "Fleet Statistics", path: "/fleet-statistics", section: "Main" },
  { name: "NEC History", path: "/nec-history", section: "Main" },
  { name: "Link Internal", path: "/link-internal", section: "Main" },
  { name: "SWR Signal", path: "/swr-signal", section: "Main" },
  { name: "View Records", path: "/callrecords", section: "Call Records" },
  { name: "Upload CSV", path: "/upload", section: "Call Records" },
  { name: "Export Data", path: "/export", section: "Call Records" },
  { name: "Radio Trunking", path: "/radio-trunking", section: "Radio Management" },
  { name: "Radio Conventional", path: "/radio-conventional", section: "Radio Management" },
  { name: "Radio Grafir", path: "/radio-grafir", section: "Radio Management" },
  { name: "Radio Scrap", path: "/radio-scrap", section: "Radio Management" },
  { name: "Letter Numbers", path: "/letter-numbers", section: "Letter Numbering" },
  { name: "Companies", path: "/companies", section: "Letter Numbering" },
  { name: "Document Types", path: "/document-types", section: "Letter Numbering" },
  { name: "Settings", path: "/settings", section: "System" }
];

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
}) => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Filter items based on query
  const filteredSearch = searchableItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.section.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar - Desktop selalu muncul, Mobile controlled */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-8 h-[76px] bg-white sticky top-0 z-30 border-b border-slate-200/50">
          <div className="flex-1 max-w-2xl flex items-center space-x-4">
            {/* Collapse Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5 flex-shrink-0" />
            </button>

            {/* Search Input */}
            <div className="relative group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Search features, records..."
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50/80 border border-transparent hover:border-slate-200 focus:border-indigo-500/30 focus:bg-white rounded-xl text-sm outline-none transition-all placeholder:text-slate-400"
              />

              {/* Search Dropdown */}
              {isSearchFocused && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                  {filteredSearch.length > 0 ? (
                    <div className="py-2">
                      {filteredSearch.map((item, idx) => (
                        <Link
                          key={idx}
                          to={item.path}
                          onClick={() => {
                            setSearchQuery("");
                            setIsSearchFocused(false);
                          }}
                          className="flex flex-col px-4 py-2 hover:bg-slate-50 transition-colors"
                        >
                          <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                          <span className="text-xs text-slate-400">{item.section}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-slate-500">
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-6 ml-4">
            {/* Notification Bell - Temporarily Hidden */}
            <button className="hidden relative p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-50">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-[#b324d7] rounded-full border-2 border-white text-[8px] font-bold text-white flex items-center justify-center">0</span>
            </button>

            <div className="hidden w-px h-8 bg-slate-200"></div>

            {/* User Profile */}
            <Link to="/profile" className="flex items-center space-x-3 group hover:opacity-80 transition-opacity">
              <div className="text-right hidden lg:block">
                <p className="text-[13px] font-bold text-slate-700 leading-none">{user?.fullName || "User"}</p>
                <p className="text-[11px] font-medium text-slate-500 mt-1">
                  {user?.division || "Division"} • {user?.employeeId || "ID"}
                </p>
              </div>
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="profile" className="w-9 h-9 rounded-full object-cover border-2 border-slate-50 shadow-sm" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold border-2 border-slate-50 shadow-sm">
                  {user?.fullName?.[0] || "U"}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Mobile Header (Hidden on specific pages where they have their own custom header) */}
        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between px-6 h-20 bg-white/80 backdrop-blur-md sticky top-0 z-30 transition-all duration-300 border-b border-slate-200/50">
          <div className="flex items-center">
            <button
              onClick={() => {
                if (window.innerWidth >= 768) {
                  setIsCollapsed(!isCollapsed);
                } else {
                  setIsMobileMenuOpen(true);
                }
              }}
              className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-3 ml-4">
              <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-xs font-bold uppercase tracking-tighter">
                  PM
                </span>
              </div>
            </div>
            <span className="font-bold text-gray-900 tracking-tight ml-3">
              PM Dashboard
            </span>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 p-6 md:p-10">
          <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Layout;
