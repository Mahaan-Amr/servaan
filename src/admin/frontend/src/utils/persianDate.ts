// Persian Date Utilities for Admin Panel
// ابزارهای تاریخ فارسی برای پنل مدیریت

import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { faIR } from 'date-fns/locale/fa-IR';
import { format as formatJalali, formatDistanceToNow as formatDistanceToNowJalali } from 'date-fns-jalali';

export interface PersianDateOptions {
  locale?: 'fa' | 'en';
  format?: 'short' | 'long' | 'relative' | 'jalali';
  timezone?: string;
}

export class PersianDate {
  private date: Date;
  private options: PersianDateOptions;

  constructor(date: Date | string | number, options: PersianDateOptions = {}) {
    try {
      this.date = typeof date === 'string' ? parseISO(date) : new Date(date);
      
      // Validate the date
      if (isNaN(this.date.getTime())) {
        this.date = new Date(); // Fallback to current date
      }
      
      this.options = {
        locale: 'fa',
        format: 'short',
        timezone: 'Asia/Tehran',
        ...options,
      };
    } catch (error) {
      console.error('Error creating PersianDate:', error);
      this.date = new Date(); // Fallback to current date
      this.options = {
        locale: 'fa',
        format: 'short',
        timezone: 'Asia/Tehran',
        ...options,
      };
    }
  }

  /**
   * Format date in Persian (Jalali) calendar
   */
  toPersian(): string {
    try {
      switch (this.options.format) {
        case 'jalali':
          return formatJalali(this.date, 'yyyy/MM/dd HH:mm');
        case 'long':
          return formatJalali(this.date, 'EEEE d MMMM yyyy HH:mm', { locale: faIR });
        case 'relative':
          return formatDistanceToNowJalali(this.date, { addSuffix: true, locale: faIR });
        case 'short':
        default:
          return formatJalali(this.date, 'yyyy/MM/dd');
      }
    } catch (error) {
      console.error('Error formatting Persian date:', error);
      return this.date.toLocaleDateString('fa-IR');
    }
  }

  /**
   * Format date in Gregorian calendar
   */
  toGregorian(): string {
    try {
      switch (this.options.format) {
        case 'long':
          return format(this.date, 'EEEE, MMMM d, yyyy HH:mm', { locale: faIR });
        case 'relative':
          return formatDistanceToNow(this.date, { addSuffix: true, locale: faIR });
        case 'short':
        default:
          return format(this.date, 'yyyy/MM/dd');
      }
    } catch (error) {
      console.error('Error formatting Gregorian date:', error);
      return this.date.toLocaleDateString('en-US');
    }
  }

  /**
   * Format date based on locale preference
   */
  format(): string {
    return this.options.locale === 'fa' ? this.toPersian() : this.toGregorian();
  }

  /**
   * Get relative time (e.g., "2 hours ago")
   */
  getRelativeTime(): string {
    try {
      if (this.options.locale === 'fa') {
        return formatDistanceToNowJalali(this.date, { addSuffix: true, locale: faIR });
      } else {
        return formatDistanceToNow(this.date, { addSuffix: true, locale: faIR });
      }
    } catch (error) {
      console.error('Error getting relative time:', error);
      return this.date.toLocaleDateString();
    }
  }

  /**
   * Get formatted time only
   */
  getTime(): string {
    try {
      return format(this.date, 'HH:mm:ss');
    } catch (error) {
      console.error('Error formatting time:', error);
      return this.date.toLocaleTimeString();
    }
  }

  /**
   * Get day of week in Persian
   */
  getDayOfWeek(): string {
    try {
      const days = {
        'fa': ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'],
        'en': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      };
      
      const locale = this.options.locale || 'fa';
      const dayIndex = this.date.getDay();
      return days[locale][dayIndex];
    } catch (error) {
      console.error('Error getting day of week:', error);
      return '';
    }
  }

