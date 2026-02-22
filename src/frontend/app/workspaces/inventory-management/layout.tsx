'use client';

import React from 'react';
import { WorkspaceShell, WorkspaceNavItem } from '@/components/layout/WorkspaceShell';

interface InventoryLayoutProps {
  children: React.ReactNode;
}

const navigationItems: WorkspaceNavItem[] = [
  {
    name: 'داشبورد موجودی',
    href: '/workspaces/inventory-management',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    description: 'نمای کلی موجودی',
  },
  {
    name: 'مدیریت کالاها',
    href: '/workspaces/inventory-management/items',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    description: 'افزودن و ویرایش کالاها',
  },
  {
    name: 'تراکنش‌های موجودی',
    href: '/workspaces/inventory-management/inventory',
    icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
    description: 'ورود و خروج کالا',
  },
  {
    name: 'لیست خرید انبار',
    href: '/workspaces/inventory-management/inventory/purchase-list',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    description: 'خرید اقلام مورد نیاز',
  },
  {
    name: 'تأمین‌کنندگان',
    href: '/workspaces/inventory-management/suppliers',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    description: 'مدیریت تأمین‌کنندگان',
  },
  {
    name: 'اسکنر بارکد',
    href: '/workspaces/inventory-management/scanner',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.5m-9 0h1.5m-9 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0V8a5 5 0 10-10 0v5.5',
    description: 'اسکن کالاها',
  },
  {
    name: 'گزارش‌های موجودی',
    href: '/workspaces/inventory-management/inventory/reports',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    description: 'گزارش‌گیری و آمار',
  },
  {
    name: 'انبارگردانی دوره‌ای',
    href: '/workspaces/inventory-management/audit',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    description: 'انبارگردانی و شمارش دوره‌ای',
  },
  {
    name: 'تنظیمات',
    href: '/workspaces/inventory-management/settings',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    description: 'تنظیمات سیستم موجودی',
  },
];

export default function InventoryLayout({ children }: InventoryLayoutProps) {
  return (
    <WorkspaceShell
      workspaceId="inventory-management"
      workspaceName="مدیریت موجودی"
      workspaceDescription="Inventory Management Workspace"
      fallbackGradient="from-blue-500 to-blue-600"
      accent="blue"
      navigationItems={navigationItems}
    >
      {children}
    </WorkspaceShell>
  );
}
