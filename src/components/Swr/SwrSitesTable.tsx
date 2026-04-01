import React, { useState } from "react";
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
} from "@/components/ui/dialog";
import { Edit2, Trash2, Search, ChevronLeft, ChevronRight, Check, ChevronDown, Filter, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SwrSiteListDto } from "@/types/swr";

interface Props {
  sites: SwrSiteListDto[];
  loading: boolean;
  onEdit?: (site: SwrSiteListDto) => void;
  onDelete?: (id: number) => void;
}

export default function SwrSitesTable({
  sites,
  loading,
  onEdit,
  onDelete,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [activeMobileFilter, setActiveMobileFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const sitesPerPage = 10;

  // Filter sites
  const getFilteredSites = () => {
    let filtered = sites;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (site) =>
          site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== "all") {
      filtered = filtered.filter((site) => site.type === selectedType);
    }

    return filtered;
  };

  // Pagination
  const getPaginatedSites = () => {
    const filtered = getFilteredSites();
    const start = (currentPage - 1) * sitesPerPage;
    const end = start + sitesPerPage;
    return filtered.slice(start, end);
  };

  const totalPages = Math.ceil(getFilteredSites().length / sitesPerPage);

  // Removed the early return for loading to allow integrated skeletons

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Input
              placeholder="Search sites by name or location..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
            />
          )}
        </div>

        {loading ? (
          <Skeleton className="h-10 w-full md:w-[200px]" />
        ) : (
          <>
            {/* Mobile Filter Button */}
            <div className="md:hidden flex overflow-x-auto gap-2 pb-1 no-scrollbar">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveMobileFilter("type")}
                className={cn(
                  "rounded-full whitespace-nowrap flex items-center gap-2 h-9 px-4 text-sm font-medium transition-colors border-gray-200",
                  selectedType !== "all" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
                )}
              >
                <span>Tipe: {selectedType === "all" ? "Semua Tipe" : selectedType}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-50" />
              </Button>
            </div>

            {/* Desktop Filter Dropdown */}
            <div className="hidden md:block">
              <Select
                value={selectedType}
                onValueChange={(v) => {
                  setSelectedType(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[200px] bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">
                    All Types
                  </SelectItem>
                  <SelectItem value="Trunking" className="text-gray-900 hover:bg-gray-50">
                    Trunking
                  </SelectItem>
                  <SelectItem value="Conventional" className="text-gray-900 hover:bg-gray-50">
                    Conventional
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      {/* Table */}
      {getPaginatedSites().length > 0 ? (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 hover:bg-transparent">
                  <TableHead className="text-gray-700 font-semibold">No</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Site Name</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Type</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Location</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Channels</TableHead>
                  <TableHead className="text-gray-700 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(sitesPerPage)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  getPaginatedSites().map((site, idx) => (
                    <TableRow
                      key={site.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <TableCell className="text-gray-600">
                        {(currentPage - 1) * sitesPerPage + idx + 1}
                      </TableCell>
                      <TableCell className="text-gray-900 font-semibold">
                        {site.name}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${site.type === "Trunking"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                            }`}
                        >
                          {site.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {site.location || "-"}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm font-medium">
                          {site.channelCount} channel{site.channelCount !== 1 ? "s" : ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {onEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEdit(site)}
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onDelete(site.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-3">
            {loading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
            ) : (
              getPaginatedSites().map((site, idx) => (
                <div key={site.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 block">#{(currentPage - 1) * sitesPerPage + idx + 1}</span>
                      <h4 className="text-base font-bold text-gray-900">{site.name}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${site.type === "Trunking" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                      {site.type}
                    </span>
                  </div>
                  <div className="py-2 mb-2 border-y border-gray-50 space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-gray-500">Location:</span><span className="text-gray-700">{site.location || "-"}</span></div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Channels:</span>
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">{site.channelCount}</span>
                    </div>
                  </div>
                  {(onEdit || onDelete) && (
                    <div className="flex justify-end gap-2">
                      {onEdit && (
                        <Button size="sm" variant="outline" className="h-8 flex-1 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => onEdit(site)}>
                          <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                        </Button>
                      )}
                      {onDelete && (
                        <Button size="sm" variant="outline" className="h-8 flex-1 border-red-200 text-red-700 hover:bg-red-50" onClick={() => onDelete(site.id)}>
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <div className="flex gap-2 justify-center md:justify-start">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Previous</span>
                </Button>
              </div>
              <span className="text-sm text-gray-600 text-center">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2 justify-center md:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : loading ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 hover:bg-transparent">
                <TableHead className="text-gray-700 font-semibold">No</TableHead>
                <TableHead className="text-gray-700 font-semibold">Site Name</TableHead>
                <TableHead className="text-gray-700 font-semibold">Type</TableHead>
                <TableHead className="text-gray-700 font-semibold">Location</TableHead>
                <TableHead className="text-gray-700 font-semibold">Channels</TableHead>
                <TableHead className="text-gray-700 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">
            {searchTerm || selectedType !== "all"
              ? "No sites match your filters."
              : "No sites found. Create your first site to get started."}
          </p>
        </div>
      )}

      {/* Mobile Drawer */}
      <Dialog open={!!activeMobileFilter} onOpenChange={(open) => { if (!open) setActiveMobileFilter(null); }}>
        <DialogContent className="fixed bottom-0 top-auto translate-y-0 sm:bottom-0 sm:top-auto sm:translate-y-0 max-w-full sm:max-w-[500px] rounded-t-2xl rounded-b-none p-0 overflow-hidden border-x-0 border-b-0 animate-in slide-in-from-bottom duration-300">
          <DialogHeader className="p-4 border-b bg-gray-50/80">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              Pilih Tipe Site
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-4 pb-12">
            <div className="grid grid-cols-1 gap-2">
              {["all", "Trunking", "Conventional"].map((t) => (
                <button key={t} onClick={() => { setSelectedType(t); setCurrentPage(1); setActiveMobileFilter(null); }}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center",
                    selectedType === t ? "bg-blue-50 border-blue-200 text-blue-700 font-bold" : "bg-white border-gray-100 text-gray-700"
                  )}>
                  {t === "all" ? "Semua Tipe" : t}
                  {selectedType === t && <Check className="w-5 h-5 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}