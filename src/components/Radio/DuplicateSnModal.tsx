import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { radioApi, DuplicateSnDto } from "../../services/radioApi";
import { AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

interface DuplicateSnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DuplicateSnModal({ isOpen, onClose }: DuplicateSnModalProps) {
  const [data, setData] = useState<DuplicateSnDto[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await radioApi.getDuplicateSns();
      setData(res.data.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Gagal memuat data duplikat SN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const translateCategory = (cat: string) => {
    if (cat === "Internal") return "KPC";
    if (cat === "Contractor") return "Kontraktor";
    return cat;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Daftar Duplikat Serial Number (Lintas Kategori)
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            Berikut adalah daftar Serial Number yang terdaftar lebih dari satu kali di seluruh sistem (KPC, Kontraktor, dan Unit).
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Memuat data duplikat...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Tidak ada duplikat Serial Number yang ditemukan.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {data.map((item, idx) => (
                <div key={idx} className="border rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-slate-700">Serial Number: </span>
                      <span className="font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">{item.serialNumber}</span>
                    </div>
                    <span className="text-sm font-medium bg-slate-200 px-2 py-0.5 rounded-full text-slate-700">
                      {item.count} perangkat
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-white border-b">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-slate-500">Kategori</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500">No. Aset</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500">No. Unit/LV</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500">Divisi/Dept/Company</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {item.occurrences.map((occ) => (
                          <tr key={occ.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                occ.category === "Internal" ? "bg-purple-100 text-purple-700" :
                                occ.category === "Contractor" ? "bg-emerald-100 text-emerald-700" :
                                "bg-blue-100 text-blue-700"
                              }`}>
                                {translateCategory(occ.category)}
                              </span>
                            </td>
                            <td className="px-4 py-2 font-medium">{occ.nomorAset || "-"}</td>
                            <td className="px-4 py-2">{occ.nomorUnit || occ.nomorLv || "-"}</td>
                            <td className="px-4 py-2 text-slate-600">
                              {[occ.division, occ.department, occ.company].filter(Boolean).join(" / ") || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
