import { api } from "./api";
import { unwrapData, unwrapPaged } from "../utils/apiResponse";
import type {
  RadioRepairDashboard,
  RadioRepairJobDetail,
  RadioRepairJobList,
  RadioRepairJobStatus,
  RadioRepairTicketGroup,
} from "../types/radioRepair";

export type UpdateRadioRepairJobPayload = {
  helpdeskTicketNumber: string;
  radioSerialNumber: string;
  batterySerialNumber?: string | null;
  damageDescription: string;
  assignedTechnicianUserId: number;
  workshopTechnicianId?: number | null;
  radioId?: number | null;
  equipmentName?: string;
  unitNumber?: string;
  radioOwnerLabel?: string;
  ownerDivision?: string;
  ownerDepartment?: string;
};

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

  getByTicket: (params?: Record<string, unknown>) =>
    api
      .get("/api/radio-repair-jobs/by-ticket", { params })
      .then((r) => unwrapData<RadioRepairTicketGroup[]>(r) ?? []),

  getById: (id: number, includeDeleted = false) =>
    api.get(`/api/radio-repair-jobs/${id}`, { params: { includeDeleted } }).then((r) => {
      const data = unwrapData<RadioRepairJobDetail>(r);
      if (!data) throw new Error("Pekerjaan tidak ditemukan");
      return data;
    }),

  update: (id: number, payload: UpdateRadioRepairJobPayload) =>
    api.patch(`/api/radio-repair-jobs/${id}`, payload).then((r) => unwrapData<RadioRepairJobDetail>(r)!),

  technicianUpdate: (
    id: number,
    payload: {
      damageDescription?: string;
      equipmentTagType?: string;
      isWarranty?: boolean;
      originFrom?: string | null;
      repairDataDescription?: string | null;
      repairedByName?: string | null;
      frequencyError?: string | null;
      afReading?: string | null;
      powerReading?: string | null;
      voltageOutNoLoad?: string | null;
      voltageOutWithLoad?: string | null;
      physicalCondition?: string | null;
      displayCondition?: string | null;
    }
  ) =>
    api
      .patch(`/api/radio-repair-jobs/${id}/notes`, payload)
      .then((r) => unwrapData<RadioRepairJobDetail>(r)!),

  updateStatus: (id: number, status: RadioRepairJobStatus, note?: string, customStatusId?: number | null, workshopTechnicianId?: number | null) =>
    api
      .patch(`/api/radio-repair-jobs/${id}/status`, { status, note, customStatusId, workshopTechnicianId })
      .then((r) => unwrapData<RadioRepairJobDetail>(r)!),

  approveMaterial: (
    id: number,
    resumeStatus: "InProgress" | "Monitoring",
    note?: string,
    workshopTechnicianId?: number | null
  ) =>
    api
      .patch(`/api/radio-repair-jobs/${id}/approve-material`, { resumeStatus, note, workshopTechnicianId })
      .then((r) => unwrapData<RadioRepairJobDetail>(r)!),

  approveScrap: (id: number, payload: { dateScrapped: string; scrapJobNumber?: string; remarks?: string }) =>
    api.patch(`/api/radio-repair-jobs/${id}/approve-scrap`, payload).then((r) => unwrapData<RadioRepairJobDetail>(r)!),

  cancelScrap: (id: number) =>
    api.patch(`/api/radio-repair-jobs/${id}/cancel-scrap`).then((r) => unwrapData<RadioRepairJobDetail>(r)!),

  softDelete: (id: number) => api.delete(`/api/radio-repair-jobs/${id}`),

  restore: (id: number) =>
    api.patch(`/api/radio-repair-jobs/${id}/restore`).then((r) => unwrapData(r)),

  deletePermanent: (id: number) =>
    api.delete(`/api/radio-repair-jobs/${id}/permanent`).then((r) => unwrapData(r)),

  resetTestingData: () => api.delete("/api/radio-repair-jobs/reset-testing-data").then((r) => unwrapData(r)),

  purgeJob: (id: number) =>
    api.delete(`/api/radio-repair-jobs/${id}/purge`).then((r) => unwrapData(r)),
};
