'use client';

import React from 'react';
import { WorkspaceShell, WorkspaceNavItem } from '@/components/layout/WorkspaceShell';

interface OrderingLayoutProps {
  children: React.ReactNode;
}

const navigationItems: WorkspaceNavItem[] = [
  {
    name: 'داشبورد سفارشات',
    href: '/workspaces/ordering-sales-system',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    description: 'نمای کلی سفارشات',
  },
  {
    name: 'رابط فروش (POS)',
    href: '/workspaces/ordering-sales-system/pos',
    icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9M13 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01',
    description: 'رابط لمسی فروش',
  },
  {
    name: 'مدیریت سفارشات',
    href: '/workspaces/ordering-sales-system/orders',
    icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h6m-6 4h6m-7-7h.01M8 16h.01',
    description: 'پیگیری سفارش‌ها',
  },
  {
    name: 'مدیریت میزها',
    href: '/workspaces/ordering-sales-system/tables',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    description: 'مدیریت میزها و رزرو',
  },
  {
    name: 'نمایشگر آشپزخانه',
    href: '/workspaces/ordering-sales-system/kitchen',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    description: 'Kitchen Display',
  },
  {
    name: 'مدیریت منو',
    href: '/workspaces/ordering-sales-system/menu',
    icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    description: 'دسته‌ها و آیتم‌ها',
  },
  {
    name: 'مدیریت پرداخت‌ها',
    href: '/workspaces/ordering-sales-system/payments',
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    description: 'تراکنش‌ها و پرداخت',
  },
  {
    name: 'گزارشات و تحلیل',
    href: '/workspaces/ordering-sales-system/analytics',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    description: 'تحلیل فروش و عملکرد',
  },
  {
    name: 'تنظیمات',
    href: '/workspaces/ordering-sales-system/settings',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    description: 'تنظیمات سیستم سفارشات',
  },
];

export default function OrderingLayout({ children }: OrderingLayoutProps) {
  return (
    <WorkspaceShell
      workspaceId="ordering-sales-system"
      workspaceName="سیستم سفارش‌گیری"
      workspaceDescription="Ordering and Sales Workspace"
      fallbackGradient="from-amber-500 to-amber-600"
      accent="amber"
      navigationItems={navigationItems}
    >
      {children}
    </WorkspaceShell>
  );
}
