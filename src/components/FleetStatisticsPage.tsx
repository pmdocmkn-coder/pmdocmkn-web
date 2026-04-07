import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Users, Phone, Clock, TrendingUp, Filter, Download, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown, Search, Info, X, RefreshCw, ChevronRight } from 'lucide-react';
import { MobilePageHeader } from './ui/MobilePageHeader';
import { motion, AnimatePresence, cubicBezier } from 'framer-motion';
import { callRecordApi } from '../services/api';
import { hasPermission } from '../utils/permissionUtils';
import { FleetStatisticsDto, FleetStatisticType, TopCallerFleetDto, TopCalledFleetDto, UniqueCallerDetailDto, UniqueCalledDetailDto } from '../types/callRecord';
import { format } from 'date-fns';
import { id as dateFnsLocale } from 'date-fns/locale';
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { id as localeId } from "react-day-picker/locale";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: cubicBezier(0.25, 0.46, 0.45, 0.94)
    }
  }
};

const cardHoverVariants = {
  rest: {
    scale: 1,
    y: 0
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: {
      duration: 0.3,
      ease: cubicBezier(0.25, 0.46, 0.45, 0.94)
    }
  }
};

const filterVariants = {
  collapsed: {
    height: 0,
    opacity: 0
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: cubicBezier(0.25, 0.46, 0.45, 0.94)
    }
  }
};

const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3
    }
  })
};

