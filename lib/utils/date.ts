import { format, parseISO, addDays, addMonths, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

/**
 * Format a date for display
 */
export function formatDate(date: string | Date, formatStr: string = 'MMM d, yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Format a time for display
 */
export function formatTime(time: string | Date, formatStr: string = 'h:mm a'): string {
  const timeObj = typeof time === 'string' ? parseISO(`2000-01-01T${time}`) : time;
  return format(timeObj, formatStr);
}

/**
 * Format a full date-time for display
 */
export function formatDateTime(dateTime: string | Date, formatStr: string = 'MMM d, yyyy h:mm a'): string {
  const dateTimeObj = typeof dateTime === 'string' ? parseISO(dateTime) : dateTime;
  return format(dateTimeObj, formatStr);
}

/**
 * Calculate expiration date based on days from now
 */
export function calculateExpirationDate(days: number): Date {
  return addDays(new Date(), days);
}

/**
 * Calculate expiration date based on months from now
 */
export function calculateExpirationDateMonths(months: number): Date {
  return addMonths(new Date(), months);
}

/**
 * Check if a date is expired
 */
export function isExpired(expirationDate: string | Date | null): boolean {
  if (!expirationDate) return false;
  const expDate = typeof expirationDate === 'string' ? parseISO(expirationDate) : expirationDate;
  return isBefore(expDate, new Date());
}

/**
 * Check if a date is within N days from now
 */
export function isWithinDays(date: string | Date, days: number): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const futureDate = addDays(new Date(), days);
  return isBefore(dateObj, futureDate) && isAfter(dateObj, new Date());
}

/**
 * Get start of today
 */
export function getStartOfToday(): Date {
  return startOfDay(new Date());
}

/**
 * Get end of today
 */
export function getEndOfToday(): Date {
  return endOfDay(new Date());
}

/**
 * Convert time string (HH:mm) to Date object for today
 */
export function timeStringToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Get day of week number from date (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * Check if student can check in (1 hour before class until class ends)
 */
export function canCheckIn(scheduledAt: string | Date, durationMinutes: number): boolean {
  const classStart = typeof scheduledAt === 'string' ? parseISO(scheduledAt) : scheduledAt;
  const classEnd = addDays(classStart, durationMinutes / (24 * 60)); // Convert minutes to days
  const oneHourBefore = addDays(classStart, -1 / 24); // 1 hour before
  const now = new Date();

  return isAfter(now, oneHourBefore) && isBefore(now, classEnd);
}
