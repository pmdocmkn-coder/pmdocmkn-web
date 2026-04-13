import { api } from "./api";
import { PagedResultDto } from "../types/swr";
import { 
    KpiDocument, 
    KpiDocumentQuery, 
    CreateKpiDocumentDto, 
    UpdateKpiDocumentDto, 
    UpdateKpiDocumentDatesDto 
} from "../types/kpi";

export const kpiApi = {
    getAll: (params: KpiDocumentQuery) => {
        return api.get<PagedResultDto<KpiDocument>>("/api/kpi-documents", { params });
    },

    create: (data: CreateKpiDocumentDto) => {
        return api.post<KpiDocument>("/api/kpi-documents", data);
    },

    update: (id: number, data: UpdateKpiDocumentDto) => {
        return api.put<KpiDocument>(`/api/kpi-documents/${id}`, data);
    },

    updateDates: (id: number, data: UpdateKpiDocumentDatesDto) => {
        return api.patch<KpiDocument>(`/api/kpi-documents/${id}/dates`, data);
    },

    delete: (id: number) => {
        return api.delete(`/api/kpi-documents/${id}`);
    },

    cloneMonth: (sourceMonth: string, targetMonth: string) => {
        return api.post<KpiDocument[]>("/api/kpi-documents/clone", null, {
            params: { sourceMonth, targetMonth }
        });
    },

    deleteMonth: (targetMonth: string) => {
        return api.delete("/api/kpi-documents/clone", {
            params: { targetMonth }
        });
    },

    exportExcel: (periodMonth: string) => {
        return api.get("/api/kpi-documents/export", { 
            params: { periodMonth }, 
            responseType: 'blob' 
        });
    },

    importExcel: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return api.post("/api/kpi-documents/import", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
    }
};
