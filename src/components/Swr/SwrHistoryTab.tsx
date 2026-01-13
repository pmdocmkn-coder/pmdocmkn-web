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
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Search,
} from "lucide-react";

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

export default function SwrHistoryTab() {
  // ==================== STATE ====================
  const [histories, setHistories] = useState<SwrHistoryItemDto[]>([]);
  const [channels, setChannels] = useState<SwrChannelListDto[]>([]);
  const [sites, setSites] = useState<SwrSiteListDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentHistory, setCurrentHistory] = useState<SwrHistoryItemDto | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    swrChannelId: 0,
    date: "",
    fpwr: null as number | null,
    vswr: 1.0,
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
    setIsLoading(true);
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

      const result = await swrSignalApi.getHistories(query);

      console.log("✅ Histories loaded:", {
        dataCount: result.data?.length,
        page: result.page,
        totalPages: result.totalPages,
        totalCount: result.totalCount,
      });

      // ✅ PERBAIKAN: Handle both nested meta.pagination and flat structure
      let pageData, totalPagesData, totalCountData;

      if (result.meta && result.meta.pagination) {
        // Struktur dengan nested meta
        pageData = result.meta.pagination.page || 1;
        totalPagesData = result.meta.pagination.totalPages || 1;
        totalCountData = result.meta.pagination.totalCount || 0;
      } else {
        // Fallback: struktur flat
        pageData = result.page || 1;
        totalPagesData = result.totalPages || 1;
        totalCountData = result.totalCount || 0;
      }

      setHistories(result.data || []);
      setTotalPages(totalPagesData);
      setTotalCount(totalCountData);
      setCurrentPage(pageData);

      console.log("✅ State updated:", {
        historiesCount: result.data?.length || 0,
        currentPage: pageData,
        totalPages: totalPagesData,
        totalCount: totalCountData,
      });
    } catch (error: any) {
      console.error("❌ Error fetching histories:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load history data",
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
      setFormData({
        swrChannelId: history.swrChannelId,
        date: format(new Date(history.date), "yyyy-MM-dd"),
        fpwr: history.fpwr || null,
        vswr: history.vswr || 1.0,
        notes: history.notes || "",
        status: statusString,
      });
    } else {
      setCurrentHistory(null);
      setFormData({
        swrChannelId: 0,
        date: format(new Date(), "yyyy-MM-dd"),
        fpwr: null,
        vswr: 1.0,
        notes: "",
        status: "Active",
      });
    }
    setIsModalOpen(true);
  };

  // ==================== CRUD OPERATIONS ====================

  const handleSubmit = async () => {
    try {
      if (formData.status !== "Active" && !formData.notes?.trim()) {
        toast({
          title: "Validation Error",
          description: "Catatan wajib diisi untuk status non-Active",
          variant: "destructive",
        });
        return;
      }

      const selectedChannelData = channels.find(
        (c) => c.id === formData.swrChannelId
      );

      if (!selectedChannelData) {
        toast({
          title: "Validation Error",
          description: "Please select a valid channel",
          variant: "destructive",
        });
        return;
      }

      if (formData.vswr < 1.0 || formData.vswr > 3.0) {
        toast({
          title: "Validation Error",
          description: "VSWR harus antara 1.0 hingga 3.0",
          variant: "destructive",
        });
        return;
      }

      if (selectedChannelData.swrSiteType === "Trunking" && formData.fpwr !== null) {
        if (formData.fpwr < 0 || formData.fpwr > 200) {
          toast({
            title: "Validation Error",
            description: "FPWR harus antara 0 hingga 200",
            variant: "destructive",
          });
          return;
        }
      }

      const payload: any = {
        swrChannelId: formData.swrChannelId,
        date: formData.date,
        fpwr: formData.status === "Active" ? formData.fpwr : null,
        vswr: formData.status === "Active" ? formData.vswr : 1.0,
        notes: formData.notes || null,
        status: formData.status,
      };

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

      setIsModalOpen(false);
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
      Active: "bg-green-100 text-green-800",
      Dismantled: "bg-red-100 text-red-800",
      Removed: "bg-gray-100 text-gray-800",
      Obstacle: "bg-yellow-100 text-yellow-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[statusString] || colors.Active}`}>
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>SWR Signal History</CardTitle>
            <Button onClick={() => openModal("create")}>
              <span className="mr-2">+</span>
              Add Record
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            <Select
              value={selectedSite}
              onValueChange={(v) => {
                setSelectedSite(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
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

            <Select
              value={selectedType}
              onValueChange={(v) => {
                setSelectedType(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Trunking">Trunking</SelectItem>
                <SelectItem value="Conventional">Conventional</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedChannel}
              onValueChange={(v) => {
                setSelectedChannel(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
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
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3">Loading...</span>
            </div>
          ) : histories.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2 text-left">No</th>
                      <th className="border p-2 text-left">Date</th>
                      <th className="border p-2 text-left">Channel</th>
                      <th className="border p-2 text-left">Site</th>
                      <th className="border p-2 text-left">Type</th>
                      <th className="border p-2 text-right">FPWR (W)</th>
                      <th className="border p-2 text-right">VSWR</th>
                      <th className="border p-2 text-center">Status</th>
                      <th className="border p-2 text-left">Notes</th>
                      <th className="border p-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {histories.map((history, idx) => (
                      <tr key={history.id} className="hover:bg-gray-50">
                        <td className="border p-2">{(currentPage - 1) * pageSize + idx + 1}</td>
                        <td className="border p-2">
                          {format(new Date(history.date), "dd/MM/yyyy")}
                        </td>
                        <td className="border p-2 font-semibold">{history.channelName}</td>
                        <td className="border p-2">{history.siteName}</td>
                        <td className="border p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            history.siteType === "Trunking" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                          }`}>
                            {history.siteType}
                          </span>
                        </td>
                        <td className="border p-2 text-right font-mono">
                          {history.fpwr !== null && history.fpwr !== undefined
                            ? history.fpwr.toFixed(1)
                            : "-"}
                        </td>
                        <td className={`border p-2 text-right font-mono ${getVswrColor(history.vswr)}`}>
                          {history.vswr.toFixed(2)}
                        </td>
                        <td className="border p-2 text-center">
                          {getStatusDisplay(history.status)}
                        </td>
                        <td className="border p-2 max-w-xs truncate text-sm text-gray-600">
                          {history.notes || "-"}
                        </td>
                        <td className="border p-2">
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openModal("edit", history)}
                              className="p-1"
                            >
                              ✏️
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(history.id)}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              🗑️
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ✅ PAGINATION - Enhanced like NEC */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-2">
                    {/* First Page Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1 || isLoading}
                      onClick={() => setCurrentPage(1)}
                      title="First Page"
                    >
                      <ChevronsLeft className="h-4 w-4 mr-1" />
                      First
                    </Button>

                    {/* Previous Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1 || isLoading}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      title="Previous Page"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                  </div>

                  {/* Page Info */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({totalCount} total records)
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {/* Next Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages || isLoading}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      title="Next Page"
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
                    >
                      Last
                      <ChevronsRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Alert>
              <AlertDescription className="text-center py-8">
                <div className="flex flex-col items-center justify-center">
                  <Search className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-lg font-medium">No records found</p>
                  <p className="text-gray-600 mt-1">
                    {searchTerm || selectedChannel !== "all" || selectedSite !== "all"
                      ? "Try adjusting your filters"
                      : "Click 'Add Record' to create your first entry"}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" ? "Add SWR History" : "Edit SWR History"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="channel">Channel *</Label>
              <Select
                value={formData.swrChannelId.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, swrChannelId: parseInt(value) })
                }
                disabled={modalMode === "edit"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id.toString()}>
                      {ch.channelName} - {ch.swrSiteName} ({ch.swrSiteType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                disabled={modalMode === "edit"}
              />
            </div>

            <div>
              <Label htmlFor="fpwr">
                FPWR (Watt)
                {formData.status !== "Active" && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Auto-null for non-active status)
                  </span>
                )}
              </Label>
              <Input
                id="fpwr"
                type="number"
                step="0.1"
                min="0"
                max="200"
                value={formData.fpwr || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fpwr: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                disabled={formData.status !== "Active"}
                placeholder="Optional for Trunking type"
              />
            </div>

            <div>
              <Label htmlFor="vswr">
                VSWR *
                {formData.status !== "Active" && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Auto 1.0 for non-active)
                  </span>
                )}
              </Label>
              <Input
                id="vswr"
                type="number"
                step="0.01"
                min="1.0"
                max="3.0"
                value={formData.vswr}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vswr: parseFloat(e.target.value) || 1.0,
                  })
                }
                disabled={formData.status !== "Active"}
              />
            </div>

            <div>
              <Label htmlFor="status">Operational Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
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

            <div>
              <Label htmlFor="notes">
                Notes
                {formData.status !== "Active" && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>
              <textarea
                id="notes"
                className="w-full p-2 border rounded-md min-h-[80px]"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Required for non-Active status (e.g., Channel dismantled, obstacle detected)"
              />
              {formData.status !== "Active" && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ Notes are mandatory for non-Active status
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {modalMode === "create" ? "Create" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}