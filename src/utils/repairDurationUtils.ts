import { differenceInDays } from "date-fns";

export function getWorkshopDays(openedAt: string, closedAt?: string | null): number {
  const start = new Date(openedAt);
  const end = closedAt ? new Date(closedAt) : new Date();
  return Math.max(0, differenceInDays(end, start));
}

export function formatWorkshopDuration(openedAt: string, closedAt?: string | null): string {
  const days = getWorkshopDays(openedAt, closedAt);
  if (days === 0) return "Hari ini";
  if (days === 1) return "1 hari";
  return `${days} hari`;
}

export function workshopDurationBadgeClass(days: number): string {
  if (days >= 7) return "bg-red-100 text-red-800 border-red-200";
  if (days >= 3) return "bg-amber-100 text-amber-900 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}
