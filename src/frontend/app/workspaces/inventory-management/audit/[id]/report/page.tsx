'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import * as auditService from '../../../../../../services/auditService';
import { DiscrepancyReport } from '../../../../../../services/auditService';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../../../contexts/AuthContext';

export default function DiscrepancyReportPage() {
  const params = useParams();
  const auditCycleId = params.id as string;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<DiscrepancyReport | null>(null);
  const [correctionReasons, setCorrectionReasons] = useState<Record<string, string>>({});
  const [applyingCorrections, setApplyingCorrections] = useState<Set<string>>(new Set());

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const data = await auditService.generateDiscrepancyReport(auditCycleId);
      setReport(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت گزارش';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [auditCycleId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleApplyCorrection = async (auditEntryId: string) => {
    const reason = correctionReasons[auditEntryId]?.trim();
    if (!reason) {
      toast.error('دلیل اصلاح الزامی است');
      return;
    }

    try {
      setApplyingCorrections(prev => new Set(prev).add(auditEntryId));
      await auditService.applyCorrection(auditEntryId, reason);
      toast.success('اصلاح موجودی با موفقیت اعمال شد');
      loadReport(); // Reload to update correction status
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در اعمال اصلاح';
      toast.error(errorMessage);
    } finally {
      setApplyingCorrections(prev => {
        const newSet = new Set(prev);
        newSet.delete(auditEntryId);
        return newSet;
      });
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

  if (!report) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-400">گزارش یافت نشد</p>
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
              گزارش اختلاف موجودی
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              چرخه: {report.auditCycle.name}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">کل آیتم‌ها</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {report.totalItems}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">آیتم‌های دارای اختلاف</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">
            {report.itemsWithDiscrepancy}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">مجموع اختلاف</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
            {report.totalDiscrepancyValue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Discrepancies Table */}
      {report.discrepancies.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">هیچ اختلافی یافت نشد. موجودی سیستم با شمارش فیزیکی مطابقت دارد.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    کالا
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    موجودی سیستم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    موجودی شمارش شده
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    اختلاف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    دلیل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    وضعیت اصلاح
                  </th>
                  {canManage && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      عملیات
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {report.discrepancies.map((discrepancy) => (
                  <tr key={discrepancy.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {discrepancy.itemName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {discrepancy.itemCategory} • {discrepancy.itemUnit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {discrepancy.systemQuantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {discrepancy.countedQuantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        discrepancy.discrepancy > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {discrepancy.discrepancy > 0 ? '+' : ''}
                        {discrepancy.discrepancy.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {discrepancy.reason || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {discrepancy.correctionApplied ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          اصلاح شده
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          در انتظار اصلاح
                        </span>
                      )}
                    </td>
                    {canManage && !discrepancy.correctionApplied && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={correctionReasons[discrepancy.id] || ''}
                            onChange={(e) => setCorrectionReasons(prev => ({
                              ...prev,
                              [discrepancy.id]: e.target.value
                            }))}
                            placeholder="دلیل اصلاح"
                            className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <button
                            onClick={() => handleApplyCorrection(discrepancy.id)}
                            disabled={applyingCorrections.has(discrepancy.id) || !correctionReasons[discrepancy.id]?.trim()}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {applyingCorrections.has(discrepancy.id) ? 'در حال اعمال...' : 'اعمال اصلاح'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

