import React, { useCallback, useEffect, useState, useRef, useMemo, Fragment } from "react";
import { format, startOfMonth, endOfMonth, parse, formatISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Search, Filter, Warehouse, PackageCheck, Image as ImageIcon, Loader2, ArrowRight, User, FileText, MessageSquare, ArrowDownLeft, ArrowUpRight, Home, ChevronRight, ChevronLeft, Inbox, ClipboardList, Edit, Eye, ArrowLeft, Undo2, ChevronUp, ChevronDown } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { useNavigate, useSearchParams } from "react-router-dom";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import { radioRepairApi } from "../../services/radioRepairApi";
import type { RadioHandoverList, RadioHandoverDetail } from "../../types/radioHandover";
import type { RadioRepairJobList, RadioRepairJobDetail } from "../../types/radioRepair";
import RadioRepairJobDetailPanel from "../RadioRepair/RadioRepairJobDetailPanel";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";
import { ResponsiveModal } from "../common/ResponsiveModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import SignaturePadField from "../common/SignaturePadField";
import ImageGalleryModal from "../common/ImageGalleryModal";
import WarehouseToHelpdeskForm from "./WarehouseToHelpdeskForm";
import HandoverStatusBadge from "./HandoverStatusBadge";
import HandoverTagPreview from "./HandoverTagPreview";
import HandoverTimeline from "./HandoverTimeline";
import { LazyPhotoThumb } from "./LazyPhotoThumb";
import { asImageSrc, resolveHandoverPhotos } from "../../utils/handoverPhotoUtils";
import { canCreateHandoverWhHd } from "../../utils/handoverPermissions";
import { useToast } from "../../hooks/use-toast";
import { SinglePeriodFilter, type PeriodFilterValue } from "../ui/SinglePeriodFilter";
import EditHandoverDialog from "./EditHandoverDialog";
import ChangeReceiverModal from "./ChangeReceiverModal";
import Pagination from "../common/Pagination";
import { useDebounce } from "../../hooks/useDebounce";
import { Input } from "../ui/input";

function handoverTypeLabel(t: string) {
  if (t === "HelpdeskToTechnician") return "HD → Tek";
  if (t === "TechnicianToWarehouse") return "Tek → WH";
  if (t === "WarehouseToHelpdesk") return "WH → HD";
  if (t === "HelpdeskToWarehouse") return "HD → WH";
  return t;
}

function handoverTypeBadgeClass(t: string) {
  if (t === "TechnicianToWarehouse") return "bg-[#EBF4FF] text-[#2B6CB0] border-[#2B6CB0]/20";
  if (t === "WarehouseToHelpdesk") return "bg-[#FFF0EC] text-[#D94F2B] border-[#D94F2B]/20";
  if (t === "HelpdeskToWarehouse") return "bg-[#FFF8E1] text-[#B7791F] border-[#B7791F]/20";
  return "bg-[#F7F8FA] text-[#718096] border-[#E2E8F0]";
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <Inbox className="w-7 h-7 text-gray-400" />
      </div>
      <p className="text-gray-500 font-medium">{message}</p>
      <p className="text-xs text-gray-400 mt-1">Data akan muncul setelah ada serah terima</p>
    </div>
  );
}

function currentUserId(): number | null {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    const id = u.userId ?? u.UserId;
    return id ? Number(id) : null;
  } catch {
    return null;
  }
}

function currentUserRole(): string {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return (u.roleName ?? u.RoleName ?? "").toLowerCase();
  } catch {
    return "";
  }
}

function hasPermission(permission: string): boolean {
  const permissions = localStorage.getItem("permissions");
  if (!permissions) return false;
  try {
    const permList: string[] = JSON.parse(permissions);
    return permList.includes(permission);
  } catch {
    return false;
  }
}

type HandoverTableProps = {
  items: RadioHandoverList[];
  loading: boolean;
  flowLabel: string;
  emptyMessage: string;
  onOpenDetail: (id: number) => void;
  onOpenGallery: (h: RadioHandoverList) => void;
  onSignRow?: (h: RadioHandoverList[]) => void;
  onEdit?: (h: RadioHandoverList) => void;
};

