// ============================================
// BASE QUERY & PAGINATION (reuse from necSignal if shared)
// ============================================

export interface InternalLinkHistoryQueryDto {
    page?: number;
    pageSize?: number;
    search?: string;
    internalLinkId?: number;
    sortBy?: string;
    sortDir?: string;
    filtersJson?: string;
}

export interface PagedResult<T> {
    data: T[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

// ============================================
// LINK
// ============================================

export interface InternalLinkListDto {
    id: number;
    linkName: string;
    linkGroup?: string | null;
    direction?: number | string | null;
    directionString?: string | null;
    ipAddress?: string | null;
    device?: string | null;
    type?: string | null;
    usedFrequency?: string | null;
    rslNearEnd?: number | null;
    serviceType: number;
    serviceTypeString: string;
    isActive: boolean;
    historyCount: number;
}

export interface InternalLinkDetailDto extends InternalLinkListDto {
    createdAt: string;
}

export interface InternalLinkCreateDto {
    linkName: string;
    linkGroup?: string | null;
    direction?: string | null;
    ipAddress?: string | null;
    device?: string | null;
    type?: string | null;
    usedFrequency?: string | null;
    rslNearEnd?: number | null;
    serviceType?: string | null;
    isActive?: boolean;
}

export interface InternalLinkUpdateDto extends InternalLinkCreateDto {
    id: number;
}

// ============================================
// HISTORY
// ============================================

export interface InternalLinkHistoryItemDto {
    id: number;
    internalLinkId: number;
    linkName: string;
    date: string;
    rslNearEnd?: number | null;
    uptime?: number | null;
    notes?: string | null;
    hasScreenshot: boolean;
    status: number | string;
    statusString: string;
    no: number;
}

export interface InternalLinkHistoryDetailDto extends InternalLinkHistoryItemDto {
    screenshotBase64?: string | null;
}

export interface InternalLinkHistoryCreateDto {
    internalLinkId: number;
    date: string;
    rslNearEnd?: number | null;
    uptime?: number | null; // in days
    notes?: string | null;
    screenshotBase64?: string | null;
    status?: string | null;
}

export interface InternalLinkHistoryUpdateDto {
    date?: string;
    rslNearEnd?: number | null;
    uptime?: number | null; // in days
    notes?: string | null;
    screenshotBase64?: string | null;
    removeScreenshot?: boolean;
    status?: string | null;
}

// ============================================
// ENUMS (mirror backend)
// ============================================

export const SERVICE_TYPE_OPTIONS = [
    { value: "Internet", label: "Internet" },
    { value: "AudioCodesVoip", label: "Audio Codes / VoIP" },
    { value: "LocalLoop", label: "Local Loop" },
    { value: "CCTV", label: "CCTV" },
    { value: "LinkInternal", label: "Link Internal" },
];

export const STATUS_OPTIONS = [
    { value: "Active", label: "Active" },
    { value: "Dismantled", label: "Dismantled" },
    { value: "Removed", label: "Removed" },
    { value: "Obstacle", label: "Obstacle" },
];

export const LINK_TYPE_OPTIONS = [
    { value: "Main", label: "Main" },
    { value: "Backup", label: "Backup" },
    { value: "Last Mile", label: "Last Mile" },
];

export const DIRECTION_OPTIONS = [
    { value: "TX", label: "TX" },
    { value: "RX", label: "RX" },
];

export function getServiceTypeLabel(serviceType: number | string): string {
    const map: Record<string, string> = {
        "0": "Internet",
        "1": "Audio Codes / VoIP",
        "2": "Local Loop",
        "3": "CCTV",
        "4": "Link Internal",
        Internet: "Internet",
        AudioCodesVoip: "Audio Codes / VoIP",
        LocalLoop: "Local Loop",
        CCTV: "CCTV",
        LinkInternal: "Link Internal",
    };
    return map[String(serviceType)] || String(serviceType);
}

export function getStatusLabel(status: number | string): string {
    const map: Record<string, string> = {
        "0": "Active",
        "1": "Dismantled",
        "2": "Removed",
        "3": "Obstacle",
        Active: "Active",
        Dismantled: "Dismantled",
        Removed: "Removed",
        Obstacle: "Obstacle",
    };
    return map[String(status)] || String(status);
}

export function getStatusColor(status: number | string): string {
    const label = getStatusLabel(status);
    switch (label) {
        case "Active": return "text-emerald-400";
        case "Dismantled": return "text-amber-400";
        case "Removed": return "text-red-400";
        case "Obstacle": return "text-orange-400";
        default: return "text-gray-400";
    }
}

export function getStatusBgColor(status: number | string): string {
    const label = getStatusLabel(status);
    switch (label) {
        case "Active": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
        case "Dismantled": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
        case "Removed": return "bg-red-500/20 text-red-400 border-red-500/30";
        case "Obstacle": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
        default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
}

export function getLinkTypeBadgeClass(type: string | null | undefined): string {
    switch (type) {
        case "Main": return "bg-blue-100 text-blue-700 border border-blue-300";
        case "Backup": return "bg-gray-100 text-gray-600 border border-gray-300";
        case "Last Mile": return "bg-purple-100 text-purple-700 border border-purple-300";
        default: return "bg-gray-50 text-gray-400 border border-gray-200";
    }
}
