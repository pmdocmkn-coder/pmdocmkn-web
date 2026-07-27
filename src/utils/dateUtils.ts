// src/utils/dateUtils.ts - FIXED VERSION WITH MANUAL OFFSET
import { format } from "date-fns";
import { id } from "date-fns/locale";

/**
 * Convert UTC date string to WITA timezone (UTC+8)
 * Fix: Ensure dateString is parsed as UTC by appending 'Z' if missing,
 * then let the browser's built-in timezone (WITA) handle the display.
 * No manual +8 hours needed — browser already does this via getHours(), etc.
 */
export const convertUTCtoWITA = (
  dateString: string | undefined | null
): Date | null => {
  if (!dateString) return null;

  try {
    // Normalize: ensure the date string is treated as UTC
    let normalized = dateString;
    if (!dateString.endsWith("Z") && !/[+-]\d{2}(:\d{2})?$/.test(dateString)) {
      normalized = dateString + "Z";
    }

    const date = new Date(normalized);
    if (isNaN(date.getTime())) return null;

    // Browser in WITA (UTC+8) will automatically convert via getHours(), etc.
    return date;
  } catch {
    return null;
  }
};

/**
 * Format Indonesian style with "pukul"
 * Example: "21 November 2025 pukul 14:25 WITA"
 */
export const formatDateTimeIndonesian = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return "Belum pernah login";

  try {
    const witaDate = convertUTCtoWITA(dateString);
    if (!witaDate) return "Invalid date";

    // ✅ Manual formatting untuk kontrol penuh
    const day = witaDate.getDate();
    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const month = monthNames[witaDate.getMonth()];
    const year = witaDate.getFullYear();
    const hours = String(witaDate.getHours()).padStart(2, "0");
    const minutes = String(witaDate.getMinutes()).padStart(2, "0");

    return `${day} ${month} ${year} pukul ${hours}.${minutes} WITA`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

/**
 * Format date to Indonesian locale (WITA timezone)
 */
export const formatWIBDate = (
  dateString: string | undefined | null,
  formatStr: string = "dd MMM yyyy",
  includeTime: boolean = false
): string => {
  const witaDate = convertUTCtoWITA(dateString);
  if (!witaDate) return "-";

  try {
    const finalFormat = includeTime ? `${formatStr} HH:mm` : formatStr;
    return format(witaDate, finalFormat, { locale: id });
  } catch {
    return "-";
  }
};

// ========================================
// DATE ONLY FORMATS (Tanpa Jam)
// ========================================

export const formatTableDate = (
  dateString: string | undefined | null
): string => {
  return formatWIBDate(dateString, "dd/MM/yyyy");
};

export const formatDetailDate = (
  dateString: string | undefined | null
): string => {
  return formatWIBDate(dateString, "dd MMMM yyyy");
};

export const formatCompactDate = (
  dateString: string | undefined | null
): string => {
  return formatWIBDate(dateString, "dd MMM yyyy");
};

// ========================================
// WITH TIME FORMATS (Dengan Jam)
// ========================================

export const formatDateTime = (
  dateString: string | undefined | null
): string => {
  return formatWIBDate(dateString, "dd MMM yyyy", true);
};

export const formatDateTimeWithSeconds = (
  dateString: string | undefined | null
): string => {
  const witaDate = convertUTCtoWITA(dateString);
  if (!witaDate) return "-";

  try {
    return format(witaDate, "dd MMM yyyy HH:mm:ss", { locale: id });
  } catch {
    return "-";
  }
};

export const formatDateTime12Hour = (
  dateString: string | undefined | null
): string => {
  const witaDate = convertUTCtoWITA(dateString);
  if (!witaDate) return "-";

  try {
    return format(witaDate, "dd MMM yyyy hh:mm a", { locale: id });
  } catch {
    return "-";
  }
};

export const formatAuditDateTime = (
  dateString: string | undefined | null
): string => {
  const witaDate = convertUTCtoWITA(dateString);
  if (!witaDate) return "-";

  try {
    const formatted = format(witaDate, "dd MMMM yyyy, HH:mm:ss", {
      locale: id,
    });
    return `${formatted} WITA`;
  } catch {
    return "-";
  }
};

export const formatTableDateTime = (
  dateString: string | undefined | null
): string => {
  const witaDate = convertUTCtoWITA(dateString);
  if (!witaDate) return "-";

  try {
    return format(witaDate, "dd/MM/yy HH:mm", { locale: id });
  } catch {
    return "-";
  }
};

export const formatRelativeTime = (
  dateString: string | undefined | null
): string => {
  const witaDate = convertUTCtoWITA(dateString);
  if (!witaDate) return "-";

  try {
    const now = new Date();
    const nowWita = convertUTCtoWITA(now.toISOString());
    if (!nowWita) return "-";

    const diffMs = nowWita.getTime() - witaDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return "Baru saja";
    if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;

    return formatCompactDate(dateString);
  } catch {
    return "-";
  }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

export const getCurrentWITADate = (): Date => {
  const now = new Date();
  return convertUTCtoWITA(now.toISOString()) || now;
};

export const formatForInput = (
  dateString: string | undefined | null
): string => {
  const witaDate = convertUTCtoWITA(dateString);
  if (!witaDate) return "";

  try {
    return format(witaDate, "yyyy-MM-dd");
  } catch {
    return "";
  }
};

export const isToday = (dateString: string | undefined | null): boolean => {
  const witaDate = convertUTCtoWITA(dateString);
  if (!witaDate) return false;

  const today = getCurrentWITADate();
  return witaDate.toDateString() === today.toDateString();
};

export const formatSmartDateTime = (
  dateString: string | undefined | null
): string => {
  if (isToday(dateString)) {
    return formatRelativeTime(dateString);
  }
  return formatDateTime(dateString);
};
