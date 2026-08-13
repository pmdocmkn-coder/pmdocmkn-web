import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}: PaginationProps) {
  if (totalCount === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Generate page numbers to display (show up to 5 page numbers)
  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const pages: number[] = [];
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t rounded-b-[14px] border-gray-100 mt-2">
      <div className="text-[13px] text-[#4A5568] font-medium">
        Menampilkan {startItem} s/d {endItem} dari {totalCount} data
      </div>
      
      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-[13px] rounded bg-white border-[#E2E8F0] text-[#4A5568] hover:bg-[#F7F8FA] hover:text-[#1A202C] shadow-sm font-medium"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>

        {pageNumbers.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            className={`h-8 w-8 p-0 rounded shadow-sm text-[13px] font-medium transition-colors ${
              page === currentPage 
                ? "bg-[#2A4365] hover:bg-[#1A365D] text-white border-transparent" 
                : "bg-white border-[#E2E8F0] text-[#4A5568] hover:bg-[#F7F8FA]"
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-[13px] rounded bg-white border-[#E2E8F0] text-[#4A5568] hover:bg-[#F7F8FA] hover:text-[#1A202C] shadow-sm font-medium"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
