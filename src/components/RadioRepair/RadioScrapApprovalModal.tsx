import { useState } from "react";
import { ResponsiveModal } from "../common/ResponsiveModal";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader2 } from "lucide-react";
import { FormMobileDatePicker } from "../Radio/FormMobileDatePicker";
import { format } from "date-fns";

type Props = {
  open: boolean;
  onClose: () => void;
  onApprove: (payload: { dateScrapped: string; scrapJobNumber?: string; remarks?: string; isPendingHelpdeskScrapFill?: boolean }) => Promise<void>;
  loading?: boolean;
  hideDelegationCheckbox?: boolean;
};

export default function RadioScrapApprovalModal({ open, onClose, onApprove, loading, hideDelegationCheckbox }: Props) {
  const [dateScrapped, setDateScrapped] = useState<Date | undefined>(new Date());
  const [scrapJobNumber, setScrapJobNumber] = useState("");
  const [remarks, setRemarks] = useState("");

  const [isPendingHelpdeskScrapFill, setIsPendingHelpdeskScrapFill] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPendingHelpdeskScrapFill && !dateScrapped) return;
    await onApprove({ 
      dateScrapped: dateScrapped ? format(dateScrapped, "yyyy-MM-dd") : "", 
      scrapJobNumber, 
      remarks,
      isPendingHelpdeskScrapFill
    });
  };

  return (
    <ResponsiveModal 
      open={open} 
      onOpenChange={(o) => { if (!o) onClose(); }}
      title="Data Radio Scrap"
    >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Tanggal Scrap {!isPendingHelpdeskScrapFill && <span className="text-red-500">*</span>}</label>
            <div className={isPendingHelpdeskScrapFill ? "opacity-50 pointer-events-none" : ""}>
              <FormMobileDatePicker
                date={dateScrapped}
                onSelect={setDateScrapped}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Nomor Job Scrap</label>
            <Input 
              placeholder="Contoh: SCR-2024-001" 
              value={scrapJobNumber} 
              onChange={(e) => setScrapJobNumber(e.target.value)} 
              disabled={isPendingHelpdeskScrapFill}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Keterangan Tambahan</label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              rows={3}
              placeholder="Alasan scrap atau detail lainnya..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
          {!hideDelegationCheckbox && (
            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="pendingHelpdesk" 
                checked={isPendingHelpdeskScrapFill} 
                onChange={(e) => setIsPendingHelpdeskScrapFill(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <label htmlFor="pendingHelpdesk" className="text-sm font-medium text-gray-700">
                Data scrap akan diisi oleh Helpdesk nanti
              </label>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Batal</Button>
            <Button type="submit" disabled={(!isPendingHelpdeskScrapFill && !dateScrapped) || loading} className="bg-orange-600 hover:bg-orange-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan Data Scrap
            </Button>
          </div>
        </form>
    </ResponsiveModal>
  );
}
