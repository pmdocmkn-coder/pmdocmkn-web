import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { warehousePartApi } from "../../services/warehousePartApi";
import type { WarehousePartCatalogItem } from "../../services/warehousePartApi";
import { useToast } from "../../hooks/use-toast";
import { Loader2 } from "lucide-react";

interface WarehousePartFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: WarehousePartCatalogItem | null;
}

export default function WarehousePartFormModal({ isOpen, onClose, onSuccess, initialData }: WarehousePartFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    partCode: "",
    partName: "",
    ownerId: "",
    unit: "",
    description: ""
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          partCode: initialData.partCode || "",
          partName: initialData.partName || "",
          ownerId: initialData.ownerId || "",
          unit: initialData.unit || "",
          description: initialData.description || ""
        });
      } else {
        setFormData({
          partCode: "",
          partName: "",
          ownerId: "",
          unit: "",
          description: ""
        });
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partCode || !formData.partName) {
      toast({ title: "Validasi Gagal", description: "Kode Part dan Nama Part wajib diisi.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (initialData) {
        await warehousePartApi.update(initialData.id, formData);
        toast({ title: "Berhasil", description: "Data part berhasil diperbarui." });
      } else {
        await warehousePartApi.create(formData);
        toast({ title: "Berhasil", description: "Data part berhasil ditambahkan." });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({ title: "Gagal menyimpan data", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-6 rounded-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            {initialData ? "Ubah Data Part" : "Tambah Part Baru"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Kode Part <span className="text-red-500">*</span></label>
            <Input 
              placeholder="Masukkan kode part..." 
              value={formData.partCode} 
              onChange={e => setFormData({ ...formData, partCode: e.target.value })} 
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Nama Part <span className="text-red-500">*</span></label>
            <Input 
              placeholder="Masukkan nama part..." 
              value={formData.partName} 
              onChange={e => setFormData({ ...formData, partName: e.target.value })} 
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Owner ID</label>
              <Input 
                placeholder="Contoh: IT, ME..." 
                value={formData.ownerId} 
                onChange={e => setFormData({ ...formData, ownerId: e.target.value })} 
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">UoM (Satuan)</label>
              <Input 
                placeholder="Contoh: Pcs, Unit..." 
                value={formData.unit} 
                onChange={e => setFormData({ ...formData, unit: e.target.value })} 
                disabled={loading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Deskripsi</label>
            <Input 
              placeholder="Tambahan keterangan..." 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
              disabled={loading}
            />
          </div>

          <DialogFooter className="pt-4 mt-6 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-24">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
