import type { EquipmentTagType, GreenTagFields } from "./equipmentTag";

export type RadioHandoverType = "HelpdeskToTechnician" | "TechnicianToWarehouse" | "WarehouseToHelpdesk";

export type { EquipmentTagType, GreenTagFields };



export interface HandoverAccessoryItem {

  itemName: string;

  quantity: number;

  unit?: string;

  description?: string;

  serialNumber?: string;

}



export interface UserOption {

  userId: number;

  fullName: string;

  username: string;

}



export interface RadioLookup {
  id: number;
  /** ID grafir / nomor radio di master */
  radioId?: string;
  category: string;
  serialNumber?: string;
  type?: string;
  company?: string;
  division?: string;
  department?: string;
  nomorAset?: string;
  nomorUnit?: string;
  nomorLv?: string;
  fleet?: string;
  channel?: string;
  ownerLabel?: string;
  label: string;
}



export interface CreateRadioHandoverPayload {

  handoverType: RadioHandoverType;

  helpdeskTicketNumber?: string;
  noJobErp?: string | null;

  radioId?: number | null;

  radioSerialNumber: string;

  equipmentName?: string;

  unitNumber?: string;

  radioOwnerLabel?: string;

  ownerDivision?: string;

  ownerDepartment?: string;

  batterySerialNumber?: string;

  damageDescription?: string;

  equipmentTagType?: EquipmentTagType;

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

  radioRepairJobId?: number;

  receivedByUserId: number;

  radioPhotoBase64?: string;

  radioPhotos?: string[];

  handedOverSignatureBase64: string;

  receiverSignatureBase64?: string;

  accessories: HandoverAccessoryItem[];

  remarks?: string;

}



export interface RadioHandoverList {

  id: number;

  handoverNumber: string;

  handoverType: string;

  radioRepairJobId: number;

  helpdeskTicketNumber?: string;
  noJobErp?: string | null;

  radioSerialNumber: string;

  equipmentName?: string | null;

  unitNumber?: string | null;

  radioOwnerLabel?: string | null;

  ownerDivision?: string | null;

  ownerDepartment?: string | null;

  isDeleted?: boolean;

  deletedAt?: string | null;

  receivedByUserId?: number;

  handedOverByName: string;

  receivedByName: string;

  handoverAt: string;

  signedAt?: string | null;

  equipmentTagType?: EquipmentTagType | string;

  hasRadioPhoto: boolean;

  hasHandedOverSignature: boolean;

  hasReceiverSignature: boolean;

  status: string;

  photoCount: number;

  previewPhotoBase64?: string | null;

}



export interface RadioHandoverDetail extends RadioHandoverList {

  radioId?: number | null;

  radioMasterRadioId?: string | null;

  radioFleet?: string | null;

  radioOwnerLabel?: string | null;

  ownerDivision?: string | null;

  ownerDepartment?: string | null;

  damageDescription?: string | null;

  originFrom?: string | null;
  repairDataDescription?: string | null;
  repairedByName?: string | null;
  frequencyError?: string | null;
  afReading?: string | null;
  powerReading?: string | null;
  voltageOutNoLoad?: string | null;
  voltageOutWithLoad?: string | null;
  physicalCondition?: string | null;
  displayCondition?: string | null;

  batterySerialNumber?: string | null;

  radioPhotoBase64?: string | null;

  radioPhotos?: string[];

  handedOverSignatureBase64?: string | null;

  receiverSignatureBase64?: string | null;

  remarks?: string | null;

  accessories: HandoverAccessoryItem[];

  helpdeskTicketNumber: string;

  jobStatus: string;

}

