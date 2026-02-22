'use client';

import React, { useMemo } from 'react';
import { WorkspaceShell, WorkspaceNavItem } from '@/components/layout/WorkspaceShell';
import { ChartFilterProvider } from '@/contexts/ChartFilterContext';
import { BIWorkspace, BIWorkspaceProvider, useBIWorkspace } from '@/contexts/BIWorkspaceContext';

interface BusinessIntelligenceLayoutProps {
  children: React.ReactNode;
}

type WorkspaceNavItemWithScope = WorkspaceNavItem & {
  workspaces?: BIWorkspace[];
};

const allNavigationItems: WorkspaceNavItemWithScope[] = [
  {
    name: 'داشبورد هوش تجاری',
    href: '/workspaces/business-intelligence',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    description: 'نمای کلی و آمار',
    workspaces: ['ordering', 'inventory', 'merged'],
  },
  {
    name: 'داشبورد سفارشات',
    href: '/workspaces/business-intelligence/ordering',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    description: 'تحلیل سیستم سفارشات',
    workspaces: ['ordering', 'merged'],
  },
  {
    name: 'داشبورد موجودی',
    href: '/workspaces/business-intelligence/inventory',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    description: 'تحلیل سیستم موجودی',
    workspaces: ['inventory', 'merged'],
  },
  {
    name: 'داشبورد ترکیبی',
    href: '/workspaces/business-intelligence/merged',
    icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v9a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h6a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z',
    description: 'تحلیل ترکیبی سفارشات و موجودی',
    workspaces: ['merged'],
  },
  {
    name: 'تحلیل‌های پیشرفته',
    href: '/workspaces/business-intelligence/analytics',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    description: 'آنالیز داده‌ها',
    workspaces: ['ordering', 'inventory', 'merged'],
  },
  {
    name: 'گزارش‌ساز سفارشی',
    href: '/workspaces/business-intelligence/custom-reports',
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    description: 'ایجاد گزارش‌های سفارشی',
    workspaces: ['ordering', 'inventory', 'merged'],
  },
  {
    name: 'Data Explorer',
    href: '/workspaces/business-intelligence/data-explorer',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    description: 'اکتشاف و تجمیع داده‌ها',
    workspaces: ['ordering', 'inventory', 'merged'],
  },
  {
    name: 'تحلیل روند',
    href: '/workspaces/business-intelligence/trend-analysis',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    description: 'تحلیل روندهای زمانی',
    workspaces: ['ordering', 'inventory', 'merged'],
  },
  {
    name: 'تحلیل ABC',
    href: '/workspaces/business-intelligence/abc-analysis',
    icon: 'M7 12l3-3 3 3 4-4',
    description: 'تحلیل ABC کالاها',
    workspaces: ['inventory', 'merged'],
  },
  {
    name: 'تحلیل سودآوری',
    href: '/workspaces/business-intelligence/profit-analysis',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    description: 'تحلیل سودآوری محصولات',
    workspaces: ['ordering', 'merged'],
  },
  {
    name: 'تنظیمات',
    href: '/workspaces/business-intelligence/settings',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    description: 'تنظیمات سیستم هوش تجاری',
    workspaces: ['ordering', 'inventory', 'merged'],
  },
];

function BusinessIntelligenceLayoutContent({ children }: BusinessIntelligenceLayoutProps) {
  const { workspace, setWorkspace } = useBIWorkspace();

  const navigationItems = useMemo(
    () => allNavigationItems.filter((item) => !item.workspaces || item.workspaces.includes(workspace)),
    [workspace]
  );

  const workspaceSelector = (
    <div className="ui-field">
      <label htmlFor="bi-workspace-select" className="ui-field__label text-xs">
        انتخاب Workspace
      </label>
      <select
        id="bi-workspace-select"
        value={workspace}
        onChange={(event) => setWorkspace(event.target.value as BIWorkspace)}
        className="ui-select"
      >
        <option value="merged">ترکیبی (Ordering + Inventory)</option>
        <option value="ordering">سفارشات (Ordering)</option>
        <option value="inventory">موجودی (Inventory)</option>
      </select>
    </div>
  );

  return (
    <WorkspaceShell
      workspaceId="business-intelligence"
      workspaceName="هوش تجاری"
      workspaceDescription="Business Intelligence Workspace"
      fallbackGradient="from-purple-500 to-purple-600"
      accent="purple"
      navigationItems={navigationItems}
      panelContent={workspaceSelector}
    >
      <ChartFilterProvider>{children}</ChartFilterProvider>
    </WorkspaceShell>
  );
}

export default function BusinessIntelligenceLayout({ children }: BusinessIntelligenceLayoutProps) {
  return (
    <BIWorkspaceProvider>
      <BusinessIntelligenceLayoutContent>{children}</BusinessIntelligenceLayoutContent>
    </BIWorkspaceProvider>
  );
}
