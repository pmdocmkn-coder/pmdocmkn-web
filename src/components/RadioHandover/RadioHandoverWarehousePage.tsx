import React, { useCallback, useEffect, useState, useRef, useMemo, Fragment } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Search, Filter, Warehouse, PackageCheck, Image as ImageIcon, Loader2, ArrowRight, User, FileText, MessageSquare, ArrowDownLeft, ArrowUpRight, Home, ChevronRight, ChevronLeft, Inbox, ClipboardList, Edit, Eye, ArrowLeft } from "lucide-react";
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
import { HandoverPhotoThumb } from "./HandoverPhotoThumbnails";
import { canCreateHandoverWhHd } from "../../utils/handoverPermissions";
import { useToast } from "../../hooks/use-toast";
import EditHandoverDialog from "./EditHandoverDialog";

function handoverTypeLabel(t: string) {
  if (t === "HelpdeskToTechnician") return "HD → Tek";
  if (t === "TechnicianToWarehouse") return "Tek → WH";
  if (t === "WarehouseToHelpdesk") return "WH → HD";
  return t;
}

function handoverTypeBadgeClass(t: string) {
  if (t === "TechnicianToWarehouse") return "bg-violet-100 text-violet-800 border-violet-200";
  if (t === "WarehouseToHelpdesk") return "bg-indigo-100 text-indigo-800 border-indigo-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

function resolveHandoverPhotos(d: {
  radioPhotos?: string[];
  radioPhotoBase64?: string | null;
}): string[] {
  if (d.radioPhotos && d.radioPhotos.length > 0) return d.radioPhotos;
  if (d.radioPhotoBase64) return [d.radioPhotoBase64];
  return [];
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
    return u.userId ?? u.UserId ?? null;
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
    // Only the designated receiver can sign
    return h.status === "PendingReceiverSignature" && h.receivedByUserId === myId;
  };
  // Warehouse hanya bisa edit serah terima yang ditujukan ke dirinya
  // (atau jika penerima belum ditentukan)
  const canWarehouseEdit = (_h: RadioHandoverList) => {
    const role = currentUserRole();
    if (role === "helpdesk") return false;
    
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
                <th className="px-4 py-3 font-semibold text-gray-600">Tiket Helpdesk</th>
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
                    <tr className="bg-gray-50 border-t border-b border-gray-200">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold border ${handoverTypeBadgeClass(
                              group.flowLabel
                            )}`}
                          >
                            {handoverTypeLabel(group.flowLabel)}
                          </span>
                          <span className="font-semibold text-gray-800">
                            Tiket HD: <span className="font-mono text-violet-700">{group.ticketNumber || "—"}</span>
                          </span>
                          <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border">
                            {group.items.length} Radio
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right sticky right-0 bg-gray-50 z-10 shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.05)] border-l border-gray-100">
                        {group.hasPendingSignature && onSignRow && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 transition-colors shadow-sm whitespace-nowrap"
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
                        className={`cursor-pointer transition-colors hover:bg-violet-50/60 ${
                          idx !== group.items.length - 1 ? "border-b border-gray-100/60" : ""
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
                          <div className="font-medium text-gray-900">{h.radioSerialNumber}</div>
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
                            <ArrowRight className="w-3.5 h-3.5 text-violet-500 shrink-0" />
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
                          {h.previewPhotoBase64 || h.photoCount > 0 ? (
                            <div className="relative inline-block">
                              <HandoverPhotoThumb photo={h.previewPhotoBase64} onClick={() => onOpenGallery(h)} />
                              {h.photoCount > 1 && (
                                <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                                  {h.photoCount}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {format(new Date(h.handoverAt), "dd MMM yyyy", { locale: localeId })}
                          <div className="text-xs text-gray-400">
                            {format(new Date(h.handoverAt), "HH:mm", { locale: localeId })}
                          </div>
                        </td>
                        <td
                          className="px-4 py-3 text-right sticky right-0 bg-white group-hover/tr:bg-violet-50/60 transition-colors z-10 border-l border-gray-100/60"
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
                              className="inline-flex items-center justify-center w-8 h-8 border border-violet-200 rounded-lg text-violet-700 hover:bg-violet-50 transition-colors bg-white shadow-sm"
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
              className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden"
            >
              <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-md border ${handoverTypeBadgeClass(
                        group.flowLabel
                      )}`}
                    >
                      {handoverTypeLabel(group.flowLabel)}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {group.handoverAt ? format(new Date(group.handoverAt), "dd MMM yyyy", { locale: localeId }) : "-"}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    Tiket HD: <span className="font-mono text-violet-700">{group.ticketNumber || "—"}</span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1 font-medium">
                    <span className="truncate max-w-[120px]">{group.handedOverByName}</span>
                    <ArrowRight className="w-3 h-3 text-violet-400 shrink-0" />
                    <span className="truncate max-w-[120px] text-gray-700">{group.receivedByName}</span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100/60">
                {group.items.map((h) => (
                  <div
                    key={h.id}
                    className="p-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => onOpenDetail(h.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{h.radioSerialNumber}</p>
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
                        {h.previewPhotoBase64 || h.photoCount > 0 ? (
                          <div className="relative mr-1" onClick={(e) => e.stopPropagation()}>
                            <HandoverPhotoThumb photo={h.previewPhotoBase64} onClick={() => onOpenGallery(h)} />
                            {h.photoCount > 1 && (
                              <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
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
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-bold shadow-sm"
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
  const [incoming, setIncoming] = useState<RadioHandoverList[]>([]);
  const [outgoing, setOutgoing] = useState<RadioHandoverList[]>([]);
  const [pendingJobs, setPendingJobs] = useState<RadioRepairJobList[]>([]);
  const [loadingIncoming, setLoadingIncoming] = useState(true);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [signRows, setSignRows] = useState<RadioHandoverList[] | null>(null);
  const [signRowDetails, setSignRowDetails] = useState<RadioHandoverDetail[]>([]);
  const [activeTagIndex, setActiveTagIndex] = useState(0);
  const [sigRowReceiver, setSigRowReceiver] = useState<string>("");
  const [sigRowPicReceiverName, setSigRowPicReceiverName] = useState("");
  const [sigRowRemarks, setSigRowRemarks] = useState("");
  const sigWhRowRef = useRef<any>(null);
  const [editHandover, setEditHandover] = useState<RadioHandoverDetail | null>(null);

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
      return; 
    }
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

  const filteredIncoming = incoming.filter((h) => 
    h.radioSerialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.helpdeskTicketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.handoverNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.handedOverByName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOutgoing = outgoing.filter((h) => 
    h.radioSerialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.helpdeskTicketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.handoverNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.receivedByName?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const load = useCallback((silent = false) => {
    if (!silent) {
      setLoadingIncoming(true);
      setLoadingOutgoing(true);
    }

    radioHandoverApi
      .getAll({ page: 1, pageSize: 50, handoverType: "TechnicianToWarehouse" })
      .then((r) => setIncoming(r.data ?? []))
      .catch(() => setIncoming([]))
      .finally(() => { if (!silent) setLoadingIncoming(false); });

    radioHandoverApi
      .getAll({ page: 1, pageSize: 50, handoverType: "WarehouseToHelpdesk" })
      .then((r) => setOutgoing(r.data ?? []))
      .catch(() => setOutgoing([]))
      .finally(() => { if (!silent) setLoadingOutgoing(false); });

    radioRepairApi
      .getAll({ page: 1, pageSize: 50, status: "HandedToWarehouse" })
      .then((r) => setPendingJobs(r.data ?? []))
      .catch(() => setPendingJobs([]));
  }, []);

  useLiveRefresh("RadioHandover", () => {
    load(true);
  });

  useLiveRefresh("RadioRepairJob", () => {
    load(true);
  });

  useEffect(() => {
    load();
  }, [load]);

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
      </div>

      {/* ====== DESKTOP HEADER ====== */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Warehouse className="w-7 h-7 text-violet-600 shrink-0" />
            Radio Masuk Warehouse
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Kelola penerimaan radio dari teknisi dan penyerahan kembali ke helpdesk. Klik baris atau tombol Detail
            untuk melihat foto dan tanda tangan.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-1 md:pb-2 pt-3 md:pt-4 px-3 md:px-4">
            <CardDescription className="text-amber-800/80 flex items-center gap-1 md:gap-1.5 text-[10px] md:text-sm">
              <PackageCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Siap ke Helpdesk</span>
              <span className="sm:hidden">Siap HD</span>
            </CardDescription>
            <CardTitle className="text-2xl md:text-3xl text-amber-900">{pendingJobs.length}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-4 pb-3 md:pb-4 pt-0">
            <p className="text-[10px] md:text-xs text-amber-700/80 hidden sm:block">Job status HandedToWarehouse</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 md:pb-2 pt-3 md:pt-4 px-3 md:px-4">
            <CardDescription className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-sm">
              <ArrowDownLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-violet-600" />
              <span className="hidden sm:inline">Masuk dari Teknisi</span>
              <span className="sm:hidden">Masuk</span>
            </CardDescription>
            <CardTitle className="text-2xl md:text-3xl text-gray-900">{incoming.length}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-4 pb-3 md:pb-4 pt-0">
            <p className="text-[10px] md:text-xs text-gray-500 hidden sm:block">Histori Tek → WH</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 md:pb-2 pt-3 md:pt-4 px-3 md:px-4">
            <CardDescription className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-sm">
              <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-600" />
              <span className="hidden sm:inline">Serah ke Helpdesk</span>
              <span className="sm:hidden">Keluar</span>
            </CardDescription>
            <CardTitle className="text-2xl md:text-3xl text-gray-900">{outgoing.length}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-4 pb-3 md:pb-4 pt-0">
            <p className="text-[10px] md:text-xs text-gray-500 hidden sm:block">Histori WH → HD</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending jobs */}
      {pendingJobs.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-600" />
            <h2 className="text-base md:text-lg font-semibold text-gray-900">
              {canCreateHandoverWhHd() ? "Perlu tindakan" : "Menunggu serah"}
            </h2>
          </div>
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
                    <td className="px-4 py-3 font-medium">{j.radioSerialNumber}</td>
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
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 shadow-sm transition-colors"
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
                    <div className="font-bold text-gray-900">{j.radioSerialNumber}</div>
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
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 shadow-sm transition-colors"
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
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white"
            />
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="bg-gray-100 p-1 h-auto w-full md:w-auto">
            <TabsTrigger value="incoming" className="gap-1.5 md:gap-2 px-3 md:px-4 py-2 data-[state=active]:shadow-sm flex-1 md:flex-none text-xs md:text-sm">
              <ArrowDownLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Masuk dari Teknisi</span>
              <span className="sm:hidden">Masuk</span>
              {!loadingIncoming && incoming.length > 0 && (
                <span className="ml-1 bg-violet-100 text-violet-700 text-[10px] md:text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {incoming.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="gap-1.5 md:gap-2 px-3 md:px-4 py-2 data-[state=active]:shadow-sm flex-1 md:flex-none text-xs md:text-sm">
              <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Serah ke Helpdesk</span>
              <span className="sm:hidden">Keluar</span>
              {!loadingOutgoing && outgoing.length > 0 && (
                <span className="ml-1 bg-indigo-100 text-indigo-700 text-[10px] md:text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {outgoing.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="mt-4 space-y-2">
            <p className="text-sm text-gray-500">
              Daftar radio yang sudah diserahkan teknisi ke warehouse (Tek → WH).
            </p>
            <HandoverHistoryTable
              items={filteredIncoming}
              loading={loadingIncoming}
              flowLabel="Teknisi → Warehouse"
              emptyMessage="Belum ada radio masuk dari teknisi"
              onOpenDetail={openDetail}
              onOpenGallery={openGallery}
              onSignRow={setSignRows}
              onEdit={handleEdit}
            />
          </TabsContent>

          <TabsContent value="outgoing" className="mt-4 space-y-2">
            <p className="text-sm text-gray-500">
              Daftar radio yang sudah diserahkan warehouse ke helpdesk (WH → HD).
            </p>
            <HandoverHistoryTable
              items={filteredOutgoing}
              loading={loadingOutgoing}
              flowLabel="Warehouse → Helpdesk"
              emptyMessage="Belum ada serah terima ke helpdesk"
              onOpenDetail={openDetail}
              onOpenGallery={openGallery}
              onSignRow={setSignRows}
              onEdit={isWorkshopUser ? undefined : handleEdit}
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
              <ArrowUpRight className="w-5 h-5 text-indigo-600" />
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
          <div className="space-y-6 pt-2 w-full min-w-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-xl p-4 border">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Tgl Serah Terima</p>
                <p className="font-medium text-gray-900 mt-1">{format(new Date(detail.handoverAt), "dd MMM yyyy HH:mm", { locale: localeId })}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">SN Radio</p>
                <p className="font-mono font-bold text-indigo-700 mt-1">{detail.radioSerialNumber}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 uppercase font-semibold">Label Kepemilikan</p>
                <p className="font-medium text-gray-900 mt-1">{detail.radioOwnerLabel || "—"}</p>
              </div>
            </div>

            {detailJob && (
              <div className="flex items-start gap-3 p-3 border border-indigo-100 bg-indigo-50/50 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-500 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Tiket: {detailJob.helpdeskTicketNumber || "—"}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {detailJob.unitNumber && <span className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200 mr-2">{detailJob.unitNumber}</span>}
                    {detailJob.equipmentName && <span className="text-gray-700 font-medium mr-2">{detailJob.equipmentName}</span>}
                    Keluhan: <span className="italic">"{detailJob.damageDescription}"</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-xl bg-white shadow-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Diserahkan Oleh</h4>
                <p className="font-semibold text-gray-900">{detail.handedOverByName}</p>
              </div>
              <div className="p-4 border rounded-xl bg-white shadow-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Diterima Oleh</h4>
                <p className="font-semibold text-gray-900">{detail.receivedByName}</p>
                {detail.picReceiverName && (
                  <p className="text-xs font-medium text-violet-700 bg-violet-50 px-2 py-1 rounded mt-2 inline-block">
                    PIC Fisik: {detail.picReceiverName}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Kondisi Diserahkan</p>
                  <p className="text-sm text-gray-600 mt-1">{detail.physicalCondition || detail.damageDescription || "—"}</p>
                </div>
              </div>
              {detail.remarks && (
                <div className="flex items-start gap-3 pt-3 border-t">
                  <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Catatan Penerima</p>
                    <p className="text-sm text-gray-600 mt-1 italic">"{detail.remarks}"</p>
                  </div>
                </div>
              )}
            </div>

            {(() => {
              const b64Images = detail.radioPhotos || (detail.radioPhotoBase64 ? [detail.radioPhotoBase64] : []);
              if (b64Images.length === 0) return null;
              return (
                <div>
                  <p className="font-medium text-gray-800 mb-2">Foto Fisik ({b64Images.length})</p>
                  <div className="flex flex-wrap gap-3">
                    {b64Images.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => openGallery(detail)}
                        className="relative w-24 h-24 rounded-lg border overflow-hidden hover:ring-2 ring-violet-400 transition-shadow"
                      >
                        <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Klik foto untuk memperbesar</p>
                </div>
              );
            })()}

            {(detail.accessories?.length ?? 0) > 0 && (
              <div>
                <p className="font-medium text-gray-800 mb-2">Aksesoris</p>
                <table className="w-full text-xs border rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2">Barang</th>
                      <th className="text-left px-3 py-2">Qty</th>
                      <th className="text-left px-3 py-2">Unit</th>
                      <th className="text-left px-3 py-2">SN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.accessories.map((a, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{a.itemName}</td>
                        <td className="px-3 py-2">{a.quantity}</td>
                        <td className="px-3 py-2">{a.unit}</td>
                        <td className="px-3 py-2 text-gray-500">{a.serialNumber || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SignaturePadField label="TTD Penyerah" readOnly value={detail.handedOverSignatureBase64} signerName={detail.handedOverByName} />
              <SignaturePadField label="TTD Penerima" readOnly value={detail.receiverSignatureBase64} signerName={detail.receivedByName} />
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
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
                          className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                            activeTagIndex === idx 
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

            {signRows[0]?.handoverType === "WarehouseToHelpdesk" && (
              <div className="space-y-4 mt-4 bg-gray-50 border border-gray-100 p-4 rounded-xl">
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Catatan</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                    value={sigRowRemarks}
                    onChange={(e) => setSigRowRemarks(e.target.value)}
                    placeholder="Catatan tambahan (opsional)"
                  />
                </div>
              </div>
            )}

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
    </div>
  );
}
