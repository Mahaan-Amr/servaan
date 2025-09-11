'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Supplier } from '../../../../../shared/types';
import * as supplierService from '../../../../services/supplierService';
import { useAuth } from '../../../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function SuppliersPage() {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { hasAccess } = useAuth();

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const suppliersData = await supplierService.getSuppliers();
        setSuppliers(suppliersData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت تأمین‌کنندگان';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadSuppliers();
  }, []);

  const handleDeleteSupplier = async (supplierId: string, supplierName: string) => {
    if (!hasAccess('ADMIN')) {
      toast.error('شما دسترسی لازم برای حذف تأمین‌کننده را ندارید');
      return;
    }

    const confirmDelete = window.confirm(
      `آیا از حذف تأمین‌کننده "${supplierName}" اطمینان دارید؟\n\nاگر این تأمین‌کننده کالاهای مرتبط داشته باشد، به حالت غیرفعال تغییر خواهد کرد.`
    );

    if (!confirmDelete) return;

    try {
      setDeleting(supplierId);
      const result = await supplierService.deleteSupplier(supplierId);
      
      toast.success(result.message);
      
      // Refresh suppliers list
      const updatedSuppliers = await supplierService.getSuppliers();
      setSuppliers(updatedSuppliers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در حذف تأمین‌کننده';
      toast.error(errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  const getStats = () => {
    const total = suppliers.length;
    const active = suppliers.filter(s => s.isActive).length;
    const inactive = suppliers.filter(s => !s.isActive).length;
    
    return { total, active, inactive };
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
                خطا در دریافت تأمین‌کنندگان
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
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              مدیریت تأمین‌کنندگان
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              مشاهده و مدیریت لیست تأمین‌کنندگان
            </p>
          </div>
          {hasAccess('MANAGER') && (
            <Link
              href="/workspaces/inventory-management/suppliers/add"
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              افزودن تأمین‌کننده
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="mr-2 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">کل تأمین‌کنندگان</p>
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
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">فعال</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
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
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">غیرفعال</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">{stats.inactive}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">لیست تأمین‌کنندگان</h2>
        </div>

        {suppliers.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">هیچ تأمین‌کننده‌ای ثبت نشده</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              با کلیک بر روی دکمه زیر اولین تأمین‌کننده را اضافه کنید.
            </p>
            {hasAccess('MANAGER') && (
              <div className="mt-4 sm:mt-6">
                <Link
                  href="/workspaces/inventory-management/suppliers/add"
                  className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  افزودن تأمین‌کننده جدید
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                    نام شرکت
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px] hidden md:table-cell">
                    شخص تماس
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px] hidden lg:table-cell">
                    شماره تلفن
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px] hidden xl:table-cell">
                    ایمیل
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[80px]">
                    وضعیت
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white break-words">
                        {supplier.name}
                      </div>
                      {/* Show contact info on mobile */}
                      <div className="md:hidden mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {supplier.contactName && (
                          <div>تماس: {supplier.contactName}</div>
                        )}
                        {supplier.phoneNumber && (
                          <div>تلفن: {supplier.phoneNumber}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 hidden md:table-cell">
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-words">
                        {supplier.contactName || '-'}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 hidden lg:table-cell">
                      <div className="text-xs sm:text-sm text-gray-900 dark:text-white break-words">
                        {supplier.phoneNumber || '-'}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 hidden xl:table-cell">
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-words">
                        {supplier.email || '-'}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                      <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        supplier.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {supplier.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium">
                      <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
                        <Link
                          href={`/workspaces/inventory-management/suppliers/${supplier.id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-xs sm:text-sm"
                        >
                          مشاهده
                        </Link>
                        {hasAccess('MANAGER') && (
                          <Link
                            href={`/workspaces/inventory-management/suppliers/${supplier.id}/edit`}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 text-xs sm:text-sm"
                          >
                            ویرایش
                          </Link>
                        )}
                        {hasAccess('ADMIN') && (
                          <button
                            onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                            disabled={deleting === supplier.id}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                          >
                            {deleting === supplier.id ? 'در حال حذف...' : 'حذف'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 