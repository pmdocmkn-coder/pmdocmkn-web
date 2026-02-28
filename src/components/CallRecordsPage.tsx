import React, { useState, useEffect } from "react";
import { hasPermission } from "../utils/permissionUtils";
import { useAuth } from "../contexts/AuthContext";
import {
  Calendar,
  Download,
  Search,
  Filter,
  FileDown,
  Trash2,
  BarChart3,
  Phone,
  PhoneOff,
  PhoneMissed,
  TrendingUp,
  AlertCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  Clock,
} from "lucide-react";
import { callRecordApi } from "../services/api";
import {
  CallRecord,
  CallRecordsResponse,
  DailySummary,
} from "../types/callRecord";
import HourlyChart from "./HourlyChart";
import HourlySummaryTable from "./HourlySummaryTable";
import { MobilePageHeader } from "./ui/MobilePageHeader";
import { DatePicker } from "./ui/date-picker";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// Interface untuk DebugInfo
interface DebugInfo {
  selectedDate: string;
  recordsCount: number;
  sampleRecord: CallRecord | null;
  allRecords: CallRecord[];
  timestamp: string;
  apiResponse?: any;
  error?: string;
  errorDetails?: any;
}

// Interface untuk Query Params
interface QueryParams {
  page: number;
  pageSize: number;
  search: string;
  callCloseReason?: number;
  hourGroup?: number;
  sortBy: string;
  sortDir: string;
}

