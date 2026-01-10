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
  sites: SwrSiteYearlyDto[];
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

export interface SwrYearlyPivotDto {
  channelName: string;
  siteName: string;
  siteType: string;
  monthlyFpwr: Record<string, number | null>;
  monthlyVswr: Record<string, number | null>;
  expectedSwrMax: number;
  notes: Record<string, string>;
}

export interface SwrImportResultDto {
  success: boolean;          // ✅ NEW
  recordsCreated: number;     // ✅ Renamed from successfulInserts
  recordsUpdated: number;     // ✅ NEW
  channelsCreated: number;    // ✅ NEW
  errors: string[];
  message: string;            // ✅ Auto-generated from backend
}
