'use client';

import React, { useState, useEffect } from 'react';
import { AccountingService } from '../../../../services/accountingService';

export default function FinancialStatementsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'balance-sheet' | 'income-statement'>('balance-sheet');
  const [financialData, setFinancialData] = useState<{
    assets: { current: number; nonCurrent: number; total: number; };
    liabilities: { current: number; nonCurrent: number; total: number; };
    equity: { capital: number; retainedEarnings: number; total: number; };
    income: { revenue: number; grossProfit: number; operatingExpenses: number; netIncome: number; };
  } | null>(null);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      // Fetch balance sheet
      const balanceSheet = await AccountingService.generateBalanceSheet();
      // Fetch income statement (use current year as default)
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      const today = now.toISOString().split('T')[0];
      const incomeStatement = await AccountingService.generateIncomeStatement(yearStart, today);
      setFinancialData({
        assets: {
          current: balanceSheet.assets.currentAssets.reduce((sum, a) => sum + (a.balance || 0), 0),
          nonCurrent: balanceSheet.assets.fixedAssets.reduce((sum, a) => sum + (a.balance || 0), 0),
          total: balanceSheet.assets.totalAssets || 0
        },
        liabilities: {
          current: balanceSheet.liabilities.currentLiabilities.reduce((sum, a) => sum + (a.balance || 0), 0),
          nonCurrent: balanceSheet.liabilities.longTermLiabilities.reduce((sum, a) => sum + (a.balance || 0), 0),
          total: balanceSheet.liabilities.totalLiabilities || 0
        },
        equity: {
          capital: balanceSheet.equity.equityAccounts.reduce((sum, a) => sum + (a.balance || 0), 0),
          retainedEarnings: 0, // Optionally map from a specific account if available
          total: balanceSheet.equity.totalEquity || 0
        },
        income: {
          revenue: incomeStatement.revenue.totalRevenue || 0,
          grossProfit: incomeStatement.grossProfit || 0,
          operatingExpenses: incomeStatement.expenses.totalExpenses || 0,
          netIncome: incomeStatement.netIncome || 0
        }
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
      setFinancialData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="text-center py-8 sm:py-12 p-4">
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">خطا در بارگذاری اطلاعات مالی</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              صورت‌های مالی
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              ترازنامه و صورت سود و زیان
                  </p>
                </div>
          <button className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base whitespace-nowrap">
            صدور گزارش
                </button>
              </div>
            </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('balance-sheet')}
              className={`py-3 sm:py-4 px-4 sm:px-6 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'balance-sheet'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              ترازنامه
            </button>
            <button
              onClick={() => setActiveTab('income-statement')}
              className={`py-3 sm:py-4 px-4 sm:px-6 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'income-statement'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              صورت سود و زیان
            </button>
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'balance-sheet' && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white text-center">
                ترازنامه
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                {/* Assets */}
              <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-center bg-blue-50 dark:bg-blue-900/20 py-2 rounded">
                    دارایی‌ها
                  </h3>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">دارایی‌های جاری</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">موجودی نقد</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(5000000)}</span>
              </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">حساب‌های دریافتنی</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(8000000)}</span>
              </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">موجودی کالا</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(2000000)}</span>
              </div>
                        <div className="flex justify-between font-semibold pt-2 border-t border-gray-300 dark:border-gray-600">
                          <span className="text-gray-900 dark:text-white">جمع دارایی‌های جاری</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(financialData.assets.current)}</span>
              </div>
            </div>
          </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">دارایی‌های غیرجاری</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">املاک و ساختمان</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(20000000)}</span>
            </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">ماشین‌آلات</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(5000000)}</span>
            </div>
                        <div className="flex justify-between font-semibold pt-2 border-t border-gray-300 dark:border-gray-600">
                          <span className="text-gray-900 dark:text-white">جمع دارایی‌های غیرجاری</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(financialData.assets.nonCurrent)}</span>
              </div>
            </div>
                    </div>

                    <div className="bg-blue-100 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
                      <div className="flex justify-between font-bold text-base sm:text-lg">
                        <span className="text-gray-900 dark:text-white">جمع کل دارایی‌ها</span>
                        <span className="text-gray-900 dark:text-white">{formatCurrency(financialData.assets.total)}</span>
                    </div>
                    </div>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-center bg-red-50 dark:bg-red-900/20 py-2 rounded">
                    بدهی‌ها و حقوق مالکیت
                  </h3>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">بدهی‌های جاری</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">حساب‌های پرداختنی</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(5000000)}</span>
                        </div>
                    <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">اسناد پرداختنی</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(3000000)}</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-2 border-t border-gray-300 dark:border-gray-600">
                          <span className="text-gray-900 dark:text-white">جمع بدهی‌های جاری</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(financialData.liabilities.current)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">بدهی‌های غیرجاری</h4>
                      <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">وام‌های بلندمدت</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(12000000)}</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-2 border-t border-gray-300 dark:border-gray-600">
                          <span className="text-gray-900 dark:text-white">جمع بدهی‌های غیرجاری</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(financialData.liabilities.nonCurrent)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">حقوق مالکیت</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">سرمایه</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(financialData.equity.capital)}</span>
                    </div>
                    <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">سود انباشته</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(financialData.equity.retainedEarnings)}</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-2 border-t border-gray-300 dark:border-gray-600">
                          <span className="text-gray-900 dark:text-white">جمع حقوق مالکیت</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(financialData.equity.total)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg">
                      <div className="flex justify-between font-bold text-lg">
                        <span className="text-gray-900 dark:text-white">جمع بدهی‌ها و حقوق مالکیت</span>
                        <span className="text-gray-900 dark:text-white">
                          {formatCurrency(financialData.liabilities.total + financialData.equity.total)}
                      </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'income-statement' && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white text-center">
                صورت سود و زیان
              </h2>
              
              <div className="max-w-2xl mx-auto">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 sm:p-6 rounded-lg space-y-3 sm:space-y-4">
                  <div className="flex justify-between text-base sm:text-lg">
                    <span className="text-gray-900 dark:text-white font-medium">درآمد فروش</span>
                    <span className="text-gray-900 dark:text-white font-semibold">{formatCurrency(financialData.income.revenue)}</span>
                </div>

                    <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">بهای تمام شده کالای فروش رفته</span>
                    <span className="text-gray-900 dark:text-white">({formatCurrency(financialData.income.revenue - financialData.income.grossProfit)})</span>
                  </div>
                  
                  <div className="flex justify-between text-base sm:text-lg font-semibold border-t border-gray-300 dark:border-gray-600 pt-2">
                    <span className="text-gray-900 dark:text-white">سود ناخالص</span>
                    <span className="text-green-600 dark:text-green-400">{formatCurrency(financialData.income.grossProfit)}</span>
                    </div>
                  
                    <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">هزینه‌های عملیاتی</span>
                    <span className="text-gray-900 dark:text-white">({formatCurrency(financialData.income.operatingExpenses)})</span>
                    </div>
                  
                  <div className="flex justify-between text-base sm:text-lg font-semibold border-t border-gray-300 dark:border-gray-600 pt-2">
                    <span className="text-gray-900 dark:text-white">سود عملیاتی</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {formatCurrency(financialData.income.grossProfit - financialData.income.operatingExpenses)}
                      </span>
                    </div>
                  
                  <div className="flex justify-between text-lg sm:text-xl font-bold bg-green-100 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg border-t border-gray-300 dark:border-gray-600">
                    <span className="text-gray-900 dark:text-white">سود خالص</span>
                    <span className="text-green-600 dark:text-green-400">{formatCurrency(financialData.income.netIncome)}</span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {((financialData.income.grossProfit / financialData.income.revenue) * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">حاشیه سود ناخالص</p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                      {((financialData.income.netIncome / financialData.income.revenue) * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">حاشیه سود خالص</p>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-lg text-center">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {((financialData.income.operatingExpenses / financialData.income.revenue) * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">نسبت هزینه‌های عملیاتی</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 