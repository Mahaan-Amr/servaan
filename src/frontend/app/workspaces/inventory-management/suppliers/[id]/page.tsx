'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Supplier, Item } from '../../../../../../shared/types';
import * as supplierService from '../../../../../services/supplierService';
import * as itemService from '../../../../../services/itemService';
import { useAuth } from '../../../../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FarsiDatePicker } from '../../../../../components/ui/FarsiDatePicker';
import { FormattedNumberInput } from '../../../../../components/ui/FormattedNumberInput';

interface SupplierItemModalProps {
  supplier: Supplier;
  onClose: () => void;
  onSuccess: () => void;
}

interface SupplierTransactionHistoryProps {
  supplier: Supplier;
}

const SupplierTransactionHistory: React.FC<SupplierTransactionHistoryProps> = ({ supplier }) => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<supplierService.SupplierTransactionHistoryResponse['transactions']>([]);
  const [summary, setSummary] = useState<supplierService.SupplierTransactionHistoryResponse['summary'] | null>(null);
  const [pagination, setPagination] = useState<supplierService.SupplierTransactionHistoryResponse['pagination'] | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  });

  const loadTransactionHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params: supplierService.SupplierTransactionHistoryParams = {
        page: filters.page,
        limit: filters.limit
      };
      
      if (filters.type) params.type = filters.type as 'IN' | 'OUT';
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const response = await supplierService.getSupplierTransactionHistory(supplier.id, params);
      setTransactions(response.transactions);
      setSummary(response.summary);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading transaction history:', error);
      toast.error(error instanceof Error ? error.message : 'خطا در دریافت تاریخچه تراکنش‌ها');
    } finally {
      setLoading(false);
    }
  }, [filters, supplier.id]);

  useEffect(() => {
    loadTransactionHistory();
  }, [loadTransactionHistory]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        تاریخچه تراکنش‌های تأمین‌کننده
      </h3>
      
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {summary.totalTransactions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">کل تراکنش‌ها</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.totalIn}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">کل ورودی</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {summary.totalOut}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">کل خروجی</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {summary.inTransactions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">تراکنش‌های ورودی</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {summary.outTransactions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">تراکنش‌های خروجی</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              نوع تراکنش
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="">همه</option>
              <option value="IN">ورودی</option>
              <option value="OUT">خروجی</option>
            </select>
          </div>
          <div>
            <FarsiDatePicker
              label="از تاریخ"
              value={filters.startDate}
              onChange={(value) => handleFilterChange('startDate', value)}
              placeholder="از تاریخ را انتخاب کنید"
              maxDate={filters.endDate || undefined}
            />
          </div>
          <div>
            <FarsiDatePicker
              label="تا تاریخ"
              value={filters.endDate}
              onChange={(value) => handleFilterChange('endDate', value)}
              placeholder="تا تاریخ را انتخاب کنید"
              minDate={filters.startDate || undefined}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 rounded-lg"
            >
              پاک کردن فیلترها
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : transactions.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
                    تاریخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
                    نوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/4">
                    کالا
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
                    مقدار
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
                    کاربر
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/4">
                    توضیحات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white truncate">
                        {new Date(transaction.createdAt).toLocaleDateString('fa-IR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'IN' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {transaction.type === 'IN' ? 'ورود' : 'خروج'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {transaction.item.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {transaction.item.category}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white truncate">
                        {transaction.quantity} {transaction.item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {transaction.user.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {transaction.note || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                نمایش {((pagination.page - 1) * pagination.limit) + 1} تا {Math.min(pagination.page * pagination.limit, pagination.totalCount)} از {pagination.totalCount} تراکنش
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:disabled:bg-gray-800 dark:disabled:text-gray-600 rounded-lg"
                >
                  قبلی
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  صفحه {pagination.page} از {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:disabled:bg-gray-800 dark:disabled:text-gray-600 rounded-lg"
                >
                  بعدی
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m9-2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-7 4v-2a2 2 0 012-2 2 2 0 012 2v2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            تاریخچه تراکنش‌ها
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            هنوز تراکنشی برای این تأمین‌کننده ثبت نشده است
          </p>
        </div>
      )}
    </div>
  );
};

const SupplierItemModal: React.FC<SupplierItemModalProps> = ({ supplier, onClose, onSuccess }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    itemId: '',
    preferredSupplier: false,
    unitPrice: ''
  });

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const itemsData = await itemService.getItems();
        
        // Filter out items that are already linked to this supplier
        const linkedItemIds = supplier.items?.map(item => item.itemId) || [];
        const availableItems = itemsData.filter(item => !linkedItemIds.includes(item.id));
        
        setItems(availableItems);
      } catch (error) {
        console.error('Error fetching items:', error);
        toast.error('خطا در دریافت لیست کالاها');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [supplier]);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemId) {
      toast.error('لطفاً یک کالا انتخاب کنید');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        itemId: formData.itemId,
        preferredSupplier: formData.preferredSupplier,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined
      };

      await supplierService.addItemToSupplier(supplier.id, payload);
      toast.success('کالا با موفقیت به تأمین‌کننده اضافه شد');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding item to supplier:', error);
      toast.error(error instanceof Error ? error.message : 'خطا در افزودن کالا');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              افزودن کالا به تأمین‌کننده
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                جستجو در کالاها
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="نام کالا یا دسته‌بندی..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Item Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                انتخاب کالا *
              </label>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <select
                  name="itemId"
                  value={formData.itemId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">کالا را انتخاب کنید</option>
                  {filteredItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {item.category}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Unit Price */}
            <div>
              <FormattedNumberInput
                label="قیمت واحد (ریال)"
                value={formData.unitPrice}
                onChange={(value: string) => handleChange({ target: { name: 'unitPrice', value } } as React.ChangeEvent<HTMLInputElement>)}
                placeholder="قیمت واحد از این تأمین‌کننده"
                min={0}
                step="0.01"
                allowDecimals={true}
              />
            </div>

            {/* Preferred Supplier */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="preferredSupplier"
                id="preferredSupplier"
                checked={formData.preferredSupplier}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="preferredSupplier" className="mr-2 block text-sm text-gray-700 dark:text-gray-300">
                تأمین‌کننده اصلی این کالا
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.itemId}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg"
              >
                {submitting ? 'در حال افزودن...' : 'افزودن کالا'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function SupplierDetailPage() {
  const params = useParams();
  const supplierId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [removingItem, setRemovingItem] = useState<string | null>(null);

  const { hasAccess } = useAuth();

  const loadSupplier = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supplierData = await supplierService.getSupplierById(supplierId);
      setSupplier(supplierData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت اطلاعات تأمین‌کننده';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    if (supplierId) {
      loadSupplier();
    }
  }, [supplierId, loadSupplier]);

  const handleRemoveItem = async (itemId: string, itemName: string) => {
    const confirmDelete = window.confirm(
      `آیا از حذف کالا "${itemName}" از لیست تأمین‌کننده اطمینان دارید؟`
    );

    if (!confirmDelete) return;

    try {
      setRemovingItem(itemId);
      await supplierService.removeItemFromSupplier(supplierId, itemId);
      toast.success('کالا با موفقیت از لیست تأمین‌کننده حذف شد');
      await loadSupplier(); // Refresh data
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error(error instanceof Error ? error.message : 'خطا در حذف کالا');
    } finally {
      setRemovingItem(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !supplier) {
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
                خطا در دریافت اطلاعات تأمین‌کننده
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error || 'تأمین‌کننده مورد نظر یافت نشد'}</p>
              </div>
              <div className="mt-4 flex space-x-2 space-x-reverse">
                <button
                  onClick={loadSupplier}
                  className="bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-md text-sm font-medium text-red-800 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                >
                  تلاش مجدد
                </button>
                <Link
                  href="/workspaces/inventory-management/suppliers"
                  className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium text-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  بازگشت به لیست
                </Link>
              </div>
            </div>
          </div>
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
              جزئیات تأمین‌کننده
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              مشاهده اطلاعات کامل تأمین‌کننده
            </p>
          </div>
          <Link
            href="/workspaces/inventory-management/suppliers"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            بازگشت
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">اطلاعات تأمین‌کننده</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام شرکت
              </label>
              <p className="text-gray-900 dark:text-white">{supplier.name}</p>
            </div>
            {supplier.contactName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  نام تماس
                </label>
                <p className="text-gray-900 dark:text-white">{supplier.contactName}</p>
              </div>
            )}
            {supplier.phoneNumber && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  شماره تلفن
                </label>
                <p className="text-gray-900 dark:text-white">{supplier.phoneNumber}</p>
              </div>
            )}
            {supplier.email && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ایمیل
                </label>
                <p className="text-gray-900 dark:text-white">{supplier.email}</p>
              </div>
            )}
            {supplier.address && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  آدرس
                </label>
                <p className="text-gray-900 dark:text-white">{supplier.address}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                وضعیت
              </label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                supplier.isActive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {supplier.isActive ? 'فعال' : 'غیرفعال'}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                تاریخ ایجاد
              </label>
              <p className="text-gray-900 dark:text-white">
                {new Date(supplier.createdAt).toLocaleDateString('fa-IR')}
              </p>
            </div>
          </div>
          {supplier.notes && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                توضیحات
              </label>
              <p className="text-gray-900 dark:text-white">{supplier.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">عملیات</h3>
            <div className="space-y-2">
              {hasAccess('MANAGER') && (
                <Link
                  href={`/workspaces/inventory-management/suppliers/${supplierId}/edit`}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center block"
                >
                  ویرایش تأمین‌کننده
                </Link>
              )}
              {hasAccess('MANAGER') && (
                <button
                  onClick={() => setShowItemModal(true)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  افزودن کالا
                </button>
              )}
              <button 
                onClick={() => {
                  const element = document.getElementById('transaction-history');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                سوابق تراکنش
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">آمار</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">کل کالاها:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {supplier.items?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">تأمین‌کننده اصلی:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {supplier.items?.filter(item => item.preferredSupplier).length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">آخرین به‌روزرسانی:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(supplier.updatedAt).toLocaleDateString('fa-IR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products from this supplier */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            کالاهای این تأمین‌کننده
          </h3>
          {hasAccess('MANAGER') && (
            <button
              onClick={() => setShowItemModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              افزودن کالا
            </button>
          )}
        </div>
        
        {supplier.items && supplier.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                    نام کالا
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px] hidden md:table-cell">
                    دسته‌بندی
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px] hidden lg:table-cell">
                    قیمت واحد
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                    وضعیت
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {supplier.items.map((itemSupplier) => (
                  <tr key={itemSupplier.itemId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white break-words">
                        {itemSupplier.item?.name || 'نام کالا'}
                      </div>
                      {/* Show category on mobile */}
                      <div className="md:hidden mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {itemSupplier.item?.category && (
                          <div>دسته: {itemSupplier.item.category}</div>
                        )}
                        {itemSupplier.unitPrice && (
                          <div>قیمت: {itemSupplier.unitPrice.toLocaleString('fa-IR')} ریال</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="text-sm text-gray-500 dark:text-gray-400 break-words">
                        {itemSupplier.item?.category || 'دسته‌بندی'}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="text-sm text-gray-900 dark:text-white break-words">
                        {itemSupplier.unitPrice ? 
                          `${itemSupplier.unitPrice.toLocaleString('fa-IR')} ریال` : 
                          'تعیین نشده'
                        }
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {itemSupplier.preferredSupplier ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          تأمین‌کننده اصلی
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                          تأمین‌کننده فرعی
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium">
                      <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
                        <Link
                          href={`/workspaces/inventory-management/items/${itemSupplier.itemId}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-xs sm:text-sm"
                        >
                          مشاهده
                        </Link>
                        {hasAccess('MANAGER') && (
                          <button
                            onClick={() => handleRemoveItem(itemSupplier.itemId, itemSupplier.item?.name || 'کالا')}
                            disabled={removingItem === itemSupplier.itemId}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                          >
                            {removingItem === itemSupplier.itemId ? 'در حال حذف...' : 'حذف'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              کالاهای تأمین‌کننده
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              هنوز کالایی برای این تأمین‌کننده ثبت نشده است
            </p>
            {hasAccess('MANAGER') && (
              <div className="mt-4">
                <button
                  onClick={() => setShowItemModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  افزودن اولین کالا
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showItemModal && (
        <SupplierItemModal
          supplier={supplier}
          onClose={() => setShowItemModal(false)}
          onSuccess={loadSupplier}
        />
      )}

      {/* Transaction History */}
      <div id="transaction-history">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              تاریخچه تراکنش‌های تأمین‌کننده
            </h3>
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
              داده‌های واقعی از پایگاه داده
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            این بخش تاریخچه کامل تراکنش‌های موجودی مرتبط با کالاهای این تأمین‌کننده را نمایش می‌دهد. 
            کارت‌های بالا خلاصه آماری و جدول زیر جزئیات کامل تراکنش‌ها را نشان می‌دهد.
          </p>
        </div>
        <SupplierTransactionHistory supplier={supplier} />
      </div>
    </div>
  );
} 