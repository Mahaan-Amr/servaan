'use client';

import { useState, useEffect, useCallback } from 'react';
import { AccountingService } from '../../../../services/accountingService';
import { FarsiDatePicker } from '../../../../components/ui/FarsiDatePicker';

interface TrialBalanceAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  debitBalance: number;
  creditBalance: number;
}

interface TrialBalance {
  asOfDate: string;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  accounts: TrialBalanceAccount[];
}

export default function TrialBalancePage() {
  const [loading, setLoading] = useState(true);
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountTypes, setSelectedAccountTypes] = useState<string[]>([]);

  const loadTrialBalance = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AccountingService.getTrialBalance(asOfDate);
      setTrialBalance({
        asOfDate: data.asOfDate,
        totalDebits: data.totalDebits,
        totalCredits: data.totalCredits,
        isBalanced: data.isBalanced,
        accounts: (data.accounts || []).map(acc => ({
          id: acc.accountId,
          accountCode: acc.accountCode,
          accountName: acc.accountName,
          accountType: acc.accountType as 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE',
          debitBalance: acc.debitBalance,
          creditBalance: acc.creditBalance
        }))
      });
    } catch (error) {
      console.error('Error loading trial balance:', error);
      setTrialBalance(null);
    } finally {
      setLoading(false);
    }
  }, [asOfDate]);

  useEffect(() => {
    loadTrialBalance();
  }, [loadTrialBalance]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount);
  };

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      'ASSET': 'دارایی',
      'LIABILITY': 'بدهی',
      'EQUITY': 'حقوق صاحبان سهام',
      'REVENUE': 'درآمد',
      'EXPENSE': 'هزینه'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      'ASSET': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'LIABILITY': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'EQUITY': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'REVENUE': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'EXPENSE': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleTypeToggle = (type: string) => {
    if (selectedAccountTypes.includes(type)) {
      setSelectedAccountTypes(selectedAccountTypes.filter(t => t !== type));
    } else {
      setSelectedAccountTypes([...selectedAccountTypes, type]);
    }
  };

  const filteredAccounts = trialBalance?.accounts.filter(account => {
    const matchesSearch = account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.accountCode.includes(searchTerm);
    const matchesType = selectedAccountTypes.length === 0 || selectedAccountTypes.includes(account.accountType);
    return matchesSearch && matchesType;
  }) || [];

  const filteredTotalDebits = filteredAccounts.reduce((sum, account) => sum + account.debitBalance, 0);
  const filteredTotalCredits = filteredAccounts.reduce((sum, account) => sum + account.creditBalance, 0);

  const accountTypes = [
    { value: 'ASSET', label: 'دارایی‌ها' },
    { value: 'LIABILITY', label: 'بدهی‌ها' },
    { value: 'EQUITY', label: 'حقوق صاحبان سهام' },
    { value: 'REVENUE', label: 'درآمدها' },
    { value: 'EXPENSE', label: 'هزینه‌ها' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-green-500"></div>
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
              تراز آزمایشی
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              مانده کلیه حساب‌های دفتر کل
            </p>
          </div>
          <button className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base whitespace-nowrap">
            صدور گزارش
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <div>
            <FarsiDatePicker
              label="تا تاریخ"
              value={asOfDate}
              onChange={(value) => setAsOfDate(value)}
              placeholder="تا تاریخ را انتخاب کنید"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              جستجو
            </label>
            <div className="relative">
              <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="جستجو در حساب‌ها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-8 sm:pr-10 pl-3 sm:pl-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              بروزرسانی
            </label>
            <button
              onClick={loadTrialBalance}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              بروزرسانی داده‌ها
            </button>
          </div>
        </div>

        {/* Account Type Filters */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            فیلتر بر اساس نوع حساب
          </label>
          <div className="flex flex-wrap gap-2">
            {accountTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTypeToggle(type.value)}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  selectedAccountTypes.includes(type.value)
                    ? getAccountTypeColor(type.value)
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Balance Status */}
      {trialBalance && (
        <div className={`p-3 sm:p-4 rounded-lg border ${
          trialBalance.isBalanced 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ml-2 ${
                trialBalance.isBalanced ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={`text-sm sm:text-base font-medium ${
                trialBalance.isBalanced 
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {trialBalance.isBalanced ? 'تراز متعادل است' : 'تراز متعادل نیست'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 sm:space-x-reverse text-xs sm:text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">مجموع بدهکار: </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(trialBalance.totalDebits)} تومان
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">مجموع بستانکار: </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(trialBalance.totalCredits)} تومان
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trial Balance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            تراز آزمایشی - {new Date(asOfDate).toLocaleDateString('fa-IR')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            نمایش {filteredAccounts.length} حساب از {trialBalance?.accounts.length || 0} حساب
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  کد حساب
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  نام حساب
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  مانده بدهکار
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  مانده بستانکار
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    {account.accountCode}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                        {account.accountName}
                      </div>
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getAccountTypeColor(account.accountType)}`}>
                        {getAccountTypeLabel(account.accountType)}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right">
                    {account.debitBalance > 0 ? (
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(account.debitBalance)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right">
                    {account.creditBalance > 0 ? (
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(account.creditBalance)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-gray-700">
              <tr className="font-semibold">
                <td colSpan={2} className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 dark:text-white">
                  جمع کل ({filteredAccounts.length} حساب)
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-right text-gray-900 dark:text-white">
                  {formatCurrency(filteredTotalDebits)}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-right text-gray-900 dark:text-white">
                  {formatCurrency(filteredTotalCredits)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">تعداد حساب‌ها</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{trialBalance?.accounts.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">وضعیت تراز</p>
              <p className={`text-lg sm:text-xl font-bold ${trialBalance?.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                {trialBalance?.isBalanced ? 'متعادل' : 'نامتعادل'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">اختلاف</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(Math.abs((trialBalance?.totalDebits || 0) - (trialBalance?.totalCredits || 0)))} تومان
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 