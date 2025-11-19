'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OrderingSettingsService, OrderingSettings } from '../../../../services/orderingService';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../contexts/AuthContext';

export default function OrderingSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<OrderingSettings | null>(null);
  const [orderCreationEnabled, setOrderCreationEnabled] = useState(true);
  const [lockItemsWithoutStock, setLockItemsWithoutStock] = useState(false);
  const [requireManagerConfirmationForNoStock, setRequireManagerConfirmationForNoStock] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await OrderingSettingsService.getOrderingSettings();
        setSettings(data);
        setOrderCreationEnabled(data.orderCreationEnabled);
        setLockItemsWithoutStock(data.lockItemsWithoutStock);
        setRequireManagerConfirmationForNoStock(data.requireManagerConfirmationForNoStock);
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
      const result = await OrderingSettingsService.updateOrderingSettings({
        orderCreationEnabled,
        lockItemsWithoutStock,
        requireManagerConfirmationForNoStock
      });
      setSettings(result);
      toast.success('تنظیمات با موفقیت ذخیره شد');
    } catch (error) {
      console.error('Error saving settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطا در ذخیره تنظیمات';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Check if user has permission to change settings (ADMIN or MANAGER)
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const hasChanges = settings && (
    orderCreationEnabled !== settings.orderCreationEnabled ||
    lockItemsWithoutStock !== settings.lockItemsWithoutStock ||
    requireManagerConfirmationForNoStock !== settings.requireManagerConfirmationForNoStock
  );

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
              تنظیمات سیستم سفارش‌گیری
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              مدیریت تنظیمات سیستم POS و سفارش‌گیری
            </p>
          </div>
          <button
            onClick={() => router.push('/workspaces/ordering-sales-system')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            بازگشت
          </button>
        </div>
      </div>

      {/* Order Creation Enabled Setting */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          تنظیمات ثبت سفارش
        </h2>

        <div className="space-y-6">
          {/* Order Creation Enabled Toggle */}
          <div className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                فعال‌سازی ثبت سفارش
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                با غیرفعال‌سازی این گزینه، ثبت سفارشات جدید در سیستم غیرفعال می‌شود.
                این قابلیت برای مواقعی که می‌خواهید موقتاً ثبت سفارش را متوقف کنید مفید است.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {orderCreationEnabled ? (
                  <span className="text-green-600 dark:text-green-400">
                    ✓ در حال حاضر ثبت سفارش فعال است
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">
                    ✗ در حال حاضر ثبت سفارش غیرفعال است
                  </span>
                )}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderCreationEnabled}
                  onChange={(e) => setOrderCreationEnabled(e.target.checked)}
                  disabled={!canEdit || saving}
                  className="sr-only peer"
                />
                <div className="relative w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 transition-colors">
                  <div className="absolute top-[2px] w-6 h-6 bg-white border border-gray-300 dark:border-gray-600 rounded-full transition-all duration-200 ease-in-out peer-checked:translate-x-7 peer-checked:left-0 right-[2px]"></div>
                </div>
              </label>
            </div>
          </div>

          {/* Information Box for Order Creation */}
          <div className={`p-4 rounded-lg border ${
            orderCreationEnabled
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {orderCreationEnabled ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="mr-3">
                <h3 className={`text-sm font-medium ${
                  orderCreationEnabled
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {orderCreationEnabled ? 'ثبت سفارش فعال' : 'ثبت سفارش غیرفعال'}
                </h3>
                <div className={`mt-2 text-sm ${
                  orderCreationEnabled
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {orderCreationEnabled ? (
                    <p>کاربران می‌توانند سفارشات جدید ثبت کنند.</p>
                  ) : (
                    <p>ثبت سفارشات جدید در سیستم غیرفعال است. کاربران نمی‌توانند سفارش جدید ثبت کنند.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Integration Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          تنظیمات یکپارچگی با موجودی
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          این تنظیمات برای آیتم‌هایی که دارای دستور پخت (Recipe) هستند و با سیستم موجودی یکپارچه شده‌اند اعمال می‌شود.
        </p>

        <div className="space-y-6">
          {/* Lock Items Without Stock Toggle */}
          <div className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                قفل کردن آیتم‌های بدون موجودی
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                با فعال‌سازی این گزینه، آیتم‌هایی که موجودی کافی ندارند (بر اساس دستور پخت) در منو قفل می‌شوند و قابل انتخاب نیستند.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {lockItemsWithoutStock ? (
                  <span className="text-orange-600 dark:text-orange-400">
                    ✓ آیتم‌های بدون موجودی قفل می‌شوند
                  </span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">
                    ✗ آیتم‌های بدون موجودی قفل نمی‌شوند
                  </span>
                )}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={lockItemsWithoutStock}
                  onChange={(e) => setLockItemsWithoutStock(e.target.checked)}
                  disabled={!canEdit || saving}
                  className="sr-only peer"
                />
                <div className="relative w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:bg-orange-600 transition-colors">
                  <div className="absolute top-[2px] w-6 h-6 bg-white border border-gray-300 dark:border-gray-600 rounded-full transition-all duration-200 ease-in-out peer-checked:translate-x-7 peer-checked:left-0 right-[2px]"></div>
                </div>
              </label>
            </div>
          </div>

          {/* Require Manager Confirmation Toggle */}
          <div className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                درخواست تأیید مدیر برای سفارشات بدون موجودی
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                با فعال‌سازی این گزینه، هنگام ثبت سفارش با آیتم‌های بدون موجودی، از مدیر تأیید گرفته می‌شود.
                حتی اگر موجودی منفی مجاز باشد، این تأیید لازم است.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {requireManagerConfirmationForNoStock ? (
                  <span className="text-blue-600 dark:text-blue-400">
                    ✓ تأیید مدیر برای سفارشات بدون موجودی لازم است
                  </span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">
                    ✗ تأیید مدیر لازم نیست
                  </span>
                )}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireManagerConfirmationForNoStock}
                  onChange={(e) => setRequireManagerConfirmationForNoStock(e.target.checked)}
                  disabled={!canEdit || saving}
                  className="sr-only peer"
                />
                <div className="relative w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 transition-colors">
                  <div className="absolute top-[2px] w-6 h-6 bg-white border border-gray-300 dark:border-gray-600 rounded-full transition-all duration-200 ease-in-out peer-checked:translate-x-7 peer-checked:left-0 right-[2px]"></div>
                </div>
              </label>
            </div>
          </div>

          {/* Information Box for Inventory Integration */}
          <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="mr-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  نحوه عملکرد
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <ul className="list-disc list-inside space-y-1">
                    <li>اگر موجودی منفی مجاز باشد: سفارشات قابل ثبت هستند اما هشدار نمایش داده می‌شود</li>
                    <li>اگر قفل کردن آیتم‌های بدون موجودی فعال باشد: آیتم‌های بدون موجودی در منو قفل می‌شوند</li>
                    <li>اگر تأیید مدیر فعال باشد: برای سفارشات با آیتم‌های بدون موجودی، تأیید مدیر لازم است</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {canEdit && (
        <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => router.push('/workspaces/ordering-sales-system')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            disabled={saving}
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
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
  );
}

