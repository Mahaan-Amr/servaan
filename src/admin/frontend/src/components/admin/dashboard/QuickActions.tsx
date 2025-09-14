'use client';

import { useState } from 'react';
import { 
  Plus, 
  Users, 
  Building2, 
  Settings, 
  Download, 
  Upload, 
  Shield, 
  BarChart3,
  HelpCircle,
  Bell,
  Database,
  RefreshCw,
  Search,
  Filter,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface QuickActionsProps {
  className?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  action: () => void;
  category: 'management' | 'analytics' | 'system' | 'support';
  requiresRole?: string[];
}

export default function QuickActions({ className = '' }: QuickActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (actionId: string, action: () => void) => {
    try {
      setLoading(actionId);
      await action();
    } catch (error: any) {
      console.error(`Error executing action ${actionId}:`, error);
      toast.error('خطا در اجرای عملیات');
    } finally {
      setLoading(null);
    }
  };

  const quickActions: QuickAction[] = [
    // Management Actions
    {
      id: 'create-tenant',
      title: 'ایجاد مستأجر جدید',
      description: 'افزودن مستأجر جدید به پلتفرم',
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      category: 'management',
      action: () => {
        router.push('/admin/tenants?action=create');
        toast.success('در حال انتقال به صفحه ایجاد مستأجر...');
      }
    },
    {
      id: 'manage-users',
      title: 'مدیریت کاربران',
      description: 'مشاهده و مدیریت کاربران سیستم',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      category: 'management',
      action: () => {
        router.push('/admin/users');
        toast.success('در حال انتقال به صفحه مدیریت کاربران...');
      }
    },
    {
      id: 'system-settings',
      title: 'تنظیمات سیستم',
      description: 'پیکربندی تنظیمات کلی سیستم',
      icon: Settings,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      category: 'management',
      action: () => {
        router.push('/admin/system');
        toast.success('در حال انتقال به تنظیمات سیستم...');
      }
    },

    // Analytics Actions
    {
      id: 'generate-report',
      title: 'ایجاد گزارش',
      description: 'تولید گزارش‌های تحلیلی و آماری',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      category: 'analytics',
      action: () => {
        router.push('/admin/analytics?action=report');
        toast.success('در حال انتقال به صفحه ایجاد گزارش...');
      }
    },
    {
      id: 'view-analytics',
      title: 'مشاهده تحلیل‌ها',
      description: 'دسترسی به تحلیل‌های پیشرفته',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      category: 'analytics',
      action: () => {
        router.push('/admin/analytics');
        toast.success('در حال انتقال به صفحه تحلیل‌ها...');
      }
    },
    {
      id: 'export-data',
      title: 'خروجی داده‌ها',
      description: 'صادرات داده‌ها در فرمت‌های مختلف',
      icon: Download,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      category: 'analytics',
      action: () => {
        toast.success('در حال آماده‌سازی خروجی داده‌ها...');
        // In real implementation, this would trigger a download
      }
    },

    // System Actions
    {
      id: 'backup-system',
      title: 'پشتیبان‌گیری',
      description: 'ایجاد پشتیبان از سیستم',
      icon: Database,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      category: 'system',
      action: () => {
        router.push('/admin/system/backups?action=create');
        toast.success('در حال انتقال به صفحه پشتیبان‌گیری...');
      }
    },
    {
      id: 'security-audit',
      title: 'بررسی امنیت',
      description: 'اجرای بررسی امنیتی سیستم',
      icon: Shield,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      category: 'system',
      action: () => {
        router.push('/admin/security?action=audit');
        toast.success('در حال انتقال به صفحه بررسی امنیت...');
      }
    },
    {
      id: 'system-health',
      title: 'بررسی سلامت سیستم',
      description: 'مشاهده وضعیت کلی سیستم',
      icon: Zap,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      category: 'system',
      action: () => {
        router.push('/admin/system?action=health');
        toast.success('در حال بررسی سلامت سیستم...');
      }
    },

    // Support Actions
    {
      id: 'create-ticket',
      title: 'ایجاد تیکت پشتیبانی',
      description: 'ارسال درخواست پشتیبانی',
      icon: MessageSquare,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      category: 'support',
      action: () => {
        router.push('/admin/support?action=create');
        toast.success('در حال انتقال به صفحه ایجاد تیکت...');
      }
    },
    {
      id: 'view-support',
      title: 'مشاهده پشتیبانی',
      description: 'دسترسی به تیکت‌های پشتیبانی',
      icon: HelpCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      category: 'support',
      action: () => {
        router.push('/admin/support');
        toast.success('در حال انتقال به صفحه پشتیبانی...');
      }
    },
    {
      id: 'send-notification',
      title: 'ارسال اعلان',
      description: 'ارسال اعلان به کاربران',
      icon: Bell,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      category: 'support',
      action: () => {
        router.push('/admin/support?action=notification');
        toast.success('در حال انتقال به صفحه ارسال اعلان...');
      }
    }
  ];

  const categories = {
    management: { title: 'مدیریت', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    analytics: { title: 'تحلیل‌ها', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    system: { title: 'سیستم', color: 'text-red-600', bgColor: 'bg-red-50' },
    support: { title: 'پشتیبانی', color: 'text-green-600', bgColor: 'bg-green-50' }
  };

  const groupedActions = quickActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, QuickAction[]>);

  return (
    <div className={`admin-card ${className}`}>
      <div className="admin-card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Target className="h-5 w-5 text-admin-primary ml-2" />
            <h3 className="text-lg font-semibold text-admin-text">عملیات سریع</h3>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-sm text-admin-text-muted">
              {quickActions.length} عملیات در دسترس
            </span>
          </div>
        </div>
      </div>
      
      <div className="admin-card-body">
        <div className="space-y-6">
          {Object.entries(groupedActions).map(([category, actions]) => (
            <div key={category}>
              <div className="flex items-center mb-4">
                <div className={`p-2 rounded-admin ${categories[category as keyof typeof categories].bgColor}`}>
                  <TrendingUp className={`h-4 w-4 ${categories[category as keyof typeof categories].color}`} />
                </div>
                <h4 className="text-md font-semibold text-admin-text mr-3">
                  {categories[category as keyof typeof categories].title}
                </h4>
                <div className="flex-1 h-px bg-admin-border"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id, action.action)}
                    disabled={loading === action.id}
                    className="group relative p-4 border border-admin-border rounded-admin hover:shadow-md transition-all duration-200 hover:border-admin-primary text-right disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <div className={`p-2 rounded-admin ${action.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                        <action.icon className={`h-5 w-5 ${action.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-semibold text-admin-text group-hover:text-admin-primary transition-colors">
                          {action.title}
                        </h5>
                        <p className="text-xs text-admin-text-muted mt-1 line-clamp-2">
                          {action.description}
                        </p>
                      </div>
                      {loading === action.id && (
                        <div className="absolute top-2 left-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-admin-primary border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 rounded-admin bg-admin-primary opacity-0 group-hover:opacity-5 transition-opacity duration-200"></div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 pt-6 border-t border-admin-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600 mb-1">
                {groupedActions.management?.length || 0}
              </div>
              <div className="text-xs text-admin-text-muted">مدیریت</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-indigo-600 mb-1">
                {groupedActions.analytics?.length || 0}
              </div>
              <div className="text-xs text-admin-text-muted">تحلیل‌ها</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-red-600 mb-1">
                {groupedActions.system?.length || 0}
              </div>
              <div className="text-xs text-admin-text-muted">سیستم</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-green-600 mb-1">
                {groupedActions.support?.length || 0}
              </div>
              <div className="text-xs text-admin-text-muted">پشتیبانی</div>
            </div>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="mt-6 pt-4 border-t border-admin-border">
          <div className="flex flex-wrap gap-2">
            <button className="btn-admin-secondary py-2 px-4 text-sm flex items-center">
              <Search className="h-4 w-4 ml-2" />
              جستجوی پیشرفته
            </button>
            <button className="btn-admin-secondary py-2 px-4 text-sm flex items-center">
              <Filter className="h-4 w-4 ml-2" />
              فیلتر عملیات
            </button>
            <button className="btn-admin-secondary py-2 px-4 text-sm flex items-center">
              <Calendar className="h-4 w-4 ml-2" />
              برنامه‌ریزی کارها
            </button>
            <button className="btn-admin-secondary py-2 px-4 text-sm flex items-center">
              <Mail className="h-4 w-4 ml-2" />
              ارسال ایمیل گروهی
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
