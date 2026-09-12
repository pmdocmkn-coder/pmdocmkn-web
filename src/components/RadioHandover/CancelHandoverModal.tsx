import React, { useState } from "react";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import { ResponsiveModal } from "../common/ResponsiveModal";

const apiMessage = (err: unknown) => {
  const ax = err as any;
  if (ax?.response?.data?.message) return ax.response.data.message;
  if (ax?.response?.data?.errors?.handover?.[0]) return ax.response.data.errors.handover[0];
  if (ax?.message) return ax.message;
  return "Terjadi kesalahan";
};

const REASON_OPTIONS = [
  {
    id: "direct_unit",
    label: "Radio langsung di-install ke unit (tidak masuk gudang)",
    description: "Radio tidak masuk fisik ke gudang dan langsung beroperasi di unit tambang/lapangan. Job perbaikan akan otomatis ditutup.",
    isDirectInstall: true,
  },
  {
    id: "not_received",
    label: "Fisik radio tidak diterima / barang tidak ada",
    description: "Fisik radio belum atau tidak diserahkan. Job perbaikan akan dikembalikan ke antrean teknisi.",
    isDirectInstall: false,
  },
  {
    id: "duplicate",
    label: "Kesalahan input data / dokumen duplikat",
    description: "Dokumen serah terima ini dibuat keliru atau dobel. Job perbaikan akan dikembalikan ke teknisi.",
    isDirectInstall: false,
  },
  {
    id: "other",
    label: "Lainnya",
    description: "Alasan lain yang perlu dicantumkan pada catatan pembatalan.",
    isDirectInstall: false,
  },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handoverId: number;
  handoverNumber?: string;
  serialNumber?: string;
  ticketNumber?: string;
  onSuccess: () => void;
};

export default function CancelHandoverModal({
  open,
  onOpenChange,
  handoverId,
  handoverNumber,
  serialNumber,
  ticketNumber,
  onSuccess,
}: Props) {
  const { toast } = useToast();
  const [selectedReason, setSelectedReason] = useState(REASON_OPTIONS[0].label);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentOption = REASON_OPTIONS.find((r) => r.label === selectedReason) || REASON_OPTIONS[3];

  const handleReset = () => {
    setSelectedReason(REASON_OPTIONS[0].label);
    setNotes("");
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      toast({ title: "Pilih alasan pembatalan", variant: "destructive" });
      return;
    }

    if (selectedReason === "Lainnya" && !notes.trim()) {
      toast({ title: "Harap isi keterangan alasan pembatalan", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await radioHandoverApi.cancelPending(handoverId, {
        reason: selectedReason,
        notes: notes.trim() || undefined,
        isDirectInstall: currentOption.isDirectInstall,
      });

      toast({
        title: "Serah Terima Dibatalkan",
        description: currentOption.isDirectInstall
          ? "STR dibatalkan & Job perbaikan otomatis diselesaikan (terpasang di unit)."
          : "STR berhasil dibatalkan dan dipindahkan ke arsip.",
      });

      handleReset();
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      toast({
        title: "Gagal membatalkan serah terima",
        description: apiMessage(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => {
        if (!v) handleReset();
        onOpenChange(v);
      }}
      title="Tolak / Batalkan Serah Terima"
      description={`Batalkan serah terima ${handoverNumber || ""} yang masih menunggu tanda tangan penerima.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Info Box */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700 flex flex-col gap-1">
          {handoverNumber && (
            <div>
              <span className="text-gray-500">No. STR:</span>{" "}
              <span className="font-mono font-bold text-gray-900">{handoverNumber}</span>
            </div>
          )}
          {serialNumber && (
            <div>
              <span className="text-gray-500">SN Radio:</span>{" "}
              <span className="font-bold text-gray-900">{serialNumber}</span>
            </div>
          )}
          {ticketNumber && (
            <div>
              <span className="text-gray-500">No. Job ERP:</span>{" "}
              <span className="font-mono text-[#2B6CB0] font-semibold">{ticketNumber}</span>
            </div>
          )}
        </div>

        {/* Reason Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
            Alasan Pembatalan <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {REASON_OPTIONS.map((opt) => {
              const isSelected = selectedReason === opt.label;
              return (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-red-50/50 border-red-300 ring-1 ring-red-400"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancellationReason"
                    value={opt.label}
                    checked={isSelected}
                    onChange={() => setSelectedReason(opt.label)}
                    className="mt-0.5 text-red-600 focus:ring-red-500 h-4 w-4"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isSelected ? "text-red-900" : "text-gray-800"}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Conditional Alert for Direct Install */}
        {currentOption.isDirectInstall ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Otomatis Selesaikan Pekerjaan:</span> Radio dianggap sudah selesai diperbaiki dan telah beroperasi di unit. Job perbaikan di sistem akan otomatis ditutup.
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-amber-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Kembalikan ke Teknisi:</span> Job perbaikan akan dikembalikan ke workshop teknisi agar dapat diperiksa ulang.
            </div>
          </div>
        )}

        {/* Additional Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
            Catatan Tambahan {selectedReason === "Lainnya" ? <span className="text-red-500">*</span> : "(Opsional)"}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              currentOption.isDirectInstall
                ? "Contoh: Di-install di unit HD785-021 oleh Yusuf Sianipar"
                : "Tuliskan keterangan detail alasan pembatalan..."
            }
            rows={3}
            className="w-full text-sm border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Kembali
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Konfirmasi Batalkan STR
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
