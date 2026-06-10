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
      return ["Monitoring", "WaitingMaterialApproval", "ProcessScrap", "RepairCompleted"];
    case "Monitoring":
      // Saat monitoring, hanya satu tombol: "Monitoring Selesai" (→ InProgress)
      // Setelah diklik dan status kembali ke InProgress, baru muncul tombol lain
      return ["InProgress", "ProcessScrap"];
    case "WaitingMaterialApproval":
      return [];
    case "RepairCompleted":
      // Teknisi bisa rollback jika salah tekan — hanya ke InProgress
      return ["InProgress"];
    default:
      return [];
  }
}

/**
 * Label override untuk tombol aksi — beberapa transisi punya label kontekstual
 * yang lebih jelas daripada nama status tujuan.
 */
export const STATUS_ACTION_LABEL_OVERRIDE: Partial<Record<RadioRepairJobStatus, Partial<Record<RadioRepairJobStatus, string>>>> = {
  Monitoring: {
    InProgress: "Monitoring Selesai",
  },
  RepairCompleted: {
    InProgress: "Batalkan Selesai",
  },
};

export function statusActionLabel(from: RadioRepairJobStatus, to: RadioRepairJobStatus): string {
  return STATUS_ACTION_LABEL_OVERRIDE[from]?.[to] ?? STATUS_LABELS[to];
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
  ProcessScrap: "Proses Scrap",
  Scrapped: "Telah di-Scrap",
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
  ProcessScrap:
    "bg-orange-600 text-white border-orange-600 hover:bg-orange-700 shadow-sm",
};

/**
 * Override class tombol berdasarkan konteks from→to.
 * Contoh: rollback RepairCompleted→InProgress pakai warna merah, bukan biru.
 */
export const STATUS_ACTION_BUTTON_CLASS_OVERRIDE: Partial<Record<RadioRepairJobStatus, Partial<Record<RadioRepairJobStatus, string>>>> = {
  RepairCompleted: {
    InProgress: "bg-red-100 text-red-700 border-red-300 hover:bg-red-200 shadow-sm",
  },
};

export function statusActionButtonClass(status: RadioRepairJobStatus, from?: RadioRepairJobStatus): string {
  const base = "px-3 py-2 rounded-lg text-sm font-medium border transition-colors";
  if (from) {
    const override = STATUS_ACTION_BUTTON_CLASS_OVERRIDE[from]?.[status];
    if (override) return `${base} ${override}`;
  }
  return `${base} ${STATUS_ACTION_BUTTON_CLASS[status] ?? "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"}`;
}
