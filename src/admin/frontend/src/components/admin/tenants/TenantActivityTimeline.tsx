'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  User, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  Calendar,
  Search
} from 'lucide-react';
import { formatAdminDate } from '@/utils/persianDate';
import toast from 'react-hot-toast';

interface ActivityItem {
  id: string;
  type: 'user' | 'order' | 'payment' | 'inventory' | 'system' | 'admin';
  action: string;
  description: string;
  timestamp: Date;
  user?: string;
  metadata?: Record<string, any>;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface TenantActivityTimelineProps {
  tenantId: string;
}

export default function TenantActivityTimeline({ tenantId }: TenantActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'user' | 'order' | 'payment' | 'inventory' | 'system' | 'admin'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  // Mock data - in real implementation, this would come from API
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'user',
      action: 'کاربر جدید ثبت‌نام کرد',
      description: 'کاربر "احمد محمدی" در سیستم ثبت‌نام کرد',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      user: 'احمد محمدی',
      status: 'success'
    },
    {
      id: '2',
      type: 'order',
      action: 'سفارش جدید ایجاد شد',
      description: 'سفارش #12345 با مبلغ ۲۵۰,۰۰۰ تومان ایجاد شد',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      user: 'مریم احمدی',
      metadata: { orderId: '12345', amount: 250000 },
      status: 'success'
    },
    {
      id: '3',
      type: 'payment',
      action: 'پرداخت انجام شد',
      description: 'پرداخت سفارش #12345 با موفقیت انجام شد',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      user: 'مریم احمدی',
      metadata: { orderId: '12345', amount: 250000 },
      status: 'success'
    },
    {
      id: '4',
      type: 'inventory',
      action: 'موجودی کم شد',
      description: 'موجودی محصول "کباب کوبیده" به زیر حد مجاز رسید',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      metadata: { productName: 'کباب کوبیده', stock: 5 },
      status: 'warning'
    },
    {
      id: '5',
      type: 'system',
      action: 'پشتیبان‌گیری انجام شد',
      description: 'پشتیبان‌گیری روزانه با موفقیت انجام شد',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      status: 'success'
    },
    {
      id: '6',
      type: 'admin',
      action: 'تنظیمات تغییر کرد',
      description: 'تنظیمات سیستم توسط ادمین تغییر کرد',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      user: 'ادمین سیستم',
      status: 'info'
    },
    {
      id: '7',
      type: 'user',
      action: 'رمز عبور تغییر کرد',
      description: 'کاربر "علی رضایی" رمز عبور خود را تغییر داد',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
      user: 'علی رضایی',
      status: 'info'
    },
    {
      id: '8',
      type: 'order',
      action: 'سفارش لغو شد',
      description: 'سفارش #12340 توسط مشتری لغو شد',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96), // 4 days ago
      user: 'سارا کریمی',
      metadata: { orderId: '12340' },
      status: 'warning'
    }
  ];

  useEffect(() => {
    loadActivities();
  }, [tenantId, filter, timeRange]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let filteredActivities = mockActivities;
      
      // Apply filter
      if (filter !== 'all') {
        filteredActivities = filteredActivities.filter(activity => activity.type === filter);
      }
      
      // Apply search
      if (searchTerm) {
        filteredActivities = filteredActivities.filter(activity => 
          activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (activity.user && activity.user.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      // Apply time range
      const now = new Date();
      const timeRanges = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000
      };
      
      const timeLimit = timeRanges[timeRange];
      filteredActivities = filteredActivities.filter(activity => 
        now.getTime() - activity.timestamp.getTime() <= timeLimit
      );
      
      setActivities(filteredActivities);
    } catch (error) {
      toast.error('خطا در بارگذاری فعالیت‌ها');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string, status: string) => {
    const iconProps = { className: `h-4 w-4 ${getStatusColor(status)}` };
    
    switch (type) {
      case 'user':
        return <User {...iconProps} />;
      case 'order':
        return <ShoppingCart {...iconProps} />;
      case 'payment':
        return <DollarSign {...iconProps} />;
      case 'inventory':
        return <Package {...iconProps} />;
      case 'system':
        return <Settings {...iconProps} />;
      case 'admin':
        return <Activity {...iconProps} />;
      default:
        return <Activity {...iconProps} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800'
    };
    
    const labels = {
      success: 'موفق',
      warning: 'هشدار',
      error: 'خطا',
      info: 'اطلاعات'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      user: 'کاربر',
      order: 'سفارش',
      payment: 'پرداخت',
      inventory: 'موجودی',
      system: 'سیستم',
      admin: 'ادمین'
    };
    
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-admin-text">جدول زمانی فعالیت‌ها</h3>
        <button
          onClick={loadActivities}
          className="btn-admin-secondary flex items-center"
        >
          <RefreshCw className="h-4 w-4 ml-1" />
          به‌روزرسانی
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-admin-border rounded-admin p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
              <input
                type="text"
                placeholder="جستجو در فعالیت‌ها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Type Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
          >
            <option value="all">همه انواع</option>
            <option value="user">کاربر</option>
            <option value="order">سفارش</option>
            <option value="payment">پرداخت</option>
            <option value="inventory">موجودی</option>
            <option value="system">سیستم</option>
            <option value="admin">ادمین</option>
          </select>

          {/* Time Range Filter */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
          >
            <option value="24h">۲۴ ساعت گذشته</option>
            <option value="7d">۷ روز گذشته</option>
            <option value="30d">۳۰ روز گذشته</option>
            <option value="90d">۹۰ روز گذشته</option>
          </select>
        </div>
      </div>

      {/* Activities List */}
      <div className="bg-white border border-admin-border rounded-admin">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-primary mx-auto mb-4"></div>
            <p className="text-admin-text">در حال بارگذاری فعالیت‌ها...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="h-12 w-12 text-admin-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-admin-text mb-2">هیچ فعالیتی یافت نشد</h3>
            <p className="text-admin-text-light">در بازه زمانی انتخاب شده فعالیتی وجود ندارد</p>
          </div>
        ) : (
          <div className="divide-y divide-admin-border">
            {activities.map((activity, index) => (
              <div key={activity.id} className="p-6 hover:bg-admin-bg transition-colors">
                <div className="flex items-start space-x-4 space-x-reverse">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      {getActivityIcon(activity.type, activity.status)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <h4 className="text-sm font-medium text-admin-text">{activity.action}</h4>
                        {getStatusBadge(activity.status)}
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {getTypeLabel(activity.type)}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-admin-text-muted">
                        <Clock className="h-3 w-3 ml-1" />
                        {formatAdminDate(activity.timestamp, { format: 'relative' })}
                      </div>
                    </div>
                    
                    <p className="text-sm text-admin-text-light mb-2">{activity.description}</p>
                    
                    {activity.user && (
                      <div className="flex items-center text-xs text-admin-text-muted">
                        <User className="h-3 w-3 ml-1" />
                        {activity.user}
                      </div>
                    )}
                    
                    {activity.metadata && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(activity.metadata).map(([key, value]) => (
                          <span key={key} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                            {key}: {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {activities.length > 0 && (
        <div className="bg-white border border-admin-border rounded-admin p-4">
          <div className="flex items-center justify-between text-sm text-admin-text-muted">
            <span>نمایش {activities.length} فعالیت از {mockActivities.length} کل فعالیت‌ها</span>
            <span>آخرین به‌روزرسانی: {formatAdminDate(new Date(), { format: 'short' })}</span>
          </div>
        </div>
      )}
    </div>
  );
}
