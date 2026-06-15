import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Wrench, Plus, Edit2, Trash2, CheckCircle2, XCircle, Link2, User } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { workshopTechnicianApi, type WorkshopTechnicianDto } from "../../services/workshopTechnicianApi";
import { Switch } from "../ui/switch";
import { api } from "../../services/api";
import { FormMobileSelect } from "../Radio/FormMobileSelect";

interface UserLookupItem {
  id: number;
  name: string;
  username: string;
  roleName?: string | null;
}

// Label yang muncul di dropdown untuk opsi "tidak dilink"
const NO_LINK_LABEL = "— Tidak dilink ke akun —";

export default function WorkshopTechnicianManager() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [technicians, setTechnicians] = useState<WorkshopTechnicianDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Daftar user dengan role Teknisi WSK untuk dropdown relasi
  const [techUsers, setTechUsers] = useState<UserLookupItem[]>([]);

  // State edit — simpan sebagai display string, resolve ke ID saat save
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editUserLabel, setEditUserLabel] = useState(""); // display string

  // State tambah baru
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [newUserLabel, setNewUserLabel] = useState(""); // display string

  // ── Helpers ────────────────────────────────────────────────
  // Format label untuk dropdown: "Nama (username)"
  const userToLabel = (u: UserLookupItem) => `${u.name} (${u.username})`;

  // Dari label string → userId (null jika tidak dilink)
  const labelToUserId = (label: string): number | null => {
    if (!label || label === NO_LINK_LABEL) return null;
    return techUsers.find((u) => userToLabel(u) === label)?.id ?? null;
  };

  // Dari userId → label string
  const userIdToLabel = (userId?: number | null): string => {
    if (!userId) return "";
    const u = techUsers.find((u) => u.id === userId);
    return u ? userToLabel(u) : "";
  };

  // Options list untuk FormMobileSelect
  const userOptions = techUsers.map(userToLabel);

  // ── Data Loading ────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
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

  const loadUsers = async () => {
    try {
      const res = await api.get<{ data: UserLookupItem[] }>("/api/users/lookup");
      const all = res.data?.data ?? [];
      setTechUsers(
        all.filter((u) => (u.roleName ?? "").toLowerCase().trim() === "teknisi wsk")
      );
    } catch {
      setTechUsers([]);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
      loadUsers();
      setIsCreating(false);
      setEditingId(null);
    }
  }, [open]);

  // ── Handlers ────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await workshopTechnicianApi.create({
        name: newName.trim(),
        isActive: newIsActive,
        userId: labelToUserId(newUserLabel) ?? undefined,
      });
      toast({ title: "Teknisi berhasil ditambahkan" });
      setNewName("");
      setNewIsActive(true);
      setNewUserLabel("");
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
      await workshopTechnicianApi.update(id, {
        name: editName.trim(),
        isActive: editIsActive,
        userId: labelToUserId(editUserLabel) ?? undefined,
      });
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

  // ── Render ──────────────────────────────────────────────────
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
          <div className="flex justify-between items-center gap-3">
            <p className="text-sm text-gray-500">
              Daftar teknisi fisik yang bekerja di workshop.
              Data ini digunakan saat Serah Terima dan Update Status Perbaikan.
            </p>
            {!isCreating && (
              <Button
                size="sm"
                onClick={() => {
                  setIsCreating(true);
                  setNewName("");
                  setNewIsActive(true);
                  setNewUserLabel("");
                }}
                className="gap-1 bg-violet-600 hover:bg-violet-700 shrink-0"
              >
                <Plus className="w-4 h-4" /> Tambah
              </Button>
            )}
          </div>

          {/* ── Form Tambah Baru ── */}
          {isCreating && (
            <div className="bg-violet-50 p-4 rounded-xl border border-violet-200 space-y-3">
              <p className="text-xs font-bold text-violet-700 uppercase tracking-wide">Tambah Teknisi Baru</p>

              {/* Nama */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">
                  Nama Teknisi <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Jacky Marlika"
                  className="bg-white"
                  autoFocus
                />
              </div>

              {/* Link ke Akun User */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5 text-violet-500" />
                  Link ke Akun (Opsional)
                </label>
                <FormMobileSelect
                  value={newUserLabel}
                  onChange={setNewUserLabel}
                  options={userOptions}
                  placeholder="— Tidak dilink ke akun —"
                  label="Pilih Akun User"
                  color="violet"
                />
                <p className="text-[11px] text-gray-400">
                  Pilih akun agar teknisi ini otomatis muncul saat akun tersebut meminjam/mengembalikan part.
                </p>
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-2">
                <Switch checked={newIsActive} onCheckedChange={setNewIsActive} />
                <span className="text-sm font-medium">{newIsActive ? "Aktif" : "Nonaktif"}</span>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <Button size="sm" variant="outline" onClick={() => setIsCreating(false)}>Batal</Button>
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  Simpan
                </Button>
              </div>
            </div>
          )}

          {/* ── Daftar Teknisi ── */}
          <div className="border rounded-xl divide-y bg-white max-h-[55vh] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Memuat...</div>
            ) : technicians.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Belum ada data teknisi.</div>
            ) : (
              technicians.map((t) => (
                <div key={t.id} className="p-3 hover:bg-gray-50 transition-colors">
                  {editingId === t.id ? (
                    /* ── Mode Edit Inline ── */
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-violet-700 uppercase tracking-wide">Edit Teknisi</p>

                      {/* Nama */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Nama Teknisi</label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-white"
                          autoFocus
                        />
                      </div>

                      {/* Link ke Akun */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                          <Link2 className="w-3.5 h-3.5 text-violet-500" />
                          Link ke Akun (Opsional)
                        </label>
                        <FormMobileSelect
                          value={editUserLabel}
                          onChange={setEditUserLabel}
                          options={userOptions}
                          placeholder="— Tidak dilink ke akun —"
                          label="Pilih Akun User"
                          color="violet"
                        />
                      </div>

                      {/* Status Aktif */}
                      <div className="flex items-center gap-2">
                        <Switch checked={editIsActive} onCheckedChange={setEditIsActive} />
                        <span className="text-sm font-medium">{editIsActive ? "Aktif" : "Nonaktif"}</span>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Batal</Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(t.id)}
                          className="bg-violet-600 hover:bg-violet-700"
                        >
                          Simpan
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* ── Mode Tampil ── */
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-full shrink-0 ${t.isActive ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                          {t.isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900">{t.name}</div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={`text-xs ${t.isActive ? "text-emerald-600" : "text-gray-400"}`}>
                              {t.isActive ? "Aktif" : "Tidak Aktif"}
                            </span>
                            {t.userId ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                                <User className="w-3 h-3" />
                                {techUsers.find((u) => u.id === t.userId)?.name ?? `User #${t.userId}`}
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Belum dilink ke akun</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingId(t.id);
                            setEditName(t.name);
                            setEditIsActive(t.isActive);
                            // Konversi userId → display label untuk FormMobileSelect
                            setEditUserLabel(userIdToLabel(t.userId));
                          }}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(t.id, t.name)}
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
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
