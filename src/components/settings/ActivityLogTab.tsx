import React, { useState, useEffect, useRef } from 'react';
import { ActivityLog, ActivityLogQuery } from '../../types/activityLog';
import { activityLogApi } from '../../services/activityLogApi';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { DayPicker, DateRange } from 'react-day-picker';
import { id as localeId } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { Search, RotateCw, ChevronLeft, ChevronRight, Check, CalendarDays, X as XIcon } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';
import BottomSheet from '../common/BottomSheet';

// ─── Module options ───────────────────────────────────────────────────────────

const MODULE_OPTIONS = [
  { value: 'all', label: 'Semua Modul' },
  { value: 'Auth', label: 'Auth' },
  { value: 'User', label: 'User' },
  { value: 'Role', label: 'Role' },
  { value: 'Permission', label: 'Permission' },
  { value: 'Division', label: 'Division' },
  { value: 'CallRecord', label: 'Call Record' },
];

// ─── Action color badge ───────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const upper = action.toUpperCase();
  let cls = 'bg-[#F7F8FA] text-[#718096] border border-[#E2E8F0]';
  if (upper.includes('CREATE') || upper.includes('LOGIN') || upper.includes('REGISTER'))
    cls = 'bg-[#F0FFF4] text-[#059669] border border-emerald-200';
  else if (upper.includes('UPDATE') || upper.includes('EDIT') || upper.includes('CHANGE'))
    cls = 'bg-[#EBF4FF] text-[#2B6CB0] border border-blue-200';
  else if (upper.includes('DELETE') || upper.includes('REMOVE') || upper.includes('LOGOUT'))
    cls = 'bg-red-50 text-[#DC2626] border border-red-200';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
      {action}
    </span>
  );
}

// ─── Module badge ─────────────────────────────────────────────────────────────

function ModuleBadge({ module }: { module: string }) {
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EBF4FF] text-[#2B6CB0] border border-blue-100">
      {module}
    </span>
  );
}

// ─── Timestamp formatter ──────────────────────────────────────────────────────

