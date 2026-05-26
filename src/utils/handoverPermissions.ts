import { hasAnyPermission, hasPermission } from "./permissionUtils";

export const canCreateHandoverHd = () =>
  hasAnyPermission("radio.handover.create.hd", "radio.handover.create");

export const canCreateHandoverTekWh = () =>
  hasAnyPermission("radio.handover.create.tek_wh", "radio.handover.create");

/** Hanya akun dengan `radio.handover.create.wh_hd` (tanpa legacy `radio.handover.create`). */
export const canCreateHandoverWhHd = () => hasPermission("radio.handover.create.wh_hd");
