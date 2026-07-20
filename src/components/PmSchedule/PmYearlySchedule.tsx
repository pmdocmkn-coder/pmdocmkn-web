import React, { useState, useEffect } from "react";
import { useToast } from "../../hooks/use-toast";
import { FormMobileDatePicker } from "../Radio/FormMobileDatePicker";
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
import { ResponsiveModal } from "../common/ResponsiveModal";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { exportPmScheduleToExcel } from "../../utils/exportExcel";

const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const getWeekColor = (week: number) => {
  switch (week) {
    case 1: return "bg-[#2B6CB0]";
    case 2: return "bg-[#059669]";
    case 3: return "bg-[#F59E0B]";
    case 4: return "bg-[#D94F2B]";
    default: return "bg-[#718096]";
  }
};

const getWeekDetailClass = (week: number) => {
  switch (week) {
    case 1: return "bg-[#2B6CB0] hover:bg-[#1B3A6B] hover:scale-110 active:scale-95";
    case 2: return "bg-[#059669] hover:bg-emerald-600 hover:scale-110 active:scale-95";
    case 3: return "bg-[#F59E0B] hover:bg-amber-600 hover:scale-110 active:scale-95";
    case 4: return "bg-[#D94F2B] hover:bg-[#B83D20] hover:scale-110 active:scale-95";
    default: return "bg-[#718096] hover:bg-slate-600 hover:scale-110 active:scale-95";
  }
};

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

  // Checklist Mode & Dialog
  const [isChecklistMode, setIsChecklistMode] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completingTask, setCompletingTask] = useState<PmScheduleTaskDto | null>(null);
  const [completingContext, setCompletingContext] = useState<{deviceName: string, month: number, week: number} | null>(null);
  const [completingRemarks, setCompletingRemarks] = useState("");
  const [completingDate, setCompletingDate] = useState<Date>(new Date());
  const [completingSubmitting, setCompletingSubmitting] = useState(false);

  // View Detail State
  const [viewDetailOpen, setViewDetailOpen] = useState(false);
  const [viewDetailTask, setViewDetailTask] = useState<PmScheduleTaskDto | null>(null);
  const [viewDetailContext, setViewDetailContext] = useState<{deviceName: string, month: number, week: number} | null>(null);

  // Bulk Complete State
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [bulkDate, setBulkDate] = useState<Date>(new Date());
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Reset selected when view/mode changes
  useEffect(() => {
    setSelectedTaskIds(new Set());
  }, [selectedMonth, isChecklistMode, sites]);

  const currentDate = new Date();
  const currentMonthNum = currentDate.getMonth() + 1;
  const currentWeekNum = Math.ceil(currentDate.getDate() / 7);

  const getTaskStatusInfo = (task: PmScheduleTaskDto) => {
    if (task.isCompleted) return { color: "bg-[#059669]", icon: true, tooltip: "Selesai" };
    const isOverdue = task.month < currentMonthNum || (task.month === currentMonthNum && task.week < currentWeekNum);
    if (isOverdue) return { color: "bg-[#F59E0B]", icon: false, tooltip: "Terlewat" };
    return { color: "bg-[#1B3A6B]", icon: false, tooltip: "Terjadwal" };
  };

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
    week: number,
    task?: PmScheduleTaskDto
  ) => {
    // If in checklist mode, we handle completion instead
    if (isChecklistMode) {
      if (task) {
        if (task.isCompleted) {
          // Open detail view instead of unchecking immediately
          setViewDetailTask(task);
          setViewDetailContext({ deviceName: device.deviceName, month, week });
          setViewDetailOpen(true);
        } else {
          // If not completed, open dialog to ask for remarks
          setCompletingTask(task);
          setCompletingContext({ deviceName: device.deviceName, month, week });
          setCompletingRemarks("");
          setCompletingDate(new Date());
          setCompleteDialogOpen(true);
        }
      }
      return;
    }

    // Normal Edit Mode
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
      // Reload to get the IDs for newly created tasks so they can be completed later
      if (!isCurrentlyScheduled) loadSchedule(); 
    } catch (error: any) {
      toast({ title: "Gagal", description: "Perubahan dibatalkan", variant: "destructive" });
      loadSchedule();
    } finally {
      setUpdatingCells((prev) => ({ ...prev, [cellKey]: false }));
    }
  };

  const handleToggleCompletionSubmit = async (task: PmScheduleTaskDto, remarks: string, completedAt?: Date) => {
    if (!task.id) {
      toast({ title: "Error", description: "ID Tugas tidak ditemukan. Silakan muat ulang halaman.", variant: "destructive" });
      return;
    }
    
    setCompletingSubmitting(true);
    try {
      await pmScheduleApi.toggleTaskCompletion(
        task.id, 
        remarks, 
        completedAt ? new Date(completedAt.getTime() - completedAt.getTimezoneOffset() * 60000).toISOString() : undefined
      );
      toast({ title: "Success", description: "Status tugas PM berhasil diubah" });
      setCompleteDialogOpen(false);
      loadSchedule();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Gagal mengubah status tugas", variant: "destructive" });
    } finally {
      setCompletingSubmitting(false);
    }
  };

  const handleToggleDeviceSelection = (incompleteTaskIds: number[]) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      const allSelected = incompleteTaskIds.length > 0 && incompleteTaskIds.every(id => next.has(id));
      if (allSelected) {
        incompleteTaskIds.forEach(id => next.delete(id));
      } else {
        incompleteTaskIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleBulkComplete = async () => {
    if (selectedTaskIds.size === 0) return;
    setBulkSubmitting(true);
    let successCount = 0;
    const errors: string[] = [];
    
    const taskIds = Array.from(selectedTaskIds);
    const completedAtStr = new Date(bulkDate.getTime() - bulkDate.getTimezoneOffset() * 60000).toISOString();
    
    const promises = taskIds.map(id => 
      pmScheduleApi.toggleTaskCompletion(id, "Selesai (Bulk)", completedAtStr)
    );
    
    const results = await Promise.allSettled(promises);
    
    results.forEach((res) => {
      if (res.status === 'fulfilled') successCount++;
      else errors.push(res.reason?.response?.data?.message || res.reason?.message || "Gagal menyimpan");
    });
    
    if (errors.length > 0) {
      toast({ title: "Selesai Sebagian", description: `Berhasil: ${successCount}. Gagal: ${errors.length} (${errors[0]})`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `${successCount} PM berhasil ditandai selesai.` });
    }
    
    setSelectedTaskIds(new Set());
    setBulkSubmitting(false);
    loadSchedule();
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
                                    const task = device.tasks.find((t) => t.month === monthNum && t.week === w);
                                    const isScheduled = !!task;
                                    let colorClass = "bg-slate-200/70";
                                    if (isScheduled) {
                                      if (isChecklistMode && task) {
                                        colorClass = getTaskStatusInfo(task).color;
                                      } else {
                                        colorClass = getWeekColor(w);
                                      }
                                    }
                                    return (
                                      <div
                                        key={w}
                                        className={`h-4 rounded-[3px] transition-colors w-full flex items-center justify-center ${colorClass}`}
                                      >
                                        {isChecklistMode && task?.isCompleted && (
                                          <Check className="w-2.5 h-2.5 text-white" />
                                        )}
                                      </div>
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
          <h2 className="text-[14px] font-bold text-[#1A202C]">Yearly Overview</h2>
          {!canUpdate && <span className="text-[10px] text-[#F59E0B] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold">View Only</span>}
        </div>

        {/* Desktop tables (hidden on mobile — mobile uses month grid above) */}
        <div className="hidden md:flex flex-col gap-5">
          <div>
            <h3 className="text-[13px] font-bold text-[#718096] mb-2 px-1">Semester 1 — Januari - Juni {year}</h3>
            {renderHalfYear(halfYear1, 0)}
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-[#718096] mb-2 px-1">Semester 2 — Juli - Desember {year}</h3>
            {renderHalfYear(halfYear2, 6)}
          </div>
        </div>

        {/* Legend — desktop only */}
        <div className="hidden md:flex flex-wrap items-center gap-4 px-1">
          {isChecklistMode ? (
            <>
              <span className="text-[11px] text-[#718096] font-medium">Keterangan Status PM:</span>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-4 rounded-sm bg-[#059669] flex items-center justify-center"><Check className="w-2 h-2 text-white" /></div>
                <span className="text-[11px] text-[#718096] font-medium">Selesai</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-4 rounded-sm bg-[#F59E0B]"></div>
                <span className="text-[11px] text-[#718096] font-medium">Terlewat / Overdue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-4 rounded-sm bg-[#1B3A6B]"></div>
                <span className="text-[11px] text-[#718096] font-medium">Terjadwal (Future)</span>
              </div>
            </>
          ) : (
            <>
              <span className="text-[11px] text-[#718096] font-medium">Keterangan Terjadwal:</span>
              {[1, 2, 3, 4].map((w) => (
                <div key={w} className="flex items-center gap-1.5">
                  <div className={`w-3 h-4 rounded-sm ${getWeekColor(w)}`}></div>
                  <span className="text-[11px] text-[#718096] font-medium">Week {w}</span>
                </div>
              ))}
            </>
          )}
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-3 h-4 rounded-sm bg-[#E2E8F0]"></div>
            <span className="text-[11px] text-[#718096] font-medium">Kosong</span>
          </div>
        </div>
      </div>
    );
  };

  const renderMonthlyDetail = () => {
    if (selectedMonth === null) return null;
    const monthNum = selectedMonth + 1;

    return (
      <div className="flex flex-col gap-4">
        {/* Back + Month Header */}
        <div className="flex items-center justify-between bg-white rounded-[10px] border border-[#E2E8F0] shadow-sm px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedMonth(null)}
              className="w-9 h-9 rounded-[10px] bg-[#F7F8FA] border border-[#E2E8F0] text-[#718096] flex items-center justify-center hover:text-[#1B3A6B] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-[10px] font-bold text-[#2B6CB0] uppercase tracking-wider">Detail Bulan</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (selectedMonth === 0) { setYear(y => y - 1); setSelectedMonth(11); }
                    else setSelectedMonth(selectedMonth - 1);
                  }}
                  className="p-1 rounded text-[#718096] hover:text-[#2B6CB0] transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-[15px] font-bold text-[#1A202C] min-w-[130px] text-center tabular-nums">
                  {MONTHS_FULL[selectedMonth]} {year}
                </h2>
                <button
                  onClick={() => {
                    if (selectedMonth === 11) { setYear(y => y + 1); setSelectedMonth(0); }
                    else setSelectedMonth(selectedMonth + 1);
                  }}
                  className="p-1 rounded text-[#718096] hover:text-[#2B6CB0] transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          {canUpdate && selectedMonth > 0 && (
            <button
              onClick={handleCloneFromPreviousMonth}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#F0FDF4] text-[#059669] hover:bg-emerald-100 font-bold text-[12px] transition-colors border border-emerald-200"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Clone dari {MONTHS_SHORT[selectedMonth - 1]}</span>
              <span className="sm:hidden">Clone</span>
            </button>
          )}
        </div>

        {/* Bulk Action Toolbar */}
        {isChecklistMode && selectedTaskIds.size > 0 && (
          <div className="sticky top-[80px] z-40 bg-[#EBF4FF] border border-[#2B6CB0]/30 rounded-[10px] shadow-md px-4 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 mb-2 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-bold text-[#1B3A6B] bg-white px-2.5 py-1 rounded-full shadow-sm">
                {selectedTaskIds.size} item dipilih
              </span>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="bg-white rounded-[8px] border border-[#E2E8F0] px-1 py-0.5">
                <FormMobileDatePicker
                  date={bulkDate}
                  onSelect={(d) => d && setBulkDate(d)}
                  placeholder="Pilih Tanggal Selesai"
                />
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedTaskIds(new Set())}
                className="text-[#DC2626] hover:bg-red-50 hover:text-[#DC2626] font-bold text-[12px] h-9"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleBulkComplete}
                disabled={bulkSubmitting}
                className="bg-[#059669] hover:bg-emerald-600 text-white font-bold text-[12px] h-9 shadow-sm"
              >
                {bulkSubmitting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5 stroke-[3]" />}
                Tandai Selesai ({selectedTaskIds.size})
              </Button>
            </div>
          </div>
        )}

        {/* Site Cards */}
        <div className="space-y-3">
          {sites.length === 0 ? (
            <div className="bg-white rounded-[10px] border border-[#E2E8F0] flex flex-col items-center justify-center py-16 gap-3">
              <MapPin className="w-8 h-8 text-[#E2E8F0]" />
              <p className="text-sm text-[#718096]">Belum ada site.</p>
            </div>
          ) : (
            sites.map((site) => (
              <div key={site.siteId} className="bg-white rounded-[10px] border border-[#E2E8F0] shadow-sm overflow-hidden">
                {/* Site Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#F7F8FA] border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[#EBF4FF] flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-[#2B6CB0]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A202C] text-[13px]">{site.siteName}</p>
                      <p className="text-[11px] text-[#718096]">{site.devices.length} PM item</p>
                    </div>
                  </div>
                  {canUpdate && (
                    <button
                      onClick={() => openAddDeviceDialog(site.siteId, site.siteName)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#EBF4FF] text-[#2B6CB0] text-[12px] font-bold hover:bg-[#DBEAFE] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah PM
                    </button>
                  )}
                </div>

                {/* Device list — mobile-friendly */}
                {site.devices.length === 0 ? (
                  <div className="text-center py-6 text-[12px] text-[#718096]">
                    Belum ada PM.
                  </div>
                ) : (
                  <div className="divide-y divide-[#E2E8F0]">
                    {site.devices.map((device) => {
                      const incompleteTasksThisMonth = device.tasks.filter(t => t.month === monthNum && !t.isCompleted && t.id);
                      const incompleteTaskIds = incompleteTasksThisMonth.map(t => t.id!);
                      const isAllSelected = incompleteTaskIds.length > 0 && incompleteTaskIds.every(id => selectedTaskIds.has(id));
                      const isPartiallySelected = incompleteTaskIds.length > 0 && incompleteTaskIds.some(id => selectedTaskIds.has(id)) && !isAllSelected;

                      return (
                      <div key={device.deviceName}
                        className={`px-4 py-3 flex items-center gap-3 transition-colors ${isChecklistMode && isAllSelected ? "bg-indigo-50/50" : ""}`}
                      >
                        {/* Checkbox for Checklist Mode */}
                        {isChecklistMode && (
                          <div className="flex-shrink-0 flex items-center">
                            <input
                              type="checkbox"
                              disabled={incompleteTaskIds.length === 0}
                              checked={isAllSelected}
                              ref={(input: HTMLInputElement | null) => { if (input) input.indeterminate = isPartiallySelected; }}
                              onChange={() => handleToggleDeviceSelection(incompleteTaskIds)}
                              className="w-5 h-5 rounded-[4px] border-[#CBD5E1] text-[#1B3A6B] focus:ring-[#1B3A6B] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                          </div>
                        )}
                        {/* Device name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[13px] font-medium text-[#1A202C] truncate">{device.deviceName}</p>
                            {canUpdate && (
                              <button
                                onClick={() => handleDeleteDevice(site.siteId, device.deviceName)}
                                className="p-1 rounded text-[#E2E8F0] hover:text-[#DC2626] hover:bg-red-50 transition-all flex-shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {/* 4 week toggle buttons */}
                        <div className="flex gap-2 flex-shrink-0">
                          {[1, 2, 3, 4].map((week) => {
                            const task = device.tasks.find(t => t.month === monthNum && t.week === week);
                            const isScheduled = !!task;
                            const cellKey = `${site.siteId}-${device.deviceName}-${monthNum}-${week}`;
                            const isUpdating = updatingCells[cellKey];
                            
                            let btnClass = "bg-white border-2 border-[#E2E8F0]";
                            let content = <span className="text-[9px] font-bold text-[#718096]">W{week}</span>;

                            if (isScheduled) {
                              if (isChecklistMode && task) {
                                const status = getTaskStatusInfo(task);
                                btnClass = `${status.color} hover:opacity-80 active:scale-95 border-none shadow-sm`;
                                content = status.icon ? <Check className="w-4 h-4 text-white stroke-[3]" /> : <span className="text-[9px] font-bold text-white">W{week}</span>;
                              } else {
                                btnClass = `${getWeekDetailClass(week)} border-none shadow-sm text-white`;
                                content = <Check className="w-4 h-4 text-white stroke-[3]" />;
                              }
                            } else if (canUpdate && !isChecklistMode) {
                              btnClass = "bg-white border-2 border-[#E2E8F0] hover:border-[#2B6CB0] active:scale-95 text-[#718096]";
                            }

                            return (
                              <button
                                key={week}
                                onClick={() => {
                                  if (!canUpdate) return;
                                  if (isChecklistMode && !isScheduled) return;
                                  handleToggleSchedule(site.siteId, device, monthNum, week, task);
                                }}
                                disabled={isUpdating || !canUpdate || (isChecklistMode && !isScheduled)}
                                className={`w-10 h-10 rounded-[8px] flex items-center justify-center transition-all duration-150 flex-shrink-0
                                  ${isUpdating ? "bg-[#F7F8FA] cursor-wait border border-[#E2E8F0]" : btnClass}`}
                              >
                                {isUpdating ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#718096]" />
                                ) : content}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 px-1">
          {isChecklistMode ? (
            <>
              <span className="text-[11px] text-[#718096] font-medium">Status PM:</span>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-[4px] bg-[#059669] flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>
                <span className="text-[11px] text-[#718096]">Selesai</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-[4px] bg-[#F59E0B]"></div>
                <span className="text-[11px] text-[#718096]">Overdue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-[4px] bg-[#1B3A6B]"></div>
                <span className="text-[11px] text-[#718096]">Terjadwal</span>
              </div>
            </>
          ) : (
            <>
              <span className="text-[11px] text-[#718096] font-medium">Week:</span>
              {[1, 2, 3, 4].map((w) => (
                <div key={w} className="flex items-center gap-1.5">
                  <div className={`w-4 h-4 rounded-[4px] ${getWeekColor(w)}`} />
                  <span className="text-[11px] text-[#718096]">W{w}</span>
                </div>
              ))}
            </>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-[10px] border border-[#E2E8F0] shadow-sm px-4 py-3 gap-3 sm:gap-0">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#1B3A6B] flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-[#1A202C]">PM Schedule</h2>
              <p className="text-[11px] text-[#718096] hidden md:block">Kelola Jadwal & Checklist PM</p>
            </div>
          </div>
          
          {/* Mode Toggle (Mobile) */}
          <div className="flex sm:hidden items-center bg-[#F7F8FA] p-1 rounded-[8px] border border-[#E2E8F0]">
            <button 
              onClick={() => setIsChecklistMode(false)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-[6px] transition-colors ${!isChecklistMode ? "bg-white shadow-sm text-[#1A202C]" : "text-[#718096] hover:text-[#1A202C]"}`}
            >
              Edit
            </button>
            <button 
              onClick={() => {
                setIsChecklistMode(true);
                if (selectedMonth === null) setSelectedMonth(currentMonthNum - 1);
              }}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-[6px] transition-colors ${isChecklistMode ? "bg-[#2B6CB0] shadow-sm text-white" : "text-[#718096] hover:text-[#2B6CB0]"}`}
            >
              Checklist
            </button>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Mode Toggle (Desktop) */}
          <div className="hidden sm:flex items-center bg-[#F7F8FA] p-1 rounded-[8px] border border-[#E2E8F0] mr-2">
            <button 
              onClick={() => setIsChecklistMode(false)}
              className={`px-3 py-1.5 text-[12px] font-bold rounded-[6px] transition-colors ${!isChecklistMode ? "bg-white shadow-sm text-[#1A202C]" : "text-[#718096] hover:text-[#1A202C]"}`}
            >
              Mode Edit
            </button>
            <button 
              onClick={() => {
                setIsChecklistMode(true);
                if (selectedMonth === null) setSelectedMonth(currentMonthNum - 1);
              }}
              className={`px-3 py-1.5 text-[12px] font-bold rounded-[6px] transition-colors ${isChecklistMode ? "bg-[#2B6CB0] shadow-sm text-white" : "text-[#718096] hover:text-[#2B6CB0]"}`}
            >
              Mode Checklist
            </button>
          </div>

          <div className="flex items-center gap-1 bg-[#F7F8FA] p-1 rounded-[10px] border border-[#E2E8F0]">
            <button onClick={() => setYear((y) => y - 1)}
              className="p-1.5 rounded-[8px] hover:bg-white hover:shadow-sm text-[#718096] transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-[#1B3A6B] text-[14px] px-2 tabular-nums">{year}</span>
            <button onClick={() => setYear((y) => y + 1)}
              className="p-1.5 rounded-[8px] hover:bg-white hover:shadow-sm text-[#718096] transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => exportPmScheduleToExcel(year, sites)}
            className="flex items-center gap-2 px-3 h-9 rounded-[10px] bg-[#059669] hover:bg-emerald-600 text-white font-bold text-[13px] transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* ====== MONTH PILLS (Only for Detail View) ====== */}
      {selectedMonth !== null && (
        <div className="bg-white rounded-[10px] border border-[#E2E8F0] shadow-sm p-3 flex flex-wrap gap-2 items-center">
          {MONTHS_SHORT.map((m, idx) => {
            const isSelected = selectedMonth === idx;
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(isSelected ? null : idx)}
                className={`px-3 py-1.5 text-xs font-bold rounded-[8px] transition-all ${
                  isSelected
                    ? "bg-[#1B3A6B] text-white"
                    : "bg-[#F7F8FA] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] border border-[#E2E8F0]"
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      )}

      {/* ====== MOBILE: Month Grid (when no month selected) ====== */}
      {selectedMonth === null && (
        <div className="md:hidden">
          <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-4">
            <p className="text-[12px] text-[#718096] mb-3 font-medium">
              {canUpdate ? "Tap bulan untuk lihat & edit jadwal" : "Tap bulan untuk lihat jadwal"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {MONTHS_FULL.map((month, idx) => {
                // Count total scheduled tasks this month across all sites
                const count = sites.reduce((acc, site) =>
                  acc + site.devices.reduce((a, dev) =>
                    a + dev.tasks.filter(t => t.month === idx + 1).length, 0), 0);
                return (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(idx)}
                    className="flex flex-col items-center p-3 rounded-[10px] border border-[#E2E8F0] bg-[#F7F8FA] hover:border-[#2B6CB0] hover:bg-[#EBF4FF] transition-colors active:scale-95"
                  >
                    <span className="text-[13px] font-semibold text-[#1A202C]">{MONTHS_SHORT[idx]}</span>
                    {count > 0 ? (
                      <span className="mt-1 text-[10px] font-bold text-[#2B6CB0] bg-[#EBF4FF] px-1.5 py-0.5 rounded-full">
                        {count} jadwal
                      </span>
                    ) : (
                      <span className="mt-1 text-[10px] text-[#718096]">Kosong</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile site summary list */}
          {sites.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[12px] font-semibold text-[#718096] px-1">Ringkasan Site</p>
              {sites.map((site) => {
                const totalScheduled = site.devices.reduce(
                  (acc, dev) => acc + dev.tasks.length, 0
                );
                return (
                  <div key={site.siteId}
                    className="bg-white rounded-[10px] border border-[#E2E8F0] px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-[#1A202C]">{site.siteName}</p>
                      <p className="text-[11px] text-[#718096]">{site.devices.length} PM item</p>
                    </div>
                    <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${
                      totalScheduled > 0
                        ? "bg-[#EBF4FF] text-[#2B6CB0]"
                        : "bg-[#F7F8FA] text-[#718096]"
                    }`}>
                      {totalScheduled} jadwal
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ====== CONDITIONAL CONTENT ====== */}
      {selectedMonth === null ? renderYearlyOverview() : renderMonthlyDetail()}

      {/* ====== ADD PM DIALOG ====== */}
      <ResponsiveModal open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen} title="Tambah PM" description={<>Tambahkan item PM baru ke site <span className="font-semibold text-[#1A202C]">{addDeviceSiteName}</span></>} desktopClassName="sm:max-w-[425px] rounded-[14px]">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deviceName" className="font-bold text-[#1A202C]">Nama PM *</Label>
              <Input
                id="deviceName"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="e.g., Commroom, Link Microwave, Trunking TAIT"
                className="h-11 rounded-[10px] border-[#E2E8F0] focus-visible:ring-[#2B6CB0]"
                onKeyDown={(e) => e.key === "Enter" && handleAddDevice()}
              />
            </div>
            <div className="bg-[#EBF4FF] rounded-[10px] p-3 border border-blue-100">
              <p className="text-[12px] text-[#2B6CB0] font-medium">
                💡 Contoh: Commroom, Link Microwave, Trunking TAIT, PABX, CATV, Repeater, CPP
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 sm:gap-0 sm:justify-between pt-4 mt-4 border-t">
            <Button variant="outline" onClick={() => setIsAddDeviceOpen(false)}
              className="rounded-[10px] h-10 font-semibold text-[#718096] border-[#E2E8F0]">
              Batal
            </Button>
            <Button onClick={handleAddDevice} disabled={addingDevice}
              className="rounded-[10px] h-10 bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white font-bold px-6">
              {addingDevice ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Tambah PM
            </Button>
          </div>
      </ResponsiveModal>

      {/* ====== COMPLETE PM DIALOG ====== */}
      <ResponsiveModal open={completeDialogOpen} onOpenChange={setCompleteDialogOpen} title={<div className="flex items-center gap-2 text-[#059669]"><div className="w-8 h-8 rounded-full bg-[#D1FAE5] flex items-center justify-center"><Check className="w-5 h-5 text-[#059669]" /></div>Tandai Selesai</div>} description="Anda akan menandai PM ini sebagai selesai. Silakan tambahkan catatan jika diperlukan." desktopClassName="sm:max-w-[425px] rounded-[14px]">
          <div className="grid gap-4 py-2">
            {completingContext && (
              <div className="bg-[#F7F8FA] p-3 rounded-[10px] border border-[#E2E8F0] mb-2">
                <p className="text-[12px] text-[#718096] mb-1">Perangkat / Sistem</p>
                <p className="text-[14px] font-bold text-[#1B3A6B]">{completingContext.deviceName}</p>
                <div className="flex gap-4 mt-2">
                  <div>
                    <p className="text-[11px] text-[#718096]">Bulan</p>
                    <p className="text-[13px] font-semibold text-[#1A202C]">{MONTHS_FULL[completingContext.month - 1]}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#718096]">Minggu (Week)</p>
                    <p className="text-[13px] font-semibold text-[#1A202C]">Week {completingContext.week}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="font-bold text-[#1A202C]">Tanggal Pelaksanaan *</Label>
              <FormMobileDatePicker
                date={completingDate}
                onSelect={(d) => d && setCompletingDate(d)}
                placeholder="Pilih tanggal pelaksanaan PM"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks" className="font-bold text-[#1A202C]">Catatan / Temuan (Opsional)</Label>
              <Textarea
                id="remarks"
                value={completingRemarks}
                onChange={(e) => setCompletingRemarks(e.target.value)}
                placeholder="Masukkan catatan perbaikan atau kondisi hardware di sini..."
                className="rounded-[10px] border-[#E2E8F0] min-h-[100px] focus-visible:ring-[#059669]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 sm:gap-0 sm:justify-between pt-4 mt-4 border-t">
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}
              className="rounded-[10px] h-10 font-semibold text-[#718096] border-[#E2E8F0]">
              Batal
            </Button>
            <Button 
              onClick={() => completingTask && handleToggleCompletionSubmit(completingTask, completingRemarks, completingDate)} 
              disabled={completingSubmitting}
              className="rounded-[10px] h-10 bg-[#059669] hover:bg-emerald-600 text-white font-bold px-6">
              {completingSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Simpan PM
            </Button>
          </div>
      </ResponsiveModal>

      {/* ====== VIEW COMPLETED PM DIALOG ====== */}
      <ResponsiveModal open={viewDetailOpen} onOpenChange={setViewDetailOpen} title={<div className="flex items-center gap-2 text-[#059669]"><div className="w-8 h-8 rounded-full bg-[#D1FAE5] flex items-center justify-center"><Check className="w-5 h-5 text-[#059669]" /></div>Detail Pelaksanaan PM</div>} description="Informasi detail jadwal PM yang sudah diselesaikan." desktopClassName="sm:max-w-[425px] rounded-[14px]">
          <div className="grid gap-4 py-2">
            {viewDetailContext && viewDetailTask && (
              <>
                <div className="bg-[#F7F8FA] p-3 rounded-[10px] border border-[#E2E8F0] mb-2">
                  <p className="text-[12px] text-[#718096] mb-1">Perangkat / Sistem</p>
                  <p className="text-[14px] font-bold text-[#1B3A6B]">{viewDetailContext.deviceName}</p>
                  <div className="flex gap-4 mt-2">
                    <div>
                      <p className="text-[11px] text-[#718096]">Bulan</p>
                      <p className="text-[13px] font-semibold text-[#1A202C]">{MONTHS_FULL[viewDetailContext.month - 1]}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#718096]">Minggu (Week)</p>
                      <p className="text-[13px] font-semibold text-[#1A202C]">Week {viewDetailContext.week}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[12px] font-bold text-[#718096]">Tanggal Pelaksanaan</p>
                    <p className="text-[14px] font-medium text-[#1A202C]">
                      {viewDetailTask.completedAt ? new Date(viewDetailTask.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                  
                  {viewDetailTask.completedByUserName && (
                    <div>
                      <p className="text-[12px] font-bold text-[#718096]">Dikerjakan Oleh</p>
                      <p className="text-[14px] font-medium text-[#1A202C]">{viewDetailTask.completedByUserName}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-[12px] font-bold text-[#718096]">Catatan / Temuan</p>
                    <div className="mt-1 p-3 bg-white border border-[#E2E8F0] rounded-[8px] min-h-[60px] text-[13px] text-[#1A202C]">
                      {viewDetailTask.remarks || <span className="text-[#A0AEC0] italic">Tidak ada catatan</span>}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-between items-center w-full gap-2 sm:gap-0 mt-4 pt-4 border-t">
            {canUpdate && (
              <Button 
                variant="outline" 
                onClick={() => {
                  if (confirm("Apakah Anda yakin ingin membatalkan status selesai untuk PM ini?")) {
                    if (viewDetailTask) {
                      handleToggleCompletionSubmit(viewDetailTask, "");
                      setViewDetailOpen(false);
                    }
                  }
                }}
                className="rounded-[10px] h-10 font-bold text-[#DC2626] border-red-200 hover:bg-red-50 hover:text-[#DC2626] w-full sm:w-auto mt-2 sm:mt-0"
              >
                Batalkan Selesai
              </Button>
            )}
            <Button onClick={() => setViewDetailOpen(false)}
              className="rounded-[10px] h-10 bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white font-bold px-6 w-full sm:w-auto">
              Tutup
            </Button>
          </div>
      </ResponsiveModal>
    </div>
  );
}
