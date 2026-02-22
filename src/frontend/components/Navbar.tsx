'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import NotificationBell from './NotificationBell';

export function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();
  const { user, logout, isManager } = useAuth();
  const { tenant, hasFeature } = useTenant();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const isDark =
      localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', (!darkMode).toString());
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800/95">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center">
          <Link href="/" className="flex items-center">
            {tenant?.logo ? (
              <Image
                src={tenant.logo}
                alt={tenant.name || 'Logo'}
                width={32}
                height={32}
                className="object-contain"
              />
            ) : (
              <svg className="h-8 w-8 text-primary-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            )}
            <span className="mr-2 truncate text-base font-bold text-gray-900 dark:text-white sm:text-xl">
              {tenant?.displayName || 'سِروان'}
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-4 rtl:space-x-reverse">
          {user ? (
            <>
              <Link href="/" className={`nav-link ${pathname === '/' ? 'nav-link-active' : ''}`}>
                داشبورد
              </Link>
              {hasFeature('hasInventoryManagement') && (
                <Link
                  href="/workspaces/inventory-management"
                  className={`nav-link ${pathname.startsWith('/workspaces/inventory-management') ? 'nav-link-active' : ''}`}
                >
                  مدیریت موجودی
                </Link>
              )}
              {hasFeature('hasAnalyticsBI') && (
                <Link
                  href="/workspaces/business-intelligence"
                  className={`nav-link ${pathname.startsWith('/workspaces/business-intelligence') ? 'nav-link-active' : ''}`}
                >
                  هوش تجاری
                </Link>
              )}
              {hasFeature('hasAccountingSystem') && (
                <Link
                  href="/workspaces/accounting-system"
                  className={`nav-link ${pathname.startsWith('/workspaces/accounting-system') ? 'nav-link-active' : ''}`}
                >
                  سیستم حسابداری
                </Link>
              )}
              {isManager() && (
                <Link
                  href="/users/management"
                  className={`nav-link ${pathname === '/users/management' ? 'nav-link-active' : ''}`}
                >
                  مدیریت کاربران
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/features" className={`nav-link ${pathname === '/features' ? 'nav-link-active' : ''}`}>
                ویژگی‌ها
              </Link>
              <Link href="/pricing" className={`nav-link ${pathname === '/pricing' ? 'nav-link-active' : ''}`}>
                قیمت‌گذاری
              </Link>
              <Link href="/contact" className={`nav-link ${pathname === '/contact' ? 'nav-link-active' : ''}`}>
                تماس با ما
              </Link>
              <Link href="/about" className={`nav-link ${pathname === '/about' ? 'nav-link-active' : ''}`}>
                درباره ما
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={toggleDarkMode}
            className="rounded-lg p-2 text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300 dark:text-gray-400 dark:hover:text-white"
          >
            {darkMode ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          {user && <NotificationBell />}

          {user ? (
            <div className="relative mr-1 sm:mr-2">
              <button
                onClick={() => setIsUserMenuOpen((value) => !value)}
                className="flex items-center rounded-lg p-1 text-gray-700 hover:text-primary-500 focus:outline-none dark:text-gray-200"
              >
                <svg className="h-6 w-6 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="hidden sm:block">{user.name}</span>
                <svg className="mr-1 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="absolute left-0 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-800">
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      پروفایل
                    </Link>
                    {isManager() && (
                      <Link
                        href="/users/management"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        مدیریت کاربران
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="block w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      خروج
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden gap-2 sm:flex">
              <Link href="/login" className="btn btn-primary">
                ورود
              </Link>
              <Link href="/register" className="btn btn-outline">
                ثبت‌نام
              </Link>
            </div>
          )}

          <div className="md:hidden">
            <button
              type="button"
              title={isMenuOpen ? 'بستن منو' : 'بازکردن منو'}
              onClick={() => setIsMenuOpen((value) => !value)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300 dark:text-gray-400 dark:hover:text-white"
            >
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-gray-200 bg-white px-3 pb-4 md:hidden dark:border-gray-700 dark:bg-gray-800">
          <div className="space-y-1 pt-3">
            {user ? (
              <>
                <Link href="/" className={`block rounded-md px-3 py-2 ${pathname === '/' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'}`}>
                  داشبورد
                </Link>
                {hasFeature('hasInventoryManagement') && (
                  <Link href="/workspaces/inventory-management" className={`block rounded-md px-3 py-2 ${pathname.startsWith('/workspaces/inventory-management') ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'}`}>
                    مدیریت موجودی
                  </Link>
                )}
                {hasFeature('hasAnalyticsBI') && (
                  <Link href="/workspaces/business-intelligence" className={`block rounded-md px-3 py-2 ${pathname.startsWith('/workspaces/business-intelligence') ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'}`}>
                    هوش تجاری
                  </Link>
                )}
                {hasFeature('hasAccountingSystem') && (
                  <Link href="/workspaces/accounting-system" className={`block rounded-md px-3 py-2 ${pathname.startsWith('/workspaces/accounting-system') ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'}`}>
                    سیستم حسابداری
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/features" className="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
                  ویژگی‌ها
                </Link>
                <Link href="/pricing" className="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
                  قیمت‌گذاری
                </Link>
                <Link href="/contact" className="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
                  تماس با ما
                </Link>
                <Link href="/about" className="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
                  درباره ما
                </Link>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link href="/login" className="btn btn-primary">
                    ورود
                  </Link>
                  <Link href="/register" className="btn btn-outline">
                    ثبت‌نام
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
