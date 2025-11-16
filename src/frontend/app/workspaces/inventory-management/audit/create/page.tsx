'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as auditService from '../../../../../services/auditService';
import toast from 'react-hot-toast';
import { FarsiDatePicker } from '../../../../../components/ui/FarsiDatePicker';

export default function CreateAuditCyclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('نام چرخه انبارگردانی الزامی است');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error('تاریخ شروع و پایان الزامی است');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error('تاریخ شروع باید قبل از تاریخ پایان باشد');
      return;
    }

    try {
      setLoading(true);
      await auditService.createAuditCycle({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate
      });
      
      toast.success('چرخه انبارگردانی با موفقیت ایجاد شد');
      router.push('/workspaces/inventory-management/audit');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ایجاد چرخه انبارگردانی';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              ایجاد چرخه انبارگردانی جدید
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              چرخه جدید برای انبارگردانی دوره‌ای ایجاد کنید
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

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              نام چرخه <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="مثال: انبارگردانی ماهانه دی ۱۴۰۳"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              توضیحات
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="توضیحات اختیاری درباره این چرخه انبارگردانی..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تاریخ شروع <span className="text-red-500">*</span>
              </label>
              <FarsiDatePicker
                value={formData.startDate}
                onChange={(value) => handleDateChange('startDate', value)}
                placeholder="تاریخ شروع را انتخاب کنید"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تاریخ پایان <span className="text-red-500">*</span>
              </label>
              <FarsiDatePicker
                value={formData.endDate}
                onChange={(value) => handleDateChange('endDate', value)}
                placeholder="تاریخ پایان را انتخاب کنید"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'در حال ایجاد...' : 'ایجاد چرخه'}
            </button>
            <Link
              href="/workspaces/inventory-management/audit"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              انصراف
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

