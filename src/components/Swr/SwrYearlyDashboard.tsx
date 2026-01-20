import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { swrSignalApi } from "@/services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";
import {
  Download,
  Upload,
  Filter,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Settings,
  Eye,
  EyeOff,
  Layers,
  TrendingUp,
  TrendingDown,
  Hash,
  Thermometer,
  Battery,
  Zap,
  Shield,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

// Types - Gak perlu diubah karena backend udah ngasih dalam format yang sama
interface SwrYearlyPivotDto {
  channelName: string;
  siteName: string;
  siteType: string;
  monthlyFpwr: Record<string, number | null>;
  monthlyVswr: Record<string, number | null>;
  expectedSwrMax: number;
  notes: Record<string, string>;
}

interface SwrYearlySummaryDto {
  year: number;
  sites: SwrSiteYearlyDto[];
}

interface SwrSiteYearlyDto {
  siteName: string;
  siteType: string;
  channels: Record<string, SwrChannelYearlyDto>;
}

interface SwrChannelYearlyDto {
  monthlyAvgFpwr: Record<string, number | null>;
  monthlyAvgVswr: Record<string, number>;
  yearlyAvgFpwr: number | null;
  yearlyAvgVswr: number;
  warnings: string[];
}

interface SwrSiteListDto {
  id: number;
  name: string;
  location: string;
  type: string;
  channelCount: number;
}

// Color schemes
const COLOR_SCHEMES = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#8b5cf6",
  secondary: "#6b7280",
};

