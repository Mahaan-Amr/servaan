'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Item, InventoryStatus } from '../../../../../shared/types';
import * as itemService from '../../../../services/itemService';
import * as inventoryService from '../../../../services/inventoryService';
import toast from 'react-hot-toast';

export default function ItemsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [deletingItem, setDeletingItem] = useState<string | null>(null);

  // Load items and inventory data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [itemsData, inventoryData] = await Promise.all([
          itemService.getItems(),
          inventoryService.getCurrentInventory()
        ]);
        
        setItems(itemsData);
        setInventoryStatus(inventoryData);
        
        // Extract unique categories for filtering - Fixed TypeScript issue
        const categories = Array.from(new Set(itemsData.map(item => item.category)));
        setAvailableCategories(categories);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت اطلاعات';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get current stock for an item
  const getCurrentStock = useCallback((itemId: string): number => {
    const status = inventoryStatus.find(s => s.itemId === itemId);
    return status ? status.current : 0;
  }, [inventoryStatus]);

  const getStockStatus = useCallback((itemId: string, minStock?: number) => {
    const current = getCurrentStock(itemId);
    const min = minStock || 0;
    
    if (current <= 0) {
      return { status: 'out', color: 'red', text: 'ناموجود' };
    } else if (current <= min) {
      return { status: 'low', color: 'yellow', text: 'کم موجود' };
    } else {
      return { status: 'good', color: 'green', text: 'موجود' };
    }
  }, [getCurrentStock]);

  // Handle item deletion
  const handleDeleteItem = async (itemId: string, itemName: string) => {
    const confirmDelete = window.confirm(
      `آیا از حذف کالای "${itemName}" اطمینان دارید؟\n\nاین عملیات غیرقابل بازگشت است.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingItem(itemId);
      await itemService.deleteItem(itemId);
      
      toast.success(`کالای "${itemName}" با موفقیت حذف شد`);
      
      // Refresh items list
      const updatedItems = await itemService.getItems();
      setItems(updatedItems);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در حذف کالا';
      toast.error(errorMessage);
    } finally {
      setDeletingItem(null);
    }
  };

  // Filter items based on search and filters
  useEffect(() => {
    let filtered = items;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.barcode && item.barcode.includes(searchTerm))
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(item => {
        const stockStatus = getStockStatus(item.id, item.minStock);
        return stockStatus.status === statusFilter;
      });
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, categoryFilter, statusFilter, getStockStatus]);

  // Calculate stats
  const getStats = () => {
    const total = filteredItems.length;
    const good = filteredItems.filter(item => getStockStatus(item.id, item.minStock).status === 'good').length;
    const low = filteredItems.filter(item => getStockStatus(item.id, item.minStock).status === 'low').length;
    const out = filteredItems.filter(item => getStockStatus(item.id, item.minStock).status === 'out').length;
    
    return { total, good, low, out };
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('');
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="mr-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-400">خطا در دریافت اطلاعات</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              مدیریت کالاها
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              مشاهده و مدیریت لیست کالاها
            </p>
          </div>
          <Link
            href="/workspaces/inventory-management/items/add"
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            افزودن کالا
          </Link>
        </div>

        {/* Search and Filter Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Search Input */}
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="جستجو بر اساس نام کالا یا بارکد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
              />
              <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            >
              <option value="">همه دسته‌ها</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="good">موجود</option>
              <option value="low">کم موجود</option>
              <option value="out">ناموجود</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || categoryFilter || statusFilter) && (
          <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">فیلترهای فعال:</span>
            
            {searchTerm && (
              <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                جستجو: {searchTerm}
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  ×
                </button>
              </span>
            )}

            {categoryFilter && (
              <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                دسته: {categoryFilter}
                <button
                  onClick={() => setCategoryFilter('')}
                  className="ml-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                >
                  ×
                </button>
              </span>
            )}

            {statusFilter && (
              <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                وضعیت: {statusFilter === 'good' ? 'موجود' : statusFilter === 'low' ? 'کم موجود' : 'ناموجود'}
                <button
                  onClick={() => setStatusFilter('')}
                  className="ml-1 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300"
                >
                  ×
                </button>
              </span>
            )}

            <button
              onClick={clearFilters}
              className="text-xs sm:text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              پاک کردن همه فیلترها
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="mr-2 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">کل کالاها</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mr-2 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">موجود</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{stats.good}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="mr-2 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">کم موجود</p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.low}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="mr-2 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">ناموجود</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">{stats.out}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">لیست کالاها</h2>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">هیچ کالایی ثبت نشده</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              با کلیک بر روی دکمه زیر اولین کالا را اضافه کنید.
            </p>
            <div className="mt-4 sm:mt-6">
              <Link
                href="/workspaces/inventory-management/items/add"
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                افزودن کالای جدید
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    نام کالا
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    دسته‌بندی
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    موجودی فعلی
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    حداقل موجودی
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    وضعیت
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item.id, item.minStock);
                  const currentStock = getCurrentStock(item.id);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={40}
                                height={40}
                                className="rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <svg className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="mr-2 sm:mr-4">
                            <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                              {item.name}
                            </div>
                            {item.barcode && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                بارکد: {item.barcode}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {item.category}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                        {currentStock} {item.unit}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                        {item.minStock || 0} {item.unit}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          stockStatus.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          stockStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-3">
                          <Link
                            href={`/workspaces/inventory-management/items/${item.id}`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            مشاهده
                          </Link>
                          <Link
                            href={`/workspaces/inventory-management/items/${item.id}/edit`}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            ویرایش
                          </Link>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            disabled={deletingItem === item.id}
                          >
                            {deletingItem === item.id ? (
                              <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7v10" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 