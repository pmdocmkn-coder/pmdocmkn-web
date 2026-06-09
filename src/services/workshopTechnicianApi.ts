import { api } from "./api";

export interface WorkshopTechnicianDto {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateWorkshopTechnicianDto {
  name: string;
  isActive: boolean;
}

export interface UpdateWorkshopTechnicianDto {
  name: string;
  isActive: boolean;
}

export const workshopTechnicianApi = {
  // Paged — dipakai tabel utama jika ada pagination (saat ini pakai list biasa jika datanya tidak banyak)
  getAll: () => {
    return api.get<{ data: WorkshopTechnicianDto[]; message: string }>("/api/workshop-technicians");
  },

  getAllActive: () => {
    return api.get<{ data: WorkshopTechnicianDto[]; message: string }>("/api/workshop-technicians?includeInactive=false");
  },

  getById: (id: number) => {
    return api.get<{ data: WorkshopTechnicianDto; message: string }>(`/api/workshop-technicians/${id}`);
  },

  create: (data: CreateWorkshopTechnicianDto) => {
    return api.post<{ data: WorkshopTechnicianDto; message: string }>("/api/workshop-technicians", data);
  },

  update: (id: number, data: UpdateWorkshopTechnicianDto) => {
    return api.put<{ data: WorkshopTechnicianDto; message: string }>(`/api/workshop-technicians/${id}`, data);
  },

  delete: (id: number) => {
    return api.delete(`/api/workshop-technicians/${id}`);
  },
};
