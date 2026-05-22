import { api } from "./api";
import { unwrapData, unwrapPaged } from "../utils/apiResponse";
import type {
  RadioRepairDashboard,
  RadioRepairJobDetail,
  RadioRepairJobList,
  RadioRepairJobStatus,
} from "../types/radioRepair";

export const radioRepairApi = {
  getDashboard: () =>
    api
      .get("/api/radio-repair-jobs/dashboard")
      .then((r) => unwrapData<RadioRepairDashboard>(r) ?? {
        total: 0,
        received: 0,
        inProgress: 0,
        monitoring: 0,
        waitingMaterialApproval: 0,
        repairCompleted: 0,
        handedToWarehouse: 0,
        returnedToHelpdesk: 0,
        cancelled: 0,
      }),

  getAll: (params?: Record<string, unknown>) =>
    api.get("/api/radio-repair-jobs", { params }).then((r) => unwrapPaged<RadioRepairJobList>(r)),

  getById: (id: number) =>
    api.get(`/api/radio-repair-jobs/${id}`).then((r) => {
      const data = unwrapData<RadioRepairJobDetail>(r);
      if (!data) throw new Error("Job tidak ditemukan");
      return data;
    }),

  updateStatus: (id: number, status: RadioRepairJobStatus, note?: string) =>
    api
      .patch(`/api/radio-repair-jobs/${id}/status`, { status, note })
      .then((r) => unwrapData<RadioRepairJobDetail>(r)!),

  approveMaterial: (
    id: number,
    resumeStatus: "InProgress" | "Monitoring",
    note?: string
  ) =>
    api
      .patch(`/api/radio-repair-jobs/${id}/approve-material`, { resumeStatus, note })
      .then((r) => unwrapData<RadioRepairJobDetail>(r)!),

  cancel: (id: number) => api.delete(`/api/radio-repair-jobs/${id}`),
};
