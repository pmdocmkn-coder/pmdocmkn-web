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

export function getActiveWorkshopDays(accumulatedMinutes: number, currentProgressStartedAt: string | null | undefined): { days: number, hours: number, minutes: number } {
  let totalMinutes = Number(accumulatedMinutes) || 0;

  if (currentProgressStartedAt) {
    const start = new Date(currentProgressStartedAt.endsWith('Z') ? currentProgressStartedAt : currentProgressStartedAt + 'Z');
    const now = new Date();
    const activeMinutes = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60000));
    totalMinutes += activeMinutes;
  }

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes };
}

export function formatActiveWorkshopDuration(
  status: string,
  accumulatedMinutes: number, 
  currentProgressStartedAt: string | null | undefined, 
  firstInProgressAt?: string | null
): string {
  if (!firstInProgressAt) return "Belum diprogres";

  // Jika status bukan Progress, dan waktu juga 0, tapi sudah pernah diprogres 
  // (misalnya karena reset saat kembali ke InProgress) - kita tetap hitung totalnya
  const { days, hours, minutes } = getActiveWorkshopDays(accumulatedMinutes, currentProgressStartedAt);

  if (days === 0 && hours === 0 && minutes === 0 && status !== 'InProgress' && status !== 'Monitoring') {
      return "0 menit";
  }

  if (days === 0) {
    if (hours === 0) {
      if (minutes === 0) return "Baru mulai";
      return `Baru mulai (${minutes} menit)`;
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
