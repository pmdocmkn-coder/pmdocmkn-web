import { api } from "./api";
import {
    GatepassList,
    GatepassResponse,
    GatepassCreate,
    GatepassUpdate,
    GatepassQuery,
    QuotationList,
    QuotationResponse,
    QuotationCreate,
    QuotationUpdate,
    QuotationQuery,
} from "../types/gatepassQuotation";
import { PagedResult } from "../types/letterNumber";

// ============================================
// GATEPASS API
// ============================================

export const gatepassApi = {
    getAll: async (query: GatepassQuery = {}): Promise<PagedResult<GatepassList>> => {
        const params = new URLSearchParams();
        if (query.page) params.append("page", query.page.toString());
        if (query.pageSize) params.append("pageSize", query.pageSize.toString());
        if (query.status !== undefined) params.append("status", query.status.toString());
        if (query.year) params.append("year", query.year.toString());
        if (query.search) params.append("search", query.search);

        const response = await api.get(`/api/gatepasses?${params.toString()}`);
        return response.data;
    },

    getById: async (id: number): Promise<GatepassResponse> => {
        const response = await api.get(`/api/gatepasses/${id}`);
        return response.data.data;
    },

    create: async (data: GatepassCreate): Promise<GatepassResponse> => {
        const response = await api.post("/api/gatepasses", data);
        return response.data.data;
    },

    update: async (id: number, data: GatepassUpdate): Promise<GatepassResponse> => {
        const response = await api.put(`/api/gatepasses/${id}`, data);
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/gatepasses/${id}`);
    },
};

// ============================================
// QUOTATION API
// ============================================

export const quotationApi = {
    getAll: async (query: QuotationQuery = {}): Promise<PagedResult<QuotationList>> => {
        const params = new URLSearchParams();
        if (query.page) params.append("page", query.page.toString());
        if (query.pageSize) params.append("pageSize", query.pageSize.toString());
        if (query.status !== undefined) params.append("status", query.status.toString());
        if (query.year) params.append("year", query.year.toString());
        if (query.customerId) params.append("customerId", query.customerId.toString());
        if (query.search) params.append("search", query.search);

        const response = await api.get(`/api/quotations?${params.toString()}`);
        return response.data;
    },

    getById: async (id: number): Promise<QuotationResponse> => {
        const response = await api.get(`/api/quotations/${id}`);
        return response.data.data;
    },

    create: async (data: QuotationCreate): Promise<QuotationResponse> => {
        const response = await api.post("/api/quotations", data);
        return response.data.data;
    },

    update: async (id: number, data: QuotationUpdate): Promise<QuotationResponse> => {
        const response = await api.put(`/api/quotations/${id}`, data);
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/quotations/${id}`);
    },
};
