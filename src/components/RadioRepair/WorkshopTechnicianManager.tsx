import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Wrench, Plus, Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { workshopTechnicianApi, WorkshopTechnicianDto } from "../../services/workshopTechnicianApi";
import { Switch } from "../ui/switch";

export default function WorkshopTechnicianManager() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [technicians, setTechnicians] = useState<WorkshopTechnicianDto[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch all so we can see inactive ones too
      const res = await workshopTechnicianApi.getAll();
      setTechnicians(res.data.data);
    } catch (err: any) {
      toast({
        title: "Gagal memuat teknisi",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
      setIsCreating(false);
      setEditingId(null);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await workshopTechnicianApi.create({ name: newName.trim(), isActive: newIsActive });
      toast({ title: "Teknisi berhasil ditambahkan" });
      setNewName("");
      setNewIsActive(true);
      setIsCreating(false);
      loadData();
    } catch (err: any) {
      toast({
        title: "Gagal menambah",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    try {
      await workshopTechnicianApi.update(id, { name: editName.trim(), isActive: editIsActive });
      toast({ title: "Teknisi berhasil diupdate" });
      setEditingId(null);
      loadData();
    } catch (err: any) {
      toast({
        title: "Gagal update",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Hapus teknisi ${name}?`)) return;
    try {
      await workshopTechnicianApi.delete(id);
      toast({ title: "Teknisi dihapus" });
      loadData();
    } catch (err: any) {
      toast({
        title: "Gagal menghapus",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 hidden md:flex">
          <Wrench className="w-4 h-4 text-violet-600" />
          <span className="hidden lg:inline">Master Teknisi</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-violet-600" />
            Master Data Teknisi Workshop
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Daftar teknisi fisik yang bekerja di workshop. 
              Data ini digunakan saat Serah Terima dan Update Status Perbaikan.
            </p>
            {!isCreating && (
              <Button size="sm" onClick={() => setIsCreating(true)} className="gap-1 bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4" /> Tambah
              </Button>
            )}
          </div>

          {isCreating && (
            <div className="bg-violet-50 p-3 rounded-lg border border-violet-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                placeholder="Nama Teknisi" 
                className="flex-1 bg-white"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Switch checked={newIsActive} onCheckedChange={setNewIsActive} />
                <span className="text-sm font-medium">{newIsActive ? "Aktif" : "Nonaktif"}</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                <Button size="sm" variant="outline" onClick={() => setIsCreating(false)}>Batal</Button>
                <Button size="sm" onClick={handleCreate} disabled={!newName.trim()} className="bg-violet-600 hover:bg-violet-700">Simpan</Button>
              </div>
            </div>
          )}

          <div className="border rounded-lg divide-y bg-white max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Memuat...</div>
            ) : technicians.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Belum ada data teknisi.</div>
            ) : (
              technicians.map((t) => (
                <div key={t.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50">
                  {editingId === t.id ? (
                    <div className="flex-1 flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full">
                      <Input 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)} 
                        className="flex-1"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <Switch checked={editIsActive} onCheckedChange={setEditIsActive} />
                        <span className="text-sm font-medium">{editIsActive ? "Aktif" : "Nonaktif"}</span>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Batal</Button>
                        <Button size="sm" onClick={() => handleUpdate(t.id)} className="bg-violet-600 hover:bg-violet-700">Simpan</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-full ${t.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                          {t.isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{t.name}</div>
                          <div className="text-xs text-gray-500">
                            {t.isActive ? "Status: Aktif" : "Status: Tidak Aktif"}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingId(t.id);
                            setEditName(t.name);
                            setEditIsActive(t.isActive);
                          }}
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(t.id, t.name)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
