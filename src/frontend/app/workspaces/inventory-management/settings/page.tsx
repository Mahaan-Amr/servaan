'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getInventorySettings, updateInventorySettings, InventorySettings } from '../../../../services/inventoryService';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../contexts/AuthContext';

export default function InventorySettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<InventorySettings | null>(null);
  const [allowNegativeStock, setAllowNegativeStock] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await getInventorySettings();
        setSettings(data);
        setAllowNegativeStock(data.allowNegativeStock);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('خطا در دریافت تنظیمات');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await updateInventorySettings({ allowNegativeStock });
      setSettings(result.settings);
      toast.success('تنظیمات با موفقیت ذخیره شد');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  // Check if user has permission to change settings (ADMIN or MANAGER)
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
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
              تنظیمات موجودی
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              مدیریت تنظیمات سیستم موجودی
            </p>
          </div>
          <button
            onClick={() => router.push('/workspaces/inventory-management')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            بازگشت
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          تنظیمات موجودی منفی
        </h2>

        <div className="space-y-6">
          {/* Allow Negative Stock Toggle */}
          <div className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                اجازه موجودی منفی
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                با فعال‌سازی این گزینه، سیستم اجازه می‌دهد که موجودی کالاها به مقدار منفی برسد.
                این قابلیت برای کسب‌وکارهایی که نیاز به ثبت سفارشات با موجودی ناکافی دارند مفید است.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {allowNegativeStock ? (
                  <span className="text-green-600 dark:text-green-400">
                    ✓ در حال حاضر موجودی منفی مجاز است
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">
                    ✗ در حال حاضر موجودی منفی مجاز نیست
                  </span>
                )}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowNegativeStock}
                  onChange={(e) => setAllowNegativeStock(e.target.checked)}
                  disabled={!canEdit || saving}
                  className="sr-only peer"
                />
                <div className="relative w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 transition-colors">
                  <div className="absolute top-[2px] w-6 h-6 bg-white border border-gray-300 dark:border-gray-600 rounded-full transition-all duration-200 ease-in-out peer-checked:translate-x-7 peer-checked:left-0 right-[2px]"></div>
                </div>
              </label>
            </div>
          </div>

          {/* Information Box */}
          <div className={`p-4 rounded-lg border ${
            allowNegativeStock
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {allowNegativeStock ? (
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="mr-3">
                <h3 className={`text-sm font-medium ${
                  allowNegativeStock
                    ? 'text-blue-800 dark:text-blue-200'
                    : 'text-yellow-800 dark:text-yellow-200'
                }`}>
                  {allowNegativeStock ? 'حالت فعال' : 'حالت غیرفعال'}
                </h3>
                <div className={`mt-2 text-sm ${
                  allowNegativeStock
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-yellow-700 dark:text-yellow-300'
                }`}>
                  {allowNegativeStock ? (
                    <ul className="list-disc list-inside space-y-1">
                      <li>سیستم اجازه می‌دهد موجودی به مقدار منفی برسد</li>
                      <li>سفارشات حتی با موجودی ناکافی قابل ثبت هستند</li>
                      <li>هشدارها نمایش داده می‌شوند اما مانع ثبت نمی‌شوند</li>
                    </ul>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      <li>سیستم از ثبت تراکنش‌هایی که باعث موجودی منفی می‌شوند جلوگیری می‌کند</li>
                      <li>سفارشات فقط در صورت موجودی کافی قابل ثبت هستند</li>
                      <li>کنترل دقیق‌تر موجودی برای جلوگیری از فروش بیش از موجودی</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          {canEdit && (
            <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => router.push('/workspaces/inventory-management')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={saving}
              >
                انصراف
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !settings || allowNegativeStock === settings.allowNegativeStock}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -mr-1 ml-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    در حال ذخیره...
                  </>
                ) : (
                  'ذخیره تنظیمات'
                )}
              </button>
            </div>
          )}

          {!canEdit && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                شما مجوز تغییر تنظیمات را ندارید. فقط مدیران و ادمین‌ها می‌توانند تنظیمات را تغییر دهند.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

