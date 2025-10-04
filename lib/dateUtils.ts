// utils/dateUtils.ts
/**
 * Utility functions for date handling with proper timezone support
 */

/**
 * Get today's date in local timezone as YYYY-MM-DD format
 */
export const getTodayLocalDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format a date object to YYYY-MM-DD in local timezone
 */
export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if a given date is today in local timezone
 */
export const isToday = (date: Date): boolean => {
  return formatLocalDate(date) === getTodayLocalDate();
};

/**
 * Get current timestamp in ISO format (for server storage)
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Create a new date object set to today at 00:00:00 local time
 */
export const getTodayStart = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};