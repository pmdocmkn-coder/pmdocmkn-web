// Basic Shared Types
export interface PaginationMeta {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface PagedResult<T> {
    data: T[];
    meta: {
        pagination: PaginationMeta;
    };
}

export interface BaseQuery {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
}

export interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}

// ==========================================
// Radio Trunking Types
// ==========================================

export interface RadioTrunking {
    id: number;
    unitNumber: string;
    dept?: string;
    fleet?: string;
    radioId: string;
    serialNumber?: string;
    dateProgram?: string;
    radioType?: string;
    jobNumber?: string;
    status: string;
    initiator?: string;
    firmware?: string;
    channelApply?: string;
    grafirId?: number;
    createdAt: string;
    updatedAt?: string;
    grafirInfo?: RadioGrafirBasic;
}

export interface CreateRadioTrunkingDto {
    unitNumber: string;
    dept?: string;
    fleet?: string;
    radioId: string;
    serialNumber?: string;
    dateProgram?: string;
    radioType?: string;
    jobNumber?: string;
    status?: string;
    initiator?: string;
    firmware?: string;
    channelApply?: string;
    grafirId?: number;
}

export interface UpdateRadioTrunkingDto extends Partial<CreateRadioTrunkingDto> {
    notes?: string;
}

export interface RadioTrunkingQuery extends BaseQuery {
    status?: string;
    dept?: string;
    fleet?: string;
}

// ==========================================
// Radio Conventional Types
// ==========================================

export interface RadioConventional {
    id: number;
    unitNumber: string;
    radioId: string;
    serialNumber?: string;
    dept?: string;
    fleet?: string;
    radioType?: string;
    frequency?: string;
    status: string;
    grafirId?: number;
    createdAt: string;
    updatedAt?: string;
    grafirInfo?: RadioGrafirBasic;
}

export interface CreateRadioConventionalDto {
    unitNumber: string;
    radioId: string;
    serialNumber?: string;
    dept?: string;
    fleet?: string;
    radioType?: string;
    frequency?: string;
    status?: string;
    grafirId?: number;
}

export interface UpdateRadioConventionalDto extends Partial<CreateRadioConventionalDto> {
    notes?: string;
}

export interface RadioConventionalQuery extends BaseQuery {
    status?: string;
    dept?: string;
    fleet?: string;
}

// ==========================================
// Radio Grafir Types
// ==========================================

export interface RadioGrafir {
    id: number;
    noAsset: string;
    serialNumber: string;
    typeRadio?: string;
    div?: string;
    dept?: string;
    fleetId?: string;
    tanggal?: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
    trunkingCount: number;
    conventionalCount: number;
}

export interface RadioGrafirBasic {
    id: number;
    noAsset: string;
    serialNumber: string;
    typeRadio?: string;
    div?: string;
}

export interface CreateRadioGrafirDto {
    noAsset: string;
    serialNumber: string;
    typeRadio?: string;
    div?: string;
    dept?: string;
    fleetId?: string;
    tanggal?: string;
    status?: string;
}

export interface UpdateRadioGrafirDto extends Partial<CreateRadioGrafirDto> { }

export interface RadioGrafirQuery extends BaseQuery {
    status?: string;
    div?: string;
    dept?: string;
}

// ==========================================
// Radio Scrap Types
// ==========================================

export interface RadioScrap {
    id: number;
    scrapCategory: "Trunking" | "Conventional";
    typeRadio?: string;
    serialNumber?: string;
    jobNumber?: string;
    dateScrap: string;
    remarks?: string;
    sourceTrunkingId?: number;
    sourceConventionalId?: number;
    sourceGrafirId?: number;
    createdAt: string;
    sourceRadioId?: string;
    sourceUnitNumber?: string;
}

export interface CreateRadioScrapDto {
    scrapCategory: "Trunking" | "Conventional";
    typeRadio?: string;
    serialNumber?: string;
    jobNumber?: string;
    dateScrap: string;
    remarks?: string;
}

export interface ScrapFromRadioDto {
    jobNumber?: string;
    dateScrap: string;
    remarks?: string;
}

export interface RadioScrapQuery extends BaseQuery {
    scrapCategory?: string;
    year?: number;
    startDate?: string;
    endDate?: string;
}

// ==========================================
// History Types
// ==========================================

export interface RadioHistory {
    id: number;
    radioId: number;
    previousUnitNumber?: string;
    newUnitNumber?: string;
    previousDept?: string;
    newDept?: string;
    previousFleet?: string;
    newFleet?: string;
    changeType: string;
    notes?: string;
    changedAt: string;
    changedByName?: string;
}

// ==========================================
// Summary Types
// ==========================================

export interface ScrapCategorySummary {
    total: number;
    monthly: number[];
}

export interface YearlyScrapSummary {
    year: number;
    trunking: ScrapCategorySummary;
    conventional: ScrapCategorySummary;
    grandTotal: number;
}
