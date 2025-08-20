'use client';

import React from 'react';

// Maintain backward compatibility with existing interfaces
interface LegacyMatrixData {
  name: string;
  revenue: number;
  profit: number;
  profitMargin: number;
  quantity: number;
  category: string;
}

interface LegacyQuadrantData {
  title: string;
  description: string;
  color: string;
  bgColor: string;
  products: LegacyMatrixData[];
  recommendations: string[];
}

interface LegacyCustomMatrixChartProps {
  data: LegacyMatrixData[];
  title?: string;
  height?: number;
  className?: string;
}

export const CustomMatrixChart: React.FC<LegacyCustomMatrixChartProps> = ({
  data,
  title,
  height = 500,
  className = ''
}) => {
  if (data.length === 0) {
    return (
      <div className={className}>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
            {title}
          </h3>
        )}
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">داده‌ای برای نمایش وجود ندارد</p>
        </div>
      </div>
    );
  }

  // Calculate medians for thresholds
  const revenueMedian = data.sort((a, b) => a.revenue - b.revenue)[Math.floor(data.length / 2)]?.revenue || 0;
  const profitMedian = data.sort((a, b) => a.profit - b.profit)[Math.floor(data.length / 2)]?.profit || 0;

  // Categorize products into quadrants
  const quadrants: LegacyQuadrantData[] = [
    {
      title: '🌟 ستاره‌ها',
      description: 'درآمد بالا + سود بالا',
      color: 'text-green-700 dark:text-green-300',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700',
      products: data.filter(p => p.revenue >= revenueMedian && p.profit >= profitMedian),
      recommendations: ['حفظ کیفیت', 'افزایش تولید', 'تمرکز بازاریابی']
    },
    {
      title: '🐄 گاوهای شیری',
      description: 'درآمد بالا + سود پایین',
      color: 'text-yellow-700 dark:text-yellow-300',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700',
      products: data.filter(p => p.revenue >= revenueMedian && p.profit < profitMedian),
      recommendations: ['بهینه‌سازی هزینه', 'بازنگری قیمت', 'کاهش مواد اولیه']
    },
    {
      title: '❓ سوالی‌ها',
      description: 'درآمد پایین + سود بالا',
      color: 'text-blue-700 dark:text-blue-300',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700',
      products: data.filter(p => p.revenue < revenueMedian && p.profit >= profitMedian),
      recommendations: ['افزایش تبلیغات', 'بهبود توزیع', 'تنوع محصول']
    },
    {
      title: '🐶 سگ‌ها',
      description: 'درآمد پایین + سود پایین',
      color: 'text-red-700 dark:text-red-300',
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700',
      products: data.filter(p => p.revenue < revenueMedian && p.profit < profitMedian),
      recommendations: ['بررسی حذف', 'تغییر استراتژی', 'کاهش سرمایه‌گذاری']
    }
  ];

  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">
          {title}
        </h3>
      )}

      {/* Matrix Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6" style={{ minHeight: height - 200 }}>
        {quadrants.map((quadrant, index) => (
          <div 
            key={index}
            className={`p-4 rounded-lg border ${quadrant.bgColor}`}
          >
            <div className="text-center mb-4">
              <h4 className={`text-lg font-bold ${quadrant.color} mb-2`}>
                {quadrant.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {quadrant.description}
              </p>
            </div>
            
            {/* Products List */}
            <div className="space-y-2 mb-4">
              {quadrant.products.slice(0, 3).map((product, pIndex) => (
                <div key={pIndex} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300 truncate">
                    {product.name}
                  </span>
                  <span className="text-gray-500 dark:text-gray-500">
                    {product.profitMargin.toFixed(1)}%
                  </span>
                </div>
              ))}
              {quadrant.products.length > 3 && (
                <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
                  +{quadrant.products.length - 3} محصول دیگر
                </div>
              )}
            </div>
            
            {/* Recommendations */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                توصیه‌ها:
              </p>
              {quadrant.recommendations.map((rec, rIndex) => (
                <div key={rIndex} className="text-xs text-gray-500 dark:text-gray-500">
                  • {rec}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-4 gap-4 text-center">
        {quadrants.map((quadrant, index) => (
          <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {quadrant.products.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {quadrant.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 