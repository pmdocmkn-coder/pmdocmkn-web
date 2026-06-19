import type { RadioHandoverDetail } from "../types/radioHandover";
import type { DamagedEquipmentTagData } from "../components/RadioHandover/DamagedEquipmentTagCard";
import type { GoodEquipmentTagData } from "../components/RadioHandover/GoodEquipmentTagCard";

export function isGoodTag(type?: string | null) {
  return type === "Good";
}

export function toDamagedTagData(d: RadioHandoverDetail): DamagedEquipmentTagData {
  return {
    handoverNumber: d.handoverNumber,
    handedOverByName: d.handedOverByName,
    receivedByName: d.receivedByName,
    handoverAt: d.handoverAt,
    equipmentName: d.equipmentName,
    unitNumber: d.unitNumber,
    radioSerialNumber: d.radioSerialNumber,
    radioOwnerLabel: d.radioOwnerLabel,
    ownerDivision: d.ownerDivision,
    ownerDepartment: d.ownerDepartment,
    damageDescription: d.damageDescription,
    accessories: d.accessories ?? [],
    helpdeskTicketNumber: d.helpdeskTicketNumber,
    radioMasterId: d.radioId,
    radioMasterRadioId: d.radioMasterRadioId,
    radioFleet: d.radioFleet,
  };
}

export function toGoodTagData(d: RadioHandoverDetail): GoodEquipmentTagData {
  return {
    handoverNumber: d.handoverNumber,
    helpdeskTicketNumber: d.helpdeskTicketNumber,
    handoverAt: d.handoverAt,
    handedOverByName: d.handedOverByName,
    receivedByName: d.receivedByName,
    equipmentName: d.equipmentName,
    unitNumber: d.unitNumber,
    radioSerialNumber: d.radioSerialNumber,
    radioOwnerLabel: d.radioOwnerLabel,
    ownerDivision: d.ownerDivision,
    ownerDepartment: d.ownerDepartment,
    radioMasterRadioId: d.radioMasterRadioId,
    radioFleet: d.radioFleet,
    originFrom: d.originFrom,
    repairDataDescription: d.repairDataDescription,
    repairedByName: d.repairedByName,
    frequencyError: d.frequencyError,
    afReading: d.afReading,
    powerReading: d.powerReading,
    voltageOutNoLoad: d.voltageOutNoLoad,
    voltageOutWithLoad: d.voltageOutWithLoad,
    physicalCondition: d.physicalCondition,
    displayCondition: d.displayCondition,
    handoverType: d.handoverType,
    accessories: d.accessories ?? [],
  };
}