function HandoverHistoryTable({
  items,
  loading,
  flowLabel,
  emptyMessage,
  onOpenDetail,
  onOpenGallery,
  onSignRow,
  onEdit,
}: HandoverTableProps) {
  const myId = currentUserId();
  const canWarehouseSign = (h: RadioHandoverList) => {
    return h.status === "PendingReceiverSignature" && h.receivedByUserId === myId;
  };
  // Warehouse hanya bisa edit serah terima yang ditujukan ke dirinya
  // Helpdesk bisa edit jika mereka adalah pengirimnya (misal HD ke WH Scrap)
  const canWarehouseEdit = (h: RadioHandoverList) => {
    const role = currentUserRole();
    if (role === "helpdesk") {
      return h.handoverType === "HelpdeskToWarehouse";
    }

    // Semua warehouse boleh edit (misal foto salah, dll)
    // Pembatasan penerima hanya di dalam form edit (field disabled)
    return true;
  };

  const groupedItems = useMemo(() => {
    const map = new Map<string, RadioHandoverList[]>();
    items.forEach((h) => {
      const key = h.helpdeskTicketNumber || h.radioRepairJobId?.toString() || h.id.toString();
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(h);
    });
    return Array.from(map.entries()).map(([key, group]) => {
      const hasPendingSignature = group.some((h) => canWarehouseSign(h));
      const first = group[0];
      return {
        key,
        ticketNumber: first.helpdeskTicketNumber,
        flowLabel: first.handoverType,
        handoverAt: first.handoverAt,
        handedOverByName: first.handedOverByWorkshopTechnicianName || first.handedOverByName,
        // Tek→WH: penerima adalah akun Warehouse (receivedByName), bukan workshopTechnicianName (itu penyerah)
        // WH→HD / HD→Tek: tetap prioritaskan workshopTechnicianName jika ada
        receivedByName: first.handoverType === "TechnicianToWarehouse"
          ? first.receivedByName
          : (first.workshopTechnicianName || first.receivedByName),
        hasPendingSignature,
        firstItem: first,
        items: group,
      };
    });
  }, [items]);

  return (
    <>
      <div className="bg-white rounded-xl border overflow-hidden shadow-sm hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50/80 text-left border-b">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">STR</th>
                <th className="px-4 py-3 font-semibold text-gray-600">No. Job ERP</th>
                <th className="px-4 py-3 font-semibold text-gray-600">SN Radio</th>
                <th className="px-4 py-3 font-semibold text-gray-600">{flowLabel}</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Foto</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Tanggal</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-right sticky right-0 bg-gray-50/80 z-10">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                    Memuat data...
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState message={emptyMessage} />
                  </td>
                </tr>
              )}
              {!loading &&
                groupedItems.map((group) => (
                  <Fragment key={group.key}>
                    <tr className={`border-t border-b ${group.hasPendingSignature ? 'bg-amber-50/80 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                      <td colSpan={6} className="px-4 py-3">
                        <div className="flex items-center gap-3 relative">
                          {group.hasPendingSignature && (
                            <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-500 rounded-r-md animate-pulse"></span>
                          )}
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold border ${handoverTypeBadgeClass(
                              group.flowLabel
                            )}`}
                          >
                            {handoverTypeLabel(group.flowLabel)}
                          </span>
                          {group.firstItem.isScrap && (
                            <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold border bg-red-100 text-red-800 border-red-200">
                              Scrap
                            </span>
                          )}
                          <span className={`font-semibold ${group.hasPendingSignature ? 'text-amber-900' : 'text-gray-800'}`}>
                            No. Job ERP: <span className="font-mono text-[#2B6CB0]">{group.ticketNumber || "—"}</span>
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded border ${group.hasPendingSignature ? 'text-amber-800 bg-amber-100/50 border-amber-200' : 'text-gray-500 bg-white border-gray-200'}`}>
                            {group.items.length} Radio
                          </span>
                          {group.hasPendingSignature && (
                            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                              ⏳ Butuh Tindakan
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right sticky right-0 bg-gray-50 z-10 shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.05)] border-l border-gray-100">
                        {group.hasPendingSignature && onSignRow && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B3A6B] text-white rounded-[10px] text-xs font-medium hover:bg-[#2B6CB0] transition-colors shadow-sm whitespace-nowrap"
                            title="Tanda Tangan Massal"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSignRow(group.items.filter(canWarehouseSign));
                            }}
                          >
                            <span className="shrink-0 w-3 h-3 flex items-center justify-center">✍️</span>
                            Tanda Tangan ({group.items.filter(canWarehouseSign).length})
                          </button>
                        )}
                      </td>
                    </tr>

                    {group.items.map((h, idx) => (
                      <tr
                        key={h.id}
                        className={`cursor-pointer transition-colors ${h.status === "PendingReceiverSignature" ? "bg-amber-50/40 hover:bg-amber-100/50" : "hover:bg-[#EBF4FF]/30"} ${idx !== group.items.length - 1 ? (group.hasPendingSignature ? "border-b border-amber-100" : "border-b border-gray-100/60") : ""
                          }`}
                        onClick={() => onOpenDetail(h.id)}
                      >
                        <td className="px-4 py-3 pl-8">
                          <span className="font-mono text-xs font-medium text-gray-700">{h.handoverNumber}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">
                          {h.helpdeskTicketNumber ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {h.radioSerialNumber}
                            {h.isScrap && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded">Scrap</span>
                            )}
                          </div>
                          {h.equipmentName && <div className="text-xs text-gray-500">{h.equipmentName}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <span
                              className="truncate max-w-[100px]"
                              title={h.handedOverByWorkshopTechnicianName || h.handedOverByName}
                            >
                              {h.handedOverByWorkshopTechnicianName || h.handedOverByName}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#2B6CB0] shrink-0" />
                            <span
                              className="truncate max-w-[100px]"
                              title={h.handoverType === "TechnicianToWarehouse"
                                ? h.receivedByName
                                : (h.workshopTechnicianName || h.receivedByName)}
                            >
                              {h.handoverType === "TechnicianToWarehouse"
                                ? h.receivedByName
                                : (h.workshopTechnicianName || h.receivedByName)}
                            </span>
                          </div>
                          <div className="mt-1">
                            <HandoverStatusBadge status={h.status} />
                          </div>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block">
                            <LazyPhotoThumb handoverId={h.id} photoCount={h.photoCount} onClick={() => onOpenGallery(h)} />
                            {h.photoCount > 1 && (
                              <span className="absolute -top-1 -right-1 bg-[#D94F2B] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                                {h.photoCount}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {format(new Date(h.handoverAt), "dd MMM yyyy", { locale: localeId })}
                          <div className="text-xs text-gray-400">
                            {format(new Date(h.handoverAt), "HH:mm", { locale: localeId })}
                          </div>
                        </td>
                        <td
                          className="px-4 py-3 text-right sticky right-0 bg-white group-hover/tr:bg-[#EBF4FF]/30 transition-colors z-10 border-l border-gray-100/60"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-end gap-1.5 pr-1">
                            {hasPermission("radio.handover.edit") && onEdit && canWarehouseEdit(h) && (
                              <button
                                type="button"
                                className="inline-flex items-center justify-center w-8 h-8 border border-amber-200 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors bg-white shadow-sm"
                                title="Edit"
                                onClick={() => onEdit(h)}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              className="inline-flex items-center justify-center w-8 h-8 border border-[#E2E8F0] rounded-[10px] text-[#2B6CB0] hover:bg-[#EBF4FF]/50 transition-colors bg-white shadow-sm"
                              title="Lihat detail"
                              onClick={() => onOpenDetail(h.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
            Memuat data...
          </div>
        ) : items.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          groupedItems.map((group) => (
            <div
              key={group.key}
              className={`bg-white rounded-xl border ${group.hasPendingSignature ? 'border-amber-200 shadow-[0_0_10px_rgba(217,119,6,0.1)]' : 'border-gray-200 shadow-sm'} overflow-hidden md:hidden mb-4`}
            >
              <div className={`p-4 ${group.hasPendingSignature ? 'bg-amber-50/80 border-b border-amber-100' : 'bg-gray-50/80 border-b border-gray-100'}`}>
                <div className="flex flex-col gap-2 relative">
                  {group.hasPendingSignature && (
                    <span className="absolute -left-4 top-0 w-1 h-full bg-red-500 rounded-r-md animate-pulse"></span>
                  )}
                  <div className="flex justify-between items-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold border ${handoverTypeBadgeClass(
                        group.flowLabel
                      )}`}
                    >
                      {handoverTypeLabel(group.flowLabel)}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {group.handoverAt ? format(new Date(group.handoverAt), "dd MMM yyyy", { locale: localeId }) : "-"}
                    </span>
                  </div>
                  <h3 className={`font-bold text-sm flex items-center gap-1.5 ${group.hasPendingSignature ? 'text-amber-900' : 'text-gray-900'}`}>
                    No. Job ERP: <span className="font-mono text-[#2B6CB0]">{group.ticketNumber || "—"}</span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1 font-medium">
                    <span className="truncate max-w-[120px]">{group.handedOverByName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#718096] shrink-0" />
                    <span className="truncate max-w-[120px] text-gray-700">{group.receivedByName}</span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100/60">
                {group.items.map((h) => (
                  <div
                    key={h.id}
                    className={`p-4 transition-colors cursor-pointer ${h.status === "PendingReceiverSignature" ? 'bg-amber-50/40 hover:bg-amber-100/50' : 'hover:bg-gray-50/50'}`}
                    onClick={() => onOpenDetail(h.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900 leading-tight">{h.radioSerialNumber}</p>
                          {h.isScrap && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded">Scrap</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Unit: {h.unitNumber || "-"} • Alat: {h.equipmentName || "-"}
                        </p>
                      </div>
                      <HandoverStatusBadge status={h.status} />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-gray-500 bg-gray-100/80 px-1.5 py-0.5 rounded border border-gray-200">
                          {h.handoverNumber}
                        </span>
                        {h.photoCount > 0 ? (
                          <div className="relative mr-1" onClick={(e) => e.stopPropagation()}>
                            <LazyPhotoThumb handoverId={h.id} photoCount={h.photoCount} onClick={() => onOpenGallery(h)} />
                            {h.photoCount > 1 && (
                              <span className="absolute -top-1 -right-1 bg-[#D94F2B] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {h.photoCount}
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {hasPermission("radio.handover.edit") && onEdit && canWarehouseEdit(h) && (
                          <button
                            type="button"
                            className="p-1.5 border border-amber-200 rounded text-amber-600 hover:bg-amber-50"
                            onClick={() => onEdit(h)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          className="p-1.5 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                          onClick={() => onOpenDetail(h.id)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {group.hasPendingSignature && onSignRow && (
                <div className="p-3 bg-gray-50 border-t border-gray-100">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white rounded-[10px] text-sm font-bold shadow-sm"
                    onClick={() => onSignRow(group.items.filter(canWarehouseSign))}
                  >
                    Tanda Tangan ({group.items.filter(canWarehouseSign).length})
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default function RadioHandoverWarehousePage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  // Workshop (Teknisi WKS) tidak boleh edit tab "Serah ke Helpdesk"
  const isWorkshopUser = currentUserRole() === "teknisi wks";
  const [incomingTek, setIncomingTek] = useState<RadioHandoverList[]>([]);
  const [incomingHd, setIncomingHd] = useState<RadioHandoverList[]>([]);
  const [outgoing, setOutgoing] = useState<RadioHandoverList[]>([]);
  const [pendingJobs, setPendingJobs] = useState<RadioRepairJobList[]>([]);
  const [loadingIncomingTek, setLoadingIncomingTek] = useState(true);
  const [loadingIncomingHd, setLoadingIncomingHd] = useState(true);
  const [loadingOutgoing, setLoadingOutgoing] = useState(true);
  const [detail, setDetail] = useState<RadioHandoverDetail | null>(null);
  const [detailJob, setDetailJob] = useState<RadioRepairJobDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [returnJob, setReturnJob] = useState<RadioRepairJobList | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "incoming");
  const [page, setPage] = useState(1);
  const [totalCountIncomingTek, setTotalCountIncomingTek] = useState(0);
  const [totalCountIncomingHd, setTotalCountIncomingHd] = useState(0);
  const [totalCountOutgoing, setTotalCountOutgoing] = useState(0);
  const [totalCountPendingJobs, setTotalCountPendingJobs] = useState(0);
  const PAGE_SIZE = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterValue>({
    type: "month",
    year: String(new Date().getFullYear()),
    month: String(new Date().getMonth()),
  });
  const [signRows, setSignRows] = useState<RadioHandoverList[] | null>(null);

  const [pendingCountTekWh, setPendingCountTekWh] = useState(0);
  const [pendingCountHdWh, setPendingCountHdWh] = useState(0);
  const [pendingCountWhHd, setPendingCountWhHd] = useState(0);

  const fetchPendingCounts = useCallback(() => {
    radioHandoverApi.getAll({ page: 1, pageSize: 1, handoverType: "TechnicianToWarehouse", status: "PendingReceiverSignature" })
      .then(res => setPendingCountTekWh(res.meta?.pagination?.totalCount ?? 0)).catch(() => {});
    radioHandoverApi.getAll({ page: 1, pageSize: 1, handoverType: "HelpdeskToWarehouse", status: "PendingReceiverSignature" })
      .then(res => setPendingCountHdWh(res.meta?.pagination?.totalCount ?? 0)).catch(() => {});
    radioHandoverApi.getAll({ page: 1, pageSize: 1, handoverType: "WarehouseToHelpdesk", status: "PendingReceiverSignature" })
      .then(res => setPendingCountWhHd(res.meta?.pagination?.totalCount ?? 0)).catch(() => {});
  }, []);
  const [signRowDetails, setSignRowDetails] = useState<RadioHandoverDetail[]>([]);
  const [activeTagIndex, setActiveTagIndex] = useState(0);
  const [sigRowReceiver, setSigRowReceiver] = useState<string>("");
  const [sigRowPicReceiverName, setSigRowPicReceiverName] = useState("");
  const [sigRowRemarks, setSigRowRemarks] = useState("");
  const sigWhRowRef = useRef<any>(null);
  const [createHdModalOpen, setCreateHdModalOpen] = useState(false);
  const [createTekModalOpen, setCreateTekModalOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [editDetail, setEditDetail] = useState<RadioHandoverDetail | null>(null);
  const [pendingCollapsed, setPendingCollapsed] = useState(false);

  // State untuk ChangeReceiverModal
  const [changeReceiverId, setChangeReceiverId] = useState<number | null>(null);
  const [changeReceiverType, setChangeReceiverType] = useState<"Helpdesk" | "Warehouse" | "Teknisi">("Helpdesk");
  const [changeReceiverCurrentUserId, setChangeReceiverCurrentUserId] = useState<number | undefined>();

  const canDelete = hasPermission("radio.handover.delete");
  const isWks = currentUserRole() === "Workshop";

  // Helper untuk signature canvas
  const sigRef = useRef<any>(null);
  const [editHandover, setEditHandover] = useState<RadioHandoverDetail | null>(null);
  const [resettingSignature, setResettingSignature] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("tab")) {
      setActiveTab(searchParams.get("tab")!);
    }
  }, [searchParams]);

  // Fetch full detail when sign dialog opens for tag preview
  useEffect(() => {
    if (!signRows || signRows.length === 0) {
      setSignRowDetails([]);
      setActiveTagIndex(0);
      setSigRowPicReceiverName("");
      setSigRowRemarks("");
      return;
    }
    
    // Pre-populate fields based on what was entered during handover creation
    setSigRowPicReceiverName(signRows[0].picReceiverName || "");
    setSigRowRemarks(signRows[0].remarks || "");

    Promise.all(signRows.map(row => radioHandoverApi.getById(row.id)))
      .then(details => {
        setSignRowDetails(details.filter(Boolean) as RadioHandoverDetail[]);
        setActiveTagIndex(0);
      })
      .catch(() => setSignRowDetails([]));
  }, [signRows]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setSearchParams({ tab: val });
  };

  // Reset page when tab or search changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch]);


  const load = useCallback((silent = false) => {
    if (!silent) {
      if (activeTab === "incoming") setLoadingIncomingTek(true);
      if (activeTab === "incoming-hd") setLoadingIncomingHd(true);
      if (activeTab === "outgoing") setLoadingOutgoing(true);
    }

    let fromDate: string;
    let toDate: string;
    if (periodFilter.type === "month" && periodFilter.month !== "all") {
      const year = parseInt(periodFilter.year, 10);
      const month = parseInt(periodFilter.month, 10);
      const date = new Date(year, month, 1);
      fromDate = formatISO(startOfMonth(date));
      toDate = formatISO(endOfMonth(date));
    } else if (periodFilter.type === "month" && periodFilter.month === "all") {
      const year = parseInt(periodFilter.year, 10);
      fromDate = formatISO(new Date(year, 0, 1));
      toDate = formatISO(new Date(year, 11, 31, 23, 59, 59));
    } else if (periodFilter.type === "date") {
      const d = new Date(periodFilter.date);
      fromDate = formatISO(new Date(d.setHours(0, 0, 0, 0)));
      toDate = formatISO(new Date(d.setHours(23, 59, 59, 999)));
    } else {
      fromDate = formatISO(startOfMonth(new Date()));
      toDate = formatISO(endOfMonth(new Date()));
    }

    if (activeTab === "incoming") {
      radioHandoverApi.getAll({ page, pageSize: PAGE_SIZE, handoverType: "TechnicianToWarehouse", search: debouncedSearch, fromDate, toDate })
        .then((res) => {
          setIncomingTek(res.data ?? []);
          setTotalCountIncomingTek(res.meta?.pagination?.totalCount ?? 0);
        })
        .catch(() => setIncomingTek([]))
        .finally(() => { if (!silent) setLoadingIncomingTek(false); });
    } else {
      radioHandoverApi.getAll({ page: 1, pageSize: 1, handoverType: "TechnicianToWarehouse", search: debouncedSearch, fromDate, toDate })
        .then(r => setTotalCountIncomingTek(r.meta?.pagination?.totalCount ?? 0)).catch(() => {});
    }
    
    if (activeTab === "incoming-hd") {
      radioHandoverApi.getAll({ page, pageSize: PAGE_SIZE, handoverType: "HelpdeskToWarehouse", search: debouncedSearch, fromDate, toDate })
        .then((res) => {
          setIncomingHd(res.data ?? []);
          setTotalCountIncomingHd(res.meta?.pagination?.totalCount ?? 0);
        })
        .catch(() => setIncomingHd([]))
        .finally(() => { if (!silent) setLoadingIncomingHd(false); });
    } else {
      radioHandoverApi.getAll({ page: 1, pageSize: 1, handoverType: "HelpdeskToWarehouse", search: debouncedSearch, fromDate, toDate })
        .then(r => setTotalCountIncomingHd(r.meta?.pagination?.totalCount ?? 0)).catch(() => {});
    }
    
    if (activeTab === "outgoing") {
      radioHandoverApi
        .getAll({ page, pageSize: PAGE_SIZE, handoverType: "WarehouseToHelpdesk", search: debouncedSearch, fromDate, toDate })
        .then((r) => {
          setOutgoing(r.data ?? []);
          setTotalCountOutgoing(r.meta?.pagination?.totalCount ?? 0);
        })
        .catch(() => setOutgoing([]))
        .finally(() => { if (!silent) setLoadingOutgoing(false); });
    } else {
      radioHandoverApi.getAll({ page: 1, pageSize: 1, handoverType: "WarehouseToHelpdesk", search: debouncedSearch, fromDate, toDate })
        .then(r => setTotalCountOutgoing(r.meta?.pagination?.totalCount ?? 0)).catch(() => {});
    }

    // Always fetch pending jobs for "Perlu tindakan" section (only page 1 to keep it simple, or unpaginated)
    radioRepairApi
      .getAll({ page: 1, pageSize: 100, status: "HandedToWarehouse", search: debouncedSearch })
      .then((r) => {
        setPendingJobs(r.data ?? []);
        setTotalCountPendingJobs(r.meta?.pagination?.totalCount ?? 0);
      })
      .catch(() => setPendingJobs([]));

  }, [activeTab, page, debouncedSearch, periodFilter]);

  useLiveRefresh("RadioHandover", () => {
    load(true);
    fetchPendingCounts();
  });

  useLiveRefresh("RadioRepairJob", () => {
    load(true);
  });

  useEffect(() => {
    load();
    fetchPendingCounts();
  }, [load, fetchPendingCounts]);

  // Auto-open modal if handoverId is present in URL
  useEffect(() => {
    const handoverIdParam = searchParams.get("handoverId");
    if (handoverIdParam) {
      const handoverId = parseInt(handoverIdParam, 10);
      if (!isNaN(handoverId)) {
        openDetail(handoverId);
      }
      // Remove handoverId from URL so it doesn't reopen on reload after closing
      setSearchParams(prev => {
        prev.delete("handoverId");
        return prev;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const d = await radioHandoverApi.getById(id);
      setDetail(d);
      setDetailJob(null);
      radioRepairApi
        .getById(d.radioRepairJobId)
        .then(setDetailJob)
        .catch(() => setDetailJob(null));
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast({
        title: "Gagal membuka detail",
        description: ax.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const openGallery = (h: RadioHandoverList) => {
    if (!h.previewPhotoBase64 && h.photoCount === 0) return;
    setGalleryImages(h.previewPhotoBase64 ? [h.previewPhotoBase64] : []);
    setGalleryIndex(0);
    setGalleryOpen(true);
    radioHandoverApi.getById(h.id).then((d) => {
      const imgs = resolveHandoverPhotos(d);
      if (imgs.length > 0) {
        setGalleryImages(imgs);
        setGalleryOpen(true);
      }
    });
  };

  const openGalleryFromDetail = (photos: string[], start = 0) => {
    if (photos.length === 0) return;
    setGalleryImages(photos);
    setGalleryIndex(start);
    setGalleryOpen(true);
  };

  const handleEdit = async (h: RadioHandoverList) => {
    try {
      const detail = await radioHandoverApi.getById(h.id);
      setEditHandover(detail);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast({
        title: "Gagal membuka form edit",
        description: ax.response?.data?.message,
        variant: "destructive",
      });
    }
  };

  const handleEditSuccess = () => {
    setEditHandover(null);
    load(); // Refresh data
  };

  const handleResetReceiverSignature = async () => {
    if (!detail) return;
    setResettingSignature(true);
    try {
      await radioHandoverApi.resetReceiverSignature(detail.id);
      toast({
        title: "Berhasil",
        description: "TTD penerima berhasil direset. Helpdesk dapat menandatangani ulang.",
      });
      setDetail(null);
      setConfirmResetOpen(false);
      load();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast({
        title: "Gagal reset TTD",
        description: ax.response?.data?.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    } finally {
      setResettingSignature(false);
    }
  };

  const chartData = useMemo(() => {
    let bagus = 0;
    let rusak = 0;
    let scrap = 0;
    pendingJobs.forEach(j => {
      if (j.isScrap) {
        scrap++;
      } else if (j.equipmentTagType === "Damaged") {
        rusak++;
      } else {
        bagus++; // Asumsi bagus jika bukan rusak/scrap
      }
    });
    return [
      { name: "Bagus", value: bagus, color: "#00E396" },
      { name: "Rusak", value: rusak, color: "#FEB019" },
      { name: "Scrap", value: scrap, color: "#FF4560" }
    ].filter(d => d.value > 0);
  }, [pendingJobs]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ====== MOBILE INTEGRATED HEADER ====== */}
      <div className="md:hidden bg-white rounded-[14px] border border-[#E2E8F0] shadow-sm mb-4">
        <div className="flex items-start gap-4 p-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#FFF0EB] flex items-center justify-center flex-shrink-0">
            <Warehouse className="w-5 h-5 text-[#D94F2B]" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#D94F2B] tracking-[0.1em] uppercase mb-0.5">Radio & Fleet</p>
            <h1 className="text-[20px] font-bold text-[#1A202C] leading-tight">Radio Masuk WH</h1>
            <p className="text-[12px] text-[#718096] mt-0.5">Penerimaan radio dari teknisi</p>
          </div>
          <button
            onClick={() => navigate("/radio")}
            className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-[#F7F8FA] border border-[#E2E8F0] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <div className="px-4 pb-4">
          <SinglePeriodFilter
            value={periodFilter}
            onChange={setPeriodFilter}
            align="start"
            trigger={
              <button className="w-full flex items-center justify-between gap-2 bg-gray-50/50 border border-gray-300 rounded-[10px] px-3 py-2 text-sm shadow-sm focus:outline-none focus:border-[#D94F2B] focus:ring-1 focus:ring-[#D94F2B]">
                <span className="text-gray-700">
                  {periodFilter.type === "month" 
                    ? (periodFilter.month === "all" ? `Tahun ${periodFilter.year}` : `${format(new Date(2000, parseInt(periodFilter.month)), "MMMM", { locale: localeId })} ${periodFilter.year}`)
                    : format(periodFilter.date, "dd MMM yyyy", { locale: localeId })}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
            }
          />
        </div>
      </div>

      {/* ====== DESKTOP HEADER ====== */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Warehouse className="w-7 h-7 text-[#1B3A6B] shrink-0" />
            Radio Masuk Warehouse
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Kelola penerimaan radio dari teknisi dan penyerahan kembali ke helpdesk. Klik baris atau tombol Detail
            untuk melihat foto dan tanda tangan.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 pr-2 rounded-xl shadow-sm border border-gray-200/60">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-2 hidden sm:block">Periode</label>
          <SinglePeriodFilter
            value={periodFilter}
            onChange={setPeriodFilter}
            align="end"
            trigger={
              <button className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium shadow-inner hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20">
                <span className="text-gray-800">
                  {periodFilter.type === "month" 
                    ? (periodFilter.month === "all" ? `Tahun ${periodFilter.year}` : `${format(new Date(2000, parseInt(periodFilter.month)), "MMMM", { locale: localeId })} ${periodFilter.year}`)
                    : format(periodFilter.date, "dd MMM yyyy", { locale: localeId })}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
            }
          />
        </div>
      </div>

      {/* Stats & Chart Redesign */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl overflow-hidden relative transition-transform hover:scale-[1.02]">
            <div className="absolute top-0 right-0 p-4 opacity-20"><PackageCheck className="w-16 h-16" /></div>
            <CardHeader className="pb-1 pt-5 px-5 relative z-10">
              <CardDescription className="text-amber-50 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest drop-shadow-sm">
                Siap ke Helpdesk
              </CardDescription>
              <CardTitle className="text-5xl font-extrabold text-white mt-1 drop-shadow-md">{totalCountPendingJobs}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0 relative z-10">
              <div className="mt-3">
                <span className="text-xs text-white/90 font-bold bg-white/20 px-3 py-1 rounded-full inline-block backdrop-blur-sm border border-white/10 shadow-sm">
                  Menunggu Tindakan
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-[#2B6CB0] to-[#4299E1] text-white rounded-2xl overflow-hidden relative transition-transform hover:scale-[1.02]">
            <div className="absolute top-0 right-0 p-4 opacity-20"><ArrowDownLeft className="w-16 h-16" /></div>
            <CardHeader className="pb-1 pt-5 px-5 relative z-10">
              <CardDescription className="flex items-center gap-1.5 text-xs font-bold text-blue-100 uppercase tracking-widest drop-shadow-sm">
                Masuk dari Teknisi
              </CardDescription>
              <CardTitle className="text-5xl font-extrabold text-white mt-1 drop-shadow-md">{totalCountIncomingTek}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0 relative z-10">
              <p className="text-xs text-blue-100 mt-2 font-medium bg-black/10 inline-block px-2 py-1 rounded-md">Histori masuk bulan ini</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-2xl overflow-hidden relative transition-transform hover:scale-[1.02]">
            <div className="absolute top-0 right-0 p-4 opacity-20"><ArrowDownLeft className="w-16 h-16" /></div>
            <CardHeader className="pb-1 pt-5 px-5 relative z-10">
              <CardDescription className="flex items-center gap-1.5 text-xs font-bold text-red-100 uppercase tracking-widest drop-shadow-sm">
                Masuk dari Helpdesk (Scrap)
              </CardDescription>
              <CardTitle className="text-5xl font-extrabold text-white mt-1 drop-shadow-md">{totalCountIncomingHd}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0 relative z-10">
              <p className="text-xs text-red-100 mt-2 font-medium bg-black/10 inline-block px-2 py-1 rounded-md">Histori masuk bulan ini</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl overflow-hidden relative transition-transform hover:scale-[1.02]">
            <div className="absolute top-0 right-0 p-4 opacity-20"><ArrowUpRight className="w-16 h-16" /></div>
            <CardHeader className="pb-1 pt-5 px-5 relative z-10">
              <CardDescription className="flex items-center gap-1.5 text-xs font-bold text-emerald-100 uppercase tracking-widest drop-shadow-sm">
                Serah ke Helpdesk
              </CardDescription>
              <CardTitle className="text-5xl font-extrabold text-white mt-1 drop-shadow-md">{totalCountOutgoing}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0 relative z-10">
              <p className="text-xs text-emerald-100 mt-2 font-medium bg-black/10 inline-block px-2 py-1 rounded-md">Histori keluar bulan ini</p>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-1 border-0 shadow-lg bg-white rounded-2xl flex flex-col justify-center items-center p-4 relative min-h-[160px] ring-1 ring-gray-100">
          <h3 className="w-full text-left text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 px-2">Kondisi Radio (Siap HD)</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={6}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 4px 6px ${entry.color}40)` }} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => [value, "Jumlah"]} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '600', right: 0 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-300 gap-3 h-full">
              <PackageCheck className="w-10 h-10 opacity-30" />
              <p className="text-[11px] font-bold uppercase tracking-widest">Belum Ada Data</p>
            </div>
          )}
        </Card>
      </div>

      {/* Pending jobs */}
      {pendingJobs.length > 0 && (
        <section className="space-y-3">
          <div 
            className="flex items-center justify-between cursor-pointer group" 
            onClick={() => setPendingCollapsed(!pendingCollapsed)}
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-600 group-hover:text-amber-700 transition-colors" />
              <h2 className="text-base md:text-lg font-semibold text-gray-900 group-hover:text-amber-700 transition-colors flex items-center gap-2">
                {canCreateHandoverWhHd() ? "Perlu tindakan" : "Menunggu serah"}
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-full min-w-[24px] text-center">
                  {pendingJobs.length}
                </span>
              </h2>
            </div>
            {pendingCollapsed ? (
              <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            )}
          </div>
          
          {!pendingCollapsed && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-xs md:text-sm text-gray-600">
                {canCreateHandoverWhHd()
                  ? "Radio sudah diterima dari teknisi. Lengkapi foto, aksesoris, dan tanda tangan."
                  : "Radio sudah diterima dari teknisi dan menunggu proses serah ke Helpdesk."}
              </p>

          {/* Desktop table */}
          <div className="bg-white rounded-xl border border-amber-200 overflow-hidden shadow-sm hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-amber-50 border-b border-amber-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-amber-900/80">Tiket</th>
                  <th className="text-left px-4 py-3 font-semibold text-amber-900/80">SN</th>
                  <th className="text-left px-4 py-3 font-semibold text-amber-900/80">Teknisi</th>
                  {canCreateHandoverWhHd() && (
                    <th className="text-right px-4 py-3 font-semibold text-amber-900/80">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pendingJobs.map((j, idx) => (
                  <tr key={j.id} className={`border-t border-amber-100/80 ${idx % 2 === 1 ? "bg-amber-50/30" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs">{j.helpdeskTicketNumber ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {j.radioSerialNumber}
                        {j.updatedAt && new Date(j.updatedAt).toDateString() === new Date().toDateString() && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 border border-green-200 uppercase animate-pulse">New</span>
                        )}
                        {j.isScrap && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">Scrap</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{j.assignedTechnicianName}</td>
                    {canCreateHandoverWhHd() && (
                      <td className="px-4 py-3 text-right">
                        {j.pendingHandoverType === "WarehouseToHelpdesk" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded border border-amber-200">
                            ⏳ Menunggu TTD
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setReturnJob(j)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1B3A6B] text-white text-xs font-medium rounded-[10px] hover:bg-[#2B6CB0] shadow-sm transition-colors"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            WH → Helpdesk
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards for pending jobs */}
          <div className="md:hidden space-y-3">
            {pendingJobs.map((j) => (
              <div key={j.id} className="bg-white rounded-2xl p-4 shadow-sm border border-amber-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                      {j.radioSerialNumber}
                      {j.updatedAt && new Date(j.updatedAt).toDateString() === new Date().toDateString() && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 border border-green-200 uppercase animate-pulse">New</span>
                      )}
                      {j.isScrap && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">Scrap</span>
                      )}
                    </div>
                    {j.helpdeskTicketNumber && (
                      <div className="text-xs font-mono text-gray-600 mt-0.5">Tiket: {j.helpdeskTicketNumber}</div>
                    )}
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">Siap HD</span>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  <span className="text-gray-400">Teknisi:</span> <span className="font-medium">{j.assignedTechnicianName}</span>
                </div>
                {canCreateHandoverWhHd() && (
                  <div className="mt-3 pt-3 border-t border-amber-100">
                    {j.pendingHandoverType === "WarehouseToHelpdesk" ? (
                      <div className="w-full text-center px-3 py-2.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-xl border border-amber-200">
                        ⏳ Menunggu TTD Helpdesk
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReturnJob(j)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#1B3A6B] text-white text-xs font-semibold rounded-[10px] hover:bg-[#2B6CB0] shadow-sm transition-colors"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        Serah ke Helpdesk
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
            </div>
          )}
        </section>
      )}

      {/* History tabs */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">Histori serah terima</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari SN, Tiket, atau Nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-[10px] focus:ring-2 focus:ring-[#2B6CB0]/20 focus:border-[#2B6CB0] bg-white"
            />
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="bg-gray-100 p-1 h-auto w-full md:w-auto">
            <TabsTrigger value="incoming" className="gap-1.5 md:gap-2 px-3 md:px-4 py-2 data-[state=active]:shadow-sm flex-1 md:flex-none text-xs md:text-sm">
              <ArrowDownLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Masuk dari Teknisi</span>
              <span className="sm:hidden">Tek → WH</span>
              {pendingCountTekWh > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {pendingCountTekWh}
                </span>
              )}
            </TabsTrigger>
            {hasPermission("radio.handover.warehouse.scrap") && (
              <TabsTrigger value="incoming-hd" className="gap-1.5 md:gap-2 px-3 md:px-4 py-2 data-[state=active]:shadow-sm flex-1 md:flex-none text-xs md:text-sm">
                <ArrowDownLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#B7791F]" />
                <span className="hidden sm:inline">Masuk dari Helpdesk (Scrap)</span>
                <span className="sm:hidden">HD → WH</span>
                {pendingCountHdWh > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {pendingCountHdWh}
                  </span>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="outgoing" className="gap-1.5 md:gap-2 px-3 md:px-4 py-2 data-[state=active]:shadow-sm flex-1 md:flex-none text-xs md:text-sm">
              <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Serah ke Helpdesk</span>
              <span className="sm:hidden">Keluar</span>
              {pendingCountWhHd > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {pendingCountWhHd}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="mt-4 space-y-2">
            <p className="text-sm text-gray-500">
              Daftar radio yang masuk ke warehouse dari teknisi (Tek → WH).
            </p>
            <HandoverHistoryTable
              items={incomingTek}
              loading={loadingIncomingTek}
              flowLabel="Teknisi → Warehouse"
              emptyMessage={searchQuery ? "Tidak ada hasil pencarian" : "Belum ada radio masuk dari teknisi"}
              onOpenDetail={openDetail}
              onOpenGallery={openGallery}
              onSignRow={setSignRows}
              onEdit={handleEdit}
            />
            <Pagination
              currentPage={page}
              pageSize={PAGE_SIZE}
              totalCount={totalCountIncomingTek}
              totalPages={Math.ceil(totalCountIncomingTek / PAGE_SIZE)}
              onPageChange={setPage}
            />
          </TabsContent>

          {hasPermission("radio.handover.warehouse.scrap") && (
            <TabsContent value="incoming-hd" className="mt-4 space-y-2">
              <p className="text-sm text-gray-500">
                Daftar radio scrap yang masuk ke warehouse dari helpdesk (HD → WH).
              </p>
              <HandoverHistoryTable
                items={incomingHd}
                loading={loadingIncomingHd}
                flowLabel="Helpdesk → Warehouse (Scrap)"
                emptyMessage={searchQuery ? "Tidak ada hasil pencarian" : "Belum ada radio scrap masuk dari helpdesk"}
                onOpenDetail={openDetail}
                onOpenGallery={openGallery}
                onSignRow={setSignRows}
                onEdit={handleEdit}
              />
              <Pagination
                currentPage={page}
                pageSize={PAGE_SIZE}
                totalCount={totalCountIncomingHd}
                totalPages={Math.ceil(totalCountIncomingHd / PAGE_SIZE)}
                onPageChange={setPage}
              />
            </TabsContent>
          )}

          <TabsContent value="outgoing" className="mt-4 space-y-2">
            <p className="text-sm text-gray-500">
              Daftar radio yang sudah diserahkan warehouse ke helpdesk (WH → HD).
            </p>
            <HandoverHistoryTable
              items={outgoing}
              loading={loadingOutgoing}
              flowLabel="Warehouse → Helpdesk"
              emptyMessage={searchQuery ? "Tidak ada hasil pencarian" : "Belum ada serah terima ke helpdesk"}
              onOpenDetail={openDetail}
              onOpenGallery={openGallery}
              onSignRow={setSignRows}
              onEdit={isWorkshopUser ? undefined : handleEdit}
            />
            <Pagination
              currentPage={page}
              pageSize={PAGE_SIZE}
              totalCount={totalCountOutgoing}
              totalPages={Math.ceil(totalCountOutgoing / PAGE_SIZE)}
              onPageChange={setPage}
            />
          </TabsContent>
        </Tabs>
      </section>

      {/* WH → HD form dialog */}
      {canCreateHandoverWhHd() && returnJob && (
        <ResponsiveModal
          open={!!returnJob}
          onOpenChange={() => setReturnJob(null)}
          bottomSheetSize="xl"
          desktopClassName="max-w-2xl"
          title={
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-[#D94F2B]" />
              Serah Terima Warehouse → Helpdesk
            </div>
          }
        >
          <div className="rounded-lg bg-gray-50 border px-3 py-2 text-sm text-gray-600 mb-2">
            Tiket <span className="font-mono font-medium text-gray-900">{returnJob.helpdeskTicketNumber ?? "—"}</span>
            {" · "}
            SN <span className="font-medium text-gray-900">{returnJob.radioSerialNumber}</span>
          </div>
          <WarehouseToHelpdeskForm
            job={returnJob}
            onSuccess={() => {
              setReturnJob(null);
              load();
              setActiveTab("outgoing");
            }}
            onCancel={() => setReturnJob(null)}
          />
        </ResponsiveModal>
      )}

      {/* Detail dialog */}
      <ResponsiveModal
        open={!!detail || detailLoading}
        onOpenChange={(open: boolean) => { if (!open && !detailLoading) { setDetail(null); setDetailJob(null); } }}
        bottomSheetSize="xl"
        desktopClassName="max-w-3xl"
        title={
          <div className="flex flex-wrap items-center gap-2">
            {detailLoading ? (
              <span className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memuat detail...
              </span>
            ) : (
              <>
                <span>Detail {detail?.handoverNumber}</span>
                {detail && (
                  <>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${handoverTypeBadgeClass(detail.handoverType)}`}
                    >
                      {handoverTypeLabel(detail.handoverType)}
                    </span>
                    <HandoverStatusBadge status={detail.status} />
                  </>
                )}
              </>
            )}
          </div>
        }
      >
        {detail && !detailLoading && (
          <div className="space-y-6 pt-2 w-full min-w-0 text-sm">
            
            {detail.handoverType === "WarehouseToHelpdesk" && detail.status === "PendingReceiverSignature" && (
              <div className="bg-amber-50 border border-amber-200 rounded-[10px] p-4 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4 mb-2">
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">Menunggu Tanda Tangan Penerima</h4>
                  <p className="text-amber-800 text-sm mt-1">Anda telah menyerahkan radio ini ke Helpdesk. Menunggu TTD dari penerima untuk selesai.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    className="flex-1 sm:flex-none px-4 py-2 bg-white border border-amber-300 text-amber-800 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors shadow-sm whitespace-nowrap"
                    onClick={(e) => {
                      e.stopPropagation();
                      setChangeReceiverType("Helpdesk");
                      setChangeReceiverId(detail.id);
                      setChangeReceiverCurrentUserId(detail.receivedByUserId);
                    }}
                  >
                    Ubah Penerima
                  </button>
                </div>
              </div>
            )}

            {/* Timeline Serah Terima (History steps) */}
            {detailJob?.handovers && detailJob.handovers.length > 0 && (
              <div className="bg-[#F7F8FA] border border-[#E2E8F0] rounded-[10px] p-4">
                <HandoverTimeline 
                  handovers={detailJob.handovers} 
                  isScrap={detailJob.status === "Scrapped" || detailJob.status === "ProcessScrap" || detailJob.handovers.some((h) => h.handoverType === "TechnicianToHelpdesk")} 
                />
              </div>
            )}

            {/* Official MKN Tag Preview Card (Peralatan Baik / Peralatan Rusak) */}
            <div className="flex justify-center">
              <HandoverTagPreview detail={detail} />
            </div>

            {/* Row 1: Informasi Dasar Serah Terima (No. Job ERP & Waktu) */}
            {(() => {
              const rawTicket = detail.helpdeskTicketNumber?.trim();
              const erpJob = detail.noJobErp?.trim() || rawTicket || "—";

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F7F8FA] border border-[#E2E8F0] rounded-[10px] p-4">
                  <div>
                    <span className="text-[10px] text-[#718096] uppercase font-bold tracking-wider block">Waktu Serah Terima</span>
                    <span className="text-gray-900 font-medium mt-1 block">
                      {format(new Date(detail.handoverAt), "dd MMM yyyy HH:mm", { locale: localeId })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#718096] uppercase font-bold tracking-wider block">No. Job ERP</span>
                    <span className="font-mono text-[#1B3A6B] font-bold mt-1 block">
                      {erpJob}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Pihak Terlibat & Catatan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-[#E2E8F0] rounded-[10px] p-4 bg-white shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-[#1B3A6B] uppercase tracking-wider border-b border-[#E2E8F0] pb-2 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#2B6CB0]" /> Pihak yang Terlibat
                </h4>
                <div className="flex flex-col gap-3">
                  <div>
                    <span className="text-[11px] text-[#718096] font-medium block">Diserahkan Oleh</span>
                    <span className="font-semibold text-gray-900 block mt-0.5">{detail.handedOverByName}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#718096] font-medium block">Diterima Oleh</span>
                    <span className="font-semibold text-gray-900 block mt-0.5">{detail.receivedByName}</span>
                    {detail.picReceiverName && (
                      <span className="text-[11px] font-medium text-[#1B3A6B] bg-[#EBF4FF] px-2 py-0.5 rounded-[6px] mt-1.5 inline-block">
                        PIC Fisik: {detail.picReceiverName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border border-[#E2E8F0] rounded-[10px] p-4 bg-white shadow-sm space-y-2">
                <h4 className="text-xs font-bold text-[#1B3A6B] uppercase tracking-wider border-b border-[#E2E8F0] pb-2">
                  💬 Catatan Penerima (Warehouse)
                </h4>
                <p className="text-gray-700 italic bg-[#F7F8FA] p-3 rounded-[10px] border border-[#E2E8F0]/60 min-h-[60px]">
                  {detail.remarks ? `"${detail.remarks}"` : "Tidak ada catatan penerima"}
                </p>
              </div>
            </div>

            {/* Aksesoris */}
            {(detail.accessories?.length ?? 0) > 0 && (
              <div className="border border-[#E2E8F0] rounded-[10px] p-4 bg-white shadow-sm space-y-2">
                <h4 className="text-xs font-bold text-[#1B3A6B] uppercase tracking-wider border-b border-[#E2E8F0] pb-2">
                  Daftar Aksesoris yang Disertakan
                </h4>
                <div className="overflow-hidden border border-[#E2E8F0] rounded-[10px]">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F7F8FA] border-b border-[#E2E8F0]">
                      <tr>
                        <th className="text-left px-3 py-2 text-[#1A202C] font-semibold">Nama Barang</th>
                        <th className="text-left px-3 py-2 text-[#1A202C] font-semibold w-16">Qty</th>
                        <th className="text-left px-3 py-2 text-[#1A202C] font-semibold w-20">Unit</th>
                        <th className="text-left px-3 py-2 text-[#1A202C] font-semibold">Serial Number (SN)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {detail.accessories.map((a, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2 text-gray-800 font-medium">{a.itemName}</td>
                          <td className="px-3 py-2 text-gray-800">{a.quantity}</td>
                          <td className="px-3 py-2 text-gray-800">{a.unit || "—"}</td>
                          <td className="px-3 py-2 text-[#718096] font-mono">{a.serialNumber || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Foto Fisik */}
            {(() => {
              const b64Images = detail.radioPhotos || (detail.radioPhotoBase64 ? [detail.radioPhotoBase64] : []);
              if (b64Images.length === 0) return null;
              return (
                <div className="border border-[#E2E8F0] rounded-[10px] p-4 bg-white shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-[#1B3A6B] uppercase tracking-wider border-b border-[#E2E8F0] pb-2 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#2B6CB0]" /> Dokumentasi Foto Fisik ({b64Images.length})
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {b64Images.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => openGallery(detail)}
                        className="relative w-24 h-24 rounded-[10px] border border-[#E2E8F0] overflow-hidden hover:ring-2 ring-[#2B6CB0]/50 transition-all shadow-sm active:scale-95"
                      >
                        <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#718096]">Klik foto untuk memperbesar pratinjau galeri.</p>
                </div>
              );
            })()}

            {/* Row 8: Tanda Tangan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-[#E2E8F0] rounded-[10px] p-3 bg-[#F7F8FA]">
                <SignaturePadField label="TTD Penyerah" readOnly value={detail.handedOverSignatureBase64} signerName={detail.handedOverByName} />
              </div>
              <div className="border border-[#E2E8F0] rounded-[10px] p-3 bg-[#F7F8FA]">
                <SignaturePadField label="TTD Penerima" readOnly value={detail.receiverSignatureBase64} signerName={detail.receivedByName} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-[#E2E8F0]">
              <div>
                {detail.handoverType === "WarehouseToHelpdesk" && detail.status === "Completed" && currentUserRole() === "warehouse" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirmResetOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 rounded-[10px] text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <Undo2 className="w-4 h-4" />
                      Reset TTD Penerima
                    </button>

                    {/* Confirmation Dialog */}
                    {confirmResetOpen && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
                        <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4 space-y-4">
                          <h3 className="font-bold text-gray-900">Konfirmasi Reset TTD</h3>
                          <p className="text-sm text-gray-600">
                            Apakah Anda yakin ingin mereset tanda tangan penerima untuk <strong>{detail.handoverNumber}</strong>?
                          </p>
                          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            Status serah terima akan kembali ke <strong>"Menunggu TTD Penerima"</strong> dan status perbaikan radio akan kembali ke <strong>"Diserahkan ke Warehouse"</strong>.
                          </p>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmResetOpen(false)}
                              disabled={resettingSignature}
                              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={handleResetReceiverSignature}
                              disabled={resettingSignature}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {resettingSignature && <Loader2 className="w-4 h-4 animate-spin" />}
                              Ya, Reset TTD
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="px-4 py-2 border border-[#E2E8F0] rounded-[10px] text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </ResponsiveModal>

      {/* Sign Row dialog */}
      <ResponsiveModal
        open={!!signRows}
        onOpenChange={() => { setSignRows(null); setSignRowDetails([]); setActiveTagIndex(0); setSigRowReceiver(""); }}
        bottomSheetSize="xl"
        desktopClassName="sm:max-w-2xl"
        title={`TTD Penerima — ${signRows?.[0]?.helpdeskTicketNumber ? `Tiket ${signRows[0].helpdeskTicketNumber}` : "Tanda Tangan"}`}
      >
        {(signRows && signRows.length > 0) && (
          <div className="space-y-4 w-full min-w-0">
            <div className="rounded-lg bg-gray-50 border px-3 py-2 text-sm text-gray-600 mb-2">
              Tiket {signRows[0].helpdeskTicketNumber ?? "—"} · SN {signRows.map(r => r.radioSerialNumber).join(", ")}
            </div>
            <p className="text-sm text-amber-950 bg-amber-100 border-l-4 border-amber-600 rounded-r-lg px-4 py-3 font-semibold shadow-sm">
              {signRows[0].handoverType === "WarehouseToHelpdesk"
                ? <>Warehouse sudah menyerahkan radio. Lengkapi tanda tangan sebagai penerima: <span className="font-bold">{signRows[0].receivedByName}</span>.</>
                : <>Teknisi sudah menyerahkan radio. Lengkapi tanda tangan sebagai penerima: <span className="font-bold">{signRows[0].receivedByName}</span>.</>
              }
            </p>

            {/* Tag Preview */}
            <div className="mb-2 text-sm font-medium text-gray-700">Pratinjau tag (per SN)</div>
            {signRowDetails.length > 0 ? (
              <div className="rounded-lg border bg-white p-3">
                {signRowDetails.length > 1 && (
                  <div className="flex flex-col gap-3 mb-3 border-b border-gray-100 pb-4">
                    <div className="flex items-center justify-between bg-gray-50/80 p-2 rounded-lg border border-gray-200">
                      <button
                        type="button"
                        disabled={activeTagIndex === 0}
                        onClick={() => setActiveTagIndex(prev => prev - 1)}
                        className="px-3 py-1.5 text-xs font-medium border border-gray-200 bg-white rounded-md hover:bg-gray-50 disabled:opacity-40 flex items-center gap-1.5 text-gray-700 shadow-sm transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Tag sebelumnya
                      </button>
                      <div className="text-center">
                        <div className="text-xs font-bold text-gray-800">Tag {activeTagIndex + 1} / {signRowDetails.length}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">SN {signRowDetails[activeTagIndex]?.radioSerialNumber}</div>
                      </div>
                      <button
                        type="button"
                        disabled={activeTagIndex === signRowDetails.length - 1}
                        onClick={() => setActiveTagIndex(prev => prev + 1)}
                        className="px-3 py-1.5 text-xs font-medium border border-gray-200 bg-white rounded-md hover:bg-gray-50 disabled:opacity-40 flex items-center gap-1.5 text-gray-700 shadow-sm transition-colors"
                      >
                        Tag berikutnya <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-start">
                      {signRowDetails.map((det, idx) => (
                        <button
                          key={det.id}
                          type="button"
                          onClick={() => setActiveTagIndex(idx)}
                          className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium border transition-all ${activeTagIndex === idx
                              ? 'bg-[#1B3A6B] text-white border-[#1B3A6B] shadow-sm'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                          {det.radioSerialNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {signRowDetails[activeTagIndex] && (
                  <HandoverTagPreview detail={signRowDetails[activeTagIndex]} />
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-xs border border-dashed rounded-lg bg-gray-50">
                <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                Memuat detail tag...
              </div>
            )}

            <div className="space-y-4 mt-4 bg-gray-50 border border-gray-100 p-4 rounded-xl">
              {signRows[0]?.handoverType === "WarehouseToHelpdesk" && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-900">Nama PIC / Penerima Fisik</label>
                    <button
                      type="button"
                      className="text-xs text-violet-600 hover:text-violet-700 font-medium bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded transition-colors"
                      onClick={() => setSigRowPicReceiverName(signRowDetails[0]?.radioOwnerLabel || signRows[0].radioOwnerLabel || "")}
                    >
                      Gunakan data Pemilik
                    </button>
                  </div>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                    placeholder="Nama pengambil radio (opsional)"
                    value={sigRowPicReceiverName}
                    onChange={(e) => setSigRowPicReceiverName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Catatan Penerima</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                  value={sigRowRemarks}
                  onChange={(e) => setSigRowRemarks(e.target.value)}
                  placeholder="Catatan tambahan (opsional)"
                />
              </div>
            </div>

            <SignaturePadField
              ref={sigWhRowRef}
              label={`TTD Penerima (${signRows[0].receivedByName})`}
              required
              value={sigRowReceiver}
              onChange={(val) => setSigRowReceiver(val ?? "")}
            />
            <div className="flex flex-col-reverse sm:grid sm:grid-cols-2 gap-3 pt-4 border-t border-gray-100">
              <button type="button" className="w-full px-4 py-2.5 border rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors" onClick={() => setSignRows(null)}>Batal</button>
              <button
                type="button"
                className="w-full px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium transition-colors flex items-center justify-center"
                onClick={async () => {
                  const finalSig = (await sigWhRowRef.current?.exportNow()) ?? sigRowReceiver;
                  if (!finalSig) {
                    toast({ title: "Tanda tangan wajib diisi", variant: "destructive" });
                    return;
                  }
                  try {
                    await Promise.all(
                      signRows.map((row) => radioHandoverApi.completeReceiverSignature(row.id, finalSig, sigRowPicReceiverName || undefined, sigRowRemarks || undefined))
                    );
                    toast({ title: `Tanda tangan berhasil disimpan untuk ${signRows.length} radio` });
                    setSignRows(null);
                    setSignRowDetails([]);
                    setActiveTagIndex(0);
                    setSigRowReceiver("");
                    setSigRowPicReceiverName("");
                    setSigRowRemarks("");
                    if (detail && signRows.some(r => r.id === detail.id)) setDetail(null);
                    load();
                  } catch (err: any) {
                    toast({
                      title: "Gagal menyimpan TTD",
                      description: err.response?.data?.message,
                      variant: "destructive"
                    });
                  }
                }}
              >
                Simpan TTD
              </button>
            </div>
          </div>
        )}
      </ResponsiveModal>

      <ImageGalleryModal
        images={galleryImages}
        index={galleryIndex}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onIndexChange={setGalleryIndex}
      />

      {/* Edit Handover Dialog */}
      {editHandover && (
        <EditHandoverDialog
          detail={editHandover}
          onClose={() => setEditHandover(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Ubah Penerima Modal */}
      {changeReceiverId && (
        <ChangeReceiverModal
          open={!!changeReceiverId}
          onOpenChange={(open) => {
            if (!open) setChangeReceiverId(null);
          }}
          handoverId={changeReceiverId}
          receiverType={changeReceiverType}
          currentReceiverUserId={changeReceiverCurrentUserId}
          onSuccess={() => {
            setChangeReceiverId(null);
            load();
            if (detail) {
              openDetail(detail.id);
            }
            toast({
              title: "Penerima diubah",
              description: "Berhasil mengubah akun penerima serah terima.",
            });
          }}
        />
      )}
    </div>
  );
}
