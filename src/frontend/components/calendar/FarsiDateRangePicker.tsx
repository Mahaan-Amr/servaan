'use client';

import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import FarsiCalendar from './FarsiCalendar';

interface FarsiDateRangePickerProps {
  startDate?: string;
  endDate?: string;
  startHour?: string;
  endHour?: string;
  onApply: (startDate: string, endDate: string, startHour: string, endHour: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const FarsiDateRangePicker: React.FC<FarsiDateRangePickerProps> = ({
  startDate = '',
  endDate = '',
  startHour = '00',
  endHour = '23',
  onApply,
  onCancel,
  isOpen
}) => {
  const [tempStartDate, setTempStartDate] = useState<string>(startDate);
  const [tempEndDate, setTempEndDate] = useState<string>(endDate);
  const [tempStartHour, setTempStartHour] = useState<string>(startHour);
  const [tempEndHour, setTempEndHour] = useState<string>(endHour);

  const handleApply = () => {
    if (!tempStartDate || !tempEndDate) {
      return;
    }
    onApply(tempStartDate, tempEndDate, tempStartHour, tempEndHour);
  };

  const generateHourOptions = () => {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = String(i).padStart(2, '0');
      return (
        <option key={hour} value={hour}>
          {hour}:00
        </option>
      );
    });
  };

  const generateEndHourOptions = () => {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = String(i).padStart(2, '0');
      return (
        <option key={hour} value={hour}>
          {hour}:59
        </option>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            انتخاب دوره زمانی
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              تاریخ شروع (شمسی)
            </label>
            <FarsiCalendar
              value={tempStartDate}
              onChange={setTempStartDate}
              placeholder="تاریخ شروع را انتخاب کنید"
              className="w-full"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              تاریخ پایان (شمسی)
            </label>
            <FarsiCalendar
              value={tempEndDate}
              onChange={setTempEndDate}
              placeholder="تاریخ پایان را انتخاب کنید"
              className="w-full"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ساعت شروع
              </label>
              <select
                value={tempStartHour}
                onChange={(e) => setTempStartHour(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {generateHourOptions()}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ساعت پایان
              </label>
              <select
                value={tempEndHour}
                onChange={(e) => setTempEndHour(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {generateEndHourOptions()}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleApply}
              disabled={!tempStartDate || !tempEndDate}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              اعمال
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarsiDateRangePicker;
