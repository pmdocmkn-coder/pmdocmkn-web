export interface PmSiteDto {
  id: number;
  name: string;
  orderIndex: number;
}

export interface PmScheduleTaskDto {
  id?: number;
  month: number; // 1-12
  week: number;  // 1-4
  isCompleted?: boolean;
  completedAt?: string;
  completedByUserId?: number;
  completedByUserName?: string;
  remarks?: string;
}

export interface PmTaskToggleDto {
  remarks?: string;
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

export interface PmTrendDto {
  monthName: string;
  year: number;
  month: number;
  completed: number;
  overdue: number;
  compliancePercentage: number;
}

export interface PmCurrentMonthDto {
  totalScheduled: number;
  completed: number;
  overdue: number;
  progressPercentage: number;
}

export interface PmComplianceDashboardDto {
  totalScheduled: number;
  totalCompleted: number;
  totalOverdue: number;
  compliancePercentage: number;
  trend6Months: PmTrendDto[];
  currentMonth: PmCurrentMonthDto;
}
