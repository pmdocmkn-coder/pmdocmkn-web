import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { useAuth } from "../contexts/AuthContext";
import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

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