function formatTs(ts: string) {
  try {
    return format(new Date(ts), 'dd MMM yyyy HH:mm:ss');
  } catch {
    return ts;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ActivityLogTab: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [modulePickerOpen, setModulePickerOpen] = useState(false);
  // Date range — same pattern as FleetStatisticsPage
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [mobDatePickerOpen, setMobDatePickerOpen] = useState(false);
  const deskCalRef = useRef<HTMLDivElement>(null);
  const mobCalRef = useRef<HTMLDivElement>(null);

  // Close calendar on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (deskCalRef.current && !deskCalRef.current.contains(e.target as Node)) setDatePickerOpen(false);
      if (mobCalRef.current && !mobCalRef.current.contains(e.target as Node)) setMobDatePickerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Format range label for trigger button
  const formatRangeLabel = () => {
    if (!dateRange?.from) return 'Pilih rentang tanggal';
    const from = format(dateRange.from, 'd MMM yyyy');
    if (!dateRange.to || dateRange.from.toDateString() === dateRange.to.toDateString()) return from;
    return `${from} – ${format(dateRange.to, 'd MMM yyyy')}`;
  };

  // Apply selected range to query
  const applyDateRange = (close: () => void) => {
    setQuery(prev => ({
      ...prev,
      startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
      endDate: dateRange?.to ? dateRange.to.toISOString() : (dateRange?.from ? dateRange.from.toISOString() : undefined),
      page: 1,
    }));
    close();
  };

  const clearDateRange = () => {
    setDateRange(undefined);
    setQuery(prev => ({ ...prev, startDate: undefined, endDate: undefined, page: 1 }));
  };
  const calRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState<ActivityLogQuery>({
    page: 1,
    pageSize: 10,
    search: '',
    module: '',
    action: '',
    startDate: '',
    endDate: '',
  });

  // Close calendar on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchLogs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await activityLogApi.getLogs(query);
      setLogs(result.items);
      setTotalItems(result.totalItems);
    } catch (error) {
      console.error('Failed to fetch activity logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [query.page, query.pageSize, query.module, query.action, query.startDate, query.endDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const totalPages = Math.ceil(totalItems / query.pageSize);
  const from = (query.page - 1) * query.pageSize + 1;
  const to = Math.min(query.page * query.pageSize, totalItems);

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold text-[#1A202C]">Audit Logs</h2>
          <p className="text-[12px] text-[#718096] mt-0.5">{totalItems} total aktivitas</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-2 bg-[#F7F8FA] border border-[#E2E8F0] rounded-[8px] text-[13px] font-semibold text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors min-h-[40px]"
          title="Refresh"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 space-y-3">
        {/* Row 1: Search + Module + Cari */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
            <input
              type="text"
              placeholder="Cari deskripsi, modul, aksi, atau user..."
              value={query.search || ''}
              onChange={e => setQuery(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#E2E8F0] rounded-[8px] bg-[#F7F8FA] focus:outline-none focus:border-[#2B6CB0] min-h-[40px]"
            />
          </div>

          {/* Module select — Desktop: Radix Select, Mobile: custom trigger → BottomSheet */}
          <div className="sm:w-44">
            {/* Desktop */}
            <div className="hidden sm:block">
              <Select
                value={query.module || 'all'}
                onValueChange={val => setQuery(prev => ({ ...prev, module: val === 'all' ? '' : val, page: 1 }))}
              >
                <SelectTrigger className="h-10 text-[13px] border-[#E2E8F0] bg-[#F7F8FA] focus:ring-[#2B6CB0] focus:border-[#2B6CB0] rounded-[8px]">
                  <SelectValue placeholder="Semua Modul" />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-[13px]">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Mobile: tap → BottomSheet */}
            <button
              type="button"
              onClick={() => setModulePickerOpen(true)}
              className="sm:hidden w-full flex items-center justify-between px-3 py-2 text-[13px] border border-[#E2E8F0] rounded-[8px] bg-[#F7F8FA] min-h-[40px] text-left"
            >
              <span className={query.module ? 'text-[#1A202C] font-medium' : 'text-[#718096]'}>
                {MODULE_OPTIONS.find(o => (o.value === 'all' ? '' : o.value) === (query.module || ''))?.label ?? 'Semua Modul'}
              </span>
              <ChevronRight className="w-4 h-4 text-[#718096] rotate-90" />
            </button>
          </div>

          <button type="submit"
            className="px-4 py-2 bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white text-[13px] font-semibold rounded-[8px] transition-colors min-h-[40px]">
            Cari
          </button>
        </form>

        {/* Row 2: Date range — DayPicker range (same as Fleet Statistics) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-[12px] font-semibold text-[#718096] flex-shrink-0">Rentang tanggal:</span>

          {/* Desktop: popover calendar */}
          <div className="relative hidden sm:block flex-1" ref={deskCalRef}>
            <button
              type="button"
              onClick={() => setDatePickerOpen(prev => !prev)}
              className={`w-full flex items-center gap-2 px-3 py-2 border rounded-[8px] bg-white hover:border-[#2B6CB0] transition-colors text-left min-h-[40px] ${
                datePickerOpen ? 'border-[#2B6CB0] ring-1 ring-[#2B6CB0]' : 'border-[#E2E8F0]'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-[#718096] flex-shrink-0" />
              <span className={`flex-1 text-[13px] ${dateRange?.from ? 'text-[#1A202C] font-medium' : 'text-[#718096]'}`}>
                {formatRangeLabel()}
              </span>
              {dateRange?.from && (
                <button type="button" onClick={e => { e.stopPropagation(); clearDateRange(); }}
                  className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[#718096] hover:bg-[#F7F8FA]">
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </button>

            {datePickerOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-[#E2E8F0] rounded-[14px] shadow-xl p-4">
                <DayPicker
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  locale={localeId}
                  showOutsideDays
                  disabled={{ after: new Date() }}
                />
                <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0] mt-1">
                  <div className="flex gap-3">
                    <button type="button" onClick={clearDateRange}
                      className="text-[13px] text-[#718096] hover:text-[#DC2626] font-medium transition-colors">
                      Hapus
                    </button>
                    <button type="button" onClick={() => setDateRange({ from: new Date(), to: new Date() })}
                      className="text-[13px] text-[#2B6CB0] font-semibold hover:text-[#1B3A6B] transition-colors">
                      Hari ini
                    </button>
                  </div>
                  <button type="button" onClick={() => applyDateRange(() => setDatePickerOpen(false))}
                    className="px-4 py-1.5 bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white text-[13px] font-semibold rounded-[8px] transition-colors">
                    Terapkan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile: trigger → centered modal overlay (same as Fleet Statistics) */}
          <div className="sm:hidden flex-1" ref={mobCalRef}>
            <button
              type="button"
              onClick={() => setMobDatePickerOpen(true)}
              className={`w-full flex items-center gap-2 px-3 py-2 border rounded-[8px] bg-white min-h-[40px] text-left transition-colors ${
                dateRange?.from ? 'border-[#2B6CB0]' : 'border-[#E2E8F0]'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-[#718096] flex-shrink-0" />
              <span className={`flex-1 text-[13px] ${dateRange?.from ? 'text-[#1A202C] font-medium' : 'text-[#718096]'}`}>
                {formatRangeLabel()}
              </span>
              {dateRange?.from && (
                <button type="button" onClick={e => { e.stopPropagation(); clearDateRange(); }}
                  className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[#718096]">
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </button>

            {mobDatePickerOpen && (
              <>
                <div className="fixed inset-0 bg-black/50 z-[100]" onClick={() => setMobDatePickerOpen(false)} />
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] bg-white rounded-[20px] shadow-2xl p-4 w-[92%] max-w-[360px] max-h-[85vh] overflow-y-auto flex flex-col">
                  <div className="flex justify-center">
                    <DayPicker
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      locale={localeId}
                      showOutsideDays
                      disabled={{ after: new Date() }}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0] mt-2">
                    <div className="flex gap-3">
                      <button type="button" onClick={clearDateRange}
                        className="text-[13px] text-[#718096] hover:text-[#DC2626] font-medium transition-colors">
                        Hapus
                      </button>
                      <button type="button" onClick={() => setDateRange({ from: new Date(), to: new Date() })}
                        className="text-[13px] text-[#2B6CB0] font-semibold transition-colors">
                        Hari ini
                      </button>
                    </div>
                    <button type="button" onClick={() => applyDateRange(() => setMobDatePickerOpen(false))}
                      className="px-4 py-2 bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white text-[13px] font-semibold rounded-[8px] transition-colors">
                      Terapkan
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile module picker BottomSheet */}
      <BottomSheet open={modulePickerOpen} onClose={() => setModulePickerOpen(false)} title="Pilih Modul" size="md">
        <div className="space-y-1 pb-2">
          {MODULE_OPTIONS.map(opt => {
            const currentVal = query.module || 'all';
            const isSelected = currentVal === opt.value;
            return (
              <button key={opt.value} type="button"
                onClick={() => {
                  setQuery(prev => ({ ...prev, module: opt.value === 'all' ? '' : opt.value, page: 1 }));
                  setModulePickerOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-[10px] text-[14px] font-medium transition-colors text-left ${
                  isSelected ? 'bg-[#EBF4FF] text-[#1B3A6B]' : 'text-[#1A202C] hover:bg-[#F7F8FA]'
                }`}>
                {opt.label}
                {isSelected && <Check className="w-4 h-4 text-[#2B6CB0]" />}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* ── Mobile: card per log ── */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B6CB0]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-[#718096] text-[13px] bg-white border border-[#E2E8F0] rounded-[10px]">
            Tidak ada aktivitas ditemukan
          </div>
        ) : logs.map(log => (
          <div key={log.id} className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 space-y-2">
            {/* Top row: timestamp + badges */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-mono text-[#718096]">{formatTs(log.timestamp)}</p>
              <div className="flex gap-1.5 flex-wrap justify-end">
                <ModuleBadge module={log.module} />
                <ActionBadge action={log.action} />
              </div>
            </div>
            {/* User */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#1B3A6B] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {(log.user?.fullName || String(log.userId)).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#1A202C] truncate">
                  {log.user?.fullName || `User #${log.userId}`}
                </p>
                {log.user?.role?.roleName && (
                  <p className="text-[11px] text-[#718096]">{log.user.role.roleName}</p>
                )}
              </div>
            </div>
            {/* Description */}
            {log.description && (
              <p className="text-[12px] text-[#718096] leading-relaxed">{log.description}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Desktop: table ── */}
      <div className="hidden md:block border border-[#E2E8F0] rounded-[10px] overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-[#E2E8F0]">
                <th className="px-4 py-3 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wide w-44">Waktu</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wide">User</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wide w-32">Modul</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wide w-36">Aksi</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wide">Deskripsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2B6CB0] mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[13px] text-[#718096]">
                    Tidak ada aktivitas ditemukan
                  </td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-[#F7F8FA] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[12px] font-mono text-[#718096] whitespace-nowrap">{formatTs(log.timestamp)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-semibold text-[#1A202C]">{log.user?.fullName || `User #${log.userId}`}</p>
                    {log.user?.role?.roleName && (
                      <p className="text-[11px] text-[#718096]">{log.user.role.roleName}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ModuleBadge module={log.module} />
                  </td>
                  <td className="px-4 py-3">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-[13px] text-[#718096] truncate" title={log.description}>{log.description}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="px-4 py-3 border-t border-[#E2E8F0] flex items-center justify-between">
            <p className="text-[12px] text-[#718096]">
              {from}–{to} dari {totalItems} aktivitas
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuery(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={query.page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#E2E8F0] text-[#718096] hover:bg-[#F7F8FA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[13px] text-[#1A202C] font-medium px-2">
                {query.page} / {totalPages}
              </span>
              <button
                onClick={() => setQuery(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                disabled={query.page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#E2E8F0] text-[#718096] hover:bg-[#F7F8FA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile pagination */}
      {totalItems > 0 && totalPages > 1 && (
        <div className="md:hidden flex items-center justify-between px-1">
          <p className="text-[12px] text-[#718096]">{from}–{to} dari {totalItems}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setQuery(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={query.page === 1}
              className="px-3 py-2 text-[12px] font-semibold border border-[#E2E8F0] rounded-[8px] text-[#718096] disabled:opacity-40 bg-white"
            >
              ← Prev
            </button>
            <span className="px-3 py-2 text-[12px] text-[#1A202C] font-medium">
              {query.page}/{totalPages}
            </span>
            <button
              onClick={() => setQuery(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
              disabled={query.page === totalPages}
              className="px-3 py-2 text-[12px] font-semibold border border-[#E2E8F0] rounded-[8px] text-[#718096] disabled:opacity-40 bg-white"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogTab;
