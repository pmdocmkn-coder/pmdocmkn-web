import { api, apiLongRunning } from "./api";

// DTOs matching backend
export interface RadioDto {
  id: number;
  category: string;
  serialNumber?: string;
  type?: string;
  department?: string;
  division?: string;
  company?: string;
  channel?: string;
  tanggal?: string;
  nomorAset?: string;
  nomorUnit?: string;
  nomorLv?: string;
  isTrunking: boolean;
  isConventional: boolean;
  fleet?: string;
  radioId?: string;
  isScrap: boolean;
  scrapJobNumber?: string;
  dateScrapped?: string;
  remarks?: string;
  mark?: string;
  isDuplicateId: boolean; // Computed field from backend
}

export interface RadioHistoryDto {
  id: number;
  radioId: number;
  action: string;
  changes?: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateRadioDto {
  category: string;
  serialNumber?: string;
  type?: string;
  department?: string;
  division?: string;
  company?: string;
  channel?: string;
  tanggal?: string;
  nomorAset?: string;
  nomorUnit?: string;
  nomorLv?: string;
  isTrunking: boolean;
  isConventional: boolean;
  fleet?: string;
  radioId?: string;
  isScrap: boolean;
  scrapJobNumber?: string;
  dateScrapped?: string;
  remarks?: string;
  mark?: string;
}

export interface ScrapRadioDto {
  scrapJobNumber: string;
  dateScrapped: string;
  remarks?: string;
}

// ==========================================
// Unified Radio API
// ==========================================

export const radioApi = {
  // category = "Internal" | "Contractor" | "Unit" | "LegacyScrap" | null (for all)
  getAll: (category?: string, isScrap: boolean = false) => {
    return api.get<{ data: RadioDto[]; message: string }>("/api/radios", {
      params: { category, isScrap },
    });
  },

  getById: (id: number) => {
    return api.get<{ data: RadioDto; message: string }>(`/api/radios/${id}`);
  },

  create: (data: CreateRadioDto) => {
    return api.post<{ data: RadioDto; message: string }>("/api/radios", data);
  },

  update: (id: number, data: Partial<CreateRadioDto>) => {
    return api.put<{ data: RadioDto; message: string }>(`/api/radios/${id}`, data);
  },

  delete: (id: number) => {
    return api.delete(`/api/radios/${id}`);
  },

  deleteAll: () => {
    return api.delete(`/api/radios/all`);
  },

  scrapRadio: (id: number, data: ScrapRadioDto) => {
    return api.post<{ data: RadioDto; message: string }>(`/api/radios/${id}/scrap`, data);
  },

  // Import endpoints
  importInternal: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiLongRunning.post<{ message: string }>("/api/radios/import/internal", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  importContractor: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiLongRunning.post<{ message: string }>("/api/radios/import/contractor", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  importUnit: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiLongRunning.post<{ message: string }>("/api/radios/import/unit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  importScrap: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiLongRunning.post<{ message: string }>("/api/radios/import/scrap", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getHistory: (id: number) => {
    return api.get<{ data: RadioHistoryDto[]; message: string }>(`/api/radios/${id}/history`);
  },
};
