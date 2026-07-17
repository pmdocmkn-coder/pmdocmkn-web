import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { warehousePartApi } from "../../services/warehousePartApi";
import type { WarehousePartCatalogItem } from "../../services/warehousePartApi";
import { useToast } from "../../hooks/use-toast";
import { ResponsiveModal } from "../common/ResponsiveModal";
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
      toast({ title: "Validasi Gagal", description: "Tools Code dan Nama Tools wajib diisi.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (initialData) {
        await warehousePartApi.update(initialData.id, formData);
        toast({ title: "Berhasil", description: "Data tools berhasil diperbarui." });
      } else {
        await warehousePartApi.create(formData);
        toast({ title: "Berhasil", description: "Data tools berhasil ditambahkan." });
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
    <ResponsiveModal 
      open={isOpen} 
      onOpenChange={onClose}
      title={initialData ? "Ubah Data Tools" : "Tambah Tools Baru"}
      bottomSheetSize="lg"
      desktopClassName="max-w-md bg-white p-6 rounded-xl shadow-2xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1 sm:flex-none">
            Batal
          </Button>
          <Button type="submit" disabled={loading} onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-24 flex-1 sm:flex-none">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tools Code <span className="text-red-500">*</span></label>
            <Input 
              placeholder="Masukkan kode tools..." 
              value={formData.partCode} 
              onChange={e => setFormData({ ...formData, partCode: e.target.value })} 
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Nama Tools <span className="text-red-500">*</span></label>
            <Input 
              placeholder="Masukkan nama tools..." 
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

        </form>
    </ResponsiveModal>
  );
}
