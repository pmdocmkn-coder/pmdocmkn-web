export type RadioHandoverType = "HelpdeskToTechnician" | "TechnicianToWarehouse" | "WarehouseToHelpdesk";



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

  category: string;

  serialNumber?: string;

  type?: string;

  label: string;

}



export interface CreateRadioHandoverPayload {

  handoverType: RadioHandoverType;

  helpdeskTicketNumber?: string;

  radioId?: number | null;

  radioSerialNumber: string;

  batterySerialNumber?: string;

  damageDescription?: string;

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

  jobNumber: string;

  helpdeskTicketNumber?: string;

  radioSerialNumber: string;

  isDeleted?: boolean;

  deletedAt?: string | null;

  handedOverByName: string;

  receivedByName: string;

  handoverAt: string;

  hasRadioPhoto: boolean;

  hasHandedOverSignature: boolean;

  hasReceiverSignature: boolean;

  status: string;

  photoCount: number;

  previewPhotoBase64?: string | null;

}



export interface RadioHandoverDetail extends RadioHandoverList {

  radioId?: number | null;

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

