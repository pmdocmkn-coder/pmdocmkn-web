export interface ActivityLog {
    id: number;
    module: string;
    entityId?: number;
    action: string;
    userId: number;
    description: string;
    timestamp: string;
    user?: {
        userId: number;
        fullName: string;
        username: string;
        role?: {
            roleId: number;
            roleName: string;
        };
    };
}

export interface ActivityLogQuery {
    page: number;
    pageSize: number;
    search?: string;
    module?: string;
    action?: string;
    userId?: number;
    startDate?: string; // ISO String
    endDate?: string;   // ISO String
}

export interface PagedResult<T> {
    items: T[];
    totalItems: number;
    page: number;
    limit: number;
}
