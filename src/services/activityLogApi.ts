import { api } from './api';
import { ActivityLog, ActivityLogQuery } from '../types/activityLog';

export const activityLogApi = {
    getLogs: async (params: ActivityLogQuery) => {
        // Strip empty/falsy optional params to avoid backend model binding errors
        const cleanParams: Record<string, any> = {
            page: params.page,
            pageSize: params.pageSize,
        };
        if (params.search) cleanParams.search = params.search;
        if (params.module) cleanParams.module = params.module;
        if (params.action) cleanParams.action = params.action;
        if (params.userId) cleanParams.userId = params.userId;
        if (params.startDate) cleanParams.startDate = params.startDate;
        if (params.endDate) cleanParams.endDate = params.endDate;

        console.log('📡 Fetching activity logs with params:', cleanParams);
        const response = await api.get('/api/activity-logs', { params: cleanParams });
        console.log('📊 Activity logs raw response:', response.data);

        // Response format: { statusCode, message, data: [...items], meta: { pagination: {...} } }
        const result = response.data;
        return {
            items: result.data || [],
            totalItems: result.meta?.pagination?.totalCount || 0,
            page: result.meta?.pagination?.page || 1,
            pageSize: result.meta?.pagination?.pageSize || 10,
        };
    },
};
