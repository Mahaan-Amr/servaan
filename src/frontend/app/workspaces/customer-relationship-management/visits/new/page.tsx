'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createVisit } from '../../../../../services/visitService';
import { getCustomers, getCustomerById } from '../../../../../services/customerService';
import { VisitCreateData, Customer } from '../../../../../types/crm';

// Local interface for form items that matches backend validation schema exactly
interface FormItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category?: string;
  notes?: string;
  totalPrice: number; // Keep this for form calculations
}

// Form data type that extends VisitCreateData but uses FormItem[] for itemsOrdered
type VisitFormData = Omit<VisitCreateData, 'itemsOrdered'> & {
  itemsOrdered: FormItem[];
};

function NewVisitPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedCustomerId = searchParams.get('customerId');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<VisitFormData>({
    customerId: preSelectedCustomerId || '',
    totalAmount: 0,
    discountAmount: 0,
    paymentMethod: 'CASH',
    itemsOrdered: [],
    tableNumber: '',
    serverName: '',
    serviceDuration: undefined,
    feedbackRating: undefined,
    feedbackComment: '',
    feedbackCategories: [],
    visitNotes: '',
    pointsRedeemed: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Item management
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    price: 0,
    category: '',
    notes: ''
  });

  const fetchCustomers = async () => {
    try {
      const result = await getCustomers({ limit: 100 });
      setCustomers(result.customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchSelectedCustomer = async (customerId: string) => {
    try {
      const customer = await getCustomerById(customerId);
      setSelectedCustomer(customer);
    } catch (error) {
      console.error('Error fetching customer:', error);
      setSelectedCustomer(null);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (preSelectedCustomerId) {
      setFormData(prev => ({ ...prev, customerId: preSelectedCustomerId }));
      fetchSelectedCustomer(preSelectedCustomerId);
    }
  }, [preSelectedCustomerId]);

  useEffect(() => {
    if (formData.customerId && formData.customerId !== selectedCustomer?.id) {
      fetchSelectedCustomer(formData.customerId);
    }
  }, [formData.customerId, selectedCustomer?.id]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Customer validation
    if (!formData.customerId) {
      newErrors.customerId = 'انتخاب مشتری الزامی است';
    }

    // Amount validation
    if (!formData.totalAmount || formData.totalAmount <= 0) {
      newErrors.totalAmount = 'مبلغ کل باید مثبت باشد';
    }

    if (formData.discountAmount && formData.discountAmount < 0) {
      newErrors.discountAmount = 'مبلغ تخفیف نمی‌تواند منفی باشد';
    }

    if (formData.discountAmount && formData.discountAmount >= formData.totalAmount) {
      newErrors.discountAmount = 'مبلغ تخفیف نمی‌تواند بیشتر از مبلغ کل باشد';
    }

    // Points validation
    if (formData.pointsRedeemed && formData.pointsRedeemed < 0) {
      newErrors.pointsRedeemed = 'امتیاز استفاده شده نمی‌تواند منفی باشد';
    }

    if (selectedCustomer?.loyalty && formData.pointsRedeemed && formData.pointsRedeemed > selectedCustomer.loyalty.currentPoints) {
      newErrors.pointsRedeemed = 'امتیاز استفاده شده بیشتر از امتیاز موجود مشتری است';
    }

    // Feedback validation
    if (formData.feedbackRating && (formData.feedbackRating < 1 || formData.feedbackRating > 5)) {
      newErrors.feedbackRating = 'امتیاز باید بین 1 تا 5 باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof VisitCreateData, value: VisitCreateData[keyof VisitCreateData]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addItem = () => {
    if (!newItem.name.trim() || newItem.quantity <= 0 || newItem.price < 0) {
      return;
    }

    const item = {
      ...newItem,
      id: Date.now().toString(),
      totalPrice: newItem.quantity * newItem.price
    };

    setFormData(prev => ({
      ...prev,
      itemsOrdered: [...(prev.itemsOrdered || []), item]
    }));

    // Reset new item form
    setNewItem({
      name: '',
      quantity: 1,
      price: 0,
      category: '',
      notes: ''
    });

    // Update total amount
    updateTotalAmount([...(formData.itemsOrdered || []), item]);
  };

  const removeItem = (itemId: string) => {
    const updatedItems: FormItem[] = (formData.itemsOrdered || []).filter(item => item.id !== itemId);
    setFormData(prev => ({ ...prev, itemsOrdered: updatedItems }));
    updateTotalAmount(updatedItems);
  };

  const updateTotalAmount = (items: FormItem[]) => {
    const total = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    setFormData(prev => ({ ...prev, totalAmount: total }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    
    try {
      // Transform FormItem[] to match backend validation schema exactly
      const transformedItems = formData.itemsOrdered.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        category: item.category
        // Remove totalPrice and notes - backend doesn't need them
      }));

      // Create a separate object for the API call that matches VisitCreateData
      const visitData: VisitCreateData = {
        customerId: formData.customerId,
        totalAmount: formData.totalAmount,
        discountAmount: formData.discountAmount,
        paymentMethod: formData.paymentMethod,
        itemsOrdered: transformedItems,
        tableNumber: formData.tableNumber?.trim() || undefined,
        serverName: formData.serverName?.trim() || undefined,
        serviceDuration: formData.serviceDuration,
        feedbackRating: formData.feedbackRating,
        feedbackComment: formData.feedbackComment?.trim() || undefined,
        feedbackCategories: formData.feedbackCategories,
        visitNotes: formData.visitNotes?.trim() || undefined,
        pointsRedeemed: formData.pointsRedeemed
      };

      const newVisit = await createVisit(visitData);
      
      // Redirect to visit detail page
      router.push(`/workspaces/customer-relationship-management/visits/${newVisit.id}`);
    } catch (error: unknown) {
      console.error('Error creating visit:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطا در ثبت بازدید';
      setErrors({ submit: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('fa-IR') + ' ریال';
  };

  const finalAmount = formData.totalAmount - (formData.discountAmount || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ثبت بازدید جدید</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            اطلاعات بازدید مشتری را وارد کنید
          </p>
        </div>
        <Link
          href="/workspaces/customer-relationship-management/visits"
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          بازگشت به فهرست
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {errors.submit && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="mr-3">
                <p className="text-sm text-red-800 dark:text-red-200">{errors.submit}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">انتخاب مشتری</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    مشتری <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="customerId"
                    value={formData.customerId}
                    onChange={(e) => handleInputChange('customerId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      errors.customerId ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    dir="rtl"
                  >
                    <option value="">انتخاب مشتری...</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.phone})
                      </option>
                    ))}
                  </select>
                  {errors.customerId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.customerId}</p>
                  )}
                </div>

                {selectedCustomer && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {selectedCustomer.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{selectedCustomer.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400" dir="ltr">{selectedCustomer.phone}</p>
                        <div className="flex items-center space-x-2 space-x-reverse mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedCustomer.segment === 'VIP' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                            selectedCustomer.segment === 'REGULAR' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            selectedCustomer.segment === 'OCCASIONAL' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          }`}>
                            {selectedCustomer.segment}
                          </span>
                          {selectedCustomer.loyalty && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              امتیاز: {selectedCustomer.loyalty.currentPoints.toLocaleString('fa-IR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Items Ordered */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">آیتم‌های سفارش</h3>
              
              {/* Add Item Form */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="نام آیتم"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                    dir="rtl"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    placeholder="تعداد"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem(prev => ({ ...prev, price: Number(e.target.value) }))}
                    placeholder="قیمت واحد (ریال)"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                    dir="ltr"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newItem.category || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="دسته‌بندی"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                    dir="rtl"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newItem.notes}
                    onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="یادداشت"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                    dir="rtl"
                  />
                </div>
                <div className="md:col-span-5">
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={!newItem.name.trim() || newItem.quantity <= 0}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors"
                  >
                    افزودن
                  </button>
                </div>
              </div>

              {/* Items List */}
              {(formData.itemsOrdered && formData.itemsOrdered.length > 0) ? (
                <div className="space-y-2">
                  {formData.itemsOrdered.map((item, index) => (
                    <div key={item.id || index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                           {item.quantity} × {item.price?.toLocaleString('fa-IR')} ریال
                         </div>
                      </div>
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(item.totalPrice || 0)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  هنوز هیچ آیتمی اضافه نشده است
                </div>
              )}
            </div>

            {/* Payment Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">اطلاعات پرداخت</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    مبلغ کل (ریال) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="totalAmount"
                    value={formData.totalAmount}
                    onChange={(e) => handleInputChange('totalAmount', Number(e.target.value))}
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      errors.totalAmount ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    dir="ltr"
                  />
                  {errors.totalAmount && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.totalAmount}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="discountAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    مبلغ تخفیف (ریال)
                  </label>
                  <input
                    type="number"
                    id="discountAmount"
                    value={formData.discountAmount}
                    onChange={(e) => handleInputChange('discountAmount', Number(e.target.value))}
                    min="0"
                    max={formData.totalAmount}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      errors.discountAmount ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    dir="ltr"
                  />
                  {errors.discountAmount && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.discountAmount}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    روش پرداخت
                  </label>
                  <select
                    id="paymentMethod"
                    value={formData.paymentMethod}
                                         onChange={(e) => handleInputChange('paymentMethod', e.target.value as 'CASH' | 'CARD' | 'ONLINE' | 'POINTS' | 'MIXED')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    dir="rtl"
                  >
                    <option value="CASH">نقدی</option>
                    <option value="CARD">کارتی</option>
                    <option value="ONLINE">آنلاین</option>
                    <option value="POINTS">امتیاز</option>
                    <option value="MIXED">ترکیبی</option>
                  </select>
                </div>

                {selectedCustomer?.loyalty && (
                  <div>
                    <label htmlFor="pointsRedeemed" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      امتیاز استفاده شده
                    </label>
                    <input
                      type="number"
                      id="pointsRedeemed"
                      value={formData.pointsRedeemed}
                      onChange={(e) => handleInputChange('pointsRedeemed', Number(e.target.value))}
                      min="0"
                      max={selectedCustomer.loyalty.currentPoints}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        errors.pointsRedeemed ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      امتیاز موجود: {selectedCustomer.loyalty.currentPoints.toLocaleString('fa-IR')}
                    </p>
                    {errors.pointsRedeemed && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pointsRedeemed}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">اطلاعات تکمیلی</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    شماره میز
                  </label>
                  <input
                    type="text"
                    id="tableNumber"
                    value={formData.tableNumber || ''}
                    onChange={(e) => handleInputChange('tableNumber', e.target.value)}
                    placeholder="مثال: A1, B5"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="serverName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام سرور
                  </label>
                  <input
                    type="text"
                    id="serverName"
                    value={formData.serverName || ''}
                    onChange={(e) => handleInputChange('serverName', e.target.value)}
                    placeholder="نام پیشخدمت"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label htmlFor="serviceDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    مدت سرویس (دقیقه)
                  </label>
                  <input
                    type="number"
                    id="serviceDuration"
                    value={formData.serviceDuration || ''}
                    onChange={(e) => handleInputChange('serviceDuration', e.target.value ? Number(e.target.value) : undefined)}
                    min="1"
                    placeholder="30"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="feedbackRating" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    امتیاز مشتری (1-5)
                  </label>
                  <select
                    id="feedbackRating"
                    value={formData.feedbackRating || ''}
                    onChange={(e) => handleInputChange('feedbackRating', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    dir="rtl"
                  >
                    <option value="">بدون امتیاز</option>
                    <option value="5">5 - عالی</option>
                    <option value="4">4 - خوب</option>
                    <option value="3">3 - متوسط</option>
                    <option value="2">2 - ضعیف</option>
                    <option value="1">1 - خیلی ضعیف</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="feedbackComment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نظر مشتری
                </label>
                <textarea
                  id="feedbackComment"
                  value={formData.feedbackComment || ''}
                  onChange={(e) => handleInputChange('feedbackComment', e.target.value)}
                  rows={3}
                  placeholder="نظرات و پیشنهادات مشتری..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  dir="rtl"
                />
              </div>

              <div className="mt-6">
                <label htmlFor="visitNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  یادداشت‌های بازدید
                </label>
                <textarea
                  id="visitNotes"
                  value={formData.visitNotes || ''}
                  onChange={(e) => handleInputChange('visitNotes', e.target.value)}
                  rows={3}
                  placeholder="یادداشت‌های داخلی، نکات خاص و..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">خلاصه سفارش</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">مبلغ کل:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(formData.totalAmount)}
                  </span>
                </div>
                
                {formData.discountAmount && formData.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">تخفیف:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      -{formatCurrency(formData.discountAmount)}
                    </span>
                  </div>
                )}

                {formData.pointsRedeemed && formData.pointsRedeemed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">امتیاز استفاده شده:</span>
                    <span className="font-medium text-yellow-600 dark:text-yellow-400">
                      {formData.pointsRedeemed.toLocaleString('fa-IR')} امتیاز
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-medium text-gray-900 dark:text-white">مبلغ نهایی:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(finalAmount)}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  تعداد آیتم‌ها: {formData.itemsOrdered?.length || 0}
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6 space-y-3">
                <button
                  type="submit"
                  disabled={saving || !formData.customerId || finalAmount < 0}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                      در حال ثبت...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      ثبت بازدید
                    </>
                  )}
                </button>

                <Link
                  href="/workspaces/customer-relationship-management/visits"
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
                >
                  انصراف
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NewVisitPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <NewVisitPageContent />
    </Suspense>
  );
}