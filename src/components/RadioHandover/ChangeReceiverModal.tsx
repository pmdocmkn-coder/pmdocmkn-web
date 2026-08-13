import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import { ResponsiveModal } from "../common/ResponsiveModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { UserOption } from "../../types/radioHandover";

const apiMessage = (err: unknown) => {
  const ax = err as any;
  if (ax?.response?.data?.message) return ax.response.data.message;
  if (ax?.message) return ax.message;
  return "Terjadi kesalahan";
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handoverId: number;
  receiverType: "Helpdesk" | "Warehouse" | "Teknisi";
  currentReceiverUserId?: number;
  onSuccess: () => void;
};

export default function ChangeReceiverModal({ open, onOpenChange, handoverId, receiverType, currentReceiverUserId, onSuccess }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [options, setOptions] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedUserId("");
      return;
    }
    // Pre-select current receiver
    if (currentReceiverUserId) {
      setSelectedUserId(currentReceiverUserId.toString());
    }

    let isMounted = true;
    setLoading(true);

    const fetcher =
      receiverType === "Helpdesk"
        ? radioHandoverApi.getHelpdeskReceivers()
        : receiverType === "Warehouse"
          ? radioHandoverApi.getWarehouseReceivers()
          : radioHandoverApi.getTechnicians();

    fetcher
      .then((data) => {
        if (isMounted) setOptions(data ?? []);
      })
      .catch((err) => {
        if (isMounted) {
          toast({
            title: "Gagal memuat penerima",
            description: apiMessage(err),
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, receiverType, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast({
        title: "Pilih penerima",
        description: "Harap pilih penerima baru terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await radioHandoverApi.changeReceiver(handoverId, parseInt(selectedUserId, 10));
      toast({
        title: "Berhasil",
        description: "Penerima berhasil diubah.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      toast({
        title: "Gagal",
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
      onOpenChange={onOpenChange}
      title="Ubah Penerima"
      bottomSheetSize="md"
      desktopClassName="sm:max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[14px] font-medium text-[#1A202C]">
            Pilih {receiverType} Baru
          </label>
          {loading ? (
            <div className="h-10 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
            </div>
          ) : (
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-full h-11 border-[#E2E8F0] bg-white rounded-lg px-3 hover:border-[#CBD5E1] transition-colors focus:ring-2 focus:ring-[#3182CE]/20 shadow-sm outline-none">
                <SelectValue placeholder={`Pilih akun ${receiverType}...`} />
              </SelectTrigger>
              <SelectContent className="max-h-60 bg-white border border-[#E2E8F0] shadow-lg rounded-lg">
                {options.map((opt) => (
                  <SelectItem
                    key={opt.userId}
                    value={opt.userId.toString()}
                    className="hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900 py-2 cursor-pointer transition-colors"
                  >
                    {opt.fullName} <span className="text-[#A0AEC0]">({opt.username})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-[14px] font-medium text-[#4A5568] bg-white border border-[#E2E8F0] rounded-lg hover:bg-[#F7FAFC] transition-colors disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting || loading || !selectedUserId}
            className="flex items-center justify-center gap-2 px-4 py-2 text-[14px] font-medium text-white bg-[#3182CE] rounded-lg hover:bg-[#2B6CB0] transition-colors shadow-sm disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
