import { hasAnyPermission } from "./permissionUtils";

export const canCreateHandoverHd = () =>
  hasAnyPermission("radio.handover.create.hd", "radio.handover.create");

export const canCreateHandoverTekWh = () =>
  hasAnyPermission("radio.handover.create.tek_wh", "radio.handover.create");

export const canCreateHandoverWhHd = () =>
  hasAnyPermission("radio.handover.create.wh_hd", "radio.handover.create");
