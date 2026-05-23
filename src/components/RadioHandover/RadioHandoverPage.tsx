import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Archive, Plus, Package, Trash2, RotateCcw } from "lucide-react";
import { hasPermission } from "../../utils/permissionUtils";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import type { RadioHandoverList, RadioHandoverDetail } from "../../types/radioHandover";
import HelpdeskToTechnicianForm from "./HelpdeskToTechnicianForm";
import HandoverStatusBadge from "./HandoverStatusBadge";
import ImageGalleryModal from "../common/ImageGalleryModal";
import SignaturePadField, { type SignaturePadHandle } from "../common/SignaturePadField";
import { canCreateHandoverHd } from "../../utils/handoverPermissions";
import { isValidSignature } from "../../utils/signatureUtils";
import { useToast } from "../../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

function handoverTypeLabel(t: string) {
  if (t === "HelpdeskToTechnician") return "HD→Tek";
  if (t === "WarehouseToHelpdesk") return "WH→HD";
  return "Tek→WH";
}

function currentUserId(): number | null {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u.userId ?? u.UserId ?? null;
  } catch {
    return null;
  }
}

export default function RadioHandoverPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<RadioHandoverList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<RadioHandoverDetail | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [sigReceiverComplete, setSigReceiverComplete] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const sigTekCompleteRef = useRef<SignaturePadHandle>(null);
  const canDelete = hasPermission("radio.handover.delete");
  const canViewArchive = hasPermission("radio.handover.view.archive");
  const canDeletePermanent = hasPermission("radio.handover.delete.permanent");

  const load = () => {
    setLoading(true);
    radioHandoverApi
      .getAll({ page: 1, pageSize: 50, includeDeleted: showArchive })
      .then((r) => setItems(r.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [showArchive]);

  const openDetail = async (id: number) => {
    const d = await radioHandoverApi.getById(id);
    setDetail(d);
    setSigReceiverComplete(null);
  };

  const openGallery = (e: React.MouseEvent, h: RadioHandoverList) => {
    e.stopPropagation();
    if (!h.previewPhotoBase64 && h.photoCount === 0) return;
    setGalleryImages(h.previewPhotoBase64 ? [h.previewPhotoBase64] : []);
    setGalleryIndex(0);
    setGalleryOpen(true);
    radioHandoverApi.getById(h.id).then((d) => {
      const imgs =
        d.radioPhotos?.length > 0
          ? d.radioPhotos
          : d.radioPhotoBase64
            ? [d.radioPhotoBase64]
            : [];
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

  const completeReceiver = async () => {
    const tekSig = (await sigTekCompleteRef.current?.exportNow()) ?? sigReceiverComplete;
    if (!detail || !isValidSignature(tekSig)) {
      toast({ title: "Gambar TTD teknisi di area putih", variant: "destructive" });
      return;
    }
    setCompleting(true);
    try {
      await radioHandoverApi.completeReceiverSignature(detail.id, tekSig!);
      toast({ title: "Serah terima selesai (Done)" });
      setDetail(null);
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

  const canSignAsReceiver =
    detail?.status === "PendingReceiverSignature" &&
    detail.handoverType === "HelpdeskToTechnician" &&
    currentUserId() === detail.receivedByUserId;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-violet-600" />
            Serah Terima Radio
          </h1>
          <p className="text-sm text-gray-500 mt-1">Helpdesk ke Teknisi dan histori STR</p>
        </div>
        <div className="flex gap-2">
          {canViewArchive && (
            <button
              type="button"
              onClick={() => setShowArchive((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${showArchive ? "bg-gray-800 text-white" : "bg-white"}`}
            >
              <Archive className="w-4 h-4" /> {showArchive ? "Arsip" : "Arsip"}
            </button>
          )}
          {canCreateHandoverHd() && !showArchive && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" /> HD ke Teknisi
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">STR</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Tiket</th>
              <th className="px-4 py-3">SN</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Foto</th>
              <th className="px-4 py-3">Penyerah → Penerima</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Memuat...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Belum ada data</td></tr>
            )}
            {items.map((h) => (
              <tr
                key={h.id}
                className="border-t hover:bg-violet-50/50 cursor-pointer"
                onClick={() => openDetail(h.id)}
              >
                <td className="px-4 py-3 font-mono text-xs">{h.handoverNumber}</td>
                <td className="px-4 py-3">{handoverTypeLabel(h.handoverType)}</td>
                <td className="px-4 py-3">{h.helpdeskTicketNumber ?? "—"}</td>
                <td className="px-4 py-3">{h.radioSerialNumber}</td>
                <td className="px-4 py-3">
                  <HandoverStatusBadge status={h.status} />
                </td>
                <td className="px-4 py-3" onClick={(e) => openGallery(e, h)}>
                  {h.previewPhotoBase64 || h.photoCount > 0 ? (
                    <div className="relative w-12 h-12 rounded border overflow-hidden cursor-zoom-in hover:ring-2 hover:ring-violet-400">
                      {h.previewPhotoBase64 && (
                        <img src={h.previewPhotoBase64} alt="" className="w-full h-full object-cover" />
                      )}
                      {h.photoCount > 1 && (
                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {h.photoCount}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">{h.handedOverByName} → {h.receivedByName}</td>
                <td className="px-4 py-3">{format(new Date(h.handoverAt), "dd MMM yyyy HH:mm", { locale: localeId })}</td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  {canDelete && !showArchive && (
                    <button type="button" className="p-2 border rounded-lg text-red-600 hover:bg-red-50" title="Hapus" onClick={async () => {
                      if (!window.confirm(`Hapus STR ${h.handoverNumber}?`)) return;
                      try {
                        await radioHandoverApi.softDelete(h.id);
                        toast({ title: "Dipindah ke arsip" });
                        load();
                      } catch (err: unknown) {
                        const ax = err as { response?: { data?: { message?: string } } };
                        toast({ title: "Gagal", description: ax.response?.data?.message, variant: "destructive" });
                      }
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {canViewArchive && showArchive && (
                    <div className="flex justify-end gap-1">
                      <button type="button" className="p-2 border rounded-lg text-emerald-700 hover:bg-emerald-50" title="Pulihkan" onClick={async () => {
                        try {
                          await radioHandoverApi.restore(h.id);
                          toast({ title: "Dipulihkan" });
                          load();
                        } catch {
                          toast({ title: "Gagal memulihkan", variant: "destructive" });
                        }
                      }}>
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      {canDeletePermanent && (
                        <button type="button" className="p-2 border rounded-lg text-red-700 hover:bg-red-100 border-red-200" title="Hapus permanen" onClick={async () => {
                          if (!window.confirm(`Hapus permanen STR ${h.handoverNumber}?\n\nData tidak dapat dikembalikan.`)) return;
                          if (!window.confirm("Konfirmasi terakhir: hapus permanen?")) return;
                          try {
                            await radioHandoverApi.deletePermanent(h.id);
                            toast({ title: "Dihapus permanen" });
                            if (detail?.id === h.id) setDetail(null);
                            load();
                          } catch (err: unknown) {
                            const ax = err as { response?: { data?: { message?: string } } };
                            toast({ title: "Gagal hapus permanen", description: ax.response?.data?.message, variant: "destructive" });
                          }
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Serah Terima Helpdesk → Teknisi</DialogTitle>
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

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              Detail {detail?.handoverNumber}
              {detail && <HandoverStatusBadge status={detail.status} />}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <p>
                Tiket: {detail.helpdeskTicketNumber} | SN: {detail.radioSerialNumber} | Status job:{" "}
                {detail.jobStatus}
              </p>
              {detail.remarks && <p className="text-gray-600">Catatan: {detail.remarks}</p>}
              {(() => {
                const imgs =
                  detail.radioPhotos?.length > 0
                    ? detail.radioPhotos
                    : detail.radioPhotoBase64
                      ? [detail.radioPhotoBase64]
                      : [];
                if (imgs.length === 0) return null;
                return (
                  <div>
                    <p className="font-medium mb-2">Foto radio</p>
                    <div className="flex flex-wrap gap-2">
                      {imgs.map((src, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => openGalleryFromDetail(imgs, i)}
                          className="relative w-20 h-20 rounded border overflow-hidden hover:ring-2 ring-violet-400"
                        >
                          <img src={src} alt={`foto ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {detail.accessories?.length > 0 && (
                <table className="w-full text-xs border rounded overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-2 py-1">Barang</th>
                      <th className="text-left px-2 py-1">Qty</th>
                      <th className="text-left px-2 py-1">Unit</th>
                      <th className="text-left px-2 py-1">SN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.accessories.map((a, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1">{a.itemName}</td>
                        <td className="px-2 py-1">{a.quantity}</td>
                        <td className="px-2 py-1">{a.unit}</td>
                        <td className="px-2 py-1 text-gray-500">{a.serialNumber || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <SignaturePadField label="TTD Penyerah" readOnly value={detail.handedOverSignatureBase64} />
              {detail.hasReceiverSignature ? (
                <SignaturePadField label="TTD Penerima" readOnly value={detail.receiverSignatureBase64} />
              ) : canSignAsReceiver ? (
                <div className="space-y-2 border border-amber-200 bg-amber-50/50 rounded-lg p-3">
                  <p className="text-amber-800 font-medium">Lengkapi TTD sebagai teknisi penerima</p>
                  <SignaturePadField
                    ref={sigTekCompleteRef}
                    label="TTD Teknisi (penerima)"
                    value={sigReceiverComplete}
                    onChange={setSigReceiverComplete}
                  />
                  <button
                    type="button"
                    disabled={completing}
                    onClick={completeReceiver}
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    {completing ? "Menyimpan..." : "Simpan TTD & tandai Done"}
                  </button>
                </div>
              ) : (
                <p className="text-amber-700 text-xs">Menunggu tanda tangan teknisi penerima.</p>
              )}
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
