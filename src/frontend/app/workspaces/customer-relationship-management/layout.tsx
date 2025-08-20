'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { WorkspaceProtection } from '../../../components/workspace/WorkspaceProtection';

interface CrmLayoutProps {
  children: React.ReactNode;
}

export default function CrmLayout({ children }: CrmLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { workspaces } = useWorkspace();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Find the CRM workspace
  const crmWorkspace = workspaces.find(w => w.id === 'customer-relationship-management');

  // Navigation items for CRM workspace
  const navigationItems = [
    {
      name: 'داشبورد مشتریان',
      href: '/workspaces/customer-relationship-management',
      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
      description: 'نمای کلی مشتریان',
      shortName: 'داشبورد'
    },
    {
      name: 'مدیریت مشتریان',
      href: '/workspaces/customer-relationship-management/customers',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      description: 'فهرست و مدیریت مشتریان',
      shortName: 'مشتریان'
    },
    {
      name: 'برنامه وفاداری',
      href: '/workspaces/customer-relationship-management/loyalty',
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      description: 'امتیازات و پاداش‌ها',
      shortName: 'وفاداری'
    },
    {
      name: 'بازدیدهای مشتریان',
      href: '/workspaces/customer-relationship-management/visits',
      icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
      description: 'ثبت و پیگیری بازدیدها',
      shortName: 'بازدیدها'
    },
    {
      name: 'بخش‌بندی مشتریان',
      href: '/workspaces/customer-relationship-management/segments',
      icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
      description: 'تحلیل و دسته‌بندی',
      shortName: 'بخش‌بندی'
    },
    {
      name: 'تحلیل‌های CRM',
      href: '/workspaces/customer-relationship-management/analytics',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      description: 'گزارش‌ها و آمارها',
      shortName: 'تحلیل‌ها'
    }
  ];

  const isItemActive = (href: string) => {
    if (href === '/workspaces/customer-relationship-management') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <WorkspaceProtection workspaceId="customer-relationship-management">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
        <div className="flex">
          {/* Collapsible Hover Sidebar */}
          <div 
            className={`fixed right-0 top-0 h-full bg-white dark:bg-gray-800 shadow-lg border-l border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out z-50 ${
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
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${crmWorkspace?.gradient || 'from-pink-500 to-pink-600'} flex items-center justify-center shadow-lg`}>
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
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        مدیریت ارتباط مشتری
                      </h1>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Customer Relationship Management
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex justify-center">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${crmWorkspace?.gradient || 'from-pink-500 to-pink-600'} flex items-center justify-center shadow-lg`}>
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
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
                          ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title={!isSidebarExpanded ? item.name : undefined}
                    >
                      <svg
                        className={`h-5 w-5 transition-colors ${
                          isActive ? 'text-pink-500' : 'text-gray-400 group-hover:text-gray-500'
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
                        <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* User Info */}
            <div className={`p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${
              !isSidebarExpanded ? 'p-2' : ''
            }`}>
              {isSidebarExpanded ? (
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user?.name || 'کاربر'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email || ''}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className={`flex-1 transition-all duration-300 ease-in-out ${
            isSidebarExpanded ? 'mr-80' : 'mr-16'
          }`}>
            <main className="p-6 max-w-7xl mx-auto">
              {children}
            </main>
          </div>
        </div>
      </div>
    </WorkspaceProtection>
  );
} 