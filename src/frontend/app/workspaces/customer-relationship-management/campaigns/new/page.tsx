'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNotifications } from '../../../../../contexts/NotificationContext';
import { getToken } from '../../../../../services/authService';
import { NotificationType, NotificationPriority } from '../../../../../../shared/types';
import { formatCurrency } from '../../../../../utils/dateUtils';

interface Template {
  id: string;
  name: string;
  templateType: 'SMS' | 'INSTAGRAM' | 'EMAIL' | 'PUSH';
  content: string;
  variables: Record<string, unknown>;
  category?: string;
}

interface CustomerSegment {
  segment: string;
  count: number;
}

type CampaignType = 'SMS' | 'INSTAGRAM' | 'EMAIL' | 'PUSH';

export default function NewCampaignPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [segmentStats, setSegmentStats] = useState<CustomerSegment[]>([]);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaignType: 'SMS' as CampaignType,
    targetSegment: {
      segments: [] as string[],
      tiers: [] as string[],
      allowMarketing: true,
      status: 'ACTIVE'
    },
    templateContent: '',
    templateVariables: {} as Record<string, unknown>,
    scheduledDate: '',
    costPerMessage: 100
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [estimatedRecipients, setEstimatedRecipients] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/campaigns/templates/list', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTemplates(result.templates);
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchSegmentStats = async () => {
    try {
      const response = await fetch('/api/customers/statistics', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.bySegment) {
          const stats = Object.entries(result.bySegment).map(([segment, count]) => ({
            segment,
            count: count as number
          }));
          setSegmentStats(stats);
        }
      }
    } catch (error) {
      console.error('Error fetching segment stats:', error);
    }
  };

  const estimateRecipients = useCallback(async () => {
    try {
      // Mock estimation logic - in real implementation, this would call the backend
      let count = 0;
      
      if (formData.targetSegment.segments.length === 0) {
        // If no segments selected, count all customers
        count = segmentStats.reduce((sum, stat) => sum + stat.count, 0);
      } else {
        // Count customers in selected segments
        count = segmentStats
          .filter(stat => formData.targetSegment.segments.includes(stat.segment))
          .reduce((sum, stat) => sum + stat.count, 0);
      }
      
      // Apply marketing consent filter
      if (formData.targetSegment.allowMarketing) {
        count = Math.floor(count * 0.8); // Assume 80% allow marketing
      }
      
      setEstimatedRecipients(count);
    } catch (error) {
      console.error('Error estimating recipients:', error);
      setEstimatedRecipients(0);
    }
  }, [formData.targetSegment, segmentStats]);

  useEffect(() => {
    fetchTemplates();
    fetchSegmentStats();
  }, []);

  useEffect(() => {
    estimateRecipients();
  }, [estimateRecipients]);

  useEffect(() => {
    setEstimatedCost(estimatedRecipients * formData.costPerMessage);
  }, [estimatedRecipients, formData.costPerMessage]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'نام کمپین الزامی است';
    } else if (formData.name.length < 2) {
      newErrors.name = 'نام کمپین باید حداقل 2 کاراکتر باشد';
    }

    if (!formData.templateContent.trim()) {
      newErrors.templateContent = 'محتوای کمپین الزامی است';
    } else if (formData.templateContent.length < 10) {
      newErrors.templateContent = 'محتوای کمپین باید حداقل 10 کاراکتر باشد';
    }

    if (formData.targetSegment.segments.length === 0) {
      newErrors.targetSegment = 'حداقل یک بخش مشتری انتخاب کنید';
    }

    if (formData.costPerMessage < 0) {
      newErrors.costPerMessage = 'هزینه پیام نمی‌تواند منفی باشد';
    }

    if (formData.scheduledDate) {
      const scheduledDate = new Date(formData.scheduledDate);
      const now = new Date();
      if (scheduledDate <= now) {
        newErrors.scheduledDate = 'زمان زمان‌بندی باید در آینده باشد';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          ...formData,
          scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : undefined
        })
      });

      if (!response.ok) {
        throw new Error('خطا در ایجاد کمپین');
      }

      const result = await response.json();

      if (result.success) {
        addNotification({
          type: NotificationType.SUCCESS,
          priority: NotificationPriority.MEDIUM,
          title: 'موفقیت',
          message: 'کمپین با موفقیت ایجاد شد',
          data: {}
        });
        
        router.push(`/workspaces/customer-relationship-management/campaigns/${result.campaign.id}`);
      } else {
        throw new Error(result.message || 'خطا در ایجاد کمپین');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      addNotification({
        type: NotificationType.ERROR,
        priority: NotificationPriority.HIGH,
        title: 'خطا',
        message: error instanceof Error ? error.message : 'خطا در ایجاد کمپین',
        data: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        campaignType: template.templateType,
        templateContent: template.content,
        templateVariables: template.variables || {}
      }));
      setSelectedTemplate(templateId);
    }
  };

  const handleSegmentToggle = (segment: string) => {
    setFormData(prev => ({
      ...prev,
      targetSegment: {
        ...prev.targetSegment,
        segments: prev.targetSegment.segments.includes(segment)
          ? prev.targetSegment.segments.filter(s => s !== segment)
          : [...prev.targetSegment.segments, segment]
      }
    }));
  };

  const handleTierToggle = (tier: string) => {
    setFormData(prev => ({
      ...prev,
      targetSegment: {
        ...prev.targetSegment,
        tiers: prev.targetSegment.tiers.includes(tier)
          ? prev.targetSegment.tiers.filter(t => t !== tier)
          : [...prev.targetSegment.tiers, tier]
      }
    }));
  };

  const getPreviewContent = () => {
    let content = formData.templateContent;
    
    // Replace common variables with example values
    content = content.replace(/\{customerName\}/g, 'احمد محمدی');
    content = content.replace(/\{firstName\}/g, 'احمد');
    content = content.replace(/\{segment\}/g, 'VIP');
    content = content.replace(/\{tierLevel\}/g, 'GOLD');
    content = content.replace(/\{currentPoints\}/g, '1250');
    
    // Replace custom variables
    Object.entries(formData.templateVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      content = content.replace(regex, String(value));
    });
    
    return content;
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-4 space-x-reverse">
          <Link
            href="/workspaces/customer-relationship-management/campaigns"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">کمپین جدید</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              ایجاد کمپین تبلیغاتی یا اطلاع‌رسانی جدید
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Campaign Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">اطلاعات کلی</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نام کمپین *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="نام کمپین خود را وارد کنید"
              />
              {errors.name && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="campaignType" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نوع کمپین *
              </label>
              <select
                id="campaignType"
                value={formData.campaignType}
                onChange={(e) => setFormData(prev => ({ ...prev, campaignType: e.target.value as CampaignType }))}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="SMS">پیامک</option>
                <option value="EMAIL">ایمیل</option>
                <option value="PUSH">پوش نوتیفیکیشن</option>
                <option value="INSTAGRAM">اینستاگرام</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                توضیحات
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="توضیحات کمپین (اختیاری)"
              />
            </div>
          </div>
        </div>

        {/* Template Selection */}
        {templates.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">انتخاب قالب</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {templates
                .filter(template => template.templateType === formData.campaignType)
                .map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedTemplate === template.id
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2">{template.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {template.content}
                    </p>
                    {template.category && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        {template.category}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Target Audience */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">گروه هدف</h2>
          
          <div className="space-y-4 sm:space-y-6">
            {/* Customer Segments */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                بخش‌های مشتری *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { value: 'NEW', label: 'تازه وارد', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
                  { value: 'OCCASIONAL', label: 'گاه‌به‌گاه', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
                  { value: 'REGULAR', label: 'منظم', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
                  { value: 'VIP', label: 'ویژه', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' }
                ].map((segment) => {
                  const segmentStat = segmentStats.find(s => s.segment === segment.value);
                  const isSelected = formData.targetSegment.segments.includes(segment.value);
                  
                  return (
                    <div
                      key={segment.value}
                      onClick={() => handleSegmentToggle(segment.value)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${segment.color}`}>
                          {segment.label}
                        </span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by div onClick
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {segmentStat ? `${segmentStat.count.toLocaleString('fa-IR')} مشتری` : '0 مشتری'}
                      </div>
                    </div>
                  );
                })}
              </div>
              {errors.targetSegment && <p className="mt-1 text-sm text-red-600">{errors.targetSegment}</p>}
            </div>

            {/* Loyalty Tiers */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                سطح وفاداری (اختیاری)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { value: 'BRONZE', label: 'برنزی', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
                  { value: 'SILVER', label: 'نقره‌ای', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
                  { value: 'GOLD', label: 'طلایی', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
                  { value: 'PLATINUM', label: 'پلاتینیوم', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' }
                ].map((tier) => {
                  const isSelected = formData.targetSegment.tiers.includes(tier.value);
                  
                  return (
                    <div
                      key={tier.value}
                      onClick={() => handleTierToggle(tier.value)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${tier.color}`}>
                          {tier.label}
                        </span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by div onClick
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.targetSegment.allowMarketing}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      targetSegment: { ...prev.targetSegment, allowMarketing: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500 ml-2"
                  />
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    فقط مشتریان موافق با دریافت پیام‌های تبلیغاتی
                  </span>
                </label>
              </div>

              <div>
                <label htmlFor="customerStatus" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  وضعیت مشتری
                </label>
                <select
                  id="customerStatus"
                  value={formData.targetSegment.status}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    targetSegment: { ...prev.targetSegment, status: e.target.value }
                  }))}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="ACTIVE">فعال</option>
                  <option value="INACTIVE">غیرفعال</option>
                  <option value="">همه</option>
                </select>
              </div>
            </div>

            {/* Audience Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-300">
                    تخمین گیرندگان پیام
                  </h3>
                  <p className="text-lg sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {estimatedRecipients.toLocaleString('fa-IR')} مشتری
                  </p>
                </div>
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-300">
                    تخمین هزینه
                  </h3>
                  <p className="text-lg sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(estimatedCost)} تومان
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Creation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">محتوای پیام</h2>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              {showPreview ? 'مخفی کردن پیش‌نمایش' : 'نمایش پیش‌نمایش'}
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="templateContent" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                متن پیام *
              </label>
              <textarea
                id="templateContent"
                value={formData.templateContent}
                onChange={(e) => setFormData(prev => ({ ...prev, templateContent: e.target.value }))}
                rows={6}
                className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.templateContent ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="متن پیام خود را وارد کنید. می‌توانید از متغیرهایی مانند {customerName}, {firstName}, {segment}, {tierLevel}, {currentPoints} استفاده کنید."
              />
              {errors.templateContent && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.templateContent}</p>}
              
              <div className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                تعداد کاراکتر: {formData.templateContent.length}
                {formData.campaignType === 'SMS' && formData.templateContent.length > 160 && (
                  <span className="text-orange-600 dark:text-orange-400 mr-2">
                    (پیامک‌های بلند ممکن است به چند قسمت تقسیم شوند)
                  </span>
                )}
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">پیش‌نمایش پیام</h3>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <p className="text-xs sm:text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {getPreviewContent()}
                  </p>
                </div>
              </div>
            )}

            {/* Variable Helper */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4">
              <h3 className="text-xs sm:text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                متغیرهای قابل استفاده
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                <code className="bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded">{'{customerName}'}</code>
                <code className="bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded">{'{firstName}'}</code>
                <code className="bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded">{'{segment}'}</code>
                <code className="bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded">{'{tierLevel}'}</code>
                <code className="bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded">{'{currentPoints}'}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Scheduling and Cost */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">زمان‌بندی و هزینه</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="scheduledDate" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                زمان ارسال (اختیاری)
              </label>
              <input
                type="datetime-local"
                id="scheduledDate"
                value={formData.scheduledDate}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.scheduledDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.scheduledDate && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.scheduledDate}</p>}
              <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                خالی بگذارید تا فوراً ارسال شود
              </p>
            </div>

            <div>
              <label htmlFor="costPerMessage" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                هزینه هر پیام (تومان)
              </label>
              <input
                type="number"
                id="costPerMessage"
                value={formData.costPerMessage}
                onChange={(e) => setFormData(prev => ({ ...prev, costPerMessage: Number(e.target.value) }))}
                min="0"
                step="10"
                className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.costPerMessage ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.costPerMessage && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.costPerMessage}</p>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <Link
            href="/workspaces/customer-relationship-management/campaigns"
            className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm sm:text-base font-medium rounded-lg transition-colors"
          >
            انصراف
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-left">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                تخمین گیرندگان: {estimatedRecipients.toLocaleString('fa-IR')}
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                تخمین هزینه: {formatCurrency(estimatedCost)} تومان
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 text-white text-sm sm:text-base font-medium rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent ml-2"></div>
                  در حال ایجاد...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  ایجاد کمپین
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 