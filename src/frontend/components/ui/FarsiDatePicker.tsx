'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { getYear as getJalaliYear, getMonth as getJalaliMonth, getDate as getJalaliDate, startOfMonth as startOfJalaliMonth, endOfMonth as endOfJalaliMonth, eachDayOfInterval as eachDayOfJalaliInterval, addDays, isSameDay } from 'date-fns-jalali';
import { FaChevronRight, FaChevronLeft, FaCalendarAlt, FaTimes } from 'react-icons/fa';
import { toFarsiDigits } from '../../utils/dateUtils';

interface FarsiDatePickerProps {
  value?: string; // Format: YYYY-MM-DD (Gregorian) or empty string
  onChange: (value: string) => void; // Returns YYYY-MM-DD format (Gregorian)
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: string; // YYYY-MM-DD format
  maxDate?: string; // YYYY-MM-DD format
  label?: string;
  error?: string;
}

// Farsi month names
const FARSI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// Farsi weekday names (short)
const FARSI_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// Convert Gregorian YYYY-MM-DD to Jalali Date object
const gregorianToJalaliDate = (gregorianString: string): Date | null => {
  try {
    const gregorianDate = new Date(gregorianString + 'T00:00:00');
    if (isNaN(gregorianDate.getTime())) return null;
    return gregorianDate; // date-fns-jalali functions work with Date objects in Jalali context
  } catch {
    return null;
  }
};

// Convert Jalali Date to Gregorian YYYY-MM-DD
const jalaliToGregorianString = (jalaliDate: Date): string => {
  try {
    // Use Intl API to get Gregorian date from Jalali
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      calendar: 'gregory'
    });
    
    // Get parts from the date
    const parts = formatter.formatToParts(jalaliDate);
    const year = parts.find(p => p.type === 'year')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    
    return `${year}-${month}-${day}`;
  } catch {
    // Fallback: use the date directly (it's already a Date object)
    return format(jalaliDate, 'yyyy-MM-dd');
  }
};

