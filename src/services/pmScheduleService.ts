import {
  PmSiteDto,
  PmYearlyScheduleResponseDto,
  PmScheduleUpsertDto,
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
};
