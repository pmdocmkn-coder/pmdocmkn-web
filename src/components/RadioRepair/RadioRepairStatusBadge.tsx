import type { RadioRepairJobStatus } from "../../types/radioRepair";

export const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  Received: { label: "Diterima", className: "bg-slate-100 text-slate-700" },
  InProgress: { label: "Progress", className: "bg-blue-100 text-blue-700" },
  Monitoring: { label: "Monitoring", className: "bg-indigo-100 text-indigo-700" },
  WaitingMaterialApproval: { label: "Tunggu Material", className: "bg-amber-100 text-amber-800" },
  RepairCompleted: { label: "Selesai", className: "bg-emerald-100 text-emerald-700" },
  HandedToWarehouse: { label: "Di Warehouse", className: "bg-violet-100 text-violet-700" },
  ReturnedToHelpdesk: { label: "Kembali ke HD", className: "bg-indigo-100 text-indigo-700" },
  Cancelled: { label: "Dibatalkan", className: "bg-red-100 text-red-700" },
};

type Props = {
  status: string;
  /** Label status custom — jika ada, ditampilkan menggantikan label status sistem */
  customStatusLabel?: string | null;
  /** Warna status custom (Tailwind bg class) */
  customStatusColor?: string | null;
  /** Jika diatur, status akan diganti menjadi Menunggu TTD sesuai tipe serah terima */
  pendingHandoverType?: string | null;
};

export default function RadioRepairStatusBadge({ status, customStatusLabel, customStatusColor, pendingHandoverType }: Props) {
  if (pendingHandoverType) {
    let label = "Menunggu TTD";
    if (pendingHandoverType === "TechnicianToWarehouse") label = "Menunggu TTD WH";
    else if (pendingHandoverType === "WarehouseToHelpdesk") label = "Menunggu TTD HD";
    else if (pendingHandoverType === "HelpdeskToTechnician") label = "Menunggu TTD Teknisi";
    
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
        {label}
      </span>
    );
  }

  // Jika ada custom status, tampilkan dengan warna custom
  if (customStatusLabel) {
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold text-white ${customStatusColor ?? "bg-slate-500"}`}>
        {customStatusLabel}
      </span>
    );
  }
  const c = STATUS_CONFIG[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${c.className}`}>
      {c.label}
    </span>
  );
}
