'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { AccountingService } from '../../../../services/accountingService';

interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  status: 'DRAFT' | 'POSTED' | 'REVERSED'; // Allow REVERSED
  reference?: string;
  createdAt: string;
  createdBy: string;
  approvedAt?: string;
  approvedBy?: string;
  lines: JournalEntryLine[];
}

interface JournalEntryLine {
  id: string;
  accountCode: string;
  accountName: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
}

interface ChartOfAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  normalBalance: 'DEBIT' | 'CREDIT';
  children?: ChartOfAccount[];
}

export default function JournalEntriesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  // Add state for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEntry, setEditEntry] = useState<JournalEntry | null>(null);

  // Edit form state
  const [editEntryState, setEditEntryState] = useState<{
    entryDate: string;
    description: string;
    reference: string;
    lines: Array<{
      id: string;
      accountId: string;
      account?: ChartOfAccount | null;
      description: string;
      debitAmount: number;
      creditAmount: number;
    }>;
  } | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Add state for accounts and account modal in the component
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedEditLineIndex, setSelectedEditLineIndex] = useState<number | null>(null);

  // When opening edit modal, populate state
  useEffect(() => {
    if (showEditModal && editEntry) {
      setEditEntryState({
        entryDate: editEntry.entryDate.split('T')[0],
        description: editEntry.description,
        reference: editEntry.reference || '',
        lines: editEntry.lines.map((line, idx) => ({
          id: line.id || String(idx + 1),
          accountId: line.accountCode, // Will be fixed below
          description: line.description || '',
          debitAmount: line.debitAmount,
          creditAmount: line.creditAmount,
        }))
      });
    }
  }, [showEditModal, editEntry]);

  // When opening edit modal, map accountCode to accountId
  useEffect(() => {
    if (showEditModal && editEntry && accounts.length > 0) {
      setEditEntryState({
        entryDate: editEntry.entryDate.split('T')[0],
        description: editEntry.description,
        reference: editEntry.reference || '',
        lines: editEntry.lines.map((line, idx) => {
          const acc = accounts.find(a => a.accountCode === line.accountCode);
          return {
            id: line.id || String(idx + 1),
            accountId: acc ? acc.id : '',
            account: acc || null,
            description: line.description || '',
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
          };
        })
      });
    }
  }, [showEditModal, editEntry, accounts]);

  // Helper to update edit form lines
  const updateEditLine = (
    index: number,
    field: 'accountId' | 'account' | 'description' | 'debitAmount' | 'creditAmount',
    value: string | ChartOfAccount | number
  ) => {
    setEditEntryState(prev => {
      if (!prev) return prev;
      const newLines = [...prev.lines];
      newLines[index] = { ...newLines[index], [field]: value };
      return { ...prev, lines: newLines };
    });
  };

  // Edit form validation (reuse logic)
  const validateEditForm = () => {
    if (!editEntryState?.description?.trim()) return 'شرح سند الزامی است';
    if (!editEntryState?.entryDate) return 'تاریخ سند الزامی است';
    const invalidLines = editEntryState?.lines.filter(line => line.debitAmount > 0 && line.creditAmount > 0) || [];
    if (invalidLines.length > 0) return 'در هر ردیف فقط یکی از بدهکار یا بستانکار باید مقدار داشته باشد.';
    const validLines = editEntryState?.lines.filter(line =>
      line.accountId && (
        (line.debitAmount > 0 && line.creditAmount === 0) ||
        (line.creditAmount > 0 && line.debitAmount === 0)
      )
    ) || [];
    if (validLines.length < 2) return 'حداقل دو ردیف با حساب و مبلغ الزامی است';
    const totalDebit = editEntryState?.lines.reduce((sum, line) => sum + line.debitAmount, 0) || 0;
    const totalCredit = editEntryState?.lines.reduce((sum, line) => sum + line.creditAmount, 0) || 0;
    if (Math.abs(totalDebit - totalCredit) > 0.01) return 'مجموع بدهکار و بستانکار باید برابر باشند';
    return null;
  };

  // Edit form submit
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationError = validateEditForm();
    if (validationError) {
      alert(validationError);
      return;
    }
    setEditSaving(true);
    try {
      if (!editEntry || !editEntryState) return;
      await AccountingService.updateJournalEntry(editEntry.id, {
        entryDate: new Date(editEntryState.entryDate).toISOString(),
        description: editEntryState.description,
        reference: editEntryState.reference,
        lines: editEntryState.lines.map((line, idx) => ({
          accountId: line.accountId,
          description: line.description,
          debitAmount: line.debitAmount,
          creditAmount: line.creditAmount,
          lineNumber: idx + 1
        }))
      });
      alert('سند با موفقیت ویرایش شد');
      setShowEditModal(false);
      setEditEntry(null);
      setEditEntryState(null);
      await fetchJournalEntries();
    } catch {
      alert('خطا در ویرایش سند');
    } finally {
      setEditSaving(false);
    }
  };

  const fetchJournalEntries = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {};
      
      // Add account filter if present
      if (accountFilter) {
        params.accountId = accountFilter;
      }
      
      const data = await AccountingService.getJournalEntries(params);
      const entries = (data.entries || []).map(entry => ({
        id: entry.id,
        entryNumber: entry.entryNumber,
        entryDate: entry.entryDate,
        description: entry.description,
        totalDebit: entry.totalDebit,
        totalCredit: entry.totalCredit,
        status: entry.status,
        reference: entry.reference,
        createdAt: entry.createdAt,
        createdBy: entry.createdByUser?.name || '',
        approvedAt: entry.approvedAt,
        approvedBy: entry.approvedByUser?.name || '',
        lines: (entry.lines || []).map(line => ({
          id: line.id,
          accountCode: line.account?.accountCode || '',
          accountName: line.account?.accountName || '',
          description: line.description || '',
          debitAmount: Number(line.debitAmount),
          creditAmount: Number(line.creditAmount)
        }))
      }));
      setEntries(entries);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [accountFilter]);

  useEffect(() => {
    // Get account filter from URL query parameter
    const accountParam = searchParams.get('account');
    if (accountParam) {
      setAccountFilter(accountParam);
      // Fetch account name for display
      fetchAccountName(accountParam);
    }
    fetchJournalEntries();
  }, [searchParams, fetchJournalEntries]);

  const fetchAccountName = async (accountId: string) => {
    try {
      const account = await AccountingService.getAccountById(accountId);
      setAccountName(account.accountName);
    } catch (error) {
      console.error('Error fetching account name:', error);
      setAccountName('');
    }
  };

  const handleViewEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowViewModal(true);
  };

  const handleApproveEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowApproveModal(true);
  };

  const confirmApproveEntry = async () => {
    if (!selectedEntry) return;
    
    try {
      setProcessing(true);
      await AccountingService.postJournalEntry(selectedEntry.id);
      
      // Refresh the entries list
      await fetchJournalEntries();
      
      setShowApproveModal(false);
      setSelectedEntry(null);
      
      // Show success message
      alert('سند با موفقیت تایید و ثبت شد');
    } catch (error) {
      console.error('Error approving journal entry:', error);
      alert('خطا در تایید سند');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchJournalEntries();
  }, [fetchJournalEntries]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'DRAFT': 'پیش‌نویس',
      'POSTED': 'تایید شده',
      'REVERSED': 'لغو شده'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'DRAFT': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'POSTED': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'REVERSED': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handler for edit
  const handleEditEntry = (entry: JournalEntry) => {
    setEditEntry(entry);
    setShowEditModal(true);
  };

  // Handler for delete
  const handleDeleteEntry = async (entry: JournalEntry) => {
    if (!window.confirm('آیا از حذف این سند مطمئن هستید؟')) return;
    try {
      await AccountingService.deleteJournalEntry(entry.id);
      alert('سند با موفقیت حذف شد');
      await fetchJournalEntries();
    } catch {
      alert('خطا در حذف سند');
    }
  };

  // Edit modal: handle account select
  const handleEditAccountSelect = (lineIndex: number) => {
    setSelectedEditLineIndex(lineIndex);
    setShowAccountModal(true);
  };
  const handleEditAccountSelected = (account: ChartOfAccount) => {
    if (selectedEditLineIndex !== null && editEntryState) {
      updateEditLine(selectedEditLineIndex, 'accountId', account.id);
      updateEditLine(selectedEditLineIndex, 'account', account);
    }
    setShowAccountModal(false);
    setSelectedEditLineIndex(null);
  };

  // Fetch accounts on mount
  const fetchAccounts = useCallback(async () => {
    try {
      const hierarchy = await AccountingService.getAccountHierarchy();
      const flatten = (accs: ChartOfAccount[]): ChartOfAccount[] => accs.flatMap(acc => acc.children && acc.children.length > 0 ? flatten(acc.children) : [acc]);
      setAccounts(flatten(hierarchy));
    } catch {
      setAccounts([]);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

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
              اسناد حسابداری
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              مدیریت و مشاهده اسناد حسابداری
            </p>
            {accountFilter && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                  🔍 نمایش اسناد مربوط به حساب: {accountName || 'در حال بارگذاری...'}
                </p>
                <Link 
                  href="/workspaces/accounting-system/journal-entries"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  مشاهده همه اسناد
                </Link>
              </div>
            )}
          </div>
          <Link
            href="/workspaces/accounting-system/journal-entries/create"
            className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base whitespace-nowrap"
          >
            ثبت سند جدید
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="جستجو در اسناد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-8 sm:pr-10 pl-3 sm:pl-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="DRAFT">پیش‌نویس</option>
            <option value="POSTED">تایید شده</option>
            <option value="REVERSED">لغو شده</option>
          </select>
        </div>
      </div>

      {/* Journal Entries List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredEntries.map((entry) => (
          <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse mb-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    سند شماره {entry.entryNumber}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)} self-start`}>
                    {getStatusLabel(entry.status)}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {entry.description}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 sm:space-x-reverse text-xs sm:text-sm text-gray-500">
                  <span>تاریخ: {new Date(entry.entryDate).toLocaleDateString('fa-IR')}</span>
                  <span>مبلغ: {formatCurrency(entry.totalDebit)}</span>
                  {entry.reference && <span>مرجع: {entry.reference}</span>}
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-2">
                <button 
                  onClick={() => handleViewEntry(entry)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded" 
                  title="مشاهده جزئیات"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                {entry.status === 'DRAFT' && (user?.role === 'ADMIN' || user?.role === 'MANAGER' || entry.createdBy === user?.name) && (
                  <>
                    <button
                      onClick={() => handleEditEntry(entry)}
                      className="px-2 py-1 text-xs sm:text-sm text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded"
                      title="ویرایش"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry)}
                      className="px-2 py-1 text-xs sm:text-sm text-red-600 hover:text-red-900 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                      title="حذف"
                    >
                      حذف
                    </button>
                  </>
                )}
                {entry.status === 'DRAFT' && (
                  <button 
                    onClick={() => handleApproveEntry(entry)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded" 
                    title="تایید و ثبت"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">
                ردیف‌های سند ({entry.lines.length} ردیف)
              </h4>
              <div className="space-y-2">
                {entry.lines.map((line) => (
                  <div key={line.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm gap-1 sm:gap-0">
                    <div className="flex-1">
                      <span className="text-gray-900 dark:text-white">
                        {line.accountCode} - {line.accountName}
                      </span>
                      {line.description && (
                        <span className="text-gray-500 mr-2">- {line.description}</span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:space-x-4 sm:space-x-reverse gap-1 sm:gap-0">
                      {line.debitAmount > 0 && (
                        <span className="text-green-600">
                          بدهکار: {formatCurrency(line.debitAmount)}
                        </span>
                      )}
                      {line.creditAmount > 0 && (
                        <span className="text-red-600">
                          بستانکار: {formatCurrency(line.creditAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <div>ایجاد شده توسط: {entry.createdBy}</div>
                <div>تاریخ ایجاد: {new Date(entry.createdAt).toLocaleDateString('fa-IR')}</div>
                {entry.approvedBy && (
                  <>
                    <div>تایید شده توسط: {entry.approvedBy}</div>
                    <div>تاریخ تایید: {entry.approvedAt ? new Date(entry.approvedAt).toLocaleDateString('fa-IR') : '-'}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">هیچ سند حسابداری یافت نشد.</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">خلاصه اسناد</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
              {entries.filter(e => e.status === 'POSTED').length}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">تایید شده</p>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600 mb-1">
              {entries.filter(e => e.status === 'DRAFT').length}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">پیش‌نویس</p>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-600 mb-1">
              {entries.filter(e => e.status === 'REVERSED').length}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">لغو شده</p>
          </div>
        </div>
      </div>

      {/* View Entry Modal */}
      {showViewModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                جزئیات سند: {selectedEntry.entryNumber}
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">شماره سند:</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{selectedEntry.entryNumber}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">وضعیت:</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedEntry.status)}`}>
                    {getStatusLabel(selectedEntry.status)}
                  </span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">تاریخ:</p>
                  <p className="text-base sm:text-lg text-gray-900 dark:text-white">{new Date(selectedEntry.entryDate).toLocaleDateString('fa-IR')}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">مبلغ کل:</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(selectedEntry.totalDebit)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">شرح:</p>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white">{selectedEntry.description}</p>
                </div>
                {selectedEntry.reference && (
                  <div className="sm:col-span-2">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">مرجع:</p>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white">{selectedEntry.reference}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">ردیف‌های سند</h3>
                <div className="space-y-3">
                  {selectedEntry.lines.map((line, index) => (
                    <div key={line.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {line.accountCode} - {line.accountName}
                            </span>
                            <span className="text-xs text-gray-500">(ردیف {index + 1})</span>
                          </div>
                          {line.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{line.description}</p>
                          )}
                        </div>
                        <div className="flex space-x-4 space-x-reverse">
                          {line.debitAmount > 0 && (
                            <span className="text-green-600 font-medium">
                              بدهکار: {formatCurrency(line.debitAmount)}
                            </span>
                          )}
                          {line.creditAmount > 0 && (
                            <span className="text-red-600 font-medium">
                              بستانکار: {formatCurrency(line.creditAmount)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">ایجاد شده توسط:</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedEntry.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">تاریخ ایجاد:</p>
                    <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedEntry.createdAt).toLocaleDateString('fa-IR')}</p>
                  </div>
                  {selectedEntry.approvedBy && (
                    <>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">تایید شده توسط:</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedEntry.approvedBy}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">تاریخ تایید:</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedEntry.approvedAt ? new Date(selectedEntry.approvedAt).toLocaleDateString('fa-IR') : '-'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse pt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Entry Modal */}
      {showApproveModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                تایید و ثبت سند
              </h2>
              <button
                onClick={() => setShowApproveModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    آیا مطمئن هستید که می‌خواهید این سند را تایید و ثبت کنید؟
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">شماره سند:</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedEntry.entryNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">شرح:</p>
                  <p className="text-lg text-gray-900 dark:text-white">{selectedEntry.description}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">مبلغ کل:</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(selectedEntry.totalDebit)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse pt-6">
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={processing}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                onClick={confirmApproveEntry}
                disabled={processing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'در حال تایید...' : 'تایید و ثبت'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sketch edit modal (not full implementation) */}
      {showEditModal && editEntry && editEntryState && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ویرایش سند حسابداری</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ سند *</label>
                  <input
                    type="date"
                    value={editEntryState.entryDate}
                    onChange={e => setEditEntryState((prev) => prev ? { ...prev, entryDate: e.target.value } : prev)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مرجع</label>
                  <input
                    type="text"
                    value={editEntryState.reference}
                    onChange={e => setEditEntryState((prev) => prev ? { ...prev, reference: e.target.value } : prev)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="شماره فاکتور، قرارداد و..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شرح سند *</label>
                  <textarea
                    value={editEntryState.description}
                    onChange={e => setEditEntryState((prev) => prev ? { ...prev, description: e.target.value } : prev)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="شرح کامل سند حسابداری..."
                    required
                  />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">ردیف‌های سند</h2>
                  <button
                    type="button"
                    onClick={() => setEditEntryState((prev) => prev ? { ...prev, lines: [...prev.lines, { id: String(prev.lines.length + 1), accountId: '', account: null, description: '', debitAmount: 0, creditAmount: 0 }] } : prev)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    افزودن ردیف
                  </button>
                </div>
                <div className="space-y-4">
                  {editEntryState.lines.map((line, index) => (
                    <div key={line.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900 dark:text-white">سطر {index + 1}</h4>
                        {index > 1 && (
                          <button
                            type="button"
                            onClick={() => setEditEntryState((prev) => prev ? { ...prev, lines: prev.lines.filter((_, i) => i !== index) } : prev)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            حذف
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">حساب *</label>
                          <button
                            type="button"
                            onClick={() => handleEditAccountSelect(index)}
                            className="w-full text-right px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
                          >
                            {line.account ? `${line.account.accountCode} - ${line.account.accountName}` : 'انتخاب حساب...'}
                          </button>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شرح</label>
                          <input
                            type="text"
                            value={line.description}
                            onChange={e => updateEditLine(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
                            placeholder="شرح تفصیلی..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">بدهکار</label>
                          <input
                            type="number"
                            value={line.debitAmount}
                            onChange={e => updateEditLine(index, 'debitAmount', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">بستانکار</label>
                          <input
                            type="number"
                            value={line.creditAmount}
                            onChange={e => updateEditLine(index, 'creditAmount', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-4 space-x-reverse mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  لغو
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </button>
              </div>
            </form>
            {/* Account Selection Modal for Edit */}
            {showAccountModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">انتخاب حساب</h3>
                    <button
                      onClick={() => setShowAccountModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-96 p-4">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        onClick={() => handleEditAccountSelected(account)}
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
                                {account.accountName}
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
        </div>
      )}
    </div>
  );
} 