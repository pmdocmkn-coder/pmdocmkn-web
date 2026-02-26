import React, { useState, useEffect, useRef } from "react";
import { hasPermission } from "../../utils/permissionUtils";
import NecRslPivotTable from "./NecRslPivotTable";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Edit,
  Trash,
  Download,
  Upload,
  Search,
  AlertTriangle,
  Settings,
  ChevronsLeft, // ⏮ Awal
  ChevronLeft, // ◀ Sebelumnya
  ChevronRight, // ▶ Berikutnya
  ChevronsRight, // ⏭ Akhir
  ChevronDown,
  Check,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";
import { necSignalApi } from "../../services/necSignalService";
import {
  NecRslHistoryItemDto,
  NecMonthlyHistoryResponseDto,
  NecYearlySummaryDto,
  NecSignalImportResultDto,
} from "../../types/necSignal";

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
  if (value > RSL_THRESHOLDS.OPTIMAL_MAX) return "too_strong";
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

const getAvailableYears = (histories: NecRslHistoryItemDto[]) => {
  if (histories.length === 0) return [new Date().getFullYear()];
  const years = [
    ...new Set(
      histories.map((h: NecRslHistoryItemDto) => new Date(h.date).getFullYear())
    ),
  ].sort((a: number, b: number) => b - a);
  return years;
};

