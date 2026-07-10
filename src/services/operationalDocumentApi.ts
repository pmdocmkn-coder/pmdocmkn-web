import { api } from "./api";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface OperationalDocumentDto {
  id: number;
  name: string;
  type: string;
  referenceNumber?: string;
  groupName?: string;
  validFrom: string;
  validUntil: string;
  picName?: string;
  picTelegramId?: string;
  fileLink?: string;
  followUpStatus: "Tidak Ada" | "Pending" | "SedangDiproses" | "Selesai";
  followUpRemark?: string;
  createdAt: string;
  updatedAt?: string;
  daysRemaining: number;
  expiryStatus: "Aman" | "Warning" | "Expired";
}

export interface OperationalDocumentSummaryDto {
  totalDocuments: number;
  expiringSoon: number;
  expired: number;
}

export interface CreateOperationalDocumentDto {
  name: string;
  type: string;
  referenceNumber?: string;
  groupName?: string;
  validFrom: string;
  validUntil: string;
  picName?: string;
  picTelegramId?: string;
  fileLink?: string;
}

export interface OperationalDocumentQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: string;
  type?: string;
  followUpStatus?: string;
  expiryStatus?: string;
  groupName?: string;
}

export interface OperationalDocumentTypeDto {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOperationalDocumentTypeDto {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface OperationalDocumentTypeQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

// ── API ───────────────────────────────────────────────────────────────────────
export const operationalDocumentApi = {
  getAll: (params: OperationalDocumentQueryParams) =>
    api.get<any>("/api/operational-documents", { params }),

  getSummary: () =>
    api.get<any>("/api/operational-documents/summary"),

  getById: (id: number) =>
    api.get<any>(`/api/operational-documents/${id}`),

  create: (data: CreateOperationalDocumentDto) =>
    api.post<any>("/api/operational-documents", data),

  update: (id: number, data: CreateOperationalDocumentDto) =>
    api.put<any>(`/api/operational-documents/${id}`, data),

  updateFollowUpStatus: (id: number, status: string, remark?: string) =>
    api.patch<any>(`/api/operational-documents/${id}/follow-up-status`, { status, remark }),

  delete: (id: number) =>
    api.delete(`/api/operational-documents/${id}`),

  triggerNotification: () =>
    api.post<any>("/api/operational-documents/trigger-notification"),

  sendNotification: (id: number) =>
    api.post<any>(`/api/operational-documents/${id}/send-notification`),
  
  sendNotificationBulk: (req: { groupName?: string, type?: string, expiryStatus?: string }) =>
    api.post<any>(`/api/operational-documents/send-notification-bulk`, req),

  getGroups: () =>
    api.get<any>("/api/operational-documents", { params: { page: 1, pageSize: 9999 } }),
};

export const operationalDocumentTypeApi = {
  getAll: (params?: OperationalDocumentTypeQueryParams) =>
    api.get<any>("/api/OperationalDocumentTypes", { params }),

  getById: (id: number) =>
    api.get<any>(`/api/OperationalDocumentTypes/${id}`),

  create: (data: CreateOperationalDocumentTypeDto) =>
    api.post<any>("/api/OperationalDocumentTypes", data),

  update: (id: number, data: CreateOperationalDocumentTypeDto) =>
    api.put<any>(`/api/OperationalDocumentTypes/${id}`, data),

  delete: (id: number) =>
    api.delete(`/api/OperationalDocumentTypes/${id}`),
};

