'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Item, InventoryEntryType } from '../../../../../../shared/types';
import * as inventoryService from '../../../../../services/inventoryService';
import * as itemService from '../../../../../services/itemService';
import toast from 'react-hot-toast';
import { FarsiDatePicker } from '../../../../../components/ui/FarsiDatePicker';
import { FormattedNumberInput } from '../../../../../components/ui/FormattedNumberInput';

interface BulkEntryRow {
  id: string;
  itemId: string;
  quantity: string;
  unitPrice: string;
  batchNumber: string;
  expiryDate: string;
  note: string;
}

export default function BulkAddInventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<BulkEntryRow[]>([
    {
      id: '1',
      itemId: '',
      quantity: '',
      unitPrice: '',
      batchNumber: '',
      expiryDate: '',
      note: ''
    }
  ]);
  const router = useRouter();

  useEffect(() => {
    const loadItems = async () => {
      try {
        setItemsLoading(true);
        const itemsData = await itemService.getItems();
        setItems(itemsData.filter(item => item.isActive));
      } catch (error) {
        console.error('Error loading items:', error);
        toast.error('خطا در دریافت لیست کالاها');
      } finally {
        setItemsLoading(false);
      }
    };

    loadItems();
  }, []);

  const addRow = () => {
    const newRow: BulkEntryRow = {
      id: Date.now().toString(),
      itemId: '',
      quantity: '',
      unitPrice: '',
      batchNumber: '',
      expiryDate: '',
      note: ''
    };
    setRows([...rows, newRow]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    } else {
      toast.error('حداقل یک ردیف باید وجود داشته باشد');
    }
  };

  const updateRow = (id: string, field: keyof BulkEntryRow, value: string) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const validateRows = (): boolean => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (!row.itemId) {
        toast.error(`ردیف ${i + 1}: انتخاب کالا الزامی است`);
        return false;
      }

      if (!row.quantity || parseFloat(row.quantity) <= 0) {
        toast.error(`ردیف ${i + 1}: مقدار باید بیشتر از صفر باشد`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRows()) {
      return;
    }

    setLoading(true);
    
    try {
      // Prepare entries for bulk creation
      const entries = rows
        .filter(row => row.itemId && row.quantity) // Filter out empty rows
        .map(row => ({
          itemId: row.itemId,
          quantity: parseFloat(row.quantity),
          type: InventoryEntryType.IN,
          note: row.note.trim() || undefined,
          unitPrice: row.unitPrice ? parseFloat(row.unitPrice) : undefined,
          batchNumber: row.batchNumber.trim() || undefined,
          expiryDate: row.expiryDate || undefined
        }));

      if (entries.length === 0) {
        toast.error('حداقل یک ردیف با اطلاعات کامل الزامی است');
        setLoading(false);
        return;
      }

      // Submit bulk entries
      const result = await inventoryService.bulkCreateInventoryEntries({ entries });

      if (result.success) {
        if (result.errors && result.errors.length > 0) {
          // Partial success
          toast.success(`${result.created.length} تراکنش با موفقیت ثبت شد`);
          if (result.errors.length > 0) {
            toast.error(`${result.errors.length} تراکنش ناموفق بود`);
          }
        } else {
          // All successful
          toast.success(`${result.created.length} تراکنش با موفقیت ثبت شد`);
        }
        
        // Navigate back
        router.push('/workspaces/inventory-management/inventory');
      } else {
        toast.error('خطا در ثبت ورود گروهی کالاها');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ثبت ورود گروهی کالاها';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedItem = (itemId: string) => {
    return items.find(item => item.id === itemId);
  };

  const getTotalValue = () => {
    return rows.reduce((total, row) => {
      const quantity = parseFloat(row.quantity) || 0;
      const unitPrice = parseFloat(row.unitPrice) || 0;
      return total + (quantity * unitPrice);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              ورود گروهی کالاها
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              ثبت ورود چندین کالا به صورت همزمان
            </p>
          </div>
          <button
            onClick={() => router.push('/workspaces/inventory-management/inventory')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            بازگشت
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              لیست کالاها
            </h2>
            <button
              type="button"
              onClick={addRow}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              افزودن ردیف
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    کالا *
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    مقدار *
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    قیمت واحد (ریال)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    شماره دسته
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    تاریخ انقضا
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    توضیحات
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {rows.map((row) => {
                  const selectedItem = getSelectedItem(row.itemId);
                  return (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4 whitespace-nowrap">
                        {itemsLoading ? (
                          <div className="text-sm text-gray-500">در حال بارگذاری...</div>
                        ) : (
                          <select
                            value={row.itemId}
                            onChange={(e) => updateRow(row.id, 'itemId', e.target.value)}
                            required
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm"
                          >
                            <option value="">انتخاب کنید...</option>
                            {items.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} - {item.category}
                              </option>
                            ))}
                          </select>
                        )}
                        {selectedItem && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            واحد: {selectedItem.unit}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <FormattedNumberInput
                          value={row.quantity}
                          onChange={(value: string) => updateRow(row.id, 'quantity', value)}
                          placeholder="مقدار"
                          min={0.01}
                          step="0.01"
                          disabled={loading}
                          allowDecimals={true}
                          className="text-sm"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <FormattedNumberInput
                          value={row.unitPrice}
                          onChange={(value: string) => updateRow(row.id, 'unitPrice', value)}
                          placeholder="قیمت"
                          min={0}
                          step="1"
                          disabled={loading}
                          allowDecimals={false}
                          className="text-sm"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={row.batchNumber}
                          onChange={(e) => updateRow(row.id, 'batchNumber', e.target.value)}
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="شماره دسته"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <FarsiDatePicker
                          value={row.expiryDate}
                          onChange={(value) => updateRow(row.id, 'expiryDate', value)}
                          disabled={loading}
                          placeholder="تاریخ انقضا"
                          className="text-sm"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="text"
                          value={row.note}
                          onChange={(e) => updateRow(row.id, 'note', e.target.value)}
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="توضیحات"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          disabled={loading || rows.length === 1}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="حذف ردیف"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {getTotalValue() > 0 && (
            <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">خلاصه ورود گروهی</h3>
              <div className="text-sm text-green-700 dark:text-green-300">
                <p>تعداد ردیف‌ها: {rows.length}</p>
                <p className="font-medium">
                  مبلغ کل: {getTotalValue().toLocaleString('fa-IR')} ریال
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 space-x-reverse">
          <Link
            href="/workspaces/inventory-management/inventory"
            className={`px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${loading ? 'pointer-events-none opacity-50' : ''}`}
          >
            انصراف
          </Link>
          <button
            type="submit"
            disabled={loading || rows.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -mr-1 ml-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                در حال ثبت...
              </>
            ) : (
              `ثبت ${rows.length} ورودی`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

