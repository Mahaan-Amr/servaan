'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { WorkspaceProtection } from '@/components/workspace/WorkspaceProtection';
import type { WorkspaceId } from '@/types/workspace';

export interface WorkspaceNavItem {
  name: string;
  href: string;
  icon: string;
  description?: string;
}

interface WorkspaceShellProps {
  workspaceId: WorkspaceId;
  workspaceName: string;
  workspaceDescription: string;
  fallbackGradient: string;
  accent: 'blue' | 'amber' | 'purple' | 'green';
  navigationItems: WorkspaceNavItem[];
  panelContent?: React.ReactNode;
  children: React.ReactNode;
}

const accentStyles = {
  blue: {
    active: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    activeIcon: 'text-blue-500',
    activeDot: 'bg-blue-500',
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-700',
    userBadge: 'bg-blue-500',
  },
  amber: {
    active: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
    activeIcon: 'text-amber-500',
    activeDot: 'bg-amber-500',
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-700',
    userBadge: 'bg-amber-500',
  },
  purple: {
    active: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
    activeIcon: 'text-purple-500',
    activeDot: 'bg-purple-500',
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-700',
    userBadge: 'bg-purple-500',
  },
  green: {
    active: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    activeIcon: 'text-green-500',
    activeDot: 'bg-green-500',
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-700',
    userBadge: 'bg-green-500',
  },
};
const DESKTOP_SIDEBAR_STORAGE_KEY = 'servaan.workspaceShell.desktopOpen';

function isNavItemActive(pathname: string, href: string, navItems: WorkspaceNavItem[]) {
  if (href === pathname) {
    return true;
  }

  if (!pathname.startsWith(`${href}/`)) {
    return false;
  }

  const hasLongerMatch = navItems.some(
    (item) => item.href.length > href.length && pathname.startsWith(item.href)
  );

  return !hasLongerMatch;
}

export function WorkspaceShell({
  workspaceId,
  workspaceName,
  workspaceDescription,
  fallbackGradient,
  accent,
  navigationItems,
  panelContent,
  children,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { workspaces } = useWorkspace();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(false);
  const style = accentStyles[accent];
  const sidebarId = `workspace-sidebar-${workspaceId}`;

  const workspace = useMemo(
    () => workspaces.find((item) => item.id === workspaceId),
    [workspaces, workspaceId]
  );

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(DESKTOP_SIDEBAR_STORAGE_KEY);
      if (stored === 'true') {
        setIsDesktopOpen(true);
      } else if (stored === 'false') {
        setIsDesktopOpen(false);
      } else {
        setIsDesktopOpen(false);
      }
    } catch {
      setIsDesktopOpen(false);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(DESKTOP_SIDEBAR_STORAGE_KEY, String(isDesktopOpen));
    } catch {
      // Ignore storage errors and keep runtime behavior.
    }
  }, [isDesktopOpen]);

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (isMobileOpen) {
        setIsMobileOpen(false);
      }

      if (isDesktopOpen) {
        setIsDesktopOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDesktopOpen, isMobileOpen]);

  return (
    <WorkspaceProtection workspaceId={workspaceId}>
      <div className="workspace-shell" dir="rtl">
        <button
          type="button"
          aria-controls={sidebarId}
          aria-expanded={isMobileOpen}
          aria-label={isMobileOpen ? 'بستن منو' : 'بازکردن منو'}
          onClick={() => setIsMobileOpen((value) => !value)}
          className="workspace-shell__mobile-trigger"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>


        <button
          type="button"
          aria-label={isDesktopOpen ? 'بستن پنل کناری' : 'باز کردن پنل کناری'}
          aria-controls={sidebarId}
          aria-expanded={isDesktopOpen}
          onClick={() => setIsDesktopOpen((value) => !value)}
          className={`hidden md:flex fixed top-20 z-50 h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-lg transition-[right,colors] duration-200 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 ${
            isDesktopOpen ? 'right-[20.75rem]' : 'right-3'
          }`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isDesktopOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        {isMobileOpen && <div className="workspace-shell__overlay" onClick={() => setIsMobileOpen(false)} />}
        {isDesktopOpen && (
          <div
            className="workspace-shell__desktop-overlay"
            aria-hidden="true"
            onClick={() => setIsDesktopOpen(false)}
          />
        )}

        <aside
          id={sidebarId}
          className={`workspace-shell__sidebar ${
            isMobileOpen ? 'workspace-shell__sidebar--open-mobile' : ''
          } ${isDesktopOpen ? 'workspace-shell__sidebar--open-desktop' : ''}`}
        >
          <div className="workspace-shell__sidebar-header">
            <Link href="/" className="workspace-shell__back-link">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              بازگشت به فضاهای کاری
            </Link>

            <div className="workspace-shell__workspace-row">
              <div
                className={`workspace-shell__workspace-icon bg-gradient-to-br ${
                  workspace?.gradient || fallbackGradient
                }`}
              >
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="workspace-shell__workspace-title">{workspaceName}</h1>
                <p className="workspace-shell__workspace-subtitle">{workspaceDescription}</p>
              </div>
            </div>

            {panelContent}
          </div>

          <nav className="workspace-shell__nav">
            {navigationItems.map((item) => {
              const isActive = isNavItemActive(pathname, item.href, navigationItems);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`workspace-shell__nav-item ${
                    isActive ? style.active : `text-gray-600 dark:text-gray-300 ${style.hover}`
                  }`}
                >
                  <svg
                    className={`h-5 w-5 shrink-0 ${isActive ? style.activeIcon : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <div className="workspace-shell__nav-title">{item.name}</div>
                    {item.description ? <div className="workspace-shell__nav-subtitle">{item.description}</div> : null}
                  </div>
                  {isActive ? <span className={`h-2 w-2 rounded-full ${style.activeDot}`} /> : null}
                </Link>
              );
            })}
          </nav>

          {user ? (
            <div className="workspace-shell__user-row">
              <div className={`workspace-shell__user-badge ${style.userBadge}`}>{user.name.charAt(0)}</div>
              <div className="min-w-0">
                <p className="workspace-shell__user-name">{user.name}</p>
                <p className="workspace-shell__user-role">
                  {user.role === 'ADMIN' ? 'مدیر سیستم' : user.role === 'MANAGER' ? 'مدیر' : 'کاربر'}
                </p>
              </div>
            </div>
          ) : null}
        </aside>

        <section className="workspace-shell__content">
          {children}
        </section>
      </div>
    </WorkspaceProtection>
  );
}




