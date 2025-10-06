'use client';

import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt } from 'react-icons/fa';

interface FarsiCalendarProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

// Farsi month names
const FARSI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// Farsi weekday names
const FARSI_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// Convert Gregorian to Farsi date
const toFarsiDate = (date: Date) => {
  const farsiDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(date);

  const year = farsiDate.find(part => part.type === 'year')?.value || '';
  const month = farsiDate.find(part => part.type === 'month')?.value || '';
  const day = farsiDate.find(part => part.type === 'day')?.value || '';

  return {
    year: parseInt(year),
    month: parseInt(month),
    day: parseInt(day)
  };
};

// Convert Farsi to Gregorian date
const toGregorianDate = (farsiYear: number, farsiMonth: number, farsiDay: number): Date => {
  // This is a simplified conversion - for production use a proper library
  const gregorianYear = farsiYear + 621;
  const gregorianMonth = farsiMonth - 1; // JavaScript months are 0-based
  return new Date(gregorianYear, gregorianMonth, farsiDay);
};

// Get days in Farsi month
const getDaysInFarsiMonth = (year: number, month: number): number => {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  // Check if it's a leap year for Esfand
  return 29; // Simplified - should check leap year
};

// Get first day of month
const getFirstDayOfMonth = (year: number, month: number): number => {
  const firstDay = toGregorianDate(year, month, 1);
  return firstDay.getDay();
};

export const FarsiCalendar: React.FC<FarsiCalendarProps> = ({
  value = '',
  onChange,
  placeholder = 'تاریخ را انتخاب کنید',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState<number>(1403);
  const [currentMonth, setCurrentMonth] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>(value);

  // Initialize with current Farsi date
  useEffect(() => {
    if (!value) {
      const now = new Date();
      const farsiDate = toFarsiDate(now);
      setCurrentYear(farsiDate.year || 1403);
      setCurrentMonth(farsiDate.month || 1);
    } else {
      // Parse existing value
      const parts = value.split('/');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        if (!isNaN(year) && !isNaN(month)) {
          setCurrentYear(year);
          setCurrentMonth(month);
        } else {
          // Fallback to current date
          const now = new Date();
          const farsiDate = toFarsiDate(now);
          setCurrentYear(farsiDate.year || 1403);
          setCurrentMonth(farsiDate.month || 1);
        }
      }
    }
  }, [value]);

  const handleDateSelect = (day: number) => {
    const dateString = `${currentYear}/${String(currentMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    setSelectedDate(dateString);
    onChange(dateString);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInFarsiMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="w-8 h-8"></div>
      );
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate === `${currentYear}/${String(currentMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
      const isToday = false; // Could implement today check
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`w-8 h-8 text-sm rounded-md transition-colors ${
            isSelected
              ? 'bg-blue-600 text-white'
              : isToday
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right cursor-pointer flex items-center justify-between"
        dir="rtl"
      >
        <span className={selectedDate ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
          {selectedDate || placeholder}
        </span>
        <FaCalendarAlt className="w-4 h-4 text-gray-400" />
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <FaChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {FARSI_MONTHS[currentMonth - 1] || 'فروردین'} {currentYear || 1403}
              </h3>
            </div>
            
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <FaChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {FARSI_WEEKDAYS.map((day) => (
              <div
                key={day}
                className="w-8 h-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendarDays()}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const now = new Date();
                  const farsiDate = toFarsiDate(now);
                  const todayString = `${farsiDate.year}/${String(farsiDate.month).padStart(2, '0')}/${String(farsiDate.day).padStart(2, '0')}`;
                  setSelectedDate(todayString);
                  onChange(todayString);
                  setIsOpen(false);
                }}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                امروز
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 text-sm bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default FarsiCalendar;
