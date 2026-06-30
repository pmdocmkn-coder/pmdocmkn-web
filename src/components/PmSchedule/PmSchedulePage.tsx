import React, { useState } from "react";
import { Home, CalendarDays, Server } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { MobilePageHeader } from "../ui/MobilePageHeader";
import PmSiteManagement from "./PmSiteManagement";
import PmYearlySchedule from "./PmYearlySchedule";

export default function PmSchedulePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("schedule");

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">
      
      {/* ── Mobile Header ── */}
      <MobilePageHeader
        label="PM Management"
        title="PM Schedule"
        subtitle="Jadwal preventive maintenance tahunan"
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

      {/* ── Desktop Header ── */}
      <div className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-[10px] border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#EBF4FF] rounded-[12px] flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-6 h-6 text-[#2B6CB0]" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-[#1A202C] tracking-tight">Preventive Maintenance</h1>
            <p className="text-[13px] text-[#718096] mt-0.5">Manage yearly PM schedules and sites</p>
          </div>
        </div>
        <Button onClick={() => navigate("/dashboard")} variant="outline" size="sm"
          className="rounded-[10px] border-[#E2E8F0] text-[#718096] hover:text-[#1B3A6B] bg-white h-10 px-4">
          <Home className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex-1 w-full">
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
