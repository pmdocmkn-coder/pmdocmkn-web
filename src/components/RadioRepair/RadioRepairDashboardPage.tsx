import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Archive, Eye, Pencil, RotateCcw, Trash2, Wrench } from "lucide-react";
import { radioRepairApi, type UpdateRadioRepairJobPayload } from "../../services/radioRepairApi";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import type {
  RadioRepairDashboard,
  RadioRepairJobDetail,
  RadioRepairJobList,
  RadioRepairJobStatus,
  RadioRepairTicketGroup,
} from "../../types/radioRepair";
import type { UserOption } from "../../types/radioHandover";
import RadioRepairStatusBadge from "./RadioRepairStatusBadge";
import TechnicianToWarehouseForm from "../RadioHandover/TechnicianToWarehouseForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useToast } from "../../hooks/use-toast";
import { hasAnyPermission, hasPermission } from "../../utils/permissionUtils";

const STATUS_OPTIONS: { value: RadioRepairJobStatus; label: string }[] = [
  { value: "InProgress", label: "Progress perbaikan" },
  { value: "Monitoring", label: "Monitoring" },
  { value: "WaitingMaterialApproval", label: "Tunggu material" },
  { value: "RepairCompleted", label: "Selesai" },
];

const LOCKED = new Set(["HandedToWarehouse", "ReturnedToHelpdesk", "Cancelled"]);

