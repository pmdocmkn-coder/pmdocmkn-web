export type WarehouseBorrowStatus =
  | "PendingApproval"
  | "Approved"
  | "Rejected"
  | "Issued"
  | "Returned"
  | "Cancelled";

export interface WarehouseBorrowItem {
  id?: number;
  partDescription: string;
  partCode?: string | null;
  quantity: number;
}

export interface WarehouseBorrowList {
  id: number;
  borrowNumber: string;
  items: WarehouseBorrowItem[];
  totalItems: number;
  status: WarehouseBorrowStatus;
  borrowedByName: string;
  requestedAt: string;
  relatedJobNumber?: string | null;
  ticketNumber?: string | null;
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
  returnedByName?: string | null;
  issuerSignatureBase64?: string | null;
  receiverSignatureBase64?: string | null;
  returnIssuerSignatureBase64?: string | null;
  returnReceiverSignatureBase64?: string | null;
  statusLogs: {
    id: number;
    fromStatus?: string | null;
    toStatus: string;
    note?: string | null;
    userName: string;
    at: string;
  }[];
}
