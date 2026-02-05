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
        return api.get<PagedResult<RadioTrunking>>("/radio-trunking", { params });
    },

    getById: (id: number) => {
        return api.get<RadioTrunking>(`/radio-trunking/${id}`);
    },

    create: (data: CreateRadioTrunkingDto) => {
        return api.post<RadioTrunking>("/radio-trunking", data);
    },

    update: (id: number, data: UpdateRadioTrunkingDto) => {
        return api.put<RadioTrunking>(`/radio-trunking/${id}`, data);
    },

    delete: (id: number) => {
        return api.delete(`/radio-trunking/${id}`);
    },

    getHistory: (id: number) => {
        return api.get<RadioHistory[]>(`/radio-trunking/${id}/history`);
    },

    exportCsv: (params: RadioTrunkingQuery) => {
        return api.get("/radio-trunking/export", {
            params,
            responseType: "blob"
        });
    },

    importCsv: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiLongRunning.post<ImportResult>("/radio-trunking/import", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    getTemplate: () => {
        return api.get("/radio-trunking/template", { responseType: "blob" });
    }
};

// ==========================================
// Radio Conventional API
// ==========================================

export const radioConventionalApi = {
    getAll: (params: RadioConventionalQuery) => {
        return api.get<PagedResult<RadioConventional>>("/radio-conventional", { params });
    },

    getById: (id: number) => {
        return api.get<RadioConventional>(`/radio-conventional/${id}`);
    },

    create: (data: CreateRadioConventionalDto) => {
        return api.post<RadioConventional>("/radio-conventional", data);
    },

    update: (id: number, data: UpdateRadioConventionalDto) => {
        return api.put<RadioConventional>(`/radio-conventional/${id}`, data);
    },

    delete: (id: number) => {
        return api.delete(`/radio-conventional/${id}`);
    },

    getHistory: (id: number) => {
        return api.get<RadioHistory[]>(`/radio-conventional/${id}/history`);
    },

    exportCsv: (params: RadioConventionalQuery) => {
        return api.get("/radio-conventional/export", {
            params,
            responseType: "blob"
        });
    },

    importCsv: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiLongRunning.post<ImportResult>("/radio-conventional/import", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    getTemplate: () => {
        return api.get("/radio-conventional/template", { responseType: "blob" });
    }
};

// ==========================================
// Radio Grafir API
// ==========================================

export const radioGrafirApi = {
    getAll: (params: RadioGrafirQuery) => {
        return api.get<PagedResult<RadioGrafir>>("/radio-grafir", { params });
    },

    getById: (id: number) => {
        return api.get<RadioGrafir>(`/radio-grafir/${id}`);
    },

    create: (data: CreateRadioGrafirDto) => {
        return api.post<RadioGrafir>("/radio-grafir", data);
    },

    update: (id: number, data: UpdateRadioGrafirDto) => {
        return api.put<RadioGrafir>(`/radio-grafir/${id}`, data);
    },

    delete: (id: number) => {
        return api.delete(`/radio-grafir/${id}`);
    },

    getLinkedTrunking: (id: number) => {
        return api.get<RadioTrunking[]>(`/radio-grafir/${id}/trunking`);
    },

    getLinkedConventional: (id: number) => {
        return api.get<RadioConventional[]>(`/radio-grafir/${id}/conventional`);
    },

    exportCsv: (params: RadioGrafirQuery) => {
        return api.get("/radio-grafir/export", {
            params,
            responseType: "blob"
        });
    },

    importCsv: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiLongRunning.post<ImportResult>("/radio-grafir/import", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    getTemplate: () => {
        return api.get("/radio-grafir/template", { responseType: "blob" });
    }
};

// ==========================================
// Radio Scrap API
// ==========================================

export const radioScrapApi = {
    getAll: (params: RadioScrapQuery) => {
        return api.get<PagedResult<RadioScrap>>("/radio-scrap", { params });
    },

    getById: (id: number) => {
        return api.get<RadioScrap>(`/radio-scrap/${id}`);
    },

    create: (data: CreateRadioScrapDto) => {
        return api.post<RadioScrap>("/radio-scrap", data);
    },

    scrapFromTrunking: (id: number, data: ScrapFromRadioDto) => {
        return api.post<RadioScrap>(`/radio-scrap/from-trunking/${id}`, data);
    },

    scrapFromConventional: (id: number, data: ScrapFromRadioDto) => {
        return api.post<RadioScrap>(`/radio-scrap/from-conventional/${id}`, data);
    },

    update: (id: number, data: CreateRadioScrapDto) => {
        return api.put<RadioScrap>(`/radio-scrap/${id}`, data);
    },

    delete: (id: number) => {
        return api.delete(`/radio-scrap/${id}`);
    },

    getYearlySummary: (year?: number) => {
        return api.get<YearlyScrapSummary>("/radio-scrap/yearly-summary", { params: { year } });
    },

    exportCsv: (params: RadioScrapQuery) => {
        return api.get("/radio-scrap/export", {
            params,
            responseType: "blob"
        });
    }
};
