import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Wrench } from "lucide-react";
import { radioRepairApi } from "../../services/radioRepairApi";
import type { RadioRepairDashboard, RadioRepairJobDetail, RadioRepairJobList, RadioRepairJobStatus } from "../../types/radioRepair";
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

export default function RadioRepairDashboardPage() {
  const { toast } = useToast();
  const [dash, setDash] = useState<RadioRepairDashboard | null>(null);
  const [jobs, setJobs] = useState<RadioRepairJobList[]>([]);
  const [detail, setDetail] = useState<RadioRepairJobDetail | null>(null);
  const [showWh, setShowWh] = useState(false);
  const [search, setSearch] = useState("");
  const canSupervise = hasPermission("radio.repair.supervise");
  const canUpdate = hasPermission("radio.repair.update");

  const load = async () => {
    try {
      const [d, j] = await Promise.all([
        radioRepairApi.getDashboard(),
        radioRepairApi.getAll({ page: 1, pageSize: 50, search: search || undefined }),
      ]);
      setDash(d);
      setJobs(j.data ?? []);
    } catch (err: unknown) {
      setDash(null);
      setJobs([]);
      const ax = err as { response?: { status?: number; data?: { message?: string } } };
      toast({
        title: ax.response?.status === 403 ? "Akses ditolak" : "Gagal memuat data",
        description:
          ax.response?.data?.message ??
          "Pastikan role Teknisi punya permission radio.repair.view",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const openDetail = async (id: number) => {
    const d = await radioRepairApi.getById(id);
    setDetail(d);
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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Wrench className="w-7 h-7 text-violet-600" /> Dashboard Perbaikan Radio
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border p-4 shadow-sm">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
            <div className={`h-1 mt-2 rounded ${c.color}`} />
          </div>
        ))}
      </div>

      <input
        className="border rounded-lg px-3 py-2 w-full max-w-md"
        placeholder="Cari SN, job, tiket..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">Job</th>
              <th className="text-left px-4 py-3">Tiket</th>
              <th className="text-left px-4 py-3">SN</th>
              <th className="text-left px-4 py-3">Kerusakan</th>
              <th className="text-left px-4 py-3">Teknisi</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Buka</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-t hover:bg-violet-50/40 cursor-pointer" onClick={() => openDetail(j.id)}>
                <td className="px-4 py-3 font-mono text-xs">{j.jobNumber}</td>
                <td className="px-4 py-3">{j.helpdeskTicketNumber}</td>
                <td className="px-4 py-3">{j.radioSerialNumber}</td>
                <td className="px-4 py-3 max-w-xs truncate">{j.damageDescription}</td>
                <td className="px-4 py-3 font-medium">{j.assignedTechnicianName}</td>
                <td className="px-4 py-3"><RadioRepairStatusBadge status={j.status} /></td>
                <td className="px-4 py-3">{format(new Date(j.openedAt), "dd/MM/yy", { locale: localeId })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.jobNumber}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <p>Tiket: <strong>{detail.helpdeskTicketNumber}</strong></p>
              <p>Teknisi: <strong>{detail.assignedTechnicianName}</strong></p>
              <p>Kerusakan: {detail.damageDescription}</p>
              <RadioRepairStatusBadge status={detail.status} />

              {canUpdate && detail.status !== "HandedToWarehouse" && detail.status !== "ReturnedToHelpdesk" && detail.status !== "Cancelled" && (
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      className="px-3 py-1 border rounded-lg hover:bg-violet-50"
                      onClick={() => patchStatus(s.value)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              {canSupervise && detail.status === "WaitingMaterialApproval" && (
                <button type="button" className="px-4 py-2 bg-amber-600 text-white rounded-lg" onClick={approveMaterial}>
                  Setujui Material
                </button>
              )}

              {canUpdate && detail.status === "RepairCompleted" && hasAnyPermission("radio.handover.create.tek_wh", "radio.handover.create") && (
                <button type="button" className="px-4 py-2 bg-violet-600 text-white rounded-lg" onClick={() => setShowWh(true)}>
                  Serah terima ke Warehouse
                </button>
              )}

              <div>
                <h3 className="font-semibold mb-2">Timeline</h3>
                <ul className="space-y-1 text-xs text-gray-600">
                  {(detail.statusLogs ?? []).map((l) => (
                    <li key={l.id}>
                      {format(new Date(l.at), "dd/MM HH:mm")} — {l.fromStatus ?? "—"} → {l.toStatus} ({l.userName})
                      {l.note && `: ${l.note}`}
                    </li>
                  ))}
                </ul>
              </div>
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
              onSuccess={() => {
                setShowWh(false);
                setDetail(null);
                load();
              }}
              onCancel={() => setShowWh(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
