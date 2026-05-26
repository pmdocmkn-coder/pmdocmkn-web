import type { RadioLookup } from "../types/radioHandover";
import type { RadioSerialLine } from "../components/RadioHandover/MultiRadioSerialList";
import type { SharedRadioDefaults } from "../components/RadioHandover/SharedRadioDefaultsFields";

export function ownerFromLookup(lookup?: RadioLookup | null): string {
  if (!lookup) return "";
  return lookup.company?.trim() || lookup.ownerLabel?.trim() || lookup.category || "";
}

export function lineFromLookup(serial: string, radioId: number | null, lookup?: RadioLookup | null): RadioSerialLine {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    serial: serial.trim(),
    radioId,
    lookup: lookup ?? null,
    equipmentName: lookup?.type?.trim() ?? "",
    unitNumber: lookup?.nomorUnit?.trim() ?? "",
    radioOwnerLabel: ownerFromLookup(lookup),
    ownerDivision: lookup?.division?.trim() ?? "",
    ownerDepartment: lookup?.department?.trim() ?? "",
  };
}

export function defaultsFromLine(line: RadioSerialLine): SharedRadioDefaults {
  return {
    equipmentName: line.equipmentName,
    radioOwnerLabel: line.radioOwnerLabel,
    ownerDivision: line.ownerDivision,
    ownerDepartment: line.ownerDepartment,
    unitNumber: line.unitNumber,
  };
}

export function syncSharedFromFirstMaster(lines: RadioSerialLine[]): SharedRadioDefaults | null {
  const first = lines.find((r) => r.radioId && r.lookup);
  if (!first) return null;
  return defaultsFromLine(first);
}
