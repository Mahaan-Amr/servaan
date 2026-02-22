'use client';

import React from 'react';
import { Navbar } from '../Navbar';
import { TenantAwareFooter } from '../TenantAwareFooter';

interface MainAppShellProps {
  children: React.ReactNode;
}

export function MainAppShell({ children }: MainAppShellProps) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-shell__main">
        <div className="app-shell__content">{children}</div>
      </main>
      <TenantAwareFooter />
    </div>
  );
}

