'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '../Navbar';
import { TenantAwareFooter } from '../TenantAwareFooter';
import { NativeDesktopFrame } from '../native/NativeDesktopFrame';
import { isDesktopApp } from '../../services/desktopBridgeService';
import { isNativeSessionActive } from '../../services/nativeDeviceService';

interface MainAppShellProps {
  children: React.ReactNode;
}

export function MainAppShell({ children }: MainAppShellProps) {
  const pathname = usePathname();
  const isNativeShell = pathname?.startsWith('/native');
  const [nativeDesktop, setNativeDesktop] = useState(isNativeShell);

  useEffect(() => {
    setNativeDesktop(Boolean(isNativeShell || isDesktopApp() || isNativeSessionActive()));
  }, [isNativeShell, pathname]);

  if (isNativeShell) {
    return <>{children}</>;
  }

  if (nativeDesktop && (pathname === '/workspaces' || pathname?.startsWith('/workspaces/'))) {
    return <NativeDesktopFrame>{children}</NativeDesktopFrame>;
  }

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
