import { useCallback, useEffect, useState, useMemo, useRef, Fragment } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Package,
  ArrowRight,
  Eye,
  Inbox,
  PenLine,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Clock,
  ArrowUpRight,
  ArrowLeft,
  Home
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import { radioRepairApi } from "../../services/radioRepairApi";
import type { RadioHandoverList, RadioHandoverDetail } from "../../types/radioHandover";
import type { RadioRepairJobDetail } from "../../types/radioRepair";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import SignaturePadField, { type SignaturePadHandle } from "../common/SignaturePadField";
import ImageGalleryModal from "../common/ImageGalleryModal";
import HelpdeskToTechnicianForm from "./HelpdeskToTechnicianForm";
import HandoverStatusBadge from "./HandoverStatusBadge";
import HandoverTagPreview from "./HandoverTagPreview";
import HandoverTimeline from "./HandoverTimeline";
import EditHandoverDialog from "./EditHandoverDialog";
import { HandoverPhotoThumb } from "./HandoverPhotoThumbnails";
import { canCreateHandoverHd } from "../../utils/handoverPermissions";
import { isValidSignature } from "../../utils/signatureUtils";
import { hasPermission } from "../../utils/permissionUtils";
import { useToast } from "../../hooks/use-toast";

import { useLiveRefresh } from "../../hooks/useLiveRefresh";

function handoverTypeLabel(t: string) {
  if (t === "HelpdeskToTechnician") return "HD → Tek";
  return t;
}

function handoverTypeBadgeClass(t: string) {
  if (t === "HelpdeskToTechnician") return "bg-blue-100 text-blue-800 border-blue-200";
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

function currentUserRole(): string | null {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u.roleName ?? u.RoleName ?? null;
  } catch {
    return null;
  }
}

type HandoverTableProps = {
  items: RadioHandoverList[];
  loading: boolean;
  flowLabel: string;
  emptyMessage: string;
  onOpenDetail: (id: number) => void;
  onOpenGallery: (h: RadioHandoverList) => void;
  onOpenEdit?: (e: React.MouseEvent, id: number) => void;
  onSoftDelete?: (h: RadioHandoverList) => void;
  onSignRow?: (h: RadioHandoverList) => void;
  canEdit?: boolean;
  canDelete?: boolean;
};

