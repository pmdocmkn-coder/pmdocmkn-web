import { hasPermission } from "./permissionUtils";

/** Role operasional yang tidak boleh mengubah status perbaikan di dashboard. */
const ROLES_BLOCKED_STATUS_UPDATE = new Set(["Helpdesk", "Warehouse", "Supervisor", "Supervisor Warehouse"]);

/** Role yang boleh serah terima Tek → Warehouse. */
const ROLES_ALLOWED_TEK_WH = new Set(["Teknisi", "Teknisi WSK"]);

export function getCurrentRoleName(): string {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return "";
    const user = JSON.parse(userStr) as { roleName?: string };
    return user.roleName?.trim() ?? "";
  } catch {
    return "";
  }
}

/** Teknisi (atau role teknisi) + permission `radio.repair.update`. Helpdesk tidak. */
export function canUpdateRepairJobStatus(): boolean {
  const role = getCurrentRoleName();
  if (ROLES_BLOCKED_STATUS_UPDATE.has(role)) return false;
  return hasPermission("radio.repair.update");
}

/** Hanya teknisi + permission `radio.handover.create.tek_wh` (tanpa legacy). */
export function canCreateTekToWarehouseHandover(): boolean {
  const role = getCurrentRoleName();
  if (role === "Helpdesk" || ROLES_BLOCKED_STATUS_UPDATE.has(role)) return false;
  if (role && ROLES_ALLOWED_TEK_WH.has(role)) {
    return hasPermission("radio.handover.create.tek_wh");
  }
  return hasPermission("radio.handover.create.tek_wh");
}

export function canApproveRepairMaterial(): boolean {
  return hasPermission("radio.repair.supervise");
}
