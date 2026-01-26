import { api } from "./api";
import {
    LetterNumber,
    LetterNumberList,
    LetterNumberCreate,
    LetterNumberUpdate,
    LetterNumberQuery,
    Company,
    CompanyList,
    CompanyCreate,
    CompanyUpdate,
    CompanyQuery,
    DocumentType,
    DocumentTypeList,
    DocumentTypeCreate,
    DocumentTypeUpdate,
    DocumentTypeQuery,
    PagedResult,
    ApiResponse,
} from "../types/letterNumber";

// ============================================
// LETTER NUMBER API
// ============================================

export const letterNumberApi = {
    // Get all letter numbers with pagination
    getAll: async (query: LetterNumberQuery = {}): Promise<PagedResult<LetterNumberList>> => {
        const params = new URLSearchParams();
        if (query.page) params.append("page", query.page.toString());
        if (query.pageSize) params.append("pageSize", query.pageSize.toString());
        if (query.documentTypeId) params.append("documentTypeId", query.documentTypeId.toString());
        if (query.companyId) params.append("companyId", query.companyId.toString());
        if (query.status !== undefined) params.append("status", query.status.toString());
        if (query.year) params.append("year", query.year.toString());
        if (query.month) params.append("month", query.month.toString());
        if (query.startDate) params.append("startDate", query.startDate);
        if (query.endDate) params.append("endDate", query.endDate);
        if (query.search) params.append("search", query.search);

        const response = await api.get(`/api/letter-numbers?${params.toString()}`);
        return response.data; // Returns PagedResult directly
    },

    // Get letter number by ID
    getById: async (id: number): Promise<LetterNumber> => {
        const response = await api.get(`/api/letter-numbers/${id}`);
        return response.data.data;
    },

    // Create new letter number
    create: async (data: LetterNumberCreate): Promise<LetterNumber> => {
        const response = await api.post("/api/letter-numbers", data);
        return response.data.data;
    },

    // Update letter number
    update: async (id: number, data: LetterNumberUpdate): Promise<LetterNumber> => {
        const response = await api.put(`/api/letter-numbers/${id}`, data);
        return response.data.data;
    },

    // Delete letter number
    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/letter-numbers/${id}`);
    },
};

// ============================================
// COMPANY API
// ============================================

export const companyApi = {
    // Get all companies with pagination
    getAll: async (query: CompanyQuery = {}): Promise<PagedResult<CompanyList>> => {
        const params = new URLSearchParams();
        if (query.page) params.append("page", query.page.toString());
        if (query.pageSize) params.append("pageSize", query.pageSize.toString());
        if (query.isActive !== undefined) params.append("isActive", query.isActive.toString());
        if (query.search) params.append("search", query.search);

        const response = await api.get(`/api/companies?${params.toString()}`);
        return response.data; // Returns PagedResult directly
    },

    // Get company by ID
    getById: async (id: number): Promise<Company> => {
        const response = await api.get(`/api/companies/${id}`);
        return response.data.data;
    },

    // Create new company
    create: async (data: CompanyCreate): Promise<Company> => {
        const response = await api.post("/api/companies", data);
        return response.data.data;
    },

    // Update company
    update: async (id: number, data: CompanyUpdate): Promise<Company> => {
        const response = await api.put(`/api/companies/${id}`, data);
        return response.data.data;
    },

    // Delete company
    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/companies/${id}`);
    },
};

// ============================================
// DOCUMENT TYPE API
// ============================================

export const documentTypeApi = {
    // Get all document types with pagination
    getAll: async (query: DocumentTypeQuery = {}): Promise<PagedResult<DocumentTypeList>> => {
        const params = new URLSearchParams();
        if (query.page) params.append("page", query.page.toString());
        if (query.pageSize) params.append("pageSize", query.pageSize.toString());
        if (query.isActive !== undefined) params.append("isActive", query.isActive.toString());
        if (query.search) params.append("search", query.search);

        const response = await api.get(`/api/document-types?${params.toString()}`);
        return response.data; // Returns PagedResult directly
    },

    // Get document type by ID
    getById: async (id: number): Promise<DocumentType> => {
        const response = await api.get(`/api/document-types/${id}`);
        return response.data.data;
    },

    // Create new document type
    create: async (data: DocumentTypeCreate): Promise<DocumentType> => {
        const response = await api.post("/api/document-types", data);
        return response.data.data;
    },

    // Update document type
    update: async (id: number, data: DocumentTypeUpdate): Promise<DocumentType> => {
        const response = await api.put(`/api/document-types/${id}`, data);
        return response.data.data;
    },

    // Delete document type
    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/document-types/${id}`);
    },
};
