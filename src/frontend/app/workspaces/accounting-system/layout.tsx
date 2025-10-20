'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { WorkspaceProtection } from '../../../components/workspace/WorkspaceProtection';

interface AccountingLayoutProps {
  children: React.ReactNode;
}

export default function AccountingLayout({ children }: AccountingLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { workspaces } = useWorkspace();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Find the accounting workspace
  const accountingWorkspace = workspaces.find(w => w.id === 'accounting-system');

  // Navigation items for accounting workspace
  const navigationItems = [
    {
      name: 'داشبورد حسابداری',
      href: '/workspaces/accounting-system',
      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
      description: 'نمای کلی حسابداری',
      shortName: 'داشبورد'
    },
    {
      name: 'دفتر کل حساب‌ها',
      href: '/workspaces/accounting-system/chart-of-accounts',
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      description: 'مدیریت حساب‌های مالی',
      shortName: 'حساب‌ها'
    },
    {
      name: 'سند حسابداری',
      href: '/workspaces/accounting-system/journal-entries',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      description: 'ثبت اسناد حسابداری',
      shortName: 'اسناد'
    },
    {
      name: 'گزارش‌های مالی',
      href: '/workspaces/accounting-system/financial-statements',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      description: 'ترازنامه و سود و زیان',
      shortName: 'گزارش‌ها'
    },
    {
      name: 'تراز آزمایشی',
      href: '/workspaces/accounting-system/trial-balance',
      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      description: 'تراز آزمایشی حساب‌ها',
      shortName: 'تراز'
    },
    {
      name: 'نسبت‌های مالی',
      href: '/workspaces/accounting-system/financial-ratios',
      icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
      description: 'تحلیل نسبت‌های مالی',
      shortName: 'نسبت‌ها'
    },
    {
      name: 'گزارش‌های پیشرفته',
      href: '/workspaces/accounting-system/advanced-reports',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      description: 'گزارش‌گیری تخصصی',
      shortName: 'پیشرفته'
    }
  ];

  const isItemActive = (href: string) => {
    if (href === '/workspaces/accounting-system') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <WorkspaceProtection workspaceId="accounting-system">
      <div className="w-full bg-gray-50 dark:bg-gray-900" dir="rtl">
        <div className="flex min-h-[calc(100vh-8rem)]">
          {/* Collapsible Hover Sidebar */}
          <div 
            className={`fixed right-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 shadow-lg border-l border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out z-50 ${
              isSidebarExpanded ? 'w-80' : 'w-16'
            }`}
            onMouseEnter={() => setIsSidebarExpanded(true)}
            onMouseLeave={() => setIsSidebarExpanded(false)}
          >
            {/* Workspace Header */}
            <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${isSidebarExpanded ? 'p-6' : 'p-3'}`}>
              {isSidebarExpanded ? (
                <>
                  <div className="flex items-center space-x-4 space-x-reverse mb-4">
                    {/* Back to Workspaces */}
                    <Link
                      href="/"
                      className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      بازگشت به فضاهای کاری
                    </Link>
                  </div>
                  
                  {/* Workspace Info */}
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accountingWorkspace?.gradient || 'from-green-500 to-green-600'} flex items-center justify-center shadow-lg`}>
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        سیستم حسابداری
                      </h1>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Accounting System Workspace
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex justify-center">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accountingWorkspace?.gradient || 'from-green-500 to-green-600'} flex items-center justify-center shadow-lg`}>
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-2">
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const isActive = isItemActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center rounded-lg transition-all duration-200 ${
                        isSidebarExpanded ? 'px-4 py-3' : 'px-2 py-3 justify-center'
                      } ${
                        isActive
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title={!isSidebarExpanded ? item.name : undefined}
                    >
                      <svg
                        className={`h-5 w-5 transition-colors ${
                          isActive ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'
                        } ${isSidebarExpanded ? 'ml-3' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={item.icon}
                        />
                      </svg>
                      {isSidebarExpanded && (
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {item.description}
                          </div>
                        </div>
                      )}
                      {isActive && isSidebarExpanded && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* User Info at Bottom */}
            {isSidebarExpanded && user && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.role === 'ADMIN' ? 'مدیر سیستم' : user.role === 'MANAGER' ? 'مدیر' : 'کاربر'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className={`flex-1 transition-all duration-300 ${isSidebarExpanded ? 'mr-80' : 'mr-16'}`}>
            <div className="w-full">
              {children}
            </div>
          </div>
        </div>
      </div>
    </WorkspaceProtection>
  );
} 