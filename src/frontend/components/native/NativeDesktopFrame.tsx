'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Box, CircleGauge, Home, Settings2, TriangleAlert } from 'lucide-react';
import { useEffect } from 'react';
import { rememberNativeOperationalRoute } from '../../services/nativeDeviceService';

const entries = [
  { href: '/native', label: 'خانه', icon: Home, panel: null },
  { href: '/native?panel=sales', label: 'فروش', icon: CircleGauge, panel: 'sales' },
  { href: '/native?panel=inventory', label: 'انبار', icon: Box, panel: 'inventory' },
  { href: '/native?panel=sync', label: 'موارد', icon: TriangleAlert, panel: 'sync' },
  { href: '/native?panel=settings', label: 'تنظیمات', icon: Settings2, panel: 'settings' }
];

export function NativeDesktopFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activePanel = searchParams.get('panel');

  useEffect(() => {
    if (pathname === '/workspaces' || pathname?.startsWith('/workspaces/')) {
      rememberNativeOperationalRoute(pathname);
    }
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-white" dir="rtl">
      <aside className="fixed inset-y-0 right-0 z-50 hidden w-24 border-l border-black/5 bg-white/90 px-3 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90 lg:block">
        <button
          type="button"
          onClick={() => router.push('/native')}
          className="mb-6 flex w-full items-center justify-center rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-900"
        >
          S
        </button>
        <nav className="space-y-2">
          {entries.map(({ href, label, icon: Icon, panel }) => {
            const active =
              pathname === '/native' &&
              (panel === null ? !activePanel : activePanel === panel);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-xs transition ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-h-screen lg:pr-24">{children}</main>
    </div>
  );
}
