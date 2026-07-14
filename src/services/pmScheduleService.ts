import {
  PmSiteDto,
  PmYearlyScheduleResponseDto,
  PmScheduleUpsertDto,
  PmComplianceDashboardDto,
} from "../types/pmSchedule";
import { api } from "./api";

export const pmScheduleApi = {
  // ============================================
  // PM SITES CRUD
  // ============================================
  getAllSites: async (): Promise<PmSiteDto[]> => {
    const response = await api.get("/api/pm-sites");
    return response.data.data;
  },

  createSite: async (dto: Omit<PmSiteDto, "id">): Promise<PmSiteDto> => {
    const response = await api.post("/api/pm-sites", dto);
    return response.data.data;
  },

  updateSite: async (id: number, dto: Omit<PmSiteDto, "id">): Promise<PmSiteDto> => {
    const response = await api.put(`/api/pm-sites/${id}`, dto);
    return response.data.data;
  },

  deleteSite: async (id: number): Promise<void> => {
    await api.delete(`/api/pm-sites/${id}`);
  },

  reorderSites: async (orders: { id: number; orderIndex: number }[]): Promise<void> => {
    await api.put('/api/pm-sites/reorder', orders);
  },

  // ============================================
  // PM SCHEDULE MATRIX
  // ============================================
  getYearlySchedule: async (
    year: number
  ): Promise<PmYearlyScheduleResponseDto> => {
    const response = await api.get("/api/pm-schedules/yearly", {
      params: { year },
    });
    return response.data.data;
  },

  upsertSchedule: async (dto: PmScheduleUpsertDto): Promise<void> => {
    await api.post("/api/pm-schedules/upsert", dto);
  },

  deleteSchedule: async (year: number, pmSiteId: number, deviceName: string): Promise<void> => {
    await api.delete(`/api/pm-schedules/${year}/${pmSiteId}/${encodeURIComponent(deviceName)}`);
  },

  toggleTaskCompletion: async (taskId: number, remarks?: string, completedAt?: string): Promise<void> => {
    await api.post(`/api/pm-schedules/tasks/${taskId}/toggle-complete`, { remarks, completedAt });
  },

  getComplianceDashboard: async (year?: number): Promise<PmComplianceDashboardDto> => {
    const response = await api.get("/api/pm-schedules/dashboard/compliance", {
      params: year ? { year } : undefined
    });
    return response.data.data;
  },
};
