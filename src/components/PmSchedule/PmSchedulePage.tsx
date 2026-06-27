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
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#F7F8FA] text-[#1A202C]">
      {/* ── Mobile Header ── */}
      <div className="md:hidden bg-white rounded-[14px] border border-[#E2E8F0] shadow-sm mb-4">
        <div className="flex items-start gap-4 p-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#EBF4FF] flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-5 h-5 text-[#2B6CB0]" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#2B6CB0] tracking-[0.1em] uppercase mb-0.5">PM Management</p>
            <h1 className="text-[20px] font-bold text-[#1A202C] leading-tight">PM Schedule</h1>
            <p className="text-[12px] text-[#718096] mt-0.5">Jadwal preventive maintenance tahunan</p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-[#F7F8FA] border border-[#E2E8F0] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors flex-shrink-0"
          >
            <Home className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Desktop Header ── */}
      <header className="hidden md:flex sticky top-0 z-30 items-center bg-[#F7F8FA] px-4 py-3 border-b border-[#E2E8F0] justify-between">
        <div className="flex-1">
          <h2 className="text-[#1A202C] text-lg font-bold leading-tight">
            Preventive Maintenance
          </h2>
          <p className="text-xs text-[#718096] font-medium">
            Manage yearly PM schedules and sites
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard")} variant="outline" size="sm"
          className="rounded-[10px] border-[#E2E8F0] text-[#718096] hover:text-[#1B3A6B]">
          <Home className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </header>

      {/* ── Tabs ── */}
      <div className="flex-1 p-4 pb-24 max-w-[1600px] mx-auto w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
          <div className="flex justify-start">
            <TabsList className="bg-white p-1 rounded-[10px] border border-[#E2E8F0] shadow-sm h-auto flex flex-row gap-1">
              <TabsTrigger
                value="schedule"
                className="rounded-[8px] px-5 py-2 data-[state=active]:bg-[#1B3A6B] data-[state=active]:text-white font-semibold text-[#718096] transition-all flex items-center gap-2"
              >
                <CalendarDays className="w-4 h-4" />
                PM Schedule
              </TabsTrigger>
              <TabsTrigger
                value="sites"
                className="rounded-[8px] px-5 py-2 data-[state=active]:bg-[#1B3A6B] data-[state=active]:text-white font-semibold text-[#718096] transition-all flex items-center gap-2"
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
