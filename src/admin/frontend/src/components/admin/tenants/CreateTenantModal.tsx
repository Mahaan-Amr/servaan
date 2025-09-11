'use client';

import { useState } from 'react';
import { X, Save, Building2, User, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createTenant } from '@/services/admin/tenants/tenantService';
import type { TenantPlan } from '@/types/admin';

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTenantModal({ isOpen, onClose, onSuccess }: CreateTenantModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    subdomain: '',
    description: '',
    plan: 'STARTER' as TenantPlan,
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    businessType: '',
    city: '',
    country: 'ایران',
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      await createTenant({
        name: formData.name,
        displayName: formData.displayName || formData.name,
        subdomain: formData.subdomain,
        description: formData.description,
        plan: formData.plan as TenantPlan,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPhone: formData.ownerPhone,
        businessType: formData.businessType,
        city: formData.city,
        country: formData.country,
        isActive: formData.isActive,
      });
      
      toast.success('مستأجر جدید با موفقیت ایجاد شد');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        displayName: '',
        subdomain: '',
        description: '',
        plan: 'STARTER' as TenantPlan,
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        businessType: '',
        city: '',
        country: 'ایران',
        isActive: true
      });
      
    } catch (error: any) {
      toast.error(error.message || 'خطا در ایجاد مستأجر جدید');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-admin shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-admin-border">
          <div className="flex items-center">
            <Building2 className="h-6 w-6 text-admin-primary ml-2" />
            <h2 className="text-xl font-bold text-admin-text">ایجاد مستأجر جدید</h2>
          </div>
          <button
            onClick={onClose}
            className="text-admin-text-muted hover:text-admin-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">
                نام مستأجر *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                required
                placeholder="نام مستأجر"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">
                نام نمایشی
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                placeholder="نام نمایشی"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">
                زیردامنه *
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={formData.subdomain}
                  onChange={(e) => handleInputChange('subdomain', e.target.value)}
                  className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                  required
                  placeholder="نام زیردامنه"
                />
                <span className="mr-2 text-admin-text-muted">.servaan.com</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">
                طرح *
              </label>
              <select
                value={formData.plan}
                onChange={(e) => handleInputChange('plan', e.target.value)}
                className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                required
              >
                <option value="STARTER">استارتر</option>
                <option value="BUSINESS">بیزینس</option>
                <option value="ENTERPRISE">انترپرایز</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">
                نام مالک *
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => handleInputChange('ownerName', e.target.value)}
                className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                required
                placeholder="نام مالک"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">
                ایمیل مالک *
              </label>
              <input
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                required
                placeholder="ایمیل مالک"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">
                شماره تلفن
              </label>
              <input
                type="tel"
                value={formData.ownerPhone}
                onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                placeholder="شماره تلفن"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">
                نوع کسب و کار
              </label>
              <input
                type="text"
                value={formData.businessType}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
                className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                placeholder="نوع کسب و کار"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">
                شهر
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                placeholder="شهر"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">
                کشور
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                placeholder="کشور"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-admin-text mb-2">
              توضیحات
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
              placeholder="توضیحات مستأجر"
            />
          </div>

          <div className="mt-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="ml-2 text-admin-primary focus:ring-admin-primary"
              />
              <span className="text-sm text-admin-text">مستأجر فعال باشد</span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 space-x-reverse pt-6 border-t border-admin-border">
            <button
              type="button"
              onClick={onClose}
              className="btn-admin-secondary"
              disabled={loading}
            >
              انصراف
            </button>
            <button
              type="submit"
              className="btn-admin-primary flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  در حال ایجاد...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  ایجاد مستأجر
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
