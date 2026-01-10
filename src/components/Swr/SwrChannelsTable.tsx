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
import { SwrChannelListDto } from "@/types/swr";

interface Props {
  channels: SwrChannelListDto[];
  loading: boolean;
  onEdit: (channel: SwrChannelListDto) => void;
  onDelete: (id: number) => void;
}

export default function SwrChannelsTable({
  channels,
  loading,
  onEdit,
  onDelete,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const channelsPerPage = 16;

  // Get unique sites for filter
  const getUniqueSites = () => {
    const sites = Array.from(
      new Set(channels.map((ch) => ch.swrSiteName))
    ).sort();
    return sites;
  };

  // Filter channels
  const getFilteredChannels = () => {
    let filtered = channels;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (channel) =>
          channel.channelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          channel.swrSiteName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Site filter
    if (selectedSite !== "all") {
      filtered = filtered.filter((channel) => channel.swrSiteName === selectedSite);
    }

    // Type filter
    if (selectedType !== "all") {
      filtered = filtered.filter((channel) => channel.swrSiteType === selectedType);
    }

    return filtered;
  };

  // Pagination
  const getPaginatedChannels = () => {
    const filtered = getFilteredChannels();
    const start = (currentPage - 1) * channelsPerPage;
    const end = start + channelsPerPage;
    return filtered.slice(start, end);
  };

  const totalPages = Math.ceil(getFilteredChannels().length / channelsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-700">Loading channels...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search channels by name or site..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
          />
        </div>

        <Select
          value={selectedSite}
          onValueChange={(v) => {
            setSelectedSite(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full md:w-[200px] bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Filter by Site" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">
              All Sites
            </SelectItem>
            {getUniqueSites().map((site) => (
              <SelectItem key={site} value={site} className="text-gray-900 hover:bg-gray-50">
                {site}
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
          <SelectTrigger className="w-full md:w-[180px] bg-white border-gray-300 text-gray-900">
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

      {/* Table */}
      {getPaginatedChannels().length > 0 ? (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 hover:bg-transparent">
                  <TableHead className="text-gray-700 font-semibold">No</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Channel Name</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Site Name</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Type</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Expected SWR Max</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Expected PWR Max</TableHead>
                  <TableHead className="text-gray-700 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getPaginatedChannels().map((channel, idx) => (
                  <TableRow
                    key={channel.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <TableCell className="text-gray-600">
                      {(currentPage - 1) * channelsPerPage + idx + 1}
                    </TableCell>
                    <TableCell className="text-gray-900 font-semibold">
                      {channel.channelName}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {channel.swrSiteName}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          channel.swrSiteType === "Trunking"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {channel.swrSiteType}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600 font-mono">
                      {channel.expectedSwrMax.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-gray-600 font-mono">
                      {channel.expectedPwrMax !== null && channel.expectedPwrMax !== undefined
                        ? `${channel.expectedPwrMax.toFixed(0)}W`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(channel)}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDelete(channel.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
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
                Page {currentPage} of {totalPages} ({getFilteredChannels().length} total)
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
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">
            {searchTerm || selectedSite !== "all" || selectedType !== "all"
              ? "No channels match your filters."
              : "No channels found. Create your first channel to get started."}
          </p>
        </div>
      )}
    </div>
  );
}