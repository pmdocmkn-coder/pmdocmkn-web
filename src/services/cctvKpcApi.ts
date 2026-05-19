import { api } from "./api";

// ── Pagination types ──────────────────────────────────────────────────────────
export interface CctvKpcDto {
  id: number;
  severity: string;       // "Low" | "Medium" | "High"
  camera: string;
  ipCamera?: string;
  model?: string;
  brand?: string;
  explicitLocation?: string;
  fotoKoordinat?: string;
  remarks?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCctvKpcDto {
  severity: string;
  camera: string;
  ipCamera?: string;
  model?: string;
  brand?: string;
  explicitLocation?: string;
  fotoKoordinat?: string;
  remarks?: string;
  isActive: boolean;
}

export interface CctvKpcQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  severity?: string;
  brand?: string;
  isActive?: boolean;
}

// ==========================================
// CCTV KPC API
// ==========================================
export const cctvKpcApi = {
  getAll: (params: CctvKpcQueryParams) =>
    api.get<any>("/api/cctv-kpc", { params }),

  getAllUnpaged: () =>
    api.get<any>("/api/cctv-kpc/all"),

  getById: (id: number) =>
    api.get<any>(`/api/cctv-kpc/${id}`),

  create: (data: CreateCctvKpcDto) =>
    api.post<any>("/api/cctv-kpc", data),

  update: (id: number, data: CreateCctvKpcDto) =>
    api.put<any>(`/api/cctv-kpc/${id}`, data),

  delete: (id: number) =>
    api.delete(`/api/cctv-kpc/${id}`),

  deleteAll: () =>
    api.delete("/api/cctv-kpc/all"),
};
