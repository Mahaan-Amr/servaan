'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { InventoryStatus, InventoryEntry, Item } from '../../../../../../shared/types';
import * as inventoryService from '../../../../../services/inventoryService';
import * as itemService from '../../../../../services/itemService';
import toast from 'react-hot-toast';
import type { WorkBook, WorkSheet } from 'xlsx';

interface InventoryReportSummary {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalInTransactions: number;
  totalOutTransactions: number;
}

// Supplier performance metrics type
interface SupplierMetrics {
  id: string;
  name: string;
  totalItems: number;
  preferredItems: number;
  prices: number[];
  recentTransactions: number;
  isActive: boolean;
}

export default function InventoryReportsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<InventoryReportSummary | null>(null);
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<InventoryEntry[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Transaction history states
  const [showTransactionHistory, setShowTransactionHistory] = useState<boolean>(false);
  const [transactionFilter, setTransactionFilter] = useState<{
    type: string;
    dateRange: string;
    startDate: string;
    endDate: string;
    itemFilter: string;
    userFilter: string;
  }>({
    type: 'ALL',
    dateRange: '30',
    startDate: '',
    endDate: '',
    itemFilter: '',
    userFilter: ''
  });
  const [filteredTransactions, setFilteredTransactions] = useState<InventoryEntry[]>([]);

  // Supplier performance states
  const [showSupplierPerformance, setShowSupplierPerformance] = useState<boolean>(false);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load all required data in parallel
        const [currentInventory, transactions, itemsList, lowStock] = await Promise.all([
          inventoryService.getCurrentInventory(),
          inventoryService.getInventoryEntries(),
          itemService.getItemsWithSuppliers(), // Use getItemsWithSuppliers to include supplier data
          inventoryService.getLowStockItems()
        ]);
        
        setInventoryStatus(currentInventory);
        setRecentTransactions(transactions);
        setItems(itemsList);
        
        // Calculate summary with better price logic
        const calculateTotalValue = () => {
          let totalValue = 0;
          let itemsWithPrices = 0;
          let itemsWithoutPrices = 0;
          
          currentInventory.forEach(inventoryItem => {
            // Get all IN transactions for this item that have unit prices
            const inTransactions = transactions.filter(t => 
              t.itemId === inventoryItem.itemId && 
              t.type === 'IN' && 
              t.unitPrice && 
              t.unitPrice > 0
            );
            
            let itemValue = 0;
            
            if (inTransactions.length > 0) {
              // Calculate weighted average price based on quantities
              const totalQuantityWithPrice = inTransactions.reduce((sum, t) => sum + t.quantity, 0);
              const totalValueFromTransactions = inTransactions.reduce((sum, t) => sum + (t.quantity * (t.unitPrice || 0)), 0);
              
              if (totalQuantityWithPrice > 0) {
                const weightedAveragePrice = totalValueFromTransactions / totalQuantityWithPrice;
                itemValue = inventoryItem.current * weightedAveragePrice;
                totalValue += itemValue;
                itemsWithPrices++;
              }
            } else {
              // Fallback to supplier price if available
              const itemData = itemsList.find(i => i.id === inventoryItem.itemId);
              const supplierPrice = itemData?.suppliers?.find(s => s.preferredSupplier)?.unitPrice || 
                                 itemData?.suppliers?.[0]?.unitPrice;
              if (supplierPrice && supplierPrice > 0) {
                itemValue = inventoryItem.current * supplierPrice;
                totalValue += itemValue;
                itemsWithPrices++;
              } else {
                itemsWithoutPrices++;
              }
            }
          });
          
          // Debug logging
          console.log('💰 Price Calculation Debug:', {
            totalItems: currentInventory.length,
            itemsWithPrices,
            itemsWithoutPrices,
            totalValue,
            transactionsWithPrices: transactions.filter(t => t.unitPrice && t.unitPrice > 0).length,
            totalTransactions: transactions.length
          });
          
          return totalValue;
        };
        
        const totalValue = calculateTotalValue();

        const inTransactions = transactions.filter(t => t.type === 'IN').length;
        const outTransactions = transactions.filter(t => t.type === 'OUT').length;
        
        setSummary({
          totalItems: currentInventory.length,
          totalValue,
          lowStockItems: lowStock.length,
          outOfStockItems: currentInventory.filter(item => item.current === 0).length,
          totalInTransactions: inTransactions,
          totalOutTransactions: outTransactions
        });
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت اطلاعات گزارش';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, []);

  // Filter transactions based on current filter settings
  useEffect(() => {
    let filtered = [...recentTransactions];
    
    // Filter by transaction type
    if (transactionFilter.type !== 'ALL') {
      filtered = filtered.filter(t => t.type === transactionFilter.type);
    }
    
    // Filter by date range
    const now = new Date();
    if (transactionFilter.dateRange !== 'ALL') {
      const daysBack = parseInt(transactionFilter.dateRange);
      const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(t => new Date(t.createdAt) >= cutoffDate);
    }
    
    // Filter by custom date range
    if (transactionFilter.startDate) {
      const startDate = new Date(transactionFilter.startDate);
      filtered = filtered.filter(t => new Date(t.createdAt) >= startDate);
    }
    
    if (transactionFilter.endDate) {
      const endDate = new Date(transactionFilter.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(t => new Date(t.createdAt) <= endDate);
    }
    
    // Filter by item name
    if (transactionFilter.itemFilter) {
      const itemFilter = transactionFilter.itemFilter.toLowerCase();
      filtered = filtered.filter(t => {
        const item = items.find(item => item.id === t.itemId);
        return item?.name.toLowerCase().includes(itemFilter) || 
               item?.category.toLowerCase().includes(itemFilter);
      });
    }
    
    // Filter by user
    if (transactionFilter.userFilter) {
      const userFilter = transactionFilter.userFilter.toLowerCase();
      filtered = filtered.filter(t => 
        t.user?.name.toLowerCase().includes(userFilter)
      );
    }
    
    // Sort by date (newest first)
    filtered.sort((a: InventoryEntry, b: InventoryEntry) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setFilteredTransactions(filtered);
  }, [recentTransactions, transactionFilter, items]);

  const getFilteredInventory = () => {
    return inventoryStatus.filter(item => {
      // Category filter
      if (categoryFilter && item.category !== categoryFilter) return false;
      
      // Stock status filter
      if (stockStatusFilter === 'LOW_STOCK') {
        const itemData = items.find(i => i.id === item.itemId);
        const minStock = itemData?.minStock || 0;
        if (item.current > minStock) return false;
      } else if (stockStatusFilter === 'OUT_OF_STOCK') {
        if (item.current > 0) return false;
      } else if (stockStatusFilter === 'IN_STOCK') {
        if (item.current === 0) return false;
      }
      
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!item.itemName.toLowerCase().includes(searchLower) && 
            !item.category.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
  };

  const getStockStatus = (item: InventoryStatus) => {
    if (item.current === 0) return { status: 'خارج از موجودی', color: 'text-red-600 dark:text-red-400' };
    
    const itemData = items.find(i => i.id === item.itemId);
    const minStock = itemData?.minStock || 0;
    
    if (item.current <= minStock) return { status: 'کم موجودی', color: 'text-yellow-600 dark:text-yellow-400' };
    return { status: 'موجود', color: 'text-green-600 dark:text-green-400' };
  };

  const getUniqueCategories = () => {
    const categories = Array.from(new Set(inventoryStatus.map(item => item.category)));
    return categories.filter(Boolean).sort();
  };

  const exportReport = async (format: 'PDF' | 'EXCEL' | 'CSV') => {
    try {
      toast.loading(`در حال صادرات گزارش به فرمت ${format}...`);
      
      const filteredData = getFilteredInventory();
      const fileName = `گزارش_انبار_${new Date().toLocaleDateString('fa-IR').replace(/\//g, '_')}`;
      
      if (format === 'CSV') {
        // CSV Export
        let csvContent = '\uFEFF'; // BOM for UTF-8
        
        // Headers
        csvContent += 'نام کالا,دسته‌بندی,موجودی فعلی,کل ورود,کل خروج,وضعیت\n';
        
        // Data
        filteredData.forEach(item => {
          const stockInfo = getStockStatus(item);
          csvContent += `"${item.itemName}","${item.category}","${item.current} ${item.unit}","${item.totalIn} ${item.unit}","${item.totalOut} ${item.unit}","${stockInfo.status}"\n`;
        });
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.csv`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
      } else if (format === 'EXCEL') {
        // Excel Export using simple table to Excel conversion
        const workbook: WorkBook = {
          SheetNames: ['گزارش موجودی'],
          Sheets: {
            'گزارش موجودی': {}
          }
        };
        
        // Create worksheet data
        const worksheetData = [
          ['نام کالا', 'دسته‌بندی', 'موجودی فعلی', 'کل ورود', 'کل خروج', 'وضعیت']
        ];
        
        filteredData.forEach(item => {
          const stockInfo = getStockStatus(item);
          worksheetData.push([
            item.itemName,
            item.category,
            `${item.current} ${item.unit}`,
            `${item.totalIn} ${item.unit}`,
            `${item.totalOut} ${item.unit}`,
            stockInfo.status
          ]);
        });
        
        // Convert to worksheet format
        const worksheet: WorkSheet = {};
        
        for (let R = 0; R < worksheetData.length; R++) {
          for (let C = 0; C < worksheetData[R].length; C++) {
            const cellAddress = String.fromCharCode(65 + C) + (R + 1);
            worksheet[cellAddress] = { v: worksheetData[R][C], t: 's' };
          }
        }
        
        worksheet['!ref'] = `A1:F${worksheetData.length}`;
        workbook.Sheets['گزارش موجودی'] = worksheet;
        
        // Create Excel file
        const excelBuffer = await import('xlsx').then(XLSX => {
          return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        });
        
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.xlsx`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
      } else if (format === 'PDF') {
        // PDF Export using jsPDF
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        // Add Persian font support (using Arial Unicode MS or similar)
        doc.setFont('Arial', 'normal');
        doc.setFontSize(16);
        
        // Title
        doc.text('گزارش انبار', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}`, 105, 30, { align: 'center' });
        
        // Summary
        let yPosition = 50;
        if (summary) {
          doc.setFontSize(14);
          doc.text('خلاصه گزارش:', 20, yPosition);
          yPosition += 10;
          
          doc.setFontSize(10);
          doc.text(`کل اقلام: ${summary.totalItems}`, 20, yPosition);
          yPosition += 5;
          doc.text(`ارزش کل: ${(summary.totalValue / 10).toLocaleString('fa-IR')} تومان`, 20, yPosition);
          yPosition += 5;
          doc.text(`کم موجودی: ${summary.lowStockItems}`, 20, yPosition);
          yPosition += 5;
          doc.text(`ناموجود: ${summary.outOfStockItems}`, 20, yPosition);
          yPosition += 15;
        }
        
        // Table headers
        doc.setFontSize(10);
        const headers = ['نام کالا', 'دسته‌بندی', 'موجودی', 'کل ورود', 'کل خروج', 'وضعیت'];
        const startX = 20;
        const colWidth = 25;
        
        doc.setFont('Arial', 'bold');
        headers.forEach((header, index) => {
          doc.text(header, startX + (index * colWidth), yPosition);
        });
        yPosition += 10;
        
        // Table data
        doc.setFont('Arial', 'normal');
        filteredData.slice(0, 20).forEach((item) => { // Limit to 20 items for PDF
          const stockInfo = getStockStatus(item);
          const rowData = [
            item.itemName.length > 15 ? item.itemName.substring(0, 15) + '...' : item.itemName,
            item.category,
            `${item.current} ${item.unit}`,
            `${item.totalIn}`,
            `${item.totalOut}`,
            stockInfo.status
          ];
          
          rowData.forEach((data, index) => {
            doc.text(String(data), startX + (index * colWidth), yPosition);
          });
          yPosition += 8;
          
          // Add new page if needed
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
        });
        
        // Add footer
        if (filteredData.length > 20) {
          yPosition += 10;
          doc.text(`... و ${filteredData.length - 20} مورد دیگر`, 20, yPosition);
        }
        
        // Save PDF
        doc.save(`${fileName}.pdf`);
      }
      
      toast.dismiss();
      toast.success(`گزارش به فرمت ${format} با موفقیت دانلود شد`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.dismiss();
      toast.error('خطا در صادرات گزارش');
    }
  };

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
                خطا در دریافت اطلاعات گزارش
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

  const filteredInventory = getFilteredInventory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          گزارش‌های انبار
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          گزارش‌گیری از وضعیت موجودی و تراکنش‌ها
        </p>
      </div>
          <div className="flex space-x-2 space-x-reverse">
            <button
              onClick={() => exportReport('PDF')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              صادرات PDF
            </button>
            <button
              onClick={() => exportReport('EXCEL')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              صادرات Excel
            </button>
            <button
              onClick={() => exportReport('CSV')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              صادرات CSV
            </button>
            <Link
              href="/workspaces/inventory-management/inventory"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              بازگشت
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کل اقلام</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {summary.totalItems.toLocaleString('fa-IR')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-4 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ارزش کل</p>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(summary.totalValue / 10).toLocaleString('fa-IR')} تومان
                  </p>
                  {summary.totalValue === 0 && (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 px-2 py-1 rounded-full">
                      نیاز به قیمت‌گذاری
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کم موجودی</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {summary.lowStockItems.toLocaleString('fa-IR')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ناموجود</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {summary.outOfStockItems.toLocaleString('fa-IR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">فیلترها</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              جستجو
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="نام کالا یا دسته‌بندی"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              دسته‌بندی
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">همه دسته‌ها</option>
              {getUniqueCategories().map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              وضعیت موجودی
            </label>
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="ALL">همه وضعیت‌ها</option>
              <option value="IN_STOCK">موجود</option>
              <option value="LOW_STOCK">کم موجودی</option>
              <option value="OUT_OF_STOCK">ناموجود</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setStockStatusFilter('ALL');
              }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              پاک کردن فیلترها
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            گزارش موجودی ({filteredInventory.length} مورد)
          </h3>
        </div>
        
        {filteredInventory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    کالا
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    دسته‌بندی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    موجودی فعلی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    کل ورود
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    کل خروج
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    وضعیت
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredInventory.map((item) => {
                  const stockInfo = getStockStatus(item);
                  return (
                    <tr key={item.itemId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.itemName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.current.toLocaleString('fa-IR')} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.totalIn.toLocaleString('fa-IR')} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.totalOut.toLocaleString('fa-IR')} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${stockInfo.color}`}>
                          {stockInfo.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              داده‌ای یافت نشد
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              فیلترهای انتخابی شما نتیجه‌ای ندارد
          </p>
        </div>
        )}
      </div>

      {/* Transaction History Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              تاریخچه تراکنش‌ها
            </h3>
            <button
              onClick={() => setShowTransactionHistory(!showTransactionHistory)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showTransactionHistory ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
              {showTransactionHistory ? 'مخفی کردن' : 'نمایش تاریخچه'}
            </button>
          </div>
        </div>

        {showTransactionHistory && (
          <div className="p-6">
            {/* Transaction Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {filteredTransactions.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">کل تراکنش‌ها</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {filteredTransactions.filter(t => t.type === 'IN').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">تراکنش‌های ورودی</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {filteredTransactions.filter(t => t.type === 'OUT').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">تراکنش‌های خروجی</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Array.from(new Set(filteredTransactions.map(t => t.user?.name))).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">کاربران فعال</div>
              </div>
            </div>

            {/* Transaction Filters */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">فیلترهای تراکنش</h4>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع تراکنش
                  </label>
                  <select
                    value={transactionFilter.type}
                    onChange={(e) => setTransactionFilter(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  >
                    <option value="ALL">همه تراکنش‌ها</option>
                    <option value="IN">ورودی</option>
                    <option value="OUT">خروجی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    بازه زمانی
                  </label>
                  <select
                    value={transactionFilter.dateRange}
                    onChange={(e) => setTransactionFilter(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  >
                    <option value="7">هفته گذشته</option>
                    <option value="30">ماه گذشته</option>
                    <option value="90">سه ماه گذشته</option>
                    <option value="365">سال گذشته</option>
                    <option value="ALL">همه تاریخ‌ها</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    از تاریخ
                  </label>
                  <input
                    type="date"
                    value={transactionFilter.startDate}
                    onChange={(e) => setTransactionFilter(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تا تاریخ
                  </label>
                  <input
                    type="date"
                    value={transactionFilter.endDate}
                    onChange={(e) => setTransactionFilter(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    جستجوی کالا
                  </label>
                  <input
                    type="text"
                    value={transactionFilter.itemFilter}
                    onChange={(e) => setTransactionFilter(prev => ({ ...prev, itemFilter: e.target.value }))}
                    placeholder="نام کالا یا دسته‌بندی"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    جستجوی کاربر
                  </label>
                  <input
                    type="text"
                    value={transactionFilter.userFilter}
                    onChange={(e) => setTransactionFilter(prev => ({ ...prev, userFilter: e.target.value }))}
                    placeholder="نام کاربر"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setTransactionFilter({
                    type: 'ALL',
                    dateRange: '30',
                    startDate: '',
                    endDate: '',
                    itemFilter: '',
                    userFilter: ''
                  })}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  پاک کردن فیلترها
                </button>
              </div>
            </div>

            {/* Transaction Table */}
            {filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        تاریخ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        نوع
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        کالا
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        مقدار
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        قیمت واحد
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        کاربر
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        توضیحات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredTransactions.map((transaction) => {
                      const item = items.find(item => item.id === transaction.itemId);
                      return (
                        <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(transaction.createdAt).toLocaleDateString('fa-IR')}
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(transaction.createdAt).toLocaleTimeString('fa-IR')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === 'IN' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {transaction.type === 'IN' ? 'ورود' : 'خروج'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {item?.name || 'کالای حذف شده'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {item?.category || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {transaction.quantity.toLocaleString('fa-IR')} {item?.unit || ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {transaction.unitPrice 
                              ? `${(transaction.unitPrice / 10).toLocaleString('fa-IR')} تومان`
                              : '-'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {transaction.user?.name || 'نامشخص'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {transaction.note || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  تراکنشی یافت نشد
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  فیلترهای انتخابی شما نتیجه‌ای ندارد
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Supplier Performance Reports */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              گزارش عملکرد تأمین‌کنندگان
            </h3>
            <button
              onClick={() => setShowSupplierPerformance(!showSupplierPerformance)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showSupplierPerformance ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
              {showSupplierPerformance ? 'مخفی کردن' : 'نمایش گزارش عملکرد'}
            </button>
          </div>
        </div>

        {showSupplierPerformance && (
          <div className="p-6">
            {/* Supplier Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Array.from(new Set(items.flatMap(item => item.suppliers?.map(s => s.supplierId) || []))).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">کل تأمین‌کنندگان فعال</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {items.flatMap(item => item.suppliers?.filter(s => s.preferredSupplier) || []).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">تأمین‌کنندگان اصلی</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {recentTransactions.filter(t => t.type === 'IN').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">تراکنش‌های تأمین</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {items.flatMap(item => item.suppliers || []).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">روابط تأمین‌کننده-کالا</div>
              </div>
            </div>

            {/* Supplier Performance Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      تأمین‌کننده
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      تعداد کالا
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      تأمین‌کننده اصلی
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      میانگین قیمت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      تراکنش‌های اخیر
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      وضعیت
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {(() => {
                    // Calculate supplier performance metrics
                    const supplierMap = new Map();
                    
                    // Process all supplier relationships
                    items.forEach(item => {
                      item.suppliers?.forEach(supplier => {
                        const supplierId = supplier.supplierId;
                        const supplierName = supplier.supplier?.name || `تأمین‌کننده ${supplierId}`;
                        
                        if (!supplierMap.has(supplierId)) {
                          supplierMap.set(supplierId, {
                            id: supplierId,
                            name: supplierName,
                            totalItems: 0,
                            preferredItems: 0,
                            prices: [],
                            recentTransactions: 0,
                            isActive: supplier.supplier?.isActive || true
                          });
                        }
                        
                        const metrics = supplierMap.get(supplierId);
                        metrics.totalItems++;
                        
                        if (supplier.preferredSupplier) {
                          metrics.preferredItems++;
                        }
                        
                        if (supplier.unitPrice && supplier.unitPrice > 0) {
                          metrics.prices.push(supplier.unitPrice);
                        }
                      });
                    });
                    
                    // Calculate recent transactions for each supplier
                    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    recentTransactions
                      .filter(t => t.type === 'IN' && new Date(t.createdAt) >= thirtyDaysAgo)
                      .forEach(transaction => {
                        const item = items.find(i => i.id === transaction.itemId);
                        item?.suppliers?.forEach(supplier => {
                          if (supplierMap.has(supplier.supplierId)) {
                            supplierMap.get(supplier.supplierId).recentTransactions++;
                          }
                        });
                      });
                    
                    // Convert to array and sort by total items
                    const suppliers = Array.from(supplierMap.values()).sort((a: SupplierMetrics, b: SupplierMetrics) => b.totalItems - a.totalItems);
                    
                    return suppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {supplier.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {supplier.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {supplier.totalItems.toLocaleString('fa-IR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {supplier.preferredItems.toLocaleString('fa-IR')} 
                          {supplier.totalItems > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
                              ({Math.round((supplier.preferredItems / supplier.totalItems) * 100)}%)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {supplier.prices.length > 0 ? (
                            <>
                              {/* Calculate average price */}
                              {Math.round((supplier.prices.reduce((a: number, b: number) => a + b, 0) / supplier.prices.length) / 10).toLocaleString('fa-IR')} تومان
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                از {supplier.prices.length} کالا
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400">قیمت‌گذاری نشده</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {supplier.recentTransactions.toLocaleString('fa-IR')}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            در ۳۰ روز اخیر
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              supplier.isActive 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {supplier.isActive ? 'فعال' : 'غیرفعال'}
                            </span>
                            {supplier.recentTransactions > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                فعال اخیر
                              </span>
                            )}
                            {supplier.preferredItems > supplier.totalItems * 0.5 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                تأمین‌کننده کلیدی
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            {items.flatMap(item => item.suppliers || []).length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  اطلاعات تأمین‌کننده‌ای یافت نشد
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  هنوز تأمین‌کننده‌ای برای کالاها ثبت نشده است
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 