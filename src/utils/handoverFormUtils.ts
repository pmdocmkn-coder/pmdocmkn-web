import type { HandoverAccessoryItem } from "../types/radioHandover";

/** SN baterai diambil dari baris aksesoris bernama Baterai/Battery. */
export function buildAccessoriesPayload(items: HandoverAccessoryItem[]) {
  const accessories = items.filter((a) => a.itemName.trim());
  const batteryRow = accessories.find((a) => /baterai|battery/i.test(a.itemName.trim()));
  return {
    accessories,
    batterySerialNumber: batteryRow?.serialNumber?.trim() || undefined,
  };
}