const VSWR_THRESHOLDS = {
  EXCELLENT: 1.2,
  GOOD: 1.5,
  WARNING: 2.0,
  CRITICAL: 3.0,
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Helper functions
const getVswrStatus = (value: number | null, expectedMax: number = 1.5) => {
  if (value === null || value === undefined || value <= 0) return "no_data";
  if (value < expectedMax) return "good";
  if (value < VSWR_THRESHOLDS.WARNING) return "warning";
  if (value < VSWR_THRESHOLDS.CRITICAL) return "critical";
  return "danger";
};

const getVswrColor = (value: number | null, expectedMax: number = 1.5) => {
  const status = getVswrStatus(value, expectedMax);
  const colors: Record<string, string> = {
    good: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    critical: "bg-orange-100 text-orange-800 border-orange-200",
    danger: "bg-red-100 text-red-800 border-red-200",
    no_data: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colors[status] || colors.no_data;
};

const getVswrStatusIcon = (value: number | null, expectedMax: number = 1.5) => {
  const status = getVswrStatus(value, expectedMax);
  switch (status) {
    case "good": return <CheckCircle className="w-4 h-4 text-green-600" />;
    case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    case "critical": return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    case "danger": return <XCircle className="w-4 h-4 text-red-600" />;
    default: return <Info className="w-4 h-4 text-gray-600" />;
  }
};

const SwrYearlyDashboard: React.FC = () => {
  // State management
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [sites, setSites] = useState<SwrSiteListDto[]>([]);
  const [pivotData, setPivotData] = useState<SwrYearlyPivotDto[]>([]);
  const [yearlySummary, setYearlySummary] = useState<SwrYearlySummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [activeChart, setActiveChart] = useState<string>("performance");
  const [visibleMetrics, setVisibleMetrics] = useState({
    vswr: true,
    fpwr: true,
    status: true,
    notes: false,
  });
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'channelName', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [threshold, setThreshold] = useState<number>(1.5);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Available years
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  // ============================================
  // FETCH DATA - SUDAH SESUAI DENGAN CONTROLLER
  // ============================================
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.group("📡 Fetching Dashboard Data");
      console.log("Year:", selectedYear, "Site:", selectedSite === "all" ? "All Sites" : selectedSite);

      // 1. Fetch Sites dengan error handling yang lebih baik
      console.log("1. Fetching sites...");
      let sitesData: any[] = [];
      try {
        const sitesResponse = await swrSignalApi.getSites();

        // ✅ PERBAIKAN: Handle semua kemungkinan struktur respons
        if (!sitesResponse) {
          throw new Error("Tidak ada respons dari server");
        }

        // Cek jika respons adalah ApiResponse wrapper
        if (sitesResponse.data && Array.isArray(sitesResponse.data)) {
          sitesData = sitesResponse.data;
        }
        // Cek jika respons langsung array
        else if (Array.isArray(sitesResponse)) {
          sitesData = sitesResponse;
        }
        // Cek jika ada properti lain yang berisi data
        else if (sitesResponse.sites && Array.isArray(sitesResponse.sites)) {
          sitesData = sitesResponse.sites;
        }
        // Fallback: coba extract data dari properti apapun yang ada
        else {
          // Cari properti pertama yang merupakan array
          const arrayProps = Object.values(sitesResponse).filter(val => Array.isArray(val));
          if (arrayProps.length > 0) {
            sitesData = arrayProps[0] as any[];
          }
        }

        console.log(`✅ Sites loaded: ${sitesData.length} sites`);
      } catch (siteError: any) {
        console.error("❌ Error loading sites:", siteError);
        // Jangan throw, gunakan array kosong sebagai fallback
        sitesData = [];
      }

      setSites(sitesData);

      // 2. Fetch Pivot Data dengan error handling
      console.log("2. Fetching pivot data...");
      let pivotDataArray: SwrYearlyPivotDto[] = [];
      try {
        const pivotResponse = await swrSignalApi.getYearlyPivot(
          selectedYear,
          selectedSite === "all" ? undefined : selectedSite
        );

        // ✅ PERBAIKAN: Handle berbagai struktur respons
        if (pivotResponse && typeof pivotResponse === 'object') {
          // Coba semua kemungkinan properti yang mungkin berisi data
          if (Array.isArray(pivotResponse)) {
            pivotDataArray = pivotResponse as SwrYearlyPivotDto[];
          } else if ((pivotResponse as any).data && Array.isArray((pivotResponse as any).data)) {
            pivotDataArray = (pivotResponse as any).data as SwrYearlyPivotDto[];
          } else if ((pivotResponse as any).items && Array.isArray((pivotResponse as any).items)) {
            pivotDataArray = (pivotResponse as any).items as SwrYearlyPivotDto[];
          } else if ((pivotResponse as any).result && Array.isArray((pivotResponse as any).result)) {
            pivotDataArray = (pivotResponse as any).result as SwrYearlyPivotDto[];
          }
          // Fallback: coba ambil properti array pertama
          else {
            const arrayProps = Object.values(pivotResponse).filter(val => Array.isArray(val));
            if (arrayProps.length > 0) {
              pivotDataArray = arrayProps[0] as SwrYearlyPivotDto[];
            }
          }
        }

        console.log(`✅ Pivot data loaded: ${pivotDataArray.length} channels`);
      } catch (pivotError: any) {
        console.error("❌ Error loading pivot data:", pivotError);
        pivotDataArray = [];
      }

      setPivotData(pivotDataArray);

      console.groupEnd();

    } catch (error: any) {
      console.error("❌ Error in fetchData:", error);
      const errorMessage = error.message || "Failed to load dashboard data";
      setError(errorMessage);

      toast({
        title: "Error Loading Data",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedSite]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================
  // DATA PROCESSING - SUDAH SESUAI
  // ============================================

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let filtered = [...pivotData];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.channelName?.toLowerCase().includes(term) ||
        item.siteName?.toLowerCase().includes(term) ||
        item.siteType?.toLowerCase().includes(term)
      );
    }

    // Apply channel selection filter
    if (selectedChannels.length > 0) {
      filtered = filtered.filter(item => selectedChannels.includes(item.channelName));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof SwrYearlyPivotDto];
      const bVal = b[sortConfig.key as keyof SwrYearlyPivotDto];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return filtered;
  }, [pivotData, searchTerm, selectedChannels, sortConfig]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Statistics calculation
  const statistics = useMemo(() => {
    if (pivotData.length === 0) {
      return {
        totalChannels: 0,
        totalDataPoints: 0,
        averageVswr: 0,
        goodPercentage: 0,
        warningPercentage: 0,
        criticalPercentage: 0,
        badPercentage: 0,
      };
    }

    const totalChannels = pivotData.length;

    // Calculate total data points (months with valid VSWR data)
    const totalDataPoints = pivotData.reduce((sum, channel) => {
      const validMonths = Object.values(channel.monthlyVswr || {}).filter(v =>
        v !== null && v !== undefined && v > 0
      ).length;
      return sum + validMonths;
    }, 0);

    let goodCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    let badCount = 0;
    let totalVswr = 0;
    let validVswrCount = 0;

    pivotData.forEach(channel => {
      const expectedMax = channel.expectedSwrMax || 1.5;

      Object.values(channel.monthlyVswr || {}).forEach(vswr => {
        if (vswr !== null && vswr !== undefined && vswr > 0) {
          const status = getVswrStatus(vswr, expectedMax);
          totalVswr += vswr;
          validVswrCount++;

          switch (status) {
            case 'good': goodCount++; break;
            case 'warning': warningCount++; break;
            case 'critical': criticalCount++; break;
            case 'danger': badCount++; break;
          }
        }
      });
    });

    const averageVswr = validVswrCount > 0
      ? totalVswr / validVswrCount
      : 0;

    return {
      totalChannels,
      totalDataPoints,
      averageVswr: parseFloat(averageVswr.toFixed(2)),
      goodPercentage: totalDataPoints > 0 ? (goodCount / totalDataPoints) * 100 : 0,
      warningPercentage: totalDataPoints > 0 ? (warningCount / totalDataPoints) * 100 : 0,
      criticalPercentage: totalDataPoints > 0 ? (criticalCount / totalDataPoints) * 100 : 0,
      badPercentage: totalDataPoints > 0 ? (badCount / totalDataPoints) * 100 : 0,
    };
  }, [pivotData]);

  // Chart data preparation
  const performanceChartData = useMemo(() => {
    if (!yearlySummary || !yearlySummary.sites) return [];

    const data: any[] = [];

    yearlySummary.sites.forEach((site: any) => {
      Object.entries(site.channels || {}).forEach(([channelName, channelData]: [string, any]) => {
        MONTHS.forEach(month => {
          const vswr = channelData?.monthlyAvgVswr?.[month];
          if (vswr !== undefined && vswr !== null) {
            data.push({
              month,
              channel: channelName,
              site: site.siteName,
              vswr: Number(vswr),
              status: getVswrStatus(vswr, threshold),
            });
          }
        });
      });
    });

    return data;
  }, [yearlySummary, threshold]);

  const monthlyTrendData = useMemo(() => {
    if (pivotData.length === 0) return [];

    const monthlyAverages: Record<string, { sum: number; count: number }> = {};

    MONTHS.forEach(month => {
      monthlyAverages[month] = { sum: 0, count: 0 };
    });

    pivotData.forEach(channel => {
      Object.entries(channel.monthlyVswr || {}).forEach(([monthKey, vswr]) => {
        if (vswr !== null && vswr !== undefined && vswr > 0) {
          const month = monthKey.split('-')[0];
          if (MONTHS.includes(month)) {
            monthlyAverages[month].sum += vswr;
            monthlyAverages[month].count++;
          }
        }
      });
    });

    return MONTHS.map(month => ({
      month,
      average: monthlyAverages[month].count > 0
        ? monthlyAverages[month].sum / monthlyAverages[month].count
        : null,
      count: monthlyAverages[month].count,
    }));
  }, [pivotData]);

  const sitePerformanceData = useMemo(() => {
    if (pivotData.length === 0) return [];

    const siteStats: Record<string, {
      total: number;
      good: number;
      avgVswr: number;
      count: number;
    }> = {};

    pivotData.forEach(channel => {
      const siteName = channel.siteName;
      if (!siteStats[siteName]) {
        siteStats[siteName] = {
          total: 0,
          good: 0,
          avgVswr: 0,
          count: 0
        };
      }

      const expectedMax = channel.expectedSwrMax || 1.5;

      Object.values(channel.monthlyVswr || {}).forEach(vswr => {
        if (vswr !== null && vswr !== undefined && vswr > 0) {
          siteStats[siteName].total++;
          siteStats[siteName].avgVswr += vswr;
          siteStats[siteName].count++;

          if (getVswrStatus(vswr, expectedMax) === 'good') {
            siteStats[siteName].good++;
          }
        }
      });
    });

    return Object.entries(siteStats)
      .map(([siteName, stats]) => ({
        site: siteName,
        performance: stats.total > 0
          ? (stats.good / stats.total) * 100
          : 0,
        avgVswr: stats.count > 0 ? stats.avgVswr / stats.count : 0,
        totalChannels: pivotData.filter(c => c.siteName === siteName).length,
      }))
      .sort((a, b) => b.performance - a.performance);
  }, [pivotData]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await swrSignalApi.exportYearlyExcel(selectedYear, selectedSite === "all" ? undefined : selectedSite);
      toast({
        title: "Export Successful",
        description: `Yearly report for ${selectedYear} has been exported`,
      });
    } catch (error: any) {
      console.error("❌ Export error:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleChannelToggle = (channelName: string) => {
    setSelectedChannels(prev =>
      prev.includes(channelName)
        ? prev.filter(name => name !== channelName)
        : [...prev, channelName]
    );
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    fetchData();
  };

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Channels</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {statistics.totalChannels}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {statistics.totalDataPoints} data points
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Hash className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Average VSWR</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {statistics.averageVswr.toFixed(2)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {statistics.goodPercentage.toFixed(1)}% good
              </p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700">Good Performance</p>
              <p className="text-3xl font-bold text-yellow-900 mt-2">
                {statistics.goodPercentage.toFixed(1)}%
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Within threshold
              </p>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <TrendingUp className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Data Points</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {statistics.totalDataPoints}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Across all channels
              </p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Layers className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPerformanceGauge = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Performance Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Good</span>
            <div className="flex items-center gap-2">
              <Progress value={statistics.goodPercentage} className="w-32" />
              <span className="text-sm font-bold">{statistics.goodPercentage.toFixed(1)}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Warning</span>
            <div className="flex items-center gap-2">
              <Progress value={statistics.warningPercentage} className="w-32" indicatorClassName="bg-yellow-500" />
              <span className="text-sm font-bold">{statistics.warningPercentage.toFixed(1)}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Critical</span>
            <div className="flex items-center gap-2">
              <Progress value={statistics.criticalPercentage} className="w-32" indicatorClassName="bg-orange-500" />
              <span className="text-sm font-bold">{statistics.criticalPercentage.toFixed(1)}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Bad</span>
            <div className="flex items-center gap-2">
              <Progress value={statistics.badPercentage} className="w-32" indicatorClassName="bg-red-500" />
              <span className="text-sm font-bold">{statistics.badPercentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderMonthlyTrendChart = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChartIcon className="w-5 h-5" />
          Monthly VSWR Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {monthlyTrendData.filter(d => d.average !== null).length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrendData.filter(d => d.average !== null)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis
                domain={[1.0, 4.0]}
                label={{ value: 'VSWR', angle: -90, position: 'insideLeft' }}
              />
              <RechartsTooltip
                formatter={(value: number | undefined) => value !== undefined ? [`${value.toFixed(2)}`, "VSWR"] : ["-", "VSWR"]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <ReferenceLine y={threshold} stroke="#f59e0b" strokeDasharray="3 3" label={`Threshold: ${threshold}`} />
              <Line
                type="monotone"
                dataKey="average"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Average VSWR"
              />
              <Area
                type="monotone"
                dataKey="average"
                fill="#3b82f6"
                fillOpacity={0.1}
                stroke="none"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No trend data available
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderSitePerformanceChart = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Site Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sitePerformanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={sitePerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="site" angle={-45} textAnchor="end" height={60} />
              <YAxis yAxisId="left" domain={[0, 100]} label={{ value: 'Performance %', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" domain={[1.0, 4.0]} label={{ value: 'Avg VSWR', angle: 90, position: 'insideRight' }} />
              <RechartsTooltip
                formatter={(value: number | undefined, name: string | undefined) => {
                  if (value === undefined) return ['-', name || ''];
                  if (name === 'performance') return [`${value.toFixed(1)}%`, "Performance"];
                  if (name === 'avgVswr') return [`${value.toFixed(2)}`, "Avg VSWR"];
                  return [value, name || ''];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="performance" fill="#10b981" name="Performance %" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="avgVswr" stroke="#ef4444" strokeWidth={2} name="Avg VSWR" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No site performance data
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderPivotTable = () => {
    const monthKeys = MONTHS.map(month => `${month}-${selectedYear.toString().slice(-2)}`);

    return (
      <Card className="col-span-2">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Yearly Pivot Data</CardTitle>
              <CardDescription>
                Showing {paginatedData.length} of {filteredData.length} channels
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search channels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Metrics</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setVisibleMetrics(prev => ({ ...prev, notes: !prev.notes }))}>
                    {visibleMetrics.notes ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {visibleMetrics.notes ? 'Hide Notes' : 'Show Notes'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>View Options</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setShowHeatmap(!showHeatmap)}>
                    {showHeatmap ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Info className="w-12 h-12 mb-4 text-gray-400" />
              <p className="text-lg font-medium">No data available for {selectedYear}</p>
              <p className="text-sm mt-2">Try selecting a different year or site</p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[600px]">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold sticky left-0 bg-white z-20 min-w-[200px]">
                        <button
                          onClick={() => handleSort('channelName')}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          Channel
                          {sortConfig.key === 'channelName' && (
                            <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="text-left p-3 font-semibold min-w-[150px]">
                        <button
                          onClick={() => handleSort('siteName')}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          Site
                          {sortConfig.key === 'siteName' && (
                            <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      {monthKeys.map(month => (
                        <th key={month} className="text-center p-3 font-semibold min-w-[100px]">
                          {month}
                        </th>
                      ))}
                      <th className="text-center p-3 font-semibold min-w-[100px]">Avg</th>
                      <th className="text-center p-3 font-semibold min-w-[100px]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((row, rowIndex) => {
                      const validVswrValues = monthKeys
                        .map(key => row.monthlyVswr?.[key])
                        .filter(v => v !== null && v !== undefined && v > 0) as number[];
                      const avgVswr = validVswrValues.length > 0
                        ? validVswrValues.reduce((a, b) => a + b) / validVswrValues.length
                        : null;

                      return (
                        <tr key={rowIndex} className="border-b hover:bg-gray-50">
                          <td className="p-3 sticky left-0 bg-white z-10">
                            <div className="font-medium">{row.channelName}</div>
                            <div className="text-xs text-gray-500">{row.siteType}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{row.siteName}</div>
                          </td>
                          {monthKeys.map((monthKey, monthIndex) => {
                            const vswr = row.monthlyVswr?.[monthKey];
                            const note = row.notes?.[monthKey];
                            const hasNote = !!note;

                            return (
                              <td key={monthIndex} className="p-2 text-center">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className={`
                                        p-2 rounded transition-all duration-200 cursor-pointer
                                        ${showHeatmap ? getVswrColor(vswr, row.expectedSwrMax) : 'bg-transparent'}
                                        ${hasNote ? 'ring-1 ring-yellow-400' : ''}
                                      `}>
                                        <div className="font-mono font-bold">
                                          {vswr !== null && vswr !== undefined && vswr > 0
                                            ? vswr.toFixed(1)
                                            : '-'}
                                        </div>
                                        {hasNote && visibleMetrics.notes && (
                                          <div className="text-xs text-yellow-600">📝</div>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-sm">
                                        <div className="font-bold">{row.channelName}</div>
                                        <div className="text-xs text-gray-500">
                                          {monthKey}
                                        </div>
                                        <div className="mt-2 font-mono">
                                          VSWR: {vswr !== null && vswr !== undefined && vswr > 0
                                            ? vswr.toFixed(2)
                                            : 'No Data'}
                                        </div>
                                        {hasNote && (
                                          <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
                                            📝 {note}
                                          </div>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </td>
                            );
                          })}
                          <td className="p-3 text-center">
                            <div className={`
                              p-2 rounded font-mono font-bold
                              ${getVswrColor(avgVswr, row.expectedSwrMax)}
                            `}>
                              {avgVswr !== null ? avgVswr.toFixed(2) : '-'}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center">
                              {getVswrStatusIcon(avgVswr, row.expectedSwrMax)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollArea>

              {filteredData.length > pageSize && (
                <div className="flex items-center justify-between border-t pt-4 mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {Math.ceil(filteredData.length / pageSize)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredData.length / pageSize), prev + 1))}
                      disabled={currentPage === Math.ceil(filteredData.length / pageSize)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.ceil(filteredData.length / pageSize))}
                      disabled={currentPage === Math.ceil(filteredData.length / pageSize)}
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(parseInt(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 / page</SelectItem>
                      <SelectItem value="25">25 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                      <SelectItem value="100">100 / page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderAlertPanel = () => {
    if (!pivotData.length) return null;

    const alerts: Array<{
      type: 'critical' | 'warning' | 'info' | 'danger';
      message: string;
      channel: string;
      value: number;
      month: string;
    }> = [];

    pivotData.forEach(channel => {
      Object.entries(channel.monthlyVswr || {}).forEach(([monthKey, vswr]) => {
        if (vswr !== null && vswr !== undefined && vswr > 0) {
          const status = getVswrStatus(vswr, channel.expectedSwrMax);
          const month = monthKey.split('-')[0];

          if (status === 'danger') {
            alerts.push({
              type: 'danger',
              message: `Critical VSWR detected`,
              channel: channel.channelName,
              value: vswr,
              month: month,
            });
          } else if (status === 'critical') {
            alerts.push({
              type: 'critical',
              message: `High VSWR warning`,
              channel: channel.channelName,
              value: vswr,
              month: month,
            });
          }
        }
      });
    });

    if (alerts.length === 0) {
      return (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertTitle>All Good!</AlertTitle>
          <AlertDescription>
            No critical issues detected in the current data.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Alerts ({alerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {alerts.slice(0, 10).map((alert, index) => (
                <Alert key={index} className={
                  alert.type === 'danger'
                    ? "border-red-200 bg-red-50"
                    : "border-orange-200 bg-orange-50"
                }>
                  <AlertTriangle className={
                    alert.type === 'danger'
                      ? "w-4 h-4 text-red-600"
                      : "w-4 h-4 text-orange-600"
                  } />
                  <AlertTitle>{alert.message}</AlertTitle>
                  <AlertDescription className="text-sm">
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-medium">{alert.channel}</span>
                      <span className="text-gray-600">•</span>
                      <span>{alert.month}</span>
                      <span className="text-gray-600">•</span>
                      <span className="font-bold">VSWR: {alert.value.toFixed(2)}</span>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </ScrollArea>
          {alerts.length > 10 && (
            <div className="text-center mt-4 text-sm text-gray-600">
              ... and {alerts.length - 10} more alerts
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ============================================
  // ERROR STATE
  // ============================================

  if (error && retryCount >= 3) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to Load Dashboard</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>{error}</p>
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={handleRetry}
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="destructive"
                >
                  Reload Page
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SWR Signal Yearly Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive overview of SWR performance for {selectedYear}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {sites.map(site => (
                <SelectItem key={site.id} value={site.id.toString()}>
                  {site.name} ({site.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleExport}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.print()}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Print Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {renderSummaryCards()}

      <Tabs value={activeChart} onValueChange={setActiveChart}>
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="performance">
            <Activity className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="trend">
            <LineChartIcon className="w-4 h-4 mr-2" />
            Trend
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <BarChart3 className="w-4 h-4 mr-2" />
            Comparison
          </TabsTrigger>
          <TabsTrigger value="details">
            <PieChartIcon className="w-4 h-4 mr-2" />
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {renderPerformanceGauge()}
            {renderMonthlyTrendChart()}
            {renderAlertPanel()}
          </div>
          {renderPivotTable()}
        </TabsContent>

        <TabsContent value="trend">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderMonthlyTrendChart()}
            {renderSitePerformanceChart()}
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <div className="grid grid-cols-1 gap-6">
            {renderSitePerformanceChart()}
          </div>
        </TabsContent>

        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {renderPerformanceGauge()}
            <Card>
              <CardHeader>
                <CardTitle>Site Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {sites.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sites.map(site => ({
                          name: site.name,
                          value: site.channelCount,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sites.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(COLOR_SCHEMES)[index % 6]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    No site data available
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="threshold">VSWR Threshold</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="threshold"
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="4.0"
                      value={threshold}
                      onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    />
                    <span className="text-sm text-gray-600">default: 1.5</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Visible Metrics</h4>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="metric-notes" className="capitalize">
                      Notes
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVisibleMetrics(prev => ({ ...prev, notes: !prev.notes }))}
                    >
                      {visibleMetrics.notes ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="metric-heatmap" className="capitalize">
                      Color Coding
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHeatmap(!showHeatmap)}
                    >
                      {showHeatmap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SwrYearlyDashboard;