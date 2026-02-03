// types/callRecord.ts - FIXED VERSION

export interface CallRecord {
  callRecordId: number;
  callTime: string;
  callCloseReason: number;
  closeReasonDescription: string;
  hourGroup: number;
  createdAt: string;
}

export interface DailySummary {
  date: string;
  hourlyData: HourlySummary[];
  totalQty: number;
  totalTEBusy: number;
  totalSysBusy: number;
  totalOthers: number;
  avgTEBusyPercent: number;
  avgSysBusyPercent: number;
  avgOthersPercent: number;
}

export interface HourlySummary {
  date: string;
  hourGroup: number;
  timeRange: string;
  qty: number;
  teBusy: number;
  teBusyPercent: number;
  sysBusy: number;
  sysBusyPercent: number;
  others: number;
  othersPercent: number;
}

// ✅ FIXED: Match backend ImportResult
export interface ImportResult {
  successfulRecords: number;
  failedRecords: number;
  errors: string[];
}

// ✅ FIXED: Match backend upload response
export interface UploadCsvResponse {
  records: ImportResult;
  totalTimeMs: number;
}

// ✅ FIXED: Match actual backend response structure
export interface CallRecordsResponse {
  statusCode: number;
  message: string;
  data: CallRecord[]; // ✅ Direct array, not nested object
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  };
}

export enum FleetStatisticType {
  All = "All",
  Caller = "Caller",
  Called = "Called",
}

// New: Detail DTO for unique callers (used in detail popup)
export interface UniqueCallerDetailDto {
  callerFleet: string;
  callCount: number;
  totalDurationSeconds: number;
  totalDurationFormatted: string;
}

// New: Detail DTO for unique called fleets (used in detail popup)
export interface UniqueCalledDetailDto {
  calledFleet: string;
  callCount: number;
  totalDurationSeconds: number;
  totalDurationFormatted: string;
}

export interface TopCallerFleetDto {
  rank: number;
  callerFleet: string;
  totalCalls: number;
  totalDurationSeconds: number;
  totalDurationFormatted: string;
  averageDurationSeconds: number;
  averageDurationFormatted: string;
  uniqueCalledFleets: number; // New: how many fleets this caller called
}

export interface TopCalledFleetDto {
  rank: number;
  calledFleet: string;
  totalCalls: number;
  totalDurationSeconds: number;
  totalDurationFormatted: string;
  averageDurationSeconds: number;
  averageDurationFormatted: string;
  uniqueCallers: number;
}

export interface FleetStatisticsDto {
  date: string;
  topCallers: TopCallerFleetDto[];
  topCalledFleets: TopCalledFleetDto[];
  totalCallsInDay: number;
  totalDurationInDaySeconds: number;
  totalDurationInDayFormatted: string;
  totalUniqueCallers: number;
  totalUniqueCalledFleets: number;
}

