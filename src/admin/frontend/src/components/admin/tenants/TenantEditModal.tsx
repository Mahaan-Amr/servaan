'use client';

import { useState, useEffect } from 'react';
import { X, Save, Building2, User, Settings, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Tenant, TenantPlan, TenantStatus } from '@/types/admin';
import { updateTenant } from '@/services/admin/tenants/tenantService';

interface TenantEditModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTenant: Tenant) => void;
}

export default function TenantEditModal({ tenant, isOpen, onClose, onSave }: TenantEditModalProps) {
  const [formData, setFormData] = useState<Partial<Tenant>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'features' | 'advanced'>('basic');

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name,
        displayName: tenant.displayName,
        description: tenant.description,
        plan: tenant.plan,
        isActive: tenant.isActive,
        ownerName: tenant.ownerName,
        ownerEmail: tenant.ownerEmail,
        ownerPhone: tenant.ownerPhone,
        businessType: tenant.businessType,
        city: tenant.city,
        country: tenant.country,
        features: tenant.features ? { ...tenant.features } : undefined
      });
    }
  }, [tenant]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features?.[feature]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    try {
      setLoading(true);
      const updatedTenant = await updateTenant(tenant.id, formData);
      toast.success('مستأجر با موفقیت به‌روزرسانی شد');
      onSave(updatedTenant);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'خطا در به‌روزرسانی مستأجر');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !tenant) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-admin shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-admin-border">
          <div className="flex items-center">
            <Building2 className="h-6 w-6 text-admin-primary ml-2" />
            <h2 className="text-xl font-bold text-admin-text">ویرایش مستأجر</h2>
          </div>
          <button
            onClick={onClose}
            className="text-admin-text-muted hover:text-admin-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-admin-border">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'basic'
                ? 'border-admin-primary text-admin-primary'
                : 'border-transparent text-admin-text-muted hover:text-admin-text'
            }`}
          >
            <User className="h-4 w-4 ml-2 inline" />
            اطلاعات پایه
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'features'
                ? 'border-admin-primary text-admin-primary'
                : 'border-transparent text-admin-text-muted hover:text-admin-text'
            }`}
          >
            <Settings className="h-4 w-4 ml-2 inline" />
            ویژگی‌ها
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'advanced'
                ? 'border-admin-primary text-admin-primary'
                : 'border-transparent text-admin-text-muted hover:text-admin-text'
            }`}
          >
            <Shield className="h-4 w-4 ml-2 inline" />
            تنظیمات پیشرفته
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-admin-text mb-2">
                    نام مستأجر *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-admin-text mb-2">
                    نام نمایشی
                  </label>
                  <input
                    type="text"
                    value={formData.displayName || ''}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-admin-text mb-2">
                    ایمیل مالک *
                  </label>
                  <input
                    type="email"
                    value={formData.ownerEmail || ''}
                    onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-admin-text mb-2">
                    نام مالک
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName || ''}
                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                    className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-admin-text mb-2">
                    شماره تلفن
                  </label>
                  <input
                    type="tel"
                    value={formData.ownerPhone || ''}
                    onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-admin-text mb-2">
                    نوع کسب و کار
                  </label>
                  <input
                    type="text"
                    value={formData.businessType || ''}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-admin-text mb-2">
                    شهر
                  </label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-admin-text mb-2">
                    کشور *
                  </label>
                  <input
                    type="text"
                    value={formData.country || ''}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-text mb-2">
                  توضیحات
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-admin-text mb-2">
                    طرح *
                  </label>
                  <select
                    value={formData.plan || ''}
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
                    وضعیت
                  </label>
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isActive"
                        checked={formData.isActive === true}
                        onChange={() => handleInputChange('isActive', true)}
                        className="ml-2 text-admin-primary focus:ring-admin-primary"
                      />
                      فعال
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isActive"
                        checked={formData.isActive === false}
                        onChange={() => handleInputChange('isActive', false)}
                        className="ml-2 text-admin-primary focus:ring-admin-primary"
                      />
                      غیرفعال
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-admin-text mb-4">ویژگی‌های سیستم</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.features && Object.entries(formData.features).map(([key, value]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => handleFeatureToggle(key)}
                        className="ml-2 text-admin-primary focus:ring-admin-primary"
                      />
                      <span className="text-sm text-admin-text">
                        {getFeatureLabel(key)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div className="bg-admin-bg p-4 rounded-admin">
                <h3 className="text-lg font-medium text-admin-text mb-4">تنظیمات پیشرفته</h3>
                <p className="text-sm text-admin-text-muted">
                  این بخش برای تنظیمات پیشرفته و دسترسی‌های خاص در نظر گرفته شده است.
                </p>
              </div>
            </div>
          )}

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
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
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

function getFeatureLabel(featureKey: string): string {
  const featureLabels: Record<string, string> = {
    hasInventoryManagement: 'مدیریت موجودی',
    hasCustomerManagement: 'مدیریت مشتریان',
    hasAccountingSystem: 'سیستم حسابداری',
    hasReporting: 'گزارش‌گیری',
    hasNotifications: 'اعلان‌ها',
    hasAdvancedReporting: 'گزارش‌گیری پیشرفته',
    hasApiAccess: 'دسترسی API',
    hasCustomBranding: 'برندینگ سفارشی',
    hasMultiLocation: 'چند شعبه',
    hasAdvancedCRM: 'CRM پیشرفته',
    hasWhatsappIntegration: 'ادغام واتساپ',
    hasInstagramIntegration: 'ادغام اینستاگرام',
    hasAnalyticsBI: 'تحلیل و هوش تجاری'
  };
  return featureLabels[featureKey] || featureKey;
}
