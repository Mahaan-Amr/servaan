'use client';

import React from 'react';

export type ReportType = 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT';

interface ReportTypeOption {
  type: ReportType;
  label: string;
  description: string;
  icon: string;
  color: string;
  preview: string;
}

interface ReportTypeSelectorProps {
  selectedType: ReportType;
  onTypeChange: (type: ReportType) => void;
  className?: string;
}

const reportTypes: ReportTypeOption[] = [
  {
    type: 'TABULAR',
    label: 'جدولی',
    description: 'گزارش جدولی با ردیف‌ها و ستون‌ها',
    icon: '📊',
    color: 'bg-blue-500',
    preview: 'نمایش داده‌ها در قالب جدول'
  },
  {
    type: 'CHART',
    label: 'نمودار',
    description: 'گزارش بصری با نمودارها',
    icon: '📈',
    color: 'bg-green-500',
    preview: 'نمایش داده‌ها در قالب نمودار'
  },
  {
    type: 'DASHBOARD',
    label: 'داشبورد',
    description: 'داشبورد ترکیبی با چندین ویجت',
    icon: '📱',
    color: 'bg-purple-500',
    preview: 'ترکیب چندین نمودار و جدول'
  },
  {
    type: 'PIVOT',
    label: 'جدول محوری',
    description: 'جدول محوری برای تحلیل چندبعدی',
    icon: '🔄',
    color: 'bg-orange-500',
    preview: 'تحلیل داده‌ها از چند بعد'
  }
];

export const ReportTypeSelector: React.FC<ReportTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          نوع گزارش
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          نوع گزارش را انتخاب کنید
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reportTypes.map((type) => (
          <button
            key={type.type}
            onClick={() => onTypeChange(type.type)}
            className={`
              p-4 rounded-lg border-2 transition-all duration-200 text-right
              ${selectedType === type.type
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
          >
            <div className="flex items-start gap-3">
              <div className={`
                w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                ${selectedType === type.type ? type.color : 'bg-gray-100 dark:bg-gray-700'}
              `}>
                {type.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  {type.label}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {type.description}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded px-2 py-1">
                  {type.preview}
                </div>
              </div>
              {selectedType === type.type && (
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

