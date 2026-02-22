'use client';

import React from 'react';
import { WorkspaceShell, WorkspaceNavItem } from '@/components/layout/WorkspaceShell';

interface SmsLayoutProps {
  children: React.ReactNode;
}

const navigationItems: WorkspaceNavItem[] = [
  {
    name: 'داشبورد پیامک',
    href: '/workspaces/sms-management',
    icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
    description: 'نمای کلی مدیریت پیامک',
  },
  {
    name: 'ارسال انبوه',
    href: '/workspaces/sms-management/bulk-sms',
    icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
    description: 'ارسال پیامک به چند گیرنده',
  },
  {
    name: 'دعوت نامه ها',
    href: '/workspaces/sms-management/invitations',
    icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
    description: 'ارسال پیامک دعوت',
  },
  {
    name: 'تاریخچه',
    href: '/workspaces/sms-management/history',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    description: 'مشاهده پیامک های ارسال شده',
  },
];

export default function SmsLayout({ children }: SmsLayoutProps) {
  return (
    <WorkspaceShell
      workspaceId="sms-management"
      workspaceName="مدیریت پیامک"
      workspaceDescription="SMS Management Workspace"
      fallbackGradient="from-green-500 to-green-600"
      accent="green"
      navigationItems={navigationItems}
    >
      {children}
    </WorkspaceShell>
  );
}
