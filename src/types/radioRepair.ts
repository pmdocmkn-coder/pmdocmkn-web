export type RadioRepairJobStatus =
  | "Received"
  | "InProgress"
  | "Monitoring"
  | "WaitingMaterialApproval"
  | "RepairCompleted"
  | "HandedToWarehouse"
  | "ReturnedToHelpdesk"
  | "Cancelled";

export interface RadioRepairJobList {
  id: number;
  helpdeskTicketNumber: string;
  radioSerialNumber: string;
  radioId?: number | null;
  radioMasterRadioId?: string | null;
  radioFleet?: string | null;
  radioCategory?: string | null;
  equipmentName?: string | null;
  unitNumber?: string | null;
  radioOwnerLabel?: string | null;
  previewPhotoBase64?: string | null;
  damageDescription: string;
  status: RadioRepairJobStatus;
  assignedTechnicianUserId: number;
  assignedTechnicianName: string;
  /** ID status custom jika job sedang di status custom */
  customStatusId?: number | null;
  /** Label status custom untuk ditampilkan di UI */
  customStatusLabel?: string | null;
  /** Warna status custom (Tailwind class) */
  customStatusColor?: string | null;
  openedAt: string;
  closedAt?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
}

// ─── Custom Status Types ──────────────────────────────────────────────────────
export interface RepairJobCustomStatus {
  id: number;
  label: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  activeJobCount: number;
  createdAt: string;
}

export interface RadioRepairTicketGroup {
  helpdeskTicketNumber: string;
  radioCount: number;
  radios: RadioRepairJobList[];
}

export interface RadioRepairDashboard {
  total: number;
  received: number;
  inProgress: number;
  monitoring: number;
  waitingMaterialApproval: number;
  repairCompleted: number;
  handedToWarehouse: number;
  returnedToHelpdesk: number;
  cancelled: number;
}

export interface RadioRepairHandoverAccessory {
  itemName: string;
  quantity: number;
  unit?: string | null;
  description?: string | null;
  serialNumber?: string | null;
}

export interface RadioRepairPrimaryHandover {
  id: number;
  handoverNumber: string;
  handoverAt: string;
  handedOverByName: string;
  receivedByName: string;
  status: string;
  equipmentName?: string | null;
  unitNumber?: string | null;
  radioOwnerLabel?: string | null;
  ownerDivision?: string | null;
  ownerDepartment?: string | null;
  radioSerialNumber: string;
  batterySerialNumber?: string | null;
  damageDescription: string;
  accessories: RadioRepairHandoverAccessory[];
}

export interface RadioRepairJobDetail extends RadioRepairJobList {
  batterySerialNumber?: string | null;
  equipmentName?: string | null;
  unitNumber?: string | null;
  radioOwnerLabel?: string | null;
  ownerDivision?: string | null;
  ownerDepartment?: string | null;
  openedByName: string;
  primaryHandover?: RadioRepairPrimaryHandover | null;
  statusLogs: {
    id: number;
    fromStatus?: string | null;
    toStatus: string;
    note?: string | null;
    userName: string;
    at: string;
  }[];
  handovers: {
    id: number;
    handoverNumber: string;
    handoverType: string;
    handoverAt: string;
    signedAt?: string | null;
    equipmentTagType?: string;
    handedOverByName: string;
    receivedByName: string;
    status?: string;
    hasRadioPhoto: boolean;
    hasHandedOverSignature: boolean;
    hasReceiverSignature: boolean;
  }[];
}
