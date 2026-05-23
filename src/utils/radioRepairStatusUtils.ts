import type { RadioRepairJobStatus } from "../types/radioRepair";

const LOCKED = new Set<RadioRepairJobStatus>(["HandedToWarehouse", "ReturnedToHelpdesk", "Cancelled"]);

export function isJobStatusLocked(status: RadioRepairJobStatus): boolean {
  return LOCKED.has(status);
}

/** Selaras dengan ValidateStatusTransition di backend. */
export function allowedNextStatuses(from: RadioRepairJobStatus): RadioRepairJobStatus[] {
  if (from === "Cancelled") return [];
  switch (from) {
    case "Received":
      return ["InProgress", "Monitoring", "WaitingMaterialApproval"];
    case "InProgress":
      return ["Monitoring", "WaitingMaterialApproval", "RepairCompleted"];
    case "Monitoring":
      return ["InProgress", "WaitingMaterialApproval", "RepairCompleted"];
    case "WaitingMaterialApproval":
      return [];
    case "RepairCompleted":
      return [];
    default:
      return [];
  }
}

export const STATUS_LABELS: Record<RadioRepairJobStatus, string> = {
  Received: "Diterima",
  InProgress: "Progress perbaikan",
  Monitoring: "Monitoring",
  WaitingMaterialApproval: "Tunggu material",
  RepairCompleted: "Selesai",
  HandedToWarehouse: "Ke warehouse",
  ReturnedToHelpdesk: "Kembali HD",
  Cancelled: "Dibatalkan",
};

/** Gaya tombol aksi status — warna tegas agar teknisi mudah membedakan alur. */
export const STATUS_ACTION_BUTTON_CLASS: Partial<Record<RadioRepairJobStatus, string>> = {
  InProgress:
    "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm",
  Monitoring:
    "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-sm",
  WaitingMaterialApproval:
    "bg-amber-500 text-white border-amber-500 hover:bg-amber-600 shadow-sm",
  RepairCompleted:
    "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm",
};

export function statusActionButtonClass(status: RadioRepairJobStatus): string {
  const base = "px-3 py-2 rounded-lg text-sm font-medium border transition-colors";
  return `${base} ${STATUS_ACTION_BUTTON_CLASS[status] ?? "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"}`;
}
