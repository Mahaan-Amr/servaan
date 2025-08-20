// Workspace Constants for Servaan Business Management System
// ثوابت فضای کاری برای سیستم مدیریت کسب‌وکار سِروان

import { 
  Workspace, 
  WorkspaceId, 
  WORKSPACE_COLORS, 
  WORKSPACE_ICONS,
  WorkspaceConfig,
  DEFAULT_ROLE_ACCESS
} from '../types/workspace';

/**
 * Predefined Workspaces Data - داده‌های از پیش تعریف شده فضاهای کاری
 */
export const PREDEFINED_WORKSPACES: Workspace[] = [
  {
    id: 'inventory-management',
    title: 'مدیریت موجودی',
    titleEn: 'Inventory Management',
    description: 'مدیریت کامل موجودی، ثبت ورود و خروج کالا، کنترل انبار و اسکنر هوشمند',
    status: 'active',
    icon: WORKSPACE_ICONS['inventory-management'],
    color: WORKSPACE_COLORS['inventory-management'],
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
    href: '/workspaces/inventory-management',
    features: [
      {
        id: 'inventory-tracking',
        name: 'پیگیری موجودی',
        description: 'ثبت و پیگیری ورود و خروج کالاها',
        icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
        isAvailable: true
      },
      {
        id: 'item-management',
        name: 'مدیریت کالاها',
        description: 'تعریف و ویرایش کالاها و دسته‌بندی‌ها',
        icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
        isAvailable: true
      },
      {
        id: 'supplier-management',
        name: 'مدیریت تأمین‌کنندگان',
        description: 'مدیریت اطلاعات تأمین‌کنندگان و قیمت‌ها',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
        isAvailable: true
      },
      {
        id: 'barcode-scanner',
        name: 'اسکنر بارکد',
        description: 'اسکن بارکد و QR کد برای ثبت سریع',
        icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM15 13a3 3 0 11-6 0 3 3 0 016 0z',
        isAvailable: true
      }
    ],
    stats: {
      primary: {
        label: 'کل کالاها',
        value: '۲۳',
        icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
        color: 'text-blue-500'
      },
      secondary: {
        label: 'کالاهای کم موجود',
        value: '۳',
        icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
        color: 'text-red-500'
      },
      tertiary: {
        label: 'تراکنش‌های امروز',
        value: '۱۲',
        icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
        color: 'text-green-500'
      },
      lastUpdated: new Date().toISOString()
    },
    requiredRoles: ['ADMIN', 'MANAGER', 'STAFF'],
    isComingSoon: false,
    priority: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'business-intelligence',
    title: 'هوش تجاری',
    titleEn: 'Business Intelligence',
    description: 'تحلیل داده‌ها، گزارش‌گیری پیشرفته و داشبورد تحلیلی برای تصمیم‌گیری بهتر',
    status: 'active',
    icon: WORKSPACE_ICONS['business-intelligence'],
    color: WORKSPACE_COLORS['business-intelligence'],
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
    href: '/workspaces/business-intelligence',
    features: [
      {
        id: 'analytics-dashboard',
        name: 'داشبورد تحلیلی',
        description: 'نمایش آمار و تحلیل‌های کلیدی کسب‌وکار',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        isAvailable: true
      },
      {
        id: 'custom-reports',
        name: 'گزارش‌ساز سفارشی',
        description: 'ایجاد گزارش‌های سفارشی با فیلترهای پیشرفته',
        icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        isAvailable: true
      },
      {
        id: 'trend-analysis',
        name: 'تحلیل روند',
        description: 'بررسی روندهای فروش و موجودی در بازه‌های زمانی',
        icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
        isAvailable: true
      },
      {
        id: 'export-tools',
        name: 'ابزارهای خروجی',
        description: 'خروجی گزارش‌ها در فرمت‌های مختلف',
        icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        isAvailable: true
      }
    ],
    stats: {
      primary: {
        label: 'گزارش‌های فعال',
        value: '۸',
        icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        color: 'text-purple-500'
      },
      secondary: {
        label: 'تحلیل‌های ماهانه',
        value: '۱۵',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        color: 'text-blue-500'
      },
      tertiary: {
        label: 'خروجی‌های امروز',
        value: '۵',
        icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        color: 'text-green-500'
      },
      lastUpdated: new Date().toISOString()
    },
    requiredRoles: ['ADMIN', 'MANAGER'],
    isComingSoon: false,
    priority: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'accounting-system',
    title: 'سیستم حسابداری',
    titleEn: 'Accounting System',
    description: 'سیستم حسابداری کامل ایرانی با دفتر کل، سند حسابداری و گزارش‌های مالی',
    status: 'active',
    icon: WORKSPACE_ICONS['accounting-system'],
    color: WORKSPACE_COLORS['accounting-system'],
    gradient: 'bg-gradient-to-br from-green-500 to-green-600',
    href: '/workspaces/accounting-system',
    features: [
      {
        id: 'chart-of-accounts',
        name: 'دفتر کل حساب‌ها',
        description: 'مدیریت کامل حساب‌های مالی و دسته‌بندی‌ها',
        icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
        isAvailable: true
      },
      {
        id: 'journal-entries',
        name: 'سند حسابداری',
        description: 'ثبت و مدیریت اسناد حسابداری با اصول ایرانی',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        isAvailable: true
      },
      {
        id: 'financial-reports',
        name: 'گزارش‌های مالی',
        description: 'تراز آزمایشی، ترازنامه و سود و زیان',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        isAvailable: true
      },
      {
        id: 'tax-management',
        name: 'مدیریت مالیات',
        description: 'محاسبه و مدیریت مالیات‌ها و عوارض',
        icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
        isAvailable: true
      }
    ],
    stats: {
      primary: {
        label: 'حساب‌های فعال',
        value: '۴۲',
        icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
        color: 'text-green-500'
      },
      secondary: {
        label: 'اسناد این ماه',
        value: '۱۸۶',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        color: 'text-blue-500'
      },
      tertiary: {
        label: 'تراز امروز',
        value: '۲۴.۵ میلیون ریال',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'text-purple-500'
      },
      lastUpdated: new Date().toISOString()
    },
    requiredRoles: ['ADMIN', 'MANAGER'],
    isComingSoon: false,
    priority: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'public-relations',
    title: 'روابط عمومی',
    titleEn: 'Public Relations',
    description: 'مدیریت روابط عمومی، کمپین‌های تبلیغاتی و ارتباط با مشتریان',
    status: 'coming-soon',
    icon: WORKSPACE_ICONS['public-relations'],
    color: WORKSPACE_COLORS['public-relations'],
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-600',
    href: '/workspaces/public-relations',
    features: [
      {
        id: 'campaign-management',
        name: 'مدیریت کمپین',
        description: 'ایجاد و مدیریت کمپین‌های تبلیغاتی',
        icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
        isAvailable: false,
        comingSoon: true
      },
      {
        id: 'social-media',
        name: 'شبکه‌های اجتماعی',
        description: 'مدیریت حضور در شبکه‌های اجتماعی',
        icon: 'M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 16h14l-2-16',
        isAvailable: false,
        comingSoon: true
      },
      {
        id: 'customer-feedback',
        name: 'بازخورد مشتریان',
        description: 'جمع‌آوری و تحلیل بازخورد مشتریان',
        icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
        isAvailable: false,
        comingSoon: true
      }
    ],
    stats: {
      primary: {
        label: 'کمپین‌های فعال',
        value: 'به‌زودی',
        icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
        color: 'text-orange-500'
      },
      secondary: {
        label: 'بازخورد مشتریان',
        value: 'به‌زودی',
        icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
        color: 'text-blue-500'
      },
      lastUpdated: new Date().toISOString()
    },
    requiredRoles: ['ADMIN', 'MANAGER'],
    isComingSoon: true,
    estimatedLaunch: 'فاز 4 - تابستان 1403',
    priority: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'customer-relationship-management',
    title: 'مدیریت ارتباط با مشتری',
    titleEn: 'Customer Relationship Management',
    description: 'سیستم جامع CRM برای مدیریت مشتریان، فروش و خدمات پس از فروش',
    status: 'active',
    icon: WORKSPACE_ICONS['customer-relationship-management'],
    color: WORKSPACE_COLORS['customer-relationship-management'],
    gradient: 'bg-gradient-to-br from-pink-500 to-pink-600',
    href: '/workspaces/customer-relationship-management',
    features: [
      {
        id: 'customer-database',
        name: 'پایگاه داده مشتریان',
        description: 'مدیریت کامل اطلاعات و تاریخچه مشتریان',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
        isAvailable: true,
        comingSoon: false
      },
      {
        id: 'loyalty-program',
        name: 'برنامه وفاداری',
        description: 'مدیریت برنامه‌های وفاداری و امتیازدهی',
        icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
        isAvailable: true,
        comingSoon: false
      },
      {
        id: 'visit-tracking',
        name: 'پیگیری بازدیدها',
        description: 'ثبت و تحلیل بازدیدهای مشتریان',
        icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
        isAvailable: true,
        comingSoon: false
      },
      {
        id: 'customer-segments',
        name: 'بخش‌بندی مشتریان',
        description: 'تحلیل و دسته‌بندی خودکار مشتریان',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        isAvailable: true,
        comingSoon: false
      }
    ],
    stats: {
      primary: {
        label: 'مشتریان فعال',
        value: '0',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
        color: 'text-pink-500'
      },
      secondary: {
        label: 'بازدیدهای ماه',
        value: '0',
        icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
        color: 'text-green-500'
      },
      tertiary: {
        label: 'امتیازات فعال',
        value: '0',
        icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
        color: 'text-yellow-500'
      },
      lastUpdated: new Date().toISOString()
    },
    requiredRoles: ['ADMIN', 'MANAGER'],
    isComingSoon: false,
    priority: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sms-management',
    title: 'مدیریت پیامک',
    titleEn: 'SMS Management',
    description: 'مدیریت کامل سیستم پیامک، ارسال گروهی، پیگیری وضعیت و مدیریت اعتبار',
    status: 'active',
    icon: WORKSPACE_ICONS['sms-management'],
    color: WORKSPACE_COLORS['sms-management'],
    gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    href: '/workspaces/sms-management',
    features: [
      {
        id: 'bulk-sms',
        name: 'ارسال گروهی',
        description: 'ارسال پیامک به چندین شماره به‌طور همزمان',
        icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
        isAvailable: true
      },
      {
        id: 'invitation-management',
        name: 'مدیریت دعوت‌نامه‌ها',
        description: 'ارسال دعوت‌نامه برای کارمندان جدید',
        icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
        isAvailable: true
      },
      {
        id: 'sms-history',
        name: 'تاریخچه پیامک‌ها',
        description: 'مشاهده تاریخچه و وضعیت ارسال پیامک‌ها',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        isAvailable: true
      },
      {
        id: 'account-management',
        name: 'مدیریت اعتبار',
        description: 'پیگیری اعتبار و آمار حساب پیامک',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        isAvailable: true
      }
    ],
    stats: {
      primary: {
        label: 'پیامک‌های ارسالی',
        value: '۲۴۷',
        icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
        color: 'text-emerald-500'
      },
      secondary: {
        label: 'دعوت‌نامه‌های فعال',
        value: '۸',
        icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
        color: 'text-blue-500'
      },
      tertiary: {
        label: 'اعتبار باقی‌مانده',
        value: '۱,۲۳۴',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'text-green-500'
      },
      lastUpdated: new Date().toISOString()
    },
    requiredRoles: ['ADMIN'],
    isComingSoon: false,
    priority: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ordering-sales-system',
    title: 'سیستم سفارش‌گیری و فروش',
    titleEn: 'Ordering & Sales System',
    description: 'سیستم جامع POS، مدیریت سفارشات، پردازش پرداخت و ادغام با انبار و حسابداری',
    status: 'active',
    icon: WORKSPACE_ICONS['ordering-sales-system'],
    color: WORKSPACE_COLORS['ordering-sales-system'],
    gradient: 'bg-gradient-to-br from-amber-500 to-amber-600',
    href: '/workspaces/ordering-sales-system',
    features: [
      {
        id: 'pos-interface',
        name: 'رابط فروش',
        description: 'رابط لمسی مدرن برای پردازش سفارشات و پرداخت',
        icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9M13 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01',
        isAvailable: true
      },
      {
        id: 'order-management',
        name: 'مدیریت سفارشات',
        description: 'ثبت، پیگیری و مدیریت کامل سفارشات مشتریان',
        icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h6m-6 4h6m-7-7h.01M8 16h.01',
        isAvailable: true
      },
      {
        id: 'table-management',
        name: 'مدیریت میزها',
        description: 'مدیریت میزها، رزرو و انتقال سفارشات',
        icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
        isAvailable: true
      },
      {
        id: 'payment-processing',
        name: 'پردازش پرداخت',
        description: 'پردازش پرداخت با روش‌های مختلف و ادغام بانکی',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        isAvailable: true
      },
      {
        id: 'kitchen-display',
        name: 'نمایشگر آشپزخانه',
        description: 'نمایشگر بلادرنگ سفارشات برای آشپزخانه و بار',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        isAvailable: true
      },
      {
        id: 'sales-analytics',
        name: 'تحلیل فروش',
        description: 'گزارش‌های فروش و تحلیل عملکرد کسب‌وکار',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        isAvailable: true
      }
    ],
    stats: {
      primary: {
        label: 'سفارشات امروز',
        value: '۰',
        icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h6m-6 4h6m-7-7h.01M8 16h.01',
        color: 'text-amber-500'
      },
      secondary: {
        label: 'فروش امروز',
        value: '۰ ریال',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'text-green-500'
      },
      tertiary: {
        label: 'میزهای فعال',
        value: '۰',
        icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z',
        color: 'text-blue-500'
      },
      lastUpdated: new Date().toISOString()
    },
    requiredRoles: ['ADMIN', 'MANAGER', 'STAFF'],
    isComingSoon: false,
    priority: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

/**
 * Default Workspace Configuration - پیکربندی پیش‌فرض فضای کاری
 */
export const DEFAULT_WORKSPACE_CONFIG: WorkspaceConfig = {
  defaultWorkspaces: PREDEFINED_WORKSPACES,
  accessControlEnabled: true,
  defaultAccessLevel: 'read-only',
  roleBasedAccess: DEFAULT_ROLE_ACCESS,
  comingSoonEnabled: true,
  statsUpdateInterval: 30 // 30 minutes
};

/**
 * Workspace Navigation Items - آیتم‌های ناوبری فضای کاری
 */
export const WORKSPACE_NAVIGATION = {
  'inventory-management': [
    {
      id: 'dashboard',
      label: 'داشبورد',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
      href: '/workspaces/inventory-management',
      isActive: true
    },
    {
      id: 'items',
      label: 'مدیریت کالاها',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      href: '/workspaces/inventory-management/items'
    },
    {
      id: 'inventory',
      label: 'ورود و خروج',
      icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      href: '/workspaces/inventory-management/inventory'
    },
    {
      id: 'suppliers',
      label: 'تأمین‌کنندگان',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      href: '/workspaces/inventory-management/suppliers'
    },
    {
      id: 'scanner',
      label: 'اسکنر',
      icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM15 13a3 3 0 11-6 0 3 3 0 016 0z',
      href: '/workspaces/inventory-management/scanner'
    }
  ],
  'business-intelligence': [
    {
      id: 'dashboard',
      label: 'داشبورد',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
      href: '/workspaces/business-intelligence',
      isActive: true
    },
    {
      id: 'analytics',
      label: 'تحلیل‌ها',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      href: '/workspaces/business-intelligence/analytics'
    },
    {
      id: 'reports',
      label: 'گزارش‌ها',
      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      href: '/workspaces/business-intelligence/reports'
    },
    {
      id: 'custom-reports',
      label: 'گزارش‌ساز',
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      href: '/workspaces/business-intelligence/custom-reports'
    }
  ],
  'accounting-system': [
    {
      id: 'dashboard',
      label: 'داشبورد',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
      href: '/workspaces/accounting-system',
      isActive: true
    },
    {
      id: 'chart-of-accounts',
      label: 'دفتر کل',
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      href: '/workspaces/accounting-system/chart-of-accounts'
    },
    {
      id: 'journal-entries',
      label: 'اسناد حسابداری',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      href: '/workspaces/accounting-system/journal-entries'
    },
    {
      id: 'financial-reports',
      label: 'گزارش‌های مالی',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      href: '/workspaces/accounting-system/financial-reports'
    }
  ],
  'customer-relationship-management': [
    {
      id: 'dashboard',
      label: 'داشبورد',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
      href: '/workspaces/customer-relationship-management',
      isActive: true
    },
    {
      id: 'customers',
      label: 'مدیریت مشتریان',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      href: '/workspaces/customer-relationship-management/customers'
    },
    {
      id: 'loyalty',
      label: 'برنامه وفاداری',
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      href: '/workspaces/customer-relationship-management/loyalty'
    },
    {
      id: 'visits',
      label: 'پیگیری بازدیدها',
      icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      href: '/workspaces/customer-relationship-management/visits'
    },
    {
      id: 'segments',
      label: 'بخش‌بندی مشتریان',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      href: '/workspaces/customer-relationship-management/segments'
    },
    {
      id: 'analytics',
      label: 'تحلیل‌ها',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      href: '/workspaces/customer-relationship-management/analytics'
    }
  ],
  'ordering-sales-system': [
    {
      id: 'dashboard',
      label: 'داشبورد فروش',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
      href: '/workspaces/ordering-sales-system',
      isActive: true
    },
    {
      id: 'pos',
      label: 'سیستم فروش',
      icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9M13 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01',
      href: '/workspaces/ordering-sales-system/pos'
    },
    {
      id: 'orders',
      label: 'مدیریت سفارشات',
      icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h6m-6 4h6m-7-7h.01M8 16h.01',
      href: '/workspaces/ordering-sales-system/orders'
    },
    {
      id: 'tables',
      label: 'مدیریت میزها',
      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
      href: '/workspaces/ordering-sales-system/tables'
    },
    {
      id: 'kitchen',
      label: 'نمایشگر آشپزخانه',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      href: '/workspaces/ordering-sales-system/kitchen'
    },
    {
      id: 'analytics',
      label: 'تحلیل فروش',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      href: '/workspaces/ordering-sales-system/analytics'
    },
    {
      id: 'menu',
      label: 'مدیریت منو',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      href: '/workspaces/ordering-sales-system/menu'
    }
  ]
};

/**
 * Get workspace by ID - دریافت فضای کاری با شناسه
 */
export const getWorkspaceById = (id: WorkspaceId): Workspace | undefined => {
  return PREDEFINED_WORKSPACES.find(workspace => workspace.id === id);
};

/**
 * Get active workspaces - دریافت فضاهای کاری فعال
 */
export const getActiveWorkspaces = (): Workspace[] => {
  return PREDEFINED_WORKSPACES.filter(workspace => workspace.status === 'active');
};

/**
 * Get coming soon workspaces - دریافت فضاهای کاری به‌زودی
 */
export const getComingSoonWorkspaces = (): Workspace[] => {
  return PREDEFINED_WORKSPACES.filter(workspace => workspace.status === 'coming-soon');
};

/**
 * Get workspaces by user role - دریافت فضاهای کاری بر اساس نقش کاربر
 */
export const getWorkspacesByRole = (userRole: string): Workspace[] => {
  return PREDEFINED_WORKSPACES.filter(workspace => 
    workspace.requiredRoles.includes(userRole as 'ADMIN' | 'MANAGER' | 'STAFF')
  );
}; 