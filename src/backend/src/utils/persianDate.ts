/**
 * Persian Date Utility
 * ابزار تاریخ شمسی
 */

export interface PersianDate {
  year: number;
  month: number;
  day: number;
}

export class PersianDateUtils {
  
  /**
   * Convert Gregorian date to Persian (Shamsi) date
   * تبدیل تاریخ میلادی به شمسی
   */
  static gregorianToPersian(gregorianDate: Date): PersianDate {
    const year = gregorianDate.getFullYear();
    const month = gregorianDate.getMonth() + 1;
    const day = gregorianDate.getDate();
    
    // Simple conversion (for more accurate conversion, use a proper library)
    // This is a basic approximation
    let persianYear = year - 621;
    
    // Adjust for leap years and month differences
    if (month < 3 || (month === 3 && day < 21)) {
      persianYear--;
    }
    
    return {
      year: persianYear,
      month: month <= 3 ? month + 9 : month - 3,
      day: day
    };
  }

  /**
   * Get Persian fiscal year from Gregorian date
   * دریافت سال مالی شمسی از تاریخ میلادی
   */
  static getPersianFiscalYear(gregorianDate: Date): number {
    const persian = this.gregorianToPersian(gregorianDate);
    return persian.year;
  }

  /**
   * Format Persian date as string
   * قالب‌بندی تاریخ شمسی به رشته
   */
  static formatPersianDate(persianDate: PersianDate): string {
    const { year, month, day } = persianDate;
    return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
  }

  /**
   * Get Persian month names
   * دریافت نام ماه‌های شمسی
   */
  static getPersianMonthName(month: number): string {
    const monthNames = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];
    return monthNames[month - 1] || '';
  }

  /**
   * Get current Persian date
   * دریافت تاریخ شمسی جاری
   */
  static getCurrentPersianDate(): PersianDate {
    return this.gregorianToPersian(new Date());
  }

  /**
   * Generate Persian year-based entry number
   * تولید شماره سند بر اساس سال شمسی
   */
  static generatePersianEntryNumber(sequenceNumber: number): string {
    const currentPersian = this.getCurrentPersianDate();
    return `${currentPersian.year}-${sequenceNumber.toString().padStart(6, '0')}`;
  }
}

export default PersianDateUtils; 