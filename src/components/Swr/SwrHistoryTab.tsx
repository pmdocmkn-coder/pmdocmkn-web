import React, { useState, useEffect } from "react";
import { swrSignalApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { format, parse } from "date-fns";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Search,
  X,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SwrHistoryItemDto {
  id: number;
  swrChannelId: number;
  channelName: string;
  siteName: string;
  siteType: string;
  date: string;
  fpwr?: number | null;
  vswr: number;
  notes?: string;
  status: number | string;
  no?: number;
}

interface SwrChannelListDto {
  id: number;
  channelName: string;
  swrSiteId: number;
  swrSiteName: string;
  swrSiteType: string;
  expectedSwrMax: number;
  expectedPwrMax?: number | null;
}

interface SwrSiteListDto {
  id: number;
  name: string;
  type: string;
}

// Searchable Channel Select Component
const SearchableChannelSelect = ({
  value,
  onChange,
  channels,
  disabled = false
}: {
  value: string;
  onChange: (value: string) => void;
  channels: SwrChannelListDto[];
  disabled?: boolean;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredChannels, setFilteredChannels] = useState<SwrChannelListDto[]>([]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredChannels(channels.slice(0, 50)); // Limit to 50 items for performance
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = channels.filter(
        (channel) =>
          channel.channelName.toLowerCase().includes(query) ||
          channel.swrSiteName.toLowerCase().includes(query) ||
          channel.swrSiteType.toLowerCase().includes(query)
      );
      setFilteredChannels(filtered.slice(0, 50));
    }
  }, [searchQuery, channels]);

  const getChannelDisplay = (channel: SwrChannelListDto) => {
    return `${channel.channelName} - ${channel.swrSiteName} (${channel.swrSiteType})`;
  };

  const selectedChannel = channels.find(ch => ch.id.toString() === value);

  return (
    <div className="relative">
      <div
        className={cn(
          "flex items-center justify-between w-full px-3 py-2.5 border rounded-md text-sm cursor-pointer hover:bg-gray-50 transition-colors",
          disabled ? "bg-gray-100 cursor-not-allowed text-gray-500" : "bg-white",
          selectedChannel ? "text-gray-900" : "text-gray-500"
        )}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <span className="truncate">
          {selectedChannel ? getChannelDisplay(selectedChannel) : "Cari atau pilih channel..."}
        </span>
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </div>

      {isOpen && !disabled && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 w-full border rounded-md bg-white shadow-lg max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari channel, site, atau tipe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Channel List */}
            <div className="overflow-y-auto max-h-60">
              {channels.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Tidak ada channel tersedia
                </div>
              ) : filteredChannels.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchQuery
                    ? "Tidak ada channel yang cocok"
                    : "Memuat channel..."}
                </div>
              ) : (
                <div className="py-1">
                  {filteredChannels.map((channel) => (
                    <div
                      key={channel.id}
                      className={cn(
                        "px-4 py-3 cursor-pointer hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0",
                        value === channel.id.toString() &&
                        "bg-blue-50 text-blue-700 font-medium"
                      )}
                      onClick={() => {
                        onChange(channel.id.toString());
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="font-medium">{channel.channelName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {channel.swrSiteName} • {channel.swrSiteType}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function SwrHistoryTab() {
  // ==================== STATE ====================
  const [histories, setHistories] = useState<SwrHistoryItemDto[]>([]);
  const [channels, setChannels] = useState<SwrChannelListDto[]>([]);
  const [sites, setSites] = useState<SwrSiteListDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentHistory, setCurrentHistory] = useState<SwrHistoryItemDto | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    swrChannelId: "",
    date: format(new Date(), "yyyy-MM-dd"), // Format string untuk input date
    fpwr: "",
    vswr: "",
    notes: "",
    status: "Active",
  });

  // ==================== LIFECYCLE ====================

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchHistories();
  }, [currentPage, searchTerm, selectedChannel, selectedSite, selectedType]);

  // ==================== DATA LOADING ====================

  const loadInitialData = async () => {
    try {
      const [channelsData, sitesData] = await Promise.all([
        swrSignalApi.getChannels(),
        swrSignalApi.getSites(),
      ]);
      setChannels(channelsData || []);
      setSites(sitesData || []);
    } catch (error: any) {
      console.error("❌ Error loading initial data:", error);
      toast({
        title: "Error",
        description: "Failed to load sites and channels",
        variant: "destructive",
      });
    }
  };

  const fetchHistories = async () => {
    // Only show full skeleton on initial load when there's no data yet
    if (!hasLoadedOnce && histories.length === 0) {
      setIsLoading(true);
    } else {
      // Subtle loading (header spin/opacity) for subsequent fetches
      setIsLoading(true);
    }
    try {
      const query: any = {
        page: currentPage,
        pageSize,
        sortBy: "Date",
        sortDir: "desc",
      };

      if (searchTerm) query.search = searchTerm;
      if (selectedChannel !== "all") query.swrChannelId = parseInt(selectedChannel);
      if (selectedSite !== "all") query.swrSiteId = parseInt(selectedSite);
      if (selectedType !== "all") query.siteType = selectedType;

      console.log("📡 Fetching histories with query:", query);

      const response = await swrSignalApi.getHistories(query);

      console.log("📥 API Response:", response);
      console.log("📊 Data count:", response.data?.length);
      console.log("📄 Pagination:", response.meta?.pagination);

      // ✅ Extract data dari PagedResultDto
      const historiesData = response.data || [];
      const pagination = response.meta?.pagination;

      setHistories(historiesData);

      if (pagination) {
        setCurrentPage(pagination.page);
        setTotalPages(pagination.totalPages);
        setTotalCount(pagination.totalCount);

        console.log("✅ State updated:", {
          historiesCount: historiesData.length,
          page: pagination.page,
          totalPages: pagination.totalPages,
          totalCount: pagination.totalCount
        });
      } else {
        console.warn("⚠️ No pagination info in response");
        setCurrentPage(1);
        setTotalPages(1);
        setTotalCount(historiesData.length);
      }
      if (!hasLoadedOnce) setHasLoadedOnce(true);
    } catch (error: any) {
      console.error("❌ Error fetching histories:", error);
      console.error("Error details:", error.response?.data);

      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to load history data",
        variant: "destructive",
      });

      setHistories([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== MODAL HANDLERS ====================

  const openModal = (mode: "create" | "edit", history: SwrHistoryItemDto | null = null) => {
    setModalMode(mode);
    if (mode === "edit" && history) {
      setCurrentHistory(history);
      const statusString = getStatusString(history.status);

      // Format date untuk input type="date" (yyyy-MM-dd)
      const formattedDate = format(new Date(history.date), "yyyy-MM-dd");

      setFormData({
        swrChannelId: history.swrChannelId.toString(),
        date: formattedDate,
        fpwr: history.fpwr !== null && history.fpwr !== undefined ? history.fpwr.toString() : "",
        vswr: history.vswr ? history.vswr.toString() : "1.0",
        notes: history.notes || "",
        status: statusString,
      });
    } else {
      setCurrentHistory(null);
      setFormData({
        swrChannelId: "",
        date: format(new Date(), "yyyy-MM-dd"),
        fpwr: "",
        vswr: "",
        notes: "",
        status: "Active",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentHistory(null);
    setFormData({
      swrChannelId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      fpwr: "",
      vswr: "",
      notes: "",
      status: "Active",
    });
  };

  // ==================== CRUD OPERATIONS ====================

  const handleSubmit = async () => {
    try {
      // Validation
      if (modalMode === "create" && !formData.swrChannelId) {
        toast({
          title: "Validation Error",
          description: "Please select a channel",
          variant: "destructive",
        });
        return;
      }

      if (!formData.date) {
        toast({
          title: "Validation Error",
          description: "Please select a date",
          variant: "destructive",
        });
        return;
      }

      if (formData.status === "Active") {
        if (!formData.vswr.trim()) {
          toast({
            title: "Validation Error",
            description: "VSWR is required for Active status",
            variant: "destructive",
          });
          return;
        }

        const vswrValue = parseFloat(formData.vswr);
        if (isNaN(vswrValue) || vswrValue < 1.0 || vswrValue > 4.0) {
          toast({
            title: "Validation Error",
            description: "VSWR must be between 1.0 and 4.0",
            variant: "destructive",
          });
          return;
        }

        if (formData.fpwr.trim()) {
          const fpwrValue = parseFloat(formData.fpwr);
          if (isNaN(fpwrValue) || fpwrValue < 0 || fpwrValue > 200) {
            toast({
              title: "Validation Error",
              description: "FPWR must be between 0 and 200",
              variant: "destructive",
            });
            return;
          }
        }
      }

      if (formData.status !== "Active" && !formData.notes.trim()) {
        toast({
          title: "Validation Error",
          description: "Notes are required for non-Active status",
          variant: "destructive",
        });
        return;
      }

      const selectedChannelData = channels.find(
        (c) => c.id.toString() === formData.swrChannelId
      );

      if (modalMode === "create" && !selectedChannelData) {
        toast({
          title: "Validation Error",
          description: "Please select a valid channel",
          variant: "destructive",
        });
        return;
      }

      const payload: any = {
        date: formData.date,
        notes: formData.notes.trim() || null,
        status: formData.status,
      };

      if (modalMode === "create") {
        payload.swrChannelId = parseInt(formData.swrChannelId);
      }

      // Handle FPWR and VSWR based on status
      if (formData.status === "Active") {
        payload.vswr = formData.vswr ? parseFloat(formData.vswr) : 1.0;
        payload.fpwr = formData.fpwr ? parseFloat(formData.fpwr) : null;
      } else {
        payload.vswr = 1.0;
        payload.fpwr = null;
      }

      console.log("💾 Saving history:", payload);

      if (modalMode === "create") {
        await swrSignalApi.createHistory(payload);
        toast({
          title: "Success",
          description: "History record created successfully",
        });
      } else if (currentHistory) {
        const updatePayload = {
          fpwr: payload.fpwr,
          vswr: payload.vswr,
          notes: payload.notes,
          status: payload.status,
        };
        await swrSignalApi.updateHistory(currentHistory.id, updatePayload);
        toast({
          title: "Success",
          description: "History record updated successfully",
        });
      }

      closeModal();
      fetchHistories();
    } catch (error: any) {
      console.error("❌ Error saving history:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save history record",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      console.log("🗑️ Deleting history ID:", id);
      await swrSignalApi.deleteHistory(id);
      toast({
        title: "Success",
        description: "History record deleted successfully",
      });
      fetchHistories();
    } catch (error: any) {
      console.error("❌ Error deleting history:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete history record",
        variant: "destructive",
      });
    }
  };

  // ==================== HELPER FUNCTIONS ====================

  const getStatusString = (status: number | string): string => {
    const statusMap: Record<number, string> = {
      0: "Active",
      1: "Dismantled",
      2: "Removed",
      3: "Obstacle",
    };
    return typeof status === "number" ? statusMap[status] : status;
  };

  const getStatusDisplay = (status: number | string) => {
    const statusString = getStatusString(status);
    const colors: Record<string, string> = {
      Active: "bg-green-100 text-green-800 border border-green-200",
      Dismantled: "bg-red-100 text-red-800 border border-red-200",
      Removed: "bg-gray-100 text-gray-800 border border-gray-200",
      Obstacle: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[statusString] || colors.Active}`}>
        {statusString}
      </span>
    );
  };

  const getVswrColor = (vswr: number, expectedMax = 1.5): string => {
    if (vswr < expectedMax) return "text-green-700 font-semibold";
    if (vswr < 2.0) return "text-yellow-700 font-semibold";
    return "text-red-700 font-semibold";
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-xl">SWR Signal History</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Total {totalCount} records • Page {currentPage} of {totalPages}
              </p>
            </div>
            <Button
              onClick={() => openModal("create")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <span className="mr-2">+</span>
              Add New Record
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              {!hasLoadedOnce && isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Input
                  placeholder="Search channel, site, or notes..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 h-10"
                />
              )}
            </div>

            {!hasLoadedOnce && isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedSite}
                onValueChange={(v) => {
                  setSelectedSite(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by Site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {!hasLoadedOnce && isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedType}
                onValueChange={(v) => {
                  setSelectedType(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Trunking">Trunking</SelectItem>
                  <SelectItem value="Conventional">Conventional</SelectItem>
                </SelectContent>
              </Select>
            )}

            {!hasLoadedOnce && isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedChannel}
                onValueChange={(v) => {
                  setSelectedChannel(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {channels.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id.toString()}>
                      {ch.channelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Table */}
          <div className="space-y-4">
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full border-collapse">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-10">
                  <tr>
                    <th className="border p-3 text-left font-medium">No</th>
                    <th className="border p-3 text-left font-medium">Date</th>
                    <th className="border p-3 text-left font-medium">Channel</th>
                    <th className="border p-3 text-left font-medium">Site</th>
                    <th className="border p-3 text-left font-medium">Type</th>
                    <th className="border p-3 text-right font-medium">FPWR (W)</th>
                    <th className="border p-3 text-right font-medium">VSWR</th>
                    <th className="border p-3 text-center font-medium">Status</th>
                    <th className="border p-3 text-left font-medium">
                      <div className="flex items-center justify-between">
                        Notes
                        {isLoading && histories.length > 0 && (
                          <RefreshCw className="w-3 h-3 animate-spin text-blue-200" />
                        )}
                      </div>
                    </th>
                    <th className="border p-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!hasLoadedOnce && isLoading ? (
                    [...Array(pageSize)].map((_, i) => (
                      <tr key={i} className="border-b">
                        <td className="border p-3"><Skeleton className="h-4 w-4" /></td>
                        <td className="border p-3"><Skeleton className="h-4 w-20" /></td>
                        <td className="border p-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="border p-3"><Skeleton className="h-4 w-20" /></td>
                        <td className="border p-3"><Skeleton className="h-4 w-16" /></td>
                        <td className="border p-3"><Skeleton className="h-4 w-12 ml-auto" /></td>
                        <td className="border p-3"><Skeleton className="h-4 w-12 ml-auto" /></td>
                        <td className="border p-3 text-center"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></td>
                        <td className="border p-3"><Skeleton className="h-4 w-32" /></td>
                        <td className="border p-3">
                          <div className="flex gap-2 justify-center">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : histories.length > 0 ? (
                    histories.map((history, idx) => (
                      <tr key={history.id} className={cn(
                        "hover:bg-gray-50 border-b last:border-b-0 transition-opacity duration-200",
                        isLoading && "opacity-50 pointer-events-none"
                      )}>
                        <td className="border p-3 text-gray-600">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="border p-3">
                          <div className="font-medium">
                            {format(new Date(history.date), "dd/MM/yyyy")}
                          </div>
                        </td>
                        <td className="border p-3">
                          <div className="font-semibold text-blue-700">
                            {history.channelName}
                          </div>
                        </td>
                        <td className="border p-3">
                          <div className="font-medium">{history.siteName}</div>
                        </td>
                        <td className="border p-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${history.siteType === "Trunking"
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : "bg-green-100 text-green-700 border border-green-200"
                            }`}>
                            {history.siteType}
                          </span>
                        </td>
                        <td className="border p-3 text-right font-mono">
                          {history.fpwr !== null && history.fpwr !== undefined
                            ? `${history.fpwr.toFixed(1)} W`
                            : <span className="text-gray-400">-</span>}
                        </td>
                        <td className={`border p-3 text-right font-mono font-semibold ${getVswrColor(history.vswr)}`}>
                          {history.vswr.toFixed(2)}
                        </td>
                        <td className="border p-3 text-center">
                          {getStatusDisplay(history.status)}
                        </td>
                        <td className="border p-3 max-w-xs text-sm text-gray-600">
                          {history.notes ? (
                            <div className="truncate" title={history.notes}>
                              {history.notes}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>
                        <td className="border p-3">
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openModal("edit", history)}
                              className="p-1.5 h-8 w-8 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                              title="Edit"
                            >
                              ✏️
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(history.id)}
                              className="p-1.5 h-8 w-8 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                              title="Delete"
                            >
                              🗑️
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-0">
                        <Alert className="border-0 rounded-none bg-transparent">
                          <AlertDescription className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              {isLoading ? (
                                <RefreshCw className="h-16 w-16 text-blue-400 mb-4 animate-spin opacity-50" />
                              ) : (
                                <Search className="h-16 w-16 text-gray-300 mb-4" />
                              )}
                              <p className="text-lg font-semibold text-gray-700">
                                {isLoading ? "Mencari data..." : "No records found"}
                              </p>
                              <p className="text-gray-500 mt-2 max-w-md">
                                {isLoading
                                  ? "Mohon tunggu sebentar, sistem sedang memproses permintaan Anda"
                                  : searchTerm || selectedChannel !== "all" || selectedSite !== "all" || selectedType !== "all"
                                    ? "Try adjusting your search filters or clear them to see all records"
                                    : "Start by adding your first SWR history record"
                                }
                              </p>
                              {!isLoading && !searchTerm && selectedChannel === "all" && selectedSite === "all" && selectedType === "all" && (
                                <Button
                                  onClick={() => openModal("create")}
                                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                                >
                                  Add First Record
                                </Button>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ✅ PAGINATION */}
            {totalPages > 1 && !isLoading && (
              <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t gap-4">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, totalCount)} of{" "}
                  {totalCount} entries
                </div>

                <div className="flex items-center gap-2">
                  {/* First Page Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => setCurrentPage(1)}
                    title="First Page"
                    className="h-9 w-9 p-0"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>

                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    title="Previous Page"
                    className="h-9 px-3"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                  </Button>

                  {/* Page Number */}
                  <div className="flex items-center gap-1 mx-2">
                    <span className="text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>

                  {/* Next Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages || isLoading}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    title="Next Page"
                    className="h-9 px-3"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>

                  {/* Last Page Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages || isLoading}
                    onClick={() => setCurrentPage(totalPages)}
                    title="Last Page"
                    className="h-9 w-9 p-0"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {modalMode === "create" ? "Add SWR History" : "Edit SWR History"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Channel Selection */}
            <div className="space-y-2">
              <Label htmlFor="channel" className="text-sm font-semibold">
                Channel {modalMode === "create" && <span className="text-red-500">*</span>}
              </Label>
              {modalMode === "create" ? (
                <SearchableChannelSelect
                  value={formData.swrChannelId}
                  onChange={(value) =>
                    setFormData({ ...formData, swrChannelId: value })
                  }
                  channels={channels}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md border">
                  <div className="font-semibold text-blue-700">{currentHistory?.channelName}</div>
                  <div className="text-sm text-gray-600 mt-0.5">
                    {currentHistory?.siteName} • {currentHistory?.siteType}
                  </div>
                </div>
              )}
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-semibold">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="h-11"
                disabled={modalMode === "edit"}
              />
            </div>

            {/* FPWR and VSWR */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fpwr" className="text-sm font-semibold">
                  FPWR (W)
                  {formData.status === "Active" && <span className="text-xs text-gray-500 ml-2">Optional</span>}
                </Label>
                <div className="relative">
                  <Input
                    id="fpwr"
                    type="number"
                    min="0"
                    max="200"
                    placeholder="100 W"
                    value={formData.fpwr}
                    onChange={(e) =>
                      setFormData({ ...formData, fpwr: e.target.value })
                    }
                    disabled={formData.status !== "Active"}
                    className="h-11 pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    W
                  </span>
                </div>
                {formData.status !== "Active" && (
                  <p className="text-xs text-gray-500">
                    FPWR will be set to null for non-Active status
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vswr" className="text-sm font-semibold">
                  VSWR
                  {formData.status === "Active" && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="vswr"
                  type="number"
                  step="0.01"
                  min="1.0"
                  max="4.0"
                  placeholder="1.0"
                  value={formData.vswr}
                  onChange={(e) =>
                    setFormData({ ...formData, vswr: e.target.value })
                  }
                  disabled={formData.status !== "Active"}
                  className="h-11"
                />
                {formData.status !== "Active" && (
                  <p className="text-xs text-gray-500">
                    VSWR will be set to 1.0 for non-Active status
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold">Operational Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Dismantled">Dismantled</SelectItem>
                  <SelectItem value="Removed">Removed</SelectItem>
                  <SelectItem value="Obstacle">Obstacle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-semibold">
                Notes
                {formData.status !== "Active" && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <textarea
                id="notes"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-none text-sm"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder={
                  formData.status !== "Active"
                    ? "Required for non-Active status (e.g., Channel dismantled, obstacle detected, maintenance notes...)"
                    : "Optional notes for this record"
                }
                rows={4}
              />
              {formData.status !== "Active" && (
                <p className="text-xs text-red-500">
                  ⚠️ Notes are mandatory for non-Active status
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeModal}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading
                ? "Saving..."
                : modalMode === "create"
                  ? "Create Record"
                  : "Update Record"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}