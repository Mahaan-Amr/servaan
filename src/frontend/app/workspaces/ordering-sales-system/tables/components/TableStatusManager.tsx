'use client';

import React, { useState, useEffect } from 'react';
import { FaEdit, FaHistory, FaCheck, FaArrowRight } from 'react-icons/fa';
import { Modal } from '@/components/ui/Modal';
import { TableService } from '@/services/orderingService';
import { Table, TableStatus } from '@/types/ordering';
import { formatDate, getRelativeTime } from '@/utils/dateUtils';
import toast from 'react-hot-toast';

interface TableStatusManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable?: Table;
  onStatusChanged?: (tableId: string, newStatus: TableStatus) => void;
}

interface StatusChangeHistory {
  id: string;
  tableId: string;
  oldStatus: TableStatus;
  newStatus: TableStatus;
  reason?: string;
  changedBy: string;
  changedByUser: {
    id: string;
    name: string;
  };
  changedAt: Date;
  notes?: string;
}

interface StatusChangeRequest {
  tableId: string;
  newStatus: TableStatus;
  reason?: string;
  notes?: string;
  assignedStaff?: string;
}

export const TableStatusManager: React.FC<TableStatusManagerProps> = ({
  isOpen,
  onClose,
  selectedTable,
  onStatusChanged
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'quick' | 'history' | 'bulk'>('quick');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [statusHistory, setStatusHistory] = useState<StatusChangeHistory[]>([]);
  const [selectedTables, setSelectedTables] = useState<Table[]>([]);
  const [tables, setTables] = useState<Table[]>([]);

  // Form state
  const [statusChangeData, setStatusChangeData] = useState<StatusChangeRequest>({
    tableId: '',
    newStatus: TableStatus.AVAILABLE,
    reason: '',
    notes: '',
    assignedStaff: ''
  });

  // Bulk operations
  const [bulkStatus, setBulkStatus] = useState<TableStatus>(TableStatus.AVAILABLE);
  const [bulkReason, setBulkReason] = useState<string>('');
  const [bulkNotes, setBulkNotes] = useState<string>('');

  // Initialize component
  useEffect(() => {
    if (isOpen) {
      loadTables();
      if (selectedTable) {
        setStatusChangeData(prev => ({
          ...prev,
          tableId: selectedTable.id
        }));
        loadStatusHistory(selectedTable.id);
      }
    }
  }, [isOpen, selectedTable]);

  // Load tables
  const loadTables = async () => {
    try {
      const response = await TableService.getTables();
      setTables(response as Table[]);
    } catch (error) {
      console.error('Error loading tables:', error);
      setError('خطا در بارگذاری میزها');
    }
  };

  // Load status history
  const loadStatusHistory = async (tableId: string) => {
    try {
      setLoading(true);
      // Note: This would require a getTableStatusHistory method in TableService
      // For now, we'll use mock data
      const mockHistory: StatusChangeHistory[] = [
        {
          id: '1',
          tableId,
          oldStatus: TableStatus.AVAILABLE,
          newStatus: TableStatus.OCCUPIED,
          reason: 'مشتری نشست',
          changedBy: 'user1',
          changedByUser: { id: 'user1', name: 'احمد محمدی' },
          changedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          notes: 'مشتری ۴ نفره'
        },
        {
          id: '2',
          tableId,
          oldStatus: TableStatus.OCCUPIED,
          newStatus: TableStatus.CLEANING,
          reason: 'مشتری رفت',
          changedBy: 'user1',
          changedByUser: { id: 'user1', name: 'احمد محمدی' },
          changedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          notes: 'نیاز به تمیزکاری'
        }
      ];
      setStatusHistory(mockHistory);
    } catch (error) {
      console.error('Error loading status history:', error);
      setError('خطا در بارگذاری تاریخچه وضعیت');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleFormChange = (field: keyof StatusChangeRequest, value: string | TableStatus) => {
    setStatusChangeData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Handle status change
  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!statusChangeData.tableId) {
      setError('انتخاب میز الزامی است');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Call the existing TableService.changeTableStatus
      await TableService.changeTableStatus(
        statusChangeData.tableId,
        statusChangeData.newStatus,
        statusChangeData.reason
      );
      
      toast.success('وضعیت میز با موفقیت تغییر کرد');
      onStatusChanged?.(statusChangeData.tableId, statusChangeData.newStatus);
      
      // Reset form
      setStatusChangeData({
        tableId: selectedTable?.id || '',
        newStatus: TableStatus.AVAILABLE,
        reason: '',
        notes: '',
        assignedStaff: ''
      });
      
      // Reload data
      loadTables();
      if (selectedTable) {
        loadStatusHistory(selectedTable.id);
      }
    } catch (error: unknown) {
      console.error('Error changing table status:', error);
      setError(error instanceof Error ? error.message : 'خطا در تغییر وضعیت میز');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk status change
  const handleBulkStatusChange = async () => {
    if (selectedTables.length === 0) {
      setError('حداقل یک میز انتخاب کنید');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Change status for all selected tables
      const promises = selectedTables.map(table =>
        TableService.changeTableStatus(table.id, bulkStatus, bulkReason)
      );

      await Promise.all(promises);
      
      toast.success(`${selectedTables.length} میز با موفقیت تغییر وضعیت داد`);
      setSelectedTables([]);
      setBulkStatus(TableStatus.AVAILABLE);
      setBulkReason('');
      setBulkNotes('');
      
      loadTables();
    } catch (error: unknown) {
      console.error('Error in bulk status change:', error);
      setError(error instanceof Error ? error.message : 'خطا در تغییر وضعیت گروهی');
    } finally {
      setLoading(false);
    }
  };

  // Get status display info
  const getStatusInfo = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return { 
          label: 'آزاد', 
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          icon: '🟢'
        };
      case TableStatus.OCCUPIED:
        return { 
          label: 'مشغول', 
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          icon: '🔴'
        };
      case TableStatus.RESERVED:
        return { 
          label: 'رزرو شده', 
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          icon: '🔵'
        };
      case TableStatus.CLEANING:
        return { 
          label: 'در حال تمیزکاری', 
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          icon: '🟡'
        };
      case TableStatus.OUT_OF_ORDER:
        return { 
          label: 'خارج از سرویس', 
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          icon: '⚫'
        };
      default:
        return { 
          label: status, 
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          icon: '❓'
        };
    }
  };

  // Quick status change handlers
  const handleQuickStatusChange = async (tableId: string, newStatus: TableStatus, reason?: string) => {
    try {
      setLoading(true);
      await TableService.changeTableStatus(tableId, newStatus, reason);
      toast.success('وضعیت میز با موفقیت تغییر کرد');
      onStatusChanged?.(tableId, newStatus);
      loadTables();
    } catch (error: unknown) {
      console.error('Error in quick status change:', error);
      toast.error('خطا در تغییر وضعیت میز');
    } finally {
      setLoading(false);
    }
  };

  // Toggle table selection for bulk operations
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

  if (!isOpen) return null;

  return (
    <Modal
      title="مدیریت وضعیت میزها"
      onClose={onClose}
      size="large"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 rtl:space-x-reverse border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('quick')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'quick'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FaEdit className="inline ml-2" />
            تغییر سریع
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FaHistory className="inline ml-2" />
            تاریخچه
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'bulk'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FaCheck className="inline ml-2" />
            تغییر گروهی
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Quick Status Change */}
        {activeTab === 'quick' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Table Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  انتخاب میز
                </label>
                <select
                  value={statusChangeData.tableId}
                  onChange={(e) => handleFormChange('tableId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">انتخاب کنید</option>
                  {tables.map((table) => {
                    const statusInfo = getStatusInfo(table.status);
                    return (
                      <option key={table.id} value={table.id}>
                        میز {table.tableNumber} - {statusInfo.label} {statusInfo.icon}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* New Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  وضعیت جدید
                </label>
                <select
                  value={statusChangeData.newStatus}
                  onChange={(e) => handleFormChange('newStatus', e.target.value as TableStatus)}
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

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  دلیل تغییر
                </label>
                <input
                  type="text"
                  value={statusChangeData.reason}
                  onChange={(e) => handleFormChange('reason', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="دلیل تغییر وضعیت..."
                />
              </div>

              {/* Assigned Staff */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  کارمند مسئول
                </label>
                <input
                  type="text"
                  value={statusChangeData.assignedStaff}
                  onChange={(e) => handleFormChange('assignedStaff', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="نام کارمند..."
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                یادداشت
              </label>
              <textarea
                value={statusChangeData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="توضیحات اضافی..."
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.values(TableStatus).map((status) => {
                const statusInfo = getStatusInfo(status);
                return (
                  <button
                    key={status}
                    onClick={() => handleQuickStatusChange(statusChangeData.tableId, status, 'تغییر سریع')}
                    disabled={!statusChangeData.tableId || loading}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                      statusChangeData.newStatus === status
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="text-lg mb-1">{statusInfo.icon}</div>
                    <div>{statusInfo.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 rtl:space-x-reverse">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                انصراف
              </button>
              <button
                onClick={handleStatusChange}
                disabled={loading || !statusChangeData.tableId}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'در حال تغییر...' : 'تغییر وضعیت'}
              </button>
            </div>
          </div>
        )}

        {/* Status History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                تاریخچه تغییرات وضعیت
              </h3>
              {selectedTable && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  میز {selectedTable.tableNumber}
                </div>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
              </div>
            ) : statusHistory.length === 0 ? (
              <div className="text-center py-8">
                <FaHistory className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-600 dark:text-gray-400">تاریخچه‌ای یافت نشد</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {statusHistory.map((change) => {
                  const oldStatusInfo = getStatusInfo(change.oldStatus);
                  const newStatusInfo = getStatusInfo(change.newStatus);
                  
                  return (
                    <div
                      key={change.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <span className={`px-2 py-1 text-xs rounded-full ${oldStatusInfo.color}`}>
                                {oldStatusInfo.label}
                              </span>
                              <FaArrowRight className="text-gray-400" />
                              <span className={`px-2 py-1 text-xs rounded-full ${newStatusInfo.color}`}>
                                {newStatusInfo.label}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {getRelativeTime(change.changedAt)}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div className="mb-1">
                              <strong>تغییر دهنده:</strong> {change.changedByUser.name}
                            </div>
                            {change.reason && (
                              <div className="mb-1">
                                <strong>دلیل:</strong> {change.reason}
                              </div>
                            )}
                            {change.notes && (
                              <div className="mb-1">
                                <strong>یادداشت:</strong> {change.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(change.changedAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Bulk Status Change */}
        {activeTab === 'bulk' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bulk Status */}
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

              {/* Bulk Reason */}
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

              {/* Selected Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تعداد انتخاب شده
                </label>
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {selectedTables.length} میز
                </div>
              </div>
            </div>

            {/* Bulk Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                یادداشت گروهی
              </label>
              <textarea
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="یادداشت برای همه میزها..."
              />
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
      </div>
    </Modal>
  );
}; 