import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader2 } from "lucide-react";
import { DatePicker } from "../ui/date-picker";
import { format } from "date-fns";

type Props = {
  open: boolean;
  onClose: () => void;
  onApprove: (payload: { dateScrapped: string; scrapJobNumber?: string; remarks?: string }) => Promise<void>;
  loading?: boolean;
};

export default function RadioScrapApprovalModal({ open, onClose, onApprove, loading }: Props) {
  const [dateScrapped, setDateScrapped] = useState<Date | undefined>(new Date());
  const [scrapJobNumber, setScrapJobNumber] = useState("");
  const [remarks, setRemarks] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateScrapped) return;
    await onApprove({ dateScrapped: format(dateScrapped, "yyyy-MM-dd"), scrapJobNumber, remarks });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Persetujuan Radio Scrap</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Tanggal Scrap <span className="text-red-500">*</span></label>
            <DatePicker 
              date={dateScrapped} 
              onSelect={setDateScrapped} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Nomor Job Scrap</label>
            <Input 
              placeholder="Contoh: SCR-2024-001" 
              value={scrapJobNumber} 
              onChange={(e) => setScrapJobNumber(e.target.value)} 
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
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Batal</Button>
            <Button type="submit" disabled={!dateScrapped || loading} className="bg-orange-600 hover:bg-orange-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Setujui Scrap
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
