'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import * as auditService from '../../../../../../services/auditService';
import * as itemService from '../../../../../../services/itemService';
import * as inventoryService from '../../../../../../services/inventoryService';
import type { Item } from '../../../../../../services/itemService';
import { AuditCycle, AuditEntry } from '../../../../../../services/auditService';
import { InventoryStatus } from '../../../../../../../shared/types';
import toast from 'react-hot-toast';
import { FormattedNumberInput } from '../../../../../../components/ui/FormattedNumberInput';

// localStorage key for auto-save
const AUTO_SAVE_KEY = (auditCycleId: string) => `audit_count_draft_${auditCycleId}`;

// Item status types
type ItemStatus = 'pending' | 'counted' | 'reviewed';

interface CountedItemData {
  quantity: string;
  reason: string;
  status: ItemStatus;
}

export default function CountAuditPage() {
  const params = useParams();
  const auditCycleId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [auditCycle, setAuditCycle] = useState<AuditCycle | null>(null);
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus[]>([]);
  const [countedItems, setCountedItems] = useState<Record<string, CountedItemData>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'counted' | 'reviewed'>('all');
  const [discrepancyFilter, setDiscrepancyFilter] = useState<'all' | 'with' | 'without'>('all');

  // Load data from API and localStorage
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [itemsData, cycleData, inventoryData] = await Promise.all([
        itemService.getItems(),
        auditService.getAuditCycleById(auditCycleId),
        inventoryService.getCurrentInventory()
      ]);
      
      setItems(itemsData.filter(item => item.isActive));
      setAuditCycle(cycleData);
      setInventoryStatus(inventoryData);
      
      // Load from localStorage first (draft data)
      const savedDraft = localStorage.getItem(AUTO_SAVE_KEY(auditCycleId));
      let draftData: Record<string, CountedItemData> = {};
      
      if (savedDraft) {
        try {
          draftData = JSON.parse(savedDraft);
        } catch (e) {
          console.error('Error parsing saved draft:', e);
        }
      }
      
      // Pre-populate with existing entries from API (overrides draft)
      const entriesMap: Record<string, CountedItemData> = {};
      if (cycleData.entries) {
        cycleData.entries.forEach((entry: AuditEntry) => {
          entriesMap[entry.itemId] = {
            quantity: entry.countedQuantity?.toString() || '',
            reason: entry.reason?.trim() || '',
            status: entry.correctionApplied ? 'reviewed' : 'counted'
          };
        });
      }
      
      // Merge: API entries take precedence, then draft, then empty
      const mergedData: Record<string, CountedItemData> = {};
      itemsData.forEach(item => {
        if (item.isActive) {
          mergedData[item.id] = entriesMap[item.id] || draftData[item.id] || {
            quantity: '',
            reason: '',
            status: 'pending'
          };
        }
      });
      
      setCountedItems(mergedData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت اطلاعات';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [auditCycleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-save to localStorage
  useEffect(() => {
    if (Object.keys(countedItems).length > 0) {
      const draftToSave: Record<string, CountedItemData> = {};
      Object.entries(countedItems).forEach(([itemId, data]) => {
        // Only save items that have been modified but not yet submitted
        if (data.quantity || data.reason) {
          draftToSave[itemId] = data;
        }
      });
      
      if (Object.keys(draftToSave).length > 0) {
        localStorage.setItem(AUTO_SAVE_KEY(auditCycleId), JSON.stringify(draftToSave));
      }
    }
  }, [countedItems, auditCycleId]);

  // Get system stock for an item
  // First check if there's an audit entry (which has the system stock at audit time)
  // Otherwise, get current stock from inventory status
  const getSystemStock = useCallback((itemId: string): number => {
    // If there's an audit entry, use its systemQuantity (stock at time of audit)
    const auditEntry = auditCycle?.entries?.find((e: AuditEntry) => e.itemId === itemId);
    if (auditEntry?.systemQuantity !== undefined) {
      return auditEntry.systemQuantity;
    }
    
    // Otherwise, get current stock from inventory status
    const invStatus = inventoryStatus.find(status => status.itemId === itemId);
    return invStatus?.current || 0;
  }, [auditCycle, inventoryStatus]);

  // Get item status
  const getItemStatus = useCallback((itemId: string): ItemStatus => {
    return countedItems[itemId]?.status || 'pending';
  }, [countedItems]);

  // Check if item has discrepancy
  const hasDiscrepancy = useCallback((itemId: string): boolean => {
    const counted = countedItems[itemId];
    if (!counted || !counted.quantity) return false;
    
    const systemStock = getSystemStock(itemId);
    const countedQty = parseFloat(counted.quantity);
    if (isNaN(countedQty)) return false;
    
    return Math.abs(countedQty - systemStock) > 0.01;
  }, [countedItems, getSystemStock]);

  // Quick actions
  const handleZeroOut = useCallback((itemId: string) => {
    setCountedItems(prev => ({
      ...prev,
      [itemId]: {
        quantity: '0',
        reason: prev[itemId]?.reason || '',
        status: prev[itemId]?.status || 'pending'
      }
    }));
    toast.success('مقدار صفر شد');
  }, []);

  const handleMatchSystem = useCallback((itemId: string) => {
    const systemStock = getSystemStock(itemId);
    setCountedItems(prev => ({
      ...prev,
      [itemId]: {
        quantity: systemStock.toString(),
        reason: '', // Clear reason since we're matching system (no discrepancy)
        status: prev[itemId]?.status || 'pending'
      }
    }));
    toast.success('مقدار با سیستم مطابقت داده شد');
  }, [getSystemStock]);

  const handleQuantityChange = useCallback((itemId: string, value: string) => {
    setCountedItems(prev => ({
      ...prev,
      [itemId]: {
        quantity: value || '',
        reason: prev[itemId]?.reason || '',
        status: prev[itemId]?.status === 'reviewed' ? 'counted' : (prev[itemId]?.status || 'pending')
      }
    }));
  }, []);

  const handleReasonChange = useCallback((itemId: string, value: string) => {
    setCountedItems(prev => ({
      ...prev,
      [itemId]: {
        quantity: prev[itemId]?.quantity || '',
        reason: value || '',
        status: prev[itemId]?.status || 'pending'
      }
    }));
  }, []);

  // Filter items (for use in callbacks) - defined early for use in other callbacks
  const filteredItemsMemo = useMemo(() => {
    let filtered = items;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => {
        const status = getItemStatus(item.id);
        return status === statusFilter;
      });
    }

    // Discrepancy filter
    if (discrepancyFilter === 'with') {
      filtered = filtered.filter(item => hasDiscrepancy(item.id));
    } else if (discrepancyFilter === 'without') {
      filtered = filtered.filter(item => !hasDiscrepancy(item.id));
    }

    return filtered;
  }, [items, searchTerm, categoryFilter, statusFilter, discrepancyFilter, getItemStatus, hasDiscrepancy]);

  const getFilteredItems = useCallback((): Item[] => {
    return filteredItemsMemo;
  }, [filteredItemsMemo]);

  // Toggle item selection
  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Select all / Deselect all
  const toggleSelectAll = useCallback(() => {
    const filtered = getFilteredItems();
    const allSelected = filtered.every(item => selectedItems.has(item.id));
    
    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filtered.map(item => item.id)));
    }
  }, [selectedItems, getFilteredItems]);

  // Individual submit
  const handleSubmit = useCallback(async (itemId: string) => {
    const counted = countedItems[itemId];
    const quantity = counted?.quantity || '';
    const reason = counted?.reason || '';
    
    if (!quantity || parseFloat(quantity) < 0 || isNaN(parseFloat(quantity))) {
      toast.error('مقدار شمارش شده باید یک عدد معتبر و بیشتر از صفر باشد');
      return;
    }

    const parsedQuantity = parseFloat(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      toast.error('مقدار شمارش شده نامعتبر است');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        auditCycleId,
        itemId,
        countedQuantity: parsedQuantity,
        ...(reason.trim() && { reason: reason.trim() })
      };
      
      await auditService.addAuditEntry(payload);
      
      toast.success('شمارش با موفقیت ثبت شد');
      
      // Update status
      setCountedItems(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          status: 'counted'
        }
      }));
      
      // Reload data to refresh the form
      await loadData();
    } catch (error) {
      console.error('❌ Error submitting audit entry:', error);
      
      const apiError = error as Error & { statusCode?: number; details?: Array<{ path?: string[]; message?: string }> };
      
      if (apiError.statusCode === 400) {
        if (apiError.details && Array.isArray(apiError.details) && apiError.details.length > 0) {
          const firstError = apiError.details[0];
          const fieldName = firstError.path?.join('.') || 'فیلد';
          const message = firstError.message || 'مقدار نامعتبر';
          toast.error(`${fieldName}: ${message}`);
        } else {
          toast.error(apiError.message || 'داده‌های ورودی نامعتبر است');
        }
      } else if (error instanceof Error) {
        toast.error(error.message || 'خطا در ثبت شمارش');
      } else {
        toast.error('خطا در ثبت شمارش');
      }
    } finally {
      setSubmitting(false);
    }
  }, [auditCycleId, countedItems, loadData]);

  // Bulk submit
  const handleBulkSubmit = useCallback(async () => {
    if (selectedItems.size === 0) {
      toast.error('لطفاً حداقل یک کالا را انتخاب کنید');
      return;
    }

    const entries: auditService.AddAuditEntryData[] = [];
    const errors: string[] = [];

    selectedItems.forEach(itemId => {
      const counted = countedItems[itemId];
      const quantity = counted?.quantity || '';
      
      if (!quantity || parseFloat(quantity) < 0 || isNaN(parseFloat(quantity))) {
        errors.push(`کالا ${items.find(i => i.id === itemId)?.name || itemId}: مقدار نامعتبر`);
        return;
      }

      const parsedQuantity = parseFloat(quantity);
      if (isNaN(parsedQuantity) || parsedQuantity < 0) {
        errors.push(`کالا ${items.find(i => i.id === itemId)?.name || itemId}: مقدار نامعتبر`);
        return;
      }

      entries.push({
        auditCycleId,
        itemId,
        countedQuantity: parsedQuantity,
        ...(counted?.reason?.trim() && { reason: counted.reason.trim() })
      });
    });

    if (errors.length > 0) {
      toast.error(`خطا در ${errors.length} کالا: ${errors[0]}`);
      return;
    }

    if (entries.length === 0) {
      toast.error('هیچ ورودی معتبری برای ثبت وجود ندارد');
      return;
    }

    try {
      setBulkSubmitting(true);
      const result = await auditService.addBulkAuditEntries({ entries });
      
      if (result.success) {
        toast.success(`${result.summary.successful} شمارش با موفقیت ثبت شد`);
        
        if (result.summary.failed > 0) {
          toast.error(`${result.summary.failed} شمارش ناموفق بود`);
        }
        
        // Update statuses
        result.created.forEach(entry => {
          setCountedItems(prev => ({
            ...prev,
            [entry.itemId]: {
              ...prev[entry.itemId],
              status: 'counted'
            }
          }));
        });
        
        // Clear selection
        setSelectedItems(new Set());
        
        // Reload data
        await loadData();
      }
    } catch (error) {
      console.error('❌ Error submitting bulk audit entries:', error);
      const apiError = error as Error & { statusCode?: number; details?: Array<{ path?: string[]; message?: string }> };
      
      if (apiError.statusCode === 400) {
        if (apiError.details && Array.isArray(apiError.details) && apiError.details.length > 0) {
          const firstError = apiError.details[0];
          const fieldName = firstError.path?.join('.') || 'فیلد';
          const message = firstError.message || 'مقدار نامعتبر';
          toast.error(`${fieldName}: ${message}`);
        } else {
          toast.error(apiError.message || 'داده‌های ورودی نامعتبر است');
        }
      } else if (error instanceof Error) {
        toast.error(error.message || 'خطا در ثبت شمارش‌های گروهی');
      } else {
        toast.error('خطا در ثبت شمارش‌های گروهی');
      }
    } finally {
      setBulkSubmitting(false);
    }
  }, [selectedItems, countedItems, auditCycleId, items, loadData]);

  const filteredItems = filteredItemsMemo;

  // Calculate progress
  const progress = useMemo(() => {
    const total = items.length;
    const counted = items.filter(item => {
      const status = getItemStatus(item.id);
      return status === 'counted' || status === 'reviewed';
    }).length;
    return { total, counted, percentage: total > 0 ? Math.round((counted / total) * 100) : 0 };
  }, [items, getItemStatus]);

  // Get available categories
  const availableCategories = useMemo(() => {
    return Array.from(new Set(items.map(item => item.category))).sort();
  }, [items]);

  // Status badge component
  const StatusBadge: React.FC<{ status: ItemStatus }> = ({ status }) => {
    const config = {
      pending: { label: 'در انتظار', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
      counted: { label: 'شمارش شده', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      reviewed: { label: 'بررسی شده', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' }
    };
    
    const { label, color } = config[status];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
              ثبت شمارش موجودی
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              چرخه: {auditCycle?.name}
            </p>
          </div>
          <Link
            href="/workspaces/inventory-management/audit"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            بازگشت
          </Link>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            پیشرفت شمارش
          </h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {progress.counted} از {progress.total} کالا ({progress.percentage}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی کالا..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">همه دسته‌بندی‌ها</option>
            {availableCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="pending">در انتظار</option>
            <option value="counted">شمارش شده</option>
            <option value="reviewed">بررسی شده</option>
          </select>

          {/* Discrepancy Filter */}
          <select
            value={discrepancyFilter}
            onChange={(e) => setDiscrepancyFilter(e.target.value as typeof discrepancyFilter)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">همه موارد</option>
            <option value="with">با اختلاف</option>
            <option value="without">بدون اختلاف</option>
          </select>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {filteredItems.every(item => selectedItems.has(item.id)) ? 'لغو انتخاب همه' : 'انتخاب همه'}
            </button>
            {selectedItems.size > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedItems.size} کالا انتخاب شده
              </span>
            )}
          </div>
          {selectedItems.size > 0 && (
            <button
              onClick={handleBulkSubmit}
              disabled={bulkSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {bulkSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  در حال ثبت...
                </>
              ) : (
                <>
                  ثبت گروهی ({selectedItems.size})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {filteredItems.map((item) => {
          const counted = countedItems[item.id] || { quantity: '', reason: '', status: 'pending' as ItemStatus };
          const quantity = counted.quantity ?? '';
          const reason = counted.reason ?? '';
          const systemStock = getSystemStock(item.id);
          const status = getItemStatus(item.id);
          const hasDisc = hasDiscrepancy(item.id);
          const isSelected = selectedItems.has(item.id);
          
          return (
            <div
              key={item.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-2 transition-colors ${
                isSelected ? 'border-blue-500 dark:border-blue-600' : 'border-transparent'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Item Info */}
                <div className="md:col-span-1">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItemSelection(item.id)}
                      className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {item.category} • موجودی سیستم: {systemStock.toLocaleString()} {item.unit}
                      </p>
                      <StatusBadge status={status} />
                      {hasDisc && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                          اختلاف
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Quantity Input */}
                <div>
                  <FormattedNumberInput
                    label="مقدار شمارش شده"
                    value={quantity}
                    onChange={(value) => handleQuantityChange(item.id, value)}
                    placeholder="مقدار شمارش شده"
                    min={0}
                    allowDecimals={true}
                    dir="ltr"
                  />
                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleMatchSystem(item.id)}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title="مطابقت با سیستم (کپی مقدار و پاک کردن دلیل)"
                    >
                      مطابقت
                    </button>
                    <button
                      onClick={() => handleZeroOut(item.id)}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title="صفر کردن"
                    >
                      صفر
                    </button>
                  </div>
                </div>
                
                {/* Reason Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    دلیل اختلاف (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => handleReasonChange(item.id, e.target.value)}
                    placeholder="در صورت وجود اختلاف، دلیل را وارد کنید"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-end">
                  <button
                    onClick={() => handleSubmit(item.id)}
                    disabled={submitting || !quantity || parseFloat(quantity) < 0}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'در حال ثبت...' : 'ثبت شمارش'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">کالایی یافت نشد</p>
        </div>
      )}
    </div>
  );
}
