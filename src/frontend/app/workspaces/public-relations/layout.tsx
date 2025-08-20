'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { WorkspaceProtection } from '../../../components/workspace/WorkspaceProtection';

interface PublicRelationsLayoutProps {
  children: React.ReactNode;
}

export default function PublicRelationsLayout({ children }: PublicRelationsLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { workspaces } = useWorkspace();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Find the public relations workspace
  const prWorkspace = workspaces.find(w => w.id === 'public-relations');

  // Navigation items for public relations workspace
  const navigationItems = [
    {
      name: 'داشبورد روابط عمومی',
      href: '/workspaces/public-relations',
      icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
      description: 'نمای کلی روابط عمومی',
      shortName: 'داشبورد'
    }
  ];

  const isItemActive = (href: string) => {
    if (href === '/workspaces/public-relations') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <WorkspaceProtection workspaceId="public-relations">
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
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${prWorkspace?.gradient || 'from-purple-500 to-purple-600'} flex items-center justify-center shadow-lg`}>
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
                          d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        روابط عمومی
                      </h1>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Public Relations Workspace
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex justify-center">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${prWorkspace?.gradient || 'from-purple-500 to-purple-600'} flex items-center justify-center shadow-lg`}>
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
                        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
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
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title={!isSidebarExpanded ? item.name : undefined}
                    >
                      <svg
                        className={`h-5 w-5 transition-colors ${
                          isActive ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-500'
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
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
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
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
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
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
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