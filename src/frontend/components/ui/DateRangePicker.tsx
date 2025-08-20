'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { FaChevronDown, FaChevronUp, FaTimes } from 'react-icons/fa';
import { FaRegCalendarDays } from 'react-icons/fa6';

interface DateRangePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

// Persian month names
const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// Persian day names
const persianDays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

// Convert Arabic numerals to Persian numerals
const toPersianNumbers = (num: number): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

// Convert Gregorian to Persian date
const gregorianToPersian = (date: Date) => {
  const year = date.getFullYear();
  
  // Persian calendar starts on March 21st (day 80 of the year)
  const persianYearStart = new Date(year, 2, 21); // March 21st
  
  let persianYear = year;
  let daysSincePersianYearStart;
  
  if (date >= persianYearStart) {
    // Date is in the Persian year that started in this Gregorian year
    daysSincePersianYearStart = Math.floor((date.getTime() - persianYearStart.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    // Date is in the Persian year that started in the previous Gregorian year
    const prevPersianYearStart = new Date(year - 1, 2, 21);
    daysSincePersianYearStart = Math.floor((date.getTime() - prevPersianYearStart.getTime()) / (1000 * 60 * 60 * 24));
    persianYear = year - 1;
  }
  
  // Persian months have different lengths
  const persianMonthLengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30];
  
  let persianMonth = 1;
  let persianDay = daysSincePersianYearStart + 1;
  
  // Adjust for leap year (Persian year 1403 is a leap year)
  if (persianYear === 1403) {
    persianMonthLengths[11] = 30; // Esfand has 30 days in leap year
  }
  
  // Calculate month and day
  for (let i = 0; i < persianMonthLengths.length; i++) {
    if (persianDay <= persianMonthLengths[i]) {
      persianMonth = i + 1;
      break;
    }
    persianDay -= persianMonthLengths[i];
  }
  
  return { year: persianYear, month: persianMonth, day: persianDay };
};

// Generate calendar days
const generateCalendarDays = (year: number, month: number) => {
  const days = [];
  const firstDay = new Date(year, month - 1, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push(date);
  }
  
  return days;
};

export default function DateRangePicker({ value, onChange, className = '' }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null });
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Parse current value to determine mode and dates
  useEffect(() => {
    if (value === 'all') {
      setDateRange({ startDate: null, endDate: null });
      setIsRangeMode(false);
    } else if (value === 'today') {
      const today = new Date();
      setDateRange({ startDate: startOfDay(today), endDate: endOfDay(today) });
      setIsRangeMode(false);
    } else if (value === 'yesterday') {
      const yesterday = subDays(new Date(), 1);
      setDateRange({ startDate: startOfDay(yesterday), endDate: endOfDay(yesterday) });
      setIsRangeMode(false);
    } else if (value === 'week') {
      const today = new Date();
      setDateRange({ startDate: startOfWeek(today), endDate: endOfWeek(today) });
      setIsRangeMode(true);
    } else if (value === 'month') {
      const today = new Date();
      setDateRange({ startDate: startOfMonth(today), endDate: endOfMonth(today) });
      setIsRangeMode(true);
    } else if (value.startsWith('custom:')) {
      const dates = value.replace('custom:', '').split('|');
      if (dates.length === 2) {
        setDateRange({
          startDate: new Date(dates[0]),
          endDate: new Date(dates[1])
        });
        setIsRangeMode(true);
      }
    }
  }, [value]);

  const handleDateSelect = (date: Date) => {
    if (isRangeMode) {
      if (!dateRange.startDate || (dateRange.startDate && dateRange.endDate)) {
        setDateRange({ startDate: date, endDate: null });
      } else {
        const start = dateRange.startDate!;
        const end = date;
        if (end < start) {
          setDateRange({ startDate: end, endDate: start });
        } else {
          setDateRange({ startDate: start, endDate: end });
        }
        
        const customValue = `custom:${startOfDay(start).toISOString()}|${endOfDay(end).toISOString()}`;
        onChange(customValue);
        setIsOpen(false);
      }
    } else {
      const customValue = `custom:${startOfDay(date).toISOString()}|${endOfDay(date).toISOString()}`;
      onChange(customValue);
      setIsOpen(false);
    }
  };

  const getDisplayText = () => {
    if (value === 'all') return 'همه سفارشات';
    if (value === 'today') return 'امروز';
    if (value === 'yesterday') return 'دیروز';
    if (value === 'week') return 'این هفته';
    if (value === 'month') return 'این ماه';
    if (value.startsWith('custom:')) {
      const dates = value.replace('custom:', '').split('|');
      if (dates.length === 2) {
        const start = new Date(dates[0]);
        const end = new Date(dates[1]);
        
        if (isSameDay(start, end)) {
          const persian = gregorianToPersian(start);
          return `${toPersianNumbers(persian.day)} ${persianMonths[persian.month - 1]} ${toPersianNumbers(persian.year)}`;
        } else {
          const startPersian = gregorianToPersian(start);
          const endPersian = gregorianToPersian(end);
          return `${toPersianNumbers(startPersian.day)} ${persianMonths[startPersian.month - 1]} - ${toPersianNumbers(endPersian.day)} ${persianMonths[endPersian.month - 1]}`;
        }
      }
    }
    return 'انتخاب تاریخ';
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return format(date1, 'yyyy-MM-dd') === format(date2, 'yyyy-MM-dd');
  };

  const handlePresetChange = (preset: string) => {
    onChange(preset);
    setIsRangeMode(false);
    setIsOpen(false);
  };

  const clearSelection = () => {
    setDateRange({ startDate: null, endDate: null });
    onChange('all');
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const isDateInRange = (date: Date) => {
    if (!dateRange.startDate) return false;
    if (dateRange.endDate) {
      return date >= dateRange.startDate && date <= dateRange.endDate;
    }
    return isSameDay(date, dateRange.startDate);
  };

  const isDateSelected = (date: Date) => {
    if (isRangeMode) {
      return dateRange.startDate && isSameDay(date, dateRange.startDate) ||
             dateRange.endDate && isSameDay(date, dateRange.endDate);
    }
    return dateRange.startDate && isSameDay(date, dateRange.startDate);
  };

  const calendarDays = generateCalendarDays(currentDate.getFullYear(), currentDate.getMonth() + 1);
  const persianCurrent = gregorianToPersian(currentDate);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white flex items-center justify-between hover:border-amber-400 transition-colors"
      >
        <div className="flex items-center space-x-3 space-x-reverse">
          <FaRegCalendarDays className="text-amber-500 text-lg" />
          <span className="text-right font-medium">{getDisplayText()}</span>
        </div>
        {isOpen ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-xl" ref={dropdownRef}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">انتخاب تاریخ</h3>
              <button
                onClick={clearSelection}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            
            {/* Preset Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'all', label: 'همه سفارشات', color: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600' },
                { key: 'today', label: 'امروز', color: 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800' },
                { key: 'yesterday', label: 'دیروز', color: 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800' },
                { key: 'week', label: 'این هفته', color: 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800' },
                { key: 'month', label: 'این ماه', color: 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800' }
              ].map(preset => (
                <button
                  key={preset.key}
                  onClick={() => handlePresetChange(preset.key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${preset.color} ${
                    value === preset.key ? 'ring-2 ring-amber-500' : ''
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isRangeMode ? 'انتخاب بازه زمانی' : 'انتخاب تاریخ'}
              </span>
              <button
                onClick={() => setIsRangeMode(!isRangeMode)}
                className="px-3 py-1 text-xs bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800 text-amber-700 dark:text-amber-300 rounded-full transition-colors"
              >
                {isRangeMode ? 'تاریخ واحد' : 'بازه زمانی'}
              </button>
            </div>

            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaChevronDown className="text-gray-500 rotate-90" />
              </button>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {persianMonths[persianCurrent.month - 1]}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {toPersianNumbers(persianCurrent.year)}
                </div>
              </div>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaChevronDown className="text-gray-500 -rotate-90" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 persian-calendar">
              {/* Day headers */}
              {persianDays.map(day => (
                <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  {day.slice(0, 3)}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((date, index) => {
                const persian = gregorianToPersian(date);
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isToday = isSameDay(date, new Date());
                const isSelected = isDateSelected(date);
                const isInRange = isDateInRange(date);
                
                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(date)}
                    className={`
                      calendar-day p-2 text-center text-sm rounded-lg transition-all duration-200
                      ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}
                      ${isToday ? 'today bg-amber-500 text-white font-bold' : ''}
                      ${isSelected ? 'selected bg-blue-500 text-white font-bold' : ''}
                      ${isInRange && !isSelected ? 'in-range bg-blue-100 dark:bg-blue-900' : ''}
                      ${!isCurrentMonth ? 'opacity-50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                    `}
                  >
                    {toPersianNumbers(persian.day)}
                  </button>
                );
              })}
            </div>

            {/* Range Preview */}
            {isRangeMode && (dateRange.startDate || dateRange.endDate) && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {dateRange.startDate && (
                    <div>از: {format(dateRange.startDate, 'yyyy/MM/dd')}</div>
                  )}
                  {dateRange.endDate && (
                    <div>تا: {format(dateRange.endDate, 'yyyy/MM/dd')}</div>
                  )}
                  {!dateRange.endDate && dateRange.startDate && (
                    <div className="text-amber-600">انتخاب تاریخ پایان</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
