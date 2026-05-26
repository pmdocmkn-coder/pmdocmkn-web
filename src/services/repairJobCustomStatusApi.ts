import { api } from "./api";
import { unwrapData } from "../utils/apiResponse";
import type { RepairJobCustomStatus } from "../types/radioRepair";

export type CreateCustomStatusPayload = {
  label: string;
  color: string;
  sortOrder: number;
};

export type UpdateCustomStatusPayload = {
  label: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
};

export const repairJobCustomStatusApi = {
  getAll: () =>
    api
      .get("/api/repair-job-custom-statuses")
      .then((r) => unwrapData<RepairJobCustomStatus[]>(r) ?? []),

  create: (payload: CreateCustomStatusPayload) =>
    api
      .post("/api/repair-job-custom-statuses", payload)
      .then((r) => unwrapData<RepairJobCustomStatus>(r)!),

  update: (id: number, payload: UpdateCustomStatusPayload) =>
    api
      .patch(`/api/repair-job-custom-statuses/${id}`, payload)
      .then((r) => unwrapData<RepairJobCustomStatus>(r)!),

  delete: (id: number) =>
    api.delete(`/api/repair-job-custom-statuses/${id}`),
};
