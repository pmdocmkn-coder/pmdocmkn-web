// Gatepass Types
export interface GatepassList {
    id: number;
    formattedNumber: string;
    gatepassDate: string;
    destination: string;
    picName: string;
    picContact?: string;
    status: string;
    itemCount: number;
    createdByName?: string;
}

export interface GatepassResponse {
    id: number;
    formattedNumber: string;
    sequenceNumber: number;
    year: number;
    month: number;
    gatepassDate: string;
    destination: string;
    picName: string;
    picContact?: string;
    signatureQRCode?: string;
    notes?: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
    items: GatepassItemResponse[];
    createdByUser?: UserInfo;
    updatedByUser?: UserInfo;
}

export interface GatepassItemResponse {
    id: number;
    itemName: string;
    quantity: number;
    unit: string;
    description?: string;
    serialNumber?: string;
}

export interface GatepassCreate {
    destination: string;
    picName: string;
    picContact?: string;
    gatepassDate: string;
    signatureQRCode?: string;
    notes?: string;
    status: number; // 0=Draft, 1=Sent
    items: GatepassItemCreate[];
}

export interface GatepassItemCreate {
    itemName: string;
    quantity: number;
    unit?: string;
    description?: string;
    serialNumber?: string;
}

export interface GatepassUpdate {
    destination: string;
    picName: string;
    picContact?: string;
    signatureQRCode?: string;
    notes?: string;
    status: number;
}

export interface GatepassQuery {
    page?: number;
    pageSize?: number;
    status?: number;
    year?: number;
    search?: string;
}

// Quotation Types
export interface QuotationList {
    id: number;
    formattedNumber: string;
    quotationDate: string;
    customerName: string;
    description: string;
    status: string;
    createdByName?: string;
}

export interface QuotationResponse {
    id: number;
    formattedNumber: string;
    sequenceNumber: number;
    year: number;
    month: number;
    quotationDate: string;
    customerId: number;
    customerName: string;
    description: string;
    notes?: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
    createdByUser?: UserInfo;
    updatedByUser?: UserInfo;
}

export interface QuotationCreate {
    customerId: number;
    description: string;
    quotationDate: string;
    notes?: string;
    status: number; // 0=Draft, 1=Sent
}

export interface QuotationUpdate {
    description: string;
    notes?: string;
    status: number;
}

export interface QuotationQuery {
    page?: number;
    pageSize?: number;
    status?: number;
    year?: number;
    customerId?: number;
    search?: string;
}

// Shared
export interface UserInfo {
    userId: number;
    username: string;
    fullName: string;
    email?: string;
    photoUrl?: string;
}

// Status helpers
export enum GatepassStatus {
    Draft = 0,
    Sent = 1,
}

export enum QuotationStatus {
    Draft = 0,
    Sent = 1,
}

export const StatusLabels: Record<number, string> = {
    0: "Draft",
    1: "Sent",
};

export const StatusColors: Record<string, string> = {
    Draft: "bg-yellow-100 text-yellow-800",
    Sent: "bg-green-100 text-green-800",
};
