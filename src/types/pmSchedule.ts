export interface PmSiteDto {
  id: number;
  name: string;
  orderIndex: number;
}

export interface PmScheduleTaskDto {
  month: number; // 1-12
  week: number;  // 1-4
}

export interface PmDeviceScheduleDto {
  scheduleId: number;
  deviceName: string;
  tasks: PmScheduleTaskDto[];
}

export interface PmSiteScheduleDto {
  siteId: number;
  siteName: string;
  orderIndex: number;
  devices: PmDeviceScheduleDto[];
}

export interface PmYearlyScheduleResponseDto {
  year: number;
  sites: PmSiteScheduleDto[];
}

export interface PmScheduleUpsertDto {
  year: number;
  pmSiteId: number;
  deviceName: string;
  tasks: PmScheduleTaskDto[];
}
