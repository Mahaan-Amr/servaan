'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  X, 
  Building2, 
  User, 
  MapPin, 
  Settings, 
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info
} from 'lucide-react';
import { createTenant, CreateTenantPayload, checkSubdomainAvailability } from '@/services/admin/tenants/tenantService';
import { TenantPlan } from '@/types/admin';
import toast from 'react-hot-toast';

interface TenantCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: any;
}

interface TenantFormData {
  // Step 1: Basic Information
  name: string;
  displayName: string;
  subdomain: string;
  description: string;
  
  // Step 2: Owner Information
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  
  // Step 3: Business Information
  businessType: string;
  city: string;
  country: string;
  
  // Step 4: Plan & Features
  plan: TenantPlan;
  features: {
    hasInventoryManagement: boolean;
    hasCustomerManagement: boolean;
    hasAccountingSystem: boolean;
    hasReporting: boolean;
    hasNotifications: boolean;
    hasAdvancedReporting: boolean;
    hasApiAccess: boolean;
    hasCustomBranding: boolean;
    hasMultiLocation: boolean;
    hasAdvancedCRM: boolean;
    hasWhatsappIntegration: boolean;
    hasInstagramIntegration: boolean;
    hasAnalyticsBI: boolean;
  };
  
  // Step 5: Settings
  isActive: boolean;
}

const initialFormData: TenantFormData = {
  name: '',
  displayName: '',
  subdomain: '',
  description: '',
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  businessType: '',
  city: '',
  country: 'ایران',
  plan: 'STARTER',
  features: {
    hasInventoryManagement: false,
    hasCustomerManagement: false,
    hasAccountingSystem: false,
    hasReporting: false,
    hasNotifications: true,
    hasAdvancedReporting: false,
    hasApiAccess: false,
    hasCustomBranding: false,
    hasMultiLocation: false,
    hasAdvancedCRM: false,
    hasWhatsappIntegration: false,
    hasInstagramIntegration: false,
    hasAnalyticsBI: false,
  },
  isActive: true,
};

const wizardSteps: WizardStep[] = [
  {
    id: 'basic',
    title: 'اطلاعات پایه',
    description: 'نام و زیردامنه مستأجر',
    icon: Building2
  },
  {
    id: 'owner',
    title: 'اطلاعات مالک',
    description: 'اطلاعات تماس مالک',
    icon: User
  },
  {
    id: 'business',
    title: 'اطلاعات کسب‌وکار',
    description: 'نوع و موقعیت کسب‌وکار',
    icon: MapPin
  },
  {
    id: 'plan',
    title: 'طرح و ویژگی‌ها',
    description: 'انتخاب طرح و ویژگی‌ها',
    icon: Settings
  },
  {
    id: 'preview',
    title: 'بررسی نهایی',
    description: 'بررسی و تأیید اطلاعات',
    icon: Eye
  }
];

const businessTypes = [
  'رستوران',
  'کافه',
  'فست فود',
  'سوپرمارکت',
  'فروشگاه',
  'هتل',
  'سالن زیبایی',
  'کلینیک',
  'آموزشگاه',
  'سایر'
];

const cities = [
  'تهران',
  'مشهد',
  'اصفهان',
  'شیراز',
  'تبریز',
  'کرج',
  'اهواز',
  'قم',
  'کرمانشاه',
  'ارومیه',
  'زاهدان',
  'رشت',
  'کرمان',
  'همدان',
  'یزد',
  'اردبیل',
  'بندرعباس',
  'کاشان',
  'ساری',
  'سایر'
];

