export interface KpiDocument {
    id: number;
    periodMonth: string;
    areaGroup: string;
    documentName: string;
    dataSource: string;
    groupTag?: string | null;
    dateReceived?: string | null;
    dateSubmittedToReviewer?: string | null;
    dateApproved?: string | null;
    dateSubmittedToRqm?: string | null;
    remarks?: string | null;
    remarksSubmittedToReviewer?: string | null;
    remarksApproved?: string | null;
    remarksSubmittedToRqm?: string | null;
    createdAt: string;
    updatedAt?: string | null;
    status: string;
}

export interface KpiDocumentQuery {
    page: number;
    pageSize: number;
    search?: string;
    periodMonth?: string;
    areaGroup?: string;
}

export interface CreateKpiDocumentDto {
    periodMonth: string;
    areaGroup: string;
    documentName: string;
    dataSource: string;
    groupTag?: string;
}

export interface UpdateKpiDocumentDto {
    areaGroup: string;
    documentName: string;
    dataSource: string;
    groupTag?: string;
    remarks?: string | null;
}

export interface UpdateKpiDocumentDatesDto {
    dateReceived?: string | null;
    dateSubmittedToReviewer?: string | null;
    dateApproved?: string | null;
    dateSubmittedToRqm?: string | null;
    remarks?: string | null;
    remarksSubmittedToReviewer?: string | null;
    remarksApproved?: string | null;
    remarksSubmittedToRqm?: string | null;
}
