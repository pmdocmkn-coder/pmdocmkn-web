import type { HandoverAccessoryItem } from "../types/radioHandover";

export function toHandoverAccessoryItems(
  items: {
    itemName: string;
    quantity: number;
    unit?: string | null;
    description?: string | null;
    serialNumber?: string | null;
  }[]
): HandoverAccessoryItem[] {
  return items
    .filter((a) => a.itemName?.trim())
    .map((a) => ({
      itemName: a.itemName.trim(),
      quantity: a.quantity < 1 ? 1 : a.quantity,
      unit: a.unit ?? "EA",
      serialNumber: a.serialNumber?.trim() ?? "",
      description: a.description?.trim() || undefined,
    }));
}

/** SN baterai diambil dari baris aksesoris bernama Baterai/Battery. */
export function buildAccessoriesPayload(items: HandoverAccessoryItem[]) {
  const accessories = items.filter((a) => a.itemName.trim());
  const batteryRow = accessories.find((a) => /baterai|battery/i.test(a.itemName.trim()));
  return {
    accessories,
    batterySerialNumber: batteryRow?.serialNumber?.trim() || undefined,
  };
}
