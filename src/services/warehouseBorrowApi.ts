import { api } from "./api";
import { unwrapData, unwrapList, unwrapPaged } from "../utils/apiResponse";
import type { WarehouseBorrowDetail, WarehouseBorrowItem, WarehouseBorrowList } from "../types/warehouseBorrow";

export const warehouseBorrowApi = {
  getAll: (params?: Record<string, unknown>) =>
    api
      .get("/api/warehouse-part-borrows", { params })
      .then((r) => unwrapPaged<WarehouseBorrowList>(r)),

  getPending: () =>
    api.get("/api/warehouse-part-borrows/pending").then((r) => unwrapList<WarehouseBorrowList>(r)),

  getById: (id: number) =>
    api.get(`/api/warehouse-part-borrows/${id}`).then((r) => unwrapData<WarehouseBorrowDetail>(r)!),

  create: (body: {
    items: WarehouseBorrowItem[];
    purpose?: string;
    relatedRepairJobId?: number;
    ticketNumber?: string;
    borrowerName?: string;
  }) => api.post("/api/warehouse-part-borrows", body).then((r) => unwrapData<WarehouseBorrowDetail>(r)!),

  approve: (id: number, note?: string) =>
    api.patch(`/api/warehouse-part-borrows/${id}/approve`, { note }).then((r) => unwrapData<WarehouseBorrowDetail>(r)!),

  reject: (id: number, reason: string) =>
    api.patch(`/api/warehouse-part-borrows/${id}/reject`, { reason }).then((r) => unwrapData<WarehouseBorrowDetail>(r)!),

  signReceiver: (id: number, receiverSignatureBase64: string) =>
    api.patch(`/api/warehouse-part-borrows/${id}/sign-receiver`, { receiverSignatureBase64 }).then((r) => unwrapData<WarehouseBorrowDetail>(r)!),

  issue: (id: number, body?: { issuerSignatureBase64?: string; receiverSignatureBase64?: string }) =>
    api.patch(`/api/warehouse-part-borrows/${id}/issue`, body ?? {}).then((r) => unwrapData<WarehouseBorrowDetail>(r)!),

  return: (id: number, body?: { returnCondition?: string; returnNote?: string; returnIssuerSignatureBase64?: string; returnReceiverSignatureBase64?: string; returnedByName?: string }) =>
    api.patch(`/api/warehouse-part-borrows/${id}/return`, body ?? {}).then((r) => unwrapData<WarehouseBorrowDetail>(r)!),

  signReturnReceiver: (id: number, body: { returnReceiverSignatureBase64: string; returnCondition?: string; returnNote?: string }) =>
    api.patch(`/api/warehouse-part-borrows/${id}/sign-return`, body).then((r) => unwrapData<WarehouseBorrowDetail>(r)!),

  cancel: (id: number) => api.post(`/api/warehouse-part-borrows/${id}/cancel`),

  delete: (id: number) => api.delete(`/api/warehouse-part-borrows/${id}`),
};
