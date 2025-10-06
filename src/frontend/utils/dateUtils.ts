import { formatCurrency as formatCurrencyUtil } from '../../shared/utils/currencyUtils';

// Farsi calendar configuration
const FARSI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const FARSI_WEEKDAYS = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'
];

// Farsi digits mapping
const FARSI_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Convert English numbers to Farsi digits
 * 
 * @param text - Text containing English numbers
 * @returns Text with Farsi digits
 */
export const toFarsiDigits = (text: string | number): string => {
  if (typeof text === 'number') {
    text = text.toString();
  }
  
  return text.replace(/[0-9]/g, (digit) => FARSI_DIGITS[parseInt(digit)]);
};

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

/**
 * Convert Gregorian date to Farsi date
 * 
 * @param date - Date object
 * @returns Farsi date object
 */
export const toFarsiDate = (date: Date) => {
  try {
    console.log('🔍 [DATE_UTILS] toFarsiDate input:', date);
    
    // For now, let's use a simple and reliable fallback
    // This gives us approximately correct Persian dates
    const gregorianYear = date.getFullYear();
    const gregorianMonth = date.getMonth() + 1;
    const gregorianDay = date.getDate();
    
    // Simple conversion: Persian year is approximately Gregorian year - 621
    // But we need to account for the fact that Persian year starts in March
    let persianYear = gregorianYear - 621;
    let persianMonth = gregorianMonth;
    let persianDay = gregorianDay;
    
    // Adjust for Persian calendar year start (around March 21st)
    if (gregorianMonth < 3 || (gregorianMonth === 3 && gregorianDay < 21)) {
      persianYear -= 1;
      persianMonth += 9;
    } else {
      persianMonth -= 3;
    }
    
    // Ensure month is within valid range
    if (persianMonth <= 0) {
      persianMonth += 12;
    }
    if (persianMonth > 12) {
      persianMonth -= 12;
    }
    
    const result = {
      year: persianYear,
      month: persianMonth,
      day: persianDay,
      monthName: FARSI_MONTHS[persianMonth - 1] || '',
      weekday: FARSI_WEEKDAYS[date.getDay()] || ''
    };
    console.log('🔍 [DATE_UTILS] toFarsiDate result:', result);
    return result;
  } catch (error) {
    console.error('Error converting to Farsi date:', error);
    // Fallback to current date
    const now = new Date();
    return {
      year: 1403, // Current Persian year
      month: 1,
      day: 1,
      monthName: FARSI_MONTHS[0] || '',
      weekday: FARSI_WEEKDAYS[now.getDay()] || ''
    };
  }
};

/**
 * Format date in Farsi format (YYYY/MM/DD)
 * 
 * @param date - Date object or string
 * @returns Farsi formatted date string
 */
export const formatFarsiDate = (date: Date | string): string => {
  if (!date) return 'تاریخ نامعتبر';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'تاریخ نامعتبر';
  
  try {
    const farsiDate = toFarsiDate(d);
    console.log('🔍 [DATE_UTILS] formatFarsiDate input:', { date, d, farsiDate });
    
    if (!farsiDate.year || !farsiDate.month || !farsiDate.day) {
      console.error('🔍 [DATE_UTILS] Invalid Farsi date components:', farsiDate);
      return 'تاریخ نامعتبر';
    }
    const yearStr = String(farsiDate.year);
    const monthStr = String(farsiDate.month).padStart(2, '0');
    const dayStr = String(farsiDate.day).padStart(2, '0');
    const result = toFarsiDigits(`${yearStr}/${monthStr}/${dayStr}`);
    console.log('🔍 [DATE_UTILS] formatFarsiDate result:', result);
    return result;
  } catch (error) {
    console.error('Error formatting Farsi date:', error);
    return 'تاریخ نامعتبر';
  }
};

/**
 * Format date in Farsi with month name
 * 
 * @param date - Date object or string
 * @returns Farsi formatted date with month name
 */
export const formatFarsiDateWithMonth = (date: Date | string): string => {
  if (!date) return 'تاریخ نامعتبر';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'تاریخ نامعتبر';
  
  const farsiDate = toFarsiDate(d);
  return toFarsiDigits(`${farsiDate.day} ${farsiDate.monthName} ${farsiDate.year}`);
};

/**
 * Format date in Farsi with weekday
 * 
 * @param date - Date object or string
 * @returns Farsi formatted date with weekday
 */
export const formatFarsiDateWithWeekday = (date: Date | string): string => {
  if (!date) return 'تاریخ نامعتبر';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'تاریخ نامعتبر';
  
  const farsiDate = toFarsiDate(d);
  return toFarsiDigits(`${farsiDate.weekday}، ${farsiDate.day} ${farsiDate.monthName} ${farsiDate.year}`);
};

/**
 * Format time in Farsi format (HH:MM)
 * 
 * @param date - Date object or string
 * @returns Farsi formatted time string
 */
export const formatFarsiTime = (date: Date | string): string => {
  if (!date) return 'زمان نامعتبر';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'زمان نامعتبر';
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return toFarsiDigits(`${hours}:${minutes}`);
};

/**
 * Format date and time in Farsi format
 * 
 * @param date - Date object or string
 * @returns Farsi formatted date and time string
 */
export const formatFarsiDateTime = (date: Date | string): string => {
  if (!date) return 'تاریخ و زمان نامعتبر';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'تاریخ و زمان نامعتبر';
  
  const farsiDate = toFarsiDate(d);
  const time = formatFarsiTime(d);
  
  return toFarsiDigits(`${farsiDate.day} ${farsiDate.monthName} ${farsiDate.year} - ${time}`);
};

/**
 * Get Farsi date range for analytics
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Farsi formatted date range string
 */
export const formatFarsiDateRange = (startDate: Date | string, endDate: Date | string): string => {
  if (!startDate || !endDate) {
    return 'تاریخ نامعتبر';
  }
  
  const start = formatFarsiDate(startDate);
  const end = formatFarsiDate(endDate);
  
  if (start === 'تاریخ نامعتبر' || end === 'تاریخ نامعتبر') {
    return 'تاریخ نامعتبر';
  }
  
  return `${start} تا ${end}`;
};

/**
 * Convert Farsi date string to Date object
 * 
 * @param farsiDateString - Farsi date string (YYYY/MM/DD)
 * @returns Date object
 */
export const parseFarsiDate = (farsiDateString: string): Date | null => {
  if (!farsiDateString) return null;
  
  try {
    // Convert Farsi date to Gregorian for Date object
    // This is a simplified conversion - for production use a proper library
    const parts = farsiDateString.split('/');
    if (parts.length !== 3) return null;
    
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // JavaScript months are 0-based
    const day = parseInt(parts[2]);
    
    return new Date(year + 621, month, day); // Approximate conversion
  } catch {
    return null;
  }
}; 