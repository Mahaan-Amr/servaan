 'use client';

import React, { useState, useEffect } from 'react';
import { FaUpload, FaCheck, FaPlus } from 'react-icons/fa';
import { Modal } from '@/components/ui/Modal';
import { TableService } from '@/services/orderingService';
import { Table, TableStatus } from '@/types/ordering';
import toast from 'react-hot-toast';

interface BulkOperationsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onTablesUpdated?: () => void;
}

export const BulkOperationsManager: React.FC<BulkOperationsManagerProps> = ({
  isOpen,
  onClose,
  onTablesUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'import' | 'templates'>('status');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTables, setSelectedTables] = useState<Table[]>([]);
  const [bulkStatus, setBulkStatus] = useState<TableStatus>(TableStatus.AVAILABLE);
  const [bulkReason, setBulkReason] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadTables();
    }
  }, [isOpen]);

  const loadTables = async () => {
    try {
      const response = await TableService.getTables();
      setTables(response as Table[]);
    } catch (error) {
      console.error('Error loading tables:', error);
      setError('خطا در بارگذاری میزها');
    }
  };

  const handleBulkStatusChange = async () => {
    if (selectedTables.length === 0) {
      setError('حداقل یک میز انتخاب کنید');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await TableService.bulkChangeStatus(
        selectedTables.map(t => t.id),
        bulkStatus,
        bulkReason
      ) as { data: { summary: { successful: number } } };

      toast.success(`وضعیت ${response.data.summary.successful} میز با موفقیت تغییر کرد`);
      
      setSelectedTables([]);
      setBulkStatus(TableStatus.AVAILABLE);
      setBulkReason('');
      
      loadTables();
      onTablesUpdated?.();
    } catch (error: unknown) {
      console.error('Error in bulk status change:', error);
      setError(error instanceof Error ? error.message : 'خطا در تغییر وضعیت گروهی');
    } finally {
      setLoading(false);
    }
  };

  const toggleTableSelection = (table: Table) => {
    setSelectedTables(prev => {
      const isSelected = prev.some(t => t.id === table.id);
      if (isSelected) {
        return prev.filter(t => t.id !== table.id);
      } else {
        return [...prev, table];
      }
    });
  };

  const getStatusInfo = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return { label: 'آزاد', icon: '🟢' };
      case TableStatus.OCCUPIED:
        return { label: 'مشغول', icon: '🔴' };
      case TableStatus.RESERVED:
        return { label: 'رزرو شده', icon: '🔵' };
      case TableStatus.CLEANING:
        return { label: 'در حال تمیزکاری', icon: '🟡' };
      case TableStatus.OUT_OF_ORDER:
        return { label: 'خارج از سرویس', icon: '⚫' };
      default:
        return { label: status, icon: '❓' };
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      title="عملیات گروهی میزها"
      onClose={onClose}
      size="large"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 rtl:space-x-reverse border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'status'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FaCheck className="inline ml-2" />
            تغییر وضعیت
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'import'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FaUpload className="inline ml-2" />
            وارد کردن
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'templates'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FaPlus className="inline ml-2" />
            قالب‌ها
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Bulk Status Change */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  وضعیت جدید
                </label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as TableStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {Object.values(TableStatus).map((status) => {
                    const statusInfo = getStatusInfo(status);
                    return (
                      <option key={status} value={status}>
                        {statusInfo.label} {statusInfo.icon}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  دلیل تغییر
                </label>
                <input
                  type="text"
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="دلیل تغییر وضعیت..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تعداد انتخاب شده
                </label>
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {selectedTables.length} میز
                </div>
              </div>
            </div>

            {/* Tables Grid */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                انتخاب میزها
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-64 overflow-y-auto">
                {tables.map((table) => {
                  const statusInfo = getStatusInfo(table.status);
                  const isSelected = selectedTables.some(t => t.id === table.id);
                  
                  return (
                    <button
                      key={table.id}
                      onClick={() => toggleTableSelection(table)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">{statusInfo.icon}</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          میز {table.tableNumber}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {statusInfo.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => setSelectedTables(tables)}
                  className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  انتخاب همه
                </button>
                <button
                  onClick={() => setSelectedTables([])}
                  className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  حذف انتخاب
                </button>
              </div>
              
              <button
                onClick={handleBulkStatusChange}
                disabled={loading || selectedTables.length === 0}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'در حال تغییر...' : `تغییر ${selectedTables.length} میز`}
              </button>
            </div>
          </div>
        )}

        {/* Import Tables */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                وارد کردن میزها
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                این قابلیت به زودی اضافه خواهد شد.
              </p>
            </div>
          </div>
        )}

        {/* Templates */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                ایجاد میز از قالب
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                این قابلیت به زودی اضافه خواهد شد.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};