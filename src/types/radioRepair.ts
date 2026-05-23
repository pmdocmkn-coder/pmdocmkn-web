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
  jobNumber: string;
  helpdeskTicketNumber: string;
  radioSerialNumber: string;
  radioId?: number | null;
  radioCategory?: string | null;
  damageDescription: string;
  status: RadioRepairJobStatus;
  assignedTechnicianUserId: number;
  assignedTechnicianName: string;
  openedAt: string;
  closedAt?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
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

export interface RadioRepairJobDetail extends RadioRepairJobList {
  batterySerialNumber?: string | null;
  openedByName: string;
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
    handedOverByName: string;
    receivedByName: string;
    hasRadioPhoto: boolean;
    hasHandedOverSignature: boolean;
    hasReceiverSignature: boolean;
  }[];
}
