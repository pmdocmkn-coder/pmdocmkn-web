import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Search, Download, FileSpreadsheet, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
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
    good: "bg-green-200",
    warning: "bg-yellow-200",
    critical: "bg-red-200",
    no_data: "bg-gray-100",
  };
  return colors[status as keyof typeof colors] || colors.no_data;
};

const getFpwrColor = (value: number | null): string => {
  const status = getFpwrStatus(value);
  const colors = {
    good: "bg-green-200",
    warning: "bg-yellow-200",
    critical: "bg-red-200",
    no_data: "bg-gray-100",
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
}

const SwrPivotTable: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [pivotData, setPivotData] = useState<PivotData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sites, setSites] = useState<string[]>([]);
  const { toast } = useToast();

  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;

  // ✅ Hover state for both VSWR and PWR
  const [hoveredCell, setHoveredCell] = useState<{
    rowIdx: number;
    colIdx: number;
    type: 'fpwr' | 'vswr';
    channelName: string;
    month: string;
    fpwr: number | null;
    vswr: number | null;
    note?: string;
  } | null>(null);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<{
    channelName: string;
    month: string;
    currentNote?: string;
  } | null>(null);
  const [noteText, setNoteText] = useState("");

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
      const response = await swrSignalApi.getYearlyPivot(
        selectedYear,
        selectedSite === "all" ? undefined : selectedSite
      );
      setPivotData(response || []);
      setCurrentPage(1); // Reset to first page
    } catch (error) {
      console.error("❌ Error fetching pivot data:", error);
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
  }, [selectedYear, selectedSite]);

  const handleExport = async () => {
    try {
      const siteParam = selectedSite === "all" ? undefined : selectedSite;
      const blob = await swrSignalApi.exportYearlyExcel(selectedYear, siteParam);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SWR_Report_${selectedYear}_${selectedSite}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ description: "Export successful" });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // ✅ Filter data
  const filteredData = pivotData.filter((item) => {
    const matchesSearch =
      item.channelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.siteName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || item.siteType === selectedType;
    return matchesSearch && matchesType;
  });

  // ✅ Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ✅ FIXED: Generate pie chart from paginated data
  const generatePieChartData = () => {
    const statusCount = { good: 0, warning: 0, critical: 0 };
    paginatedData.forEach((link) => {
      Object.values(link.monthlyVswr).forEach((value) => {
        if (value !== null) {
          const status = getSwrStatus(value);
          if (status !== "no_data")
            statusCount[status as keyof typeof statusCount]++;
        }
      });
    });

    return [
      { name: "Good", value: statusCount.good, fill: "#10b981" },
      { name: "Warning", value: statusCount.warning, fill: "#f59e0b" },
      { name: "Critical", value: statusCount.critical, fill: "#ef4444" },
    ].filter((item) => item.value > 0);
  };

  // ✅ FIXED: Generate chart data from paginated data
  const prepareChartData = () => {
    return months.map((month) => {
      const data: any = { month };
      paginatedData.forEach((link) => {
        const key = formatMonthKey(month);
        data[link.channelName] = link.monthlyVswr[key];
      });
      return data;
    });
  };

  const openNoteModal = (channelName: string, month: string, currentNote?: string) => {
    setEditingNote({ channelName, month, currentNote });
    setNoteText(currentNote || "");
    setIsNoteModalOpen(true);
  };

  const saveNote = () => {
    if (!editingNote) return;

    setPivotData((prev) =>
      prev.map((link) => {
        if (link.channelName === editingNote.channelName) {
          return {
            ...link,
            notes: { ...link.notes, [editingNote.month]: noteText },
          };
        }
        return link;
      })
    );

    toast({ description: "Note saved successfully (client-side only)" });
    setIsNoteModalOpen(false);
    setEditingNote(null);
    setNoteText("");
  };

  const chartData = prepareChartData();
  
  // ✅ Extended color palette for 16 channels
  const COLORS = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4",
    "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16", "#a855f7",
    "#22d3ee", "#fb923c", "#34d399", "#fbbf24",
  ];

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            SWR Pivot Analytics ({selectedYear})
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={fetchYearlyData}
              disabled={isLoading}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search channel or site..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select value={selectedSite} onValueChange={(v) => {
            setSelectedSite(v);
            setCurrentPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Filter Site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {sites.map((site) => (
                <SelectItem key={site} value={site}>{site}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={(v) => {
            setSelectedType(v);
            setCurrentPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Site Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Trunking">Trunking</SelectItem>
              <SelectItem value="Conventional">Conventional</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-indigo-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">
              Trend SWR per Channel (Page {currentPage}/{totalPages} - Showing {paginatedData.length} channels)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis domain={[1, 3]} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  }}
                />
                <ReferenceLine
                  y={1.5}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  label={{
                    value: "Good",
                    position: "right",
                    fill: "#10b981",
                    fontSize: 10,
                  }}
                />
                <ReferenceLine
                  y={2.0}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{
                    value: "Critical",
                    position: "right",
                    fill: "#ef4444",
                    fontSize: 10,
                  }}
                />
                {/* ✅ FIXED: Use paginatedData instead of filteredData.slice(0, 10) */}
                {paginatedData.map((link, idx) => (
                  <Line
                    key={link.channelName}
                    type="monotone"
                    dataKey={link.channelName}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            {/* ✅ NEW: Scrollable Legend */}
            <div className="mt-4 border rounded-lg bg-white">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h4 className="text-sm font-semibold text-gray-700">
                  Legend - Current Page Channels
                </h4>
              </div>
              <div className="max-h-32 overflow-y-auto p-3">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {paginatedData.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <div
                        className="w-8 h-0.5 flex-shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="truncate" title={link.channelName}>
                        {link.channelName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-indigo-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">
              Status Distribution (Current Page)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={generatePieChartData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {generatePieChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-4 mt-4 w-full text-center">
                {generatePieChartData().map((item) => (
                  <div key={item.name}>
                    <div className="text-xs text-gray-500 uppercase font-bold">
                      {item.name}
                    </div>
                    <div className="text-lg font-bold" style={{ color: item.fill }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pivot Table */}
      <Card className="shadow-sm border-indigo-100">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <th className="p-4 text-left border-b border-white/20 sticky left-0 bg-indigo-600 z-10" rowSpan={2}>
                  Channel
                </th>
                <th className="p-4 text-left border-b border-white/20" rowSpan={2}>Site</th>
                <th className="p-4 text-left border-b border-white/20" rowSpan={2}>Type</th>
                {months.map((m) => (
                  <th key={m} className="p-2 text-center border-b border-white/20 min-w-[120px]" colSpan={2}>
                    {formatMonthKey(m)}
                  </th>
                ))}
              </tr>
              <tr className="bg-indigo-700 text-white text-[10px] uppercase tracking-wider">
                {months.map((m) => (
                  <React.Fragment key={m}>
                    <th className="p-1 border-l border-white/10">VSWR</th>
                    <th className="p-1 border-l border-white/10">VPWR</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-indigo-50/30 border-b transition-colors">
                    <td className="p-4 font-bold sticky left-0 bg-white border-r border-indigo-100 z-10">
                      {row.channelName}
                    </td>
                    <td className="p-4 text-gray-600">{row.siteName}</td>
                    <td className="p-4 italic text-gray-400">{row.siteType}</td>
                    {months.map((m, monthIdx) => {
                      const key = formatMonthKey(m);
                      const fpwr = row.monthlyFpwr[key];
                      const vswr = row.monthlyVswr[key];
                      const note = row.notes?.[key];
                      
                      return (
                        <React.Fragment key={m}>
                          {/* VSWR Cell */}
                          <td
                            onMouseEnter={() =>
                              setHoveredCell({
                                rowIdx,
                                colIdx: monthIdx * 2,
                                type: 'vswr',
                                channelName: row.channelName,
                                month: key,
                                fpwr,
                                vswr,
                                note,
                              })
                            }
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`p-2 text-center border-l border-indigo-50 font-mono font-medium relative cursor-pointer ${getSwrTextColor(vswr)} ${getSwrColor(vswr)}`}
                          >
                            {vswr ? (
                              <>
                                {vswr.toFixed(2)}
                                {note && <span className="ml-1 text-blue-600 text-xs">📝</span>}
                              </>
                            ) : "-"}

                            {/* Tooltip for VSWR */}
                            {hoveredCell?.rowIdx === rowIdx &&
                              hoveredCell?.colIdx === monthIdx * 2 &&
                              hoveredCell?.type === 'vswr' && (
                                <div className={`absolute left-1/2 transform -translate-x-1/2 ${
                                    rowIdx < 3 ? "top-full mt-2" : "bottom-full mb-2"
                                  } w-64 p-3 bg-gray-900 text-white text-xs rounded shadow-lg z-50`}>
                                  <div className="relative">
                                    <div className={`absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-transparent ${
                                        rowIdx < 3
                                          ? "-top-2 border-b-8 border-b-gray-900"
                                          : "-bottom-2 border-t-8 border-t-gray-900"
                                      }`} />
                                    <div className="mb-2">
                                      <h4 className="font-bold">{row.channelName}</h4>
                                      <p className="text-gray-300 text-xs">{m} {selectedYear}</p>
                                    </div>
                                    {fpwr && (
                                      <div className="mb-2">
                                        <p className="text-xs text-gray-400">FPWR</p>
                                        <p className="text-lg font-bold">{fpwr.toFixed(1)}W</p>
                                      </div>
                                    )}
                                    {vswr && (
                                      <div className="mb-2">
                                        <p className="text-xs text-gray-400">VSWR</p>
                                        <p className="text-lg font-bold">{vswr.toFixed(2)}</p>
                                      </div>
                                    )}
                                    {note && (
                                      <div className="mb-3 p-2 bg-yellow-900/30 rounded">
                                        <p className="font-semibold">📝 Catatan:</p>
                                        <p className="text-sm">{note}</p>
                                      </div>
                                    )}
                                    <button
                                      onClick={() => openNoteModal(row.channelName, key, note)}
                                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                                    >
                                      {note ? "✏️ Edit Note" : "📝 Add Note"}
                                    </button>
                                  </div>
                                </div>
                              )}
                          </td>

                          {/* FPWR Cell */}
                          <td
                            onMouseEnter={() =>
                              setHoveredCell({
                                rowIdx,
                                colIdx: monthIdx * 2 + 1,
                                type: 'fpwr',
                                channelName: row.channelName,
                                month: key,
                                fpwr,
                                vswr,
                                note,
                              })
                            }
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`p-2 text-center border-l border-indigo-50 font-mono relative cursor-pointer ${getFpwrTextColor(fpwr)} ${getFpwrColor(fpwr)}`}
                          >
                            {fpwr ? fpwr.toFixed(1) : "-"}

                            {/* Tooltip for FPWR */}
                            {hoveredCell?.rowIdx === rowIdx &&
                              hoveredCell?.colIdx === monthIdx * 2 + 1 &&
                              hoveredCell?.type === 'fpwr' && (
                                <div className={`absolute left-1/2 transform -translate-x-1/2 ${
                                    rowIdx < 3 ? "top-full mt-2" : "bottom-full mb-2"
                                  } w-64 p-3 bg-gray-900 text-white text-xs rounded shadow-lg z-50`}>
                                  <div className="relative">
                                    <div className={`absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-transparent ${
                                        rowIdx < 3
                                          ? "-top-2 border-b-8 border-b-gray-900"
                                          : "-bottom-2 border-t-8 border-t-gray-900"
                                      }`} />
                                    <div className="mb-2">
                                      <h4 className="font-bold">{row.channelName}</h4>
                                      <p className="text-gray-300 text-xs">{m} {selectedYear}</p>
                                    </div>
                                    {fpwr && (
                                      <div className="mb-2">
                                        <p className="text-xs text-gray-400">FPWR</p>
                                        <p className="text-lg font-bold">{fpwr.toFixed(1)}W</p>
                                      </div>
                                    )}
                                    {vswr && (
                                      <div className="mb-2">
                                        <p className="text-xs text-gray-400">VSWR</p>
                                        <p className="text-lg font-bold">{vswr.toFixed(2)}</p>
                                      </div>
                                    )}
                                    {note && (
                                      <div className="mb-3 p-2 bg-yellow-900/30 rounded">
                                        <p className="font-semibold">📝 Catatan:</p>
                                        <p className="text-sm">{note}</p>
                                      </div>
                                    )}
                                    <button
                                      onClick={() => openNoteModal(row.channelName, key, note)}
                                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                                    >
                                      {note ? "✏️ Edit Note" : "📝 Add Note"}
                                    </button>
                                  </div>
                                </div>
                              )}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={months.length * 2 + 3} className="p-12 text-center text-gray-400">
                    No data found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>

        {/* ✅ NEW: Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} ({filteredData.length} total)
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </Card>

      {/* Note Modal */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNote?.currentNote ? "Edit" : "Add"} Note
            </DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="space-y-4">
              <div>
                <Label>Channel</Label>
                <p className="text-sm font-semibold">
                  {editingNote.channelName}
                </p>
              </div>
              <div>
                <Label>Month</Label>
                <p className="text-sm font-semibold">{editingNote.month}</p>
              </div>
              <div>
                <Label htmlFor="note">Note/Keterangan</Label>
                <textarea
                  id="note"
                  className="w-full p-2 border rounded"
                  placeholder="Contoh: Maintenance, Equipment failure, dll"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNote}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SwrPivotTable;