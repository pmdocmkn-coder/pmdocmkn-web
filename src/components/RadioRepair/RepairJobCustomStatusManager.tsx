import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X, AlertCircle } from "lucide-react";
import { repairJobCustomStatusApi } from "../../services/repairJobCustomStatusApi";
import type { RepairJobCustomStatus } from "../../types/radioRepair";
import { useToast } from "../../hooks/use-toast";

// Pilihan warna preset yang bisa dipilih supervisor
const COLOR_PRESETS = [
  { label: "Abu-abu", value: "bg-slate-500" },
  { label: "Biru tua", value: "bg-blue-700" },
  { label: "Cyan", value: "bg-cyan-600" },
  { label: "Teal", value: "bg-teal-600" },
  { label: "Ungu", value: "bg-purple-600" },
  { label: "Pink", value: "bg-pink-600" },
  { label: "Merah", value: "bg-red-600" },
  { label: "Oranye", value: "bg-orange-500" },
  { label: "Kuning", value: "bg-yellow-500" },
  { label: "Hijau tua", value: "bg-green-700" },
];

type FormState = {
  label: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
};

const defaultForm = (): FormState => ({
  label: "",
  color: "bg-slate-500",
  sortOrder: 0,
  isActive: true,
});

export default function RepairJobCustomStatusManager() {
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<RepairJobCustomStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setStatuses(await repairJobCustomStatusApi.getAll());
    } catch {
      toast({ title: "Gagal memuat status", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (s: RepairJobCustomStatus) => {
    setEditingId(s.id);
    setShowAdd(false);
    setForm({ label: s.label, color: s.color, sortOrder: s.sortOrder, isActive: s.isActive });
  };

  const cancelEdit = () => { setEditingId(null); setForm(defaultForm()); };

  const startAdd = () => {
    setShowAdd(true);
    setEditingId(null);
    setForm(defaultForm());
  };

  const save = async () => {
    if (!form.label.trim()) return;
    setSaving(true);
    try {
      if (editingId !== null) {
        await repairJobCustomStatusApi.update(editingId, form);
        toast({ title: "Status diperbarui" });
        setEditingId(null);
      } else {
        await repairJobCustomStatusApi.create({ label: form.label, color: form.color, sortOrder: form.sortOrder });
        toast({ title: "Status ditambahkan" });
        setShowAdd(false);
      }
      setForm(defaultForm());
      await load();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const msg = Object.values(ax.response?.data?.errors ?? {}).flat()[0] ?? "Gagal menyimpan";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteStatus = async (s: RepairJobCustomStatus) => {
    if (s.activeJobCount > 0) {
      toast({
        title: "Tidak bisa dihapus",
        description: `Masih digunakan oleh ${s.activeJobCount} pekerjaan aktif.`,
        variant: "destructive",
      });
      return;
    }
    setDeletingId(s.id);
    try {
      await repairJobCustomStatusApi.delete(s.id);
      toast({ title: "Status dihapus" });
      await load();
    } catch {
      toast({ title: "Gagal menghapus", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">Status Pekerjaan Custom</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Tambah status tambahan di luar status sistem (Monitoring, Tunggu material, Selesai).
          </p>
        </div>
        {!showAdd && (
          <button
            type="button"
            onClick={startAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah
          </button>
        )}
      </div>

      {/* Form tambah */}
      {showAdd && (
        <StatusForm
          form={form}
          onChange={setForm}
          onSave={save}
          onCancel={() => { setShowAdd(false); setForm(defaultForm()); }}
          saving={saving}
          title="Tambah status baru"
        />
      )}

      {/* List status */}
      {loading ? (
        <p className="text-sm text-gray-400 py-4 text-center">Memuat...</p>
      ) : statuses.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center italic">Belum ada status custom.</p>
      ) : (
        <ul className="space-y-2">
          {statuses.map((s) => (
            <li key={s.id} className="border rounded-lg overflow-hidden">
              {editingId === s.id ? (
                <div className="p-3 bg-gray-50">
                  <StatusForm
                    form={form}
                    onChange={setForm}
                    onSave={save}
                    onCancel={cancelEdit}
                    saving={saving}
                    title={`Edit: ${s.label}`}
                    showIsActive
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-2.5">
                  {/* Preview warna */}
                  <span className={`w-3 h-3 rounded-full shrink-0 ${s.color}`} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${s.isActive ? "text-gray-800" : "text-gray-400 line-through"}`}>
                      {s.label}
                    </span>
                    {s.activeJobCount > 0 && (
                      <span className="ml-2 text-xs text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">
                        {s.activeJobCount} job aktif
                      </span>
                    )}
                    {!s.isActive && (
                      <span className="ml-2 text-xs text-gray-400">(nonaktif)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteStatus(s)}
                      disabled={deletingId === s.id || s.activeJobCount > 0}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={s.activeJobCount > 0 ? `Digunakan ${s.activeJobCount} job aktif` : "Hapus"}
                    >
                      {s.activeJobCount > 0
                        ? <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusForm({
  form, onChange, onSave, onCancel, saving, title, showIsActive,
}: {
  form: FormState;
  onChange: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  title: string;
  showIsActive?: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-600">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className="text-xs text-gray-600">Label *</span>
          <input
            className="w-full border rounded-lg px-3 py-1.5 text-sm mt-0.5 focus:ring-2 focus:ring-violet-300 outline-none"
            value={form.label}
            onChange={(e) => onChange({ ...form, label: e.target.value })}
            placeholder="contoh: Menunggu Spare Tools"
            maxLength={100}
          />
        </label>
        <label className="block">
          <span className="text-xs text-gray-600">Urutan tampil</span>
          <input
            type="number"
            className="w-full border rounded-lg px-3 py-1.5 text-sm mt-0.5 focus:ring-2 focus:ring-violet-300 outline-none"
            value={form.sortOrder}
            onChange={(e) => onChange({ ...form, sortOrder: Number(e.target.value) })}
            min={0}
          />
        </label>
      </div>
      <div>
        <span className="text-xs text-gray-600">Warna tombol</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange({ ...form, color: c.value })}
              className={`px-2.5 py-1 rounded-lg text-xs text-white font-medium border-2 transition-all ${c.value} ${
                form.color === c.value ? "border-gray-800 scale-105" : "border-transparent"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      {showIsActive && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => onChange({ ...form, isActive: e.target.checked })}
            className="rounded"
          />
          Aktif (tampil sebagai pilihan status)
        </label>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
        >
          <X className="w-3.5 h-3.5" /> Batal
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !form.label.trim()}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" /> {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
}
