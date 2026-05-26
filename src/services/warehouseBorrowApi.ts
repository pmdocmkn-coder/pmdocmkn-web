import { api } from "./api";
import { unwrapData, unwrapList, unwrapPaged } from "../utils/apiResponse";
import type { WarehouseBorrowDetail, WarehouseBorrowList } from "../types/warehouseBorrow";

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
    partDescription: string;
    partCode?: string;
    quantity: number;
    purpose?: string;
    relatedRepairJobId?: number;
  }) => api.post("/api/warehouse-part-borrows", body).then((r) => unwrapData<WarehouseBorrowDetail>(r)!),

  approve: (id: number, note?: string) =>
    api.patch(`/api/warehouse-part-borrows/${id}/approve`, { note }).then((r) => unwrapData<WarehouseBorrowDetail>(r)!),

  reject: (id: number, reason: string) =>
    api.patch(`/api/warehouse-part-borrows/${id}/reject`, { reason }).then((r) => unwrapData<WarehouseBorrowDetail>(r)!),

  issue: (id: number) =>
    api.patch(`/api/warehouse-part-borrows/${id}/issue`).then((r) => unwrapData<WarehouseBorrowDetail>(r)!),

  return: (id: number, body?: { returnCondition?: string; returnNote?: string }) =>
    api.patch(`/api/warehouse-part-borrows/${id}/return`, body ?? {}).then((r) => unwrapData<WarehouseBorrowDetail>(r)!),

  cancel: (id: number) => api.delete(`/api/warehouse-part-borrows/${id}`),
};