function HandoverHistoryTable({
  items,
  loading,
  flowLabel,
  emptyMessage,
  onOpenDetail,
  onOpenGallery,
  onOpenEdit,
  onSoftDelete,
  onSignRow,
  canEdit,
  canDelete,
}: HandoverTableProps) {
  const uid = currentUserId();
  const role = currentUserRole();

  const canUserSign = (h: RadioHandoverList) => {
    return h.status === "PendingReceiverSignature";
  };

  const groupedItems = useMemo(() => {
    const map = new Map<string, RadioHandoverList[]>();
    items.forEach(h => {
      const key = h.helpdeskTicketNumber || h.radioRepairJobId?.toString() || h.id.toString();
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(h);
    });
    return Array.from(map.entries()).map(([key, group]) => {
      const hasPendingSignature = group.some(h => canUserSign(h));
      const first = group[0];
      return {
        key,
        ticketNumber: first.helpdeskTicketNumber,
        flowLabel: first.handoverType,
        handoverAt: first.handoverAt,
        handedOverByName: first.handedOverByWorkshopTechnicianName || first.handedOverByName,
        receivedByName: first.workshopTechnicianName || first.receivedByName,
        hasPendingSignature,
        firstItem: first,
        items: group
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
                <th className="px-4 py-3 font-semibold text-gray-600 text-right sticky right-0 bg-gray-50/80 z-10">Aksi</th>
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
              {!loading && groupedItems.map((group) => (
                <Fragment key={group.key}>
                  {/* GROUP HEADER ROW */}
                  <tr className="bg-gray-50 border-t border-b border-gray-200">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold border ${handoverTypeBadgeClass(group.flowLabel)}`}>
                          {handoverTypeLabel(group.flowLabel)}
                        </span>
                        <span className="font-semibold text-gray-800">
                          Tiket HD: <span className="font-mono text-blue-700">{group.ticketNumber || "—"}</span>
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
                            onSignRow(group.firstItem);
                          }}
                        >
                          <span className="shrink-0 w-3 h-3 flex items-center justify-center">✍️</span>
                          Tanda Tangan ({group.items.filter(canUserSign).length})
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* CHILD ROWS */}
                  {group.items.map((h, idx) => (
                    <tr
                      key={h.id}
                      className={`cursor-pointer transition-colors hover:bg-blue-50/60 ${idx !== group.items.length - 1 ? 'border-b border-gray-100/60' : ''}`}
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
                          <span className="truncate max-w-[100px]" title={h.handedOverByWorkshopTechnicianName || h.handedOverByName}>
                            {h.handedOverByWorkshopTechnicianName || h.handedOverByName}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate max-w-[100px]" title={h.workshopTechnicianName || h.receivedByName}>
                            {h.workshopTechnicianName || h.receivedByName}
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
                              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
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
                      <td className="px-4 py-3 text-right sticky right-0 bg-white/90 backdrop-blur-sm shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.05)]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-8 h-8 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors bg-white shadow-sm"
                            title="Lihat detail"
                            onClick={() => onOpenDetail(h.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEdit && h.handoverType === "HelpdeskToTechnician" && onOpenEdit && (
                            <button
                              type="button"
                              className="inline-flex items-center justify-center w-8 h-8 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors bg-white shadow-sm"
                              title="Edit Serah Terima"
                              onClick={(e) => onOpenEdit(e, h.id)}
                            >
                              <PenLine className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && onSoftDelete && (
                            <button
                              type="button"
                              className="inline-flex items-center justify-center w-8 h-8 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors bg-white shadow-sm"
                              title="Hapus"
                              onClick={() => onSoftDelete(h)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* ====== MOBILE GROUPED CARD LAYOUT ====== */}
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
            <div key={group.key} className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden">
              
              {/* Group Header */}
              <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-md border ${handoverTypeBadgeClass(group.flowLabel)}`}>
                      {handoverTypeLabel(group.flowLabel)}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {group.handoverAt ? format(new Date(group.handoverAt), "dd MMM yyyy", { locale: localeId }) : "-"}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    Tiket HD: <span className="font-mono text-blue-700">{group.ticketNumber || "—"}</span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1 font-medium">
                    <span className="truncate max-w-[120px]">{group.handedOverByName}</span>
                    <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="truncate max-w-[120px] text-gray-700">{group.receivedByName}</span>
                  </div>
                </div>
              </div>

              {/* Group Items (Radios) */}
              <div className="divide-y divide-gray-100/60">
                {group.items.map((h) => (
                  <div key={h.id} className="p-4 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => onOpenDetail(h.id)}>
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
                              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {h.photoCount}
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onOpenDetail(h.id)}
                          className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && h.handoverType === "HelpdeskToTechnician" && onOpenEdit && (
                          <button
                            type="button"
                            onClick={(e) => onOpenEdit(e, h.id)}
                            className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && onSoftDelete && (
                          <button
                            type="button"
                            onClick={() => onSoftDelete(h)}
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Group Footer (Mass Signature Button) */}
              {group.hasPendingSignature && onSignRow && (
                <div className="px-4 py-3 bg-violet-50/40 border-t border-violet-100 flex justify-end">
                  <button
                    type="button"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-[10px] text-[13px] font-semibold hover:bg-violet-700 transition-colors shadow-sm"
                    title="Tanda Tangan Massal"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSignRow(group.firstItem);
                    }}
                  >
                    <span className="shrink-0 w-4 h-4 flex items-center justify-center">✍️</span>
                    Tanda Tangan ({group.items.filter(canUserSign).length} Radio)
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
export default function RadioHandoverPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [outgoing, setOutgoing] = useState<RadioHandoverList[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const [loadingOutgoing, setLoadingOutgoing] = useState(true);

  const [detail, setDetail] = useState<RadioHandoverDetail | null>(null);
  const [detailJob, setDetailJob] = useState<RadioRepairJobDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editDetail, setEditDetail] = useState<RadioHandoverDetail | null>(null);

  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const [showCreate, setShowCreate] = useState(false);

  const [signRow, setSignRow] = useState<RadioHandoverList | null>(null);
  const [signRowDetail, setSignRowDetail] = useState<RadioHandoverDetail | null>(null);
  const [sigRowReceiver, setSigRowReceiver] = useState<string | null>(null);
  const [sigRowPicReceiverName, setSigRowPicReceiverName] = useState("");
  const [completing, setCompleting] = useState(false);
  const sigTekRowRef = useRef<SignaturePadHandle>(null);

  const canDelete = hasPermission("radio.handover.delete");
  const isHd = canCreateHandoverHd();

  // Fetch full detail when sign dialog opens for tag preview
  useEffect(() => {
    if (!signRow) { setSignRowDetail(null); return; }
    radioHandoverApi.getById(signRow.id)
      .then(setSignRowDetail)
      .catch(() => setSignRowDetail(null));
  }, [signRow]);

  const relatedPendingHandovers = useMemo(() => {
    if (!signRow || !signRow.helpdeskTicketNumber) return [];
    return outgoing.filter(h => 
      h.helpdeskTicketNumber === signRow.helpdeskTicketNumber && 
      h.handoverType === signRow.handoverType &&
      h.status === "PendingReceiverSignature"
    );
  }, [signRow, outgoing]);


  const load = useCallback(() => {
    setLoadingOutgoing(true);

    radioHandoverApi
      .getAll({ page: 1, pageSize: 50, handoverType: "HelpdeskToTechnician" })
      .then((r) => {
        setOutgoing(r.data ?? []);
        const pending = (r.data ?? []).filter((h) => h.status === "PendingReceiverSignature").length;
        setPendingCount(pending);
      })
      .catch(() => setOutgoing([]))
      .finally(() => setLoadingOutgoing(false));
  }, []);

  useLiveRefresh("RadioHandover", () => {
    load();
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

  const openEdit = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const d = await radioHandoverApi.getById(id);
      setEditDetail(d);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast({
        title: "Gagal membuka edit",
        description: ax.response?.data?.message,
        variant: "destructive",
      });
    }
  };

  const softDelete = async (h: RadioHandoverList) => {
    if (!window.confirm(`Hapus STR ${h.handoverNumber}?`)) return;
    try {
      await radioHandoverApi.softDelete(h.id);
      toast({ title: "Dipindah ke arsip" });
      load();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast({ title: "Gagal", description: ax.response?.data?.message, variant: "destructive" });
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

  const completeReceiverFromRow = async () => {
    if (!signRow) return;
    const tekSig = (await sigTekRowRef.current?.exportNow()) ?? sigRowReceiver;
    if (!isValidSignature(tekSig)) {
      toast({ title: "Gambar TTD teknisi di area putih", variant: "destructive" });
      return;
    }

    setCompleting(true);

    const targets = relatedPendingHandovers.length > 0 ? relatedPendingHandovers : [signRow];

    try {
      let okCount = 0;
      const fails: string[] = [];
      
      await Promise.all(targets.map(async (t) => {
        try {
          await radioHandoverApi.completeReceiverSignature(t.id, tekSig!, sigRowPicReceiverName || undefined);
          okCount++;
        } catch(e) {
          fails.push(t.radioSerialNumber);
        }
      }));
      
      if (fails.length > 0) {
        toast({ 
          title: `Selesai dengan error (${okCount} berhasil, ${fails.length} gagal)`, 
          description: `Gagal menyimpan TTD untuk SN: ${fails.join(", ")}`,
          variant: "destructive" 
        });
      } else {
        toast({ title: `Serah terima selesai (${okCount} radio)` });
      }
      
      setSignRow(null);
      setSigRowReceiver(null);
      setSigRowPicReceiverName("");
      if (detail?.id === signRow.id) setDetail(null);
      load();
    } catch (err: unknown) {
      toast({
        title: err instanceof Error ? err.message : "Gagal menyimpan TTD",
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* ====== MOBILE INTEGRATED HEADER ====== */}
      <div className="md:hidden bg-white rounded-[14px] border border-[#E2E8F0] shadow-sm mb-4">
        <div className="flex items-start gap-4 p-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#FFF0EB] flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-[#D94F2B]" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#D94F2B] tracking-[0.1em] uppercase mb-0.5">Radio & Fleet</p>
            <h1 className="text-[20px] font-bold text-[#1A202C] leading-tight">Serah Terima Radio</h1>
            <p className="text-[12px] text-[#718096] mt-0.5">Kelola serah terima radio ke teknisi</p>
          </div>
          <button
            onClick={() => navigate("/radio")}
            className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-[#F7F8FA] border border-[#E2E8F0] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="hidden md:flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Serah Terima Radio (Teknisi)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola serah terima radio rusak ke teknisi.
          </p>
        </div>
        {isHd && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> HD ke Teknisi
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardDescription className="text-amber-800/80 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Menunggu TTD Penerima
            </CardDescription>
            <CardTitle className="text-3xl text-amber-900">{pendingCount}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-xs text-amber-700/80">Helpdesk → Teknisi (Pending)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardDescription className="flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
              Serah ke Teknisi
            </CardDescription>
            <CardTitle className="text-3xl text-gray-900">{outgoing.length}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-xs text-gray-500">Total Histori HD → Tek</p>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Histori serah terima</h2>
        <HandoverHistoryTable
          items={outgoing}
          loading={loadingOutgoing}
          flowLabel="Helpdesk → Teknisi"
          emptyMessage="Belum ada serah terima ke teknisi"
          onOpenDetail={openDetail}
          onOpenGallery={openGallery}
          onOpenEdit={openEdit}
          onSoftDelete={softDelete}
          onSignRow={setSignRow}
          canEdit={isHd}
          canDelete={canDelete}
        />
      </section>

      {/* ── Mobile FAB ── */}
      {isHd && (
        <button
          onClick={() => setShowCreate(true)}
          className="md:hidden fixed bottom-[100px] right-4 z-30 flex items-center gap-2 bg-[#D94F2B] hover:bg-[#B83D20] text-white px-5 py-3.5 rounded-full shadow-lg font-bold shadow-[#D94F2B]/40 transition-all active:scale-95 text-[15px]"
        >
          <Plus className="w-5 h-5" /> HD → Tek
        </button>
      )}

      {/* HD -> Tek create dialog */}
      {showCreate && (
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-blue-600" />
                Serah Terima Helpdesk → Teknisi
              </DialogTitle>
            </DialogHeader>
            <HelpdeskToTechnicianForm
              onSuccess={() => {
                setShowCreate(false);
                load();
              }}
              onCancel={() => setShowCreate(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit dialog */}
      {editDetail && (
        <EditHandoverDialog
          detail={editDetail}
          onClose={() => setEditDetail(null)}
          onSuccess={() => {
            setEditDetail(null);
            load();
            if (detail?.id === editDetail.id) {
              openDetail(editDetail.id);
            }
          }}
        />
      )}

      {/* Sign Row dialog */}
      <Dialog open={!!signRow} onOpenChange={() => { setSignRow(null); setSignRowDetail(null); setSigRowReceiver(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>TTD Penerima — {signRow?.handoverNumber}</DialogTitle>
          </DialogHeader>
          {signRow && (
            <div className="space-y-3 text-sm w-full min-w-0">
              <p className="text-gray-600">
                Tiket {signRow.helpdeskTicketNumber ?? "—"} · SN {signRow.radioSerialNumber}
              </p>
              <p className="text-amber-950 text-sm bg-amber-100 border-l-4 border-amber-600 rounded-r-lg px-4 py-3 font-semibold shadow-sm">
                Helpdesk sudah menyerahkan. Lengkapi tanda tangan sebagai penerima: <span className="font-bold">{signRow.workshopTechnicianName || signRow.receivedByName}</span>.
              </p>

              {/* Tag Preview */}
              {signRowDetail && (
                <div className="rounded-lg border bg-white p-3">
                  <HandoverTagPreview detail={signRowDetail} />
                </div>
              )}
              {!signRowDetail && (
                <div className="text-center py-4 text-gray-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin inline-block mr-1" />
                  Memuat detail tag...
                </div>
              )}

              {relatedPendingHandovers.length > 1 && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 text-sm shadow-sm mt-3">
                  <span className="font-semibold block mb-1">Tanda Tangan Massal</span>
                  Terdapat <strong>{relatedPendingHandovers.length} radio</strong> dari tiket <strong>{signRow.helpdeskTicketNumber}</strong> yang menunggu Tanda Tangan Anda. Tanda tangan ini akan otomatis diterapkan ke semuanya sekaligus.
                  <ul className="list-disc pl-5 mt-1.5 text-xs opacity-80 max-h-24 overflow-y-auto no-scrollbar">
                    {relatedPendingHandovers.map(h => (
                      <li key={h.id}>SN: <span className="font-medium">{h.radioSerialNumber}</span> ({h.handoverNumber})</li>
                    ))}
                  </ul>
                </div>
              )}

              {signRow.handoverType === "WarehouseToHelpdesk" && (
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-900">Nama PIC Penerima (opsional)</label>
                    <button
                      type="button"
                      className="text-xs text-violet-600 hover:text-violet-700 font-medium bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded transition-colors"
                      onClick={() => setSigRowPicReceiverName(signRow.radioOwnerLabel || "")}
                    >
                      Gunakan data Pemilik
                    </button>
                  </div>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                    placeholder="Nama pengambil radio..."
                    value={sigRowPicReceiverName}
                    onChange={(e) => setSigRowPicReceiverName(e.target.value)}
                  />
                </div>
              )}

              <SignaturePadField
                ref={sigTekRowRef}
                label={`TTD Penerima (${signRow.workshopTechnicianName || signRow.receivedByName})`}
                required
                value={sigRowReceiver}
                onChange={setSigRowReceiver}
              />
              <div className="flex flex-col-reverse sm:grid sm:grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                <button type="button" className="w-full px-4 py-2.5 border rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors" onClick={() => setSignRow(null)}>
                  Batal
                </button>
                <button
                  type="button"
                  disabled={completing}
                  className="w-full px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  onClick={completeReceiverFromRow}
                >
                  {completing ? "Menyimpan..." : "Simpan TTD & Done"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detail || detailLoading} onOpenChange={(open) => { if (!open && !detailLoading) { setDetail(null); setDetailJob(null); } }}>
        <DialogContent
          className="max-w-3xl"
          onInteractOutside={(e) => {
            if (galleryOpen) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 pr-8">
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
            </DialogTitle>
          </DialogHeader>
          {detail && !detailLoading && (
            <div className="space-y-5 text-sm">
              {detailJob?.handovers && detailJob.handovers.length > 0 && (
                <HandoverTimeline handovers={detailJob.handovers} />
              )}
              <HandoverTagPreview detail={detail} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border bg-gray-50/80 p-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status job</p>
                  <p className="mt-0.5 font-medium text-gray-900">{detail.jobStatus}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Waktu serah</p>
                  <p className="mt-0.5 font-medium text-gray-900">
                    {format(new Date(detail.handoverAt), "dd MMMM yyyy, HH:mm", { locale: localeId })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Penyerah</p>
                  <p className="mt-0.5 text-gray-900">{detail.handedOverByWorkshopTechnicianName || detail.handedOverByName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Penerima</p>
                  <p className="mt-0.5 text-gray-900">{detail.workshopTechnicianName || detail.receivedByName}</p>
                </div>
              </div>

              {detail.remarks && (
                <p className="text-gray-600 rounded-lg border bg-white px-3 py-2">
                  <span className="font-medium text-gray-700">Catatan: </span>
                  {detail.remarks}
                </p>
              )}

              {(() => {
                const imgs = resolveHandoverPhotos(detail);
                if (imgs.length === 0) return null;
                return (
                  <div>
                    <p className="font-medium text-gray-800 mb-2">Foto radio</p>
                    <div className="flex flex-wrap gap-2">
                      {imgs.map((src, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => openGalleryFromDetail(imgs, i)}
                          className="relative w-24 h-24 rounded-lg border overflow-hidden hover:ring-2 ring-blue-400 transition-shadow"
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
                <SignaturePadField label="TTD Penyerah" readOnly value={detail.handedOverSignatureBase64} signerName={detail.handedOverByWorkshopTechnicianName || detail.handedOverByName} />
                {detail.hasReceiverSignature ? (
                  <SignaturePadField label="TTD Penerima" readOnly value={detail.receiverSignatureBase64} signerName={detail.workshopTechnicianName || detail.receivedByName} />
                ) : currentUserId() === detail.receivedByUserId ? (
                  <div className="space-y-2 border border-amber-200 bg-amber-50/50 rounded-lg p-3">
                    <p className="text-amber-800 font-medium">Lengkapi TTD sebagai teknisi penerima</p>
                    <SignaturePadField label="TTD Penerima" readOnly />
                    <p className="text-xs text-amber-700">Tutup detail dan gunakan tombol (Pen) di baris tabel untuk tanda tangan.</p>
                  </div>
                ) : (
                  <p className="text-amber-700 text-xs mt-2">Menunggu tanda tangan penerima.</p>
                )}
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
        </DialogContent>
      </Dialog>

      <ImageGalleryModal
        images={galleryImages}
        index={galleryIndex}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onIndexChange={setGalleryIndex}
      />
    </div>
  );
}
