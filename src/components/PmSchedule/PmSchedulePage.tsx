import React, { useState } from "react";
import { Home, CalendarDays, Server } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import PmSiteManagement from "./PmSiteManagement";
import PmYearlySchedule from "./PmYearlySchedule";

export default function PmSchedulePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("schedule");

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#f7f6f8] text-slate-900">
      {/* ====== MOBILE INTEGRATED HEADER ====== */}
      <div className="md:hidden pt-4 pb-4 mb-4 px-4 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] rounded-b-3xl">
        <div className="flex items-start justify-between pb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1 opacity-80">
              <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">
                Maintenance
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
              PM Schedule
            </h1>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors shrink-0"
          >
            <Home className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Default Header for Desktop */}
      <header className="hidden md:flex sticky top-0 z-30 items-center bg-[#f7f6f8] p-4 border-b border-indigo-500/10 justify-between">
        <div className="flex-1">
          <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight">
            Preventive Maintenance
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage yearly PM schedules and sites
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard")} variant="outline" size="sm" className="rounded-xl">
          <Home className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </header>

      {/* Main Content with Tabs */}
      <div className="flex-1 p-4 pb-24 max-w-[1600px] mx-auto w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <div className="flex justify-center sm:justify-start">
            <TabsList className="bg-white p-1 rounded-2xl border border-indigo-500/10 shadow-sm h-auto flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
              <TabsTrigger
                value="schedule"
                className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-semibold text-slate-500 data-[state=active]:shadow-md transition-all flex items-center gap-2"
              >
                <CalendarDays className="w-4 h-4" />
                PM Schedule
              </TabsTrigger>
              <TabsTrigger
                value="sites"
                className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-semibold text-slate-500 data-[state=active]:shadow-md transition-all flex items-center gap-2"
              >
                <Server className="w-4 h-4" />
                Master Site
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="schedule" className="focus:outline-none">
            <PmYearlySchedule />
          </TabsContent>

          <TabsContent value="sites" className="focus:outline-none">
            <PmSiteManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
