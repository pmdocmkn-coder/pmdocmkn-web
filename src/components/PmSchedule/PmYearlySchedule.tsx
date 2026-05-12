import React, { useState, useEffect } from "react";
import { useToast } from "../../hooks/use-toast";
import { pmScheduleApi } from "../../services/pmScheduleService";
import { hasPermission } from "../../utils/permissionUtils";
import {
  PmSiteScheduleDto,
  PmScheduleTaskDto,
  PmDeviceScheduleDto,
} from "../../types/pmSchedule";
import {
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MapPin,
  Plus,
  Trash2,
  ArrowLeft,
  Copy,
  Download,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { exportPmScheduleToExcel } from "../../utils/exportExcel";

const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function PmYearlySchedule() {
  const { toast } = useToast();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [sites, setSites] = useState<PmSiteScheduleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingCells, setUpdatingCells] = useState<Record<string, boolean>>({});
  const canUpdate = hasPermission("pmschedule.update");

  // View mode: 'overview' (yearly) or number 0-11 (monthly detail)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  // Add PM Dialog
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [addDeviceSiteId, setAddDeviceSiteId] = useState<number>(0);
  const [addDeviceSiteName, setAddDeviceSiteName] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [addingDevice, setAddingDevice] = useState(false);

  const handleSelectMonthAndScroll = (monthIdx: number, siteId: number, deviceName: string) => {
    if (!canUpdate) return;
    setSelectedMonth(monthIdx);
    setTimeout(() => {
      const el = document.getElementById(`row-${siteId}-${deviceName.replace(/\s+/g, '-')}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-indigo-100', 'transition-all', 'duration-500');
        setTimeout(() => el.classList.remove('bg-indigo-100'), 1500);
      }
    }, 150);
  };
  useEffect(() => {
    loadSchedule();
  }, [year]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const data = await pmScheduleApi.getYearlySchedule(year);
      const sortedSites = (data.sites || []).sort((a, b) => a.orderIndex - b.orderIndex);
      setSites(sortedSites);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ========== ADD PM ==========
  const openAddDeviceDialog = (siteId: number, siteName: string) => {
    setAddDeviceSiteId(siteId);
    setAddDeviceSiteName(siteName);
    setNewDeviceName("");
    setIsAddDeviceOpen(true);
  };

  const handleAddDevice = async () => {
    if (!newDeviceName.trim()) {
      toast({ title: "Error", description: "Nama PM wajib diisi", variant: "destructive" });
      return;
    }
    setAddingDevice(true);
    try {
      await pmScheduleApi.upsertSchedule({
        year,
        pmSiteId: addDeviceSiteId,
        deviceName: newDeviceName.trim(),
        tasks: [],
      });
      toast({ title: "Success", description: `PM "${newDeviceName}" berhasil ditambahkan` });
      setIsAddDeviceOpen(false);
      loadSchedule();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Gagal menambahkan PM", variant: "destructive" });
    } finally {
      setAddingDevice(false);
    }
  };

  // ========== DELETE PM ==========
  const handleDeleteDevice = async (siteId: number, deviceName: string) => {
    if (!confirm(`Hapus PM "${deviceName}"? Semua jadwal untuk PM ini akan dihapus.`)) return;
    try {
      await pmScheduleApi.deleteSchedule(year, siteId, deviceName);
      toast({ title: "Success", description: `Jadwal PM "${deviceName}" berhasil dihapus` });
      loadSchedule();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Gagal menghapus", variant: "destructive" });
    }
  };

  // ========== TOGGLE SCHEDULE ==========
  const handleToggleSchedule = async (
    siteId: number,
    device: PmDeviceScheduleDto,
    month: number,
    week: number
  ) => {
    const cellKey = `${siteId}-${device.deviceName}-${month}-${week}`;
    if (updatingCells[cellKey]) return;

    const isCurrentlyScheduled = device.tasks.some((t) => t.month === month && t.week === week);
    let newTasks: PmScheduleTaskDto[];
    if (isCurrentlyScheduled) {
      newTasks = device.tasks.filter((t) => !(t.month === month && t.week === week));
    } else {
      newTasks = [...device.tasks, { month, week }];
    }

    // Optimistic UI
    setSites((prev) =>
      prev.map((site) => {
        if (site.siteId !== siteId) return site;
        return {
          ...site,
          devices: site.devices.map((dev) => {
            if (dev.deviceName !== device.deviceName) return dev;
            return { ...dev, tasks: newTasks };
          }),
        };
      })
    );

    setUpdatingCells((prev) => ({ ...prev, [cellKey]: true }));
    try {
      await pmScheduleApi.upsertSchedule({ year, pmSiteId: siteId, deviceName: device.deviceName, tasks: newTasks });
    } catch (error: any) {
      toast({ title: "Gagal", description: "Perubahan dibatalkan", variant: "destructive" });
      loadSchedule();
    } finally {
      setUpdatingCells((prev) => ({ ...prev, [cellKey]: false }));
    }
  };

  // ========== CLONE SCHEDULE ==========
  const handleCloneFromPreviousMonth = async () => {
    if (selectedMonth === null || selectedMonth === 0) return;
    const currentMonthNum = selectedMonth + 1;
    const prevMonthNum = currentMonthNum - 1;

    if (!confirm(`Salin semua jadwal dari ${MONTHS_FULL[prevMonthNum - 1]} ke ${MONTHS_FULL[currentMonthNum - 1]}? Jadwal yang sudah ada di bulan ini akan tertimpa.`)) return;

    setLoading(true);
    try {
      const updates: Promise<void>[] = [];
      
      sites.forEach(site => {
        site.devices.forEach(device => {
          const prevMonthTasks = device.tasks.filter(t => t.month === prevMonthNum);
          const currentMonthTasks = device.tasks.filter(t => t.month === currentMonthNum);
          
          if (prevMonthTasks.length === 0 && currentMonthTasks.length === 0) return;
          
          const otherMonthsTasks = device.tasks.filter(t => t.month !== currentMonthNum);
          const clonedTasks = prevMonthTasks.map(t => ({ month: currentMonthNum, week: t.week }));
          const newTasks = [...otherMonthsTasks, ...clonedTasks];
          
          updates.push(pmScheduleApi.upsertSchedule({
            year,
            pmSiteId: site.siteId,
            deviceName: device.deviceName,
            tasks: newTasks
          }));
        });
      });

      // Execute sequentially to avoid overloading backend
      for (const update of updates) {
        await update;
      }
      
      toast({ title: "Success", description: "Jadwal berhasil disalin." });
      loadSchedule();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Gagal menyalin jadwal", variant: "destructive" });
      setLoading(false);
    }
  };

  // =============================================
  // RENDER: YEARLY OVERVIEW (default)
  // =============================================
  const renderYearlyOverview = () => {
    const halfYear1 = MONTHS_SHORT.slice(0, 6); // Jan-Jun
    const halfYear2 = MONTHS_SHORT.slice(6, 12); // Jul-Dec

    const renderHalfYear = (months: string[], startIdx: number) => (
      <div className="bg-white rounded-2xl border border-indigo-500/10 shadow-sm overflow-x-auto">
        <table className="w-full border-collapse min-w-[900px] text-sm">
          {/* Month Header */}
          <thead>
            <tr className="bg-slate-50/80">
              <th className="px-2 py-3 font-bold text-xs text-slate-500 border-r border-b border-slate-200 text-center w-[40px]">No.</th>
              <th className="px-3 py-3 font-bold text-xs text-slate-500 border-r border-b border-slate-200 text-left w-[120px]">Site</th>
              <th className="px-3 py-3 font-bold text-xs text-slate-500 border-r border-b border-slate-200 text-left w-[200px]">PM</th>
              {months.map((m, i) => (
                <th
                  key={m}
                  onClick={() => canUpdate && setSelectedMonth(startIdx + i)}
                  className={`py-3 font-bold text-xs text-slate-600 border-r border-b border-slate-200 last:border-r-0 text-center ${canUpdate ? 'cursor-pointer hover:text-indigo-600 hover:bg-indigo-50' : 'cursor-default'} transition-colors`}
                >
                  {m}
                </th>
              ))}
            </tr>
            {/* Week Sub-header */}
            <tr className="bg-white">
              <th className="border-r border-b border-slate-200"></th>
              <th className="border-r border-b border-slate-200"></th>
              <th className="border-r border-b border-slate-200"></th>
              {months.map((m) => (
                <th key={`${m}-w`} className="py-1.5 border-r border-b border-slate-200 last:border-r-0">
                  <div className="grid grid-cols-4 gap-[2px] w-full max-w-[80px] mx-auto px-1">
                    {[1, 2, 3, 4].map((w) => (
                      <span key={w} className="text-[9px] font-bold text-slate-400 text-center">W{w}</span>
                    ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && sites.length === 0 ? (
              <tr>
                <td colSpan={3 + months.length} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
                </td>
              </tr>
            ) : sites.length === 0 ? (
              <tr>
                <td colSpan={3 + months.length} className="text-center py-12 text-sm text-slate-400">
                  Belum ada data site.
                </td>
              </tr>
            ) : (
              sites.map((site, siteIdx) => {
                const deviceCount = Math.max(site.devices.length, 1);
                return (
                  <React.Fragment key={site.siteId}>
                    {site.devices.length === 0 ? (
                      <tr className="hover:bg-slate-50/50 transition-colors border-b border-slate-200">
                        <td className="px-2 py-2.5 border-r border-slate-200 text-center text-xs text-slate-500 font-medium align-middle">
                          {siteIdx + 1}
                        </td>
                        <td className="px-3 py-2.5 border-r border-slate-200 align-middle">
                          <p className="text-xs font-bold text-slate-900">{site.siteName}</p>
                        </td>
                        <td className="px-3 py-2.5 border-r border-slate-200">
                          <p className="text-[10px] text-slate-400 italic">Belum ada PM</p>
                        </td>
                        {months.map((m) => (
                          <td key={m} className="border-r border-slate-200 last:border-r-0">
                            <div className="grid grid-cols-4 gap-[2px] w-full max-w-[80px] mx-auto px-1 py-2.5">
                              {[1, 2, 3, 4].map((w) => (
                                <div key={w} className="h-4 rounded-[3px] bg-slate-100 w-full"></div>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ) : (
                      site.devices.map((device, devIdx) => (
                        <tr
                          key={`${site.siteId}-${device.deviceName}`}
                          className={`hover:bg-indigo-50/30 transition-colors ${devIdx === deviceCount - 1 ? "border-b border-slate-200" : "border-b border-slate-100"}`}
                        >
                          {/* No. + Site columns: only first row, merged with rowSpan */}
                          {devIdx === 0 && (
                            <>
                              <td
                                rowSpan={deviceCount}
                                className="px-2 py-2 border-r border-slate-200 text-center text-xs text-slate-500 font-medium align-middle bg-white"
                              >
                                {siteIdx + 1}
                              </td>
                              <td
                                rowSpan={deviceCount}
                                className="px-3 py-2 border-r border-slate-200 align-middle bg-white"
                              >
                                <p className="text-xs font-bold text-slate-900">{site.siteName}</p>
                              </td>
                            </>
                          )}
                          {/* PM column */}
                          <td className="px-3 py-2 border-r border-slate-200">
                            <p className="text-[11px] text-slate-700 font-medium">{device.deviceName}</p>
                          </td>
                          {/* Month cells */}
                          {months.map((m, mIdx) => {
                            const monthNum = startIdx + mIdx + 1;
                            return (
                              <td
                                key={m}
                                onClick={() => canUpdate && handleSelectMonthAndScroll(startIdx + mIdx, site.siteId, device.deviceName)}
                                className={`border-r border-slate-200 last:border-r-0 transition-colors ${canUpdate ? 'cursor-pointer hover:bg-indigo-50' : 'cursor-default'}`}
                              >
                                <div className="grid grid-cols-4 gap-[2px] w-full max-w-[80px] mx-auto px-1 py-2">
                                  {[1, 2, 3, 4].map((w) => {
                                    const isScheduled = device.tasks.some((t) => t.month === monthNum && t.week === w);
                                    return (
                                      <div
                                        key={w}
                                        className={`h-4 rounded-[3px] transition-colors w-full ${
                                          isScheduled ? "bg-emerald-500" : "bg-slate-200/70"
                                        }`}
                                      ></div>
                                    );
                                  })}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );

    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Yearly Overview</h2>
          {!canUpdate && <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold">View Only</span>}
        </div>

        {/* Semester 1: Jan - Jun */}
        <div>
          <h3 className="text-sm font-bold text-slate-600 mb-2 px-1">Semester 1 — Januari - Juni {year}</h3>
          {renderHalfYear(halfYear1, 0)}
        </div>

        {/* Semester 2: Jul - Dec */}
        <div>
          <h3 className="text-sm font-bold text-slate-600 mb-2 px-1">Semester 2 — Juli - Desember {year}</h3>
          {renderHalfYear(halfYear2, 6)}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 px-1">
          <span className="text-[10px] text-slate-400 font-medium">Keterangan:</span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-[3px]">
              {[true, false, true, false].map((active, i) => (
                <div key={i} className={`w-3 h-4 rounded-sm ${active ? "bg-emerald-500" : "bg-slate-200/70"}`}></div>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 font-medium ml-1">= Week 1, 2, 3, 4</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-4 rounded-sm bg-emerald-500"></div>
            <span className="text-[10px] text-slate-500 font-medium">Terjadwal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-4 rounded-sm bg-slate-200/70"></div>
            <span className="text-[10px] text-slate-500 font-medium">Kosong</span>
          </div>
        </div>
      </div>
    );
  };

  // =============================================
  // RENDER: MONTHLY DETAIL (when month is clicked)
  // =============================================
  const renderMonthlyDetail = () => {
    if (selectedMonth === null) return null;
    const monthNum = selectedMonth + 1;

    return (
      <div className="flex flex-col gap-5">
        {/* Back + Month Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-indigo-500/10 shadow-sm px-5 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedMonth(null)}
              className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              title="Kembali ke Yearly Overview"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Detail Bulan</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (selectedMonth === 0) { setYear(y => y - 1); setSelectedMonth(11); }
                    else setSelectedMonth(selectedMonth - 1);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-black text-slate-900 tracking-tight min-w-[140px] text-center">
                  {MONTHS_FULL[selectedMonth]} {year}
                </h2>
                <button
                  onClick={() => {
                    if (selectedMonth === 11) { setYear(y => y + 1); setSelectedMonth(0); }
                    else setSelectedMonth(selectedMonth + 1);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          {canUpdate && selectedMonth > 0 && (
            <button
              onClick={handleCloneFromPreviousMonth}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-xs transition-colors border border-emerald-200"
              title={`Salin jadwal dari ${MONTHS_FULL[selectedMonth - 1]}`}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Clone dari {MONTHS_SHORT[selectedMonth - 1]}</span>
            </button>
          )}
        </div>

        {/* Matrix per Site */}
        <div className="space-y-4">
          {sites.length === 0 ? (
            <div className="bg-white rounded-2xl border border-indigo-500/10 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
              <MapPin className="w-10 h-10 text-slate-300" />
              <p className="text-sm text-slate-400 font-medium">Belum ada site. Tambahkan di tab Master Site.</p>
            </div>
          ) : (
            sites.map((site) => (
              <div key={site.siteId} className="bg-white rounded-2xl border border-indigo-500/10 shadow-sm overflow-hidden">
                {/* Site Header */}
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50/80 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{site.siteName}</p>
                      <p className="text-[11px] text-slate-400">{site.devices.length} PM</p>
                    </div>
                  </div>
                  {canUpdate && (
                    <button
                      onClick={() => openAddDeviceDialog(site.siteId, site.siteName)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah PM
                    </button>
                  )}
                </div>

                {/* Device Rows */}
                {site.devices.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Belum ada PM. Klik "Tambah PM" untuk menambahkan.
                  </div>
                ) : (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left px-5 py-2.5 font-semibold text-slate-500 text-xs border-b border-slate-100 w-[40%]">
                          PM
                        </th>
                        {[1, 2, 3, 4].map((week) => (
                          <th key={week} className="text-center px-2 py-2.5 font-bold text-xs border-b border-slate-100 w-[15%]">
                            <span className="text-slate-400 text-[10px] block">Week</span>
                            <span className="text-indigo-600 text-sm font-black">{week}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {site.devices.map((device) => (
                        <tr 
                          id={`row-${site.siteId}-${device.deviceName.replace(/\s+/g, '-')}`} 
                          key={device.deviceName} 
                          className="group hover:bg-indigo-50/30 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-800">{device.deviceName}</span>
                              {canUpdate && (
                                <button
                                  onClick={() => handleDeleteDevice(site.siteId, device.deviceName)}
                                  className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                  title="Hapus PM"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                          {[1, 2, 3, 4].map((week) => {
                            const isScheduled = device.tasks.some((t) => t.month === monthNum && t.week === week);
                            const cellKey = `${site.siteId}-${device.deviceName}-${monthNum}-${week}`;
                            const isUpdating = updatingCells[cellKey];
                            return (
                              <td key={week} className="text-center px-2 py-3">
                                {canUpdate ? (
                                  <button
                                    onClick={() => handleToggleSchedule(site.siteId, device, monthNum, week)}
                                    disabled={isUpdating}
                                    className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all duration-200 ${
                                      isUpdating
                                        ? "bg-slate-100 cursor-wait"
                                        : isScheduled
                                          ? "bg-emerald-500 shadow-md shadow-emerald-500/30 hover:bg-emerald-600 hover:scale-110 active:scale-95"
                                          : "bg-white border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:scale-110 active:scale-95"
                                    }`}
                                  >
                                    {isUpdating ? (
                                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                    ) : isScheduled ? (
                                      <Check className="w-5 h-5 text-white stroke-[3]" />
                                    ) : null}
                                  </button>
                                ) : (
                                  <div
                                    className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center ${
                                      isScheduled
                                        ? "bg-emerald-500"
                                        : "bg-white border-2 border-slate-200"
                                    }`}
                                  >
                                    {isScheduled ? (
                                      <Check className="w-5 h-5 text-white stroke-[3]" />
                                    ) : null}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // =============================================
  // MAIN RENDER
  // =============================================
  return (
    <div className="flex flex-col gap-6">
      {/* ====== GLOBAL HEADER & YEAR SELECTOR ====== */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-indigo-500/10 shadow-sm px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">PM Schedule</h2>
            <p className="text-xs text-slate-500">Pilih bulan untuk melihat detail & edit jadwal</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button onClick={() => setYear((y) => y - 1)} className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-black text-indigo-600 text-base px-3 tabular-nums">{year}</span>
            <button onClick={() => setYear((y) => y + 1)} className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => exportPmScheduleToExcel(year, sites)}
            className="flex items-center gap-2 px-4 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 text-white font-bold transition-all active:scale-95"
            title="Export ke Excel"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* ====== MONTH PILLS (Only for Detail View) ====== */}
      {selectedMonth !== null && (
        <div className="bg-white rounded-2xl border border-indigo-500/10 shadow-sm p-3 flex flex-wrap gap-2 items-center">
          {MONTHS_SHORT.map((m, idx) => {
            const isSelected = selectedMonth === idx;
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(isSelected ? null : idx)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      )}

      {/* ====== CONDITIONAL CONTENT ====== */}
      {selectedMonth === null ? renderYearlyOverview() : renderMonthlyDetail()}

      {/* ====== ADD PM DIALOG ====== */}
      <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-indigo-600 text-xl font-bold">Tambah PM</DialogTitle>
            <DialogDescription className="text-slate-500">
              Tambahkan item PM baru ke site <span className="font-semibold text-slate-700">{addDeviceSiteName}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deviceName" className="font-bold text-slate-700">Nama PM *</Label>
              <Input
                id="deviceName"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="e.g., Commroom, Link Microwave, Trunking TAIT"
                className="h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                onKeyDown={(e) => e.key === "Enter" && handleAddDevice()}
              />
            </div>
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs text-blue-700 font-medium">
                💡 Contoh: Commroom, Link Microwave, Trunking TAIT, PABX, CATV, Repeater, CPP
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsAddDeviceOpen(false)} className="rounded-xl h-11 font-bold text-slate-600 border-slate-200">
              Cancel
            </Button>
            <Button onClick={handleAddDevice} disabled={addingDevice} className="rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6">
              {addingDevice ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Tambah PM
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
