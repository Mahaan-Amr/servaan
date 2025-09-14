import { formatCurrency as formatCurrencyUtil } from '../../shared/utils/currencyUtils';

/**
 * Format a date string to a human-readable Persian date format
 * 
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string in Persian format
 */
export const formatDate = (dateString: string | Date): string => {
  if (!dateString) return 'تاریخ نامعتبر';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Use Intl for localized date formatting
  const formatter = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return formatter.format(date);
};

/**
 * Format a number as currency in Persian locale
 * 
 * @param amount - The amount to format
 * @returns Formatted currency string
 * @deprecated Use CurrencyUtils.format instead
 */
export const formatCurrency = (amount: number): string => {
  return formatCurrencyUtil(amount);
};

/**
 * Convert a date to YYYY-MM-DD format for inputs
 * 
 * @param date - Date object or date string
 * @returns Date in YYYY-MM-DD format
 */
export const toInputDateFormat = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Handle invalid dates
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Get a short relative time (e.g., "3 hours ago")
 *
 * @param dateString - ISO date string or Date object
 * @returns Relative time string
 */
export const getRelativeTime = (dateString: string | Date): string => {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'چند لحظه پیش';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} دقیقه پیش`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ساعت پیش`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} روز پیش`;
  }
  
  // Fall back to normal date for older dates
  return formatDate(date);
}; 