'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Item, InventoryEntryType, InventoryStatus } from '../../../../../../shared/types';
import * as inventoryService from '../../../../../services/inventoryService';
import * as itemService from '../../../../../services/itemService';
import toast from 'react-hot-toast';
import { FormattedNumberInput } from '../../../../../components/ui/FormattedNumberInput';

export default function RemoveInventoryPage() {
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [inventory, setInventory] = useState<InventoryStatus[]>([]);
  const [allowNegativeStock, setAllowNegativeStock] = useState(true);
  const [formData, setFormData] = useState({
    itemId: '',
    quantity: '',
    note: ''
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadData = async () => {
      try {
        setItemsLoading(true);
        const [itemsData, inventoryData, settingsData] = await Promise.all([
          itemService.getItems(),
          inventoryService.getCurrentInventory(),
          inventoryService.getInventorySettings().catch(() => null) // Load settings, default to null if fails
        ]);
        
        setItems(itemsData.filter(item => item.isActive));
        setInventory(inventoryData);
        if (settingsData) {
          setAllowNegativeStock(settingsData.allowNegativeStock);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('خطا در دریافت اطلاعات');
      } finally {
        setItemsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate required fields
      if (!formData.itemId) {
        toast.error('انتخاب کالا الزامی است');
        return;
      }

      if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
        toast.error('مقدار باید بیشتر از صفر باشد');
        return;
      }

      // Check current stock based on settings
      const currentStock = inventory.find(inv => inv.itemId === formData.itemId);
      if (!currentStock) {
        toast.error('کالای انتخاب شده یافت نشد');
        return;
      }

      // If negative stock is not allowed, validate availability
      if (!allowNegativeStock && currentStock.current < parseFloat(formData.quantity)) {
        toast.error(`موجودی کافی نیست. موجودی فعلی: ${currentStock.current} ${selectedItem?.unit || ''}`);
        return;
      }

      // Create inventory entry using real API
      await inventoryService.createInventoryEntry({
        itemId: formData.itemId,
        quantity: parseFloat(formData.quantity),
        type: InventoryEntryType.OUT,
        note: formData.note.trim() || undefined
      });

      toast.success('خروج کالا با موفقیت ثبت شد');
      
      // Navigate back dynamically
      const returnUrl = searchParams.get('returnUrl');
      if (returnUrl) {
        router.push(returnUrl);
      } else {
        router.push('/workspaces/inventory-management/inventory');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ثبت خروج کالا';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = items.find(item => item.id === formData.itemId);
  const currentStock = inventory.find(inv => inv.itemId === formData.itemId);
  const maxQuantity = currentStock?.current || 0;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              خروج کالا از انبار
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              ثبت خروج کالا از انبار
            </p>
          </div>
          <button
            onClick={() => {
              const returnUrl = searchParams.get('returnUrl');
              if (returnUrl) {
                router.push(returnUrl);
              } else {
                router.push('/workspaces/inventory-management/inventory');
              }
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            بازگشت
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="itemId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                انتخاب کالا *
              </label>
              {itemsLoading ? (
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700">
                  در حال بارگذاری کالاها...
                </div>
              ) : (
                <select
                  id="itemId"
                  name="itemId"
                  value={formData.itemId}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">انتخاب کنید...</option>
                  {items.map((item) => {
                    const stock = inventory.find(inv => inv.itemId === item.id);
                    return (
                      <option key={item.id} value={item.id}>
                        {item.name} - {item.category} (موجودی: {stock?.current || 0} {item.unit})
                      </option>
                    );
                  })}
                </select>
              )}
              {selectedItem && currentStock && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">واحد:</span> {selectedItem.unit}
                    <br />
                    <span className="font-medium">موجودی فعلی:</span> {currentStock.current.toLocaleString('fa-IR')} {selectedItem.unit}
                    {selectedItem.description && (
                      <>
                        <br />
                        <span className="font-medium">توضیحات:</span> {selectedItem.description}
                      </>
                    )}
                  </div>
                </div>
              )}
              {selectedItem && maxQuantity === 0 && !allowNegativeStock && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    این کالا موجودی ندارد و امکان خروج آن وجود ندارد.
                  </p>
                </div>
              )}
              {selectedItem && maxQuantity === 0 && allowNegativeStock && (
                <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    ⚠️ این کالا موجودی ندارد. با توجه به تنظیمات، امکان خروج با موجودی منفی وجود دارد.
                  </p>
                </div>
              )}
            </div>

            <div>
              <FormattedNumberInput
                label="مقدار *"
                value={formData.quantity}
                onChange={(value: string) => handleChange({ target: { name: 'quantity', value } } as React.ChangeEvent<HTMLInputElement>)}
                placeholder="مقدار خروجی"
                min={0.01}
                max={allowNegativeStock ? undefined : maxQuantity}
                step="0.01"
                disabled={loading || (!allowNegativeStock && maxQuantity === 0)}
                allowDecimals={true}
                required
              />
              {selectedItem && (
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <p>واحد: {selectedItem.unit}</p>
                  {allowNegativeStock ? (
                    <p className="text-yellow-600 dark:text-yellow-400">
                      موجودی فعلی: {maxQuantity.toLocaleString('fa-IR')} {selectedItem.unit} (موجودی منفی مجاز است)
                    </p>
                  ) : (
                    <p>حداکثر قابل خروج: {maxQuantity.toLocaleString('fa-IR')} {selectedItem.unit}</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                دلیل خروج *
              </label>
              <input
                type="text"
                id="note"
                name="note"
                value={formData.note}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="مثال: فروش، ضایعات، انتقال"
              />
            </div>
          </div>

          {formData.quantity && !allowNegativeStock && parseFloat(formData.quantity) > maxQuantity && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="mr-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                    مقدار بیش از موجودی
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>مقدار وارد شده ({parseFloat(formData.quantity).toLocaleString('fa-IR')}) بیشتر از موجودی فعلی ({maxQuantity.toLocaleString('fa-IR')}) است.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {formData.quantity && allowNegativeStock && parseFloat(formData.quantity) > maxQuantity && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="mr-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                    هشدار: موجودی منفی
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>مقدار وارد شده ({parseFloat(formData.quantity).toLocaleString('fa-IR')}) بیشتر از موجودی فعلی ({maxQuantity.toLocaleString('fa-IR')}) است.</p>
                    <p className="mt-1">با توجه به تنظیمات، این تراکنش ثبت خواهد شد و موجودی منفی خواهد شد.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {formData.quantity && parseFloat(formData.quantity) <= maxQuantity && parseFloat(formData.quantity) > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">خلاصه خروج</h3>
              <div className="text-sm text-red-700 dark:text-red-300">
                <p>مقدار خروج: {parseFloat(formData.quantity).toLocaleString('fa-IR')} {selectedItem?.unit || ''}</p>
                <p>موجودی باقی‌مانده: {(maxQuantity - parseFloat(formData.quantity)).toLocaleString('fa-IR')} {selectedItem?.unit || ''}</p>
                <p className="font-medium">دلیل: {formData.note}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 space-x-reverse">
            <button
              onClick={() => {
                const returnUrl = searchParams.get('returnUrl');
                if (returnUrl) {
                  router.push(returnUrl);
                } else {
                  router.push('/workspaces/inventory-management/inventory');
                }
              }}
              className={`px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${loading ? 'pointer-events-none opacity-50' : ''}`}
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading || !formData.itemId || !formData.quantity || !formData.note || (!allowNegativeStock && (parseFloat(formData.quantity || '0') > maxQuantity || maxQuantity === 0))}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
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
                'ثبت خروج کالا'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 