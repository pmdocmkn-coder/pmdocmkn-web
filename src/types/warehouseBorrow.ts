export type WarehouseBorrowStatus =
  | "PendingApproval"
  | "Approved"
  | "Rejected"
  | "Issued"
  | "Returned"
  | "Cancelled";

export interface WarehouseBorrowList {
  id: number;
  borrowNumber: string;
  partDescription: string;
  partCode?: string | null;
  quantity: number;
  status: WarehouseBorrowStatus;
  borrowedByName: string;
  requestedAt: string;
  relatedJobNumber?: string | null;
}

export interface WarehouseBorrowDetail extends WarehouseBorrowList {
  purpose?: string | null;
  relatedRepairJobId?: number | null;
  approvalNote?: string | null;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  issuedAt?: string | null;
  returnedAt?: string | null;
  returnCondition?: string | null;
  returnNote?: string | null;
  statusLogs: {
    id: number;
    fromStatus?: string | null;
    toStatus: string;
    note?: string | null;
    userName: string;
    at: string;
  }[];
}
