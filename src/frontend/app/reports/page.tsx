'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import Link from 'next/link';
import { FaChartLine, FaBoxes, FaUsers, FaFileInvoiceDollar, FaClipboardList } from 'react-icons/fa';
import ProtectedRoute from '../../components/ProtectedRoute';
import { LowStockAlerts } from '../../components/inventory/LowStockAlerts';

// Card component for report links
interface ReportCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, description, href, icon, color }) => (
  <Link 
    href={href}
    className={`block p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-r-4 ${color}`}
  >
    <div className="flex items-start">
      <div className="mr-4 text-3xl">{icon}</div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  </Link>
);

export default function ReportsPage() {
  const { user } = useAuth();
  const { tenant, hasFeature } = useTenant();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  if (!user) {
    return null;
  }

  // Reports are categorized by type and use correct paths
  const reports = [
    {
      title: 'گزارش موجودی',
      description: 'گزارش جامع از وضعیت موجودی انبار به تفکیک کالا',
      href: '/workspaces/inventory-management/inventory/reports',
      icon: <FaBoxes className="text-blue-500 dark:text-blue-400" />,
      color: 'border-blue-500',
      access: hasFeature('hasInventoryManagement'),
      feature: 'hasInventoryManagement'
    },
    {
      title: 'گزارش تراکنش‌ها',
      description: 'گزارش ورود و خروج کالاها به تفکیک تاریخ و کاربر',
      href: '/workspaces/inventory-management/inventory/transactions',
      icon: <FaClipboardList className="text-green-500 dark:text-green-400" />,
      color: 'border-green-500',
      access: hasFeature('hasInventoryManagement'),
      feature: 'hasInventoryManagement'
    },
    {
      title: 'گزارش کاربران',
      description: 'مشاهده فعالیت‌های کاربران در سیستم',
      href: '/reports/users',
      icon: <FaUsers className="text-purple-500 dark:text-purple-400" />,
      color: 'border-purple-500',
      access: isAdmin && hasFeature('hasReporting'),
      feature: 'hasReporting'
    },
    {
      title: 'گزارش‌های حسابداری',
      description: 'گزارش‌های مالی و حسابداری پیشرفته',
      href: '/workspaces/accounting-system/advanced-reports',
      icon: <FaFileInvoiceDollar className="text-yellow-500 dark:text-yellow-400" />,
      color: 'border-yellow-500',
      access: isAdmin && hasFeature('hasAccountingSystem'),
      feature: 'hasAccountingSystem'
    },
    {
      title: 'تحلیل‌های هوش تجاری',
      description: 'نمودارها و آمار کلی از عملکرد سیستم',
      href: '/workspaces/business-intelligence/analytics',
      icon: <FaChartLine className="text-red-500 dark:text-red-400" />,
      color: 'border-red-500',
      access: hasFeature('hasAnalyticsBI'),
      feature: 'hasAnalyticsBI'
    },
    {
      title: 'گزارش‌های سفارشی',
      description: 'ایجاد و مدیریت گزارش‌های سفارشی',
      href: '/workspaces/business-intelligence/custom-reports',
      icon: <FaChartLine className="text-indigo-500 dark:text-indigo-400" />,
      color: 'border-indigo-500',
      access: isAdmin && hasFeature('hasAdvancedReporting'),
      feature: 'hasAdvancedReporting'
    }
  ];

  // Filter reports based on user access
  const accessibleReports = reports.filter(report => report.access);

  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            مرکز گزارش‌گیری {tenant?.displayName || ''}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            دسترسی به گزارش‌های مختلف سیستم و تحلیل‌های آماری
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaBoxes className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">گزارش‌های موجودی</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  فعال
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaClipboardList className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">گزارش‌های تراکنش</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  آماده
                </p>
              </div>
            </div>
          </div>

          {isAdmin && (
            <>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaUsers className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">گزارش‌های کاربری</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      دسترسی
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaFileInvoiceDollar className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">گزارش‌های مالی</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      محدود
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {accessibleReports.map((report, index) => (
            <ReportCard 
              key={index}
              title={report.title}
              description={report.description}
              href={report.href}
              icon={report.icon}
              color={report.color}
            />
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">هشدارها و اطلاعات مهم</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <LowStockAlerts limit={3} />
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                راهنمای گزارش‌گیری
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  برای گزارش موجودی، از فیلترهای تاریخ و کالا استفاده کنید
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  می‌توانید گزارش‌ها را به صورت Excel و PDF دریافت کنید
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  برای مشاهده نمودارها از بخش هوش تجاری استفاده کنید
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  گزارش‌های سفارشی فقط برای مدیران قابل دسترسی است
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Workspace Shortcuts */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            دسترسی سریع به فضاهای کاری
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/workspaces/inventory-management"
              className="flex items-center p-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <FaBoxes className="h-5 w-5 text-blue-500 mr-3" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                مدیریت انبار
              </span>
            </Link>
            
            {isAdmin && (
              <>
                <Link
                  href="/workspaces/accounting-system"
                  className="flex items-center p-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <FaFileInvoiceDollar className="h-5 w-5 text-yellow-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    سیستم حسابداری
                  </span>
                </Link>
                
                <Link
                  href="/workspaces/business-intelligence"
                  className="flex items-center p-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <FaChartLine className="h-5 w-5 text-red-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    هوش تجاری
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 