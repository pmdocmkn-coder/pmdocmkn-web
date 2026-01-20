import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Plus,
  RefreshCw,
  BarChart3,
  LayoutGrid,
  List,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FileSpreadsheetIcon,
} from "lucide-react";
import { swrSignalApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import SwrSitesTable from "./SwrSitesTable";
import SwrChannelsTable from "./SwrChannelsTable";
import SwrSiteDialog from "./SwrSiteDialog";
import SwrChannelDialog from "./SwrChannelDialog";
import SwrPivotTable from "./SwrPivotTable";
import SwrHistoryTab from "@/components/Swr/SwrHistoryTab";
import { SwrSiteListDto, SwrChannelListDto, SwrImportResultDto } from "@/types/swr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SwrYearlyDashboard from "./SwrYearlyDashboard";

export default function SwrSignalPage() {
  const [sites, setSites] = useState<SwrSiteListDto[]>([]);
  const [channels, setChannels] = useState<SwrChannelListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSiteDialog, setShowSiteDialog] = useState(false);
  const [showChannelDialog, setShowChannelDialog] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportInstructions, setShowImportInstructions] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [editingSite, setEditingSite] = useState<SwrSiteListDto | null>(null);
  const [editingChannel, setEditingChannel] =
    useState<SwrChannelListDto | null>(null);
  const { toast } = useToast();

  const loadSites = async () => {
    try {
      setLoading(true);
      const data = await swrSignalApi.getSites();
      setSites(data);
      console.log("✅ Sites loaded:", data.length);
    } catch (error: any) {
      console.error("❌ Error loading sites:", error);
      toast({
        title: "Error Loading Sites",
        description: error.message || "Failed to load sites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async () => {
    try {
      const data = await swrSignalApi.getChannels();
      setChannels(data);
      console.log("✅ Channels loaded:", data.length);
    } catch (error: any) {
      console.error("❌ Error loading channels:", error);
      toast({
        title: "Error Loading Channels",
        description: error.message || "Failed to load channels",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadSites();
    loadChannels();
  }, []);

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "No File Selected",
        description: "Please select an Excel file to import",
        variant: "destructive",
      });
      return;
    }

    try {
      setImporting(true);
      setImportResult(null);

      console.log("📤 Starting import:", importFile.name);

      // ✅ Backend already returns SwrImportResultDto format
      const result = await swrSignalApi.importExcel(importFile);

      console.log("✅ Import completed:", result);

      setImportResult(result);

      // ✅ Check success flag
      if (result.success && result.errors.length === 0) {
        toast({
          title: "Import Successful",
          description: result.message,
        });
        setShowImportModal(false);
        setImportFile(null);
        loadSites();
        loadChannels();
      } else if (result.errors.length > 0) {
        toast({
          title: "Import Completed with Errors",
          description: `${result.recordsCreated} created, ${result.recordsUpdated} updated, ${result.errors.length} errors`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Import Successful",
          description: result.message,
        });
        setShowImportModal(false);
        setImportFile(null);
        loadSites();
        loadChannels();
      }
    } catch (error: any) {
      console.error("❌ Import error:", error);
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleSiteSaved = () => {
    setEditingSite(null);
    setShowSiteDialog(false);
    loadSites();
  };

  const handleChannelSaved = () => {
    setEditingChannel(null);
    setShowChannelDialog(false);
    loadChannels();
  };

  const handleEditSite = (site: SwrSiteListDto) => {
    setEditingSite(site);
    setShowSiteDialog(true);
  };

  const handleEditChannel = (channel: SwrChannelListDto) => {
    setEditingChannel(channel);
    setShowChannelDialog(true);
  };

  const handleDeleteSite = async (id: number) => {
    const site = sites.find((s) => s.id === id);
    if (!site) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${site.name}"?\n\n` +
      (site.channelCount > 0
        ? `⚠️ This site has ${site.channelCount} channel(s). Delete will fail if channels exist.`
        : "This action cannot be undone.")
    );

    if (!confirmed) return;

    try {
      console.log("🗑️ Attempting to delete site:", id);

      await swrSignalApi.deleteSite(id);

      toast({
        title: "Success",
        description: `Site "${site.name}" deleted successfully`,
      });

      loadSites();
    } catch (error: any) {
      console.error("❌ Delete site error:", error);

      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete site",
        variant: "destructive",
      });
    }
  };

  const handleDeleteChannel = async (id: number) => {
    const channel = channels.find((c) => c.id === id);
    if (!channel) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${channel.channelName}" from ${channel.swrSiteName}?\n\n` +
      "⚠️ This will also delete all history records for this channel.\n" +
      "This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      console.log("🗑️ Attempting to delete channel:", id);

      await swrSignalApi.deleteChannel(id);

      toast({
        title: "Success",
        description: `Channel "${channel.channelName}" deleted successfully`,
      });

      loadChannels();
    } catch (error: any) {
      console.error("❌ Delete channel error:", error);

      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete channel",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const csvContent = `No,Channel,Jan-25 VSWR,Jan-25 FPWR,Feb-25 VSWR,Feb-25 FPWR,Mar-25 VSWR,Mar-25 FPWR
1,Channel 001,1.2,45.5,1.3,46.0,1.1,44.8
2,Channel 002,1.4,47.2,1.3,46.5,1.5,48.0
3,Channel 003,1.1,44.0,1.2,45.0,1.0,43.5`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "SWR_Import_Template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast({
      description: "Template downloaded successfully",
    });
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header - Clean, no background */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            SWR Signal Management
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage your SWR sites and channels
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowImportInstructions(true)}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <AlertCircle className="w-4 h-4 mr-2" /> Import Guide
          </Button>
          <Button
            onClick={() => setShowImportModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Upload className="w-4 h-4 mr-2" /> Import Excel
          </Button>
          <Button
            onClick={() => {
              setEditingSite(null);
              setShowSiteDialog(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" /> New Site
          </Button>
          <Button
            onClick={() => {
              setEditingChannel(null);
              setShowChannelDialog(true);
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" /> New Channel
          </Button>
        </div>
      </div>

      {/* Tabs - NEC Style */}
      <Tabs defaultValue="analytics" className="w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <TabsList className="flex flex-wrap gap-3 bg-transparent border-0 p-0 h-auto">
            <TabsTrigger value="history">
              📋 History Records
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="px-4 py-2 rounded-lg font-medium transition-colors border-0 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-none text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>

            <TabsTrigger
              value="yearly-dashboard"
              className="px-4 py-2 rounded-lg font-medium transition-colors border-0 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-none text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <FileSpreadsheetIcon className="w-4 h-4 mr-2" />
              Yearly Dashboard
            </TabsTrigger>

            <TabsTrigger
              value="sites"
              className="px-4 py-2 rounded-lg font-medium transition-colors border-0 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-none text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Sites ({sites.length})
            </TabsTrigger>

            <TabsTrigger
              value="channels"
              className="px-4 py-2 rounded-lg font-medium transition-colors border-0 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-none text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <List className="w-4 h-4 mr-2" />
              Channels ({channels.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Analytics Tab - Full width with spacing */}
        <TabsContent value="analytics" className="mt-0 outline-none">
          <SwrPivotTable />
        </TabsContent>

        <TabsContent value="yearly-dashboard" className="mt-0 outline-none">
          <SwrYearlyDashboard />
        </TabsContent>

        <TabsContent value="history">
          <SwrHistoryTab />
        </TabsContent>

        {/* Sites Tab */}
        <TabsContent value="sites" className="mt-0 outline-none">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">All Sites</h2>
              <Button
                variant="outline"
                onClick={() => loadSites()}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            <SwrSitesTable
              sites={sites}
              loading={loading}
              onEdit={handleEditSite}
              onDelete={handleDeleteSite}
            />
          </div>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="mt-0 outline-none">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">All Channels</h2>
              <Button
                variant="outline"
                onClick={() => loadChannels()}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            <SwrChannelsTable
              channels={channels}
              loading={loading}
              onEdit={handleEditChannel}
              onDelete={handleDeleteChannel}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SwrSiteDialog
        open={showSiteDialog}
        onOpenChange={setShowSiteDialog}
        site={editingSite}
        onSaved={handleSiteSaved}
      />
      <SwrChannelDialog
        open={showChannelDialog}
        onOpenChange={setShowChannelDialog}
        channel={editingChannel}
        sites={sites}
        onSaved={handleChannelSaved}
      />

      {/* Import Instructions Modal */}
      <Dialog open={showImportInstructions} onOpenChange={setShowImportInstructions}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">📥 Excel Import Guide</DialogTitle>
            <DialogDescription>
              Complete guide for importing SWR data in the new grouped-by-site format
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Format Overview */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">New Format: Grouped by Site</AlertTitle>
              <AlertDescription className="text-blue-800">
                Data is now organized by site, with each site having its own header and table section.
              </AlertDescription>
            </Alert>

            {/* Structure */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg">📋 File Structure</h3>
              <div className="bg-gray-50 p-4 rounded-lg border space-y-2 font-mono text-xs">
                <div className="bg-blue-600 text-white px-2 py-1 rounded">
                  [SITE NAME] ← Merged header
                </div>
                <div className="bg-blue-500 text-white px-2 py-1 rounded">
                  No | Name Channel | Jan-25 | Feb-25 | Mar-25...
                </div>
                <div className="bg-blue-400 text-white px-2 py-1 rounded">
                  [empty] | [empty] | VSWR FPWR | VSWR FPWR...
                </div>
                <div className="bg-white px-2 py-1 rounded border">
                  1 | Channel 006 | 1.1 | 68 | 1.1 | 67...
                </div>
                <div className="h-2 border-b-2 border-dashed"></div>
                <div className="bg-blue-600 text-white px-2 py-1 rounded">
                  [NEXT SITE NAME]
                </div>
              </div>
            </div>

            {/* Header Format */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg">📝 Header Format (3 Rows per Site)</h3>
              <ul className="space-y-2 text-sm list-disc pl-5">
                <li><strong>Row 1:</strong> Site name merged across all columns</li>
                <li><strong>Row 2:</strong> "No" | "Name Channel" | Month headers (Jan-25, Feb-25...) merged 2 cols each</li>
                <li><strong>Row 3:</strong> Sub-headers alternating "VSWR" | "FPWR" under each month</li>
              </ul>
            </div>

            {/* Data Requirements */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg">✅ Data Requirements</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-3 bg-green-50">
                  <h4 className="font-semibold text-sm text-green-700 mb-2">Required</h4>
                  <ul className="text-xs space-y-1 list-disc pl-4">
                    <li>Site must exist in database</li>
                    <li>Month format: Jan-25, Feb-25, etc.</li>
                    <li>VSWR: 1.0 - 4.0</li>
                    <li>Column order: VSWR then FPWR</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-3 bg-blue-50">
                  <h4 className="font-semibold text-sm text-blue-700 mb-2">Optional</h4>
                  <ul className="text-xs space-y-1 list-disc pl-4">
                    <li>FPWR: 0 - 200 (can be empty)</li>
                    <li>Channels auto-created if missing</li>
                    <li>Empty rows are skipped</li>
                    <li>Notes not supported in import</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Import Behavior */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg">🔄 Import Behavior</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <div><strong>New Records:</strong> Created if channel + month doesn't exist</div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">↻</span>
                  <div><strong>Existing Records:</strong> Updated with new values</div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">+</span>
                  <div><strong>Auto-Create Channels:</strong> New channels created with default thresholds (VSWR: 1.5, PWR: 100W)</div>
                </div>
              </div>
            </div>

            {/* Quick Reference */}
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
              <h4 className="font-bold text-sm text-yellow-400 mb-3">⚡ Quick Reference</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-gray-400">Columns per month:</div>
                  <div className="font-mono">2 (VSWR + FPWR)</div>
                </div>
                <div>
                  <div className="text-gray-400">Total columns:</div>
                  <div className="font-mono">2 + (12 × 2) = 26</div>
                </div>
                <div>
                  <div className="text-gray-400">Header rows per site:</div>
                  <div className="font-mono">3 rows</div>
                </div>
                <div>
                  <div className="text-gray-400">Site separation:</div>
                  <div className="font-mono">1 empty row</div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowImportInstructions(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowImportInstructions(false);
                setShowImportModal(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Start Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Import SWR Data from Excel</DialogTitle>
            <DialogDescription>
              Upload your Excel file with SWR history data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImportFile(file);
                  setImportResult(null);
                }}
                className="hidden"
                id="excel-upload"
              />
              <label htmlFor="excel-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <div className="text-gray-600 mb-2">
                  {importFile ? (
                    <span className="font-medium text-green-600">
                      {importFile.name}
                    </span>
                  ) : (
                    "Click to select Excel file (.xlsx, .xls)"
                  )}
                </div>
                <Button variant="secondary" asChild>
                  <span>Choose File</span>
                </Button>
              </label>
            </div>

            {importResult && (
              <Alert variant={importResult.success ? "default" : "destructive"}>
                {importResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {importResult.success ? "Import Successful!" : "Import Completed with Errors"}
                </AlertTitle>
                <AlertDescription>
                  <div className="space-y-2 mt-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Plus className="w-3 h-3 text-green-600" />
                        <span>Created: <strong>{importResult.recordsCreated}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-3 h-3 text-blue-600" />
                        <span>Updated: <strong>{importResult.recordsUpdated}</strong></span>
                      </div>
                      {importResult.channelsCreated > 0 && (
                        <div className="flex items-center gap-2 col-span-2">
                          <CheckCircle2 className="w-3 h-3 text-purple-600" />
                          <span>Channels Auto-Created: <strong>{importResult.channelsCreated}</strong></span>
                        </div>
                      )}
                    </div>

                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="font-semibold text-xs mb-1">
                          Errors ({importResult.errors.length}):
                        </p>
                        <ul className="list-disc pl-5 text-xs max-h-32 overflow-y-auto space-y-1">
                          {importResult.errors.slice(0, 5).map((err: string, idx: number) => (
                            <li key={idx}>{err}</li>
                          ))}
                          {importResult.errors.length > 5 && (
                            <li className="text-gray-500">
                              ... and {importResult.errors.length - 5} more errors
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <p className="font-semibold mb-2">Quick Tips:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  Ensure all channels exist in the database before importing
                </li>
                <li>Use the correct date format (MMM-yy)</li>
                <li>VSWR values should be between 1.0 and 4.0</li>
                <li>Check the Import Guide for detailed instructions</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowImportModal(false);
                setImportFile(null);
                setImportResult(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importFile || importing}>
              {importing ? "Importing..." : "Upload & Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}