'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { InventoryEntry, InventoryEntryType } from '../../../../../../shared/types';
import * as inventoryService from '../../../../../services/inventoryService';
import toast from 'react-hot-toast';
import { FarsiDatePicker } from '../../../../../components/ui/FarsiDatePicker';

export default function InventoryTransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [sortField, setSortField] = useState<'createdAt' | 'quantity' | 'itemName' | 'type'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const loadEntries = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const entriesData = await inventoryService.getInventoryEntries();
        setEntries(entriesData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت تراکنش‌های انبار';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, []);

  const filteredEntries = entries.filter(entry => {
    // Type filter
    if (filter !== 'ALL' && entry.type !== filter) {
      return false;
    }
    
    // Date range filter
    if (startDate || endDate) {
      const entryDate = new Date(entry.createdAt);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && entryDate < start) {
        return false;
      }
      
      if (end && entryDate > end) {
        return false;
      }
    }
    
    return true;
  });

  const getTypeLabel = (type: InventoryEntryType) => {
    return type === 'IN' ? 'ورود' : 'خروج';
  };

  const getTypeColor = (type: InventoryEntryType) => {
    return type === 'IN' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleSort = (field: 'createdAt' | 'quantity' | 'itemName' | 'type') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'createdAt' | 'quantity' | 'itemName' | 'type') => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    let aValue: string | number, bValue: string | number;
    
    switch (sortField) {
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'quantity':
        aValue = a.quantity;
        bValue = b.quantity;
        break;
      case 'itemName':
        aValue = a.item?.name || '';
        bValue = b.item?.name || '';
        break;
      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;
      default:
        return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="mr-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                خطا در دریافت تراکنش‌های انبار
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-md text-sm font-medium text-red-800 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                >
                  تلاش مجدد
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              تراکنش‌های انبار
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              تاریخچه ورود و خروج کالاها
            </p>
          </div>
          <div className="flex space-x-2 space-x-reverse">
            <Link
              href="/workspaces/inventory-management/inventory/add"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              ورود کالا
            </Link>
            <Link
              href="/workspaces/inventory-management/inventory/remove"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              خروج کالا
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-4 space-x-reverse">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">فیلتر:</span>
          <div className="flex space-x-2 space-x-reverse">
            {(['ALL', 'IN', 'OUT'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {type === 'ALL' ? 'همه' : type === 'IN' ? 'ورود' : 'خروج'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className="px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-sm font-medium transition-colors"
          >
            فیلتر تاریخ
          </button>
          <div className="mr-auto text-sm text-gray-600 dark:text-gray-400">
            {filteredEntries.length} تراکنش
          </div>
        </div>
        
        {/* Date Range Filter */}
        {showDateFilter && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div>
                <FarsiDatePicker
                  label="از تاریخ"
                  value={startDate}
                  onChange={(value) => setStartDate(value)}
                  placeholder="از تاریخ را انتخاب کنید"
                  maxDate={endDate || undefined}
                />
              </div>
              <div>
                <FarsiDatePicker
                  label="تا تاریخ"
                  value={endDate}
                  onChange={(value) => setEndDate(value)}
                  placeholder="تا تاریخ را انتخاب کنید"
                  minDate={startDate || undefined}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearDateFilter}
                  className="px-3 py-2 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 rounded-lg text-sm font-medium transition-colors"
                >
                  پاک کردن
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {filteredEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('itemName')}
                      className="flex items-center space-x-1 space-x-reverse hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <span>کالا</span>
                      {getSortIcon('itemName')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('type')}
                      className="flex items-center space-x-1 space-x-reverse hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <span>نوع</span>
                      {getSortIcon('type')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('quantity')}
                      className="flex items-center space-x-1 space-x-reverse hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <span>مقدار</span>
                      {getSortIcon('quantity')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    کاربر
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center space-x-1 space-x-reverse hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <span>تاریخ</span>
                      {getSortIcon('createdAt')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    توضیحات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {entry.item?.name || 'نامشخص'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {entry.item?.category || ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(entry.type)}`}>
                        {getTypeLabel(entry.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {entry.quantity.toLocaleString('fa-IR')} {entry.item?.unit || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {entry.user?.name || 'نامشخص'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(entry.createdAt).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {entry.note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m9-2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-7 4v-2a2 2 0 012-2 2 2 0 012 2v2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              تراکنشی یافت نشد
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filter === 'ALL' 
                ? 'هنوز تراکنشی ثبت نشده است'
                : `تراکنش ${filter === 'IN' ? 'ورود' : 'خروج'}ی یافت نشد`
              }
            </p>
            <div className="mt-6 flex justify-center space-x-2 space-x-reverse">
              <Link
                href="/workspaces/inventory-management/inventory/add"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                ورود کالا
              </Link>
              <Link
                href="/workspaces/inventory-management/inventory/remove"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                خروج کالا
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 