const FleetStatisticsPage: React.FC = () => {
  // Date range state
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // State Date Range Popover
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [mobDateRangeOpen, setMobDateRangeOpen] = useState(false);

  const deskCalRef = useRef<HTMLDivElement>(null);
  const mobCalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (deskCalRef.current && !deskCalRef.current.contains(e.target as Node)) {
        setDateRangeOpen(false);
      }
      if (mobCalRef.current && !mobCalRef.current.contains(e.target as Node)) {
        setMobDateRangeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatRangeLabel = () => {
    if (!startDate && !endDate) return "Pilih Rentang Tanggal";
    if (startDate && !endDate) return format(new Date(startDate), "d MMM yyyy", { locale: dateFnsLocale });
    if (startDate === endDate) return format(new Date(startDate), "d MMM yyyy", { locale: dateFnsLocale });
    return `${format(new Date(startDate), "d MMM yyyy", { locale: dateFnsLocale })} – ${format(new Date(endDate), "d MMM yyyy", { locale: dateFnsLocale })}`;
  };

  const [topCount, setTopCount] = useState<number>(10);
  const [statisticType, setStatisticType] = useState<FleetStatisticType>(FleetStatisticType.All);
  const [statistics, setStatistics] = useState<FleetStatisticsDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  // New state for enhancements
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [sortBy, setSortBy] = useState<'calls' | 'unique'>('calls');
  const [callerSearch, setCallerSearch] = useState('');
  const [calledSearch, setCalledSearch] = useState('');

  const [currentPageCaller, setCurrentPageCaller] = useState(1);
  const [currentPageCalled, setCurrentPageCalled] = useState(1);

  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    type: 'caller' | 'called';
    fleet: string;
    data: UniqueCallerDetailDto[] | UniqueCalledDetailDto[];
    isLoading: boolean;
  }>({ isOpen: false, type: 'caller', fleet: '', data: [], isLoading: false });

  // Modal search and sort states
  const [modalSearch, setModalSearch] = useState('');
  const [modalSortField, setModalSortField] = useState<'calls' | 'duration'>('calls');
  const [modalSortOrder, setModalSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Permission check
  const canExport = hasPermission("callrecord.export-excel");

  useEffect(() => {
    loadFleetStatistics();
  }, [startDate, endDate, topCount, statisticType, sortOrder, sortBy]);

  const loadFleetStatistics = async () => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('🔄 Loading fleet statistics...', { startDate, endDate, topCount, statisticType, sortOrder, sortBy, callerSearch, calledSearch });
      const data = await callRecordApi.getFleetStatistics(
        startDate,
        endDate,
        10000,
        statisticType,
        sortOrder,
        sortBy,
        callerSearch || undefined,
        calledSearch || undefined
      );
      setStatistics(data);
      setCurrentPageCaller(1);
      setCurrentPageCalled(1);
    } catch (err: any) {
      console.error('❌ Error loading fleet statistics:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load fleet statistics');
      setStatistics(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Load unique callers detail for a called fleet
  const loadUniqueCallersDetail = async (calledFleet: string) => {
    setDetailModal(prev => ({ ...prev, isOpen: true, type: 'caller', fleet: calledFleet, isLoading: true, data: [] }));
    setModalSearch('');
    setModalSortField('calls');
    setModalSortOrder('DESC');
    try {
      const data = await callRecordApi.getUniqueCallersForFleet(calledFleet, startDate, endDate);
      setDetailModal(prev => ({ ...prev, data, isLoading: false }));
    } catch (err: any) {
      console.error('❌ Error loading unique callers:', err);
      setDetailModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Load unique called fleets detail for a caller
  const loadUniqueCalledDetail = async (callerFleet: string) => {
    setDetailModal(prev => ({ ...prev, isOpen: true, type: 'called', fleet: callerFleet, isLoading: true, data: [] }));
    try {
      const data = await callRecordApi.getUniqueCalledFleetsForCaller(callerFleet, startDate, endDate);
      setDetailModal(prev => ({ ...prev, data, isLoading: false }));
    } catch (err: any) {
      console.error('❌ Error loading unique called fleets:', err);
      setDetailModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportUniqueCallers = async () => {
    if (!detailModal.fleet) return;

    setIsExporting(true);
    try {
      await callRecordApi.exportUniqueCallersExcel(detailModal.fleet, startDate, endDate);
    } catch (err) {
      console.error('Failed to export unique callers:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const closeDetailModal = () => {
    setDetailModal({ isOpen: false, type: 'caller', fleet: '', data: [], isLoading: false });
  };

  const formatDisplayDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return date;
    }
  };

  const getTypeDescription = () => {
    switch (statisticType) {
      case FleetStatisticType.Caller:
        return 'Top Caller Fleets';
      case FleetStatisticType.Called:
        return 'Top Called Fleets';
      default:
        return 'Fleet Statistics';
    }
  };

  const handleTypeChange = (type: FleetStatisticType) => {
    setStatisticType(type);
  };

  return (
    <div className="w-full">
      {/* ==================== MOBILE VIEW ==================== */}
      <div className="md:hidden bg-[#f8f5fc] min-h-screen pb-24 text-slate-900 font-sans">
        <MobilePageHeader
          label="Analytics"
          title="Fleet Statistics"
          rightAction={
            <button onClick={loadFleetStatistics} disabled={isLoading} className="flex items-center justify-center rounded-xl h-9 w-9 bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg shadow-purple-500/25 active:scale-90 transition-all">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          }
        />

        {/* Search Bar */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex w-full items-center rounded-2xl h-12 bg-white shadow-[0_2px_16px_rgba(147,17,212,0.06)] border border-purple-100/70 overflow-hidden focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-purple-300 transition-all">
            <div className="text-purple-500 flex items-center justify-center pl-4">
              <Search className="w-[18px] h-[18px]" />
            </div>
            <input
              className="flex w-full border-none bg-transparent focus:ring-0 h-full placeholder:text-slate-400 text-slate-800 px-3 text-[13px] font-medium"
              placeholder="Search for Fleet ID..."
              value={callerSearch || calledSearch}
              onChange={(e) => {
                setCallerSearch(e.target.value);
                setCalledSearch(e.target.value);
              }}
            />
            {(callerSearch || calledSearch) && (
              <button onClick={() => { setCallerSearch(''); setCalledSearch(''); }} className="pr-3 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Section */}
        <section className="px-4 space-y-5 mt-2">
          {/* Date Range Dropdown */}
          <div className="mb-4">
            <h3 className="text-slate-600 text-[10px] font-extrabold uppercase tracking-[0.15em] mb-2.5 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-purple-400" />
              Date Range
            </h3>
            <div className="relative" ref={mobCalRef}>
              <button 
                onClick={() => setMobDateRangeOpen(prev => !prev)}
                className="w-full bg-white border border-purple-100/60 shadow-[0_1px_8px_rgba(147,17,212,0.04)] hover:border-purple-300 rounded-xl px-4 py-3 flex items-center justify-between text-sm font-bold text-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  {formatRangeLabel()}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              
              {mobDateRangeOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-slate-900/40 z-[100] backdrop-blur-sm"
                    onClick={() => setMobDateRangeOpen(false)}
                  />
                  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] bg-white rounded-2xl shadow-2xl border border-purple-100 p-4 w-[90%] max-w-[360px] max-h-[85vh] overflow-y-auto flex flex-col">
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                      <div className="flex justify-center">
                        <DayPicker
                          mode="range"
                          selected={dateRange}
                          onSelect={(r) => setDateRange(r)}
                          locale={localeId}
                          showOutsideDays
                          disabled={{ after: new Date() }}
                        />
                      </div>
                    </div>
                    {/* Fixed Footer */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-2 text-sm bg-white shrink-0">
                      <div className="flex gap-4">
                        <button onClick={() => { setDateRange(undefined); setStartDate(""); setEndDate(""); }} className="text-gray-400 hover:text-red-500 font-medium transition-colors">Hapus</button>
                        <button onClick={() => setDateRange({ from: new Date(), to: new Date() })} className="text-purple-600 font-bold hover:text-purple-800 transition-colors">Hari ini</button>
                      </div>
                      <button 
                        onClick={() => {
                          if (dateRange?.from) setStartDate(format(dateRange.from, 'yyyy-MM-dd'));
                          else setStartDate("");
                          
                          if (dateRange?.to) setEndDate(format(dateRange.to, 'yyyy-MM-dd'));
                          else if (dateRange?.from) setEndDate(format(dateRange.from, 'yyyy-MM-dd'));
                          else setEndDate("");
                          
                          setMobDateRangeOpen(false);
                        }} 
                        className="bg-purple-600 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors"
                      >
                        Selesai
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Statistics Type Segmented Control */}
          <div>
            <h3 className="text-slate-600 text-[10px] font-extrabold uppercase tracking-[0.15em] mb-2.5 flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-purple-400" />
              Statistics Type
            </h3>
            <div className="flex p-1.5 bg-white rounded-2xl border border-purple-100/50 shadow-[0_1px_8px_rgba(147,17,212,0.04)]">
              <button onClick={() => setStatisticType(FleetStatisticType.All)} className={`flex-1 py-2 flex justify-center text-[11px] font-bold rounded-xl transition-all duration-200 ${statisticType === FleetStatisticType.All ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500'}`}>All</button>
              <button onClick={() => setStatisticType(FleetStatisticType.Caller)} className={`flex-1 py-2 flex justify-center text-[11px] font-bold rounded-xl transition-all duration-200 ${statisticType === FleetStatisticType.Caller ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500'}`}>Top Caller</button>
              <button onClick={() => setStatisticType(FleetStatisticType.Called)} className={`flex-1 py-2 flex justify-center text-[11px] font-bold rounded-xl transition-all duration-200 ${statisticType === FleetStatisticType.Called ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500'}`}>Top Called</button>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex gap-2">
            <div className="flex-1">
              <h3 className="text-slate-600 text-[10px] font-extrabold uppercase tracking-[0.15em] mb-2 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-purple-400" />
                Sort
              </h3>
              <div className="flex gap-1.5">
                <button onClick={() => setSortOrder('DESC')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all ${sortOrder === 'DESC' ? 'bg-purple-600 text-white shadow-sm' : 'bg-white border border-purple-100/60 text-slate-500'}`}>
                  <ArrowDown className="w-3 h-3" /> High
                </button>
                <button onClick={() => setSortOrder('ASC')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all ${sortOrder === 'ASC' ? 'bg-purple-600 text-white shadow-sm' : 'bg-white border border-purple-100/60 text-slate-500'}`}>
                  <ArrowUp className="w-3 h-3" /> Low
                </button>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-slate-600 text-[10px] font-extrabold uppercase tracking-[0.15em] mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-purple-400" />
                By
              </h3>
              <div className="flex gap-1.5">
                <button onClick={() => setSortBy('calls')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all ${sortBy === 'calls' ? 'bg-purple-600 text-white shadow-sm' : 'bg-white border border-purple-100/60 text-slate-500'}`}>
                  <Phone className="w-3 h-3" /> Calls
                </button>
                <button onClick={() => setSortBy('unique')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all ${sortBy === 'unique' ? 'bg-purple-600 text-white shadow-sm' : 'bg-white border border-purple-100/60 text-slate-500'}`}>
                  <Users className="w-3 h-3" /> Unique
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Summary Metrics - Gradient Cards */}
        {statistics && (
          <section className="px-4 mt-6 grid grid-cols-3 gap-2.5">
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-3.5 rounded-2xl shadow-lg shadow-purple-500/15 flex flex-col items-center text-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full -translate-x-2 -translate-y-4" />
              <Phone className="w-4 h-4 text-purple-200 mb-1.5" />
              <p className="text-[8px] font-bold tracking-widest text-purple-200 uppercase mb-0.5">Total Calls</p>
              <p className="text-[20px] leading-none font-black text-white tracking-tight">{statistics.totalCallsInDay.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-3.5 rounded-2xl shadow-lg shadow-indigo-500/15 flex flex-col items-center text-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full -translate-x-2 -translate-y-4" />
              <Users className="w-4 h-4 text-indigo-200 mb-1.5" />
              <p className="text-[8px] font-bold tracking-widest text-indigo-200 uppercase mb-0.5">Callers</p>
              <p className="text-[20px] leading-none font-black text-white tracking-tight">{statistics.totalUniqueCallers.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-violet-500 to-violet-700 p-3.5 rounded-2xl shadow-lg shadow-violet-500/15 flex flex-col items-center text-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full -translate-x-2 -translate-y-4" />
              <Phone className="w-4 h-4 text-violet-200 mb-1.5" />
              <p className="text-[8px] font-bold tracking-widest text-violet-200 uppercase mb-0.5">Called</p>
              <p className="text-[20px] leading-none font-black text-white tracking-tight">{statistics.totalUniqueCalledFleets.toLocaleString()}</p>
            </div>
          </section>
        )}

        {/* Info Box - Terminologi */}
        {statistics && (
          <div className="mx-4 mt-4 p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-100/50">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Penjelasan</p>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-slate-600"><span className="font-bold text-purple-700">Caller Fleet</span> = Fleet yang <span className="font-bold">menelepon</span></p>
                  <p className="text-[10px] text-slate-600"><span className="font-bold text-indigo-700">Called Fleet</span> = Fleet yang <span className="font-bold">dihubungi</span></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 mt-4 gap-3">
            <div className="w-10 h-10 rounded-full border-[3px] border-purple-200 border-t-purple-600 animate-spin" />
            <p className="text-xs font-medium text-slate-500">Memuat statistik fleet...</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-4 p-3.5 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <X className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-xs text-red-700 font-medium flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ===== Top Caller Fleets ===== */}
        {statistics && (statisticType === FleetStatisticType.All || statisticType === FleetStatisticType.Caller) && (
          <section className="px-4 mt-7">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-[15px] font-black text-slate-900 tracking-tight">Top Caller Fleets</h3>
              </div>
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">{statistics.topCallers.length} fleet</span>
            </div>
            <div className="space-y-3">
              {statistics.topCallers.slice((currentPageCaller - 1) * topCount, currentPageCaller * topCount).map((caller, i) => {
                const maxCalls = statistics.topCallers[0]?.totalCalls || 1;
                const pct = Math.round((caller.totalCalls / maxCalls) * 100);
                const rankColor = caller.rank === 1 ? 'from-amber-400 to-amber-500 text-amber-900' : caller.rank === 2 ? 'from-slate-300 to-slate-400 text-slate-700' : caller.rank === 3 ? 'from-orange-300 to-orange-400 text-orange-800' : 'from-purple-100 to-purple-200 text-purple-700';
                return (
                  <div key={caller.rank} className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-purple-50/80 p-4 relative overflow-hidden">
                    {/* Rank Badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${rankColor} flex items-center justify-center shadow-sm`}>
                          <span className="text-[11px] font-black">#{caller.rank}</span>
                        </div>
                        <div>
                          <h4 className="text-[14px] font-black text-slate-900 tracking-tight">{caller.callerFleet}</h4>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Caller Fleet</p>
                        </div>
                      </div>

                    </div>
                    {/* Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-purple-50/70 rounded-xl px-2.5 py-2 text-center">
                        <p className="text-[8px] font-bold text-purple-500 uppercase tracking-wider mb-0.5">Calls</p>
                        <p className="text-[13px] font-black text-slate-800">{caller.totalCalls.toLocaleString()}</p>
                      </div>
                      <div className="bg-indigo-50/70 rounded-xl px-2.5 py-2 text-center">
                        <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">Duration</p>
                        <p className="text-[11px] font-bold text-slate-700">{caller.totalDurationFormatted}</p>
                      </div>
                      <div className="bg-violet-50/70 rounded-xl px-2.5 py-2 text-center">
                        <p className="text-[8px] font-bold text-violet-500 uppercase tracking-wider mb-0.5">Avg</p>
                        <p className="text-[11px] font-bold text-slate-700">{caller.averageDurationFormatted}</p>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-purple-100/50 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {statistics.topCallers.length === 0 && (
                <div className="text-center py-8 bg-white rounded-2xl border border-purple-50">
                  <Users className="w-10 h-10 mx-auto mb-2 text-purple-200" />
                  <p className="text-sm font-bold text-slate-700">No caller data</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada data caller untuk filter ini</p>
                </div>
              )}
            </div>
            {statistics.topCallers.length > topCount && (
              <div className="flex justify-between items-center mt-4">
                <button disabled={currentPageCaller === 1} onClick={() => setCurrentPageCaller(prev => Math.max(1, prev - 1))} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 shadow-sm active:scale-95 transition-all">Previous</button>
                <span className="text-[11px] font-bold text-slate-500">Page {currentPageCaller} of {Math.ceil(statistics.topCallers.length / topCount)}</span>
                <button disabled={currentPageCaller >= Math.ceil(statistics.topCallers.length / topCount)} onClick={() => setCurrentPageCaller(prev => prev + 1)} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 shadow-sm active:scale-95 transition-all">Next</button>
              </div>
            )}
          </section>
        )}

        {/* ===== Top Called Fleets ===== */}
        {statistics && (statisticType === FleetStatisticType.All || statisticType === FleetStatisticType.Called) && (
          <section className="px-4 mt-7 pb-8">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-sm">
                  <Phone className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-[15px] font-black text-slate-900 tracking-tight">Top Called Fleets</h3>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{statistics.topCalledFleets.length} fleet</span>
            </div>
            <div className="space-y-3">
              {statistics.topCalledFleets.slice((currentPageCalled - 1) * topCount, currentPageCalled * topCount).map((called) => {
                const maxCalls = statistics.topCalledFleets[0]?.totalCalls || 1;
                const pct = Math.round((called.totalCalls / maxCalls) * 100);
                const rankColor = called.rank === 1 ? 'from-amber-400 to-amber-500 text-amber-900' : called.rank === 2 ? 'from-slate-300 to-slate-400 text-slate-700' : called.rank === 3 ? 'from-orange-300 to-orange-400 text-orange-800' : 'from-indigo-100 to-indigo-200 text-indigo-700';
                return (
                  <div key={called.rank} onClick={() => loadUniqueCallersDetail(called.calledFleet)} className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-indigo-50/80 p-4 active:scale-[0.98] transition-all relative overflow-hidden">
                    {/* Rank Badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${rankColor} flex items-center justify-center shadow-sm`}>
                          <span className="text-[11px] font-black">#{called.rank}</span>
                        </div>
                        <div>
                          <h4 className="text-[14px] font-black text-slate-900 tracking-tight">{called.calledFleet}</h4>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Called Fleet • {called.uniqueCallers} unique callers</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 mt-2" />
                    </div>
                    {/* Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-indigo-50/70 rounded-xl px-2.5 py-2 text-center">
                        <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">Calls</p>
                        <p className="text-[13px] font-black text-slate-800">{called.totalCalls.toLocaleString()}</p>
                      </div>
                      <div className="bg-violet-50/70 rounded-xl px-2.5 py-2 text-center">
                        <p className="text-[8px] font-bold text-violet-500 uppercase tracking-wider mb-0.5">Duration</p>
                        <p className="text-[11px] font-bold text-slate-700">{called.totalDurationFormatted}</p>
                      </div>
                      <div className="bg-purple-50/70 rounded-xl px-2.5 py-2 text-center">
                        <p className="text-[8px] font-bold text-purple-500 uppercase tracking-wider mb-0.5">Avg</p>
                        <p className="text-[11px] font-bold text-slate-700">{called.averageDurationFormatted}</p>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-indigo-100/50 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {statistics.topCalledFleets.length === 0 && (
                <div className="text-center py-8 bg-white rounded-2xl border border-indigo-50">
                  <Phone className="w-10 h-10 mx-auto mb-2 text-indigo-200" />
                  <p className="text-sm font-bold text-slate-700">No called data</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada data called fleet untuk filter ini</p>
                </div>
              )}
            </div>
            {statistics.topCalledFleets.length > topCount && (
              <div className="flex justify-between items-center mt-4">
                <button disabled={currentPageCalled === 1} onClick={() => setCurrentPageCalled(prev => Math.max(1, prev - 1))} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 shadow-sm active:scale-95 transition-all">Previous</button>
                <span className="text-[11px] font-bold text-slate-500">Page {currentPageCalled} of {Math.ceil(statistics.topCalledFleets.length / topCount)}</span>
                <button disabled={currentPageCalled >= Math.ceil(statistics.topCalledFleets.length / topCount)} onClick={() => setCurrentPageCalled(prev => prev + 1)} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 shadow-sm active:scale-95 transition-all">Next</button>
              </div>
            )}
          </section>
        )}

        {/* No Data State */}
        {!isLoading && !statistics && !error && (
          <div className="flex flex-col items-center justify-center py-16 px-8 mt-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-base font-bold text-slate-700 text-center">Belum ada data statistik</p>
            <p className="text-xs text-slate-400 text-center mt-1.5">Pilih tanggal yang memiliki data untuk melihat statistik fleet</p>
          </div>
        )}
      </div>

      {/* DESKTOP SEC */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="hidden md:flex max-w-6xl mx-auto flex-1 mt-10 md:mt-12 px-4 space-y-6 flex-col"
      >
        {/* Page Header */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between ">
            <div>
              <motion.h1
                className="text-2xl font-bold text-gray-900"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Fleet Statistics
              </motion.h1>
              <motion.p
                className="text-gray-600 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Analyze top caller and called fleet performance
              </motion.p>
            </div>
            <motion.div
              className="mt-4 lg:mt-0 flex flex-wrap gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadFleetStatistics}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 shadow-sm"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {isLoading ? 'Loading...' : 'Refresh'}
              </motion.button>
            </motion.div>
          </div>

        </motion.div>

        {/* Filters Section */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-gray-200 relative z-50"
        >
          {/* Filter Header */}
          <motion.div
            whileHover={{ backgroundColor: "rgba(239, 246, 255, 0.8)" }}
            className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer rounded-t-xl"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <motion.div
                  whileHover={{ rotate: 15 }}
                  className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 mr-3"
                >
                  <Filter className="w-5 h-5 text-blue-600" />
                </motion.div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Filter Settings</h2>
                  <p className="text-sm text-gray-600">Customize your statistics view</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-3">
                  {isFilterExpanded ? 'Collapse' : 'Expand'}
                </span>
                {isFilterExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </div>
          </motion.div>

          {/* Filter Content */}
          <AnimatePresence>
            {isFilterExpanded && (
              <motion.div
                variants={filterVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="p-6 overflow-visible"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Date Range Filter */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                      Date Range
                    </label>
                    <div className="relative" ref={deskCalRef}>
                      <button 
                        onClick={() => setDateRangeOpen(prev => !prev)}
                        className="w-full bg-white border border-gray-300 hover:border-blue-500 rounded-lg px-4 py-3 flex items-center justify-between text-sm text-gray-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <div className="flex items-center gap-2 font-medium">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          {formatRangeLabel()}
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </button>
                      
                      {dateRangeOpen && (
                        <div className="absolute top-full left-0 mt-2 z-[110] bg-white rounded-2xl shadow-xl border border-gray-200 p-4">
                          <DayPicker
                            mode="range"
                            selected={dateRange}
                            onSelect={(r) => setDateRange(r)}
                            locale={localeId}
                            showOutsideDays
                            disabled={{ after: new Date() }}
                            footer={
                              <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-3 text-sm">
                                <div className="flex gap-4">
                                  <button onClick={() => { setDateRange(undefined); setStartDate(""); setEndDate(""); }} className="text-gray-400 hover:text-red-500 font-medium transition-colors">Hapus</button>
                                  <button onClick={() => setDateRange({ from: new Date(), to: new Date() })} className="text-blue-600 font-bold hover:text-blue-800 transition-colors">Hari ini</button>
                                </div>
                                <button 
                                  onClick={() => {
                                    if (dateRange?.from) setStartDate(format(dateRange.from, 'yyyy-MM-dd'));
                                    else setStartDate("");
                                    
                                    if (dateRange?.to) setEndDate(format(dateRange.to, 'yyyy-MM-dd'));
                                    else if (dateRange?.from) setEndDate(format(dateRange.from, 'yyyy-MM-dd'));
                                    else setEndDate("");
                                    
                                    setDateRangeOpen(false);
                                  }} 
                                  className="bg-purple-600 text-white px-5 py-2 rounded-lg text-xs font-bold shadow hover:shadow-md hover:bg-purple-700 transition-all"
                                >
                                  Selesai
                                </button>
                              </div>
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sort Order */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <ArrowUpDown className="w-4 h-4 mr-2 text-indigo-500" />
                      Sort Order
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSortOrder('DESC')}
                        className={`px-3 py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${sortOrder === 'DESC'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                          }`}
                      >
                        <ArrowDown className="w-4 h-4" />
                        <span>High</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSortOrder('ASC')}
                        className={`px-3 py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${sortOrder === 'ASC'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                          }`}
                      >
                        <ArrowUp className="w-4 h-4" />
                        <span>Low</span>
                      </motion.button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {sortOrder === 'DESC' ? 'Highest values first' : 'Lowest values first'}
                    </p>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-orange-500" />
                      Sort By
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSortBy('calls')}
                        className={`px-3 py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${sortBy === 'calls'
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                          }`}
                      >
                        <Phone className="w-4 h-4" />
                        <span>Calls</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSortBy('unique')}
                        className={`px-3 py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${sortBy === 'unique'
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                          }`}
                      >
                        <Users className="w-4 h-4" />
                        <span>Unique</span>
                      </motion.button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {sortBy === 'calls' ? 'Sort by Total Calls' : 'Sort by Unique Callers'}
                    </p>
                  </div>

                  {/* Top Count Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <Users className="w-4 h-4 mr-2 text-purple-500" />
                      Items Per Page
                    </label>
                    <div className="relative">
                      <motion.select
                        whileFocus={{ scale: 1.02 }}
                        value={topCount}
                        onChange={(e) => {
                          setTopCount(Number(e.target.value));
                          setCurrentPageCaller(1);
                          setCurrentPageCalled(1);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all shadow-sm hover:border-gray-400 bg-white"
                      >
                        <option value={5}>5 Records Per Page</option>
                        <option value={10}>10 Records Per Page</option>
                        <option value={20}>20 Records Per Page</option>
                        <option value={50}>50 Records Per Page</option>
                      </motion.select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Display {topCount} performing fleets per page
                    </p>
                  </div>

                  {/* Type Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <Filter className="w-4 h-4 mr-2 text-green-500" />
                      Statistics Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTypeChange(FleetStatisticType.All)}
                        className={`px-3 py-3 text-sm font-medium rounded-lg transition-all flex flex-col items-center justify-center ${statisticType === FleetStatisticType.All
                          ? 'bg-blue-600 text-white shadow-md transform scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 border border-gray-300'
                          }`}
                      >
                        <span>All</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTypeChange(FleetStatisticType.Caller)}
                        className={`px-3 py-3 text-sm font-medium rounded-lg transition-all flex flex-col items-center justify-center ${statisticType === FleetStatisticType.Caller
                          ? 'bg-green-600 text-white shadow-md transform scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 border border-gray-300'
                          }`}
                      >
                        <span>Top Caller</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTypeChange(FleetStatisticType.Called)}
                        className={`px-3 py-3 text-sm font-medium rounded-lg transition-all flex flex-col items-center justify-center ${statisticType === FleetStatisticType.Called
                          ? 'bg-purple-600 text-white shadow-md transform scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 border border-gray-300'
                          }`}
                      >
                        <span>Top Called</span>
                      </motion.button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {statisticType === FleetStatisticType.All && 'Showing all statistics'}
                      {statisticType === FleetStatisticType.Caller && 'Focusing on callers'}
                      {statisticType === FleetStatisticType.Called && 'Focusing on called fleets'}
                    </p>
                  </div>
                </div>

                {/* Caller/Called Explanation */}
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Penjelasan Terminologi</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li><span className="font-medium text-green-700">• Caller Fleet:</span> Fleet yang <strong>MENELEPON</strong> atau menginisiasi panggilan (penelepon)</li>
                        <li><span className="font-medium text-purple-700">• Called Fleet:</span> Fleet yang <strong>DIHUBUNGI</strong> atau menerima panggilan (penerima)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Search Section */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Caller Search */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <Search className="w-4 h-4 mr-2 text-green-500" />
                      Search Caller Fleet
                    </label>
                    <div className="relative">
                      <motion.input
                        whileFocus={{ scale: 1.02 }}
                        type="text"
                        value={callerSearch}
                        onChange={(e) => setCallerSearch(e.target.value)}
                        placeholder="Ketik fleet ID..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-400"
                      />
                      {callerSearch && (
                        <button
                          onClick={() => setCallerSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Called Search */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <Search className="w-4 h-4 mr-2 text-purple-500" />
                      Search Called Fleet
                    </label>
                    <div className="relative">
                      <motion.input
                        whileFocus={{ scale: 1.02 }}
                        type="text"
                        value={calledSearch}
                        onChange={(e) => setCalledSearch(e.target.value)}
                        placeholder="Ketik fleet ID..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:border-gray-400"
                      />
                      {calledSearch && (
                        <button
                          onClick={() => setCalledSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Search Button */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">&nbsp;</label>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={loadFleetStatistics}
                      disabled={isLoading}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Search className="w-4 h-4" />
                      {isLoading ? 'Searching...' : 'Apply Search'}
                    </motion.button>
                  </div>
                </div>
                {statistics && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 pt-6 border-t border-gray-100"
                  >
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Preview</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-blue-50 rounded-lg p-3"
                      >
                        <div className="text-lg font-bold text-blue-700">{statistics.totalCallsInDay.toLocaleString()}</div>
                        <div className="text-xs text-blue-600">Total Calls</div>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-purple-50 rounded-lg p-3"
                      >
                        <div className="text-lg font-bold text-purple-700">{statistics.totalUniqueCallers.toLocaleString()}</div>
                        <div className="text-xs text-purple-600">Unique Callers</div>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-orange-50 rounded-lg p-3"
                      >
                        <div className="text-lg font-bold text-orange-700">{statistics.totalUniqueCalledFleets.toLocaleString()}</div>
                        <div className="text-xs text-orange-600">Unique Called</div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 overflow-hidden"
            >
              <div className="flex items-center">
                <span className="text-red-700 font-medium">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overall Statistics */}
        {statistics && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { title: "Total Calls", value: statistics.totalCallsInDay.toLocaleString(), icon: Phone, color: "blue", description: "Total calls for the day" },
              { title: "Unique Callers", value: statistics.totalUniqueCallers.toLocaleString(), icon: Users, color: "purple", description: "Unique caller fleets" },
              { title: "Unique Called", value: statistics.totalUniqueCalledFleets.toLocaleString(), icon: Users, color: "orange", description: "Unique called fleets" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                custom={index}
                variants={itemVariants}
                whileHover="hover"
              >
                <StatCard
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.color as any}
                  description={stat.description}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Loading State */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center"
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                {/* Spinner */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 border-4 border-blue-300 border-t-blue-600 rounded-full"
                ></motion.div>

                {/* Text */}
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-600 text-sm font-medium"
                >
                  Loading fleet statistics...
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Callers Section */}
        {statistics && (statisticType === FleetStatisticType.All || statisticType === FleetStatisticType.Caller) && (
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Top Caller Fleets
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Fleets that initiated the most calls on {startDate === endDate ? formatDisplayDate(startDate) : `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`}
              </p>
            </div>

            {statistics.topCallers.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caller Fleet</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Calls</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {statistics.topCallers.slice((currentPageCaller - 1) * topCount, currentPageCaller * topCount).map((caller, index) => (
                        <motion.tr
                          key={caller.rank}
                          custom={index}
                          variants={tableRowVariants}
                          initial="hidden"
                          animate="show"
                          whileHover={{ backgroundColor: "rgba(243, 244, 246, 0.5)" }}
                          className="transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${caller.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                              caller.rank === 2 ? 'bg-gray-100 text-gray-800' :
                                caller.rank === 3 ? 'bg-orange-100 text-orange-800' :
                                  'bg-blue-100 text-blue-800'
                              }`}>
                              #{caller.rank}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {caller.callerFleet}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                            {caller.totalCalls.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {caller.totalDurationFormatted}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {caller.averageDurationFormatted}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden flex flex-col gap-3 p-4">
                  {statistics.topCallers.slice((currentPageCaller - 1) * topCount, currentPageCaller * topCount).map((caller) => (
                    <div key={caller.rank} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${caller.rank === 1 ? 'bg-yellow-400' :
                        caller.rank === 2 ? 'bg-gray-400' :
                          caller.rank === 3 ? 'bg-orange-400' :
                            'bg-blue-400'
                        }`} />
                      <div className="pl-2">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-xs font-medium text-gray-500 mb-1 block">Rank #{caller.rank}</span>
                            <h4 className="text-base font-bold text-gray-900">{caller.callerFleet}</h4>
                          </div>
                          <div className="bg-blue-50 text-blue-700 font-mono font-bold px-3 py-1 rounded-full text-sm">
                            {caller.totalCalls.toLocaleString()} calls
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-50">
                          <div>
                            <span className="text-xs text-gray-500 block">Total Duration</span>
                            <span className="text-sm font-medium text-gray-800">{caller.totalDurationFormatted}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">Avg Duration</span>
                            <span className="text-sm font-medium text-gray-800">{caller.averageDurationFormatted}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Pagination Controls */}
                {statistics.topCallers.length > topCount && (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <button
                      onClick={() => setCurrentPageCaller(p => Math.max(1, p - 1))}
                      disabled={currentPageCaller === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600 font-medium">
                      Page {currentPageCaller} of {Math.ceil(statistics.topCallers.length / topCount)}
                    </span>
                    <button
                      onClick={() => setCurrentPageCaller(p => p + 1)}
                      disabled={currentPageCaller >= Math.ceil(statistics.topCallers.length / topCount)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-900 mb-2">No caller data available</p>
                <p className="text-sm text-gray-600">No top caller statistics found for the selected date and filters.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Top Called Fleets Section */}
        {statistics && (statisticType === FleetStatisticType.All || statisticType === FleetStatisticType.Called) && (
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Top Called Fleets
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Fleets that received the most calls on {startDate === endDate ? formatDisplayDate(startDate) : `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`}
              </p>
            </div>

            {statistics.topCalledFleets.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Called Fleet</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Calls</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Callers</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {statistics.topCalledFleets.slice((currentPageCalled - 1) * topCount, currentPageCalled * topCount).map((called, index) => (
                        <motion.tr
                          key={called.rank}
                          custom={index}
                          variants={tableRowVariants}
                          initial="hidden"
                          animate="show"
                          whileHover={{ backgroundColor: "rgba(243, 244, 246, 0.5)" }}
                          className="transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${called.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                              called.rank === 2 ? 'bg-gray-100 text-gray-800' :
                                called.rank === 3 ? 'bg-orange-100 text-orange-800' :
                                  'bg-green-100 text-green-800'
                              }`}>
                              #{called.rank}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {called.calledFleet}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                            {called.totalCalls.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {called.totalDurationFormatted}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {called.averageDurationFormatted}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => loadUniqueCallersDetail(called.calledFleet)}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer transition-colors"
                            >
                              {called.uniqueCallers} callers →
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden flex flex-col gap-3 p-4">
                  {statistics.topCalledFleets.slice((currentPageCalled - 1) * topCount, currentPageCalled * topCount).map((called) => (
                    <div key={called.rank} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${called.rank === 1 ? 'bg-yellow-400' :
                        called.rank === 2 ? 'bg-gray-400' :
                          called.rank === 3 ? 'bg-orange-400' :
                            'bg-green-400'
                        }`} />
                      <div className="pl-2">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-xs font-medium text-gray-500 mb-1 block">Rank #{called.rank}</span>
                            <h4 className="text-base font-bold text-gray-900">{called.calledFleet}</h4>
                          </div>
                          <div className="bg-green-50 text-green-700 font-mono font-bold px-3 py-1 rounded-full text-sm">
                            {called.totalCalls.toLocaleString()} calls
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-50">
                          <div>
                            <span className="text-xs text-gray-500 block">Total Duration</span>
                            <span className="text-sm font-medium text-gray-800">{called.totalDurationFormatted}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">Avg Duration</span>
                            <span className="text-sm font-medium text-gray-800">{called.averageDurationFormatted}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-50">
                          <button
                            onClick={() => loadUniqueCallersDetail(called.calledFleet)}
                            className="w-full flex justify-between items-center px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-sm font-medium transition-colors"
                          >
                            <span>View Unique Callers</span>
                            <span className="bg-white bg-opacity-50 px-2 py-0.5 rounded-full">{called.uniqueCallers}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Pagination Controls */}
                {statistics.topCalledFleets.length > topCount && (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <button
                      onClick={() => setCurrentPageCalled(p => Math.max(1, p - 1))}
                      disabled={currentPageCalled === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600 font-medium">
                      Page {currentPageCalled} of {Math.ceil(statistics.topCalledFleets.length / topCount)}
                    </span>
                    <button
                      onClick={() => setCurrentPageCalled(p => p + 1)}
                      disabled={currentPageCalled >= Math.ceil(statistics.topCalledFleets.length / topCount)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">
                <Phone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-900 mb-2">No called fleet data available</p>
                <p className="text-sm text-gray-600">No top called fleet statistics found for the selected date and filters.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* No Data State */}
        {!isLoading && !statistics && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center"
          >
            <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No fleet statistics available</p>
            <p className="text-gray-400 text-sm mt-2">Select a date with data to view fleet statistics</p>
          </motion.div>
        )}

      </motion.div>

      {/* Detail Modal - Rendered globally outside mobile/desktop wrappers */}
      <AnimatePresence>
        {detailModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeDetailModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm md:text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="w-4 h-4 md:w-5 md:h-5 mr-2 text-purple-600 flex-shrink-0" />
                    <span className="truncate">
                      {detailModal.type === 'caller'
                        ? `Unique Callers for ${detailModal.fleet}`
                        : `Unique Called Fleets for ${detailModal.fleet}`}
                    </span>
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                    {startDate === endDate
                      ? formatDisplayDate(startDate)
                      : `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {canExport && (
                    <motion.button
                      whileHover={{ scale: isExporting ? 1 : 1.05 }}
                      whileTap={{ scale: isExporting ? 1 : 0.95 }}
                      onClick={handleExportUniqueCallers}
                      disabled={isExporting}
                      className={`px-2.5 md:px-3 py-1.5 ${isExporting ? 'bg-green-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white text-xs md:text-sm rounded-lg transition-colors flex items-center shadow-sm`}
                    >
                      {isExporting ? (
                        <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-1.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-1.5" />
                      )}
                      {isExporting ? 'Memproses...' : 'Export'}
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeDetailModal}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 md:p-6 overflow-y-auto max-h-[60vh]">
                {detailModal.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-gray-600">Loading details...</span>
                  </div>
                ) : detailModal.data.length > 0 ? (
                  <>
                    {/* Search and Sort Controls */}
                    <div className="mb-4 flex flex-wrap items-center gap-2 md:gap-3">
                      <div className="relative flex-1 min-w-[150px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={modalSearch}
                          onChange={(e) => setModalSearch(e.target.value)}
                          placeholder="Search fleet ID..."
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        />
                        {modalSearch && (
                          <button
                            onClick={() => setModalSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 hidden md:inline">Sort:</span>
                        <button
                          onClick={() => setModalSortField('calls')}
                          className={`px-2 py-1 text-xs rounded ${modalSortField === 'calls' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                          Calls
                        </button>
                        <button
                          onClick={() => setModalSortField('duration')}
                          className={`px-2 py-1 text-xs rounded ${modalSortField === 'duration' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                          Duration
                        </button>
                        <button
                          onClick={() => setModalSortOrder(modalSortOrder === 'ASC' ? 'DESC' : 'ASC')}
                          className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          {modalSortOrder === 'DESC' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              {detailModal.type === 'caller' ? 'Caller Fleet' : 'Called Fleet'}
                            </th>
                            <th
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                              onClick={() => { setModalSortField('calls'); setModalSortOrder(modalSortField === 'calls' && modalSortOrder === 'DESC' ? 'ASC' : 'DESC'); }}
                            >
                              Total Calls {modalSortField === 'calls' && (modalSortOrder === 'DESC' ? '↓' : '↑')}
                            </th>
                            <th
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                              onClick={() => { setModalSortField('duration'); setModalSortOrder(modalSortField === 'duration' && modalSortOrder === 'DESC' ? 'ASC' : 'DESC'); }}
                            >
                              Duration {modalSortField === 'duration' && (modalSortOrder === 'DESC' ? '↓' : '↑')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(() => {
                            let filteredData = [...detailModal.data];
                            if (modalSearch) {
                              filteredData = filteredData.filter(item => {
                                const fleet = detailModal.type === 'caller'
                                  ? (item as UniqueCallerDetailDto).callerFleet
                                  : (item as UniqueCalledDetailDto).calledFleet;
                                return fleet.toLowerCase().includes(modalSearch.toLowerCase());
                              });
                            }
                            filteredData.sort((a, b) => {
                              let aVal, bVal;
                              if (modalSortField === 'calls') {
                                aVal = detailModal.type === 'caller' ? (a as UniqueCallerDetailDto).callCount : (a as UniqueCalledDetailDto).callCount;
                                bVal = detailModal.type === 'caller' ? (b as UniqueCallerDetailDto).callCount : (b as UniqueCalledDetailDto).callCount;
                              } else {
                                aVal = detailModal.type === 'caller' ? (a as UniqueCallerDetailDto).totalDurationSeconds : (a as UniqueCalledDetailDto).totalDurationSeconds;
                                bVal = detailModal.type === 'caller' ? (b as UniqueCallerDetailDto).totalDurationSeconds : (b as UniqueCalledDetailDto).totalDurationSeconds;
                              }
                              return modalSortOrder === 'DESC' ? bVal - aVal : aVal - bVal;
                            });
                            return filteredData.map((item, index) => (
                              <motion.tr
                                key={detailModal.type === 'caller'
                                  ? (item as UniqueCallerDetailDto).callerFleet
                                  : (item as UniqueCalledDetailDto).calledFleet}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {detailModal.type === 'caller'
                                    ? (item as UniqueCallerDetailDto).callerFleet
                                    : (item as UniqueCalledDetailDto).calledFleet}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                                  {detailModal.type === 'caller'
                                    ? (item as UniqueCallerDetailDto).callCount.toLocaleString()
                                    : (item as UniqueCalledDetailDto).callCount.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {detailModal.type === 'caller'
                                    ? (item as UniqueCallerDetailDto).totalDurationFormatted
                                    : (item as UniqueCalledDetailDto).totalDurationFormatted}
                                </td>
                              </motion.tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards for Modal */}
                    <div className="md:hidden flex flex-col gap-3 pb-4">
                      {(() => {
                        let filteredData = [...detailModal.data];
                        if (modalSearch) {
                          filteredData = filteredData.filter(item => {
                            const fleet = detailModal.type === 'caller'
                              ? (item as UniqueCallerDetailDto).callerFleet
                              : (item as UniqueCalledDetailDto).calledFleet;
                            return fleet.toLowerCase().includes(modalSearch.toLowerCase());
                          });
                        }
                        filteredData.sort((a, b) => {
                          let aVal, bVal;
                          if (modalSortField === 'calls') {
                            aVal = detailModal.type === 'caller' ? (a as UniqueCallerDetailDto).callCount : (a as UniqueCalledDetailDto).callCount;
                            bVal = detailModal.type === 'caller' ? (b as UniqueCallerDetailDto).callCount : (b as UniqueCalledDetailDto).callCount;
                          } else {
                            aVal = detailModal.type === 'caller' ? (a as UniqueCallerDetailDto).totalDurationSeconds : (a as UniqueCalledDetailDto).totalDurationSeconds;
                            bVal = detailModal.type === 'caller' ? (b as UniqueCallerDetailDto).totalDurationSeconds : (b as UniqueCalledDetailDto).totalDurationSeconds;
                          }
                          return modalSortOrder === 'DESC' ? bVal - aVal : aVal - bVal;
                        });
                        return filteredData.map((item, index) => {
                          const fleetName = detailModal.type === 'caller'
                            ? (item as UniqueCallerDetailDto).callerFleet
                            : (item as UniqueCalledDetailDto).calledFleet;
                          const callCount = detailModal.type === 'caller'
                            ? (item as UniqueCallerDetailDto).callCount
                            : (item as UniqueCalledDetailDto).callCount;
                          const duration = detailModal.type === 'caller'
                            ? (item as UniqueCallerDetailDto).totalDurationFormatted
                            : (item as UniqueCalledDetailDto).totalDurationFormatted;
                          return (
                            <div key={fleetName} className="bg-white border text-left border-gray-200 rounded-xl p-4 shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 font-medium text-sm">#{index + 1}</span>
                                  <h4 className="font-bold text-gray-900">{fleetName}</h4>
                                </div>
                                <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-full">
                                  {callCount.toLocaleString()} calls
                                </span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600 mt-2">
                                <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                                <span>Duration: <span className="font-medium text-gray-800">{duration}</span></span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No data available</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {detailModal.data.length > 0 && (
                <div className="px-4 md:px-6 py-3 border-t border-gray-200 bg-gray-50">
                  <p className="text-xs md:text-sm text-gray-600">
                    Total: <span className="font-semibold">{detailModal.data.length}</span> unique {detailModal.type === 'caller' ? 'callers' : 'called fleets'}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// StatCard Component
const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange';
  description: string;
  trend?: string;
}> = ({ title, value, icon: Icon, color, description, trend }) => {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
    green: 'bg-gradient-to-br from-green-500 to-green-600',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-600'
  };

  const textColors = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    purple: 'text-purple-700',
    orange: 'text-orange-700'
  };

  const bgColors = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50'
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {trend && (
              <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {trend}
              </span>
            )}
          </div>
          <p className={`text-2xl font-bold ${textColors[color]} mb-2`}>{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <motion.div
          whileHover={{ rotate: 15, scale: 1.1 }}
          className={`p-3 rounded-xl ${colorClasses[color]} text-white shadow-lg transition-transform duration-300`}
        >
          <Icon className="w-6 h-6" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FleetStatisticsPage;