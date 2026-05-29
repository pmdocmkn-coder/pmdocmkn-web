import { useCallback, useEffect, useState } from "react";
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
  Home
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { useRef } from "react";

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

  const canTechnicianSign = (h: RadioHandoverList) =>
    h.status === "PendingReceiverSignature" &&
    h.handoverType === "HelpdeskToTechnician" &&
    uid != null &&
    h.receivedByUserId === uid;

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
              {!loading &&
                items.map((h, idx) => (
                  <tr
                    key={h.id}
                    className={`border-t cursor-pointer transition-colors hover:bg-blue-50/60 ${idx % 2 === 1 ? "bg-gray-50/40" : ""
                      }`}
                    onClick={() => onOpenDetail(h.id)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-blue-700">{h.handoverNumber}</span>
                      <div className="mt-1">
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${handoverTypeBadgeClass(h.handoverType)}`}
                        >
                          {handoverTypeLabel(h.handoverType)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-800">
                      {h.helpdeskTicketNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{h.radioSerialNumber}</div>
                      {h.equipmentName && <div className="text-xs text-gray-500">{h.equipmentName}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <span className="truncate max-w-[100px]" title={h.handedOverByName}>
                          {h.handedOverByName}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate max-w-[100px]" title={h.receivedByName}>
                          {h.receivedByName}
                        </span>
                      </div>
                      <div className="mt-1">
                        <HandoverStatusBadge status={h.status} />
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {h.previewPhotoBase64 || h.photoCount > 0 ? (
                        <div className="relative">
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
                        {canTechnicianSign(h) && onSignRow && (
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-8 h-8 border border-amber-200 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors bg-white shadow-sm"
                            title="Tanda tangan penerima"
                            onClick={() => onSignRow(h)}
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
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* ====== MOBILE CARD LAYOUT ====== */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
            Memuat data...
          </div>
        ) : items.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          items.map((h) => (
            <div key={h.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2.5 relative">
              {/* Row 1: Flow Type Badge + Date */}
              <div className="flex justify-between items-start">
                <span className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-semibold rounded-full border ${handoverTypeBadgeClass(h.handoverType)}`}>
                  {handoverTypeLabel(h.handoverType)}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {h.handoverAt ? format(new Date(h.handoverAt), "dd MMM yyyy", { locale: localeId }) : "-"}
                </span>
              </div>

              {/* Row 2: SN + Unit/Alat */}
              <div>
                <p className="text-sm font-bold text-gray-900">{h.radioSerialNumber}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Unit: {h.unitNumber || "-"} • Alat: {h.equipmentName || "-"}
                </p>
              </div>

              {/* Row 3: Detail Grid Box */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-2.5">
                <div><span className="text-gray-400">STR:</span> <span className="font-mono font-medium text-blue-700">{h.handoverNumber}</span></div>
                <div><span className="text-gray-400">Tiket HD:</span> <span className="font-mono">{h.helpdeskTicketNumber || "-"}</span></div>
                <div className="col-span-2 flex items-baseline gap-1.5 pt-1.5 border-t border-gray-200/50 mt-0.5">
                  <span className="text-gray-400 shrink-0">Alur:</span>
                  <div className="flex items-center gap-1 text-gray-700 font-medium">
                    <span className="truncate max-w-[80px]" title={h.handedOverByName}>{h.handedOverByName}</span>
                    <ArrowRight className="w-3 h-3 text-blue-500 shrink-0 mx-0.5" />
                    <span className="truncate max-w-[80px]" title={h.receivedByName}>{h.receivedByName}</span>
                  </div>
                </div>
              </div>

              {/* Row 4: Status & Actions */}
              <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-2">
                  <HandoverStatusBadge status={h.status} />
                </div>
                <div className="flex gap-1.5 shrink-0 ml-auto items-center" onClick={(e) => e.stopPropagation()}>
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

                  <button
                    type="button"
                    onClick={() => onOpenDetail(h.id)}
                    className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Detail"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {canEdit && h.handoverType === "HelpdeskToTechnician" && onOpenEdit && (
                    <button
                      type="button"
                      onClick={(e) => onOpenEdit(e, h.id)}
                      className="text-gray-500 hover:text-violet-600 p-1.5 rounded-lg hover:bg-violet-50 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}

                  {canTechnicianSign(h) && onSignRow && (
                    <button
                      type="button"
                      onClick={() => onSignRow(h)}
                      className="inline-flex items-center justify-center h-7 px-2.5 border border-amber-200 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-semibold transition-colors"
                      title="TTD Penerima"
                    >
                      <PenLine className="w-3.5 h-3.5 mr-1" /> TTD
                    </button>
                  )}

                  {canDelete && onSoftDelete && (
                    <button
                      type="button"
                      onClick={() => onSoftDelete(h)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
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
  const [sigRowReceiver, setSigRowReceiver] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const sigTekRowRef = useRef<SignaturePadHandle>(null);

  const canDelete = hasPermission("radio.handover.delete");
  const isHd = canCreateHandoverHd();

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

  useEffect(() => {
    load();
  }, [load]);

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
    try {
      await radioHandoverApi.completeReceiverSignature(signRow.id, tekSig!);
      toast({ title: "Serah terima selesai (Done)" });
      setSignRow(null);
      setSigRowReceiver(null);
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
      <div className="md:hidden -mx-4 -mt-4 mb-4 px-4 pt-4 pb-4 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] rounded-b-3xl">
        <div className="flex items-start justify-between pb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1 opacity-80">
              <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">Radio Management</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
              Serah Terima Radio
            </h1>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors shrink-0"
          >
            <Home className="h-4 w-4" strokeWidth={2.5} />
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
          className="md:hidden fixed bottom-24 right-4 z-30 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3.5 rounded-full shadow-lg font-bold shadow-blue-500/40 transition-all active:scale-95 text-[15px]"
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
      <Dialog open={!!signRow} onOpenChange={() => { setSignRow(null); setSigRowReceiver(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>TTD Penerima — {signRow?.handoverNumber}</DialogTitle>
          </DialogHeader>
          {signRow && (
            <div className="space-y-3 text-sm">
              <p className="text-gray-600">
                Tiket {signRow.helpdeskTicketNumber ?? "—"} · SN {signRow.radioSerialNumber}
              </p>
              <p className="text-amber-800 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Helpdesk sudah menyerahkan. Lengkapi tanda tangan sebagai penerima ({signRow.receivedByName}).
              </p>
              <SignaturePadField
                ref={sigTekRowRef}
                label="TTD Penerima *"
                required
                value={sigRowReceiver}
                onChange={setSigRowReceiver}
              />
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" className="px-4 py-2 border rounded-lg hover:bg-gray-50" onClick={() => setSignRow(null)}>
                  Batal
                </button>
                <button
                  type="button"
                  disabled={completing}
                  onClick={completeReceiverFromRow}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
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
                  <p className="mt-0.5 text-gray-900">{detail.handedOverByName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Penerima</p>
                  <p className="mt-0.5 text-gray-900">{detail.receivedByName}</p>
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
                <SignaturePadField label="TTD Penyerah" readOnly value={detail.handedOverSignatureBase64} signerName={detail.handedOverByName} />
                {detail.hasReceiverSignature ? (
                  <SignaturePadField label="TTD Penerima" readOnly value={detail.receiverSignatureBase64} signerName={detail.receivedByName} />
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
