'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCustomerById, updateCustomer } from '../../../../../../services/customerService';
import { Customer, CustomerUpdateData } from '../../../../../../types/crm';

export default function EditCustomerPage() {
  const router = useRouter();
  const { customerId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerUpdateData>({
    name: '',
    nameEnglish: '',
    email: '',
    birthday: '',
    anniversary: '',
    status: 'ACTIVE',
    notes: '',
    preferredContactMethod: 'PHONE',
    allowMarketing: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchCustomer = useCallback(async () => {
    if (!customerId) return;
    
    try {
      setLoading(true);
      const customerData = await getCustomerById(customerId as string);
      setCustomer(customerData);
      setFormData({
        name: customerData.name,
        nameEnglish: customerData.nameEnglish || '',
        email: customerData.email || '',
        birthday: customerData.birthday || '',
        anniversary: customerData.anniversary || '',
        status: customerData.status,
        notes: customerData.notes || '',
        preferredContactMethod: customerData.preferredContactMethod,
        allowMarketing: customerData.allowMarketing
      });
    } catch (error: unknown) {
      console.error('Error fetching customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت اطلاعات مشتری';
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation (required)
    if (!formData.name?.trim()) {
      newErrors.name = 'نام مشتری الزامی است';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'نام باید حداقل 2 کاراکتر باشد';
    }

    // Email validation (optional but if provided, must be valid)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'ایمیل معتبر نیست';
    }

    // Birthday validation (optional but if provided, must be valid date)
    if (formData.birthday) {
      const birthDate = new Date(formData.birthday);
      const today = new Date();
      const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
      
      if (birthDate > today) {
        newErrors.birthday = 'تاریخ تولد نمی‌تواند در آینده باشد';
      } else if (birthDate < minDate) {
        newErrors.birthday = 'تاریخ تولد نامعتبر است';
      }
    }

    // Anniversary validation (optional but if provided, must be valid)
    if (formData.anniversary) {
      const annivDate = new Date(formData.anniversary);
      const today = new Date();
      
      if (annivDate > today) {
        newErrors.anniversary = 'تاریخ سالگرد نمی‌تواند در آینده باشد';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CustomerUpdateData, value: string | boolean) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !customer) {
      return;
    }

    setSaving(true);
    
    try {
      // Clean up data before submission
      const updateData: CustomerUpdateData = {
        ...formData,
        name: formData.name?.trim(),
        nameEnglish: formData.nameEnglish?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        birthday: formData.birthday || undefined,
        anniversary: formData.anniversary || undefined
      };

      await updateCustomer(customer.id, updateData);
      
      // Redirect to customer detail page
      router.push(`/workspaces/customer-relationship-management/customers/${customer.id}`);
    } catch (error: unknown) {
      console.error('Error updating customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطا در بروزرسانی اطلاعات مشتری';
      setErrors({ submit: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';
    if (phone.startsWith('+98')) {
      return phone.replace('+98', '0');
    }
    return phone;
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6 sm:mb-8"></div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6">
            <div className="space-y-4">
              <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i}>
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                    <div className="h-8 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errors.general || !customer) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="text-center py-8 sm:py-12">
          <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
            {errors.general || 'مشتری یافت نشد'}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
            ممکن است مشتری حذف شده باشد یا شناسه اشتباه باشد
          </p>
          <Link
            href="/workspaces/customer-relationship-management/customers"
            className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors"
          >
            بازگشت به فهرست مشتریان
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Link
            href={`/workspaces/customer-relationship-management/customers/${customer.id}`}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">ویرایش مشتری</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              ویرایش اطلاعات {customer.name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            شماره تلفن: {formatPhoneNumber(customer.phone)}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Error Alert */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3 sm:p-4">
              <div className="flex">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="mr-3">
                  <p className="text-xs sm:text-sm text-red-800 dark:text-red-200">{errors.submit}</p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">اطلاعات پایه</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Phone Number (Read-only) */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  شماره تلفن
                </label>
                <input
                  type="tel"
                  value={formatPhoneNumber(customer.phone)}
                  readOnly
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  dir="ltr"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  شماره تلفن قابل تغییر نیست
                </p>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نام مشتری <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="نام و نام خانوادگی"
                  className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  dir="rtl"
                />
                {errors.name && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>

              {/* English Name */}
              <div>
                <label htmlFor="nameEnglish" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نام انگلیسی (اختیاری)
                </label>
                <input
                  type="text"
                  id="nameEnglish"
                  value={formData.nameEnglish || ''}
                  onChange={(e) => handleInputChange('nameEnglish', e.target.value)}
                  placeholder="English Name"
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  dir="ltr"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ایمیل (اختیاری)
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="customer@example.com"
                  className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  dir="ltr"
                />
                {errors.email && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  وضعیت مشتری
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as 'ACTIVE' | 'INACTIVE' | 'BLOCKED')}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  dir="rtl"
                >
                  <option value="ACTIVE">فعال</option>
                  <option value="INACTIVE">غیرفعال</option>
                  <option value="BLOCKED">مسدود</option>
                </select>
              </div>

              {/* Preferred Contact Method */}
              <div>
                <label htmlFor="preferredContactMethod" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  روش ترجیحی تماس
                </label>
                <select
                  id="preferredContactMethod"
                  value={formData.preferredContactMethod}
                  onChange={(e) => handleInputChange('preferredContactMethod', e.target.value as 'PHONE' | 'EMAIL' | 'SMS' | 'WHATSAPP')}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  dir="rtl"
                >
                  <option value="PHONE">تلفن</option>
                  <option value="EMAIL">ایمیل</option>
                  <option value="SMS">پیامک</option>
                  <option value="WHATSAPP">واتساپ</option>
                </select>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">اطلاعات شخصی</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Birthday */}
              <div>
                <label htmlFor="birthday" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تاریخ تولد (اختیاری)
                </label>
                <input
                  type="date"
                  id="birthday"
                  value={formData.birthday || ''}
                  onChange={(e) => handleInputChange('birthday', e.target.value)}
                  className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.birthday ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.birthday && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.birthday}</p>
                )}
              </div>

              {/* Anniversary */}
              <div>
                <label htmlFor="anniversary" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  سالگرد (اختیاری)
                </label>
                <input
                  type="date"
                  id="anniversary"
                  value={formData.anniversary || ''}
                  onChange={(e) => handleInputChange('anniversary', e.target.value)}
                  className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.anniversary ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.anniversary && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.anniversary}</p>
                )}
              </div>
            </div>
          </div>

          {/* Communication Preferences */}
          <div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">تنظیمات ارتباط</h3>
            <div className="space-y-3 sm:space-y-4">
              {/* Marketing Permission */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مجوز بازاریابی
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowMarketing"
                    checked={formData.allowMarketing}
                    onChange={(e) => handleInputChange('allowMarketing', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                  />
                  <label htmlFor="allowMarketing" className="mr-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    اجازه ارسال پیام‌های تبلیغاتی و اطلاعیه‌ها
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  در صورت فعال بودن، مشتری پیام‌های تبلیغاتی دریافت خواهد کرد
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              یادداشت‌ها (اختیاری)
            </label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={4}
              placeholder="یادداشت‌ها، ترجیحات خاص، آلرژی‌ها و..."
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              dir="rtl"
            />
          </div>

          {/* Customer Info Summary (Read-only) */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
            <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-3">اطلاعات ثابت</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">شناسه مشتری:</span>
                <span className="mr-2 font-mono text-gray-900 dark:text-white">{customer.id.slice(-8)}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">تاریخ عضویت:</span>
                <span className="mr-2 text-gray-900 dark:text-white">
                  {new Date(customer.createdAt).toLocaleDateString('fa-IR')}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">بخش فعلی:</span>
                <span className="mr-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    customer.segment === 'VIP' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                    customer.segment === 'REGULAR' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                    customer.segment === 'OCCASIONAL' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}>
                    {customer.segment}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-4 sm:space-x-4 sm:space-x-reverse pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              href={`/workspaces/customer-relationship-management/customers/${customer.id}`}
              className="px-3 py-2 sm:px-4 sm:py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm sm:text-base font-medium transition-colors"
            >
              انصراف
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm sm:text-base font-medium rounded-lg transition-colors flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white ml-2"></div>
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ذخیره تغییرات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 