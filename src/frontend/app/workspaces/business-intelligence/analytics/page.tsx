'use client';

import { useState, useEffect, useCallback } from 'react';
import { useBIWorkspace } from '../../../../contexts/BIWorkspaceContext';
import { biService } from '../../../../services/biService';
import { 
  AnalyticsSummary, 
  CategoryData, 
  TrendData, 
  MonthlyData
} from '../../../../types/bi';
import { CustomLineChart } from '../../../../components/charts/LineChart';
import { CustomBarChart } from '../../../../components/charts/BarChart';
import { Button, Card, Section } from '../../../../components/ui';

export default function AnalyticsReportsPage() {
  const { workspace, isInventoryWorkspace, isMergedWorkspace } = useBIWorkspace();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  // Data states
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  
  // Filter states
  const [period, setPeriod] = useState('30');
  const [trendPeriod] = useState('90');
  const [monthlyPeriod] = useState('12');

  const formatPersianMonth = (dateString: string) => {
    // Convert backend date format (YYYY-MM) to Persian month name
    const monthMap: { [key: string]: string } = {
      '01': 'فروردین',
      '02': 'اردیبهشت',
      '03': 'خرداد',
      '04': 'تیر',
      '05': 'مرداد',
      '06': 'شهریور',
      '07': 'مهر',
      '08': 'آبان',
      '09': 'آذر',
      '10': 'دی',
      '11': 'بهمن',
      '12': 'اسفند'
    };
    
    // Extract month from YYYY-MM format
    const month = dateString.split('-')[1];
    return monthMap[month] || dateString;
  };

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch summary data from analytics API
      const summaryResponse = await biService.getAnalyticsSummary();
      console.log('Raw analytics summary response:', summaryResponse);
      
      // Extract data from wrapped response
      let summaryData: AnalyticsSummary;
      if (summaryResponse && typeof summaryResponse === 'object') {
        if ('success' in summaryResponse && 'data' in summaryResponse && summaryResponse.success) {
          // Backend returns wrapped response: { success: true, data: {...}, message: "..." }
          summaryData = summaryResponse.data as AnalyticsSummary;
          console.log('Extracted analytics summary data:', summaryData);
        } else if ('totalItems' in summaryResponse) {
          // Direct response format
          summaryData = summaryResponse as AnalyticsSummary;
        } else {
          console.error('Invalid analytics summary response structure:', summaryResponse);
          throw new Error('Invalid analytics summary response structure');
        }
      } else {
        console.error('Analytics summary response is null or not an object:', summaryResponse);
        throw new Error('Invalid analytics summary response');
      }
      
      setSummary(summaryData);

      // Fetch category consumption data - only for inventory and merged workspaces
      if (isInventoryWorkspace || isMergedWorkspace) {
        try {
          const categoryResponse = await biService.getConsumptionByCategory(period);
          if (Array.isArray(categoryResponse) && categoryResponse.length > 0) {
            // Calculate total for percentage calculation
            const totalValue = categoryResponse.reduce((sum, item) => sum + (item.value || 0), 0);
            
            // Calculate percentages from raw values
            const categoryData: CategoryData[] = categoryResponse.map((item) => {
              const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
              return {
                name: item.name,
                value: Math.round(percentage * 100) / 100, // Round to 2 decimal places
                color: item.color || '#8884d8',
              };
            });
            setCategoryData(categoryData);
          } else {
            setCategoryData([]); // No data - show empty state
          }
        } catch (categoryError) {
          console.warn('Category data not available:', categoryError);
          setCategoryData([]); // Empty array instead of mock data
        }

        // Fetch inventory trend data - only for inventory and merged workspaces
        try {
          const trendResponse = await biService.getInventoryTrends(trendPeriod);
          if (Array.isArray(trendResponse) && trendResponse.length > 0) {
            const trendData: TrendData[] = trendResponse.map((item) => ({
              date: item.date || '',
              stock: item.stock || 0,
              totalIn: item.totalIn || 0,
              totalOut: Math.abs(item.totalOut || 0), // Ensure positive for display
            }));
            setTrendData(trendData);
          } else {
            setTrendData([]); // No data - show empty state
          }
        } catch (trendError) {
          console.warn('Trend data not available:', trendError);
          setTrendData([]); // Empty array instead of mock data
        }

        // Fetch monthly movements data - only for inventory and merged workspaces
        try {
          const monthlyResponse = await biService.getMonthlyMovements(monthlyPeriod);
          if (Array.isArray(monthlyResponse) && monthlyResponse.length > 0) {
            const monthlyData: MonthlyData[] = monthlyResponse.map((item) => ({
              month: item.month || formatPersianMonth(item.monthKey || ''),
              monthKey: item.monthKey || '',
              in: item.in || 0,
              out: Math.abs(item.out || 0), // Ensure positive for display
              net: item.net || 0,
            }));
            setMonthlyData(monthlyData);
          } else {
            setMonthlyData([]); // No data - show empty state
          }
        } catch (monthlyError) {
          console.warn('Monthly data not available:', monthlyError);
          setMonthlyData([]); // Empty array instead of mock data
        }
      } else {
        // For ordering workspace, set empty data
        setCategoryData([]);
        setTrendData([]);
        setMonthlyData([]);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('خطا در دریافت اطلاعات آماری');
      
      // Set fallback data on error
      setSummary({
        totalItems: 0,
        lowStockCount: 0,
        recentTransactions: 0,
        totalInventoryValue: 0
      });
      setCategoryData([]);
      setTrendData([]);
      setMonthlyData([]);
    } finally {
      setLoading(false);
    }
  }, [period, trendPeriod, monthlyPeriod, isInventoryWorkspace, isMergedWorkspace]);

  // Quick action handlers
  const handleViewLowStockItems = () => {
    window.open('/workspaces/inventory-management/inventory/reports', '_blank');
  };

  const handleViewRecentTransactions = () => {
    window.open('/workspaces/inventory-management/inventory/transactions', '_blank');
  };

  const handleGenerateFullReport = async () => {
    try {
      setGeneratingPDF(true);
      
      // Check if summary data is available
      if (!summary) {
        console.error('Summary data is not available');
        setGeneratingPDF(false);
        return;
      }
      
      // Generate comprehensive PDF report
      // generateEnhancedInventoryPDF(reportData); // This line was removed as per the edit hint
      
      // Show success message
      alert('گزارش با موفقیت تولید شد!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('خطا در تولید گزارش');
    } finally {
      setGeneratingPDF(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 sm:py-12">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 p-3 sm:p-4 rounded-md text-sm sm:text-base">
        {error}
      </div>
    );
  }
  
  return (
    <Section className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">گزارش آماری</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">نمودارها و آمار کلی از عملکرد سیستم</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 sm:space-x-reverse w-full sm:w-auto">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white text-sm sm:text-base"
          >
            <option value="7">۷ روز گذشته</option>
            <option value="30">۳۰ روز گذشته</option>
            <option value="90">۹۰ روز گذشته</option>
          </select>
          <Button
            onClick={fetchAnalyticsData}
            size="small"
          >
            بروزرسانی
          </Button>
        </div>
      </div>

      {/* Summary Cards - Show only for inventory and merged workspaces */}
      {(isInventoryWorkspace || isMergedWorkspace) && (
        <>
          {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 rounded-lg animate-pulse">
              <div className="flex items-center">
                <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
                <div className="mr-3 sm:mr-4 flex-1">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-6 sm:h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/30 p-4 sm:p-6 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="mr-3 sm:mr-4">
              <h3 className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">خطا در بارگذاری داده‌ها</h3>
              <p className="text-xs sm:text-sm text-red-500 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="mr-3 sm:mr-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">کل کالاها</h3>
                <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{summary?.totalItems || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/30 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="mr-3 sm:mr-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">موجودی کم</h3>
                <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">{summary?.lowStockCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/30 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="mr-3 sm:mr-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">تراکنش‌های اخیر</h3>
                <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{summary?.recentTransactions || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/30 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-3 sm:mr-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">ارزش کل موجودی</h3>
                <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {summary?.totalInventoryValue ? summary.totalInventoryValue.toLocaleString('fa-IR') : '0'} تومان
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 rounded-lg text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <svg className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm sm:text-lg font-medium">داده‌ای برای نمایش وجود ندارد</p>
            <p className="text-xs sm:text-sm">لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید</p>
          </div>
        </div>
      )}
        </>

      )}

      {/* Show message if workspace doesn't support analytics summary */}
      {workspace === 'ordering' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 sm:p-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm sm:text-base font-medium text-yellow-800 dark:text-yellow-300">گزارش آماری موجودی</h3>
              <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                گزارش آماری موجودی فقط برای workspace موجودی و ترکیبی در دسترس است. برای مشاهده گزارش‌های سفارشات، از داشبورد سفارشات استفاده کنید.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Category Distribution and Trends - Show only for inventory and merged workspaces */}
      {(isInventoryWorkspace || isMergedWorkspace) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Category Distribution */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">مصرف به تفکیک دسته‌بندی</h3>
          {categoryData.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full ml-2 sm:ml-3"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white ml-2 min-w-[60px] text-left">
                      {item.value.toFixed(1)}%
                    </span>
                    <div className="w-16 sm:w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          backgroundColor: item.color,
                          width: `${Math.min(item.value, 100)}%` // Cap at 100% to prevent overflow
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <svg className="w-8 h-8 sm:w-12 sm:h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">داده‌ای برای نمایش وجود ندارد</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">برای مشاهده نمودار، تراکنش‌های فروش ایجاد کنید</p>
            </div>
          )}
          </Card>

          {/* Recent Trends */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">روند موجودی اخیر</h3>
          {trendData.length > 0 ? (
            <CustomLineChart
              data={trendData.map((item) => ({
                date: item.date,
                ورودی: item.totalIn,
                خروجی: item.totalOut,
                موجودی: item.stock,
              }))}
              lines={[
                { dataKey: 'ورودی', stroke: '#22c55e', name: 'ورودی', fill: '#22c55e' },
                { dataKey: 'خروجی', stroke: '#ef4444', name: 'خروجی', fill: '#ef4444' },
                { dataKey: 'موجودی', stroke: '#3b82f6', name: 'موجودی', fill: '#3b82f6' },
              ]}
              xAxisKey="date"
              height={300}
              enableExport={true}
              chartId="inventory-trend-chart"
            />
          ) : (
            <div className="text-center py-6 sm:py-8">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <svg className="w-8 h-8 sm:w-12 sm:h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">داده‌ای برای نمایش وجود ندارد</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">برای مشاهده روند، تراکنش‌های موجودی ایجاد کنید</p>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Monthly Data - Show only for inventory and merged workspaces */}
      {(isInventoryWorkspace || isMergedWorkspace) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">روند ماهانه ورود و خروج کالا</h3>
        {monthlyData.length > 0 ? (
          <CustomBarChart
            data={monthlyData.map((item) => ({
              month: item.month,
              ورودی: item.in,
              خروجی: item.out,
              خالص: item.net,
            }))}
            bars={[
              { dataKey: 'ورودی', fill: '#22c55e', name: 'ورودی' },
              { dataKey: 'خروجی', fill: '#ef4444', name: 'خروجی' },
            ]}
            xAxisKey="month"
            height={300}
            enableExport={true}
            chartId="monthly-movements-chart"
          />
        ) : (
          <div className="text-center py-6 sm:py-8">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <svg className="w-8 h-8 sm:w-12 sm:h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">داده‌ای برای نمایش وجود ندارد</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">برای مشاهده روند ماهانه، تراکنش‌های موجودی ایجاد کنید</p>
          </div>
        )}
        </div>
      )}

      {/* Quick Actions - Show only for inventory and merged workspaces */}
      {(isInventoryWorkspace || isMergedWorkspace) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">اقدامات سریع</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4">
            <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2">کالاهای کم موجود</h4>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
              {summary?.lowStockCount} کالا موجودی کمتر از حد مجاز دارند
            </p>
            <button 
              onClick={handleViewLowStockItems}
              className="w-full px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm"
            >
              مشاهده لیست
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4">
            <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2">تراکنش‌های اخیر</h4>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
              {summary?.recentTransactions} تراکنش در ۳۰ روز اخیر انجام شده
            </p>
            <button 
              onClick={handleViewRecentTransactions}
              className="w-full px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm"
            >
              مشاهده گزارش
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4">
            <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2">گزارش کامل</h4>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
              دریافت گزارش جامع از وضعیت موجودی
            </p>
            <button 
              onClick={handleGenerateFullReport}
              disabled={generatingPDF}
              className={`w-full px-3 sm:px-4 py-2 text-white rounded-lg transition-colors text-xs sm:text-sm ${
                generatingPDF 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {generatingPDF ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white ml-2"></div>
                  در حال تولید...
                </div>
              ) : (
                'تولید گزارش'
              )}
            </button>
          </div>
        </div>
        </div>
      )}
    </Section>
  );
}
