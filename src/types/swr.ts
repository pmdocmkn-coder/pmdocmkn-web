// SWR Signal Types
export interface SwrSiteListDto {
  id: number;
  name: string;
  location?: string;
  type: string; // "Trunking" or "Conventional"
  channelCount: number;
}

export interface SwrSiteCreateDto {
  name: string;
  location?: string;
  type: string;
}

export interface SwrSiteUpdateDto {
  id: number;
  name: string;
  location?: string;
  type: string;
}

export interface SwrChannelListDto {
  id: number;
  channelName: string;
  swrSiteId: number;
  swrSiteName: string;
  swrSiteType: string;
  expectedSwrMax: number;
  expectedPwrMax: number | null;
}

export interface SwrChannelCreateDto {
  channelName: string;
  swrSiteId: number;
  expectedSwrMax: number;
  expectedPwrMax: number;
}

export interface SwrChannelUpdateDto {
  id: number;
  channelName: string;
  swrSiteId: number;
  expectedSwrMax: number;
  expectedPwrMax: number;
}

// HISTORIES
export interface SwrHistoryItemDto {
  id: number;
  swrChannelId: number;
  channelName: string;
  siteName: string;
  siteType: string;
  date: string; // ISO date string
  fpwr?: number | null;
  vswr: number;
  notes?: string;
  status: SwrOperationalStatus | string; // ✅ Support both number and string
  no?: number; // For table numbering
}

export interface SwrHistoryCreateDto {
  swrChannelId: number;
  date: string; // ISO date string
  fpwr?: number | null;
  vswr: number;
  notes?: string;
  status?: string; // "Active", "Dismantled", "Removed", "Obstacle"
}

export interface SwrHistoryUpdateDto {
  fpwr?: number | null;
  vswr: number;
  notes?: string;
  status?: string;
}

export interface SwrHistoryQueryDto {
  page: number;
  pageSize: number;
  swrChannelId?: number;
  swrSiteId?: number;
  siteType?: string;
  search?: string;
  sortBy?: string;
  sortDir?: string;
  filtersJson?: string;
}

export enum SwrOperationalStatus {
  Active = 0,
  Dismantled = 1,
  Removed = 2,
  Obstacle = 3
}

export interface SwrMonthlyHistoryResponseDto {
  period: string;
  data: SwrSiteMonthlyDto[];
}

export interface SwrSiteMonthlyDto {
  siteName: string;
  siteType: string;
  channels: SwrChannelMonthlyDto[];
}

export interface SwrChannelMonthlyDto {
  channelName: string;
  avgFpwr?: number;
  avgVswr: number;
  status: string; // "good" or "bad"
  warningMessage?: string;
}

export interface SwrYearlySummaryDto {
  year: number;
  sites?: SwrSiteYearlyDto[]; // ✅ Jadikan optional
}

export interface SwrSiteYearlyDto {
  siteName: string;
  siteType: string;
  channels: Record<string, SwrChannelYearlyDto>;
}

export interface SwrChannelYearlyDto {
  monthlyAvgFpwr: Record<string, number | null>;
  monthlyAvgVswr: Record<string, number>;
  yearlyAvgFpwr?: number;
  yearlyAvgVswr: number;
  warnings: string[];
}

// ✅ FIXED: Added historyIds field
export interface SwrYearlyPivotDto {
  channelName: string;
  siteName: string;
  siteType: string;
  monthlyFpwr: Record<string, number | null>;
  monthlyVswr: Record<string, number | null>;
  expectedSwrMax: number;
  notes?: Record<string, string>; // ✅ Jadikan optional
}

// ✅ FIXED: Aligned with backend response structure
export interface SwrImportResultDto {
  success: boolean;
  recordsCreated: number;
  recordsUpdated: number;
  channelsCreated: number;
  errors: string[];
  message: string;
}

export interface SwrNoteUpdateDto {
  channelName: string;
  siteName: string;
  year: number;
  month: string;
  note: string;
}

export interface YearlySummaryDto {
  year: number;
  totalChannels: number;
  totalDataPoints: number;
  averageVswr: number;
  goodPercentage: number;
  warningPercentage: number;
  criticalPercentage: number;
  noDataPercentage: number;
  monthlyAverages: Array<{
    month: string;
    avgVswr: number;
    goodCount: number;
    warningCount: number;
    criticalCount: number;
    noDataCount: number;
  }>;
  sitePerformance: Array<{
    siteName: string;
    siteType: string;
    totalChannels: number;
    avgVswr: number;
    goodPercentage: number;
    worstChannel: string;
    worstVswr: number;
    status: string;
  }>;
  channelPerformance: Array<{
    channelName: string;
    siteName: string;
    avgVswr: number;
    worstMonth: string;
    worstValue: number;
    status: string;
    trend: 'improving' | 'stable' | 'deteriorating';
  }>;
  alerts: Array<{
    type: 'critical' | 'warning' | 'info';
    message: string;
    channelName?: string;
    month?: string;
    value?: number;
  }>;
}

export interface MonthlyDataDto {
  month: string;
  year: number;
  sites: Array<{
    siteName: string;
    siteType: string;
    channels: Array<{
      channelName: string;
      vswr: number | null;
      fpwr: number | null;
      status: string;
      notes?: string;
    }>;
  }>;
}