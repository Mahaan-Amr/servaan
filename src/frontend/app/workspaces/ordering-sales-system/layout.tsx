'use client';

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { WorkspaceProtection } from '@/components/workspace/WorkspaceProtection';

interface OrderingLayoutProps {
  children: ReactNode;
}

export default function OrderingLayout({ children }: OrderingLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { workspaces } = useWorkspace();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Find the ordering workspace
  const orderingWorkspace = workspaces.find(w => w.id === 'ordering-sales-system');

  // Navigation items for ordering workspace
  const navigationItems = [
    {
      name: 'داشبورد سفارشات',
      href: '/workspaces/ordering-sales-system',
      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
      description: 'نمای کلی سفارشات',
      shortName: 'داشبورد'
    },
    {
      name: 'رابط فروش (POS)',
      href: '/workspaces/ordering-sales-system/pos',
      icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9M13 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01',
      description: 'رابط لمسی فروش',
      shortName: 'POS'
    },
    {
      name: 'مدیریت سفارشات',
      href: '/workspaces/ordering-sales-system/orders',
      icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h6m-6 4h6m-7-7h.01M8 16h.01',
      description: 'مدیریت و پیگیری سفارشات',
      shortName: 'سفارشات'
    },
    {
      name: 'مدیریت میزها',
      href: '/workspaces/ordering-sales-system/tables',
      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
      description: 'مدیریت میزها و رزرو',
      shortName: 'میزها'
    },
    {
      name: 'نمایشگر آشپزخانه',
      href: '/workspaces/ordering-sales-system/kitchen',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      description: 'نمایشگر آشپزخانه',
      shortName: 'آشپزخانه'
    },
    {
      name: 'مدیریت منو',
      href: '/workspaces/ordering-sales-system/menu',
      icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      description: 'مدیریت دسته‌ها و آیتم‌ها',
      shortName: 'منو'
    },
    {
      name: 'گزارشات و تحلیل',
      href: '/workspaces/ordering-sales-system/analytics',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      description: 'تحلیل فروش و عملکرد',
      shortName: 'تحلیل'
    }
  ];

  const isItemActive = (href: string) => {
    if (href === '/workspaces/ordering-sales-system') {
      return pathname === href;
    }
    
    // Check for exact match first
    if (pathname === href) {
      return true;
    }
    
    // For nested paths, ensure we don't match parent paths when child paths are active
    // Sort all navigation items by path length (longest first) to prioritize more specific paths
    const sortedNavItems = [...navigationItems].sort((a, b) => b.href.length - a.href.length);
    
    // Check if any longer path matches the current pathname
    const longerPathMatch = sortedNavItems.find(item => 
      item.href.length > href.length && 
      item.href !== href &&
      pathname.startsWith(item.href)
    );
    
    // If a longer path matches, don't activate this shorter path
    if (longerPathMatch) {
      return false;
    }
    
    // Check if current path starts with this href and is a direct child
    if (pathname.startsWith(href + '/')) {
      const remainingPath = pathname.slice(href.length + 1);
      // Only match if it's a direct child (no additional nesting)
      return !remainingPath.includes('/');
    }
    
    return false;
  };

  return (
    <WorkspaceProtection workspaceId="ordering-sales-system">
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
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${orderingWorkspace?.gradient || 'from-amber-500 to-amber-600'} flex items-center justify-center shadow-lg`}>
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
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9M13 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                        />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        سیستم سفارش‌گیری
                      </h1>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ordering & Sales Workspace
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex justify-center">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${orderingWorkspace?.gradient || 'from-amber-500 to-amber-600'} flex items-center justify-center shadow-lg`}>
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
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9M13 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
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
                          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title={!isSidebarExpanded ? item.name : undefined}
                    >
                      <svg
                        className={`h-5 w-5 transition-colors ${
                          isActive ? 'text-amber-500' : 'text-gray-400 group-hover:text-gray-500'
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
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
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
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
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
            {children}
          </div>
        </div>
      </div>
    </WorkspaceProtection>
  );
} 