// Letter Number Types
export interface LetterNumber {
    id: number;
    formattedNumber: string;
    sequenceNumber: number;
    year: number;
    month: number;
    letterDate: string;
    subject: string;
    recipient: string;
    attachmentUrl?: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
    documentType?: DocumentTypeInfo;
    company?: CompanyInfo;
    createdByUser?: UserInfo;
    updatedByUser?: UserInfo;
}

export interface LetterNumberList {
    id: number;
    formattedNumber: string;
    letterDate: string;
    subject: string;
    recipient: string;
    status: string;
    documentTypeCode: string;
    companyCode: string;
    createdByName?: string;
}

export interface LetterNumberCreate {
    companyId: number;
    documentTypeId: number;
    letterDate: string;
    subject: string;
    recipient: string;
    attachmentUrl?: string;
    status: number; // 0=Draft, 1=Sent, 2=Archived
}

export interface LetterNumberUpdate {
    subject: string;
    recipient: string;
    attachmentUrl?: string;
    status: number;
}

export interface LetterNumberQuery {
    page?: number;
    pageSize?: number;
    documentTypeId?: number;
    companyId?: number;
    status?: number;
    year?: number;
    month?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
}

// Company Types
export interface Company {
    id: number;
    code: string;
    name: string;
    address?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
    createdByUser?: UserInfo;
    updatedByUser?: UserInfo;
}

export interface CompanyList {
    id: number;
    code: string;
    name: string;
    isActive: boolean;
}

export interface CompanyCreate {
    code: string;
    name: string;
    address?: string;
}

export interface CompanyUpdate {
    name: string;
    address?: string;
    isActive: boolean;
}

export interface CompanyQuery {
    page?: number;
    pageSize?: number;
    isActive?: boolean;
    search?: string;
}

// Document Type Types
export interface DocumentType {
    id: number;
    code: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
    createdByUser?: UserInfo;
    updatedByUser?: UserInfo;
}

export interface DocumentTypeList {
    id: number;
    code: string;
    name: string;
    description?: string;
    isActive: boolean;
}

export interface DocumentTypeCreate {
    code: string;
    name: string;
    description?: string;
}

export interface DocumentTypeUpdate {
    name: string;
    description?: string;
    isActive: boolean;
}

export interface DocumentTypeQuery {
    page?: number;
    pageSize?: number;
    isActive?: boolean;
    search?: string;
}

// Shared Types
export interface UserInfo {
    userId: number;
    username: string;
    fullName: string;
    email?: string;
    photoUrl?: string;
}

export interface CompanyInfo {
    id: number;
    code: string;
    name: string;
    isActive: boolean;
}

export interface DocumentTypeInfo {
    id: number;
    code: string;
    name: string;
    isActive: boolean;
}

// Pagination
export interface PaginationMeta {
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

export interface PagedResult<T> {
    data: T[];
    meta: PaginationMeta;
}

// API Response
export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

// Letter Status Enum
export enum LetterStatus {
    Draft = 0,
    Sent = 1,
    Archived = 2,
}

export const LetterStatusLabels = {
    [LetterStatus.Draft]: "Draft",
    [LetterStatus.Sent]: "Terkirim",
    [LetterStatus.Archived]: "Arsip",
};

export const LetterStatusColors = {
    [LetterStatus.Draft]: "bg-yellow-100 text-yellow-800",
    [LetterStatus.Sent]: "bg-green-100 text-green-800",
    [LetterStatus.Archived]: "bg-gray-100 text-gray-800",
};