const planFeatures = {
  STARTER: {
    name: 'استارتر',
    price: 'رایگان',
    description: 'مناسب برای کسب‌وکارهای کوچک',
    features: ['مدیریت موجودی', 'مدیریت مشتریان', 'گزارش‌گیری پایه', 'اعلان‌ها'],
    maxUsers: 5,
    maxItems: 1000,
    maxCustomers: 500
  },
  BUSINESS: {
    name: 'بیزینس',
    price: '۲۹۹,۰۰۰ تومان/ماه',
    description: 'مناسب برای کسب‌وکارهای متوسط',
    features: ['همه ویژگی‌های استارتر', 'سیستم حسابداری', 'گزارش‌گیری پیشرفته', 'دسترسی API', 'برندسازی سفارشی'],
    maxUsers: 20,
    maxItems: 5000,
    maxCustomers: 2000
  },
  ENTERPRISE: {
    name: 'انترپرایز',
    price: '۹۹۹,۰۰۰ تومان/ماه',
    description: 'مناسب برای کسب‌وکارهای بزرگ',
    features: ['همه ویژگی‌های بیزینس', 'چند شعبه', 'CRM پیشرفته', 'اتصال واتساپ', 'اتصال اینستاگرام', 'تحلیل داده'],
    maxUsers: 100,
    maxItems: 50000,
    maxCustomers: 10000
  }
};