const CallRecordsPage: React.FC = () => {
  const { user } = useAuth();
  const hasFullAccess = hasPermission("callrecord.view-any");

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [recordsResponse, setRecordsResponse] =
    useState<CallRecordsResponse | null>(null);
  const [records, setRecords] = useState<CallRecord[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<"records" | "summary">(
    "summary"
  );
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  // Query parameters state
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    pageSize: 15,
    search: "",
    callCloseReason: undefined,
    hourGroup: undefined,
    sortBy: "calldate",
    sortDir: "desc",
  });

  // Filter state
  const [filterReason, setFilterReason] = useState<"all" | number>("all");
  const [filterHour, setFilterHour] = useState<"all" | number>("all");
  const [showDebug, setShowDebug] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Load user data and permissions on component mount
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const permissionsStr = localStorage.getItem("permissions");

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.roleName || "");
      } catch (e) {
        console.error("Error parsing user data:", e);
        setUserRole("");
      }
    }

    if (permissionsStr) {
      try {
        const permissions = JSON.parse(permissionsStr);
        setUserPermissions(permissions);
      } catch (e) {
        console.error("Error parsing permissions:", e);
        setUserPermissions([]);
      }
    }
  }, []);

  // Load data when selected date or query params change
  useEffect(() => {
    console.log(
      "🔄 Loading data for date:",
      selectedDate,
      "with params:",
      queryParams
    );
    loadData();
  }, [selectedDate, queryParams]);

  const loadData = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await Promise.all([loadCallRecords(), loadDailySummary()]);
    } catch (err) {
      console.error("❌ Error loading data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCallRecords = async () => {
    try {
      console.log(`📡 Loading call records with params:`, {
        startDate: selectedDate,
        endDate: selectedDate,
        ...queryParams,
      });

      const response = await callRecordApi.getCallRecords(
        selectedDate,
        selectedDate,
        queryParams.page,
        queryParams.pageSize,
        queryParams.search,
        queryParams.callCloseReason,
        queryParams.hourGroup,
        queryParams.sortBy,
        queryParams.sortDir
      );

      // ✅ FIXED: Backend returns { statusCode, message, data: CallRecord[], meta: { pagination } }
      console.log(
        `✅ Loaded ${response.data.length} records out of ${response.meta.pagination.totalCount} total`
      );

      const newDebugInfo: DebugInfo = {
        selectedDate,
        recordsCount: response.data.length,
        sampleRecord: response.data[0] || null,
        allRecords: response.data,
        timestamp: new Date().toISOString(),
        apiResponse: response,
      };

      setDebugInfo(newDebugInfo);
      setRecordsResponse(response);
      setRecords(response.data);
    } catch (error: any) {
      console.error("❌ Error loading call records:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";

      const errorDebugInfo: DebugInfo = {
        selectedDate,
        recordsCount: 0,
        sampleRecord: null,
        allRecords: [],
        timestamp: new Date().toISOString(),
        error: errorMessage,
        errorDetails: error.response?.data,
      };

      setDebugInfo(errorDebugInfo);
      setError(`Failed to load call records: ${errorMessage}`);
      setRecordsResponse(null);
      setRecords([]);
    }
  };

  const loadDailySummary = async () => {
    try {
      console.log(`📡 Loading daily summary for: ${selectedDate}`);
      const summary = await callRecordApi.getDailySummary(selectedDate);
      console.log("✅ Daily summary loaded:", summary);
      setDailySummary(summary);
    } catch (error: any) {
      console.error("❌ Error loading daily summary:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      setError(`Failed to load daily summary: ${errorMessage}`);
      setDailySummary(null);
    }
  };

  // Check permissions
  const hasDeletePermission = hasPermission("callrecord.delete");
  const canViewDetail =
    hasPermission("callrecord.view") ||
    hasPermission("callrecord.view-any");
  const canExportCSV = hasPermission("callrecord.export-csv");
  const canExportExcel = hasPermission("callrecord.export-excel");

  // Handler untuk search
  const handleSearch = (searchTerm: string) => {
    setQueryParams((prev) => ({
      ...prev,
      search: searchTerm,
      page: 1,
    }));
  };

  // Handler untuk filter reason
  const handleFilterReason = (reason: "all" | number) => {
    setFilterReason(reason);
    setQueryParams((prev) => ({
      ...prev,
      callCloseReason: reason === "all" ? undefined : reason,
      page: 1,
    }));
  };

  // Handler untuk filter hour
  const handleFilterHour = (hour: "all" | number) => {
    setFilterHour(hour);
    setQueryParams((prev) => ({
      ...prev,
      hourGroup: hour === "all" ? undefined : hour,
      page: 1,
    }));
  };

  // Handler untuk sorting
  const handleSort = (field: string) => {
    setQueryParams((prev) => ({
      ...prev,
      sortBy: field,
      sortDir: prev.sortBy === field && prev.sortDir === "asc" ? "desc" : "asc",
      page: 1,
    }));
  };

  // Handler untuk pagination
  const handlePageChange = (newPage: number) => {
    setQueryParams((prev) => ({
      ...prev,
      page: newPage,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Export functions
  const handleExportCSV = () => {
    callRecordApi.exportDailyCsv(selectedDate);
  };

  const handleExportRangeCSV = () => {
    callRecordApi.exportCsv(startDate, endDate);
  };

  const handleExportDailySummary = () => {
    callRecordApi.exportDailySummaryExcel(selectedDate);
  };

  const handleExportOverallSummary = () => {
    callRecordApi.exportOverallSummaryExcel(startDate, endDate);
  };

  const handleDeleteRecords = async () => {
    console.log("🗑️ DELETE DEBUG =================");
    console.log("User Role:", userRole);
    console.log("User Permissions:", userPermissions);
    console.log("Has Delete Permission:", hasDeletePermission);
    console.log("Records Count:", records.length);
    console.log("Selected Date:", selectedDate);

    if (!hasDeletePermission) {
      alert(
        "Access denied: You do not have permission to delete call records. Required permission: callrecord.delete"
      );
      return;
    }

    if (records.length === 0) {
      alert("No records to delete for selected date");
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to delete all call records for ${selectedDate}? This action cannot be undone.`
      )
    ) {
      try {
        setIsLoading(true);
        console.log("🔄 Sending delete request...");

        const success = await callRecordApi.deleteCallRecords(selectedDate);
        console.log("✅ Delete API returned:", success);

        if (success) {
          alert(`Successfully deleted records for ${selectedDate}`);
          setRecords([]);
          setRecordsResponse(null);
          setDailySummary(null);

          setDebugInfo((prev) =>
            prev
              ? {
                ...prev,
                recordsCount: 0,
                sampleRecord: null,
                allRecords: [],
                timestamp: new Date().toISOString(),
              }
              : null
          );
        } else {
          alert("Delete operation failed - no records were deleted");
        }
      } catch (error: any) {
        console.error("❌ Delete error details:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Helper function untuk mendapatkan close reason text
  const getCloseReasonText = (reasonCode: number) => {
    const reasons: { [key: number]: string } = {
      0: "TE Busy",
      1: "System Busy",
      2: "No Answer",
      3: "Not Found",
      4: "Complete",
      5: "Preempted",
      6: "Timeout",
      7: "Inactive",
      8: "Callback",
      9: "Unsupported Request",
      10: "Invalid Call",
    };
    return reasons[reasonCode] || `Unknown (${reasonCode})`;
  };

  const getCloseReasonDescription = (reasonCode: number) => {
    const descriptions: { [key: number]: string } = {
      0: "The called terminal equipment is already in a call",
      1: "The network is overloaded or has problems",
      2: "The called party does not answer",
      3: "The ident of the called party is valid but it is either not registered or the node could not route the call",
      4: "The call was completed",
      5: "The call was cleared down to make a channel available for a priority or emergency call",
      6: "The call exceeded the current maximum call duration or the maximum allowable call setup time",
      7: "One or more of the parties was inactive. The inactivity timer expired",
      8: "The call to a line dispatcher terminal was put in the callback queue",
      9: "The call could not be processed because the system does not support it",
      10: "The call failed the node's validation check",
    };
    return descriptions[reasonCode] || "Unknown reason";
  };

  const formatDisplayDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return date;
    }
  };

  const refreshData = () => {
    loadData();
  };

  // Statistics untuk filter badges
  const totalRecords = recordsResponse?.meta?.pagination?.totalCount || 0;
  const currentPage = recordsResponse?.meta?.pagination?.page || 1;
  const totalPages = recordsResponse?.meta?.pagination?.totalPages || 1;
  const hasNext = recordsResponse?.meta?.pagination?.hasNext || false;
  const hasPrevious = recordsResponse?.meta?.pagination?.hasPrevious || false;

  // Helper: navigate date by offset
  const navigateDate = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Helper: format for mobile display
  const mobileDisplayDate = () => {
    try {
      const d = new Date(selectedDate);
      const month = format(d, 'MMMM yyyy', { locale: localeId });
      const day = format(d, 'EEEE, dd', { locale: localeId });
      return { month, day };
    } catch { return { month: '', day: selectedDate }; }
  };

  const { month: mobileMonth, day: mobileDay } = mobileDisplayDate();

  // Chart helpers
  const getMaxHourlyQty = () => {
    if (!dailySummary?.hourlyData) return 1;
    return Math.max(...dailySummary.hourlyData.map(h => h.qty), 1);
  };

  return (
    <div className="w-full">
      {/* ==================== MOBILE VIEW ==================== */}
      <div className="md:hidden bg-[#f8f5fc] min-h-screen pb-24 text-slate-900 font-sans">
        <MobilePageHeader
          label="Data Center"
          title="Call Records"
          rightAction={
            <button onClick={refreshData} disabled={isLoading} className="flex items-center justify-center rounded-xl h-9 w-9 bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg shadow-purple-500/25 active:scale-90 transition-all">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          }
        />

        {/* Date Navigation */}
        <div className="px-4 py-3 flex items-center justify-center gap-4">
          <button onClick={() => navigateDate(-1)} className="w-9 h-9 rounded-full bg-white border border-purple-100 shadow-sm flex items-center justify-center text-purple-600 active:scale-90 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center min-w-[140px]">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-[0.15em]">{mobileMonth}</span>
            <span className="text-lg font-black text-slate-900 tracking-tight">{mobileDay}</span>
          </div>
          <button onClick={() => navigateDate(1)} className="w-9 h-9 rounded-full bg-white border border-purple-100 shadow-sm flex items-center justify-center text-purple-600 active:scale-90 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Date Picker */}
        <div className="px-4 mb-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold text-slate-500 ml-1 uppercase tracking-wider">Pilih Tanggal</label>
            <div className="bg-white rounded-xl border border-purple-100/60 shadow-[0_1px_8px_rgba(147,17,212,0.04)] overflow-hidden">
              <DatePicker
                date={selectedDate ? new Date(selectedDate) : undefined}
                onSelect={(d) => setSelectedDate(d ? format(d, 'yyyy-MM-dd') : '')}
                className="w-full border-none shadow-none text-[12px] font-bold text-slate-700 h-10"
              />
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-4 mb-3 p-3 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            </div>
            <p className="text-[11px] text-red-700 font-medium flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-10 h-10 rounded-full border-[3px] border-purple-200 border-t-purple-600 animate-spin" />
            <p className="text-xs font-medium text-slate-500">Memuat data call records...</p>
          </div>
        )}

        {/* Daily Summary Cards */}
        {!isLoading && dailySummary && (
          <section className="px-4 mb-6">
            <h2 className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-purple-600/70 mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3" />
              Daily Summary
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Total Calls */}
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-4 rounded-2xl shadow-lg shadow-purple-500/15 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-14 h-14 bg-white/10 rounded-full -translate-x-2 -translate-y-5" />
                <Phone className="w-4 h-4 text-purple-200 mb-2" />
                <p className="text-[9px] font-bold tracking-widest text-purple-200 uppercase">Total Calls</p>
                <p className="text-[22px] leading-none font-black text-white tracking-tight mt-1">{dailySummary.totalQty.toLocaleString()}</p>
              </div>
              {/* TE Busy */}
              <div className="bg-gradient-to-br from-rose-500 to-rose-700 p-4 rounded-2xl shadow-lg shadow-rose-500/15 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-14 h-14 bg-white/10 rounded-full -translate-x-2 -translate-y-5" />
                <PhoneOff className="w-4 h-4 text-rose-200 mb-2" />
                <p className="text-[9px] font-bold tracking-widest text-rose-200 uppercase">TE Busy</p>
                <p className="text-[22px] leading-none font-black text-white tracking-tight mt-1">{dailySummary.totalTEBusy.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-rose-200 mt-1">{dailySummary.avgTEBusyPercent}%</p>
              </div>
              {/* System Busy */}
              <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-4 rounded-2xl shadow-lg shadow-amber-500/15 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-14 h-14 bg-white/10 rounded-full -translate-x-2 -translate-y-5" />
                <PhoneMissed className="w-4 h-4 text-amber-200 mb-2" />
                <p className="text-[9px] font-bold tracking-widest text-amber-200 uppercase">System Busy</p>
                <p className="text-[22px] leading-none font-black text-white tracking-tight mt-1">{dailySummary.totalSysBusy.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-amber-200 mt-1">{dailySummary.avgSysBusyPercent}%</p>
              </div>
              {/* Others */}
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 rounded-2xl shadow-lg shadow-emerald-500/15 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-14 h-14 bg-white/10 rounded-full -translate-x-2 -translate-y-5" />
                <TrendingUp className="w-4 h-4 text-emerald-200 mb-2" />
                <p className="text-[9px] font-bold tracking-widest text-emerald-200 uppercase">Others</p>
                <p className="text-[22px] leading-none font-black text-white tracking-tight mt-1">{dailySummary.totalOthers.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-emerald-200 mt-1">{dailySummary.avgOthersPercent}%</p>
              </div>
            </div>
          </section>
        )}

        {/* Mobile Bar Chart - Pure CSS */}
        {!isLoading && dailySummary?.hourlyData && dailySummary.hourlyData.length > 0 && (
          <section className="px-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-purple-600/70 flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3" />
                Call Distribution by Hour
              </h2>
              <div className="flex gap-2.5">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-[9px] text-slate-500 font-medium">TE</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[9px] text-slate-500 font-medium">Sys</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[9px] text-slate-500 font-medium">Other</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-purple-50/80 p-3 pt-4">
              <div className="flex items-end justify-between gap-[2px] h-[180px]">
                {dailySummary.hourlyData.map((h) => {
                  const maxQ = getMaxHourlyQty();
                  const totalPct = (h.qty / maxQ) * 100;
                  const tePct = h.qty > 0 ? (h.teBusy / h.qty) * totalPct : 0;
                  const sysPct = h.qty > 0 ? (h.sysBusy / h.qty) * totalPct : 0;
                  const otherPct = h.qty > 0 ? (h.others / h.qty) * totalPct : 0;
                  return (
                    <div key={h.hourGroup} className="flex-1 flex flex-col items-center h-full justify-end">
                      <div className="w-full flex flex-col flex-shrink-0" style={{ height: `${Math.max(totalPct, 2)}%` }}>
                        <div className="w-full bg-emerald-400 rounded-t-[2px] flex-shrink-0" style={{ flex: otherPct }} />
                        <div className="w-full bg-amber-400 flex-shrink-0" style={{ flex: Math.max(sysPct, 0.1) }} />
                        <div className="w-full bg-rose-500 rounded-b-[2px] flex-shrink-0" style={{ flex: tePct }} />
                      </div>
                      <span className="text-[6px] text-slate-400 font-semibold mt-1 leading-none">{String(h.hourGroup).padStart(2, '0')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Hourly Detailed Summary - Full Details */}
        {!isLoading && dailySummary?.hourlyData && dailySummary.hourlyData.length > 0 && (
          <section className="px-4 mb-6">
            <h2 className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-purple-600/70 mb-3 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Hourly Detailed Summary
            </h2>

            {/* Card-based hourly data */}
            <div className="flex flex-col gap-2">
              {dailySummary.hourlyData.map((h) => (
                <div key={h.hourGroup} className="bg-white rounded-2xl border border-purple-50/80 shadow-[0_1px_8px_rgba(0,0,0,0.03)] p-3">
                  {/* Top row: Time + Total */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">{h.timeRange}</span>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-medium mr-1">Total</span>
                      <span className="text-[14px] font-black text-slate-800">{h.qty.toLocaleString()}</span>
                    </div>
                  </div>
                  {/* Metrics row: 3 colored boxes */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* TE Busy */}
                    <div className="bg-rose-50 rounded-lg px-2 py-1.5 text-center">
                      <p className="text-[8px] font-bold text-rose-400 uppercase tracking-wider">TE Busy</p>
                      <p className="text-[13px] font-black text-rose-600 leading-tight">{h.teBusy.toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-rose-500">{h.teBusyPercent.toFixed(1)}%</p>
                    </div>
                    {/* System Busy */}
                    <div className="bg-amber-50 rounded-lg px-2 py-1.5 text-center">
                      <p className="text-[8px] font-bold text-amber-400 uppercase tracking-wider">Sys Busy</p>
                      <p className="text-[13px] font-black text-amber-600 leading-tight">{h.sysBusy.toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-amber-500">{h.sysBusyPercent.toFixed(1)}%</p>
                    </div>
                    {/* Others */}
                    <div className="bg-emerald-50 rounded-lg px-2 py-1.5 text-center">
                      <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider">Others</p>
                      <p className="text-[13px] font-black text-emerald-600 leading-tight">{h.others.toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-emerald-500">{h.othersPercent.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* TOTAL Summary Card */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-3 shadow-lg shadow-purple-500/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-extrabold text-white/90 uppercase tracking-wider">Total</span>
                  <span className="text-[16px] font-black text-white">{dailySummary.totalQty.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="bg-white/15 backdrop-blur rounded-lg px-2 py-1.5 text-center">
                    <p className="text-[8px] font-bold text-white/70 uppercase tracking-wider">TE Busy</p>
                    <p className="text-[12px] font-black text-white leading-tight">{dailySummary.totalTEBusy.toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-rose-300">{dailySummary.avgTEBusyPercent}%</p>
                  </div>
                  <div className="bg-white/15 backdrop-blur rounded-lg px-2 py-1.5 text-center">
                    <p className="text-[8px] font-bold text-white/70 uppercase tracking-wider">Sys Busy</p>
                    <p className="text-[12px] font-black text-white leading-tight">{dailySummary.totalSysBusy.toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-amber-300">{dailySummary.avgSysBusyPercent}%</p>
                  </div>
                  <div className="bg-white/15 backdrop-blur rounded-lg px-2 py-1.5 text-center">
                    <p className="text-[8px] font-bold text-white/70 uppercase tracking-wider">Others</p>
                    <p className="text-[12px] font-black text-white leading-tight">{dailySummary.totalOthers.toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-emerald-300">{dailySummary.avgOthersPercent}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Actions */}
            <div className="flex gap-2 mt-3">
              {canExportCSV && (
                <button
                  onClick={handleExportCSV}
                  className="flex-1 py-2.5 text-[11px] font-bold text-purple-700 bg-white rounded-xl border border-purple-200 shadow-sm hover:bg-purple-50 transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              )}
              {canExportExcel && (
                <button
                  onClick={handleExportDailySummary}
                  className="flex-1 py-2.5 text-[11px] font-bold text-emerald-700 bg-white rounded-xl border border-emerald-200 shadow-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Export Excel
                </button>
              )}
            </div>
          </section>
        )}

        {/* No Data State */}
        {!isLoading && !dailySummary && !error && (
          <div className="flex flex-col items-center justify-center py-16 px-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-base font-bold text-slate-700 text-center">Belum ada data</p>
            <p className="text-xs text-slate-400 text-center mt-1.5">Tidak ada data call record untuk tanggal ini</p>
          </div>
        )}
      </div>

      {/* ==================== DESKTOP VIEW ==================== */}
      <div className="hidden md:block mx-auto flex-1 mt-10 md:mt-12 px-4 space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700 font-medium">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Call Records</h1>
              <p className="text-gray-600 mt-1">
                Data for:{" "}
                <span className="font-semibold text-blue-600">
                  {formatDisplayDate(selectedDate)}
                </span>
                {userRole && (
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs font-medium ${userRole === "Super Admin"
                      ? "bg-purple-100 text-purple-800"
                      : userRole === "Admin"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    Role: {userRole}
                  </span>
                )}
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex flex-wrap gap-3">
              <div className="flex items-center space-x-2 bg-blue-50 rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-sm font-medium text-blue-700"
                />
              </div>

              {/* Delete Button - HIDDEN UNTUK ROLE SELAIN 1 & 2 */}
              {hasFullAccess && (
                <button
                  onClick={handleDeleteRecords}
                  disabled={
                    records.length === 0 || !hasDeletePermission || isLoading
                  }
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center ${hasDeletePermission
                    ? "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                    }`}
                  title={
                    !hasDeletePermission
                      ? `Missing permission: callrecord.delete`
                      : records.length === 0
                        ? "No records to delete"
                        : "Delete all records for selected date"
                  }
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isLoading ? "Deleting..." : "Delete Records"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        {hasFullAccess ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveSection("summary")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeSection === "summary"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
              >
                📊 Daily Summary & Charts
              </button>
              <button
                onClick={() => setActiveSection("records")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeSection === "records"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
              >
                📋 Call Records ({totalRecords.toLocaleString()})
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">
                Viewing Daily Summary & Charts
              </span>
            </div>
          </div>
        )}

        {/* Content Sections */}
        {hasFullAccess ? (
          <>
            {activeSection === "records" && (
              <CallRecordsSection
                records={records}
                recordsResponse={recordsResponse}
                isLoading={isLoading}
                searchTerm={queryParams.search}
                onSearchChange={handleSearch}
                filterReason={filterReason}
                onFilterReasonChange={handleFilterReason}
                filterHour={filterHour}
                onFilterHourChange={handleFilterHour}
                sortBy={queryParams.sortBy}
                sortDir={queryParams.sortDir}
                onSort={handleSort}
                currentPage={currentPage}
                totalPages={totalPages}
                hasNext={hasNext}
                hasPrevious={hasPrevious}
                onPageChange={handlePageChange}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
                getCloseReasonText={getCloseReasonText}
                getCloseReasonDescription={getCloseReasonDescription}
                dailySummary={dailySummary} // TAMBAHKAN INI
              />
            )}

            {activeSection === "summary" && (
              <SummarySection
                dailySummary={dailySummary}
                isLoading={isLoading}
                selectedDate={selectedDate}
              />
            )}
          </>
        ) : (
          <SummarySection
            dailySummary={dailySummary}
            isLoading={isLoading}
            selectedDate={selectedDate}
          />
        )}
      </div>
    </div>
  );
};

// Sub-component for Records Section dengan FILTERED STATS
const CallRecordsSection: React.FC<{
  records: CallRecord[];
  recordsResponse: CallRecordsResponse | null;
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterReason: "all" | number;
  onFilterReasonChange: (reason: "all" | number) => void;
  filterHour: "all" | number;
  onFilterHourChange: (hour: "all" | number) => void;
  sortBy: string;
  sortDir: string;
  onSort: (field: string) => void;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  getCloseReasonText: (reasonCode: number) => string;
  getCloseReasonDescription: (reasonCode: number) => string;
  dailySummary: DailySummary | null; // TAMBAHAN
}> = ({
  records,
  recordsResponse,
  isLoading,
  searchTerm,
  onSearchChange,
  filterReason,
  onFilterReasonChange,
  filterHour,
  onFilterHourChange,
  sortBy,
  sortDir,
  onSort,
  currentPage,
  totalPages,
  hasNext,
  hasPrevious,
  onPageChange,
  showFilters,
  onToggleFilters,
  getCloseReasonText,
  getCloseReasonDescription,
  dailySummary, // TAMBAHAN
}) => {
    const totalRecords = recordsResponse?.meta?.pagination?.totalCount || 0;
    const pageSize = recordsResponse?.meta?.pagination?.pageSize || 15;

    // CALCULATE FILTERED STATS
    const getFilteredStats = () => {
      let total = 0;
      let teBusy = 0;
      let sysBusy = 0;
      let others = 0;

      // Jika tidak ada filter, gunakan total dari dailySummary
      if (filterHour === "all" && filterReason === "all") {
        if (dailySummary) {
          total = dailySummary.totalQty;
          teBusy = dailySummary.totalTEBusy;
          sysBusy = dailySummary.totalSysBusy;
          others = dailySummary.totalOthers;
        }
      } else {
        // Ada filter aktif
        if (dailySummary && dailySummary.hourlyData) {
          // Filter berdasarkan Hour
          if (filterHour !== "all" && typeof filterHour === "number") {
            const hourData = dailySummary.hourlyData.find(
              (h) => h.hourGroup === filterHour
            );
            if (hourData) {
              total = hourData.qty;
              teBusy = hourData.teBusy;
              sysBusy = hourData.sysBusy;
              others = hourData.others;
            }
          } else {
            // Jika hour = all, gunakan total
            total = dailySummary.totalQty;
            teBusy = dailySummary.totalTEBusy;
            sysBusy = dailySummary.totalSysBusy;
            others = dailySummary.totalOthers;
          }

          // Filter berdasarkan Reason
          if (filterReason !== "all" && typeof filterReason === "number") {
            if (filterReason === 0) {
              // Hanya TE Busy
              total = teBusy;
              sysBusy = 0;
              others = 0;
            } else if (filterReason === 1) {
              // Hanya System Busy
              total = sysBusy;
              teBusy = 0;
              others = 0;
            } else {
              // Reason 2-10: gunakan totalRecords dari API response
              // karena backend sudah menghitung dengan filter yang benar
              total = totalRecords;
              teBusy = 0;
              sysBusy = 0;
              others = totalRecords;
            }
          }
        }
      }

      return { total, teBusy, sysBusy, others };
    };

    const filteredStats = getFilteredStats();

    // Check apakah ada filter aktif
    const isFiltered = filterHour !== "all" || filterReason !== "all";
    const filterLabel = [];
    if (filterHour !== "all") {
      filterLabel.push(
        `Hour ${filterHour.toString().padStart(2, "0")}.00-${filterHour
          .toString()
          .padStart(2, "0")}.59`
      );
    }
    if (filterReason !== "all") {
      filterLabel.push(getCloseReasonText(filterReason));
    }

    return (
      <div className="space-y-6">
        {/* Filter Status Banner */}
        {isFiltered && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Filter className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">
                  Active Filter: {filterLabel.join(" • ")}
                </span>
              </div>
              <button
                onClick={() => {
                  onFilterHourChange("all");
                  onFilterReasonChange("all");
                }}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats dengan FILTERED DATA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-blue-600">
              {filteredStats.total.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Records</div>
            {filterReason !== "all" &&
              typeof filterReason === "number" &&
              filterReason >= 2 && (
                <div className="text-xs text-blue-600 mt-1">
                  {getCloseReasonText(filterReason)}
                </div>
              )}
          </div>

          <div
            className={`bg-white rounded-lg p-4 border border-gray-200 text-center hover:shadow-md transition-shadow ${filterReason !== "all" && filterReason !== 0 ? "opacity-50" : ""
              }`}
          >
            <div className="text-2xl font-bold text-red-600">
              {filteredStats.teBusy.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">TE Busy</div>
            {filteredStats.total > 0 && filteredStats.teBusy > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                ({((filteredStats.teBusy / filteredStats.total) * 100).toFixed(1)}
                %)
              </div>
            )}
          </div>

          <div
            className={`bg-white rounded-lg p-4 border border-gray-200 text-center hover:shadow-md transition-shadow ${filterReason !== "all" && filterReason !== 1 ? "opacity-50" : ""
              }`}
          >
            <div className="text-2xl font-bold text-yellow-600">
              {filteredStats.sysBusy.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">System Busy</div>
            {filteredStats.total > 0 && filteredStats.sysBusy > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                (
                {((filteredStats.sysBusy / filteredStats.total) * 100).toFixed(1)}
                %)
              </div>
            )}
          </div>

          <div
            className={`bg-white rounded-lg p-4 border border-gray-200 text-center hover:shadow-md transition-shadow ${filterReason !== "all" && filterReason < 2 ? "opacity-50" : ""
              }`}
          >
            <div className="text-2xl font-bold text-green-600">
              {filteredStats.others.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              Others
              {filterReason !== "all" &&
                typeof filterReason === "number" &&
                filterReason >= 2 && (
                  <span className="block text-xs text-green-600 mt-1">
                    ({getCloseReasonText(filterReason)})
                  </span>
                )}
            </div>
            {filteredStats.total > 0 && filteredStats.others > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                ({((filteredStats.others / filteredStats.total) * 100).toFixed(1)}
                %)
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by reason, time, or description..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-sm"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onToggleFilters}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {showFilters ? (
                  <ChevronUp className="w-4 h-4 ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-1" />
                )}
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hour Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Hour
                  </label>
                  <select
                    value={filterHour === "all" ? "all" : filterHour}
                    onChange={(e) =>
                      onFilterHourChange(
                        e.target.value === "all" ? "all" : Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Hours</option>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, "0")}.00 -{" "}
                        {i.toString().padStart(2, "0")}.59
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reason Filter dengan semua 11 options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Reason
                  </label>
                  <select
                    value={filterReason === "all" ? "all" : filterReason}
                    onChange={(e) =>
                      onFilterReasonChange(
                        e.target.value === "all" ? "all" : Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Reasons</option>
                    <option value={0}>TE Busy</option>
                    <option value={1}>System Busy</option>
                    <option value={2}>No Answer</option>
                    <option value={3}>Not Found</option>
                    <option value={4}>Complete</option>
                    <option value={5}>Preempted</option>
                    <option value={6}>Timeout</option>
                    <option value={7}>Inactive</option>
                    <option value={8}>Callback</option>
                    <option value={9}>Unsupported Request</option>
                    <option value={10}>Invalid Call</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 truncate">
                  Call Records Data
                </h3>
                <p className="text-xs text-gray-600 mt-1 truncate">
                  Showing {records.length} of {totalRecords.toLocaleString()}{" "}
                  records
                  {searchTerm && ` • Searching for "${searchTerm}"`}
                </p>
              </div>

              <div className="flex-shrink-0">
                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto max-w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Time
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Reason Code
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    Description
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Hour
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <span className="text-gray-500 text-sm">
                          Loading records...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : records.length > 0 ? (
                  records.map((record, index) => (
                    <tr
                      key={`${record.callRecordId}-${index}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-600 font-mono">
                        {record.callTime}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 font-mono bg-gray-50 rounded text-center">
                        {record.callCloseReason}
                      </td>
                      <td className="px-3 py-3 text-xs max-w-[150px]">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${record.callCloseReason === 0
                            ? "bg-red-100 text-red-800 border-red-200"
                            : record.callCloseReason === 1
                              ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                              : "bg-green-100 text-green-800 border-green-200"
                            }`}
                        >
                          {getCloseReasonText(record.callCloseReason)}
                        </span>
                        <div className="mt-1 text-gray-600 line-clamp-2">
                          {getCloseReasonDescription(record.callCloseReason)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          H{record.hourGroup}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center py-4">
                        <Phone className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          No call records found
                        </p>
                        <p className="text-xs text-gray-600 text-center max-w-xs">
                          {searchTerm ||
                            filterReason !== "all" ||
                            filterHour !== "all"
                            ? "No records match your search or filter criteria."
                            : "No data available for the selected date."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200">
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                <div className="text-xs text-gray-700 text-center xs:text-left">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, totalRecords)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">
                    {totalRecords.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-center space-x-1">
                  <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!hasPrevious}
                    className="p-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>

                  <div className="flex items-center space-x-1">
                    {[currentPage - 1, currentPage, currentPage + 1]
                      .filter((page) => page >= 1 && page <= totalPages)
                      .map((page) => (
                        <button
                          key={page}
                          onClick={() => onPageChange(page)}
                          className={`px-2 py-1 border text-xs font-medium min-w-[32px] ${currentPage === page
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            } rounded`}
                        >
                          {page}
                        </button>
                      ))}
                  </div>

                  <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!hasNext}
                    className="p-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

// Sub-component for Summary Section
const SummarySection: React.FC<{
  dailySummary: DailySummary | null;
  isLoading: boolean;
  selectedDate: string;
}> = ({ dailySummary, isLoading, selectedDate }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="flex justify-center items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="text-gray-600 font-medium">
            Loading summary data...
          </span>
        </div>
      </div>
    );
  }

  if (!dailySummary) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 text-lg font-medium mb-2">
          No summary data available
        </p>
        <p className="text-gray-500 text-sm">
          Select a date with data to view summary
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Daily Call Summary
            </h2>
            <p className="text-gray-600 mt-1">
              Overview for{" "}
              {new Date(selectedDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
            {dailySummary.totalQty.toLocaleString()} Total Calls
          </div>
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Calls"
          value={dailySummary.totalQty.toLocaleString()}
          icon={Phone}
          color="blue"
          description="Total call attempts"
        />
        <StatCard
          title="TE Busy"
          value={`${dailySummary.totalTEBusy.toLocaleString()} (${dailySummary.avgTEBusyPercent
            }%)`}
          icon={PhoneOff}
          color="red"
          description="Terminal Equipment busy"
        />
        <StatCard
          title="System Busy"
          value={`${dailySummary.totalSysBusy.toLocaleString()} (${dailySummary.avgSysBusyPercent
            }%)`}
          icon={PhoneMissed}
          color="yellow"
          description="System capacity busy"
        />
        <StatCard
          title="Others"
          value={`${dailySummary.totalOthers.toLocaleString()} (${dailySummary.avgOthersPercent
            }%)`}
          icon={TrendingUp}
          color="green"
          description="Other call outcomes"
        />
      </div>

      {/* Charts Section */}
      {dailySummary.hourlyData && dailySummary.hourlyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Call Distribution by Hour
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <BarChart3 className="w-4 h-4" />
                <span>24-hour overview</span>
              </div>
            </div>
            <HourlyChart hourlyData={dailySummary.hourlyData} />
          </div>

          {/* Hourly Summary Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Hourly Detailed Summary
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span>Breakdown by hour</span>
              </div>
            </div>
            <HourlySummaryTable hourlyData={dailySummary.hourlyData} />
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable StatCard Component
const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ElementType;
  color: "blue" | "red" | "yellow" | "green";
  description: string;
}> = ({ title, value, icon: Icon, color, description }) => {
  const colorConfig = {
    blue: {
      bg: "bg-blue-50",
      iconBg: "bg-blue-500",
      text: "text-blue-700",
      valueText: "text-blue-900",
      border: "border-blue-100",
    },
    red: {
      bg: "bg-red-50",
      iconBg: "bg-red-500",
      text: "text-red-700",
      valueText: "text-red-900",
      border: "border-red-100",
    },
    yellow: {
      bg: "bg-yellow-50",
      iconBg: "bg-yellow-500",
      text: "text-yellow-700",
      valueText: "text-yellow-900",
      border: "border-yellow-100",
    },
    green: {
      bg: "bg-green-50",
      iconBg: "bg-green-500",
      text: "text-green-700",
      valueText: "text-green-900",
      border: "border-green-100",
    },
  };

  const config = colorConfig[color];

  return (
    <div
      className={`relative rounded-2xl border ${config.border} ${config.bg} p-6 hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px] group overflow-hidden`}
    >
      {/* Background accent */}
      <div
        className={`absolute top-0 left-0 w-1 h-full ${config.iconBg}`}
      ></div>

      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div
          className={`p-3 rounded-xl ${config.iconBg} text-white shadow-sm group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold ${config.text} mb-1 uppercase tracking-wide`}
          >
            {title}
          </p>
          <p
            className={`text-2xl font-bold ${config.valueText} mb-2 leading-tight`}
          >
            {value}
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default CallRecordsPage;
