import React, { useState, useEffect } from "react";
import { hasPermission } from "../../utils/permissionUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { necSignalApi } from "../../services/necSignalService";
import type { NecYearlyPivotDto } from "../../types/necSignal";

// Threshold RSL
import { ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const RSL_THRESHOLDS = {
  TOO_STRONG_MAX: -30,
  TOO_STRONG_MIN: -45,
  OPTIMAL_MAX: -45,
  OPTIMAL_MIN: -55,
  WARNING_MAX: -55,
  WARNING_MIN: -60,
  SUB_OPTIMAL_MAX: -60,
  SUB_OPTIMAL_MIN: -65,
  CRITICAL: -65,
};

const getRslStatus = (value: number | null): string => {
  if (value === null) return "no_data";
  if (
    value > RSL_THRESHOLDS.TOO_STRONG_MIN &&
    value <= RSL_THRESHOLDS.TOO_STRONG_MAX
  )
    return "too_strong";
  if (value > RSL_THRESHOLDS.OPTIMAL_MIN && value <= RSL_THRESHOLDS.OPTIMAL_MAX)
    return "optimal";
  if (value > RSL_THRESHOLDS.WARNING_MIN && value <= RSL_THRESHOLDS.WARNING_MAX)
    return "warning";
  if (
    value > RSL_THRESHOLDS.SUB_OPTIMAL_MIN &&
    value <= RSL_THRESHOLDS.SUB_OPTIMAL_MAX
  )
    return "sub_optimal";
  return "critical";
};

const getRslColor = (value: number | null): string => {
  const status = getRslStatus(value);
  const colors = {
    too_strong: "bg-red-200",
    optimal: "bg-green-200",
    warning: "bg-yellow-200",
    sub_optimal: "bg-orange-200",
    critical: "bg-red-300",
    no_data: "bg-gray-100",
  };
  return colors[status as keyof typeof colors] || colors.no_data;
};

const getRslTextColor = (value: number | null): string => {
  const status = getRslStatus(value);
  const colors = {
    too_strong: "text-red-800",
    optimal: "text-green-800",
    warning: "text-yellow-800",
    sub_optimal: "text-orange-800",
    critical: "text-red-900",
    no_data: "text-gray-400",
  };
  return colors[status as keyof typeof colors] || colors.no_data;
};

const getRslStatusLabel = (value: number | null): string => {
  const status = getRslStatus(value);
  const labels = {
    too_strong: "Terlalu Kuat",
    optimal: "Optimal",
    warning: "Warning",
    sub_optimal: "Sub-optimal",
    critical: "Critical",
    no_data: "No Data",
  };
  return labels[status as keyof typeof labels] || labels.no_data;
};

interface PivotData {
  linkName: string;
  tower: string;
  monthlyValues: Record<string, number | null>;
  expectedRslMin: number;
  expectedRslMax: number;
  notes?: Record<string, string>;
}

const NecRslPivotTable: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [pivotData, setPivotData] = useState<PivotData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTower, setSelectedTower] = useState<string>("all");
  const [towers, setTowers] = useState<string[]>([]);

  const [hoveredCell, setHoveredCell] = useState<{
    rowIdx: number;
    colIdx: number;
    linkName: string;
    month: string;
    value: number | null;
    note?: string;
  } | null>(null);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<{
    linkName: string;
    month: string;
    currentNote?: string;
  } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [activeMobileFilter, setActiveMobileFilter] = useState<string | null>(null);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const formatMonthKey = (month: string): string => {
    return `${month}-${selectedYear.toString().slice(-2)}`;
  };

  const fetchAvailableTowers = async () => {
    try {
      const allData = await necSignalApi.getYearlyPivot(selectedYear);
      const uniqueTowers = Array.from(
        new Set(allData.map((d) => d.tower))
      ).sort();
      setTowers(uniqueTowers);
    } catch (error) {
      console.error("Error fetching towers:", error);
    }
  };

  const fetchYearlyData = async () => {
    setIsLoading(true);
    try {
      const response = await necSignalApi.getYearlyPivot(
        selectedYear,
        selectedTower === "all" ? undefined : selectedTower
      );

      const formattedData: PivotData[] = response.map((item) => ({
        linkName: item.linkName,
        tower: item.tower,
        monthlyValues: item.monthlyValues,
        expectedRslMin: item.expectedRslMin || -60,
        expectedRslMax: item.expectedRslMax || -40,
        notes: item.notes || {},
      }));

      setPivotData(formattedData);
    } catch (error) {
      console.error("Error fetching pivot data:", error);
      setPivotData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableTowers();
  }, [selectedYear]);

  useEffect(() => {
    fetchYearlyData();
  }, [selectedYear, selectedTower]);

  const generatePieChartData = () => {
    if (!pivotData || pivotData.length === 0) return [];

    const statusCount = {
      too_strong: 0,
      optimal: 0,
      warning: 0,
      sub_optimal: 0,
      critical: 0,
    };

    pivotData.forEach((link) => {
      Object.values(link.monthlyValues).forEach((value) => {
        if (value !== null && value !== undefined) {
          const status = getRslStatus(value);
          if (status !== "no_data") {
            statusCount[status as keyof typeof statusCount]++;
          }
        }
      });
    });

    const pieData = [
      { name: "Too Strong", value: statusCount.too_strong, fill: "#ef4444" },
      { name: "Optimal", value: statusCount.optimal, fill: "#10b981" },
      { name: "Warning", value: statusCount.warning, fill: "#f59e0b" },
      { name: "Sub-optimal", value: statusCount.sub_optimal, fill: "#fb923c" },
      { name: "Critical", value: statusCount.critical, fill: "#dc2626" },
    ].filter((item) => item.value > 0);

    return pieData;
  };

  const prepareChartData = () => {
    const chartData: Array<{
      month: string;
      [key: string]: string | number | null | undefined;
    }> = months.map((month) => ({ month }));
    pivotData.forEach((link) => {
      months.forEach((month) => {
        const key = formatMonthKey(month);
        const value = link.monthlyValues[key];
        chartData[months.indexOf(month)][link.linkName] =
          value !== null && value !== undefined ? value : null;
      });
    });
    return chartData;
  };

  const openNoteModal = (
    linkName: string,
    month: string,
    currentNote?: string
  ) => {
    setEditingNote({ linkName, month, currentNote });
    setNoteText(currentNote || "");
    setIsNoteModalOpen(true);
  };

  const saveNote = () => {
    if (!editingNote) return;

    setPivotData((prev) =>
      prev.map((link) => {
        if (link.linkName === editingNote.linkName) {
          return {
            ...link,
            notes: { ...link.notes, [editingNote.month]: noteText },
          };
        }
        return link;
      })
    );

    setIsNoteModalOpen(false);
    setEditingNote(null);
    setNoteText("");
  };

  const chartData = prepareChartData();
  const COLORS = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#06b6d4",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#6366f1",
    "#84cc16",
    "#a855f7",
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>RSL History - Pivot Table ({selectedYear})</CardTitle>
            
            {/* Desktop Filters */}
            <div className="hidden md:flex flex-wrap gap-2">
              <Select value={selectedTower} onValueChange={setSelectedTower}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter Tower" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Towers</SelectItem>
                  {towers.map((tower) => (
                    <SelectItem key={tower} value={tower}>
                      {tower}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchYearlyData}
                disabled={isLoading}
              >
                <span className={`mr-2 ${isLoading ? "animate-spin" : ""}`}>
                  ↻
                </span>
                Refresh
              </Button>
            </div>

            {/* Mobile Filters (Pill buttons triggering Bottom Sheet) */}
            <div className="flex md:hidden gap-2 overflow-x-auto no-scrollbar pb-0.5 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveMobileFilter("towers")}
                className={cn(
                    "rounded-full whitespace-nowrap flex items-center gap-2 h-9 px-4 text-sm font-medium transition-colors border-gray-200 shrink-0",
                    selectedTower !== "all" ? "bg-blue-50 text-blue-700 border-blue-200 font-bold" : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
                )}
              >
                <span className="max-w-[120px] truncate">Tower: {selectedTower === "all" ? "Semua" : selectedTower}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveMobileFilter("year")}
                className={cn(
                    "rounded-full whitespace-nowrap flex items-center gap-2 h-9 px-4 text-sm font-medium transition-colors border-blue-200 bg-blue-50 text-blue-700 font-bold shrink-0"
                )}
              >
                <span>Tahun: {selectedYear}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchYearlyData}
                disabled={isLoading}
                className="rounded-full shadow-sm bg-white border-gray-200 px-3 w-9 shrink-0"
              >
                <span className={`${isLoading ? "animate-spin" : ""}`}>↻</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Charts - Improved Layout */}
      <div className="space-y-6">
        {/* Line Chart - Full Width */}
        <div className="bg-white p-5 rounded-[1.25rem] shadow-[0px_12px_32px_rgba(25,28,29,0.04)] border border-gray-100/60 transition-shadow hover:shadow-[0px_16px_40px_rgba(25,28,29,0.06)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-gray-900 font-bold text-sm tracking-tight">Grafik Rata-rata RSL per Link</h2>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">RSL History - Year {selectedYear} • {pivotData.length} links</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="text-gray-400 w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>

          <div className="space-y-4">
            {/* Mobile scroll hint */}
            <div className="md:hidden flex items-center gap-1.5 text-[10px] text-blue-600 font-medium bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Menampilkan {pivotData.length} link · Scroll legend di bawah untuk melihat semua link.</span>
            </div>
            {/* Chart Container */}
            <div className="overflow-x-auto no-scrollbar">
              <div className="min-w-[600px] h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 60, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="month"
                      angle={0}
                      textAnchor="middle"
                      height={30}
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      interval={0}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[-70, -30]}
                      label={{
                        value: "RSL (dBm)",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 10, fill: "#9ca3af" },
                      }}
                      tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white/95 p-3 border border-gray-200 shadow-lg rounded-xl max-h-[250px] md:max-h-[350px] overflow-y-auto no-scrollbar outline-none pointer-events-auto">
                              <p className="font-bold text-gray-800 mb-2 pb-2 border-b border-gray-100 sticky top-0 bg-white/95">{label}</p>
                              <div className="space-y-1.5">
                                {payload.map((entry: any, index: number) => {
                                  if (entry.value === null || entry.value === undefined) return null;
                                  return (
                                    <div key={index} className="flex justify-between items-center gap-4 text-xs font-medium">
                                      <span style={{ color: entry.color }} className="truncate max-w-[120px] md:max-w-[200px]" title={entry.name}>
                                        {entry.name}
                                      </span>
                                      <span className="font-bold text-gray-700">
                                        {entry.value} dBm
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                      wrapperStyle={{ zIndex: 110, pointerEvents: 'auto' }}
                    />

                    {/* Threshold Error Zones & Lines (Optional but modern clean view) */}
                    <ReferenceLine y={-45} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} strokeWidth={1} label={{ value: "Optimal (-45)", position: "right", fill: "#10b981", fontSize: 9 }} />
                    <ReferenceLine y={-55} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.5} strokeWidth={1} label={{ value: "Warning (-55)", position: "right", fill: "#f59e0b", fontSize: 9 }} />
                    <ReferenceLine y={-60} stroke="#fb923c" strokeDasharray="3 3" strokeOpacity={0.5} strokeWidth={1} label={{ value: "Sub-opt (-60)", position: "right", fill: "#fb923c", fontSize: 9 }} />
                    <ReferenceLine y={-65} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} strokeWidth={1} label={{ value: "Critical (-65)", position: "right", fill: "#ef4444", fontSize: 9 }} />

                    {/* Lines for all links */}
                    {pivotData.map((link, idx) => (
                      <Line
                        key={link.linkName}
                        type="monotone"
                        dataKey={link.linkName}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 0 }} /* Hide dots initially like the design, show on active */
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        connectNulls={false}
                        name={link.linkName}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Legend - Custom Grid to fit Mobile */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2.5 max-h-40 overflow-y-auto no-scrollbar">
              {pivotData.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-0.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  ></span>
                  <span 
                    className="text-[9px] font-semibold text-gray-500 truncate" 
                    title={link.linkName}
                  >
                    {link.linkName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pie Chart - Full Width */}
        <div className="bg-white p-5 rounded-[1.25rem] shadow-[0px_12px_32px_rgba(25,28,29,0.04)] border border-gray-100/60 transition-shadow hover:shadow-[0px_16px_40px_rgba(25,28,29,0.06)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-gray-900 font-bold text-sm tracking-tight">Distribusi Status Link</h2>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">Proporsi kondisi sinyal pada jaringan NEC</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="text-gray-400 w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Chart */}
            <div className="flex justify-center -ml-4">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={generatePieChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 }) => {
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                      const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

                      return percent > 0 ? (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="11"
                          fontWeight="bold"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      ) : null;
                    }}
                    outerRadius="95%"
                    fill="#8884d8"
                    dataKey="value"
                    stroke="none"
                  >
                    {generatePieChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} data points`, "Jumlah"]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.98)",
                      border: "1px solid #f3f4f6",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
                      fontSize: "12px",
                      fontWeight: 600
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Statistics */}
            <div className="space-y-2.5">
              {generatePieChartData().map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 bg-gray-50/80 hover:bg-gray-50 rounded-xl border border-gray-100/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span className="font-semibold text-xs text-gray-700">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{entry.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pivot Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <span className="ml-3">Loading RSL data...</span>
            </div>
          ) : pivotData.length > 0 ? (
            <>
              {/* === MOBILE PIVOT VIEW === */}
              <div className="md:hidden space-y-3 mb-6">
                {pivotData.map((row, rowIdx) => {
                  // Find the latest valid monthly value to display on the default collapsed card
                  let latestValue: { month: string, value: number, note?: string } | null = null;
                  for (let i = months.length - 1; i >= 0; i--) {
                    const key = formatMonthKey(months[i]);
                    const val = row.monthlyValues[key];
                    if (val !== null && val !== undefined) {
                      latestValue = { month: months[i], value: val, note: row.notes?.[key] };
                      break;
                    }
                  }

                  const status = latestValue ? getRslStatus(latestValue.value) : "no_data";
                  const statusColors = {
                    too_strong: "bg-blue-100 text-blue-800",
                    optimal: "bg-green-100 text-green-800",
                    warning: "bg-orange-100 text-orange-800",
                    sub_optimal: "bg-yellow-100 text-yellow-800",
                    critical: "bg-red-100 text-red-800",
                    no_data: "bg-gray-100 text-gray-500",
                  };
                  const statusLabels = {
                    too_strong: "Too Strong",
                    optimal: "Optimal",
                    warning: "Warning",
                    sub_optimal: "Sub-optimal",
                    critical: "Critical",
                    no_data: "No Data",
                  };

                  const isExpanded = hoveredCell?.rowIdx === rowIdx && hoveredCell?.linkName === "MOBILE_EXPAND";

                  return (
                    <div 
                      key={rowIdx} 
                      className={`bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-all group ${!isExpanded ? 'hover:shadow-md cursor-pointer active:scale-[0.98]' : 'shadow-md ring-1 ring-blue-500/20'}`}
                      onClick={() => {
                        if (isExpanded) setHoveredCell(null);
                        else setHoveredCell({ rowIdx, colIdx: -1, linkName: "MOBILE_EXPAND", month: "", value: null });
                      }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-gray-400">
                            TOWER: {row.tower}
                          </span>
                          <h3 className="text-gray-900 font-bold text-[15px] group-hover:text-blue-600 transition-colors">
                            {row.linkName}
                          </h3>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${statusColors[status as keyof typeof statusColors] || statusColors.no_data}`}>
                          {statusLabels[status as keyof typeof statusLabels] || "Unknown"}
                        </span>
                      </div>

                      {/* Summary Section (Always visible) */}
                      {!isExpanded && latestValue && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                              <span className="text-lg">📶</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter block mb-0.5">LATEST RSL</span>
                              <div className="flex items-baseline gap-0.5">
                                <span className={`text-lg font-extrabold ${getRslTextColor(latestValue.value)}`}>
                                  {latestValue.value.toFixed(1)}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400">dBm</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end justify-center">
                            <span className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">LATEST MONTH</span>
                            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                              {latestValue.month} {selectedYear}
                            </span>
                            {latestValue.note && <span className="text-[9px] text-amber-600 border border-amber-200 bg-amber-50 px-1 mt-1 rounded">📝 {latestValue.note.length > 8 ? latestValue.note.substring(0,8) + '...' : latestValue.note}</span>}
                          </div>
                        </div>
                      )}
                      
                      {!isExpanded && !latestValue && (
                        <div className="text-xs font-semibold text-gray-400 py-2">No RSL data available for {selectedYear}</div>
                      )}

                      {/* Expanded Section (Grid + Notes) */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <span>History {selectedYear}</span>
                            <span className="text-blue-500 cursor-pointer" onClick={() => setHoveredCell(null)}>Close X</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {months.map((month, monthIdx) => {
                              const key = formatMonthKey(month);
                              const value = row.monthlyValues[key];
                              const note = row.notes?.[key];
                              const isDataPresent = value !== null && value !== undefined;

                              return (
                                <div
                                  key={monthIdx}
                                  className={`relative flex flex-col items-center justify-center pt-2 pb-1.5 px-0.5 rounded-lg border ${
                                    isDataPresent
                                      ? `${getRslColor(value)} ${getRslTextColor(value)} shadow-sm border-transparent`
                                      : "bg-gray-50 border-gray-100"
                                  } cursor-pointer hover:opacity-80 transition-opacity active:scale-95`}
                                  onClick={() => {
                                    if (hasPermission('nec.update')) {
                                      openNoteModal(row.linkName, key, note);
                                    }
                                  }}
                                >
                                  {note && (
                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 text-[8px] rounded-full flex items-center justify-center shadow-sm z-10 border border-white">
                                      📝
                                    </div>
                                  )}
                                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">
                                    {month}
                                  </span>
                                  {isDataPresent ? (
                                    <span className="font-mono text-[11px] font-extrabold tracking-tighter">
                                      {value.toFixed(1)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300 text-[10px] font-bold">-</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Notes summary in expanded view */}
                          {months.some(m => row.notes?.[formatMonthKey(m)]) && (
                            <div className="mt-3 bg-amber-50/70 rounded-lg p-3 border border-amber-100/50">
                              <p className="text-[9px] font-bold text-amber-800 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                                <span>📝</span> Catatan
                              </p>
                              <div className="space-y-1">
                                {months.map(m => {
                                  const note = row.notes?.[formatMonthKey(m)];
                                  if (note) return (
                                    <div key={m} className="flex gap-2 text-[10px] items-start bg-white p-1.5 rounded border border-amber-100/30">
                                      <span className="font-extrabold text-amber-600 shrink-0">{m}</span>
                                      <span className="text-gray-700 font-medium">{note}</span>
                                    </div>
                                  );
                                  return null;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* === DESKTOP PIVOT VIEW === */}
              <div className="hidden md:block overflow-x-auto rounded-md border">
                <table className="w-full border-collapse text-sm bg-white">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="border px-4 py-3 sticky left-0 bg-blue-600 z-10 min-w-[60px]">
                        No
                      </th>
                      <th className="border px-4 py-3 sticky left-[60px] bg-blue-600 z-10 min-w-[220px]">
                        Link
                      </th>
                      <th colSpan={12} className="border px-4 py-3">
                        RSL - dBm
                      </th>
                    </tr>
                    <tr className="bg-blue-500 text-white">
                      <th className="border px-4 py-2"></th>
                      <th className="border px-4 py-2"></th>
                      {months.map((month, idx) => (
                        <th
                          key={idx}
                          className="border px-3 py-2 min-w-[100px]"
                        >
                          {formatMonthKey(month)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pivotData.map((row, rowIdx) => (
                      <tr key={rowIdx} className="group hover:bg-gray-50">
                        <td className="border px-4 py-3 text-center sticky left-0 bg-white z-10 group-hover:bg-gray-50">
                          {rowIdx + 1}
                        </td>
                        <td className="border px-4 py-3 sticky left-[60px] bg-white z-10 group-hover:bg-gray-50">
                          <div className="font-semibold">{row.linkName}</div>
                          <div className="text-xs text-gray-500">
                            Tower: {row.tower}
                          </div>
                        </td>
                        {months.map((month, monthIdx) => {
                          const key = formatMonthKey(month);
                          const value = row.monthlyValues[key];
                          const note = row.notes?.[key];
                          const isDataPresent =
                            value !== null && value !== undefined;
                          return (
                            <td
                              key={monthIdx}
                              onMouseEnter={() =>
                                setHoveredCell({
                                  rowIdx,
                                  colIdx: monthIdx,
                                  linkName: row.linkName,
                                  month: month,
                                  value: value,
                                  note: note,
                                })
                              }
                              onMouseLeave={() => setHoveredCell(null)}
                              className={`border px-2 py-2 text-center font-mono relative cursor-pointer ${isDataPresent
                                ? `${getRslColor(value)} ${getRslTextColor(
                                  value
                                )}`
                                : "bg-gray-50"
                                } ${hoveredCell?.rowIdx === rowIdx &&
                                  hoveredCell?.colIdx === monthIdx
                                  ? "ring-2 ring-blue-500"
                                  : ""
                                }`}
                            >
                              {isDataPresent ? (
                                <>
                                  <div className="font-bold">
                                    {value.toFixed(1)}
                                    {note && (
                                      <span className="ml-1 text-blue-600 text-xs">
                                        📝
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs opacity-75">dBm</div>
                                </>
                              ) : note ? (
                                <div className="text-xs text-gray-600 italic px-1">
                                  {note.length > 20
                                    ? `${note.substring(0, 20)}...`
                                    : note}
                                </div>
                              ) : (
                                <div className="text-gray-400 text-sm">-</div>
                              )}

                              {hoveredCell?.rowIdx === rowIdx &&
                                hoveredCell?.colIdx === monthIdx && (
                                  <div
                                    className={`absolute left-1/2 transform -translate-x-1/2 ${rowIdx < 3
                                      ? "top-full mt-2"
                                      : "bottom-full mb-2"
                                      } w-64 p-3 bg-gray-900 text-white text-xs rounded shadow-lg z-50`}
                                  >
                                    <div className="relative">
                                      <div
                                        className={`absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-transparent ${rowIdx < 3
                                          ? "-top-2 border-b-8 border-b-gray-900"
                                          : "-bottom-2 border-t-8 border-t-gray-900"
                                          }`}
                                      />
                                      <div className="mb-2">
                                        <h4 className="font-bold">
                                          {row.linkName}
                                        </h4>
                                        <p className="text-gray-300 text-xs">
                                          {month} {selectedYear}
                                        </p>
                                      </div>
                                      {isDataPresent && (
                                        <div className="mb-3">
                                          <p className="text-lg font-bold">
                                            {value?.toFixed(1)} dBm
                                          </p>
                                          <span
                                            className={`px-2 py-1 rounded text-xs text-black font-medium ${getRslColor(
                                              value
                                            ).replace("bg-", "bg-")}`}
                                          >
                                            {getRslStatusLabel(value)}
                                          </span>
                                        </div>
                                      )}
                                      {note && (
                                        <div className="mb-3 p-2 bg-yellow-900/30 rounded">
                                          <p className="font-semibold">
                                            📝 Catatan:
                                          </p>
                                          <p className="text-sm">{note}</p>
                                        </div>
                                      )}
                                      {hasPermission('nec.update') && (
                                        <button
                                          onClick={() =>
                                            openNoteModal(row.linkName, key, note)
                                          }
                                          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                                        >
                                          {note ? "✏️ Edit Note" : "📝 Add Note"}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold mb-2">Status Legend</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-4 bg-red-200 border rounded"></div>
                    <span>Too Strong (-30 to -45)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-4 bg-green-200 border rounded"></div>
                    <span>Optimal (-45 to -55)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-4 bg-yellow-200 border rounded"></div>
                    <span>Warning (-55 to -60)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-4 bg-orange-200 border rounded"></div>
                    <span>Sub-optimal (-60 to -65)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-4 bg-red-300 border rounded"></div>
                    <span>Critical (&lt; -65)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-4 bg-gray-100 border rounded"></div>
                    <span>No Data</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Alert>
              <AlertDescription>
                No RSL data found for {selectedYear}.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Note Modal */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl border border-gray-100 shadow-2xl bg-white w-[90%] max-w-[400px]">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-center font-bold text-lg text-gray-900 tracking-tight">
              {editingNote?.currentNote ? "Edit Note" : "Add Note"}
            </DialogTitle>
          </DialogHeader>

          {editingNote && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold text-gray-700 mb-0.5 block">Link</Label>
                <p className="text-sm font-semibold text-gray-900">{editingNote.linkName}</p>
              </div>
              
              <div>
                <Label className="text-xs font-bold text-gray-700 mb-0.5 block">Month</Label>
                <p className="text-sm font-semibold text-gray-900">{editingNote.month}</p>
              </div>

              <div className="pt-2">
                <Label htmlFor="note" className="text-xs font-bold text-gray-900 block mb-2">
                  Note/Keterangan
                </Label>
                <textarea
                  id="note"
                  className="w-full p-3.5 text-sm border-2 border-gray-800 rounded-lg focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none resize-none placeholder:text-gray-400 font-medium"
                  placeholder="Contoh: Maintenance, Dismantled, Obstacle, dll"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-6">
            <button 
              onClick={saveNote}
              className="w-full py-3 bg-[#111] hover:bg-black text-white text-sm font-semibold rounded-lg transition-colors active:scale-[0.98] shadow-sm"
            >
              Save Note
            </button>
            <button 
              onClick={() => setIsNoteModalOpen(false)}
              className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg border border-gray-200 transition-colors active:scale-[0.98] shadow-sm"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MOBILE FILTER MODAL (Bottom Sheet) */}
      <Dialog open={!!activeMobileFilter} onOpenChange={(open) => { if (!open) setActiveMobileFilter(null); }}>
        <DialogContent className="fixed bottom-0 top-auto translate-y-0 sm:bottom-0 sm:top-auto sm:translate-y-0 max-w-full sm:max-w-[500px] rounded-t-2xl rounded-b-none p-0 overflow-hidden border-x-0 border-b-0 animate-in slide-in-from-bottom duration-300">
          <DialogHeader className="p-4 border-b bg-gray-50/80">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              {activeMobileFilter === "towers" ? "Pilih Tower" : "Pilih Tahun"}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-4 pb-12">
            <div className="grid grid-cols-1 gap-2">
              {activeMobileFilter === "towers" && (
                <>
                  <button onClick={() => { setSelectedTower("all"); setActiveMobileFilter(null); }}
                    className={cn("w-full text-left p-4 rounded-xl border transition-all", selectedTower === "all" ? "bg-blue-50 border-blue-200 text-blue-700 font-bold" : "bg-white border-gray-100 text-gray-700")}>
                    Semua Tower
                  </button>
                  {towers.map(t => (
                    <button key={t} onClick={() => { setSelectedTower(t); setActiveMobileFilter(null); }}
                      className={cn("w-full text-left p-4 rounded-xl border transition-all", selectedTower === t ? "bg-blue-50 border-blue-200 text-blue-700 font-bold" : "bg-white border-gray-100 text-gray-700")}>
                      {t}
                    </button>
                  ))}
                </>
              )}
              {activeMobileFilter === "year" && (
                [2023, 2024, 2025, 2026].map(y => (
                  <button key={y} onClick={() => { setSelectedYear(y); setActiveMobileFilter(null); }}
                    className={cn("w-full text-left p-4 rounded-xl border transition-all", selectedYear === y ? "bg-blue-50 border-blue-200 text-blue-700 font-bold" : "bg-white border-gray-100 text-gray-700")}>
                    Tahun {y}
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default NecRslPivotTable;
