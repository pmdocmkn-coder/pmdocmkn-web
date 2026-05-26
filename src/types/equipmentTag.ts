export type EquipmentTagType = "Damaged" | "Good";

export type GreenTagFields = {
  originFrom?: string;
  repairDataDescription?: string;
  repairedByName?: string;
  frequencyError?: string;
  afReading?: string;
  powerReading?: string;
  voltageOutNoLoad?: string;
  voltageOutWithLoad?: string;
  physicalCondition?: string;
  displayCondition?: string;
};

export const EMPTY_GREEN_TAG: GreenTagFields = {
  originFrom: "",
  repairDataDescription: "",
  repairedByName: "",
  frequencyError: "",
  afReading: "",
  powerReading: "",
  voltageOutNoLoad: "",
  voltageOutWithLoad: "",
  physicalCondition: "",
  displayCondition: "",
};
