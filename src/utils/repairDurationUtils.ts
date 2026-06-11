import { differenceInDays, differenceInHours } from "date-fns";

export function getWorkshopDays(openedAt: string, closedAt?: string | null, firstInProgressAt?: string | null, workshopCompletedAt?: string | null): { days: number, hours: number } {
  // Jika radio belum pernah diprogres, hitung dari 0
  if (!firstInProgressAt) return { days: 0, hours: 0 };

  const start = new Date(firstInProgressAt.endsWith('Z') ? firstInProgressAt : firstInProgressAt + 'Z');
  const end = workshopCompletedAt ? new Date(workshopCompletedAt.endsWith('Z') ? workshopCompletedAt : workshopCompletedAt + 'Z') : new Date();
  
  const totalHours = Math.max(0, differenceInHours(end, start));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  return { days, hours };
}

export function formatWorkshopDuration(openedAt: string, closedAt?: string | null, firstInProgressAt?: string | null, workshopCompletedAt?: string | null): string {
  if (!firstInProgressAt) return "Belum diprogres";

  const { days, hours } = getWorkshopDays(openedAt, closedAt, firstInProgressAt, workshopCompletedAt);
  
  if (days === 0) {
    if (hours === 0) {
      const start = new Date(firstInProgressAt.endsWith('Z') ? firstInProgressAt : firstInProgressAt + 'Z');
      const end = workshopCompletedAt ? new Date(workshopCompletedAt.endsWith('Z') ? workshopCompletedAt : workshopCompletedAt + 'Z') : new Date();
      const mins = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));
      if (mins === 0) return "Baru mulai";
      return `Baru mulai (${mins} menit)`;
    }
    return `Hari ini (${hours} jam)`;
  }
  
  if (hours === 0) return `${days} hari`;
  return `${days} hari (${hours} jam)`;
}

export function workshopDurationBadgeClass(days: number): string {
  if (days >= 7) return "bg-red-100 text-red-800 border-red-200";
  if (days >= 3) return "bg-amber-100 text-amber-900 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}