export const FarsiDatePicker: React.FC<FarsiDatePickerProps> = ({
  value = '',
  onChange,
  placeholder = 'تاریخ را انتخاب کنید',
  className = '',
  disabled = false,
  minDate,
  maxDate,
  label,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentJalaliDate, setCurrentJalaliDate] = useState<Date>(new Date());
  const [selectedJalaliDate, setSelectedJalaliDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'year' | 'month'>('calendar');
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Initialize current date and selected date
  useEffect(() => {
    const today = new Date();
    setCurrentJalaliDate(today);
    
    if (value) {
      const jalaliDate = gregorianToJalaliDate(value);
      if (jalaliDate) {
        setSelectedJalaliDate(jalaliDate);
        setCurrentJalaliDate(jalaliDate);
      }
    } else {
      setSelectedJalaliDate(null);
    }
  }, [value]);

  // Reset view mode when calendar closes
  useEffect(() => {
    if (!isOpen) {
      setViewMode('calendar');
    }
  }, [isOpen]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  // Get Jalali date components
  const getJalaliComponents = (date: Date) => {
    const year = getJalaliYear(date);
    const month = getJalaliMonth(date) + 1; // date-fns-jalali months are 0-indexed
    const day = getJalaliDate(date);
    return { year, month, day };
  };

  // Get display text for selected date
  const getDisplayText = (): string => {
    if (!selectedJalaliDate) return placeholder;
    
    const { year, month, day } = getJalaliComponents(selectedJalaliDate);
    return toFarsiDigits(`${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`);
  };

  // Check if a date is today in Jalali calendar
  const isToday = (date: Date): boolean => {
    const today = new Date();
    const todayJalali = getJalaliComponents(today);
    const dateJalali = getJalaliComponents(date);
    return todayJalali.year === dateJalali.year && 
           todayJalali.month === dateJalali.month && 
           todayJalali.day === dateJalali.day;
  };

  // Handle date selection
  const handleDateSelect = (selectedDay: Date) => {
    // Check min/max constraints
    if (minDate) {
      const minGregorian = new Date(minDate + 'T00:00:00');
      const selectedGregorian = new Date(selectedDay);
      if (selectedGregorian < minGregorian) {
        return;
      }
    }
    
    if (maxDate) {
      const maxGregorian = new Date(maxDate + 'T23:59:59');
      const selectedGregorian = new Date(selectedDay);
      if (selectedGregorian > maxGregorian) {
        return;
      }
    }
    
    setSelectedJalaliDate(selectedDay);
    const gregorianString = jalaliToGregorianString(selectedDay);
    if (gregorianString) {
      onChange(gregorianString);
    }
    setIsOpen(false);
  };

  // Navigate to previous month
  const handlePrevMonth = () => {
    const monthStart = startOfJalaliMonth(currentJalaliDate);
    const prevMonth = addDays(monthStart, -1);
    setCurrentJalaliDate(startOfJalaliMonth(prevMonth));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    const monthEnd = endOfJalaliMonth(currentJalaliDate);
    const nextMonth = addDays(monthEnd, 1);
    setCurrentJalaliDate(startOfJalaliMonth(nextMonth));
  };

  // Navigate to previous year (in year selection mode)
  const handlePrevYear = () => {
    // Adjust year while keeping month and day
    const adjustedDate = new Date(currentJalaliDate);
    adjustedDate.setFullYear(adjustedDate.getFullYear() - 12);
    setCurrentJalaliDate(adjustedDate);
  };

  // Navigate to next year (in year selection mode)
  const handleNextYear = () => {
    const adjustedDate = new Date(currentJalaliDate);
    adjustedDate.setFullYear(adjustedDate.getFullYear() + 12);
    setCurrentJalaliDate(adjustedDate);
  };

  // Handle year selection
  const handleYearSelect = (selectedYear: number) => {
    const { month, day } = getJalaliComponents(currentJalaliDate);
    try {
      // Create a new date with the selected year
      // Use approximate conversion (Jalali year + 621 for Gregorian)
      // The date-fns-jalali functions will handle proper conversion when displaying
      const gregorianYear = selectedYear + 621;
      const newDate = new Date(gregorianYear, month - 1, Math.min(day, 28)); // Use min to avoid invalid dates
      setCurrentJalaliDate(newDate);
      setViewMode('month'); // Switch to month selection
    } catch {
      // If conversion fails, just update the view
      setViewMode('month');
    }
  };

  // Handle month selection
  const handleMonthSelect = (selectedMonth: number) => {
    const { year, day } = getJalaliComponents(currentJalaliDate);
    try {
      // Create a new date with the selected month
      // Use approximate conversion (Jalali year + 621)
      const gregorianYear = year + 621;
      // Ensure day is valid for the selected month (max 31 for Persian months)
      const validDay = Math.min(day, 31);
      const newDate = new Date(gregorianYear, selectedMonth - 1, validDay);
      setCurrentJalaliDate(newDate);
      setViewMode('calendar'); // Switch back to calendar view
    } catch {
      setViewMode('calendar');
    }
  };

  // Generate year list for selection (current year ± 50 years)
  const generateYearList = (): number[] => {
    const { year } = getJalaliComponents(currentJalaliDate);
    const startYear = Math.max(1300, year - 50);
    const endYear = Math.min(1500, year + 50);
    const years = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }
    return years;
  };

  // Render year selection view
  const renderYearSelection = () => {
    const years = generateYearList();
    const { year: currentYear } = getJalaliComponents(currentJalaliDate);
    const startYear = years[0];
    const endYear = years[years.length - 1];

    return (
      <div className="space-y-4">
        {/* Year Range Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevYear}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="سال‌های قبل"
          >
            <FaChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="text-center flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {toFarsiDigits(startYear.toString())} - {toFarsiDigits(endYear.toString())}
            </h3>
            <button
              onClick={() => setViewMode('calendar')}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mt-1"
            >
              بازگشت به تقویم
            </button>
          </div>
          
          <button
            onClick={handleNextYear}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="سال‌های بعد"
          >
            <FaChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Year Grid */}
        <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
          {years.map((year) => {
            const isCurrentYear = year === currentYear;
            return (
              <button
                key={year}
                onClick={() => handleYearSelect(year)}
                className={`
                  px-3 py-2 text-sm rounded-lg transition-all duration-200
                  ${isCurrentYear
                    ? 'bg-blue-600 text-white font-semibold shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                {toFarsiDigits(year.toString())}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render month selection view
  const renderMonthSelection = () => {
    const { year, month: currentMonth } = getJalaliComponents(currentJalaliDate);

    return (
      <div className="space-y-4">
        {/* Year Header with Back Button */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setViewMode('year')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="بازگشت به انتخاب سال"
          >
            <FaChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={() => setViewMode('year')}
            className="text-lg font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {toFarsiDigits(year.toString())}
          </button>
          
          <button
            onClick={() => setViewMode('calendar')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="بازگشت به تقویم"
          >
            <FaChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-3 gap-2">
          {FARSI_MONTHS.map((monthName, index) => {
            const monthNumber = index + 1;
            const isCurrentMonth = monthNumber === currentMonth;
            return (
              <button
                key={monthNumber}
                onClick={() => handleMonthSelect(monthNumber)}
                className={`
                  px-4 py-3 text-sm rounded-lg transition-all duration-200
                  ${isCurrentMonth
                    ? 'bg-blue-600 text-white font-semibold shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                {monthName}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Go to today
  const handleToday = () => {
    const today = new Date();
    setCurrentJalaliDate(today);
    handleDateSelect(today);
  };

  // Clear selection
  const handleClear = () => {
    setSelectedJalaliDate(null);
    onChange('');
    setIsOpen(false);
  };

  // Render calendar days
  const renderCalendarDays = () => {
    try {
      const monthStart = startOfJalaliMonth(currentJalaliDate);
      const monthEnd = endOfJalaliMonth(currentJalaliDate);
      const days = eachDayOfJalaliInterval({ start: monthStart, end: monthEnd });
      
      // Get first day of week (0 = Saturday in Jalali calendar)
      const firstDayWeekday = monthStart.getDay();
      // Adjust for Jalali calendar (Saturday = 0)
      const adjustedFirstDay = (firstDayWeekday + 1) % 7;
      
      const calendarDays = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < adjustedFirstDay; i++) {
        calendarDays.push(
          <div key={`empty-${i}`} className="w-10 h-10"></div>
        );
      }
      
      // Add days of the month
      days.forEach((day) => {
        const dayNumber = getJalaliDate(day);
        const isSelected = selectedJalaliDate && isSameDay(day, selectedJalaliDate);
        const isTodayDate = isToday(day);
        
        // Check if day is disabled
        let isDisabled = false;
        if (minDate) {
          const minGregorian = new Date(minDate + 'T00:00:00');
          const dayGregorian = new Date(day);
          if (dayGregorian < minGregorian) isDisabled = true;
        }
        if (maxDate) {
          const maxGregorian = new Date(maxDate + 'T23:59:59');
          const dayGregorian = new Date(day);
          if (dayGregorian > maxGregorian) isDisabled = true;
        }
        
        calendarDays.push(
          <button
            key={day.getTime()}
            onClick={() => !isDisabled && handleDateSelect(day)}
            disabled={isDisabled}
            className={`
              w-10 h-10 text-sm rounded-lg transition-all duration-200
              ${isSelected
                ? 'bg-blue-600 text-white font-semibold shadow-md scale-105'
                : isTodayDate
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium border-2 border-blue-400'
                : isDisabled
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105'
              }
            `}
          >
            {toFarsiDigits(dayNumber.toString())}
          </button>
        );
      });
      
      return calendarDays;
    } catch (e) {
      console.error('Error rendering calendar days:', e);
      return [];
    }
  };

  const { year, month } = getJalaliComponents(currentJalaliDate);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}

      {/* Input Field */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-2.5 border rounded-lg shadow-sm
          bg-white dark:bg-gray-800 text-gray-900 dark:text-white
          cursor-pointer flex items-center justify-between
          transition-all duration-200
          ${error
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }
          ${disabled
            ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900'
            : 'hover:border-blue-400 dark:hover:border-blue-500'
          }
        `}
        dir="rtl"
      >
        <span className={`flex-1 text-right ${!selectedJalaliDate ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
          {getDisplayText()}
        </span>
        <div className="flex items-center space-x-2 space-x-reverse">
          {selectedJalaliDate && !disabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <FaTimes className="w-3 h-3" />
            </button>
          )}
          <FaCalendarAlt className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Calendar Dropdown */}
      {isOpen && !disabled && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={calendarRef}
            className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-2xl z-50 p-4 min-w-[320px]"
            dir="rtl"
          >
            {/* Header */}
            {viewMode === 'calendar' && (
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="ماه قبل"
                >
                  <FaChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                
                <div className="text-center flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => setViewMode('month')}
                    className="text-lg font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {FARSI_MONTHS[month - 1]}
                  </button>
                  <button
                    onClick={() => setViewMode('year')}
                    className="text-lg font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {toFarsiDigits(year.toString())}
                  </button>
                </div>
                
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="ماه بعد"
                >
                  <FaChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}

            {/* Year Selection View */}
            {viewMode === 'year' && renderYearSelection()}

            {/* Month Selection View */}
            {viewMode === 'month' && renderMonthSelection()}

            {/* Weekday Headers - Only show in calendar view */}
            {viewMode === 'calendar' && (
              <>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {FARSI_WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      className="w-10 h-10 flex items-center justify-center text-xs font-semibold text-gray-500 dark:text-gray-400"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {renderCalendarDays()}
                </div>
              </>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
              {viewMode === 'calendar' ? (
                <>
                  <button
                    onClick={handleToday}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    امروز
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    بستن
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setViewMode('calendar')}
                  className="w-full px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  بازگشت به تقویم
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FarsiDatePicker;
