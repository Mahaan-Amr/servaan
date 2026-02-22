'use client';

import React from 'react';
import { WorkspaceShell, WorkspaceNavItem } from '@/components/layout/WorkspaceShell';

interface CrmLayoutProps {
  children: React.ReactNode;
}

const navigationItems: WorkspaceNavItem[] = [
  {
    name: 'داشبورد CRM',
    href: '/workspaces/customer-relationship-management',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    description: 'نمای کلی ارتباط با مشتریان',
  },
  {
    name: 'مشتریان',
    href: '/workspaces/customer-relationship-management/customers',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    description: 'مدیریت اطلاعات مشتریان',
  },
  {
    name: 'بازدیدها',
    href: '/workspaces/customer-relationship-management/visits',
    icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
    description: 'ثبت و پیگیری بازدید مشتریان',
  },
  {
    name: 'وفاداری',
    href: '/workspaces/customer-relationship-management/loyalty',
    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    description: 'برنامه های امتیاز و وفاداری',
  },
  {
    name: 'بخش بندی',
    href: '/workspaces/customer-relationship-management/segments',
    icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
    description: 'تقسیم بندی مشتریان',
  },
  {
    name: 'کمپین ها',
    href: '/workspaces/customer-relationship-management/campaigns',
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    description: 'مدیریت کمپین های ارتباطی',
  },
  {
    name: 'تحلیل ها',
    href: '/workspaces/customer-relationship-management/analytics',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    description: 'گزارش ها و تحلیل رفتار مشتری',
  },
];

export default function CrmLayout({ children }: CrmLayoutProps) {
  return (
    <WorkspaceShell
      workspaceId="customer-relationship-management"
      workspaceName="مدیریت ارتباط با مشتری"
      workspaceDescription="Customer Relationship Management"
      fallbackGradient="from-pink-500 to-purple-600"
      accent="purple"
      navigationItems={navigationItems}
    >
      {children}
    </WorkspaceShell>
  );
}