export default function RadioRepairDashboardPage() {
  const { toast } = useToast();
  const [dash, setDash] = useState<RadioRepairDashboard | null>(null);
  const [groups, setGroups] = useState<RadioRepairTicketGroup[]>([]);
  const [detail, setDetail] = useState<RadioRepairJobDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showWh, setShowWh] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [search, setSearch] = useState("");
  const [editJob, setEditJob] = useState<RadioRepairJobDetail | null>(null);
  const [technicians, setTechnicians] = useState<UserOption[]>([]);
  const [editForm, setEditForm] = useState<UpdateRadioRepairJobPayload | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const canSupervise = hasPermission("radio.repair.supervise");
  const canUpdate = hasPermission("radio.repair.update");
  const canDelete = hasPermission("radio.repair.delete");
  const canEdit = hasPermission("radio.repair.edit");
  const canViewArchive = hasPermission("radio.repair.view.archive");
  const canDeletePermanent = hasPermission("radio.repair.delete.permanent");

  const load = async () => {
    try {
      const params = { page: 1, pageSize: 100, search: search || undefined, includeDeleted: showArchive };
      const [d, g] = await Promise.all([
        showArchive ? Promise.resolve(null) : radioRepairApi.getDashboard(),
        radioRepairApi.getByTicket(params),
      ]);
      if (d) setDash(d);
      setGroups(g);
    } catch (err: unknown) {
      setDash(null);
      setGroups([]);
      const ax = err as { response?: { status?: number; data?: { message?: string } } };
      toast({
        title: ax.response?.status === 403 ? "Akses ditolak" : "Gagal memuat data",
        description: ax.response?.data?.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    load();
  }, [search, showArchive]);

  useEffect(() => {
    if (canEdit) {
      radioHandoverApi.getTechnicians().then(setTechnicians).catch(() => setTechnicians([]));
    }
  }, [canEdit]);

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const d = await radioRepairApi.getById(id, showArchive);
      setDetail(d);
    } catch (err: unknown) {
      setDetail(null);
      const ax = err as { response?: { data?: { message?: string } } };
      toast({ title: "Gagal membuka detail", description: ax.response?.data?.message, variant: "destructive" });
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = async (job: RadioRepairJobList) => {
    try {
      const d = await radioRepairApi.getById(job.id, showArchive);
      setEditJob(d);
      setEditForm({
        helpdeskTicketNumber: d.helpdeskTicketNumber,
        radioSerialNumber: d.radioSerialNumber,
        batterySerialNumber: d.batterySerialNumber ?? "",
        damageDescription: d.damageDescription,
        assignedTechnicianUserId: d.assignedTechnicianUserId,
        radioId: d.radioId ?? null,
      });
    } catch {
      toast({ title: "Gagal memuat data edit", variant: "destructive" });
    }
  };

  const saveEdit = async () => {
    if (!editJob || !editForm) return;
    setSavingEdit(true);
    try {
      await radioRepairApi.update(editJob.id, {
        ...editForm,
        batterySerialNumber: editForm.batterySerialNumber || null,
      });
      toast({ title: "Pekerjaan diperbarui" });
      setEditJob(null);
      load();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast({ title: "Gagal menyimpan", description: ax.response?.data?.message, variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const softDelete = async (id: number, ticket: string, sn: string) => {
    if (!window.confirm(`Hapus (arsip) tiket ${ticket} — SN ${sn}?`)) return;
    try {
      await radioRepairApi.softDelete(id);
      toast({ title: "Dipindah ke arsip" });
      if (detail?.id === id) setDetail(null);
      load();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast({ title: "Gagal menghapus", description: ax.response?.data?.message, variant: "destructive" });
    }
  };

  const restore = async (id: number) => {
    try {
      await radioRepairApi.restore(id);
      toast({ title: "Dipulihkan" });
      load();
    } catch {
      toast({ title: "Gagal memulihkan", variant: "destructive" });
    }
  };

  const deletePermanent = async (id: number, ticket: string, sn: string) => {
    if (!window.confirm(`Hapus permanen tiket ${ticket} — SN ${sn}?\n\nData tidak dapat dikembalikan.`)) return;
    if (!window.confirm("Konfirmasi terakhir: hapus permanen?")) return;
    try {
      await radioRepairApi.deletePermanent(id);
      toast({ title: "Dihapus permanen" });
      if (detail?.id === id) setDetail(null);
      load();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast({ title: "Gagal hapus permanen", description: ax.response?.data?.message, variant: "destructive" });
    }
  };

  const patchStatus = async (status: RadioRepairJobStatus) => {
    if (!detail) return;
    try {
      const updated = await radioRepairApi.updateStatus(detail.id, status);
      setDetail(updated);
      toast({ title: "Status diperbarui" });
      load();
    } catch {
      toast({ title: "Gagal update status", variant: "destructive" });
    }
  };

  const approveMaterial = async () => {
    if (!detail) return;
    try {
      const updated = await radioRepairApi.approveMaterial(detail.id, "InProgress");
      setDetail(updated);
      toast({ title: "Material disetujui" });
      load();
    } catch {
      toast({ title: "Gagal approve", variant: "destructive" });
    }
  };

  const cards = dash
    ? [
        { label: "Total", value: dash.total, color: "bg-slate-500" },
        { label: "Diterima", value: dash.received, color: "bg-slate-400" },
        { label: "Progress", value: dash.inProgress, color: "bg-blue-500" },
        { label: "Monitoring", value: dash.monitoring, color: "bg-indigo-500" },
        { label: "Tunggu Material", value: dash.waitingMaterialApproval, color: "bg-amber-500" },
        { label: "Selesai", value: dash.repairCompleted, color: "bg-emerald-500" },
        { label: "Ke WH", value: dash.handedToWarehouse, color: "bg-violet-500" },
      ]
    : [];

  const renderActions = (j: RadioRepairJobList) => (
    <div className="flex justify-end gap-1">
      <button type="button" title="Detail" className="p-2 border rounded-lg hover:bg-violet-50" disabled={detailLoading} onClick={() => openDetail(j.id)}>
        <Eye className="w-4 h-4" />
      </button>
      {canEdit && !showArchive && !LOCKED.has(j.status) && (
        <button type="button" title="Edit" className="p-2 border rounded-lg hover:bg-amber-50" onClick={() => openEdit(j)}>
          <Pencil className="w-4 h-4" />
        </button>
      )}
      {canDelete && !showArchive && !LOCKED.has(j.status) && (
        <button type="button" title="Hapus" className="p-2 border rounded-lg hover:bg-red-50 text-red-600" onClick={() => softDelete(j.id, j.helpdeskTicketNumber, j.radioSerialNumber)}>
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      {canViewArchive && showArchive && (
        <>
          <button type="button" title="Pulihkan" className="p-2 border rounded-lg hover:bg-emerald-50 text-emerald-700" onClick={() => restore(j.id)}>
            <RotateCcw className="w-4 h-4" />
          </button>
          {canDeletePermanent && (
            <button
              type="button"
              title="Hapus permanen"
              className="p-2 border rounded-lg hover:bg-red-100 text-red-700 border-red-200"
              onClick={() => deletePermanent(j.id, j.helpdeskTicketNumber, j.radioSerialNumber)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wrench className="w-7 h-7 text-violet-600" /> Dashboard Perbaikan Radio
        </h1>
        {canViewArchive && (
          <button
            type="button"
            onClick={() => setShowArchive((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${showArchive ? "bg-gray-800 text-white" : "bg-white"}`}
          >
            <Archive className="w-4 h-4" /> {showArchive ? "Arsip (aktif)" : "Lihat arsip"}
          </button>
        )}
      </div>

      {!showArchive && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {cards.map((c) => (
            <div key={c.label} className="bg-white rounded-xl border p-4 shadow-sm">
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className="text-2xl font-bold mt-1">{c.value}</p>
              <div className={`h-1 mt-2 rounded ${c.color}`} />
            </div>
          ))}
        </div>
      )}

      <input
        className="border rounded-lg px-3 py-2 w-full max-w-md"
        placeholder="Cari tiket, SN..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-4">
        {groups.length === 0 && <p className="text-center text-gray-400 py-8">Belum ada data</p>}
        {groups.map((g) => (
          <div key={g.helpdeskTicketNumber} className="bg-white rounded-xl border overflow-hidden">
            <div className="px-4 py-3 bg-violet-50 border-b flex justify-between items-center">
              <div>
                <span className="font-semibold">{g.helpdeskTicketNumber}</span>
                <span className="ml-2 text-xs text-gray-500">
                  {g.radioCount} radio{g.radioCount > 1 ? "" : ""}
                </span>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-2">SN</th>
                  <th className="px-4 py-2">Kerusakan</th>
                  <th className="px-4 py-2">Teknisi</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Buka</th>
                  <th className="px-4 py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {g.radios.map((j) => (
                  <tr key={j.id} className={`border-t ${j.isDeleted ? "opacity-60 bg-gray-50" : ""}`}>
                    <td className="px-4 py-2 font-medium">{j.radioSerialNumber}</td>
                    <td className="px-4 py-2 max-w-xs truncate">{j.damageDescription}</td>
                    <td className="px-4 py-2">{j.assignedTechnicianName}</td>
                    <td className="px-4 py-2">
                      <RadioRepairStatusBadge status={j.status} />
                    </td>
                    <td className="px-4 py-2">{format(new Date(j.openedAt), "dd/MM/yy", { locale: localeId })}</td>
                    <td className="px-4 py-2">{renderActions(j)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              {detail?.helpdeskTicketNumber} — SN {detail?.radioSerialNumber}
              {detail && <RadioRepairStatusBadge status={detail.status} />}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <p>Teknisi: <strong>{detail.assignedTechnicianName}</strong></p>
              <p>Kerusakan: {detail.damageDescription}</p>
              {detail.isDeleted && <p className="text-red-600 font-medium">Status: di arsip</p>}

              {canUpdate && !detail.isDeleted && !LOCKED.has(detail.status) && (
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button key={s.value} type="button" className="px-3 py-1 border rounded-lg hover:bg-violet-50" onClick={() => patchStatus(s.value)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              {canSupervise && detail.status === "WaitingMaterialApproval" && !detail.isDeleted && (
                <button type="button" className="px-4 py-2 bg-amber-600 text-white rounded-lg" onClick={approveMaterial}>
                  Setujui Material
                </button>
              )}

              {canUpdate && detail.status === "RepairCompleted" && !detail.isDeleted && hasAnyPermission("radio.handover.create.tek_wh", "radio.handover.create") && (
                <button type="button" className="px-4 py-2 bg-violet-600 text-white rounded-lg" onClick={() => setShowWh(true)}>
                  Serah terima ke Warehouse
                </button>
              )}

              {detail.handovers && detail.handovers.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-1">Serah terima</h3>
                  <ul className="text-xs space-y-1 text-gray-600">
                    {detail.handovers.map((h) => (
                      <li key={h.id}>
                        {h.handoverNumber} ({h.handoverType}) — {h.handedOverByName} → {h.receivedByName}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Timeline</h3>
                <ul className="space-y-1 text-xs text-gray-600">
                  {(detail.statusLogs ?? []).map((l) => (
                    <li key={l.id}>
                      {format(new Date(l.at), "dd/MM HH:mm")} — {l.fromStatus ?? "—"} → {l.toStatus} ({l.userName})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editJob && !!editForm} onOpenChange={() => setEditJob(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit pekerjaan</DialogTitle></DialogHeader>
          {editForm && (
            <div className="space-y-3 text-sm">
              <label className="block">
                Tiket MKN
                <input className="w-full border rounded-lg px-3 py-2 mt-1" value={editForm.helpdeskTicketNumber} onChange={(e) => setEditForm({ ...editForm, helpdeskTicketNumber: e.target.value })} />
              </label>
              <label className="block">
                Serial number
                <input className="w-full border rounded-lg px-3 py-2 mt-1" value={editForm.radioSerialNumber} onChange={(e) => setEditForm({ ...editForm, radioSerialNumber: e.target.value })} />
              </label>
              <label className="block">
                Kerusakan
                <textarea className="w-full border rounded-lg px-3 py-2 mt-1" rows={3} value={editForm.damageDescription} onChange={(e) => setEditForm({ ...editForm, damageDescription: e.target.value })} />
              </label>
              <label className="block">
                Teknisi
                <select className="w-full border rounded-lg px-3 py-2 mt-1" value={editForm.assignedTechnicianUserId} onChange={(e) => setEditForm({ ...editForm, assignedTechnicianUserId: Number(e.target.value) })}>
                  {technicians.map((t) => (
                    <option key={t.userId} value={t.userId}>{t.fullName}</option>
                  ))}
                </select>
              </label>
              <button type="button" disabled={savingEdit} className="w-full py-2 bg-violet-600 text-white rounded-lg" onClick={saveEdit}>
                {savingEdit ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showWh && !!detail} onOpenChange={setShowWh}>
        <DialogContent>
          <DialogHeader><DialogTitle>Teknisi → Warehouse</DialogTitle></DialogHeader>
          {detail && (
            <TechnicianToWarehouseForm
              job={detail}
              onSuccess={() => { setShowWh(false); setDetail(null); load(); }}
              onCancel={() => setShowWh(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
