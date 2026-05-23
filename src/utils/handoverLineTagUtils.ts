import type { DamagedEquipmentTagData } from "../components/RadioHandover/DamagedEquipmentTagCard";
import type { GoodEquipmentTagData } from "../components/RadioHandover/GoodEquipmentTagCard";
import type { RadioSerialLine } from "../components/RadioHandover/MultiRadioSerialList";
import type { SharedRadioDefaults } from "../components/RadioHandover/SharedRadioDefaultsFields";
import { mergeLineWithDefaults } from "../components/RadioHandover/SharedRadioDefaultsFields";
import type { GreenTagFields } from "../types/equipmentTag";
import type { HandoverAccessoryItem } from "../types/radioHandover";

export function masterRadioIdFromLine(line: RadioSerialLine): string {
  const l = line.lookup;
  return (
    l?.radioId?.trim() ||
    l?.nomorAset?.trim() ||
    (line.radioId != null ? `#${line.radioId}` : "")
  );
}

export function fleetFromLine(line: RadioSerialLine): string {
  return line.lookup?.fleet?.trim() ?? "";
}

export function mergedLines(
  radioLines: RadioSerialLine[],
  sharedDefaults: SharedRadioDefaults,
): RadioSerialLine[] {
  return radioLines
    .map((r) => mergeLineWithDefaults(r, sharedDefaults))
    .filter((r) => r.serial.trim());
}

export function toDamagedPreview(
  line: RadioSerialLine,
  ctx: {
    ticket: string;
    damage: string;
    accessories: HandoverAccessoryItem[];
  },
): DamagedEquipmentTagData {
  return {
    handoverNumber: "STR-…",
    handedOverByName: "Helpdesk",
    receivedByName: "Teknisi",
    handoverAt: new Date().toISOString(),
    equipmentName: line.equipmentName.trim() || line.lookup?.type?.trim() || "—",
    unitNumber: line.unitNumber.trim() || line.lookup?.nomorUnit?.trim() || "",
    radioSerialNumber: line.serial.trim(),
    radioOwnerLabel: line.radioOwnerLabel.trim() || undefined,
    ownerDivision: line.ownerDivision.trim() || line.lookup?.division?.trim() || undefined,
    ownerDepartment: line.ownerDepartment.trim() || line.lookup?.department?.trim() || undefined,
    damageDescription: ctx.damage.trim() || undefined,
    accessories: ctx.accessories,
    helpdeskTicketNumber: ctx.ticket.trim() || undefined,
    radioMasterId: line.radioId,
    radioMasterRadioId: masterRadioIdFromLine(line) || undefined,
    radioFleet: fleetFromLine(line) || undefined,
    radioCategory: line.lookup?.category,
  };
}

export function toGoodPreview(
  line: RadioSerialLine,
  green: GreenTagFields,
  ctx: { ticket: string },
): GoodEquipmentTagData {
  const owner =
    line.radioOwnerLabel.trim() ||
    line.lookup?.company?.trim() ||
    line.lookup?.ownerLabel?.trim() ||
    "";
  return {
    handoverNumber: "STR-…",
    helpdeskTicketNumber: ctx.ticket.trim() || undefined,
    handoverAt: new Date().toISOString(),
    handedOverByName: "Helpdesk",
    receivedByName: "Teknisi",
    equipmentName: line.equipmentName.trim() || line.lookup?.type?.trim() || "—",
    unitNumber: line.unitNumber.trim() || line.lookup?.nomorUnit?.trim() || "",
    radioSerialNumber: line.serial.trim(),
    radioOwnerLabel: owner || undefined,
    ownerDivision: line.ownerDivision.trim() || line.lookup?.division?.trim() || undefined,
    ownerDepartment: line.ownerDepartment.trim() || line.lookup?.department?.trim() || undefined,
    radioMasterRadioId: masterRadioIdFromLine(line) || undefined,
    radioFleet: fleetFromLine(line) || undefined,
    originFrom:
      green.originFrom?.trim() ||
      owner ||
      line.ownerDivision.trim() ||
      undefined,
    repairDataDescription: green.repairDataDescription?.trim() || undefined,
    repairedByName: green.repairedByName?.trim() || undefined,
    frequencyError: green.frequencyError?.trim() || undefined,
    afReading: green.afReading?.trim() || undefined,
    powerReading: green.powerReading?.trim() || undefined,
    voltageOutNoLoad: green.voltageOutNoLoad?.trim() || undefined,
    voltageOutWithLoad: green.voltageOutWithLoad?.trim() || undefined,
    physicalCondition: green.physicalCondition?.trim() || undefined,
    displayCondition: green.displayCondition?.trim() || undefined,
    handoverType: "HelpdeskToTechnician",
  };
}

export function defaultOriginFrom(
  lines: RadioSerialLine[],
  sharedDefaults: SharedRadioDefaults,
): string {
  const merged = mergedLines(lines, sharedDefaults);
  const first = merged[0];
  if (!first) return sharedDefaults.radioOwnerLabel.trim();
  return (
    first.radioOwnerLabel.trim() ||
    sharedDefaults.radioOwnerLabel.trim() ||
    first.ownerDivision.trim() ||
    sharedDefaults.ownerDivision.trim() ||
    ""
  );
}
