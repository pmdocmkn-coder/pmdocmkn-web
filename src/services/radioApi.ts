import { api, apiLongRunning } from "./api";
import {
    RadioTrunking, RadioTrunkingQuery, CreateRadioTrunkingDto, UpdateRadioTrunkingDto,
    RadioConventional, RadioConventionalQuery, CreateRadioConventionalDto, UpdateRadioConventionalDto,
    RadioGrafir, RadioGrafirQuery, CreateRadioGrafirDto, UpdateRadioGrafirDto,
    RadioScrap, RadioScrapQuery, CreateRadioScrapDto, ScrapFromRadioDto,
    RadioHistory, YearlyScrapSummary, PagedResult, ImportResult
} from "../types/radio";

// ==========================================
// Radio Trunking API
// ==========================================

export const radioTrunkingApi = {
    getAll: (params: RadioTrunkingQuery) => {
        return api.get<PagedResult<RadioTrunking>>("/api/radio-trunking", { params });
    },

    getById: (id: number) => {
        return api.get<RadioTrunking>(`/api/radio-trunking/${id}`);
    },

    create: (data: CreateRadioTrunkingDto) => {
        return api.post<RadioTrunking>("/api/radio-trunking", data);
    },

    update: (id: number, data: UpdateRadioTrunkingDto) => {
        return api.put<RadioTrunking>(`/api/radio-trunking/${id}`, data);
    },

    delete: (id: number) => {
        return api.delete(`/api/radio-trunking/${id}`);
    },

    getHistory: (id: number) => {
        return api.get<RadioHistory[]>(`/api/radio-trunking/${id}/history`);
    },

    exportCsv: (params: RadioTrunkingQuery) => {
        return api.get("/api/radio-trunking/export", {
            params,
            responseType: "blob"
        });
    },

    importCsv: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiLongRunning.post<ImportResult>("/api/radio-trunking/import", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    getTemplate: () => {
        return api.get("/api/radio-trunking/template", { responseType: "blob" });
    }
};

// ==========================================
// Radio Conventional API
// ==========================================

export const radioConventionalApi = {
    getAll: (params: RadioConventionalQuery) => {
        return api.get<PagedResult<RadioConventional>>("/api/radio-conventional", { params });
    },

    getById: (id: number) => {
        return api.get<RadioConventional>(`/api/radio-conventional/${id}`);
    },

    create: (data: CreateRadioConventionalDto) => {
        return api.post<RadioConventional>("/api/radio-conventional", data);
    },

    update: (id: number, data: UpdateRadioConventionalDto) => {
        return api.put<RadioConventional>(`/api/radio-conventional/${id}`, data);
    },

    delete: (id: number) => {
        return api.delete(`/api/radio-conventional/${id}`);
    },

    getHistory: (id: number) => {
        return api.get<RadioHistory[]>(`/api/radio-conventional/${id}/history`);
    },

    exportCsv: (params: RadioConventionalQuery) => {
        return api.get("/api/radio-conventional/export", {
            params,
            responseType: "blob"
        });
    },

    importCsv: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiLongRunning.post<ImportResult>("/api/radio-conventional/import", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    getTemplate: () => {
        return api.get("/api/radio-conventional/template", { responseType: "blob" });
    }
};

// ==========================================
// Radio Grafir API
// ==========================================

export const radioGrafirApi = {
    getAll: (params: RadioGrafirQuery) => {
        return api.get<PagedResult<RadioGrafir>>("/api/radio-grafir", { params });
    },

    getById: (id: number) => {
        return api.get<RadioGrafir>(`/api/radio-grafir/${id}`);
    },

    create: (data: CreateRadioGrafirDto) => {
        return api.post<RadioGrafir>("/api/radio-grafir", data);
    },

    update: (id: number, data: UpdateRadioGrafirDto) => {
        return api.put<RadioGrafir>(`/api/radio-grafir/${id}`, data);
    },

    delete: (id: number) => {
        return api.delete(`/api/radio-grafir/${id}`);
    },

    getLinkedTrunking: (id: number) => {
        return api.get<RadioTrunking | null>(`/api/radio-grafir/${id}/trunking`);
    },

    getLinkedConventional: (id: number) => {
        return api.get<RadioConventional | null>(`/api/radio-grafir/${id}/conventional`);
    },

    exportCsv: (params: RadioGrafirQuery) => {
        return api.get("/api/radio-grafir/export", {
            params,
            responseType: "blob"
        });
    },

    importCsv: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiLongRunning.post<ImportResult>("/api/radio-grafir/import", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    getTemplate: () => {
        return api.get("/api/radio-grafir/template", { responseType: "blob" });
    }
};

// ==========================================
// Radio Scrap API
// ==========================================

export const radioScrapApi = {
    getAll: (params: RadioScrapQuery) => {
        return api.get<PagedResult<RadioScrap>>("/api/radio-scrap", { params });
    },

    getById: (id: number) => {
        return api.get<RadioScrap>(`/api/radio-scrap/${id}`);
    },

    create: (data: CreateRadioScrapDto) => {
        return api.post<RadioScrap>("/api/radio-scrap", data);
    },

    scrapFromTrunking: (id: number, data: ScrapFromRadioDto) => {
        return api.post<RadioScrap>(`/api/radio-scrap/from-trunking/${id}`, data);
    },

    scrapFromConventional: (id: number, data: ScrapFromRadioDto) => {
        return api.post<RadioScrap>(`/api/radio-scrap/from-conventional/${id}`, data);
    },

    update: (id: number, data: CreateRadioScrapDto) => {
        return api.put<RadioScrap>(`/api/radio-scrap/${id}`, data);
    },

    delete: (id: number) => {
        return api.delete(`/api/radio-scrap/${id}`);
    },

    getYearlySummary: (year?: number) => {
        return api.get<YearlyScrapSummary>("/api/radio-scrap/yearly-summary", { params: { year } });
    },

    exportCsv: (params: RadioScrapQuery) => {
        return api.get("/api/radio-scrap/export", {
            params,
            responseType: "blob"
        });
    }
};
