'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createCustomer } from '../../../../../services/customerService';
import { CustomerCreateData } from '../../../../../types/crm';

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CustomerCreateData>({
    phone: '',
    name: '',
    nameEnglish: '',
    email: '',
    birthday: '',
    anniversary: '',
    notes: '',
    preferredContactMethod: 'PHONE',
    allowMarketing: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Phone validation (required)
    if (!formData.phone.trim()) {
      newErrors.phone = 'شماره تلفن الزامی است';
    } else if (!/^(\+98|0)?9[0-9]{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'شماره تلفن معتبر نیست (مثال: 09123456789)';
    }

    // Name validation (required)
    if (!formData.name.trim()) {
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

  const handleInputChange = (field: keyof CustomerCreateData, value: string | boolean) => {
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

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Handle Iranian phone numbers
    if (digits.startsWith('98')) {
      return '+' + digits;
    } else if (digits.startsWith('9') && digits.length === 10) {
      return '0' + digits;
    } else if (digits.startsWith('09')) {
      return digits;
    } else if (digits.length === 11 && digits.startsWith('09')) {
      return digits;
    }
    
    return phone;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Format phone number before submission
      const formattedData = {
        ...formData,
        phone: formatPhoneNumber(formData.phone),
        name: formData.name.trim(),
        nameEnglish: formData.nameEnglish?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        birthday: formData.birthday || undefined,
        anniversary: formData.anniversary || undefined
      };

      const newCustomer = await createCustomer(formattedData);
      
      // Redirect to customer detail page
      router.push(`/workspaces/customer-relationship-management/customers/${newCustomer.id}`);
    } catch (error: unknown) {
      console.error('Error creating customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطا در ایجاد مشتری جدید';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">مشتری جدید</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            اطلاعات مشتری جدید را وارد کنید
          </p>
        </div>
        <Link
          href="/workspaces/customer-relationship-management/customers"
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors w-full sm:w-auto justify-center"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          بازگشت به فهرست
        </Link>
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
              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  شماره تلفن <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="09123456789"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm ${
                    errors.phone ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  dir="ltr"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نام مشتری <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="نام و نام خانوادگی"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm ${
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm ${
                    errors.email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  dir="ltr"
                />
                {errors.email && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm ${
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm ${
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Preferred Contact Method */}
              <div>
                <label htmlFor="preferredContactMethod" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  روش ترجیحی تماس
                </label>
                <select
                  id="preferredContactMethod"
                  value={formData.preferredContactMethod}
                  onChange={(e) => handleInputChange('preferredContactMethod', e.target.value as 'PHONE' | 'EMAIL' | 'SMS' | 'WHATSAPP')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  dir="rtl"
                >
                  <option value="PHONE">تلفن</option>
                  <option value="EMAIL">ایمیل</option>
                  <option value="SMS">پیامک</option>
                  <option value="WHATSAPP">واتساپ</option>
                </select>
              </div>

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
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                  />
                  <label htmlFor="allowMarketing" className="mr-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    اجازه ارسال پیام‌های تبلیغاتی و اطلاعیه‌ها
                  </label>
                </div>
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              dir="rtl"
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/workspaces/customer-relationship-management/customers"
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors text-center"
            >
              انصراف
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 sm:px-6 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  <span className="text-sm sm:text-base">در حال ذخیره...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">ایجاد مشتری</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 