export default function TenantCreationWizard({ isOpen, onClose, onSuccess }: TenantCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<TenantFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setCurrentStep(0);
      setErrors({});
      setSubdomainAvailable(null);
    }
  }, [isOpen]);

  // Check subdomain availability
  const checkSubdomainAvailabilityReal = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    setSubdomainChecking(true);
    try {
      const result = await checkSubdomainAvailability(subdomain);
      setSubdomainAvailable(result.available);
    } catch (error) {
      setSubdomainAvailable(false);
    } finally {
      setSubdomainChecking(false);
    }
  };

  // Debounced subdomain check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.subdomain) {
        checkSubdomainAvailabilityReal(formData.subdomain);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.subdomain]);

  const updateFormData = (field: keyof TenantFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateFeature = (feature: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: { ...prev.features, [feature]: value }
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Information
        if (!formData.name.trim()) newErrors.name = 'نام مستأجر الزامی است';
        if (!formData.displayName.trim()) newErrors.displayName = 'نام نمایشی الزامی است';
        if (!formData.subdomain.trim()) {
          newErrors.subdomain = 'زیردامنه الزامی است';
        } else if (formData.subdomain.length < 3) {
          newErrors.subdomain = 'زیردامنه باید حداقل ۳ کاراکتر باشد';
        } else if (!/^[a-zA-Z0-9-]+$/.test(formData.subdomain)) {
          newErrors.subdomain = 'زیردامنه فقط می‌تواند شامل حروف، اعداد و خط تیره باشد';
        } else if (subdomainAvailable === false) {
          newErrors.subdomain = 'این زیردامنه قبلاً استفاده شده است';
        }
        break;

      case 1: // Owner Information
        if (!formData.ownerName.trim()) newErrors.ownerName = 'نام مالک الزامی است';
        if (!formData.ownerEmail.trim()) {
          newErrors.ownerEmail = 'ایمیل مالک الزامی است';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
          newErrors.ownerEmail = 'ایمیل معتبر نیست';
        }
        break;

      case 2: // Business Information
        if (!formData.businessType.trim()) newErrors.businessType = 'نوع کسب‌وکار الزامی است';
        if (!formData.city.trim()) newErrors.city = 'شهر الزامی است';
        break;

      case 3: // Plan & Features
        // No validation needed for plan and features
        break;

      case 4: // Preview
        // Final validation
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, wizardSteps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      const payload: CreateTenantPayload = {
        name: formData.name,
        displayName: formData.displayName,
        subdomain: formData.subdomain,
        description: formData.description,
        plan: formData.plan,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPhone: formData.ownerPhone,
        businessType: formData.businessType,
        city: formData.city,
        country: formData.country,
        isActive: formData.isActive,
        features: formData.features
      };

      await createTenant(payload);
      toast.success('مستأجر با موفقیت ایجاد شد');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'خطا در ایجاد مستأجر');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">نام مستأجر *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-admin-border'
                }`}
                placeholder="نام کسب‌وکار"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">نام نمایشی *</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => updateFormData('displayName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent ${
                  errors.displayName ? 'border-red-500' : 'border-admin-border'
                }`}
                placeholder="نام نمایشی در پنل"
              />
              {errors.displayName && <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">زیردامنه *</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.subdomain}
                  onChange={(e) => updateFormData('subdomain', e.target.value.toLowerCase())}
                  className={`w-full px-3 py-2 pr-20 border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent ${
                    errors.subdomain ? 'border-red-500' : 'border-admin-border'
                  }`}
                  placeholder="subdomain"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-admin-text-muted">
                  .servaan.com
                </div>
                {subdomainChecking && (
                  <div className="absolute left-12 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-admin-primary" />
                  </div>
                )}
                {!subdomainChecking && subdomainAvailable !== null && (
                  <div className="absolute left-12 top-1/2 transform -translate-y-1/2">
                    {subdomainAvailable ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {errors.subdomain && <p className="text-red-500 text-sm mt-1">{errors.subdomain}</p>}
              {subdomainAvailable === true && (
                <p className="text-green-500 text-sm mt-1">این زیردامنه در دسترس است</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">توضیحات</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                rows={3}
                placeholder="توضیحات کوتاه درباره کسب‌وکار"
              />
            </div>
          </div>
        );

      case 1: // Owner Information
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">نام مالک *</label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => updateFormData('ownerName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent ${
                  errors.ownerName ? 'border-red-500' : 'border-admin-border'
                }`}
                placeholder="نام کامل مالک"
              />
              {errors.ownerName && <p className="text-red-500 text-sm mt-1">{errors.ownerName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">ایمیل مالک *</label>
              <input
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => updateFormData('ownerEmail', e.target.value)}
                className={`w-full px-3 py-2 border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent ${
                  errors.ownerEmail ? 'border-red-500' : 'border-admin-border'
                }`}
                placeholder="owner@example.com"
              />
              {errors.ownerEmail && <p className="text-red-500 text-sm mt-1">{errors.ownerEmail}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">شماره تماس</label>
              <input
                type="tel"
                value={formData.ownerPhone}
                onChange={(e) => updateFormData('ownerPhone', e.target.value)}
                className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                placeholder="09123456789"
              />
            </div>
          </div>
        );

      case 2: // Business Information
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">نوع کسب‌وکار *</label>
              <select
                value={formData.businessType}
                onChange={(e) => updateFormData('businessType', e.target.value)}
                className={`w-full px-3 py-2 border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent ${
                  errors.businessType ? 'border-red-500' : 'border-admin-border'
                }`}
              >
                <option value="">انتخاب کنید</option>
                {businessTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.businessType && <p className="text-red-500 text-sm mt-1">{errors.businessType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">شهر *</label>
              <select
                value={formData.city}
                onChange={(e) => updateFormData('city', e.target.value)}
                className={`w-full px-3 py-2 border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent ${
                  errors.city ? 'border-red-500' : 'border-admin-border'
                }`}
              >
                <option value="">انتخاب کنید</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">کشور</label>
              <select
                value={formData.country}
                onChange={(e) => updateFormData('country', e.target.value)}
                className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
              >
                <option value="ایران">ایران</option>
                <option value="ترکیه">ترکیه</option>
                <option value="امارات">امارات</option>
                <option value="سایر">سایر</option>
              </select>
            </div>
          </div>
        );

      case 3: // Plan & Features
        return (
          <div className="space-y-6">
            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-medium text-admin-text mb-4">انتخاب طرح</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(planFeatures).map(([key, plan]) => (
                  <div
                    key={key}
                    className={`border-2 rounded-admin p-4 cursor-pointer transition-all ${
                      formData.plan === key
                        ? 'border-admin-primary bg-admin-primary bg-opacity-10'
                        : 'border-admin-border hover:border-admin-primary'
                    }`}
                    onClick={() => updateFormData('plan', key as TenantPlan)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-admin-text">{plan.name}</h3>
                      {formData.plan === key && <Check className="h-5 w-5 text-admin-primary" />}
                    </div>
                    <p className="text-lg font-bold text-admin-primary mb-2">{plan.price}</p>
                    <p className="text-sm text-admin-text-muted mb-3">{plan.description}</p>
                    <ul className="text-sm text-admin-text space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="h-3 w-3 text-green-500 ml-1" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 pt-3 border-t border-admin-border text-xs text-admin-text-muted">
                      <p>حداکثر کاربران: {plan.maxUsers}</p>
                      <p>حداکثر آیتم: {plan.maxItems.toLocaleString()}</p>
                      <p>حداکثر مشتری: {plan.maxCustomers.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features Selection */}
            <div>
              <label className="block text-sm font-medium text-admin-text mb-4">ویژگی‌های اضافی</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'hasInventoryManagement', label: 'مدیریت موجودی پیشرفته', description: 'مدیریت کامل موجودی و انبار' },
                  { key: 'hasCustomerManagement', label: 'مدیریت مشتریان', description: 'سیستم CRM برای مدیریت مشتریان' },
                  { key: 'hasAccountingSystem', label: 'سیستم حسابداری', description: 'حسابداری کامل و گزارش‌های مالی' },
                  { key: 'hasReporting', label: 'گزارش‌گیری پایه', description: 'گزارش‌های ساده و کاربردی' },
                  { key: 'hasAdvancedReporting', label: 'گزارش‌گیری پیشرفته', description: 'گزارش‌های تحلیلی و نمودارها' },
                  { key: 'hasApiAccess', label: 'دسترسی API', description: 'دسترسی به API برای توسعه' },
                  { key: 'hasCustomBranding', label: 'برندسازی سفارشی', description: 'لوگو و رنگ‌بندی سفارشی' },
                  { key: 'hasMultiLocation', label: 'چند شعبه', description: 'مدیریت چندین شعبه' },
                  { key: 'hasAdvancedCRM', label: 'CRM پیشرفته', description: 'سیستم CRM حرفه‌ای' },
                  { key: 'hasWhatsappIntegration', label: 'اتصال واتساپ', description: 'ارسال پیام از طریق واتساپ' },
                  { key: 'hasInstagramIntegration', label: 'اتصال اینستاگرام', description: 'مدیریت پست‌های اینستاگرام' },
                  { key: 'hasAnalyticsBI', label: 'تحلیل داده', description: 'ابزارهای تحلیل و هوش تجاری' }
                ].map((feature) => (
                  <div key={feature.key} className="flex items-start space-x-3 space-x-reverse">
                    <input
                      type="checkbox"
                      checked={formData.features[feature.key as keyof typeof formData.features]}
                      onChange={(e) => updateFeature(feature.key, e.target.checked)}
                      className="h-4 w-4 text-admin-primary focus:ring-admin-primary border-admin-border rounded mt-1"
                    />
                    <div className="flex-1">
                      <label className="text-sm font-medium text-admin-text">{feature.label}</label>
                      <p className="text-xs text-admin-text-muted">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4: // Preview
        return (
          <div className="space-y-6">
            <div className="bg-admin-bg rounded-admin p-4">
              <h3 className="font-medium text-admin-text mb-4">خلاصه اطلاعات</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-admin-text mb-2">اطلاعات پایه</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-admin-text-muted">نام:</span> {formData.name}</p>
                    <p><span className="text-admin-text-muted">نام نمایشی:</span> {formData.displayName}</p>
                    <p><span className="text-admin-text-muted">زیردامنه:</span> {formData.subdomain}.servaan.com</p>
                    {formData.description && (
                      <p><span className="text-admin-text-muted">توضیحات:</span> {formData.description}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-admin-text mb-2">اطلاعات مالک</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-admin-text-muted">نام:</span> {formData.ownerName}</p>
                    <p><span className="text-admin-text-muted">ایمیل:</span> {formData.ownerEmail}</p>
                    {formData.ownerPhone && (
                      <p><span className="text-admin-text-muted">تلفن:</span> {formData.ownerPhone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-admin-text mb-2">اطلاعات کسب‌وکار</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-admin-text-muted">نوع:</span> {formData.businessType}</p>
                    <p><span className="text-admin-text-muted">شهر:</span> {formData.city}</p>
                    <p><span className="text-admin-text-muted">کشور:</span> {formData.country}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-admin-text mb-2">طرح و ویژگی‌ها</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-admin-text-muted">طرح:</span> {planFeatures[formData.plan].name}</p>
                    <p><span className="text-admin-text-muted">قیمت:</span> {planFeatures[formData.plan].price}</p>
                    <p><span className="text-admin-text-muted">وضعیت:</span> {formData.isActive ? 'فعال' : 'غیرفعال'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium text-admin-text mb-2">ویژگی‌های فعال</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(formData.features)
                    .filter(([_, enabled]) => enabled)
                    .map(([key, _]) => {
                      const feature = [
                        { key: 'hasInventoryManagement', label: 'مدیریت موجودی' },
                        { key: 'hasCustomerManagement', label: 'مدیریت مشتریان' },
                        { key: 'hasAccountingSystem', label: 'سیستم حسابداری' },
                        { key: 'hasReporting', label: 'گزارش‌گیری' },
                        { key: 'hasAdvancedReporting', label: 'گزارش‌گیری پیشرفته' },
                        { key: 'hasApiAccess', label: 'دسترسی API' },
                        { key: 'hasCustomBranding', label: 'برندسازی سفارشی' },
                        { key: 'hasMultiLocation', label: 'چند شعبه' },
                        { key: 'hasAdvancedCRM', label: 'CRM پیشرفته' },
                        { key: 'hasWhatsappIntegration', label: 'اتصال واتساپ' },
                        { key: 'hasInstagramIntegration', label: 'اتصال اینستاگرام' },
                        { key: 'hasAnalyticsBI', label: 'تحلیل داده' }
                      ].find(f => f.key === key);
                      return (
                        <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-admin-primary text-white">
                          <Check className="h-3 w-3 ml-1" />
                          {feature?.label}
                        </span>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                id="confirm"
                className="h-4 w-4 text-admin-primary focus:ring-admin-primary border-admin-border rounded"
              />
              <label htmlFor="confirm" className="text-sm text-admin-text">
                تأیید می‌کنم که اطلاعات وارد شده صحیح است و مستأجر با این تنظیمات ایجاد شود
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-admin w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-admin-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-admin-text">ایجاد مستأجر جدید</h2>
              <p className="text-admin-text-muted">مرحله {currentStep + 1} از {wizardSteps.length}</p>
            </div>
            <button
              onClick={onClose}
              className="text-admin-text-muted hover:text-admin-text"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {wizardSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isActive 
                        ? 'border-admin-primary bg-admin-primary text-white' 
                        : isCompleted 
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-admin-border bg-white text-admin-text-muted'
                    }`}>
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="mr-3 text-right">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-admin-primary' : 'text-admin-text-muted'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-admin-text-muted">{step.description}</p>
                    </div>
                    {index < wizardSteps.length - 1 && (
                      <ChevronLeft className="h-4 w-4 text-admin-text-muted mx-4" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="border-t border-admin-border p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="btn-admin-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4 ml-2" />
              قبلی
            </button>

            <div className="flex items-center space-x-2 space-x-reverse">
              {currentStep === wizardSteps.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-admin-primary flex items-center"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 ml-2" />
                  )}
                  ایجاد مستأجر
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  className="btn-admin-primary flex items-center"
                >
                  بعدی
                  <ChevronLeft className="h-4 w-4 mr-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
