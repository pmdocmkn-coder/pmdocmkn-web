import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Warehouse,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  Inbox,
  PackageCheck,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import { radioRepairApi } from "../../services/radioRepairApi";
import type { RadioHandoverList, RadioHandoverDetail } from "../../types/radioHandover";
import type { RadioRepairJobList, RadioRepairJobDetail } from "../../types/radioRepair";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
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

type HandoverTableProps = {
  items: RadioHandoverList[];
  loading: boolean;
  flowLabel: string;
  emptyMessage: string;
  onOpenDetail: (id: number) => void;
  onOpenGallery: (h: RadioHandoverList) => void;
};

function HandoverHistoryTable({
  items,
  loading,
  flowLabel,
  emptyMessage,
  onOpenDetail,
  onOpenGallery,
}: HandoverTableProps) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50/80 text-left border-b">
          <tr>
            <th className="px-4 py-3 font-semibold text-gray-600">STR</th>
            <th className="px-4 py-3 font-semibold text-gray-600">Tiket Helpdesk</th>
            <th className="px-4 py-3 font-semibold text-gray-600">SN Radio</th>
            <th className="px-4 py-3 font-semibold text-gray-600">{flowLabel}</th>
            <th className="px-4 py-3 font-semibold text-gray-600">Foto</th>
            <th className="px-4 py-3 font-semibold text-gray-600">Tanggal</th>
            <th className="px-4 py-3 font-semibold text-gray-600 text-right">Aksi</th>
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
                className={`border-t cursor-pointer transition-colors hover:bg-violet-50/60 ${
                  idx % 2 === 1 ? "bg-gray-50/40" : ""
                }`}
                onClick={() => onOpenDetail(h.id)}
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-medium text-violet-700">{h.handoverNumber}</span>
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
                    <ArrowRight className="w-3.5 h-3.5 text-violet-500 shrink-0" />
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
                        <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
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
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-violet-200 rounded-lg text-violet-700 text-xs font-medium hover:bg-violet-50 transition-colors"
                    title="Lihat detail serah terima"
                    onClick={() => onOpenDetail(h.id)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Detail
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RadioHandoverWarehousePage() {
  const { toast } = useToast();
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
  const [activeTab, setActiveTab] = useState("incoming");

  const load = useCallback(() => {
    setLoadingIncoming(true);
    setLoadingOutgoing(true);

    radioHandoverApi
      .getAll({ page: 1, pageSize: 50, handoverType: "TechnicianToWarehouse" })
      .then((r) => setIncoming(r.data ?? []))
      .catch(() => setIncoming([]))
      .finally(() => setLoadingIncoming(false));

    radioHandoverApi
      .getAll({ page: 1, pageSize: 50, handoverType: "WarehouseToHelpdesk" })
      .then((r) => setOutgoing(r.data ?? []))
      .catch(() => setOutgoing([]))
      .finally(() => setLoadingOutgoing(false));

    radioRepairApi
      .getAll({ page: 1, pageSize: 50, status: "HandedToWarehouse" })
      .then((r) => setPendingJobs(r.data ?? []))
      .catch(() => setPendingJobs([]));
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardDescription className="text-amber-800/80 flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4" />
              Siap ke Helpdesk
            </CardDescription>
            <CardTitle className="text-3xl text-amber-900">{pendingJobs.length}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-xs text-amber-700/80">Job status HandedToWarehouse</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardDescription className="flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4 text-violet-600" />
              Masuk dari Teknisi
            </CardDescription>
            <CardTitle className="text-3xl text-gray-900">{incoming.length}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-xs text-gray-500">Histori Tek → WH</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardDescription className="flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-indigo-600" />
              Serah ke Helpdesk
            </CardDescription>
            <CardTitle className="text-3xl text-gray-900">{outgoing.length}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-xs text-gray-500">Histori WH → HD</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending jobs — daftar untuk semua; tombol WH→HD hanya jika punya radio.handover.create.wh_hd */}
      {pendingJobs.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {canCreateHandoverWhHd() ? "Perlu tindakan — serah ke Helpdesk" : "Menunggu serah ke Helpdesk"}
            </h2>
          </div>
          <p className="text-sm text-gray-600">
            {canCreateHandoverWhHd()
              ? "Radio sudah diterima dari teknisi. Lengkapi foto, aksesoris, dan tanda tangan Warehouse serta Helpdesk."
              : "Radio sudah diterima dari teknisi dan menunggu proses serah ke Helpdesk oleh petugas warehouse yang berwenang."}
          </p>
          <div className="bg-white rounded-xl border border-amber-200 overflow-hidden shadow-sm">
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
                        <button
                          type="button"
                          onClick={() => setReturnJob(j)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 shadow-sm transition-colors"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          WH → Helpdesk
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* History tabs */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Histori serah terima</h2>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-100 p-1 h-auto">
            <TabsTrigger value="incoming" className="gap-2 px-4 py-2 data-[state=active]:shadow-sm">
              <ArrowDownLeft className="w-4 h-4" />
              Masuk dari Teknisi
              {!loadingIncoming && incoming.length > 0 && (
                <span className="ml-1 bg-violet-100 text-violet-700 text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {incoming.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="gap-2 px-4 py-2 data-[state=active]:shadow-sm">
              <ArrowUpRight className="w-4 h-4" />
              Serah ke Helpdesk
              {!loadingOutgoing && outgoing.length > 0 && (
                <span className="ml-1 bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full font-medium">
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
              items={incoming}
              loading={loadingIncoming}
              flowLabel="Teknisi → Warehouse"
              emptyMessage="Belum ada radio masuk dari teknisi"
              onOpenDetail={openDetail}
              onOpenGallery={openGallery}
            />
          </TabsContent>

          <TabsContent value="outgoing" className="mt-4 space-y-2">
            <p className="text-sm text-gray-500">
              Daftar radio yang sudah diserahkan warehouse ke helpdesk (WH → HD).
            </p>
            <HandoverHistoryTable
              items={outgoing}
              loading={loadingOutgoing}
              flowLabel="Warehouse → Helpdesk"
              emptyMessage="Belum ada serah terima ke helpdesk"
              onOpenDetail={openDetail}
              onOpenGallery={openGallery}
            />
          </TabsContent>
        </Tabs>
      </section>

      {/* WH → HD form dialog */}
      {canCreateHandoverWhHd() && returnJob && (
        <Dialog open={!!returnJob} onOpenChange={() => setReturnJob(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                Serah Terima Warehouse → Helpdesk
              </DialogTitle>
            </DialogHeader>
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
          </DialogContent>
        </Dialog>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detail || detailLoading} onOpenChange={() => { if (!detailLoading) { setDetail(null); setDetailJob(null); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                <SignaturePadField label="TTD Penyerah" readOnly value={detail.handedOverSignatureBase64} />
                <SignaturePadField label="TTD Penerima" readOnly value={detail.receiverSignatureBase64} />
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
