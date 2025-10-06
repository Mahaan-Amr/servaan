'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// import { useAuth } from '../../../../../contexts/AuthContext';
import { AccountingService } from '../../../../../services/accountingService';

interface ChartOfAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  normalBalance: 'DEBIT' | 'CREDIT';
  description?: string;
  children?: ChartOfAccount[]; // Added for hierarchical structure
}

interface JournalEntryLineForm {
  id: string;
  accountId: string;
  account?: ChartOfAccount;
  description: string;
  debitAmount: number;
  creditAmount: number;
}

export default function CreateJournalEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  
  // Form data
  const [entryNumber, setEntryNumber] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState<JournalEntryLineForm[]>([
    {
      id: '1',
      accountId: '',
      description: '',
      debitAmount: 0,
      creditAmount: 0,
    },
    {
      id: '2',
      accountId: '',
      description: '',
      debitAmount: 0,
      creditAmount: 0,
    }
  ]);

  const flattenAccounts = React.useCallback((accounts: ChartOfAccount[]): ChartOfAccount[] => {
    const result: ChartOfAccount[] = [];
    for (const acc of accounts) {
      if (acc.children && acc.children.length > 0) {
        result.push(...flattenAccounts(acc.children));
      } else {
        result.push(acc);
      }
    }
    return result;
  }, []);

  const loadInitialData = React.useCallback(async () => {
    try {
      // Fetch real accounts from backend and flatten
      const hierarchy = await AccountingService.getAccountHierarchy();
      setAccounts(flattenAccounts(hierarchy));
      setEntryNumber(`JE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [flattenAccounts]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

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

  const updateLine = (
    index: number,
    field: 'accountId' | 'account' | 'description' | 'debitAmount' | 'creditAmount',
    value: string | ChartOfAccount | number
  ) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    setLines(newLines);
  };

  const handleAccountSelect = (index: number) => {
    setSelectedLineIndex(index);
    setShowAccountModal(true);
  };

  const handleAccountSelected = (account: ChartOfAccount) => {
    if (selectedLineIndex !== null) {
      setLines(prevLines => {
        const newLines = [...prevLines];
        newLines[selectedLineIndex] = {
          ...newLines[selectedLineIndex],
          accountId: account.id,
          account: account
        };
        return newLines;
      });
    }
    setShowAccountModal(false);
    setSelectedLineIndex(null);
  };

  const addLine = () => {
    const newLine: JournalEntryLineForm = {
      id: String(lines.length + 1),
      accountId: '',
      description: '',
      debitAmount: 0,
      creditAmount: 0,
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      const newLines = lines.filter((_, i) => i !== index);
      setLines(newLines);
    }
  };

  const calculateTotals = () => {
    const totalDebit = lines.reduce((sum, line) => sum + line.debitAmount, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.creditAmount, 0);
    return { totalDebit, totalCredit };
  };

  const validateForm = (): string | null => {
    if (!description.trim()) return 'شرح سند الزامی است';
    if (!entryDate) return 'تاریخ سند الزامی است';

    // Each line must have only one of debit or credit filled
    const invalidLines = lines.filter(line =>
      line.debitAmount > 0 && line.creditAmount > 0
    );
    if (invalidLines.length > 0) return 'در هر ردیف فقط یکی از بدهکار یا بستانکار باید مقدار داشته باشد.';

    const validLines = lines.filter(line =>
      line.accountId && (
        (line.debitAmount > 0 && line.creditAmount === 0) ||
        (line.creditAmount > 0 && line.debitAmount === 0)
      )
    );

    if (validLines.length < 2) return 'حداقل دو ردیف با حساب و مبلغ الزامی است';

    const { totalDebit, totalCredit } = calculateTotals();
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return 'مجموع بدهکار و بستانکار باید برابر باشند';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setSaving(true);
    try {
      // Real API call to create journal entry
      await AccountingService.createJournalEntry({
        entryDate,
        description,
        reference,
        lines: lines.map((line, idx) => ({
          accountId: line.accountId,
          description: line.description,
          debitAmount: line.debitAmount,
          creditAmount: line.creditAmount,
          lineNumber: idx + 1
        }))
      });
      alert('سند حسابداری با موفقیت ثبت شد');
      router.push('/workspaces/accounting-system/journal-entries');
    } catch (error) {
      console.error('Error saving journal entry:', error);
      alert('خطا در ثبت سند حسابداری');
    } finally {
      setSaving(false);
    }
  };

  const { totalDebit, totalCredit } = calculateTotals();
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

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
              ثبت سند حسابداری جدید
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
              ایجاد سند حسابداری جدید
                </p>
          </div>
          <Link
            href="/workspaces/accounting-system/journal-entries"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            بازگشت
          </Link>
                  </div>
                </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Entry Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">اطلاعات کلی سند</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                شماره سند *
              </label>
              <input
                type="text"
                value={entryNumber}
                onChange={(e) => setEntryNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تاریخ سند *
                  </label>
                    <input
                      type="date"
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                شرح سند *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
                placeholder="شرح کامل سند حسابداری..."
                required
              />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                مرجع
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
                placeholder="شماره فاکتور، قرارداد و..."
                  />
                </div>
              </div>
            </div>

            {/* Journal Entry Lines */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">ردیف‌های سند</h2>
            <button
              type="button"
              onClick={addLine}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              افزودن ردیف
            </button>
          </div>

          <div className="space-y-4">
            {lines.map((line, index) => (
              <div key={line.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">سطر {index + 1}</h4>
                  {index > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      حذف
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Account Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      حساب *
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAccountSelect(index)}
                      className="w-full text-right px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
                    >
                      {line.account ? `${line.account.accountCode} - ${line.account.accountName}` : 'انتخاب حساب...'}
                    </button>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      شرح
                    </label>
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => updateLine(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
                      placeholder="شرح تفصیلی..."
                    />
                  </div>

                  {/* Debit Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      بدهکار
                    </label>
                    <input
                      type="number"
                      value={line.debitAmount}
                      onChange={(e) => updateLine(index, 'debitAmount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  {/* Credit Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      بستانکار
                    </label>
                    <input
                      type="number"
                      value={line.creditAmount}
                      onChange={(e) => updateLine(index, 'creditAmount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
                ))}
              </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white">مجموع بدهکار</h4>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalDebit)} تومان
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white">مجموع بستانکار</h4>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalCredit)} تومان
                </p>
              </div>
              <div className={`p-4 rounded-lg ${isBalanced ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
                <h4 className="font-medium text-gray-900 dark:text-white">وضعیت تراز</h4>
                <p className={`text-xl font-bold ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  {isBalanced ? 'متعادل' : 'نامتعادل'}
                </p>
              </div>
            </div>
          </div>
            </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4 space-x-reverse">
              <Link
            href="/workspaces/accounting-system/journal-entries"
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
            لغو
              </Link>
              <button
                type="submit"
                disabled={saving || !isBalanced}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'در حال ذخیره...' : 'ثبت سند'}
              </button>
            </div>
          </form>

      {/* Account Selection Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">انتخاب حساب</h3>
                <button
                  onClick={() => setShowAccountModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-96 p-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => handleAccountSelected(account)}
                  className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {account.accountCode}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          account.accountType === 'ASSET' ? 'bg-blue-100 text-blue-800' :
                          account.accountType === 'LIABILITY' ? 'bg-red-100 text-red-800' :
                          account.accountType === 'EQUITY' ? 'bg-purple-100 text-purple-800' :
                          account.accountType === 'REVENUE' ? 'bg-green-100 text-green-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {getAccountTypeLabel(account.accountType)}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{account.accountName}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {account.normalBalance === 'DEBIT' ? 'بدهکار' : 'بستانکار'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
  );
} 