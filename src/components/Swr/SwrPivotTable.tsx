import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Search,
  FileSpreadsheet,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Calendar,
  Building,
  Radio,
  BarChart3,
  PieChart as PieChartIcon,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { swrSignalApi } from "../../services/api";
import { useToast } from "@/hooks/use-toast";

const SWR_THRESHOLDS = {
  GOOD_MAX: 1.5,
  WARNING_MAX: 2.0,
};

const FPWR_THRESHOLDS = {
  GOOD_MAX: 100,
  WARNING_MAX: 150,
};

const getSwrStatus = (value: number | null): string => {
  if (value === null) return "no_data";
  if (value <= SWR_THRESHOLDS.GOOD_MAX) return "good";
  if (value <= SWR_THRESHOLDS.WARNING_MAX) return "warning";
  return "critical";
};

const getFpwrStatus = (value: number | null): string => {
  if (value === null) return "no_data";
  if (value <= FPWR_THRESHOLDS.GOOD_MAX) return "good";
  if (value <= FPWR_THRESHOLDS.WARNING_MAX) return "warning";
  return "critical";
};

const getSwrColor = (value: number | null): string => {
  const status = getSwrStatus(value);
  const colors = {
    good: "bg-green-200 border-green-300",
    warning: "bg-yellow-200 border-yellow-300",
    critical: "bg-red-200 border-red-300",
    no_data: "bg-gray-100 border-gray-200",
  };
  return colors[status as keyof typeof colors] || colors.no_data;
};

const getFpwrColor = (value: number | null): string => {
  const status = getFpwrStatus(value);
  const colors = {
    good: "bg-green-200 border-green-300",
    warning: "bg-yellow-200 border-yellow-300",
    critical: "bg-red-200 border-red-300",
    no_data: "bg-gray-100 border-gray-200",
  };
  return colors[status as keyof typeof colors] || colors.no_data;
};

const getSwrTextColor = (value: number | null): string => {
  const status = getSwrStatus(value);
  const colors = {
    good: "text-green-800",
    warning: "text-yellow-800",
    critical: "text-red-800",
    no_data: "text-gray-400",
  };
  return colors[status as keyof typeof colors] || colors.no_data;
};

const getFpwrTextColor = (value: number | null): string => {
  const status = getFpwrStatus(value);
  const colors = {
    good: "text-green-800",
    warning: "text-yellow-800",
    critical: "text-red-800",
    no_data: "text-gray-400",
  };
  return colors[status as keyof typeof colors] || colors.no_data;
};

interface PivotData {
  channelName: string;
  siteName: string;
  siteType: string;
  monthlyFpwr: Record<string, number | null>;
  monthlyVswr: Record<string, number | null>;
  expectedSwrMax: number;
  notes: Record<string, string>;
  historyIds: Record<string, number | undefined>;
}

