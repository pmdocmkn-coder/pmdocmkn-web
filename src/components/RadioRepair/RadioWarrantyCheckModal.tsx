import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ShieldCheck, ShieldAlert } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (isWarranty: boolean) => void;
};

export default function RadioWarrantyCheckModal({ open, onOpenChange, onSelect }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Pengecekan Garansi</DialogTitle>
        </DialogHeader>
        <div className="bg-[#1B3A6B] p-6 text-white text-center">
          <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-emerald-300" />
          </div>
          <h2 className="text-xl font-bold">Pengecekan Garansi</h2>
          <p className="text-[#EBF4FF] text-sm mt-2 opacity-90">
            Sebelum memulai perbaikan, pastikan apakah radio ini masih dalam masa garansi?
          </p>
        </div>

        <div className="p-6 space-y-4 bg-white">
          <button
            type="button"
            onClick={() => onSelect(true)}
            className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-bold text-emerald-900">Ya, Masih Garansi</p>
                <p className="text-xs text-emerald-700 mt-0.5">Kerusakan ditanggung pihak garansi</p>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-emerald-200 group-hover:border-emerald-400 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelect(false)}
            className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center group-hover:bg-gray-300 transition-colors">
                <ShieldAlert className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Tidak Ada Garansi</p>
                <p className="text-xs text-gray-500 mt-0.5">Garansi sudah habis / void</p>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 group-hover:border-gray-400 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
