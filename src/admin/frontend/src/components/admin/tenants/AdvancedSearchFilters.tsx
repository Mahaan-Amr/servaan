'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Users, 
  MapPin, 
  X,
  Save
} from 'lucide-react';
import { TenantListParams } from '@/services/admin/tenants/tenantService';
import toast from 'react-hot-toast';

interface AdvancedSearchFiltersProps {
  onFiltersChange: (filters: Partial<TenantListParams>) => void;
  onClearFilters: () => void;
  initialFilters?: Partial<TenantListParams>;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: Partial<TenantListParams>;
  createdAt: Date;
}

export default function AdvancedSearchFilters({ 
  onFiltersChange, 
  onClearFilters, 
  initialFilters = {} 
}: AdvancedSearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<Partial<TenantListParams>>(initialFilters);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tenant-saved-searches');
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved searches:', error);
      }
    }
  }, []);

  // Update filters when they change
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof TenantListParams, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const handleClearFilters = () => {
    setFilters({});
    onClearFilters();
    toast.success('فیلترها پاک شدند');
  };

  const handleSaveSearch = () => {
    if (!saveSearchName.trim()) {
      toast.error('لطفاً نام جستجو را وارد کنید');
      return;
    }

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: saveSearchName,
      filters: { ...filters },
      createdAt: new Date()
    };

    const updatedSearches = [...savedSearches, newSearch];
    setSavedSearches(updatedSearches);
    localStorage.setItem('tenant-saved-searches', JSON.stringify(updatedSearches));
    
    setShowSaveDialog(false);
    setSaveSearchName('');
    toast.success('جستجو ذخیره شد');
  };

  const handleLoadSavedSearch = (savedSearch: SavedSearch) => {
    setFilters(savedSearch.filters);
    toast.success(`جستجوی "${savedSearch.name}" بارگذاری شد`);
  };

  const handleDeleteSavedSearch = (id: string) => {
    const updatedSearches = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updatedSearches);
    localStorage.setItem('tenant-saved-searches', JSON.stringify(updatedSearches));
    toast.success('جستجوی ذخیره شده حذف شد');
  };

  const formatDateForInput = (date: string | Date | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white rounded-admin border border-admin-border p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-admin-text">جستجو و فیلتر پیشرفته</h2>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn-admin-secondary flex items-center"
          >
            <Filter className="h-4 w-4 ml-2" />
            {showAdvanced ? 'مخفی کردن فیلترها' : 'نمایش فیلترها'}
          </button>
          
          {Object.keys(filters).length > 0 && (
            <button
              onClick={handleClearFilters}
              className="btn-admin-danger flex items-center"
            >
              <X className="h-4 w-4 ml-2" />
              پاک کردن فیلترها
            </button>
          )}
        </div>
      </div>

      {/* Basic Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
          <input
            type="text"
            placeholder="جستجو در نام، زیردامنه، ایمیل، شهر، کشور..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-admin-text">جستجوهای ذخیره شده</h3>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="text-admin-primary hover:text-admin-primary-dark text-sm flex items-center"
            >
              <Save className="h-3 w-3 ml-1" />
              ذخیره جستجو
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map((search) => (
              <div key={search.id} className="flex items-center bg-admin-bg rounded-admin px-3 py-1">
                <button
                  onClick={() => handleLoadSavedSearch(search)}
                  className="text-sm text-admin-text hover:text-admin-primary mr-2"
                >
                  {search.name}
                </button>
                <button
                  onClick={() => handleDeleteSavedSearch(search.id)}
                  className="text-admin-danger hover:text-admin-danger-dark"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-6">
          {/* Basic Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">وضعیت</label>
              <select
                value={filters.status || 'all'}
                onChange={(e) => handleFilterChange('status', e.target.value === 'all' ? undefined : e.target.value)}
                className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
              >
                <option value="all">همه</option>
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
              </select>
            </div>

            {/* Plan Filter */}
            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">طرح</label>
              <select
                value={filters.plan || 'all'}
                onChange={(e) => handleFilterChange('plan', e.target.value === 'all' ? undefined : e.target.value)}
                className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
              >
                <option value="all">همه</option>
                <option value="STARTER">استارتر</option>
                <option value="BUSINESS">بیزینس</option>
                <option value="ENTERPRISE">انترپرایز</option>
              </select>
            </div>

            {/* Business Type Filter */}
            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">نوع کسب‌وکار</label>
              <select
                value={filters.businessType || 'all'}
                onChange={(e) => handleFilterChange('businessType', e.target.value === 'all' ? undefined : e.target.value)}
                className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
              >
                <option value="all">همه</option>
                <option value="رستوران">رستوران</option>
                <option value="کافه">کافه</option>
                <option value="فست فود">فست فود</option>
                <option value="سوپرمارکت">سوپرمارکت</option>
                <option value="فروشگاه">فروشگاه</option>
                <option value="سایر">سایر</option>
              </select>
            </div>
          </div>

          {/* Location Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">شهر</label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
                <input
                  type="text"
                  placeholder="نام شهر"
                  value={filters.city || ''}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Country Filter */}
            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">کشور</label>
              <select
                value={filters.country || 'all'}
                onChange={(e) => handleFilterChange('country', e.target.value === 'all' ? undefined : e.target.value)}
                className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
              >
                <option value="all">همه</option>
                <option value="ایران">ایران</option>
                <option value="ترکیه">ترکیه</option>
                <option value="امارات">امارات</option>
                <option value="سایر">سایر</option>
              </select>
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">تاریخ ایجاد از</label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
                <input
                  type="date"
                  value={formatDateForInput(filters.createdFrom)}
                  onChange={(e) => handleFilterChange('createdFrom', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">تاریخ ایجاد تا</label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
                <input
                  type="date"
                  value={formatDateForInput(filters.createdTo)}
                  onChange={(e) => handleFilterChange('createdTo', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Revenue Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">درآمد ماهانه از (ریال)</label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
                <input
                  type="number"
                  placeholder="حداقل درآمد"
                  value={filters.revenueFrom || ''}
                  onChange={(e) => handleFilterChange('revenueFrom', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">درآمد ماهانه تا (ریال)</label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
                <input
                  type="number"
                  placeholder="حداکثر درآمد"
                  value={filters.revenueTo || ''}
                  onChange={(e) => handleFilterChange('revenueTo', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* User Count Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">تعداد کاربران از</label>
              <div className="relative">
                <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
                <input
                  type="number"
                  placeholder="حداقل کاربران"
                  value={filters.userCountFrom || ''}
                  onChange={(e) => handleFilterChange('userCountFrom', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">تعداد کاربران تا</label>
              <div className="relative">
                <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
                <input
                  type="number"
                  placeholder="حداکثر کاربران"
                  value={filters.userCountTo || ''}
                  onChange={(e) => handleFilterChange('userCountTo', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Feature Filters */}
          <div>
            <label className="block text-sm font-medium text-admin-text mb-2">ویژگی‌های فعال</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {[
                { key: 'hasInventoryManagement', label: 'مدیریت موجودی' },
                { key: 'hasCustomerManagement', label: 'مدیریت مشتریان' },
                { key: 'hasAccountingSystem', label: 'سیستم حسابداری' },
                { key: 'hasReporting', label: 'گزارش‌گیری' },
                { key: 'hasNotifications', label: 'اعلان‌ها' },
                { key: 'hasAdvancedReporting', label: 'گزارش‌گیری پیشرفته' },
                { key: 'hasApiAccess', label: 'دسترسی API' },
                { key: 'hasCustomBranding', label: 'برندسازی سفارشی' },
                { key: 'hasMultiLocation', label: 'چند شعبه' },
                { key: 'hasAdvancedCRM', label: 'CRM پیشرفته' },
                { key: 'hasWhatsappIntegration', label: 'اتصال واتساپ' },
                { key: 'hasInstagramIntegration', label: 'اتصال اینستاگرام' },
                { key: 'hasAnalyticsBI', label: 'تحلیل داده' }
              ].map((feature) => (
                <label key={feature.key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasFeatures?.includes(feature.key) || false}
                    onChange={(e) => {
                      const currentFeatures = filters.hasFeatures || [];
                      const newFeatures = e.target.checked
                        ? [...currentFeatures, feature.key]
                        : currentFeatures.filter(f => f !== feature.key);
                      handleFilterChange('hasFeatures', newFeatures.length > 0 ? newFeatures : undefined);
                    }}
                    className="h-4 w-4 text-admin-primary focus:ring-admin-primary border-admin-border rounded"
                  />
                  <span className="mr-2 text-sm text-admin-text">{feature.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-admin p-6 w-96">
            <h3 className="text-lg font-medium text-admin-text mb-4">ذخیره جستجو</h3>
            <input
              type="text"
              placeholder="نام جستجو"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent mb-4"
            />
            <div className="flex items-center justify-end space-x-2 space-x-reverse">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="btn-admin-secondary"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveSearch}
                className="btn-admin-primary"
              >
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
