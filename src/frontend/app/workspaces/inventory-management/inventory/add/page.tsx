'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Item, InventoryEntryType } from '../../../../../../shared/types';
import * as inventoryService from '../../../../../services/inventoryService';
import * as itemService from '../../../../../services/itemService';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';

export default function AddInventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    itemId: '',
    quantity: '',
    unitPrice: '',
    batchNumber: '',
    expiryDate: '',
    note: ''
  });
  const router = useRouter();
  const searchParams = useSearchParams();

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

      // Create inventory entry using real API
      await inventoryService.createInventoryEntry({
        itemId: formData.itemId,
        quantity: parseFloat(formData.quantity),
        type: InventoryEntryType.IN,
        note: formData.note.trim() || undefined,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined,
        batchNumber: formData.batchNumber.trim() || undefined,
        expiryDate: formData.expiryDate || undefined
      });

      toast.success('ورود کالا با موفقیت ثبت شد');
      
      // Navigate back dynamically
      const returnUrl = searchParams.get('returnUrl');
      if (returnUrl) {
        router.push(returnUrl);
      } else {
        router.push('/workspaces/inventory-management/inventory');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ثبت ورود کالا';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = items.find(item => item.id === formData.itemId);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              ورود کالا به انبار
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              ثبت ورود کالای جدید به انبار
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
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
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">واحد:</span> {selectedItem.unit}
                    {selectedItem.description && (
                      <>
                        <br />
                        <span className="font-medium">توضیحات:</span> {selectedItem.description}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                مقدار *
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="مقدار ورودی"
              />
              {selectedItem && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  واحد: {selectedItem.unit}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                قیمت واحد (ریال)
              </label>
              <input
                type="number"
                id="unitPrice"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                min="0"
                step="1"
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="قیمت خرید"
              />
            </div>

            <div>
              <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                شماره دسته
              </label>
              <input
                type="text"
                id="batchNumber"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="شماره دسته تولید"
              />
            </div>

            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تاریخ انقضا
              </label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              توضیحات
            </label>
            <textarea
              id="note"
              name="note"
              value={formData.note}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="توضیحات اضافی در مورد ورود کالا"
            />
          </div>

          {formData.quantity && formData.unitPrice && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">خلاصه ورود</h3>
              <div className="text-sm text-green-700 dark:text-green-300">
                <p>مقدار: {parseFloat(formData.quantity).toLocaleString('fa-IR')} {selectedItem?.unit || ''}</p>
                <p>قیمت واحد: {parseFloat(formData.unitPrice).toLocaleString('fa-IR')} ریال</p>
                <p className="font-medium">
                  مبلغ کل: {(parseFloat(formData.quantity) * parseFloat(formData.unitPrice)).toLocaleString('fa-IR')} ریال
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 space-x-reverse">
            <Link
              href="/workspaces/inventory-management/inventory/transactions"
              className={`px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${loading ? 'pointer-events-none opacity-50' : ''}`}
            >
              انصراف
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.itemId || !formData.quantity}
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
                'ثبت ورود کالا'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 