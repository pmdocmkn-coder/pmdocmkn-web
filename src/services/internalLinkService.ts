import {
    InternalLinkListDto,
    InternalLinkCreateDto,
    InternalLinkUpdateDto,
    InternalLinkHistoryItemDto,
    InternalLinkHistoryDetailDto,
    InternalLinkHistoryCreateDto,
    InternalLinkHistoryUpdateDto,
    InternalLinkHistoryQueryDto,
    PagedResult,
} from "../types/internalLink";
import { api } from "./api";

export const internalLinkApi = {
    // ============================================
    // CRUD LINK
    // ============================================

    getLinks: async (): Promise<InternalLinkListDto[]> => {
        const response = await api.get("/api/internal-link/links");
        return response.data.data;
    },

    getLinkById: async (id: number): Promise<InternalLinkListDto> => {
        const response = await api.get(`/api/internal-link/links/${id}`);
        return response.data.data;
    },

    createLink: async (dto: InternalLinkCreateDto): Promise<InternalLinkListDto> => {
        const response = await api.post("/api/internal-link/links", dto);
        return response.data.data;
    },

    updateLink: async (id: number, dto: InternalLinkUpdateDto): Promise<InternalLinkListDto> => {
        const response = await api.put(`/api/internal-link/links/${id}`, dto);
        return response.data.data;
    },

    deleteLink: async (id: number): Promise<void> => {
        await api.delete(`/api/internal-link/links/${id}`);
    },

    // ============================================
    // CRUD HISTORY
    // ============================================

    getHistories: async (
        query: InternalLinkHistoryQueryDto
    ): Promise<PagedResult<InternalLinkHistoryItemDto>> => {
        const response = await api.get("/api/internal-link/histories", {
            params: query,
        });

        let result: PagedResult<InternalLinkHistoryItemDto>;

        if (response.data.meta && response.data.meta.pagination) {
            const pagination = response.data.meta.pagination;
            result = {
                data: response.data.data || [],
                page: pagination.page || 1,
                pageSize: pagination.pageSize || 15,
                totalCount: pagination.totalCount || 0,
                totalPages: pagination.totalPages || 1,
                hasNext: pagination.hasNext || false,
                hasPrevious: pagination.hasPrevious || false,
            };
        } else {
            result = {
                data: response.data.data || [],
                page: response.data.page || 1,
                pageSize: response.data.pageSize || 15,
                totalCount: response.data.totalCount || 0,
                totalPages: response.data.totalPages || 1,
                hasNext: response.data.hasNext || false,
                hasPrevious: response.data.hasPrevious || false,
            };
        }

        return result;
    },

    getHistoryById: async (id: number): Promise<InternalLinkHistoryDetailDto> => {
        const response = await api.get(`/api/internal-link/histories/${id}`);
        return response.data.data;
    },

    createHistory: async (
        dto: InternalLinkHistoryCreateDto
    ): Promise<InternalLinkHistoryItemDto> => {
        const response = await api.post("/api/internal-link/histories", dto);
        return response.data.data;
    },

    updateHistory: async (
        id: number,
        dto: InternalLinkHistoryUpdateDto
    ): Promise<InternalLinkHistoryItemDto> => {
        const response = await api.put(`/api/internal-link/histories/${id}`, dto);
        return response.data.data;
    },

    deleteHistory: async (id: number): Promise<void> => {
        await api.delete(`/api/internal-link/histories/${id}`);
    },
};
