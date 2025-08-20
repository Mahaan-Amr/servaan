'use client';

import { useState, useEffect } from 'react';
import { AccountingService } from '../../../../services/accountingService';
import { CustomBarChart } from '../../../../components/charts/BarChart';
import { CustomPieChart } from '../../../../components/charts/PieChart';

interface FinancialRatio {
  id: string;
  category: string;
  name: string;
  value: number;
  target: number;
  status: 'good' | 'warning' | 'poor';
  description: string;
}

export default function FinancialRatiosPage() {
  const [loading, setLoading] = useState(true);
  const [ratios, setRatios] = useState<FinancialRatio[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchFinancialRatios();
  }, []);

  const fetchFinancialRatios = async () => {
    try {
      setLoading(true);
      const data = await AccountingService.getFinancialRatios();
      // Map backend ratios to FinancialRatio interface
      const ratios: FinancialRatio[] = [
        {
          id: 'current-ratio',
          category: 'نقدینگی',
          name: 'نسبت جاری',
          value: data.liquidityRatios.currentRatio,
          target: 2.0,
          status: data.liquidityRatios.currentRatio >= 2 ? 'good' : data.liquidityRatios.currentRatio >= 1 ? 'warning' : 'poor',
          description: 'قدرت پرداخت بدهی‌های کوتاه‌مدت'
        },
        {
          id: 'quick-ratio',
          category: 'نقدینگی',
          name: 'نسبت سریع',
          value: data.liquidityRatios.quickRatio,
          target: 1.0,
          status: data.liquidityRatios.quickRatio >= 1 ? 'good' : data.liquidityRatios.quickRatio >= 0.5 ? 'warning' : 'poor',
          description: 'نقدینگی بدون در نظر گیری موجودی'
        },
        {
          id: 'gross-profit-margin',
          category: 'سودآوری',
          name: 'حاشیه سود ناخالص',
          value: data.profitabilityRatios.grossProfitMargin,
          target: 20.0,
          status: data.profitabilityRatios.grossProfitMargin >= 20 ? 'good' : data.profitabilityRatios.grossProfitMargin >= 10 ? 'warning' : 'poor',
          description: 'درصد سود ناخالص از فروش'
        },
        {
          id: 'net-profit-margin',
          category: 'سودآوری',
          name: 'حاشیه سود خالص',
          value: data.profitabilityRatios.netProfitMargin,
          target: 10.0,
          status: data.profitabilityRatios.netProfitMargin >= 10 ? 'good' : data.profitabilityRatios.netProfitMargin >= 5 ? 'warning' : 'poor',
          description: 'درصد سود خالص از فروش'
        },
        {
          id: 'debt-to-assets',
          category: 'اهرم مالی',
          name: 'نسبت بدهی به دارایی',
          value: data.leverageRatios.debtToAssets,
          target: 50.0,
          status: data.leverageRatios.debtToAssets <= 50 ? 'good' : data.leverageRatios.debtToAssets <= 70 ? 'warning' : 'poor',
          description: 'میزان اهرم مالی شرکت'
        },
        {
          id: 'asset-turnover',
          category: 'فعالیت',
          name: 'گردش دارایی',
          value: data.activityRatios.assetTurnover,
          target: 1.0,
          status: data.activityRatios.assetTurnover >= 1 ? 'good' : data.activityRatios.assetTurnover >= 0.5 ? 'warning' : 'poor',
          description: 'کارایی استفاده از دارایی‌ها در تولید فروش'
        }
      ];
      setRatios(ratios);
    } catch (error) {
      console.error('Error fetching financial ratios:', error);
      setRatios([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'همه نسبت‌ها' },
    { id: 'نقدینگی', name: 'نسبت‌های نقدینگی' },
    { id: 'سودآوری', name: 'نسبت‌های سودآوری' },
    { id: 'اهرم مالی', name: 'نسبت‌های اهرم مالی' },
    { id: 'فعالیت', name: 'نسبت‌های فعالیت' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'poor': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'good': return 'مطلوب';
      case 'warning': return 'قابل قبول';
      case 'poor': return 'نیاز به بهبود';
      default: return 'نامشخص';
    }
  };

  const filteredRatios = ratios.filter(ratio => {
    return selectedCategory === 'all' || ratio.category === selectedCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              نسبت‌های مالی
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              تحلیل نسبت‌های مالی کلیدی و بررسی عملکرد
            </p>
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            گزارش تحلیلی
          </button>
        </div>
      </div>

      {/* Charts Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CustomBarChart
          data={ratios.map(r => ({ name: r.name, مقدار: r.value, هدف: r.target }))}
          bars={[
            { dataKey: 'مقدار', fill: '#10b981', name: 'مقدار فعلی' },
            { dataKey: 'هدف', fill: '#6366f1', name: 'هدف' }
          ]}
          title="مقایسه نسبت‌های مالی با اهداف"
          xAxisKey="name"
          height={320}
        />
        <CustomPieChart
          data={[
            { name: 'مطلوب', value: ratios.filter(r => r.status === 'good').length, fill: '#10b981' },
            { name: 'قابل قبول', value: ratios.filter(r => r.status === 'warning').length, fill: '#f59e42' },
            { name: 'نیاز به بهبود', value: ratios.filter(r => r.status === 'poor').length, fill: '#ef4444' }
          ]}
          title="وضعیت کلی نسبت‌ها"
          height={320}
        />
      </div>

      {/* Categories */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Ratios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRatios.map((ratio) => (
          <div key={ratio.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {ratio.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{ratio.category}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ratio.status)}`}>
                {getStatusLabel(ratio.status)}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">مقدار فعلی</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {ratio.value.toFixed(2)}
                  {ratio.name.includes('حاشیه') || ratio.name.includes('بدهی') ? '%' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">هدف</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {ratio.target.toFixed(2)}
                  {ratio.name.includes('حاشیه') || ratio.name.includes('بدهی') ? '%' : ''}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full ${
                    ratio.status === 'good' ? 'bg-green-500' :
                    ratio.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.min((ratio.value / ratio.target) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {ratio.description}
            </p>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          خلاصه تحلیل نسبت‌ها
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {ratios.filter(r => r.status === 'good').length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">نسبت‌های مطلوب</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {ratios.filter(r => r.status === 'warning').length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">نسبت‌های قابل قبول</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {ratios.filter(r => r.status === 'poor').length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">نسبت‌های نیازمند بهبود</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          پیشنهادات بهبود
        </h2>
        <div className="space-y-3">
          {ratios.filter(r => r.status === 'poor' || r.status === 'warning').map((ratio) => (
            <div key={ratio.id} className="flex items-start space-x-3 space-x-reverse p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className={`w-3 h-3 rounded-full mt-1 ${
                ratio.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{ratio.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {ratio.status === 'poor' ? 
                    'نیاز به توجه فوری و اقدامات اصلاحی دارد.' :
                    'قابل بهبود است و نیاز به بررسی دارد.'
                  }
                </p>
              </div>
            </div>
          ))}
          {ratios.filter(r => r.status === 'poor' || r.status === 'warning').length === 0 && (
            <p className="text-gray-600 dark:text-gray-400 text-center py-4">
              همه نسبت‌های مالی در وضعیت مطلوبی قرار دارند.
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 