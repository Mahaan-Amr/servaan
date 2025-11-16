'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import * as auditService from '../../../../services/auditService';
import { AuditCycle } from '../../../../services/auditService';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../contexts/AuthContext';

export default function AuditCyclesPage() {
  const [cycles, setCycles] = useState<AuditCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const { user } = useAuth();

  const loadCycles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: { status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' } = {};
      if (statusFilter !== 'ALL') {
        filters.status = statusFilter as 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
      }
      const data = await auditService.getAuditCycles(filters);
      setCycles(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت چرخه‌های انبارگردانی';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadCycles();
  }, [loadCycles]);


  const handleStartCycle = async (id: string) => {
    try {
      await auditService.startAuditCycle(id);
      toast.success('چرخه انبارگردانی با موفقیت شروع شد');
      loadCycles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در شروع چرخه انبارگردانی';
      toast.error(errorMessage);
    }
  };

  const handleCompleteCycle = async (id: string) => {
    try {
      await auditService.completeAuditCycle(id);
      toast.success('چرخه انبارگردانی با موفقیت تکمیل شد');
      loadCycles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در تکمیل چرخه انبارگردانی';
      toast.error(errorMessage);
    }
  };

  const handleCancelCycle = async (id: string) => {
    const reason = prompt('دلیل لغو چرخه انبارگردانی را وارد کنید:');
    if (!reason || reason.trim() === '') {
      toast.error('دلیل لغو الزامی است');
      return;
    }

    try {
      await auditService.cancelAuditCycle(id, reason);
      toast.success('چرخه انبارگردانی با موفقیت لغو شد');
      loadCycles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در لغو چرخه انبارگردانی';
      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'پیش‌نویس';
      case 'IN_PROGRESS':
        return 'در حال انجام';
      case 'COMPLETED':
        return 'تکمیل شده';
      case 'CANCELLED':
        return 'لغو شده';
      default:
        return status;
    }
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              انبارگردانی دوره‌ای
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              مدیریت چرخه‌های انبارگردانی و شمارش موجودی
            </p>
          </div>
          {canManage && (
            <Link
              href="/workspaces/inventory-management/audit/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              ایجاد چرخه جدید
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              وضعیت
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">همه</option>
              <option value="DRAFT">پیش‌نویس</option>
              <option value="IN_PROGRESS">در حال انجام</option>
              <option value="COMPLETED">تکمیل شده</option>
              <option value="CANCELLED">لغو شده</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Cycles List */}
      {cycles.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">هیچ چرخه انبارگردانی یافت نشد</p>
          {canManage && (
            <Link
              href="/workspaces/inventory-management/audit/create"
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ایجاد چرخه جدید
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {cycles.map((cycle) => (
            <div
              key={cycle.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {cycle.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cycle.status)}`}>
                      {getStatusLabel(cycle.status)}
                    </span>
                  </div>
                  {cycle.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {cycle.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">تاریخ شروع:</span>{' '}
                      {new Date(cycle.startDate).toLocaleDateString('fa-IR')}
                    </div>
                    <div>
                      <span className="font-medium">تاریخ پایان:</span>{' '}
                      {new Date(cycle.endDate).toLocaleDateString('fa-IR')}
                    </div>
                    {cycle._count && (
                      <div>
                        <span className="font-medium">تعداد ورودی‌ها:</span> {cycle._count.entries}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                    ایجاد شده توسط: {cycle.createdByUser?.name || 'نامشخص'} در{' '}
                    {new Date(cycle.createdAt).toLocaleDateString('fa-IR')}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cycle.status === 'DRAFT' && canManage && (
                    <button
                      onClick={() => handleStartCycle(cycle.id)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      شروع
                    </button>
                  )}
                  {cycle.status === 'IN_PROGRESS' && (
                    <>
                      <Link
                        href={`/workspaces/inventory-management/audit/${cycle.id}/count`}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        ثبت شمارش
                      </Link>
                      <Link
                        href={`/workspaces/inventory-management/audit/${cycle.id}/report`}
                        className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        گزارش اختلاف
                      </Link>
                      {canManage && (
                        <button
                          onClick={() => handleCompleteCycle(cycle.id)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          تکمیل
                        </button>
                      )}
                    </>
                  )}
                  {(cycle.status === 'DRAFT' || cycle.status === 'IN_PROGRESS') && canManage && (
                    <button
                      onClick={() => handleCancelCycle(cycle.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      لغو
                    </button>
                  )}
                  {cycle.status === 'COMPLETED' && (
                    <Link
                      href={`/workspaces/inventory-management/audit/${cycle.id}/report`}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      مشاهده گزارش
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