const SwrPivotTable: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [pivotData, setPivotData] = useState<PivotData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sites, setSites] = useState<string[]>([]);
  const [showMultiSelect, setShowMultiSelect] = useState(false);
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;

  const [hoveredCell, setHoveredCell] = useState<{
    rowIdx: number;
    colIdx: number;
    type: 'fpwr' | 'vswr';
    channelName: string;
    month: string;
    fpwr: number | null;
    vswr: number | null;
    note?: string;
    historyId?: number;
  } | null>(null);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<{
    channelName: string;
    month: string;
    currentNote?: string;
    historyId?: number;
    siteName: string;
  } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const formatMonthKey = (month: string): string => {
    return `${month}-${selectedYear.toString().slice(-2)}`;
  };

  const fetchAvailableSites = async () => {
    try {
      const response = await swrSignalApi.getSites();
      setSites(response.map((s: any) => s.name));
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  };

  const fetchYearlyData = async () => {
    setIsLoading(true);
    try {
      const siteParam = selectedSites.length === 1 ? selectedSites[0] : undefined;
      const response = await swrSignalApi.getYearlyPivot(selectedYear, siteParam);

      // Load saved notes from localStorage untuk backup
      const dataWithNotes = (response || []).map((item: any) => {
        const localKey = `swr-notes-${selectedYear}-${item.channelName}`;
        try {
          const localNotes = JSON.parse(localStorage.getItem(localKey) || '{}');
          return {
            ...item,
            notes: { ...item.notes, ...localNotes }
          };
        } catch {
          return item;
        }
      });

      setPivotData(dataWithNotes);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching pivot data:", error);
      setPivotData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableSites();
  }, []);

  useEffect(() => {
    fetchYearlyData();
  }, [selectedYear, selectedSites]);

  const handleExport = async () => {
    try {
      const siteParam = selectedSites.length === 1 ? selectedSites[0] : undefined;
      await swrSignalApi.exportYearlyExcel(selectedYear, siteParam);
      toast({
        title: "Export Berhasil",
        description: `Data tahun ${selectedYear} berhasil diexport`,
      });
    } catch (error: any) {
      toast({
        title: "Export Gagal",
        description: error.message || "Gagal mengekspor data",
        variant: "destructive",
      });
    }
  };

  const filteredData = pivotData.filter((item) => {
    const matchesSearch =
      item.channelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.siteName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSites = selectedSites.length === 0 || selectedSites.includes(item.siteName);
    const matchesType = selectedType === "all" || item.siteType === selectedType;
    return matchesSearch && matchesSites && matchesType;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 🎯 GRAFIK 1: Data untuk Line Chart VSWR - TAMPILKAN SEMUA CHANNEL DI HALAMAN
  const prepareLineChartData = () => {
    const chartData = months.map((month) => {
      const monthKey = formatMonthKey(month);
      const dataPoint: any = { month };

      // TAMPILKAN SEMUA CHANNEL DI HALAMAN, BUKAN HANYA 6 PERTAMA
      paginatedData.forEach((link) => {
        const value = link.monthlyVswr[monthKey];
        dataPoint[link.channelName] = value !== null && value !== undefined ? value : null;
      });

      return dataPoint;
    });

    return chartData;
  };

  // 🎯 GRAFIK 2: Pie Chart untuk distribusi status
  const generatePieChartData = () => {
    const statusCount = { good: 0, warning: 0, critical: 0, no_data: 0 };

    paginatedData.forEach((link) => {
      Object.values(link.monthlyVswr).forEach((value) => {
        const status = getSwrStatus(value);
        statusCount[status as keyof typeof statusCount]++;
      });
    });

    return [
      { name: "Good", value: statusCount.good, fill: "#10b981" },
      { name: "Warning", value: statusCount.warning, fill: "#f59e0b" },
      { name: "Critical", value: statusCount.critical, fill: "#ef4444" },
      { name: "No Data", value: statusCount.no_data, fill: "#9ca3af" },
    ].filter((item) => item.value > 0);
  };

  const openNoteModal = (
    channelName: string,
    month: string,
    currentNote?: string,
    historyId?: number,
    siteName?: string
  ) => {
    setEditingNote({
      channelName,
      month,
      currentNote,
      historyId,
      siteName: siteName || ""
    });
    setNoteText(currentNote || "");
    setIsNoteModalOpen(true);
  };

  // 🔧 PERBAIKAN: Fungsi saveNote dengan kemampuan hapus catatan
  const saveNote = async () => {
    if (!editingNote) return;

    const isDeletingNote = !noteText.trim();

    // Konfirmasi hapus catatan
    if (isDeletingNote && editingNote.currentNote) {
      const confirmed = window.confirm(
        `Apakah Anda yakin ingin menghapus catatan untuk ${editingNote.channelName} - ${editingNote.month}?\n\n"${editingNote.currentNote}"`
      );

      if (!confirmed) {
        return;
      }
    }

    setIsSaving(true);
    try {
      const channelData = pivotData.find(p => p.channelName === editingNote.channelName);
      if (!channelData) {
        throw new Error(`Channel "${editingNote.channelName}" not found`);
      }

      const channels = await swrSignalApi.getChannels();
      const channel = channels.find((c: any) =>
        c.channelName === editingNote.channelName &&
        c.swrSiteName === (editingNote.siteName || channelData.siteName)
      );

      const monthKey = editingNote.month;
      const fpwrValue = channelData?.monthlyFpwr?.[monthKey];
      const vswrValue = channelData?.monthlyVswr?.[monthKey];

      const hasTechnicalData =
        (fpwrValue !== undefined && fpwrValue !== null) ||
        (vswrValue !== undefined && vswrValue !== null);

      let successMessage = isDeletingNote
        ? "Catatan berhasil dihapus"
        : editingNote.currentNote
          ? "Catatan berhasil diperbarui"
          : "Catatan berhasil disimpan";

      let newHistoryId = editingNote.historyId;

      // Logic untuk backend jika ada channel
      if (channel && channel.id) {
        const [monthStr, yearStr] = editingNote.month.split('-');
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthIndex = monthNames.indexOf(monthStr);
        const year = 2000 + parseInt(yearStr);
        const recordDate = new Date(year, monthIndex, 15);
        const isoDate = recordDate.toISOString().split('T')[0];

        const historiesResponse = await swrSignalApi.getHistories({
          page: 1,
          pageSize: 50,
          swrChannelId: channel.id,
          sortBy: "Date",
          sortDir: "desc"
        });

        const existingHistory = historiesResponse.data.find((h: any) => {
          const hDate = new Date(h.date);
          const hMonthKey = `${monthNames[hDate.getMonth()]}-${hDate.getFullYear().toString().slice(-2)}`;
          return hMonthKey === editingNote.month;
        });

        if (existingHistory) {
          // Update existing history
          const updateData: any = {
            notes: isDeletingNote ? "" : noteText.trim(),
            status: existingHistory.status || "Active"
          };

          if (fpwrValue !== undefined && fpwrValue !== null) updateData.fpwr = fpwrValue;
          if (vswrValue !== undefined && vswrValue !== null) {
            updateData.vswr = vswrValue >= 1.0 ? vswrValue : 1.0;
          } else if (existingHistory.vswr !== undefined) {
            updateData.vswr = existingHistory.vswr;
          }

          await swrSignalApi.updateHistory(existingHistory.id, updateData);
          newHistoryId = existingHistory.id;

        } else if (hasTechnicalData && !isDeletingNote) {
          // Create new history only if we have a note
          const historyData: any = {
            swrChannelId: channel.id,
            date: isoDate,
            notes: noteText.trim(),
            status: "Active"
          };

          if (fpwrValue !== undefined && fpwrValue !== null) {
            historyData.fpwr = fpwrValue;
          }

          if (vswrValue !== undefined && vswrValue !== null) {
            historyData.vswr = vswrValue >= 1.0 ? vswrValue : 1.0;
          } else {
            historyData.vswr = 1.0;
          }

          const newHistory = await swrSignalApi.createHistory(historyData);
          newHistoryId = newHistory.id;
        }
      }

      // Update UI state
      setPivotData((prev) =>
        prev.map((link) => {
          if (link.channelName === editingNote.channelName) {
            const updatedNotes = { ...link.notes };

            if (isDeletingNote) {
              delete updatedNotes[editingNote.month];
            } else {
              updatedNotes[editingNote.month] = noteText.trim();
            }

            const updatedHistoryIds = { ...link.historyIds };
            if (isDeletingNote) {
              delete updatedHistoryIds[editingNote.month];
            } else if (newHistoryId) {
              updatedHistoryIds[editingNote.month] = newHistoryId;
            }

            // Update localStorage
            const localKey = `swr-notes-${selectedYear}-${editingNote.channelName}`;
            try {
              const existingLocal = JSON.parse(localStorage.getItem(localKey) || '{}');

              if (isDeletingNote) {
                delete existingLocal[editingNote.month];
              } else {
                existingLocal[editingNote.month] = noteText.trim();
              }

              if (Object.keys(existingLocal).length === 0) {
                localStorage.removeItem(localKey);
              } else {
                localStorage.setItem(localKey, JSON.stringify(existingLocal));
              }
            } catch (error) {
              console.warn("Failed to update localStorage:", error);
            }

            return {
              ...link,
              notes: updatedNotes,
              historyIds: updatedHistoryIds
            };
          }
          return link;
        })
      );

      toast({
        title: "Berhasil",
        description: successMessage,
      });

      setIsNoteModalOpen(false);
      setEditingNote(null);
      setNoteText("");

    } catch (error: any) {
      console.error("❌ Error saving/deleting note:", error);

      let errorMessage = isDeletingNote
        ? "Gagal menghapus catatan"
        : "Gagal menyimpan catatan";

      if (error.response?.data) {
        const backendError = error.response.data;
        if (backendError.message) {
          errorMessage = backendError.message;
        } else if (backendError.errors) {
          const errors = Object.values(backendError.errors).flat();
          errorMessage = errors.join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const shouldShowNoteIcon = (note?: string) => {
    return !!note?.trim();
  };

  const lineChartData = prepareLineChartData();
  const pieChartData = generatePieChartData();

  const COLORS = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4",
    "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16", "#a855f7",
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", // Duplicate untuk lebih banyak channel
  ];

  const toggleSiteSelection = (siteName: string) => {
    setSelectedSites(prev => {
      if (prev.includes(siteName)) {
        return prev.filter(s => s !== siteName);
      } else {
        return [...prev, siteName];
      }
    });
    setCurrentPage(1);
  };

  const removeSite = (siteName: string) => {
    setSelectedSites(prev => prev.filter(s => s !== siteName));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header dengan Filter */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-xl">SWR Monitoring System</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Tahun {selectedYear} • {filteredData.length} channel ditemukan • Halaman {currentPage}/{totalPages}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={fetchYearlyData}
                disabled={isLoading}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari channel atau site..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Multi-Select Sites */}
            <div className="relative">
              <button
                onClick={() => setShowMultiSelect(!showMultiSelect)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
              >
                <span className="text-gray-900">
                  {selectedSites.length === 0
                    ? "Semua Site"
                    : `${selectedSites.length} site terpilih`
                  }
                </span>
                <Building className="w-4 h-4 text-gray-500" />
              </button>

              {selectedSites.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedSites.map((site) => (
                    <span
                      key={site}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                    >
                      {site}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSite(site);
                        }}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {showMultiSelect && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMultiSelect(false)}
                  />
                  <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto border rounded-md bg-white shadow-lg">
                    <div className="p-2 border-b bg-gray-50 flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-700">Pilih Site</span>
                      <button
                        onClick={() => {
                          setSelectedSites([]);
                          setCurrentPage(1);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Hapus Semua
                      </button>
                    </div>
                    <div className="p-2 space-y-1">
                      {sites.map((site) => (
                        <label
                          key={site}
                          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSites.includes(site)}
                            onChange={() => toggleSiteSelection(site)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>{site}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Select value={selectedType} onValueChange={(v) => {
              setSelectedType(v);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Tipe Site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="Trunking">Trunking</SelectItem>
                <SelectItem value="Conventional">Conventional</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {[2023, 2024, 2025, 2026].map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 🎯 BAGIAN GRAFIK - PERBAIKAN: SEMUA CHANNEL DI HALAMAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik 1: Line Chart Trend VSWR */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base">Trend VSWR per Channel</CardTitle>
                <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                  {paginatedData.length} channels
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Menampilkan {paginatedData.length} channel dari halaman {currentPage}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[1, 3]}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    formatter={(value: any, name: any) => {
                      if (value === null || value === undefined) return ["No Data", name];
                      return [`${value.toFixed(2)}`, name];
                    }}
                    labelFormatter={(label) => `Bulan: ${label}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <ReferenceLine
                    y={1.5}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  />
                  <ReferenceLine
                    y={2.0}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  />

                  {/* TAMPILKAN SEMUA CHANNEL DI HALAMAN */}
                  {paginatedData.map((link, idx) => (
                    <Line
                      key={link.channelName}
                      type="monotone"
                      dataKey={link.channelName}
                      stroke={COLORS[idx % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      connectNulls={true}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Legenda untuk semua channel */}
            {paginatedData.length > 0 && (
              <div className="mt-4 border rounded-lg p-3 bg-gray-50">
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {paginatedData.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs bg-white px-2 py-1.5 rounded border">
                      <div
                        className="w-3 h-0.5"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="truncate max-w-[120px] font-medium">{link.channelName}</span>
                      <span className="text-[10px] text-gray-500">({link.siteType.charAt(0)})</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Menampilkan {paginatedData.length} channel sesuai filter dan halaman
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grafik 2: Pie Chart Distribusi Status */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-green-600" />
              <CardTitle className="text-base">Distribusi Status VSWR</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: any, name: any) => [
                      value,
                      `${name} Data`
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {pieChartData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Data dari {paginatedData.length} channel di halaman ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 📊 TABEL PIVOT UTAMA */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <th className="p-4 text-left border-b border-white/20 sticky left-0 bg-blue-600 z-20" rowSpan={2}>
                  Channel
                </th>

                <th className="p-4 text-left border-b border-white/20" rowSpan={2}>Type</th>
                {months.map((m) => (
                  <th key={m} className="p-2 text-center border-b border-white/20 min-w-[140px]" colSpan={2}>
                    {formatMonthKey(m)}
                  </th>
                ))}
              </tr>
              <tr className="bg-blue-700 text-white text-[10px] uppercase tracking-wider">
                {months.map((m) => (
                  <React.Fragment key={m}>
                    <th className="p-2 border-l border-white/10">VSWR</th>
                    <th className="p-2 border-l border-white/10">FPWR (W)</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={months.length * 2 + 3} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                      <p className="text-gray-500">Memuat data...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((row, rowIdx) => {
                  const hasAnyNote = Object.values(row.notes || {}).some(note => note?.trim());

                  return (
                    <tr
                      key={rowIdx}
                      className={`hover:bg-blue-50/50 border-b transition-colors ${hasAnyNote ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="p-4 font-bold sticky left-0 bg-white border-r border-blue-100 z-10">
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4 text-blue-600" />
                          <span>{row.channelName}</span>
                          {hasAnyNote && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                              📝
                            </span>
                          )}
                        </div>
                      </td>


                      <td className="p-4 italic text-gray-400">
                        <span className={`px-2 py-1 rounded text-xs ${row.siteType === 'Trunking'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                          }`}>
                          {row.siteType}
                        </span>
                      </td>

                      {months.map((m, monthIdx) => {
                        const key = formatMonthKey(m);
                        const fpwr = row.monthlyFpwr[key];
                        const vswr = row.monthlyVswr[key];
                        const note = row.notes?.[key];
                        const historyId = row.historyIds?.[key];
                        const hasNote = shouldShowNoteIcon(note);
                        const isDataPresent = vswr !== null || fpwr !== null;

                        return (
                          <React.Fragment key={m}>
                            {/* VSWR Cell */}
                            <td
                              onMouseEnter={() => setHoveredCell({
                                rowIdx,
                                colIdx: monthIdx * 2,
                                type: 'vswr',
                                channelName: row.channelName,
                                month: key,
                                fpwr,
                                vswr,
                                note,
                                historyId
                              })}
                              onMouseLeave={() => setHoveredCell(null)}
                              className={`p-3 text-center border-l border-blue-50 font-mono font-medium relative cursor-pointer group ${getSwrTextColor(vswr)} ${getSwrColor(vswr)}`}
                            >
                              <div className="relative">
                                {isDataPresent ? (
                                  <>
                                    {vswr !== null && vswr !== undefined ? vswr.toFixed(2) : "-"}
                                    {hasNote && (
                                      <span className="absolute -top-1 -right-1 text-blue-600 text-xs bg-blue-100 rounded-full w-5 h-5 flex items-center justify-center border border-blue-300 shadow-sm">
                                        📝
                                      </span>
                                    )}
                                  </>
                                ) : note ? (
                                  <div className="flex flex-col items-center justify-center min-h-[50px]">
                                    <div className="text-blue-600 text-xs mb-1">📝</div>
                                    <div className="text-xs text-gray-600 italic px-1 text-center break-words">
                                      {note.length > 15 ? `${note.substring(0, 15)}...` : note}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-gray-400">-</div>
                                )}
                              </div>

                              {/* TOOLTIP SEPERTI NEC - LAYOUT BAGUS */}
                              {hoveredCell?.rowIdx === rowIdx && hoveredCell?.colIdx === monthIdx * 2 && hoveredCell?.type === 'vswr' && (
                                <div className={`absolute left-1/2 transform -translate-x-1/2 ${rowIdx < 3 ? "top-full mt-2" : "bottom-full mb-2"} w-80 p-4 bg-gray-900 text-white text-xs rounded-lg shadow-2xl z-50 border border-gray-700`}>
                                  <div className="relative">
                                    {/* Arrow */}
                                    <div className={`absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-transparent ${rowIdx < 3 ? "-top-2 border-b-8 border-b-gray-900" : "-bottom-2 border-t-8 border-t-gray-900"
                                      }`} />

                                    {/* Header */}
                                    <div className="mb-3 border-b border-gray-700 pb-2">
                                      <h4 className="font-bold text-sm">{row.channelName}</h4>
                                      <p className="text-gray-300 text-xs">{row.siteName} • {m} {selectedYear}</p>
                                    </div>

                                    {/* Technical Data Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                      {vswr !== null && vswr !== undefined && (
                                        <div className="bg-gray-800/50 p-3 rounded">
                                          <p className="text-xs text-gray-400 mb-1">VSWR</p>
                                          <div className="flex items-center justify-between">
                                            <p className="text-lg font-bold">{vswr.toFixed(2)}</p>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getSwrColor(vswr).split(' ')[0]} text-black border`}>
                                              {getSwrStatus(vswr).toUpperCase()}
                                            </span>
                                          </div>
                                        </div>
                                      )}

                                      {fpwr !== null && fpwr !== undefined && (
                                        <div className="bg-gray-800/50 p-3 rounded">
                                          <p className="text-xs text-gray-400 mb-1">FPWR</p>
                                          <div className="flex items-center justify-between">
                                            <p className="text-lg font-bold">{fpwr.toFixed(1)} W</p>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getFpwrColor(fpwr).split(' ')[0]} text-black border`}>
                                              {getFpwrStatus(fpwr).toUpperCase()}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Notes Section - SEPERTI DI NEC */}
                                    {note && (
                                      <div className="mb-4 p-3 bg-yellow-900/20 rounded border border-yellow-700/30">
                                        <div className="flex items-start gap-2">
                                          <span className="text-yellow-300 mt-0.5">📝</span>
                                          <div className="flex-1">
                                            <p className="font-semibold text-yellow-300 text-sm mb-1">Catatan:</p>
                                            <p className="text-sm text-white break-words whitespace-normal leading-relaxed">
                                              {note}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Action Button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openNoteModal(
                                          row.channelName,
                                          key,
                                          note,
                                          historyId,
                                          row.siteName
                                        );
                                      }}
                                      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                      {note ? (
                                        <>
                                          <span className="text-xs">✏️</span>
                                          <span>Edit Note</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="text-xs">📝</span>
                                          <span>Add Note</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* FPWR Cell */}
                            <td
                              onMouseEnter={() => setHoveredCell({
                                rowIdx,
                                colIdx: monthIdx * 2 + 1,
                                type: 'fpwr',
                                channelName: row.channelName,
                                month: key,
                                fpwr,
                                vswr,
                                note,
                                historyId
                              })}
                              onMouseLeave={() => setHoveredCell(null)}
                              className={`p-3 text-center border-l border-blue-50 font-mono relative cursor-pointer ${getFpwrTextColor(fpwr)} ${getFpwrColor(fpwr)}`}
                            >
                              <div className="relative">
                                {isDataPresent ? (
                                  <>
                                    {fpwr !== null && fpwr !== undefined ? fpwr.toFixed(1) : "-"}
                                    {hasNote && (
                                      <span className="absolute -top-1 -right-1 text-blue-600 text-xs bg-blue-100 rounded-full w-5 h-5 flex items-center justify-center border border-blue-300 shadow-sm">
                                        📝
                                      </span>
                                    )}
                                  </>
                                ) : note ? (
                                  <div className="flex flex-col items-center justify-center min-h-[50px]">
                                    <div className="text-blue-600 text-xs mb-1">📝</div>
                                    <div className="text-xs text-gray-600 italic px-1 text-center break-words">
                                      {note.length > 15 ? `${note.substring(0, 15)}...` : note}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-gray-400">-</div>
                                )}
                              </div>
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={months.length * 2 + 3} className="p-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-lg font-medium">Tidak ada data ditemukan</p>
                      <p className="text-gray-500 mt-1">
                        {searchTerm || selectedSites.length > 0 || selectedType !== 'all'
                          ? "Coba ubah filter pencarian"
                          : "Tidak ada data untuk tahun ini"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-600">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} channel
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Sebelumnya
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Berikutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Legend */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Keterangan Status
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 bg-green-200 border border-green-300 rounded"></div>
            <span>VSWR ≤ 1.5</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 bg-yellow-200 border border-yellow-300 rounded"></div>
            <span>VSWR 1.5-2.0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 bg-red-200 border border-red-300 rounded"></div>
            <span>VSWR &gt; 2.0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 bg-green-200 border border-green-300 rounded"></div>
            <span>FPWR ≤ 100W</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 bg-yellow-200 border border-yellow-300 rounded"></div>
            <span>FPWR 100-150W</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 bg-red-200 border border-red-300 rounded"></div>
            <span>FPWR &gt; 150W</span>
          </div>
        </div>
      </div>

      {/* Note Modal */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-blue-600">📝</span>
              {editingNote?.currentNote ? "Edit Catatan" : "Tambah Catatan"}
            </DialogTitle>
          </DialogHeader>

          {editingNote && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Channel</Label>
                <p className="text-sm font-semibold bg-blue-50 p-2 rounded">{editingNote.channelName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Site</Label>
                  <p className="text-sm font-semibold bg-gray-50 p-2 rounded">{editingNote.siteName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Periode</Label>
                  <p className="text-sm font-semibold bg-gray-50 p-2 rounded">{editingNote.month}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Catatan / Keterangan</Label>
                <textarea
                  id="note"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] resize-none"
                  placeholder={editingNote.currentNote
                    ? "Kosongkan untuk menghapus catatan, atau edit di sini..."
                    : "Contoh: Maintenance antenna, Perpindahan lokasi, Equipment replacement, dll"
                  }
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                  autoFocus
                />
                <p className="text-xs text-gray-500">
                  {editingNote.currentNote
                    ? "Kosongkan textarea untuk menghapus catatan yang ada"
                    : "Catatan akan disimpan dan muncul di tooltip saat hover"
                  }
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsNoteModalOpen(false)}
              disabled={isSaving}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              onClick={saveNote}
              disabled={isSaving}
              className={`flex-1 ${editingNote?.currentNote && !noteText.trim()
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : editingNote?.currentNote && !noteText.trim() ? (
                "Hapus Catatan"
              ) : editingNote?.currentNote ? (
                "Update Catatan"
              ) : (
                "Simpan Catatan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SwrPivotTable;