const getRslTextColor = (value: number | null | undefined): string => {
  const status = getRslStatus(value ?? null);
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

const getRslStatusLabel = (value: number | null | undefined): string => {
  const status = getRslStatus(value ?? null);
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

const getOperationalStatusDisplay = (
  status: number | string | null | undefined
) => {
  const map: Record<string, { label: string; color: string }> = {
    active: { label: "Active", color: "bg-green-100 text-green-800" },
    0: { label: "Active", color: "bg-green-100 text-green-800" },
    dismantled: { label: "Dismantled", color: "bg-red-100 text-red-800" },
    1: { label: "Dismantled", color: "bg-red-100 text-red-800" },
    removed: { label: "Removed", color: "bg-gray-100 text-gray-800" },
    2: { label: "Removed", color: "bg-gray-100 text-gray-800" },
    obstacle: { label: "Obstacle", color: "bg-yellow-100 text-yellow-800" },
    3: { label: "Obstacle", color: "bg-yellow-100 text-yellow-800" },
  };

  let key: string;
  if (status === null || status === undefined) {
    key = "active";
  } else if (typeof status === "number") {
    key = status.toString();
  } else if (typeof status === "string") {
    key = status.toLowerCase().trim();
  } else {
    key = "active";
  }

  const item = map[key] || {
    label: "Unknown",
    color: "bg-blue-100 text-blue-800",
  };

  return {
    label: item.label,
    className: `px-2 py-1 rounded-full text-xs font-medium ${item.color}`,
  };
};

const NecHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("history");
  const [histories, setHistories] = useState<NecRslHistoryItemDto[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLink, setSelectedLink] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentHistory, setCurrentHistory] =
    useState<NecRslHistoryItemDto | null>(null);
  const [formData, setFormData] = useState({
    necLinkId: 0,
    date: "",
    rslNearEnd: 0,
    rslFarEnd: 0,
    notes: "",
    status: "active",
  });
  const [isSaving, setIsSaving] = useState(false);

  const [importResult, setImportResult] =
    useState<NecSignalImportResultDto | null>(null);
  const [monthlyData, setMonthlyData] =
    useState<NecMonthlyHistoryResponseDto | null>(null);
  const [yearlyData, setYearlyData] = useState<NecYearlySummaryDto | null>(
    null
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [towers, setTowers] = useState<{ id: number; name: string }[]>([]);
  const [links, setLinks] = useState<
    {
      id: number;
      name: string;
      nearEndTower: string;
      farEndTower: string;
    }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openLinkBox, setOpenLinkBox] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const towers = await necSignalApi.getTowers();
        const query = {
          page: 1,
          pageSize: 15,
          search: "",
          necLinkId: undefined,
        };
        const histories = await necSignalApi.getHistories(query);
        // Set state success
      } catch (error) {
        console.error("NEC Error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Gagal memuat data. Coba lagi.";
        toast({
          title: "Error",
          description: errorMessage.includes("Network Error")
            ? "Koneksi tidak stabil. Coba refresh atau ganti jaringan."
            : "Gagal memuat data. Coba lagi.",
          variant: "destructive",
        });
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([fetchHistories(), fetchTowersAndLinks()]);
      } catch (error) {
        console.error("Failed to load initial data:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data awal. Silakan refresh halaman.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const fetchHistories = async (page = 1, search = "", linkId?: number) => {
    setIsLoading(true);
    try {
      const query = {
        page,
        pageSize: 15,
        search,
        necLinkId: linkId || undefined,
      };

      console.log("🔍 Fetching with query:", query);

      const result = await necSignalApi.getHistories(query);

      console.log("📊 Result received:", {
        dataCount: result.data.length,
        page: result.page,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
      });

      // ✅ PERBAIKAN: Set data langsung dari result
      setHistories(result.data || []);
      setTotalPages(result.totalPages || 1);
      setCurrentPage(result.page || page);
    } catch (error: any) {
      console.error("❌ Error fetching histories:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memuat data history.",
        variant: "destructive",
      });

      // Reset ke state kosong jika error
      setHistories([]);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTowersAndLinks = async () => {
    try {
      const towersResult = await necSignalApi.getTowers();
      const linksResult = await necSignalApi.getLinks();
      setTowers(towersResult?.map((t) => ({ id: t.id, name: t.name })) || []);
      setLinks(
        linksResult?.map((l) => ({
          id: l.id,
          name: l.linkName,
          nearEndTower: l.nearEndTower,
          farEndTower: l.farEndTower,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching towers/links:", error);
      setTowers([]);
      setLinks([]);
    }
  };

  const fetchMonthlyData = async () => {
    if (!selectedYear || !selectedMonth) return;
    try {
      const result = await necSignalApi.getMonthly(selectedYear, selectedMonth);
      setMonthlyData(result);
    } catch (error) {
      console.error("Error fetching monthly data:", error);
      setMonthlyData(null);
    }
  };

  const fetchYearlyData = async () => {
    if (!selectedYear) return;
    try {
      const result = await necSignalApi.getYearly(selectedYear);
      setYearlyData(result);
    } catch (error) {
      console.error("Error fetching yearly data:", error);
      setYearlyData(null);
    }
  };

  useEffect(() => {
    if (activeTab === "monthly") {
      fetchMonthlyData();
    } else if (activeTab === "yearly") {
      fetchYearlyData();
    }
  }, [activeTab, selectedYear, selectedMonth]);

  useEffect(() => {
    console.log("📊 State updated:", {
      historiesCount: histories.length,
      currentPage,
      totalPages,
    });
  }, [histories, currentPage, totalPages]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "necLinkId" || name === "rslNearEnd" || name === "rslFarEnd"
          ? parseFloat(value)
          : value,
    }));
  };

  const openModal = (
    mode: "create" | "edit",
    history?: NecRslHistoryItemDto
  ) => {
    setModalMode(mode);
    if (mode === "edit" && history) {
      setCurrentHistory(history);
      let statusString = "active";
      if (history.status !== null && history.status !== undefined) {
        if (typeof history.status === "number") {
          const statusMap: Record<number, string> = {
            0: "active",
            1: "dismantled",
            2: "removed",
            3: "obstacle",
          };
          statusString = statusMap[history.status] || "active";
        } else if (typeof history.status === "string") {
          statusString = history.status.toLowerCase().trim();
        }
      }
      setFormData({
        necLinkId: history.necLinkId,
        date: format(new Date(history.date), "yyyy-MM-dd"),
        rslNearEnd: history.rslNearEnd || 0,
        rslFarEnd: history.rslFarEnd || 0,
        notes: history.notes || "",
        status: statusString,
      });
    } else {
      setCurrentHistory(null);
      setFormData({
        necLinkId: 0,
        date: "",
        rslNearEnd: 0,
        rslFarEnd: 0,
        notes: "",
        status: "active",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.status !== "active" && !formData.notes?.trim()) {
      toast({
        title: "Error",
        description: "Catatan wajib diisi untuk status non-active",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const payload = {
      necLinkId: formData.necLinkId,
      date: formData.date,
      rslNearEnd: formData.status === "active" ? formData.rslNearEnd : -100,
      rslFarEnd: formData.status === "active" ? formData.rslFarEnd : null,
      notes: formData.notes,
      status: formData.status,
    };

    try {
      if (modalMode === "create") {
        await necSignalApi.createHistory(payload);
        toast({
          title: "Berhasil",
          description: "Data history berhasil ditambahkan.",
        });
      } else {
        if (currentHistory) {
          await necSignalApi.updateHistory(currentHistory.id, payload);
          toast({
            title: "Berhasil",
            description: "Data history berhasil diperbarui.",
          });
        }
      }
      setIsModalOpen(false);
      fetchHistories(currentPage, searchTerm, selectedLink ?? undefined);
    } catch (error) {
      console.error("Error saving history:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data history.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      try {
        await necSignalApi.deleteHistory(id);
        toast({
          title: "Berhasil",
          description: "Data history berhasil dihapus.",
        });
        fetchHistories(currentPage, searchTerm, selectedLink ?? undefined);
      } catch (error) {
        console.error("Error deleting history:", error);
        toast({
          title: "Error",
          description: "Gagal menghapus data history.",
          variant: "destructive",
        });
      }
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "Error",
        description: "Silakan pilih file Excel terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }
    try {
      const result = await necSignalApi.importPivotExcel({
        excelFile: importFile,
      });
      setImportResult(result);
      toast({
        title: "Impor Selesai",
        description: result.message,
      });
      setIsImportModalOpen(false);
      setImportFile(null);
      fetchHistories();
    } catch (error: any) {
      console.error("Error importing file:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        "Gagal mengimpor file Excel.";
      toast({
        title: "Error Import",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      await necSignalApi.exportYearlyExcel(selectedYear);
      toast({
        title: "Ekspor Berhasil",
        description: `Laporan tahun ${selectedYear} berhasil diunduh.`,
      });
    } catch (error) {
      console.error("Error exporting file:", error);
      toast({
        title: "Error",
        description: "Gagal mengekspor laporan.",
        variant: "destructive",
      });
    }
  };

  const generateMonthlyBarChartData = () => {
    if (!monthlyData || !monthlyData.data) return [];
    const chartData: Array<{
      linkName: string;
      avgRsl: number;
      tower: string;
    }> = [];
    monthlyData.data.forEach((tower) => {
      if (tower.links && Array.isArray(tower.links)) {
        tower.links.forEach((link) => {
          chartData.push({
            linkName: link.linkName,
            avgRsl: link.avgRsl,
            tower: tower.towerName,
          });
        });
      }
    });
    return chartData;
  };

  const generatePieChartData = () => {
    if (!monthlyData || !monthlyData.data) return [];
    const statusCount = {
      too_strong: 0,
      optimal: 0,
      warning: 0,
      sub_optimal: 0,
      critical: 0,
    };
    monthlyData.data.forEach((tower) => {
      if (tower.links && Array.isArray(tower.links)) {
        tower.links.forEach((link) => {
          const status = getRslStatus(link.avgRsl);
          statusCount[status as keyof typeof statusCount]++;
        });
      }
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

  const generateYearlyChartData = () => {
    if (!yearlyData || !yearlyData.towers) return [];
    const monthlyAverages: Record<string, { sum: number; count: number }> = {};
    yearlyData.towers.forEach((tower) => {
      Object.entries(tower.links).forEach(([linkName, linkData]) => {
        Object.entries(linkData.monthlyAvg).forEach(([month, value]) => {
          if (!monthlyAverages[month]) {
            monthlyAverages[month] = { sum: 0, count: 0 };
          }
          monthlyAverages[month].sum += value;
          monthlyAverages[month].count++;
        });
      });
    });
    const chartData = Object.entries(monthlyAverages).map(([month, data]) => ({
      date: month,
      value: Math.round((data.sum / data.count) * 10) / 10,
    }));
    const monthOrder = [
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
    chartData.sort((a, b) => {
      const aMonth = a.date.split("-")[0];
      const bMonth = b.date.split("-")[0];
      return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth);
    });
    return chartData;
  };

  const isStatusActive = (
    status: number | string | null | undefined
  ): boolean => {
    if (!status || status === 0) return true;
    if (typeof status === "string" && status.toLowerCase() === "active")
      return true;
    return false;
  };

  const renderMonthlyChart = () => {
    if (!monthlyData)
      return <div className="text-center text-gray-500">Memuat data...</div>;

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">
          Performa Bulanan - {monthlyData.period}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Grafik Bar Rata-rata RSL</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  data={generateMonthlyBarChartData()}
                  margin={{ top: 20, right: 80, left: 20, bottom: 140 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="linkName"
                    angle={-45}
                    textAnchor="end"
                    height={140}
                    interval={0}
                    tick={{ fontSize: 9 }}
                  />
                  <YAxis
                    domain={[-70, -30]}
                    label={{
                      value: "RSL (dBm)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value} dBm`, "Average RSL"]}
                    labelFormatter={(label) => `Link: ${label}`}
                  />
                  <Legend wrapperStyle={{ paddingTop: "10px" }} />
                  <ReferenceLine
                    y={-45}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{
                      value: "Optimal (-45)",
                      position: "right",
                      fill: "#10b981",
                      fontSize: 10,
                      offset: 10,
                    }}
                  />
                  <ReferenceLine
                    y={-55}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    label={{
                      value: "Warning (-55)",
                      position: "right",
                      fill: "#f59e0b",
                      fontSize: 10,
                      offset: 10,
                    }}
                  />
                  <ReferenceLine
                    y={-60}
                    stroke="#fb923c"
                    strokeDasharray="3 3"
                    label={{
                      value: "Sub-opt (-60)",
                      position: "right",
                      fill: "#fb923c",
                      fontSize: 10,
                      offset: 10,
                    }}
                  />
                  <ReferenceLine
                    y={-65}
                    stroke="#dc2626"
                    strokeDasharray="3 3"
                    label={{
                      value: "Critical (-65)",
                      position: "right",
                      fill: "#dc2626",
                      fontSize: 10,
                      offset: 10,
                    }}
                  />
                  <Bar
                    dataKey="avgRsl"
                    fill="#3b82f6"
                    name="Average RSL"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribusi Status Link</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={generatePieChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      typeof percent === "number"
                        ? `${name}: ${(percent * 100).toFixed(0)}%`
                        : `${name}: 0%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {generatePieChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} links`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Detail Per Tower</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {monthlyData.data.map((tower, idx) => (
                  <div key={idx} className="mb-6 border-b pb-4">
                    <h4 className="font-semibold text-lg mb-2">
                      {tower.towerName}
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Link</TableHead>
                          <TableHead>Rata-rata RSL</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Keterangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tower.links.map((link, linkIdx) => (
                          <TableRow key={linkIdx}>
                            <TableCell>{link.linkName}</TableCell>
                            <TableCell>{link.avgRsl.toFixed(1)} dBm</TableCell>
                            <TableCell>
                              <span
                                className={
                                  getOperationalStatusDisplay(link.status)
                                    .className
                                }
                              >
                                {getOperationalStatusDisplay(link.status).label}
                              </span>
                            </TableCell>
                            <TableCell>{link.warningMessage || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderYearlyChart = () => {
    if (!yearlyData)
      return <div className="text-center text-gray-500">Memuat data...</div>;
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">
          Ringkasan Tahunan - {yearlyData.year}
        </h3>

        <Card>
          <CardHeader>
            <CardTitle>Grafik Area Rata-rata Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={generateYearlyChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[-70, -30]} />
                <Tooltip />
                <Legend />
                <ReferenceLine
                  y={-45}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  label="Optimal Max (-45)"
                />
                <ReferenceLine
                  y={-55}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label="Warning (-55)"
                />
                <ReferenceLine
                  y={-60}
                  stroke="#fb923c"
                  strokeDasharray="3 3"
                  label="Sub-optimal (-60)"
                />
                <ReferenceLine
                  y={-65}
                  stroke="#dc2626"
                  strokeDasharray="3 3"
                  label="Critical (-65)"
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistik Detail Per Link</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {yearlyData.towers.map((tower, towerIdx) =>
                  Object.entries(tower.links).map(
                    ([linkName, linkData], linkIdx) => (
                      <div
                        key={`${towerIdx}-${linkIdx}`}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h5 className="font-semibold text-sm">
                              {linkName}
                            </h5>
                            <p className="text-xs text-gray-500">
                              {tower.towerName}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">
                              Rata-rata Tahunan:
                            </span>
                            <span className="font-bold text-sm">
                              {linkData.yearlyAvg.toFixed(1)} dBm
                            </span>
                          </div>

                          {linkData.warnings.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <div className="flex items-start gap-1">
                                <AlertTriangle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-red-600 mb-1">
                                    Peringatan:
                                  </p>
                                  <ul className="text-xs text-red-600 space-y-1">
                                    {linkData.warnings.map((warning, wIdx) => (
                                      <li key={wIdx} className="leading-tight">
                                        • {warning}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="w-full p-4 md:p-6 pb-20">
      {/* Mobile Top App Bar */}
      <div className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-indigo-100 -mx-4 -mt-4 mb-4">
        <div className="flex items-center px-4 pt-4 pb-2 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-indigo-600 flex size-10 items-center justify-center rounded-full bg-indigo-50 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-gray-900 text-lg font-bold leading-tight tracking-tight">
                Jaringan NEC
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">History & monitoring</p>
            </div>
          </div>
        </div>
        {/* Action chips row */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => navigate("/nec-management")}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold whitespace-nowrap hover:bg-indigo-100 transition-colors shadow-sm"
          >
            <Settings className="w-3.5 h-3.5" />
            Kelola
          </button>
          {hasPermission("nec.import") && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold whitespace-nowrap hover:bg-emerald-100 transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              Impor
            </button>
          )}
          {hasPermission("nec.export") && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold whitespace-nowrap hover:bg-sky-100 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor
            </button>
          )}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Histori Jaringan NEC</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate("/dashboard")} variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 md:mr-1" />
            <span className="hidden md:inline">Kembali ke Dashboard</span>
          </Button>
          <Button onClick={() => navigate("/nec-management")} variant="outline" size="sm">
            <Settings className="h-4 w-4 md:mr-1" />
            <span className="hidden md:inline">Kelola Tower & Link</span>
          </Button>
          {hasPermission("nec.import") && (
            <Button onClick={() => setIsImportModalOpen(true)} size="sm">
              <Upload className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">Impor Excel</span>
            </Button>
          )}
          {hasPermission("nec.export") && (
            <Button onClick={handleExport} size="sm">
              <Download className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">Ekspor Tahunan</span>
            </Button>
          )}
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        {/* Navigation Tabs - Advanced version */}
        {/* Mobile Card Grid Navigation */}
        <div className="md:hidden mb-2">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveTab("history")}
              className={`col-span-2 relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-200 ${activeTab === "history"
                  ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200 ring-2 ring-blue-400 ring-offset-2"
                  : "bg-gradient-to-br from-blue-400/80 to-indigo-500/80 text-white/90 shadow-md hover:shadow-lg"
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-3xl opacity-90 block">📋</span>
                {totalPages > 0 && (
                  <span className="bg-white/20 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                    {(totalPages * 15).toLocaleString()} data
                  </span>
                )}
              </div>
              <div className="text-lg font-bold">Daftar History</div>
              <div className="text-xs opacity-75 mt-0.5">Catatan RSL link transmission harian</div>
            </button>

            <button
              onClick={() => setActiveTab("pivot")}
              className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200 ${activeTab === "pivot"
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200 ring-2 ring-emerald-400 ring-offset-2"
                  : "bg-gradient-to-br from-emerald-400/80 to-teal-500/80 text-white/90 shadow-md hover:shadow-lg"
                }`}
            >
              <span className="text-2xl mb-1.5 opacity-90 block">📊</span>
              <div className="text-sm font-bold leading-tight">Pivot Table</div>
            </button>

            <button
              onClick={() => setActiveTab("monthly")}
              className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200 ${activeTab === "monthly"
                  ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-200 ring-2 ring-violet-400 ring-offset-2"
                  : "bg-gradient-to-br from-violet-400/80 to-purple-500/80 text-white/90 shadow-md hover:shadow-lg"
                }`}
            >
              <span className="text-2xl mb-1.5 opacity-90 block">📈</span>
              <div className="text-sm font-bold leading-tight">Grafik<br />Bulanan</div>
            </button>

            <button
              onClick={() => setActiveTab("yearly")}
              className={`col-span-2 relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200 flex items-center justify-between ${activeTab === "yearly"
                  ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200 ring-2 ring-amber-400 ring-offset-2"
                  : "bg-gradient-to-br from-amber-400/80 to-orange-500/80 text-white/90 shadow-md hover:shadow-lg"
                }`}
            >
              <div>
                <div className="text-sm font-bold">Grafik Tahunan</div>
                <div className="text-xs opacity-75 mt-0.5">Perbandingan tren per bulan</div>
              </div>
              <span className="text-2xl opacity-90">📉</span>
            </button>
          </div>
        </div>

        {/* Desktop Tab Bar */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "history"
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
            >
              <span className="flex items-center gap-2">
                <span>📋</span>
                <span>Daftar History</span>
                {totalPages > 0 && (
                  <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {(totalPages * 15).toLocaleString()}
                  </span>
                )}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("pivot")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "pivot"
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
            >
              <span className="flex items-center gap-2">
                <span>📊</span>
                <span>Pivot Table</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab("monthly")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "monthly"
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
            >
              <span className="flex items-center gap-2">
                <span>📈</span>
                <span>Grafik Bulanan</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab("yearly")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "yearly"
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
            >
              <span className="flex items-center gap-2">
                <span>📉</span>
                <span>Grafik Tahunan</span>
              </span>
            </button>
          </div>
        </div>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Daftar History RSL</CardTitle>
                {hasPermission("nec.create") && (
                  <Button onClick={() => openModal("create")}>
                    <Plus className="mr-2 h-4 w-4" /> Tambah Data
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Desktop Filters */}
              <div className="hidden md:flex space-x-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Cari history..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        setCurrentPage(1);
                        fetchHistories(
                          1,
                          searchTerm,
                          selectedLink ?? undefined
                        );
                      }
                    }}
                  />
                </div>
                <Select
                  value={selectedLink?.toString() || "all"}
                  onValueChange={(value) => {
                    setSelectedLink(value === "all" ? null : parseInt(value));
                    setCurrentPage(1);
                    fetchHistories(
                      1,
                      searchTerm,
                      value === "all" ? undefined : parseInt(value)
                    );
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by Link" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Link</SelectItem>
                    {links.map((link) => (
                      <SelectItem key={link.id} value={link.id.toString()}>
                        {link.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    setCurrentPage(1);
                    fetchHistories(1, searchTerm, selectedLink ?? undefined);
                  }}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {/* Mobile Filters */}
              <div className="md:hidden flex flex-col gap-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Cari history..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        setCurrentPage(1);
                        fetchHistories(
                          1,
                          searchTerm,
                          selectedLink ?? undefined
                        );
                      }
                    }}
                    className="pl-10 pr-4 py-2.5 h-10 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar relative z-30 pb-1">
                  <div className="relative shrink-0">
                    <button
                      onClick={() => document.getElementById("mobile-dropdown-neclink")?.classList.remove("hidden")}
                      className="flex items-center justify-between h-8 rounded-full bg-blue-50 pl-3 pr-2 border border-blue-200 text-blue-700 text-xs font-semibold select-none min-w-[120px]"
                    >
                      <span className="truncate max-w-[140px]">
                        {selectedLink ? links.find((l) => l.id === selectedLink)?.name : "Semua Link"}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
                    </button>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-3">Memuat data...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {histories.length > 0 ? (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>No</TableHead>
                              <TableHead>Tanggal</TableHead>
                              <TableHead>Link</TableHead>
                              <TableHead>RSL</TableHead>
                              {(hasPermission("nec.update") || hasPermission("nec.delete")) && <TableHead>Aksi</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {histories.map((history) => (
                              <TableRow key={history.id}>
                                <TableCell>{history.no || history.id}</TableCell>
                                <TableCell>
                                  {format(new Date(history.date), "dd/MM/yyyy")}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {history.linkName}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    {isStatusActive(history.status) ? (
                                      <>
                                        <span
                                          className={`font-mono font-semibold ${getRslTextColor(
                                            history.rslNearEnd
                                          )}`}
                                        >
                                          {history.rslNearEnd?.toFixed(1) ??
                                            "N/A"}{" "}
                                          dBm
                                        </span>
                                        <span className="text-xs text-gray-500 mt-1">
                                          {getRslStatusLabel(history.rslNearEnd)}
                                        </span>
                                      </>
                                    ) : (
                                      <div className="space-y-1">
                                        <span
                                          className={
                                            getOperationalStatusDisplay(
                                              history.status
                                            ).className
                                          }
                                        >
                                          {
                                            getOperationalStatusDisplay(
                                              history.status
                                            ).label
                                          }
                                        </span>
                                        {history.notes && (
                                          <p className="text-xs text-gray-600 italic">
                                            {history.notes}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                {(hasPermission("nec.update") || hasPermission("nec.delete")) && (
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      {hasPermission("nec.update") && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => openModal("edit", history)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      )}
                                      {hasPermission("nec.delete") && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDelete(history.id)}
                                        >
                                          <Trash className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden flex flex-col gap-3 mt-4">
                        {histories.map((history) => (
                          <div key={history.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="text-xs font-semibold text-gray-500 mb-1 block">#{history.no || history.id}</span>
                                <h4 className="text-base font-bold text-gray-900 leading-tight pr-2">{history.linkName}</h4>
                              </div>
                              <div className="text-right whitespace-nowrap">
                                <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                                  {format(new Date(history.date), "dd/MM/yyyy")}
                                </span>
                              </div>
                            </div>

                            <div className="py-2 mb-2 border-y border-gray-50">
                              {isStatusActive(history.status) ? (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">RSL Near End:</span>
                                  <div className="text-right">
                                    <span className={`block font-mono font-bold text-sm ${getRslTextColor(history.rslNearEnd)}`}>
                                      {history.rslNearEnd?.toFixed(1) ?? "N/A"} dBm
                                    </span>
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                                      {getRslStatusLabel(history.rslNearEnd)}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Status:</span>
                                    <span className={getOperationalStatusDisplay(history.status).className}>
                                      {getOperationalStatusDisplay(history.status).label}
                                    </span>
                                  </div>
                                  {history.notes && (
                                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md italic border border-gray-100">
                                      {history.notes}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {(hasPermission("nec.update") || hasPermission("nec.delete")) && (
                              <div className="flex justify-end gap-2 mt-2 pt-2">
                                {hasPermission("nec.update") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                                    onClick={() => openModal("edit", history)}
                                  >
                                    <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                                  </Button>
                                )}
                                {hasPermission("nec.delete") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 flex-1 border-red-200 text-red-700 hover:bg-red-50"
                                    onClick={() => handleDelete(history.id)}
                                  >
                                    <Trash className="h-3.5 w-3.5 mr-1.5" /> Hapus
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {histories.length > 0 && (
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 pt-4 border-t">
                          <div className="flex gap-2 justify-center md:justify-start">
                            {/* Button Awal */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPage <= 1 || isLoading}
                              onClick={() =>
                                fetchHistories(
                                  1,
                                  searchTerm,
                                  selectedLink ?? undefined
                                )
                              }
                            >
                              <ChevronsLeft className="h-4 w-4" />
                              <span className="hidden sm:inline ml-1">Awal</span>
                            </Button>

                            {/* Button Sebelumnya */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPage <= 1 || isLoading}
                              onClick={() => {
                                const newPage = Math.max(1, currentPage - 1);
                                fetchHistories(
                                  newPage,
                                  searchTerm,
                                  selectedLink ?? undefined
                                );
                              }}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              <span className="hidden sm:inline ml-1">Sebelumnya</span>
                            </Button>
                          </div>

                          {/* Info Halaman */}
                          <div className="flex flex-col items-center md:flex-row md:items-center gap-1 md:gap-2 order-first md:order-none">
                            <span className="text-sm font-medium text-gray-700">
                              Halaman {currentPage} dari {totalPages}
                            </span>
                            <span className="text-xs text-gray-400">
                              ({histories.length} data)
                            </span>
                          </div>

                          <div className="flex gap-2 justify-center md:justify-end">
                            {/* Button Berikutnya */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPage >= totalPages || isLoading}
                              onClick={() => {
                                const newPage = Math.min(
                                  totalPages,
                                  currentPage + 1
                                );
                                fetchHistories(
                                  newPage,
                                  searchTerm,
                                  selectedLink ?? undefined
                                );
                              }}
                            >
                              <span className="hidden sm:inline mr-1">Berikutnya</span>
                              <ChevronRight className="h-4 w-4" />
                            </Button>

                            {/* Button Akhir */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPage >= totalPages || isLoading}
                              onClick={() =>
                                fetchHistories(
                                  totalPages,
                                  searchTerm,
                                  selectedLink ?? undefined
                                )
                              }
                            >
                              <span className="hidden sm:inline mr-1">Akhir</span>
                              <ChevronsRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <Alert className="mt-4">
                      <AlertDescription className="flex flex-col items-center justify-center py-8">
                        <div className="text-gray-400 mb-2">
                          <Search className="h-12 w-12" />
                        </div>
                        <p className="text-lg font-medium">
                          Tidak ada data history
                        </p>
                        <p className="text-gray-600 mt-1">
                          {searchTerm || selectedLink
                            ? "Coba ubah filter pencarian"
                            : "Klik 'Tambah Data' untuk menambahkan data RSL"}
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pivot">
          <NecRslPivotTable />
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <CardTitle>Grafik Performa Bulanan</CardTitle>

                {/* Desktop Filters */}
                <div className="hidden md:flex space-x-4">
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableYears(histories).map((year) => (
                        <SelectItem
                          key={year.toString()}
                          value={year.toString()}
                        >
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(value) => setSelectedMonth(parseInt(value))}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(
                        (month) => (
                          <SelectItem key={month} value={month.toString()}>
                            {new Date(0, month - 1).toLocaleString("id-ID", {
                              month: "long",
                            })}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mobile Filters */}
                <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar relative z-30 pb-1 w-full">
                  <div className="relative shrink-0">
                    <button
                      onClick={() => document.getElementById("mobile-dropdown-monthly-year")?.classList.remove("hidden")}
                      className="flex items-center justify-between h-8 rounded-full bg-blue-50 pl-3 pr-2 border border-blue-200 text-blue-700 text-xs font-semibold select-none min-w-[90px]"
                    >
                      <span className="truncate">{selectedYear}</span>
                      <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
                    </button>
                  </div>
                  <div className="relative shrink-0">
                    <button
                      onClick={() => document.getElementById("mobile-dropdown-monthly-month")?.classList.remove("hidden")}
                      className="flex items-center justify-between h-8 rounded-full bg-blue-50 pl-3 pr-2 border border-blue-200 text-blue-700 text-xs font-semibold select-none min-w-[120px]"
                    >
                      <span className="truncate">
                        {new Date(0, selectedMonth - 1).toLocaleString("id-ID", { month: "long" })}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>{renderMonthlyChart()}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yearly">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <CardTitle>Grafik Ringkasan Tahunan</CardTitle>

                {/* Desktop Filters */}
                <div className="hidden md:block">
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(5)].map((_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mobile Filters */}
                <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar relative z-30 pb-1 w-full">
                  <div className="relative shrink-0">
                    <button
                      onClick={() => document.getElementById("mobile-dropdown-yearly-year")?.classList.remove("hidden")}
                      className="flex items-center justify-between h-8 rounded-full bg-blue-50 pl-3 pr-2 border border-blue-200 text-blue-700 text-xs font-semibold select-none min-w-[90px]"
                    >
                      <span className="truncate">{selectedYear}</span>
                      <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>{renderYearlyChart()}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {modalMode === "create"
                ? "Tambah Data History"
                : "Edit Data History"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Isi detail history recording jaringan NEC.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Link - full width */}
              <div>
                <Label htmlFor="necLinkId" className="text-sm font-medium">Link <span className="text-red-500">*</span></Label>
                {modalMode === "edit" ? (
                  <Input disabled value={links.find((l) => l.id === formData.necLinkId)?.name || ""} className="disabled:opacity-50 mt-1.5" />
                ) : (
                  <Popover open={openLinkBox} onOpenChange={setOpenLinkBox} modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openLinkBox}
                        className="w-full justify-between font-normal mt-1.5"
                      >
                        <span className="truncate">
                          {formData.necLinkId
                            ? (() => {
                              const selected = links.find((l) => l.id === formData.necLinkId);
                              return selected ? `${selected.name} (${selected.nearEndTower} → ${selected.farEndTower})` : "Pilih Link";
                            })()
                            : "Pilih Link"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[460px] p-0 pointer-events-auto" align="start">
                      <Command>
                        <CommandInput placeholder="Cari link..." />
                        <CommandList>
                          <CommandEmpty>Link tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {links.map((link) => (
                              <CommandItem
                                key={link.id}
                                value={`${link.name} ${link.nearEndTower} ${link.farEndTower}`}
                                onSelect={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    necLinkId: link.id,
                                  }));
                                  setOpenLinkBox(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.necLinkId === link.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {link.name} ({link.nearEndTower} → {link.farEndTower})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Tanggal + RSL Near End - side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="text-sm font-medium">Tanggal <span className="text-red-500">*</span></Label>
                  <Input
                    id="date"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="rslNearEnd" className="text-sm font-medium">
                    RSL Near End (dBm)
                  </Label>
                  {formData.status !== "active" && (
                    <p className="text-xs text-gray-400 mt-0.5">Otomatis -100 untuk non-active</p>
                  )}
                  <Input
                    id="rslNearEnd"
                    type="number"
                    name="rslNearEnd"
                    step="0.1"
                    min="-100"
                    max="-10"
                    value={formData.rslNearEnd}
                    onChange={handleInputChange}
                    required={formData.status === "active"}
                    disabled={formData.status !== "active"}
                    className={`mt-1.5 ${formData.status !== "active" ? "bg-gray-100" : ""}`}
                  />
                </div>
              </div>

              {/* Status - half width */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="dismantled">Dismantled</SelectItem>
                      <SelectItem value="removed">Removed</SelectItem>
                      <SelectItem value="obstacle">Obstacle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes - textarea */}
              <div>
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes{" "}
                  {formData.status !== "active" && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Catatan tambahan..."
                  required={formData.status !== "active"}
                  rows={3}
                  className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
                {formData.status !== "active" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Catatan wajib diisi untuk status non-active
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="mt-6 gap-2">
              <Button
                type="button"
                variant="outline"
                className="px-6"
                onClick={() => setIsModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSaving} className="px-6 bg-[#1a1c1e] hover:bg-black text-white">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {modalMode === "create" ? "Menyimpan..." : "Memperbarui..."}
                  </>
                ) : (
                  modalMode === "create" ? "Simpan" : "Simpan Perubahan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Impor Data dari Excel</DialogTitle>
            <DialogDescription>
              Pilih format Excel yang sesuai dengan file Anda
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="space-y-2">
                <p className="font-semibold">
                  Format Pivot (yang Anda gunakan):
                </p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>
                    <strong>Kolom A:</strong> No (opsional)
                  </li>
                  <li>
                    <strong>Kolom B:</strong> Link Name (contoh: M5 to Hasari)
                  </li>
                  <li>
                    <strong>Kolom C+:</strong> Jan-25, Feb-25, Mar-25, dst
                  </li>
                  <li>
                    <strong>Data:</strong> RSL values dalam setiap cell
                  </li>
                </ul>
                <p className="text-xs text-gray-600 mt-2">
                  ✅ Tanggal akan di-set ke tanggal 15 setiap bulan
                </p>
              </AlertDescription>
            </Alert>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Input
                type="file"
                accept=".xlsx,.xls"
                ref={fileInputRef}
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="mb-2"
              />
              {importFile && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ {importFile.name}
                </p>
              )}
            </div>
            {importResult && (
              <Alert
                className={
                  importResult.failedRows > 0
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-green-50 text-green-700 border-green-200"
                }
              >
                <AlertDescription>
                  <p className="font-semibold">{importResult.message}</p>
                  <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                    <div>
                      <span className="font-medium">Diproses:</span>{" "}
                      {importResult.totalRowsProcessed}
                    </div>
                    <div className="text-green-700">
                      <span className="font-medium">Berhasil:</span>{" "}
                      {importResult.successfulInserts}
                    </div>
                    <div className="text-red-700">
                      <span className="font-medium">Gagal:</span>{" "}
                      {importResult.failedRows}
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium mb-1">Errors:</p>
                      <ScrollArea className="h-32 border rounded p-2 bg-white">
                        <ul className="list-disc list-inside text-xs space-y-1">
                          {importResult.errors.map((error, idx) => (
                            <li key={idx} className="text-red-600">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsImportModalOpen(false);
                setImportResult(null);
                setImportFile(null);
              }}
            >
              Tutup
            </Button>
            <Button onClick={handleImport} disabled={!importFile}>
              <Upload className="mr-2 h-4 w-4" />
              Impor Pivot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== MOBILE FILTER MODALS ========== */}
      <div id="mobile-dropdown-neclink" className="hidden fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => document.getElementById("mobile-dropdown-neclink")?.classList.add("hidden")}>
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[70vh] animate-in slide-in-from-bottom-8 duration-200"
          onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
            <h3 className="font-bold text-gray-800">Pilih Link</h3>
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            <div className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${!selectedLink ? 'font-bold text-blue-700 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => { setSelectedLink(null); setCurrentPage(1); fetchHistories(1, searchTerm, undefined); document.getElementById("mobile-dropdown-neclink")?.classList.add("hidden"); }}>
              Semua Link {!selectedLink && <Check className="w-4 h-4" />}
            </div>
            {links.map((l) => (
              <div key={l.id} className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${selectedLink === l.id ? 'font-bold text-blue-700 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => { setSelectedLink(l.id); setCurrentPage(1); fetchHistories(1, searchTerm, l.id); document.getElementById("mobile-dropdown-neclink")?.classList.add("hidden"); }}>
                <span className="truncate pr-2">{l.name}</span>
                {selectedLink === l.id && <Check className="w-4 h-4 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="mobile-dropdown-monthly-year" className="hidden fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => document.getElementById("mobile-dropdown-monthly-year")?.classList.add("hidden")}>
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[70vh] animate-in slide-in-from-bottom-8 duration-200"
          onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
            <h3 className="font-bold text-gray-800">Pilih Tahun</h3>
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            {getAvailableYears(histories).map((year) => (
              <div key={year} className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${selectedYear === year ? 'font-bold text-blue-700 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => { setSelectedYear(year); document.getElementById("mobile-dropdown-monthly-year")?.classList.add("hidden"); }}>
                {year} {selectedYear === year && <Check className="w-4 h-4 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="mobile-dropdown-monthly-month" className="hidden fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => document.getElementById("mobile-dropdown-monthly-month")?.classList.add("hidden")}>
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[70vh] animate-in slide-in-from-bottom-8 duration-200"
          onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
            <h3 className="font-bold text-gray-800">Pilih Bulan</h3>
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <div key={month} className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${selectedMonth === month ? 'font-bold text-blue-700 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => { setSelectedMonth(month); document.getElementById("mobile-dropdown-monthly-month")?.classList.add("hidden"); }}>
                <span className="truncate pr-2">
                  {new Date(0, month - 1).toLocaleString("id-ID", { month: "long" })}
                </span>
                {selectedMonth === month && <Check className="w-4 h-4 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="mobile-dropdown-yearly-year" className="hidden fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => document.getElementById("mobile-dropdown-yearly-year")?.classList.add("hidden")}>
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[70vh] animate-in slide-in-from-bottom-8 duration-200"
          onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
            <h3 className="font-bold text-gray-800">Pilih Tahun</h3>
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <div key={year} className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer flex justify-between items-center ${selectedYear === year ? 'font-bold text-blue-700 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => { setSelectedYear(year); document.getElementById("mobile-dropdown-yearly-year")?.classList.add("hidden"); }}>
                  {year} {selectedYear === year && <Check className="w-4 h-4 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};

export default NecHistoryPage;
