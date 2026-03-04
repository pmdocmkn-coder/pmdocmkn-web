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
            <div className="flex flex-wrap gap-2">
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
          </div>
        </CardHeader>
      </Card>

      {/* Charts - Improved Layout */}
      <div className="space-y-6">
        {/* Line Chart - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-600 rounded"></div>
              Grafik Garis Rata-rata RSL per Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold mb-1">
                      Menampilkan {pivotData.length} link
                    </p>
                    <p className="text-xs">
                      Hover pada garis untuk melihat detail nilai. Scroll legend
                      di bawah untuk melihat semua link.
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-gradient-to-br from-gray-50 to-white border rounded-lg p-2 md:p-4 overflow-x-auto no-scrollbar">
                <div className="min-w-[700px] h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 60, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="month"
                        angle={0}
                        textAnchor="middle"
                        height={30}
                        tick={{ fontSize: 10, fill: "#6b7280" }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[-70, -30]}
                        label={{
                          value: "RSL (dBm)",
                          angle: -90,
                          position: "insideLeft",
                          style: { fontSize: 12, fill: "#6b7280" },
                        }}
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                      />
                      <Tooltip
                        formatter={(value) => {
                          if (value === null || value === undefined)
                            return "No Data";
                          return `${value} dBm`;
                        }}
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.96)",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />

                      {/* Reference Lines */}
                      <ReferenceLine
                        y={-45}
                        stroke="#10b981"
                        strokeDasharray="3 3"
                        strokeWidth={1.5}
                        label={{
                          value: "Optimal (-45)",
                          position: "right",
                          fill: "#10b981",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      />
                      <ReferenceLine
                        y={-55}
                        stroke="#f59e0b"
                        strokeDasharray="3 3"
                        strokeWidth={1.5}
                        label={{
                          value: "Warning (-55)",
                          position: "right",
                          fill: "#f59e0b",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      />
                      <ReferenceLine
                        y={-60}
                        stroke="#fb923c"
                        strokeDasharray="3 3"
                        strokeWidth={1.5}
                        label={{
                          value: "Sub-opt (-60)",
                          position: "right",
                          fill: "#fb923c",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      />
                      <ReferenceLine
                        y={-65}
                        stroke="#dc2626"
                        strokeDasharray="3 3"
                        strokeWidth={1.5}
                        label={{
                          value: "Critical (-65)",
                          position: "right",
                          fill: "#dc2626",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      />

                      {/* Lines for all links */}
                      {pivotData.map((link, idx) => (
                        <Line
                          key={link.linkName}
                          type="monotone"
                          dataKey={link.linkName}
                          stroke={COLORS[idx % COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 3, strokeWidth: 2 }}
                          activeDot={{ r: 5 }}
                          connectNulls={false}
                          name={link.linkName}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Scrollable Legend */}
              <div className="border rounded-lg bg-white">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Legend - Daftar Link
                  </h4>
                </div>
                <div className="max-h-40 overflow-y-auto p-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {pivotData.map((link, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs"
                      >
                        <div
                          className="w-8 h-0.5 flex-shrink-0"
                          style={{
                            backgroundColor: COLORS[idx % COLORS.length],
                          }}
                        />
                        <span className="truncate" title={link.linkName}>
                          {link.linkName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-1 h-6 bg-green-600 rounded"></div>
              Distribusi Status Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Chart */}
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={generatePieChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
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
                            fontSize="12"
                            fontWeight="bold"
                          >
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        ) : null;
                      }}
                      outerRadius="95%"
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {generatePieChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} data points`, "Jumlah"]}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.96)",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Statistics */}
              <div className="space-y-3">
                {generatePieChartData().map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: entry.fill }}
                      />
                      <span className="font-medium text-sm">{entry.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{entry.value}</p>
                      <p className="text-xs text-gray-500">data points</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
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
              <div className="md:hidden space-y-4 mb-4">
                {pivotData.map((row, rowIdx) => (
                  <div key={rowIdx} className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-blue-50 overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-white text-sm">{row.linkName}</h4>
                          <p className="text-[10px] text-blue-100 font-medium tracking-wide uppercase mt-0.5">TOWER: {row.tower}</p>
                        </div>
                        <span className="text-[10px] font-black text-blue-700 bg-white px-2 py-0.5 rounded-full shadow-sm">
                          #{rowIdx + 1}
                        </span>
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="grid grid-cols-4 gap-2">
                        {months.map((month, monthIdx) => {
                          const key = formatMonthKey(month);
                          const value = row.monthlyValues[key];
                          const note = row.notes?.[key];
                          const isDataPresent = value !== null && value !== undefined;

                          return (
                            <div
                              key={monthIdx}
                              className={`relative flex flex-col items-center justify-center pt-2 pb-1.5 px-0.5 rounded-lg border ${isDataPresent
                                ? `${getRslColor(value)} ${getRslTextColor(value)} shadow-sm`
                                : "bg-gray-50 border-gray-100"
                                } cursor-pointer hover:opacity-80 transition-opacity active:scale-95`}
                              onClick={() => {
                                if (hasPermission('nec.update')) {
                                  openNoteModal(row.linkName, key, note);
                                }
                              }}
                            >
                              {note && (
                                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 text-[8px] rounded-full flex items-center justify-center shadow-sm z-10">
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
                                <span className="text-gray-300 text-xs font-bold">-</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {months.some(m => row.notes?.[formatMonthKey(m)]) && (
                      <div className="px-3 pb-3">
                        <div className="bg-amber-50/70 rounded-lg p-3 border border-amber-100/50">
                          <p className="text-[10px] font-bold text-amber-800 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                            <span>📝</span> Catatan Bulanan
                          </p>
                          <div className="space-y-1.5">
                            {months.map(m => {
                              const note = row.notes?.[formatMonthKey(m)];
                              if (note) return (
                                <div key={m} className="flex gap-2 text-[11px] items-start bg-white p-2 rounded-md border border-amber-100/30">
                                  <span className="font-extrabold text-amber-600 w-8 shrink-0">{m}</span>
                                  <span className="text-slate-700 leading-tight font-medium">{note}</span>
                                </div>
                              );
                              return null;
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNote?.currentNote ? "Edit" : "Add"} Note
            </DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="space-y-4">
              <div>
                <Label>Link</Label>
                <p className="text-sm font-semibold">{editingNote.linkName}</p>
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
                  placeholder="Contoh: Maintenance, Dismantled, Obstacle, dll"
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
export default NecRslPivotTable;
