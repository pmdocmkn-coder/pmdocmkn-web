import { api, apiLongRunning } from "./api";

// ── Pagination types ──────────────────────────────────────────────────────────
export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PagedResult<T> {
  data: T[];
  meta: {
    pagination: PaginationInfo;
  };
}

// ── Radio query params ────────────────────────────────────────────────────────
export interface RadioQueryParams {
  category?: string;
  isScrap?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
  division?: string;
  department?: string;
  type?: string;
  fleet?: string;
  jenis?: string;       // "trunking" | "konvensional"
  isDuplicate?: boolean;
  isNoGrafir?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

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

export interface DuplicateSnItemDto {
  id: number;
  category: string;
  nomorAset?: string;
  nomorUnit?: string;
  nomorLv?: string;
  company?: string;
  division?: string;
  department?: string;
}

export interface DuplicateSnDto {
  serialNumber: string;
  count: number;
  occurrences: DuplicateSnItemDto[];
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
  // Paged — dipakai tabel utama
  getAll: (params: RadioQueryParams) => {
    console.log("📤 Request params:", params);
    return api.get<any>("/api/radios", { params });
  },

  // Unpaged — dipakai untuk matching (Fleet Statistics) dan dropdown options
  getAllUnpaged: async (category?: string, isScrap: boolean = false): Promise<{ data: { data: RadioDto[] } }> => {
    try {
      const res = await api.get<any>("/api/radios/all", { params: { category, isScrap } });
      // Response: { statusCode, message, data: [...] }
      const items: RadioDto[] = Array.isArray(res.data?.data) ? res.data.data : [];
      return { data: { data: items } };
    } catch {
      // Fallback: pakai /api/radios dengan pageSize besar
      try {
        const res = await api.get<any>("/api/radios", { params: { category, isScrap, pageSize: 9999, page: 1 } });
        // Response: { statusCode, message, data: [...], meta: {...} }
        const items: RadioDto[] = Array.isArray(res.data?.data) ? res.data.data : [];
        return { data: { data: items } };
      } catch {
        return { data: { data: [] } };
      }
    }
  },

  getById: (id: number) => {
    return api.get<{ data: RadioDto; message: string }>(`/api/radios/${id}`);
  },

  getDuplicateSns: () => {
    return api.get<{ data: DuplicateSnDto[]; message: string }>("/api/radios/duplicate-sns");
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

  deleteAllKpc: () => {
    return api.delete(`/api/radios/all/kpc`);
  },

  deleteAllKontraktor: () => {
    return api.delete(`/api/radios/all/kontraktor`);
  },

  deleteAllUnit: () => {
    return api.delete(`/api/radios/all/unit`);
  },

  deleteAllScrap: () => {
    return api.delete(`/api/radios/all/scrap`);
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
