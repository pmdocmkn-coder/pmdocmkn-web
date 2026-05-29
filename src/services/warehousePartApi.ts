import { api } from "./api";
import { unwrapData, unwrapList, unwrapPaged } from "../utils/apiResponse";

export interface WarehousePartCatalogItem {
  id: number;
  partCode: string;
  partName: string;
  ownerId?: string | null;
  category?: string | null;
  unit?: string | null;
  description?: string | null;
}

export const warehousePartApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get("/api/warehouse-part-catalog", { params }).then((r) => unwrapPaged<WarehousePartCatalogItem>(r)),

  search: (query?: string, limit = 10) =>
    api.get("/api/warehouse-part-catalog/search", { params: { query, limit } }).then((r) => unwrapList<WarehousePartCatalogItem>(r)),

  import: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/warehouse-part-catalog/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => unwrapData<{ importedCount: number; updatedCount: number; message: string }>(r)!);
  },

  create: (data: Omit<WarehousePartCatalogItem, "id">) => 
    api.post("/api/warehouse-part-catalog", data).then((r) => unwrapData<WarehousePartCatalogItem>(r)),

  update: (id: number, data: Omit<WarehousePartCatalogItem, "id">) => 
    api.put(`/api/warehouse-part-catalog/${id}`, data).then((r) => unwrapData<WarehousePartCatalogItem>(r)),

  delete: (id: number) => api.delete(`/api/warehouse-part-catalog/${id}`).then(unwrapData),
  deleteAll: () => api.delete('/api/warehouse-part-catalog/all').then(unwrapData),
};