  /**
   * Get month name in Persian
   */
  getMonthName(): string {
    try {
      const months = {
        'fa': [
          'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
          'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ],
        'en': [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ]
      };
      
      const locale = this.options.locale || 'fa';
      if (locale === 'fa') {
        // For Jalali calendar, we need to calculate the month
        const jalaliDate = this.toJalaliDate();
        return months.fa[jalaliDate.month - 1];
      } else {
        return months.en[this.date.getMonth()];
      }
    } catch (error) {
      console.error('Error getting month name:', error);
      return '';
    }
  }

  /**
   * Convert to Jalali date object
   */
  private toJalaliDate(): { year: number; month: number; day: number } {
    try {
      // Simple conversion (this is a basic implementation)
      // For production, use a proper Jalali calendar library
      const year = this.date.getFullYear();
      const month = this.date.getMonth() + 1;
      const day = this.date.getDate();
      
      // Basic Jalali conversion (approximate)
      let jalaliYear = year - 621;
      let jalaliMonth = month + 2;
      let jalaliDay = day + 1;
      
      if (jalaliMonth > 12) {
        jalaliMonth -= 12;
        jalaliYear += 1;
      }
      
      return { year: jalaliYear, month: jalaliMonth, day: jalaliDay };
    } catch (error) {
      console.error('Error converting to Jalali:', error);
      return { year: 0, month: 0, day: 0 };
    }
  }

  /**
   * Check if date is today
   */
  isToday(): boolean {
    const today = new Date();
    return this.date.toDateString() === today.toDateString();
  }

  /**
   * Check if date is yesterday
   */
  isYesterday(): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.date.toDateString() === yesterday.toDateString();
  }

  /**
   * Check if date is this week
   */
  isThisWeek(): boolean {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return this.date >= weekStart && this.date <= weekEnd;
  }

  /**
   * Check if date is this month
   */
  isThisMonth(): boolean {
    const today = new Date();
    return this.date.getMonth() === today.getMonth() && 
           this.date.getFullYear() === today.getFullYear();
  }

  /**
   * Check if date is this year
   */
  isThisYear(): boolean {
    const today = new Date();
    return this.date.getFullYear() === today.getFullYear();
  }
}

/**
 * Format date for display in admin panel
 */
export const formatAdminDate = (
  date: Date | string | number,
  options: PersianDateOptions = {}
): string => {
  try {
    // Validate input date
    if (!date) {
      return 'تاریخ نامعتبر';
    }
    
    const persianDate = new PersianDate(date, options);
    return persianDate.format();
  } catch (error) {
    console.error('Error formatting admin date:', error);
    return 'تاریخ نامعتبر';
  }
};

/**
 * Format date as relative time
 */
export const formatRelativeTime = (
  date: Date | string | number,
  locale: 'fa' | 'en' = 'fa'
): string => {
  const persianDate = new PersianDate(date, { locale, format: 'relative' });
  return persianDate.getRelativeTime();
};

/**
 * Format date for tables and lists
 */
export const formatTableDate = (
  date: Date | string | number,
  locale: 'fa' | 'en' = 'fa'
): string => {
  const persianDate = new PersianDate(date, { locale, format: 'short' });
  return persianDate.format();
};

/**
 * Format date for detailed views
 */
export const formatDetailedDate = (
  date: Date | string | number,
  locale: 'fa' | 'en' = 'fa'
): string => {
  const persianDate = new PersianDate(date, { locale, format: 'long' });
  return persianDate.format();
};

/**
 * Get current date in Persian format
 */
export const getCurrentPersianDate = (): string => {
  return formatAdminDate(new Date(), { locale: 'fa', format: 'long' });
};

/**
 * Get current time in Persian format
 */
export const getCurrentPersianTime = (): string => {
  try {
    const now = new Date();
    return format(now, 'HH:mm:ss');
  } catch (error) {
    console.error('Error getting current Persian time:', error);
    return new Date().toLocaleTimeString('fa-IR');
  }
};

/**
 * Convert Persian numbers to English (for calculations)
 */
export const persianToEnglishNumbers = (str: string): string => {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  return str.split('').map(char => {
    const index = persianNumbers.indexOf(char);
    return index !== -1 ? englishNumbers[index] : char;
  }).join('');
};

/**
 * Convert English numbers to Persian (for display)
 */
export const englishToPersianNumbers = (str: string): string => {
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  return str.split('').map(char => {
    const index = englishNumbers.indexOf(char);
    return index !== -1 ? persianNumbers[index] : char;
  }).join('');
};

export default PersianDate;
