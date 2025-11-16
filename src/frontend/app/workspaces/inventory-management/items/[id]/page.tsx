'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Item, InventoryStatus, Supplier } from '../../../../../../shared/types';
import * as itemService from '../../../../../services/itemService';
import * as inventoryService from '../../../../../services/inventoryService';
import * as supplierService from '../../../../../services/supplierService';
import { useAuth } from '../../../../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FormattedNumberInput } from '../../../../../components/ui/FormattedNumberInput';

interface InventoryEntry {
  id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
  };
}

interface ItemWithInventoryEntries extends Item {
  inventoryEntries?: InventoryEntry[];
}

interface ItemSupplierModalProps {
  item: Item;
  onClose: () => void;
  onSuccess: () => void;
}

const ItemSupplierModal: React.FC<ItemSupplierModalProps> = ({ item, onClose, onSuccess }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    supplierId: '',
    preferredSupplier: false,
    unitPrice: ''
  });

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const suppliersData = await supplierService.getSuppliers(true); // Only active suppliers
        
        // Filter out suppliers that are already linked to this item
        const linkedSupplierIds = item.suppliers?.map(supplier => supplier.supplierId) || [];
        const availableSuppliers = suppliersData.filter(supplier => !linkedSupplierIds.includes(supplier.id));
        
        setSuppliers(availableSuppliers);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        toast.error('خطا در دریافت لیست تأمین‌کنندگان');
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [item]);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contactName && supplier.contactName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplierId) {
      toast.error('لطفاً یک تأمین‌کننده انتخاب کنید');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        itemId: item.id,
        preferredSupplier: formData.preferredSupplier,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined
      };

      await supplierService.addItemToSupplier(formData.supplierId, payload);
      toast.success('تأمین‌کننده با موفقیت به کالا اضافه شد');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding supplier to item:', error);
      toast.error(error instanceof Error ? error.message : 'خطا در افزودن تأمین‌کننده');
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
              افزودن تأمین‌کننده به کالا
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
            {/* Item Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">کالا</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.name} - {item.category}</p>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                جستجو در تأمین‌کنندگان
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="نام شرکت یا شخص تماس..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Supplier Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                انتخاب تأمین‌کننده *
              </label>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <select
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">تأمین‌کننده را انتخاب کنید</option>
                  {filteredSuppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} {supplier.contactName ? `(${supplier.contactName})` : ''}
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
                disabled={submitting || !formData.supplierId}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg"
              >
                {submitting ? 'در حال افزودن...' : 'افزودن تأمین‌کننده'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function ItemDetailPage() {
  const params = useParams();
  const itemId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ItemWithInventoryEntries | null>(null);
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [removingSupplier, setRemovingSupplier] = useState<string | null>(null);

  const { hasAccess } = useAuth();

  const loadItemData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [itemData, inventoryData] = await Promise.all([
        itemService.getItemById(itemId),
        inventoryService.getCurrentInventory()
      ]);

      setItem(itemData);
      
      // Find the inventory status for this specific item
      const itemInventoryStatus = inventoryData.find(inv => inv.itemId === itemId);
      setInventoryStatus(itemInventoryStatus || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت اطلاعات کالا';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    if (itemId) {
      loadItemData();
    }
  }, [itemId, loadItemData]);

  const handleRemoveSupplier = async (supplierId: string, supplierName: string) => {
    const confirmDelete = window.confirm(
      `آیا از حذف تأمین‌کننده "${supplierName}" از لیست کالا اطمینان دارید؟`
    );

    if (!confirmDelete) return;

    try {
      setRemovingSupplier(supplierId);
      await supplierService.removeItemFromSupplier(supplierId, itemId);
      toast.success('تأمین‌کننده با موفقیت از لیست کالا حذف شد');
      await loadItemData(); // Refresh data
    } catch (error) {
      console.error('Error removing supplier:', error);
      toast.error(error instanceof Error ? error.message : 'خطا در حذف تأمین‌کننده');
    } finally {
      setRemovingSupplier(null);
    }
  };

  const getCurrentStock = (): number => {
    return inventoryStatus ? inventoryStatus.current : 0;
  };

  const getStockStatus = (current: number, minStock?: number) => {
    const min = minStock || 0;
    if (current <= 0) {
      return { status: 'out', color: 'red', text: 'ناموجود' };
    } else if (current <= min) {
      return { status: 'low', color: 'yellow', text: 'کم موجود' };
    } else {
      return { status: 'good', color: 'green', text: 'موجود' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !item) {
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
                خطا در دریافت اطلاعات کالا
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error || 'کالای مورد نظر یافت نشد'}</p>
              </div>
              <div className="mt-4 flex space-x-2 space-x-reverse">
                <button
                  onClick={loadItemData}
                  className="bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-md text-sm font-medium text-red-800 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                >
                  تلاش مجدد
                </button>
                <Link
                  href="/workspaces/inventory-management/items"
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

  const currentStock = getCurrentStock();
  const stockStatus = getStockStatus(currentStock, item.minStock);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              جزئیات کالا
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              مشاهده اطلاعات کامل کالا
            </p>
          </div>
          <Link
            href="/workspaces/inventory-management/items"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            بازگشت
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">اطلاعات کالا</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Section */}
            {item.image && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تصویر کالا
                </label>
                <div className="mt-1">
                  <Image 
                    src={item.image} 
                    alt={item.name}
                    width={192}
                    height={192}
                    className="h-48 w-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام کالا
              </label>
              <p className="text-gray-900 dark:text-white">{item.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                دسته‌بندی
              </label>
              <p className="text-gray-900 dark:text-white">{item.category}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                واحد
              </label>
              <p className="text-gray-900 dark:text-white">{item.unit}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                حداقل موجودی
              </label>
              <p className="text-gray-900 dark:text-white">{item.minStock || 0}</p>
            </div>
            {item.barcode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  بارکد
                </label>
                <p className="text-gray-900 dark:text-white font-mono">{item.barcode}</p>
              </div>
            )}
            {item.description && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  توضیحات
                </label>
                <p className="text-gray-900 dark:text-white">{item.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stock Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">وضعیت موجودی</h3>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${
                stockStatus.color === 'green' ? 'text-green-600' :
                stockStatus.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {currentStock}
              </div>
              <p className="text-gray-600 dark:text-gray-400">{item.unit}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                stockStatus.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                stockStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {stockStatus.text}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">عملیات</h3>
            <div className="space-y-2">
              {hasAccess('MANAGER') && (
                <Link
                  href={`/workspaces/inventory-management/items/${item.id}/edit`}
                  className="w-full block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ویرایش کالا
                </Link>
              )}
              <Link
                href={`/workspaces/inventory-management/inventory/add?itemId=${item.id}`}
                className="w-full block text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                افزودن موجودی
              </Link>
              <Link
                href={`/workspaces/inventory-management/inventory/remove?itemId=${item.id}`}
                className="w-full block text-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                کاهش موجودی
              </Link>
              {hasAccess('MANAGER') && (
                <button
                  onClick={() => setShowSupplierModal(true)}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  افزودن تأمین‌کننده
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Suppliers Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            تأمین‌کنندگان این کالا
          </h3>
          {hasAccess('MANAGER') && (
            <button
              onClick={() => setShowSupplierModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              افزودن تأمین‌کننده
            </button>
          )}
        </div>
        
        {item.suppliers && item.suppliers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    نام تأمین‌کننده
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    شخص تماس
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    قیمت واحد
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {item.suppliers.map((supplierItem) => (
                  <tr key={supplierItem.supplierId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {supplierItem.supplier?.name || 'نام تأمین‌کننده'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {supplierItem.supplier?.contactName || 'تعیین نشده'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {supplierItem.unitPrice ? 
                        `${supplierItem.unitPrice.toLocaleString('fa-IR')} ریال` : 
                        'تعیین نشده'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {supplierItem.preferredSupplier ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          تأمین‌کننده اصلی
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                          تأمین‌کننده فرعی
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/workspaces/inventory-management/suppliers/${supplierItem.supplierId}`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 ml-3"
                      >
                        مشاهده
                      </Link>
                      {hasAccess('MANAGER') && (
                        <button
                          onClick={() => handleRemoveSupplier(supplierItem.supplierId, supplierItem.supplier?.name || 'تأمین‌کننده')}
                          disabled={removingSupplier === supplierItem.supplierId}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {removingSupplier === supplierItem.supplierId ? 'در حال حذف...' : 'حذف'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              تأمین‌کنندگان کالا
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              هنوز تأمین‌کننده‌ای برای این کالا ثبت نشده است
            </p>
            {hasAccess('MANAGER') && (
              <div className="mt-4">
                <button
                  onClick={() => setShowSupplierModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  افزودن اولین تأمین‌کننده
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transactions History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">تاریخچه تراکنش‌ها</h3>
        {item.inventoryEntries && item.inventoryEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    تاریخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    نوع تراکنش
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    مقدار
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    کاربر
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    توضیحات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {item.inventoryEntries.slice(0, 5).map((entry: InventoryEntry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(entry.createdAt).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.type === 'IN' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {entry.type === 'IN' ? 'ورود' : 'خروج'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {entry.quantity} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {entry.user?.name || 'کاربر'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {entry.note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m9-2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-7 4v-2a2 2 0 012-2 2 2 0 012 2v2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              تاریخچه تراکنش‌ها
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              هنوز تراکنشی برای این کالا ثبت نشده است
            </p>
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {showSupplierModal && (
        <ItemSupplierModal
          item={item}
          onClose={() => setShowSupplierModal(false)}
          onSuccess={loadItemData}
        />
      )}
    </div>
  );
} 