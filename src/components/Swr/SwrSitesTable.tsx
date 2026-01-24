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
import { Edit2, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SwrSiteListDto } from "@/types/swr";

interface Props {
  sites: SwrSiteListDto[];
  loading: boolean;
  onEdit: (site: SwrSiteListDto) => void;
  onDelete: (id: number) => void;
}

export default function SwrSitesTable({
  sites,
  loading,
  onEdit,
  onDelete,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
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
          <Select
            value={selectedType}
            onValueChange={(v) => {
              setSelectedType(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-[200px] bg-white border-gray-300 text-gray-900">
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
        )}
      </div>

      {/* Table */}
      {getPaginatedSites().length > 0 ? (
        <>
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(site)}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDelete(site.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
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
    </div>
  );
}