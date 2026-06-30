'use client';

import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Banknote,
  BadgeAlert,
  Bell,
  Box,
  Check,
  CircleGauge,
  CreditCard,
  HardDriveDownload,
  Home,
  KeyRound,
  LayoutDashboard,
  Printer,
  RefreshCw,
  ScanSearch,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  TabletSmartphone,
  X,
  TriangleAlert,
  Users2,
  WalletCards
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  createPinHash,
  getDefaultModeForProfile,
  clearNativeOfflineSession,
  clearNativeSessionActive,
  getNativeDeviceSetup,
  getNativeOfflineSession,
  hydrateNativeDeviceState,
  isNativeRoute,
  markNativeSessionActive,
  markNativeSessionActivePersistent,
  nativeOfflineSessionIsValid,
  saveNativeDeviceSetup,
  saveNativeDeviceSetupPersistent,
  saveNativeOfflineSession,
  saveNativeOfflineSessionPersistent,
  type NativeSidecarStatus,
  updateLastWorkspaceMode,
  wipeNativeDeviceState,
  type NativeDeviceProfile,
  type NativeDeviceSetup,
  type NativeWorkspaceMode
} from '../../services/nativeDeviceService';
import { getToken, login as authLogin } from '../../services/authService';
import { localFirstSyncService } from '../../services/localFirstSyncService';
import { getInventoryStats } from '../../services/inventoryService';
import { LogoLoadingOverlay } from './LogoLoadingOverlay';
import { listenDesktopEvent } from '../../services/desktopBridgeService';
import {
  getNativeOnlineLoginSnapshot,
  clearNativeOnlineLoginSnapshot,
  isNativeSnapshotValid,
  updateNativeSnapshotDeviceSetup
} from '../../services/nativeAuthSnapshotService';
import {
  formatNativeCacheLastUpdated,
  getNativeV1CacheReadiness,
  seedNativeV1BusinessCache,
  type NativeV1CacheReadiness
} from '../../services/nativeBusinessCacheService';
import {
  loadNativePosSnapshot,
  submitNativePosPaidOrder
} from '../../features/native-pos/nativePosService';
import type {
  NativePosCartLine,
  NativePosMenuItem,
  NativePosOrderType,
  NativePosPaidOrderResult,
  NativePosPaymentMethod,
  NativePosSnapshot
} from '../../features/native-pos/nativePosTypes';
import {
  loadNativeInventorySnapshot,
  submitNativeInventoryEntry
} from '../../features/native-inventory/nativeInventoryService';
import type {
  NativeInventoryEntryResult,
  NativeInventoryMovementType,
  NativeInventorySnapshot
} from '../../features/native-inventory/nativeInventoryTypes';

type NativePanel = 'home' | 'sales' | 'inventory' | 'settings' | 'support' | 'sync';

interface NativeIssueSummary {
  pendingCount: number;
  failedCount: number;
  conflictedCount: number;
  waitingForDependencyCount: number;
}

const DESKTOP_SIDECAR_STATUS_EVENT = 'servaan-sidecar-status';

const emptyIssueSummary: NativeIssueSummary = {
  pendingCount: 0,
  failedCount: 0,
  conflictedCount: 0,
  waitingForDependencyCount: 0
};

function formatNativeError(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  try {
    return JSON.stringify(error);
  } catch {
    return fallback;
  }
}

function formatNativeQuantity(value: number): string {
  return value.toLocaleString('fa-IR', {
    maximumFractionDigits: 3
  });
}

function formatCacheSeedFailures(failed: Array<{ key: string; message: string }>): string {
  if (failed.length === 0) return '';
  const preview = failed.slice(0, 3).map((failure) => `${failure.key}: ${failure.message}`).join('، ');
  const suffix = failed.length > 3 ? ` و ${failed.length - 3} مورد دیگر` : '';
  return `${preview}${suffix}`;
}

const profileMeta: Record<
  NativeDeviceProfile,
  {
    title: string;
    subtitle: string;
    icon: typeof WalletCards;
    defaultMode: NativeWorkspaceMode;
    requiresPrinter: boolean;
  }
> = {
  pos_shared: {
    title: 'صندوق / کاربر مشترک',
    subtitle: 'ثبت سریع سفارش، پرداخت، رسید و چاپ',
    icon: WalletCards,
    defaultMode: 'sales',
    requiresPrinter: true
  },
  inventory: {
    title: 'انبار',
    subtitle: 'دریافت، اصلاح، مشاهده موجودی و شمارش',
    icon: Box,
    defaultMode: 'inventory',
    requiresPrinter: false
  },
  manager: {
    title: 'مدیر',
    subtitle: 'نمای کلی، تاییدها، موارد، گزارش و کنترل',
    icon: LayoutDashboard,
    defaultMode: 'manager',
    requiresPrinter: false
  },
  staff_mobile: {
    title: 'موبایل کارمند',
    subtitle: 'سفارش سریع و کارهای تکراری در حرکت',
    icon: TabletSmartphone,
    defaultMode: 'sales',
    requiresPrinter: false
  }
};

export function NativeApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, authLoaded, logout: logoutAuthContext } = useAuth();
  const [setup, setSetup] = useState<NativeDeviceSetup | null>(null);
  const [session, setSession] = useState(getNativeOfflineSession());
  const [activePanel, setActivePanel] = useState<NativePanel>('home');
  const [issueSummary, setIssueSummary] = useState<NativeIssueSummary>(emptyIssueSummary);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [locked, setLocked] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState(0);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupDraft, setSetupDraft] = useState<NativeDeviceSetup>(() => getNativeDeviceSetup());
  const [loadingMessage, setLoadingMessage] = useState('در حال بارگذاری سروان');
  const [delayedMessage, setDelayedMessage] = useState('بررسی دستگاه و کش آفلاین');
  const [inventorySummary, setInventorySummary] = useState({ totalItems: 0, lowStockCount: 0, todayTransactions: 0 });
  const [sidecarStatus, setSidecarStatus] = useState<NativeSidecarStatus | null>(null);
  const [dismissedStatusSequence, setDismissedStatusSequence] = useState(0);
  const [cacheReadiness, setCacheReadiness] = useState<NativeV1CacheReadiness | null>(null);
  const [cacheWarning, setCacheWarning] = useState<string | null>(null);
  const restoredLastRoute = useRef(false);
  const seededForUser = useRef<string | null>(null);
  const activeUser = locked ? null : user || session?.user || null;
  const hasIssues =
    issueSummary.failedCount + issueSummary.conflictedCount + issueSummary.waitingForDependencyCount > 0;
  const isProblemVisible = hasIssues;
  const recoveryBannerVisible = Boolean(
    sidecarStatus && !sidecarStatus.healthy && sidecarStatus.sequence > dismissedStatusSequence
  );
  const refreshIssues = useCallback(async () => {
    try {
      const summary = await localFirstSyncService.getIssueSummary();
      setIssueSummary(summary);
    } catch {
      setIssueSummary(emptyIssueSummary);
    }
  }, []);

  const refreshCacheReadiness = useCallback(async () => {
    try {
      setCacheReadiness(await getNativeV1CacheReadiness());
    } catch {
      setCacheReadiness(null);
    }
  }, []);

  const refreshOperationalSummaries = useCallback(async () => {
    const inventoryResult = await Promise.allSettled([getInventoryStats()]);

    if (inventoryResult[0].status === 'fulfilled') {
      setInventorySummary({
        totalItems: inventoryResult[0].value.totalItems,
        lowStockCount: inventoryResult[0].value.lowStockCount,
        todayTransactions: inventoryResult[0].value.recentTransactions
      });
    }
  }, []);

  const seedBusinessCache = useCallback(async () => {
    if (!activeUser && !getToken() && !getNativeOfflineSession()) return;
    try {
      const result = await seedNativeV1BusinessCache();
      const nextReadiness = await getNativeV1CacheReadiness();
      setCacheReadiness(nextReadiness);
      if (result.status === 'failed') {
        setCacheWarning(
          nextReadiness.ready
            ? `به‌روزرسانی داده‌های آفلاین ناموفق بود؛ از داده‌های ذخیره‌شده استفاده می‌شود: ${formatCacheSeedFailures(result.failed)}`
            : `همگام‌سازی اولیه داده‌های آفلاین انجام نشد: ${formatCacheSeedFailures(result.failed)}`
        );
      } else if (result.status === 'partial') {
        setCacheWarning(`بخشی از داده‌های آفلاین به‌روزرسانی نشد: ${formatCacheSeedFailures(result.failed)}`);
      } else {
        setCacheWarning(null);
      }
    } catch (error) {
      await refreshCacheReadiness();
      setCacheWarning(`به‌روزرسانی داده‌های آفلاین ناموفق بود: ${formatNativeError(error, 'خطای ناشناخته')}`);
    }
  }, [activeUser, refreshCacheReadiness]);

  const handleSyncNow = useCallback(async () => {
    setProcessing(true);
    try {
      await localFirstSyncService.syncNow().catch(() => {
        setCacheWarning('همگام‌سازی صف عملیات انجام نشد. تلاش برای به‌روزرسانی داده‌های آفلاین ادامه دارد.');
      });
      await seedBusinessCache();
      await refreshIssues();
      await refreshOperationalSummaries();
    } catch {
      setCacheWarning('همگام‌سازی انجام نشد. عملیات آفلاین در صف باقی می‌ماند و بعداً دوباره تلاش می‌شود.');
      await refreshIssues();
    } finally {
      setProcessing(false);
    }
  }, [refreshIssues, refreshOperationalSummaries, seedBusinessCache]);

  const hydrate = useCallback(async () => {
    setLoading(true);
    await hydrateNativeDeviceState();
    let nextSetup = getNativeDeviceSetup();
    let nextSession = getNativeOfflineSession();

    if (!nextSetup.setupComplete || !nextSession) {
      const snapshot = await getNativeOnlineLoginSnapshot();
      if (snapshot && isNativeSnapshotValid(snapshot)) {
        if (!nextSession) {
          nextSession = await saveNativeOfflineSessionPersistent(snapshot.user, snapshot.token);
        }

        if (!nextSetup.setupComplete && snapshot.deviceSetup?.setupComplete) {
          nextSetup = snapshot.deviceSetup;
          await saveNativeDeviceSetupPersistent(nextSetup);
        }
      }
    }

    setSetup(nextSetup);
    setSetupDraft(nextSetup);
    setSession(nextSession);
    setLocked(Boolean(nextSetup.setupComplete && nextSession && nativeOfflineSessionIsValid(nextSession) && !user));
    await refreshIssues();
    setLoading(false);
  }, [refreshIssues, user]);

  useEffect(() => {
    markNativeSessionActive();
    markNativeSessionActivePersistent().catch(() => undefined);
    const requestedPanel = searchParams.get('panel') as NativePanel | null;
    if (requestedPanel && ['home', 'sales', 'inventory', 'settings', 'support', 'sync'].includes(requestedPanel)) {
      setActivePanel(requestedPanel);
    }
  }, [searchParams]);

  useEffect(() => {
    hydrate().catch(() => setLoading(false));
  }, [hydrate]);

  useEffect(() => {
    if (!activeUser) return;
    refreshOperationalSummaries().catch(() => undefined);
  }, [activeUser, refreshOperationalSummaries]);

  useEffect(() => {
    if (!activeUser) {
      seededForUser.current = null;
      return;
    }

    refreshCacheReadiness().catch(() => undefined);

    if (seededForUser.current === activeUser.id) return;
    seededForUser.current = activeUser.id;
    seedBusinessCache().catch(() => undefined);
  }, [activeUser, refreshCacheReadiness, seedBusinessCache]);

  useEffect(() => {
    if (restoredLastRoute.current || loading || !activeUser || !setup?.setupComplete) return;
    restoredLastRoute.current = true;
    if (!searchParams.get('panel') && setup.lastOperationalRoute?.startsWith('/workspaces/ordering-sales-system')) {
      setActivePanel('sales');
      return;
    }

    if (!searchParams.get('panel') && setup.lastOperationalRoute?.startsWith('/workspaces/')) {
      router.replace(setup.lastOperationalRoute);
    }
  }, [activeUser, loading, router, searchParams, setup]);

  useEffect(() => {
    if (!authLoaded) return;

    if (user && isNativeRoute()) {
      const token = getToken() || undefined;
      const updatedSession = saveNativeOfflineSession(user, token);
      saveNativeOfflineSessionPersistent(user, token).catch(() => undefined);
      setSession(updatedSession);
      setSetup((current) => {
        const next = current || getNativeDeviceSetup();
        const mode = getDefaultModeForProfile(next.deviceProfile, user.role);
        const patched = {
          ...next,
          setupComplete: true,
          lastWorkspaceMode: mode,
          deviceName: next.deviceName || `دستگاه ${user.name}`,
          completedAt: next.completedAt || new Date().toISOString()
        };
        saveNativeDeviceSetup(patched);
        saveNativeDeviceSetupPersistent(patched)
          .then(() => updateNativeSnapshotDeviceSetup(patched))
          .catch(() => undefined);
        setSetupDraft(patched);
        setActivePanel(mode === 'inventory' ? 'inventory' : mode === 'manager' ? 'settings' : 'home');
        return patched;
      });
    }
  }, [authLoaded, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoadingMessage('در حال بارگذاری سروان');
      setDelayedMessage('آماده‌سازی کش آفلاین و پروفایل دستگاه');
    }, 2000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onOnline = () => handleSyncNow().catch(() => undefined);
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [handleSyncNow]);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let alive = true;

    listenDesktopEvent<NativeSidecarStatus>(DESKTOP_SIDECAR_STATUS_EVENT, (payload) => {
      if (!alive) return;
      setSidecarStatus(payload);
      if (payload.healthy) {
        setDismissedStatusSequence(0);
      }
    }).then((cleanup) => {
      if (!alive) {
        cleanup?.();
        return;
      }

      unlisten = cleanup;
    });

    return () => {
      alive = false;
      unlisten?.();
    };
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    setProcessing(true);
    try {
      const loggedInUser = await authLogin({ email: loginEmail, password: loginPassword }, true);
      const token = getToken() || undefined;
      let nextSession = saveNativeOfflineSession(loggedInUser, token);

      try {
        nextSession = await saveNativeOfflineSessionPersistent(loggedInUser, token);
      } catch (error) {
        console.warn('[native-login] Auth succeeded but desktop session persistence failed:', error);
      }

      setSession(nextSession);
      const nextSetup = getNativeDeviceSetup();
      const nextMode = getDefaultModeForProfile(nextSetup.deviceProfile, loggedInUser.role);
      setSetup({
        ...nextSetup,
        setupComplete: nextSetup.setupComplete,
        lastWorkspaceMode: nextSetup.setupComplete ? nextSetup.lastWorkspaceMode : nextMode
      });
      setLoginPassword('');
      setLocked(false);
      setActivePanel(nextSetup.setupComplete ? nextSetup.lastWorkspaceMode === 'inventory' ? 'inventory' : nextSetup.lastWorkspaceMode === 'settings' ? 'settings' : 'home' : nextMode === 'inventory' ? 'inventory' : nextMode === 'manager' ? 'settings' : 'home');
      await seedBusinessCache();
      await refreshCacheReadiness();
      await refreshIssues();
    } catch (error) {
      setLoginError(formatNativeError(error, 'ورود ناموفق بود'));
    } finally {
      setProcessing(false);
    }
  };

  const handleOfflineUnlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUnlockError(null);
    setProcessing(true);
    try {
      if (!session || !setup?.pinHash || !setup.pinSalt) {
        throw new Error('باز کردن آفلاین روی این دستگاه آماده نیست.');
      }

      const { verifyPin } = await import('../../services/nativeDeviceService');
      const ok = await verifyPin(pinValue, setup.pinSalt, setup.pinHash);
      if (!ok) {
        throw new Error('PIN نادرست است');
      }

      setLocked(false);
      setPinValue('');
      setActivePanel(setup.lastWorkspaceMode === 'inventory' ? 'inventory' : setup.lastWorkspaceMode === 'settings' ? 'settings' : 'home');
      await localFirstSyncService.syncNow().catch(() => undefined);
      await refreshIssues();
    } catch (error) {
      setUnlockError(formatNativeError(error, 'باز کردن دستگاه ناموفق بود'));
    } finally {
      setProcessing(false);
    }
  };

  const handleSetupSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSetupError(null);
    setProcessing(true);
    try {
      const pin = (event.currentTarget.elements.namedItem('pin') as HTMLInputElement | null)?.value || '';
      if (pin.trim().length < 4) {
        throw new Error('PIN باید حداقل ۴ رقم باشد.');
      }

      const deviceName = setupDraft.deviceName.trim() || 'دستگاه سروان';
      const deviceProfile = setupDraft.deviceProfile;
      const defaultMode = getDefaultModeForProfile(deviceProfile, activeUser?.role);
      const pinState = await createPinHash(pin);
      const nextSetup: NativeDeviceSetup = {
        ...setupDraft,
        setupComplete: true,
        deviceName,
        deviceProfile,
        lastWorkspaceMode: defaultMode,
        pinSalt: pinState.salt,
        pinHash: pinState.hash,
        completedAt: new Date().toISOString()
      };

      await saveNativeDeviceSetupPersistent(nextSetup);
      updateNativeSnapshotDeviceSetup(nextSetup).catch((error) => {
        console.warn('[native-setup] Device setup saved but snapshot update failed:', error);
      });
      setSetup(nextSetup);
      setSetupDraft(nextSetup);
      updateLastWorkspaceMode(defaultMode);

      if (defaultMode === 'inventory') setActivePanel('inventory');
      else if (defaultMode === 'manager') setActivePanel('settings');
      else setActivePanel('home');

      if (deviceProfile === 'pos_shared') {
        setLoadingMessage('در حال تنظیم چاپگر');
        setDelayedMessage('برای این پروفایل دستگاه، تنظیم چاپگر لازم است');
      }
    } catch (error) {
      setSetupError(formatNativeError(error, 'ذخیره تنظیمات دستگاه ناموفق بود.'));
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = async () => {
    logoutAuthContext();
    clearNativeOfflineSession();
    clearNativeSessionActive();
    await clearNativeOnlineLoginSnapshot().catch(() => undefined);
    setSession(null);
    setLocked(false);
    setCacheWarning(null);
    setCacheReadiness(null);
    seededForUser.current = null;
    setActivePanel('home');
    router.replace('/native');
  };

  const handleWipeDevice = () => {
    handleLogout().catch(() => undefined);
    wipeNativeDeviceState();
    setSetup(getNativeDeviceSetup());
    setSetupDraft(getNativeDeviceSetup());
    setLoginEmail('');
    setLoginPassword('');
  };

  const handleDiagnosticsExport = async () => {
    setProcessing(true);
    try {
      const summary = await localFirstSyncService.getIssueSummary();
      const payload = {
        exportedAt: new Date().toISOString(),
        app: 'سروان بومی',
        version: '0.1.0',
        device: setup,
        user: activeUser ? { id: activeUser.id, name: activeUser.name, role: activeUser.role, tenantId: activeUser.tenantId } : null,
        issueSummary: summary
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `servaan-diagnostics-${Date.now()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setProcessing(false);
    }
  };

  const updateSetupDraft = (patch: Partial<NativeDeviceSetup>) => {
    setSetupDraft((current) => ({ ...current, ...patch }));
  };

  const statusTag = isProblemVisible ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
      <TriangleAlert className="h-3.5 w-3.5" />
      {issueSummary.failedCount + issueSummary.conflictedCount + issueSummary.waitingForDependencyCount} مورد
    </span>
  ) : null;

  if (!authLoaded || loading) {
    return <LogoLoadingOverlay active message={loadingMessage} delayedMessage={delayedMessage} />;
  }

  if (!activeUser && !session) {
    return (
      <div className="min-h-screen bg-[#f5f6f7] text-slate-900 dark:bg-[#0b0d10] dark:text-white">
        <LoginScreen
          loginEmail={loginEmail}
          loginPassword={loginPassword}
          loginError={loginError}
          onEmailChange={setLoginEmail}
          onPasswordChange={setLoginPassword}
          onSubmit={handleLogin}
          isLoading={processing}
        />
        <LogoLoadingOverlay active={processing} message="در حال ورود" delayedMessage="بررسی دسترسی آفلاین" />
      </div>
    );
  }

  if (activeUser && setup && !setup.setupComplete) {
    return (
      <div className="min-h-screen bg-[#f5f6f7] text-slate-900 dark:bg-[#0b0d10] dark:text-white">
        <SetupWizard
          setup={setupDraft}
          currentRole={activeUser.role}
          setupStep={setupStep}
          setupError={setupError}
          onStepChange={setSetupStep}
          onChange={updateSetupDraft}
          onSubmit={handleSetupSave}
          onSkipPrinter={() => updateSetupDraft({ printerName: undefined })}
        />
        <LogoLoadingOverlay active={processing} message={loadingMessage} delayedMessage={delayedMessage} />
      </div>
    );
  }

  if (locked && session && setup && nativeOfflineSessionIsValid(session)) {
    return (
      <div className="min-h-screen bg-[#f5f6f7] text-slate-900 dark:bg-[#0b0d10] dark:text-white">
        <UnlockScreen
          setup={setup}
          pinValue={pinValue}
          unlockError={unlockError}
          onPinChange={setPinValue}
          onSubmit={handleOfflineUnlock}
        />
        <LogoLoadingOverlay active={processing} message="در حال باز کردن دستگاه" delayedMessage="استفاده از هویت آفلاین ذخیره‌شده" />
      </div>
    );
  }

  if (!activeUser) {
    return (
      <div className="min-h-screen bg-[#f5f6f7] text-slate-900 dark:bg-[#0b0d10] dark:text-white">
        <LoginScreen
          loginEmail={loginEmail}
          loginPassword={loginPassword}
          loginError={loginError}
          onEmailChange={setLoginEmail}
          onPasswordChange={setLoginPassword}
          onSubmit={handleLogin}
          isLoading={processing}
        />
        <LogoLoadingOverlay active={processing} message="در حال ورود" delayedMessage="آماده‌سازی فضای کاری بومی" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f7] text-slate-900 transition-colors dark:bg-[#0b0d10] dark:text-white">
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-black/5 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <div className="flex flex-col gap-3 px-4 py-3 md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img src="/brand/servaan-logo.png" alt="Servaan" className="h-9 w-9 rounded-xl object-contain" />
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">سروان بومی</div>
                  <div className="text-sm font-semibold">{setup?.deviceName || 'دستگاه بومی'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {statusTag}
                <button
                  type="button"
                  onClick={handleSyncNow}
                  className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  تازه‌سازی
                </button>
              </div>
            </div>
            {recoveryBannerVisible && sidecarStatus && (
              <div className="flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-50">
                <div className="flex min-w-0 items-start gap-3">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
                  <div className="min-w-0 space-y-1">
                    <div className="text-sm font-semibold">Sidecar در حال بازیابی است</div>
                    <div className="text-xs leading-5 text-amber-800 dark:text-amber-100/80">
                      {sidecarStatus.detail}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedStatusSequence(sidecarStatus.sequence)}
                  className="rounded-full p-1 text-amber-700 transition hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/40"
                  aria-label="بستن وضعیت بازیابی"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden w-[280px] shrink-0 border-l border-black/5 bg-white/70 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 lg:flex lg:flex-col">
            <ShellNav
              active={activePanel}
              onChange={(panel) => {
                setActivePanel(panel);
                updateLastWorkspaceMode(panel === 'sales' ? 'sales' : panel === 'inventory' ? 'inventory' : panel === 'settings' ? 'settings' : panel === 'support' ? 'support' : 'manager');
              }}
              profile={setup?.deviceProfile || setupDraft.deviceProfile}
              role={activeUser.role}
            />
          </aside>

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
              {cacheWarning && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">
                  {cacheWarning}
                </div>
              )}
              {cacheReadiness && !cacheReadiness.ready && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-100">
                  برای شروع کار آفلاین در فروش و انبار، یک بار همگام‌سازی آنلاین لازم است.
                </div>
              )}
              {cacheReadiness?.ready && cacheReadiness.updatedAt && (
                <div className="mb-4 rounded-2xl border border-black/5 bg-white/80 px-4 py-3 text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  آخرین به‌روزرسانی داده‌های آفلاین: {formatNativeCacheLastUpdated(cacheReadiness.updatedAt)}
                </div>
              )}
              {activePanel === 'home' && <HomePanel user={activeUser} setup={setup} onPanelChange={setActivePanel} />}
              {activePanel === 'sales' && (
                <SalesPanel
                  issues={issueSummary}
                  onRefreshData={handleSyncNow}
                  onOpenIssues={() => setActivePanel('sync')}
                  onSaleQueued={refreshIssues}
                />
              )}
              {activePanel === 'inventory' && (
                <InventoryPanel
                  issues={issueSummary}
                  summary={inventorySummary}
                  onOpenIssues={() => setActivePanel('sync')}
                />
              )}
              {activePanel === 'settings' && (
                <SettingsPanel
                  setup={setup}
                  onLogout={handleLogout}
                  onWipe={handleWipeDevice}
                  onExport={handleDiagnosticsExport}
                  onRefreshIssues={handleSyncNow}
                  issues={issueSummary}
                  onOpenSyncIssues={() => setActivePanel('sync')}
                />
              )}
              {activePanel === 'sync' && (
                <SyncIssuesPanel
                  issues={issueSummary}
                  onRetry={handleSyncNow}
                  onExport={handleDiagnosticsExport}
                  onOpenSupport={() => setActivePanel('support')}
                />
              )}
              {activePanel === 'support' && (
                <SupportPanel
                  setup={setup}
                  user={activeUser}
                  issues={issueSummary}
                  onExport={handleDiagnosticsExport}
                />
              )}
            </div>
          </main>
        </div>

        <nav className="border-t border-black/5 bg-white/85 px-2 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 lg:hidden">
          <div className="grid grid-cols-5 gap-1">
            {mobileTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActivePanel(tab.key)}
                className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium ${
                  activePanel === tab.key
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      <LogoLoadingOverlay active={processing} message={loadingMessage} delayedMessage={delayedMessage} />
    </div>
  );
}

function LoginScreen(props: {
  loginEmail: string;
  loginPassword: string;
  loginError: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-10">
      <div className="rounded-[32px] border border-black/5 bg-white/85 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75 md:p-8">
        <div className="mb-6 flex items-center gap-4">
          <img src="/brand/servaan-logo.png" alt="Servaan" className="h-14 w-14 rounded-2xl object-contain" />
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">محیط بومی خصوصی</div>
            <h1 className="text-2xl font-semibold">ورود</h1>
          </div>
        </div>
        <form className="space-y-4" onSubmit={props.onSubmit}>
          <InputField label="ایمیل" type="email" value={props.loginEmail} onChange={props.onEmailChange} autoComplete="email" />
          <InputField label="رمز عبور" type="password" value={props.loginPassword} onChange={props.onPasswordChange} autoComplete="current-password" />
          {props.loginError && <ErrorBanner text={props.loginError} />}
          <button
            type="submit"
            disabled={props.isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {props.isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            ادامه
          </button>
        </form>
      </div>
    </div>
  );
}

function UnlockScreen(props: {
  setup: NativeDeviceSetup;
  pinValue: string;
  unlockError: string | null;
  onPinChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-10">
      <div className="rounded-[32px] border border-black/5 bg-white/85 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75 md:p-8">
        <div className="mb-6 flex items-center gap-4">
          <img src="/brand/servaan-logo.png" alt="Servaan" className="h-14 w-14 rounded-2xl object-contain" />
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">باز کردن آفلاین</div>
            <h1 className="text-2xl font-semibold">{props.setup.deviceName}</h1>
          </div>
        </div>
        <form className="space-y-4" onSubmit={props.onSubmit}>
          <InputField label="PIN" type="password" value={props.pinValue} onChange={props.onPinChange} autoComplete="one-time-code" />
          {props.unlockError && <ErrorBanner text={props.unlockError} />}
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <KeyRound className="h-4 w-4" />
            باز کردن
          </button>
        </form>
      </div>
    </div>
  );
}

function SetupWizard(props: {
  setup: NativeDeviceSetup;
  currentRole: string;
  setupStep: number;
  setupError: string | null;
  onStepChange: (step: number) => void;
  onChange: (patch: Partial<NativeDeviceSetup>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSkipPrinter: () => void;
}) {
  const currentMeta = profileMeta[props.setup.deviceProfile];
  return (
    <div className="mx-auto min-h-screen max-w-5xl px-5 py-8 md:py-12">
      <div className="mb-6 flex items-center gap-4">
        <img src="/brand/servaan-logo.png" alt="Servaan" className="h-14 w-14 rounded-2xl object-contain" />
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">راه‌اندازی اولیه</div>
          <h1 className="text-3xl font-semibold">تنظیم این دستگاه</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-[32px] border border-black/5 bg-white/85 p-5 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
          <div className="space-y-3">
            {[
              'ورود آنلاین',
              'پروفایل دستگاه',
              'امنیت آفلاین',
              currentMeta.requiresPrinter ? 'چاپگر' : 'پایان'
            ].map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => props.onStepChange(index)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium ${
                  props.setupStep === index
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-[11px]">{index + 1}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-black/5 bg-white/85 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75 md:p-8">
          <form className="space-y-6" onSubmit={props.onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="نام دستگاه"
                value={props.setup.deviceName}
                onChange={(value) => props.onChange({ deviceName: value })}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">نقش</label>
                <div className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5">
                  {props.currentRole}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ProfileSelect value={props.setup.deviceProfile} onChange={(value) => props.onChange({ deviceProfile: value })} />
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">فضای کاری پیش‌فرض</label>
                <div className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5">
                  {currentMeta.defaultMode}
                </div>
              </div>
            </div>

            <InputField label="تنظیم PIN" type="password" name="pin" onChange={() => undefined} />
            {props.setupError && <ErrorBanner text={props.setupError} />}

            {currentMeta.requiresPrinter ? (
              <div className="rounded-[28px] border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-200">
                  <Printer className="h-4 w-4" />
                  برای این پروفایل دستگاه، تنظیم چاپگر لازم است
                </div>
                <InputField
                  label="نام یا مسیر چاپگر"
                  value={props.setup.printerName || ''}
                  onChange={(value) => props.onChange({ printerName: value })}
                />
                <button
                  type="button"
                  onClick={props.onSkipPrinter}
                  className="mt-3 text-sm font-medium text-amber-700 underline decoration-amber-400/50 underline-offset-4 dark:text-amber-200"
                >
                  فعلا رد شود
                </button>
              </div>
            ) : null}

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Check className="h-4 w-4" />
              پایان راه‌اندازی
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function HomePanel({
  user,
  setup,
  onPanelChange
}: {
  user: { name: string; role: string };
  setup: NativeDeviceSetup | null;
  onPanelChange: (panel: NativePanel) => void;
}) {
  return (
    <section className="space-y-6">
      <HeroBand
        title={`خوش آمدید، ${user.name}`}
        subtitle="محیط عملیاتی خصوصی"
        actionLabel="رفتن به فروش"
        onAction={() => onPanelChange('sales')}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ActionTile icon={CircleGauge} title="فروش" text="سفارش، میز، پرداخت" onClick={() => onPanelChange('sales')} />
        <ActionTile icon={Box} title="انبار" text="موجودی، دریافت، اصلاح" onClick={() => onPanelChange('inventory')} />
        <ActionTile icon={Settings2} title="تنظیمات" text="دستگاه، ورود، چاپ، پشتیبانی" onClick={() => onPanelChange('settings')} />
        <ActionTile icon={Users2} title="پشتیبانی" text="عیب‌یابی و راهنما" onClick={() => onPanelChange('support')} />
      </div>
      <ThreeColumnInfo
        items={[
          { label: 'نقش', value: user.role },
          { label: 'دستگاه', value: setup?.deviceProfile || 'تعیین نشده' },
          { label: 'آخرین فضا', value: setup?.lastWorkspaceMode || 'خانه' }
        ]}
      />
    </section>
  );
}

function SalesPanel({
  issues,
  onRefreshData,
  onOpenIssues,
  onSaleQueued
}: {
  issues: NativeIssueSummary;
  onRefreshData: () => void;
  onOpenIssues: () => void;
  onSaleQueued: () => void;
}) {
  const [snapshot, setSnapshot] = useState<NativePosSnapshot | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [orderType, setOrderType] = useState<NativePosOrderType>('DINE_IN');
  const [tableId, setTableId] = useState('');
  const [cart, setCart] = useState<NativePosCartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<NativePosPaymentMethod>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<NativePosPaidOrderResult | null>(null);

  const loadSnapshot = useCallback(async () => {
    const nextSnapshot = await loadNativePosSnapshot();
    setSnapshot(nextSnapshot);
    if (!selectedCategoryId && nextSnapshot.categories.length > 0) {
      setSelectedCategoryId(nextSnapshot.categories[0].id);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    loadSnapshot().catch((loadError) => {
      setError(formatNativeError(loadError, 'خطا در آماده‌سازی فروش بومی'));
    });
  }, [loadSnapshot]);

  const visibleItems =
    snapshot?.categories.find((category) => category.id === selectedCategoryId)?.items || snapshot?.categories[0]?.items || [];
  const total = cart.reduce((sum, line) => sum + line.total, 0);
  const pendingCount = issues.pendingCount;

  const addItem = (item: NativePosMenuItem) => {
    if (!item.available) return;
    setSuccess(null);
    setCart((current) => {
      const existing = current.find((line) => line.itemId === item.id);
      if (existing) {
        return current.map((line) =>
          line.itemId === item.id
            ? { ...line, quantity: line.quantity + 1, total: (line.quantity + 1) * line.unitPrice }
            : line
        );
      }

      return [
        ...current,
        {
          itemId: item.id,
          itemName: item.name,
          unitPrice: item.price,
          quantity: 1,
          total: item.price
        }
      ];
    });
  };

  const changeQuantity = (itemId: string, delta: number) => {
    setCart((current) =>
      current
        .map((line) => {
          if (line.itemId !== itemId) return line;
          const quantity = Math.max(0, line.quantity + delta);
          return { ...line, quantity, total: quantity * line.unitPrice };
        })
        .filter((line) => line.quantity > 0)
    );
  };

  const submitSale = async () => {
    setError(null);
    setSuccess(null);

    if (!snapshot || snapshot.readiness.kind !== 'ready') {
      setError('برای ثبت فروش، همگام‌سازی اولیه لازم است.');
      return;
    }

    if (cart.length === 0) {
      setError('سبد سفارش خالی است.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitNativePosPaidOrder({
        orderType,
        tableId: orderType === 'DINE_IN' ? tableId || undefined : undefined,
        items: cart,
        payment: {
          method: paymentMethod,
          amount: total,
          cashReceived: paymentMethod === 'cash' ? total : undefined,
          manualCard: paymentMethod === 'manual-card' ? { terminalId: 'manual-card' } : undefined
        }
      });
      setSuccess(result);
      setCart([]);
      setTableId('');
      await loadSnapshot();
      await onSaleQueued();
    } catch (submitError) {
      setError(formatNativeError(submitError, 'ثبت فروش ناموفق بود'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!snapshot) {
    return (
      <section className="space-y-6">
        <HeroBand title="فروش بومی" subtitle="صبر کنید" actionLabel="تازه‌سازی" onAction={onRefreshData} />
        <NativePanelSurface title="در حال آماده‌سازی" items={['خواندن منو، میزها و تنظیمات از کش بومی.']} />
      </section>
    );
  }

  if (snapshot.readiness.kind !== 'ready') {
    return (
      <section className="space-y-6">
        <HeroBand title="فروش بومی" subtitle="نیاز به آماده‌سازی" actionLabel="همگام‌سازی" onAction={onRefreshData} />
        <div className="rounded-[28px] border border-amber-200 bg-amber-50/85 p-5 text-amber-800 shadow-xl shadow-slate-900/10 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
          <div className="mb-2 text-lg font-semibold">{snapshot.readiness.message}</div>
          {snapshot.readiness.kind === 'missing-cache' && (
            <p className="text-sm leading-6">داده‌های لازم موجود نیست: {snapshot.readiness.missing.join('، ')}</p>
          )}
        </div>
        <NativePanelSurface
          title="مسیر درست"
          items={[
            'ابتدا با اتصال به سرور همگام‌سازی کنید.',
            'بعد از آماده شدن کش، فروش بومی بدون رفتن به نسخه وب کار می‌کند.',
            'اگر اعتبار آفلاین منقضی شده باشد، ورود آنلاین لازم است.'
          ]}
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <HeroBand title="فروش بومی" subtitle="ثبت سفارش و پرداخت آفلاین" actionLabel="تازه‌سازی" onAction={onRefreshData} />

      <div className="grid gap-4 md:grid-cols-3">
        <ActionTile icon={HardDriveDownload} title="در انتظار" text={`${pendingCount} عملیات در صف؛ هر فروش شامل سفارش و پرداخت است`} onClick={onOpenIssues} />
        <ActionTile icon={WalletCards} title="پرداخت V1" text="فقط نقدی و کارت دستی" />
        <ActionTile icon={CircleGauge} title="آخرین داده" text={formatNativeCacheLastUpdated(snapshot.readiness.updatedAt)} />
      </div>

      {error && <ErrorBanner text={error} />}
      {success && (
        <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-800 shadow-xl shadow-slate-900/10 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100">
          <div className="text-lg font-semibold">{success.message}</div>
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            <div>شماره سفارش: {success.orderNumber || success.orderLocalId}</div>
            <div>شماره پرداخت: {success.paymentNumber || success.paymentLocalId}</div>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        <div className="rounded-[28px] border border-black/5 bg-white/85 p-4 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
          <div className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">دسته‌بندی‌ها</div>
          <div className="space-y-2">
            {snapshot.categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategoryId(category.id)}
                className={`w-full rounded-2xl px-4 py-3 text-right text-sm font-medium transition ${
                  selectedCategoryId === category.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-white/5 dark:text-slate-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-black/5 bg-white/85 p-4 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">منوی ذخیره‌شده</div>
              <h3 className="text-xl font-semibold">انتخاب آیتم</h3>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-300">
              {visibleItems.length} آیتم
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={!item.available}
                onClick={() => addItem(item)}
                className="min-h-[132px] rounded-2xl border border-black/5 bg-slate-50 p-4 text-right transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-slate-900"
              >
                <div className="text-base font-semibold">{item.name}</div>
                {item.description && <div className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{item.description}</div>}
                <div className="mt-4 text-lg font-bold text-amber-600">{formatToman(item.price)}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-black/5 bg-white/85 p-4 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
          <div className="mb-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">سفارش جاری</div>
            <h3 className="text-xl font-semibold">سبد و پرداخت</h3>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <SegmentButton active={orderType === 'DINE_IN'} onClick={() => setOrderType('DINE_IN')} label="صرف در محل" />
            <SegmentButton active={orderType === 'TAKEAWAY'} onClick={() => setOrderType('TAKEAWAY')} label="بیرون‌بر" />
          </div>

          {orderType === 'DINE_IN' && (
            <select
              value={tableId}
              onChange={(event) => setTableId(event.target.value)}
              className="mb-4 w-full rounded-2xl border border-black/5 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
            >
              <option value="">بدون میز</option>
              {snapshot.tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.label}
                </option>
              ))}
            </select>
          )}

          <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:bg-white/5 dark:text-slate-300">
                سبد سفارش خالی است
              </div>
            ) : (
              cart.map((line) => (
                <div key={line.itemId} className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{line.itemName}</div>
                      <div className="mt-1 text-xs text-slate-500">{formatToman(line.unitPrice)}</div>
                    </div>
                    <div className="font-semibold text-amber-600">{formatToman(line.total)}</div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={() => changeQuantity(line.itemId, -1)} className="h-8 w-8 rounded-xl bg-white text-lg dark:bg-slate-900">
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{line.quantity}</span>
                    <button type="button" onClick={() => changeQuantity(line.itemId, 1)} className="h-8 w-8 rounded-xl bg-white text-lg dark:bg-slate-900">
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="my-4 rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>جمع کل</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">{formatToman(total)}</span>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <SegmentButton active={paymentMethod === 'cash'} onClick={() => setPaymentMethod('cash')} label="نقدی" icon={Banknote} />
            <SegmentButton active={paymentMethod === 'manual-card'} onClick={() => setPaymentMethod('manual-card')} label="کارت دستی" icon={CreditCard} />
          </div>

          <button
            type="button"
            disabled={submitting || cart.length === 0}
            onClick={submitSale}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            ثبت سفارش و پرداخت
          </button>
        </div>
      </div>
    </section>
  );
}

function InventoryPanel({
  issues,
  summary,
  onOpenIssues
}: {
  issues: NativeIssueSummary;
  summary: { totalItems: number; lowStockCount: number; todayTransactions: number };
  onOpenIssues: () => void;
}) {
  const [snapshot, setSnapshot] = useState<NativeInventorySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [movementType, setMovementType] = useState<NativeInventoryMovementType>('IN');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<NativeInventoryEntryResult | null>(null);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const nextSnapshot = await loadNativeInventorySnapshot();
      setSnapshot(nextSnapshot);
      setSelectedItemId((current) => current || nextSnapshot.items[0]?.id || '');
    } catch (loadError) {
      setError(formatNativeError(loadError, 'خطا در آماده‌سازی انبار بومی'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const selectedItem = snapshot?.items.find((item) => item.id === selectedItemId) || null;
  const parsedQuantity = Number(quantity);
  const validQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0;
  const nextEstimatedStock = selectedItem && validQuantity
    ? movementType === 'IN'
      ? selectedItem.current + parsedQuantity
      : selectedItem.current - parsedQuantity
    : selectedItem?.current ?? 0;
  const makesNegative = Boolean(selectedItem && movementType === 'OUT' && validQuantity && parsedQuantity > selectedItem.current);
  const filteredItems = (snapshot?.items || []).filter((item) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [item.name, item.category, item.unit].some((value) => value.toLowerCase().includes(query));
  });

  const submitEntry = async () => {
    if (!selectedItem || !validQuantity) return;

    setSubmitting(true);
    setError('');
    try {
      const result = await submitNativeInventoryEntry({
        itemId: selectedItem.id,
        type: movementType,
        quantity: parsedQuantity,
        note
      });
      setSuccess(result);
      setQuantity('');
      setNote('');
      await loadSnapshot();
    } catch (submitError) {
      setError(formatNativeError(submitError, 'ثبت سند انبار ناموفق بود'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <NativePanelSurface title="در حال آماده‌سازی" items={['خواندن کالاها و موجودی از کش بومی.']} />
    );
  }

  if (error) {
    return (
      <NativePanelSurface
        title="خطا در انبار بومی"
        items={[error]}
        action={
          <button type="button" onClick={loadSnapshot} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900">
            <RefreshCw className="h-4 w-4" />
            تلاش دوباره
          </button>
        }
      />
    );
  }

  if (!snapshot || snapshot.readiness.kind !== 'ready') {
    const readinessMessage = snapshot && snapshot.readiness.kind !== 'ready'
      ? snapshot.readiness.message
      : 'برای شروع کار آفلاین انبار، اتصال سرور و همگام‌سازی اولیه لازم است.';

    return (
      <NativePanelSurface
        title="همگام‌سازی اولیه لازم است"
        items={[
          readinessMessage,
          'بعد از همگام‌سازی، ورود و خروج کالا از همین صفحه انجام می‌شود.'
        ]}
        action={
          <button type="button" onClick={loadSnapshot} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900">
            <RefreshCw className="h-4 w-4" />
            بررسی دوباره
          </button>
        }
      />
    );
  }

  return (
    <section className="space-y-6">
      <HeroBand title="انبار بومی" subtitle="ورود و خروج کالا با صف همگام‌سازی" actionLabel="موارد همگام‌سازی" onAction={onOpenIssues} />
      <div className="grid gap-4 md:grid-cols-3">
        <ActionTile icon={Box} title="کالاهای کش‌شده" text={`${snapshot.items.length || summary.totalItems} کالای فعال`} />
        <ActionTile icon={HardDriveDownload} title="در انتظار" text={`${snapshot.pendingInventoryCount} سند انبار در صف`} onClick={onOpenIssues} />
        <ActionTile icon={TriangleAlert} title="برآورد محلی" text={snapshot.pendingInventoryCount > 0 ? `موجودی تخمینی، ${issues.conflictedCount} تعارض` : `${summary.lowStockCount} کم‌موجودی`} tone={snapshot.pendingInventoryCount > 0 ? 'warning' : 'neutral'} />
      </div>

      {snapshot.pendingInventoryCount > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          موجودی نمایش‌داده‌شده تخمینی است، چون {snapshot.pendingInventoryCount} سند انبار هنوز همگام‌سازی نشده است.
        </div>
      )}

      {success && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black">سند انبار در صف همگام‌سازی ثبت شد.</h3>
              <p className="mt-2 text-sm">
                {success.localNumber || success.operation.localOperationId}، {success.itemName}، {success.type === 'IN' ? 'ورود' : 'خروج'} {formatNativeQuantity(success.quantity)} {success.unit}
              </p>
            </div>
            <span className="rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-emerald-800 dark:bg-white/10 dark:text-emerald-100">
              در صف همگام‌سازی
            </span>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-slate-950 dark:shadow-black/20">
          <div className="mb-4">
            <p className="text-sm font-bold text-slate-500">سند جاری</p>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">ورود و خروج کالا</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SegmentButton active={movementType === 'IN'} onClick={() => setMovementType('IN')} label="ورود کالا" icon={HardDriveDownload} />
            <SegmentButton active={movementType === 'OUT'} onClick={() => setMovementType('OUT')} label="خروج کالا" icon={ScanSearch} />
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-600 dark:text-slate-300">کالا</span>
              <select
                value={selectedItemId}
                onChange={(event) => setSelectedItemId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                {filteredItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {item.unit}
                  </option>
                ))}
              </select>
            </label>

            {selectedItem && (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span>موجودی تخمینی فعلی</span>
                  <strong className="text-lg text-slate-950 dark:text-white">{formatNativeQuantity(selectedItem.current)} {selectedItem.unit}</strong>
                </div>
                {validQuantity && (
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span>بعد از ثبت</span>
                    <strong className={nextEstimatedStock < 0 ? 'text-lg text-red-600 dark:text-red-300' : 'text-lg text-slate-950 dark:text-white'}>
                      {formatNativeQuantity(nextEstimatedStock)} {selectedItem.unit}
                    </strong>
                  </div>
                )}
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-600 dark:text-slate-300">مقدار {selectedItem ? `(${selectedItem.unit})` : ''}</span>
              <input
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                inputMode="decimal"
                type="number"
                min="0"
                step="any"
                placeholder="مثلاً ۲.۵"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-600 dark:text-slate-300">یادداشت اختیاری</span>
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={movementType === 'IN' ? 'مثلاً خرید، برگشت کالا، اصلاح مثبت' : 'مثلاً مصرف، ضایعات، اصلاح منفی'}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </label>

            {makesNegative && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                این خروجی موجودی تخمینی را منفی می‌کند و هنگام همگام‌سازی بررسی می‌شود.
              </div>
            )}

            <button
              type="button"
              disabled={submitting || !selectedItem || !validQuantity}
              onClick={submitEntry}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              ثبت سند انبار
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-slate-950 dark:shadow-black/20">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-500">کالاهای فعال کش‌شده</p>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">انتخاب کالا</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
              {filteredItems.length} کالا
            </span>
          </div>

          <label className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="جست‌وجو بر اساس نام، دسته یا واحد"
              className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />
          </label>

          <div className="grid max-h-[34rem] gap-3 overflow-auto pr-1 md:grid-cols-2">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItemId(item.id)}
                className={`rounded-2xl border p-4 text-right transition ${
                  selectedItemId === item.id
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
                }`}
              >
                <span className="block text-sm font-black">{item.name}</span>
                <span className="mt-1 block text-xs opacity-70">{item.category}، {item.unit}</span>
                <span className="mt-4 block text-lg font-black">{formatNativeQuantity(item.current)} {item.unit}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SettingsPanel({
  setup,
  onLogout,
  onWipe,
  onExport,
  onRefreshIssues,
  issues,
  onOpenSyncIssues
}: {
  setup: NativeDeviceSetup | null;
  onLogout: () => void;
  onWipe: () => void;
  onExport: () => void;
  onRefreshIssues: () => void;
  issues: NativeIssueSummary;
  onOpenSyncIssues: () => void;
}) {
  return (
    <section className="space-y-6">
      <HeroBand title="تنظیمات" subtitle="دستگاه، ورود، چاپ، پشتیبانی" actionLabel="تازه‌سازی همگام‌سازی" onAction={onRefreshIssues} />
      <div className="grid gap-4 xl:grid-cols-2">
        <NativePanelSurface
          title="دستگاه"
          items={[
            `نام: ${setup?.deviceName || 'نامشخص'}`,
            `پروفایل: ${setup?.deviceProfile || 'نامشخص'}`,
            `آخرین فضا: ${setup?.lastWorkspaceMode || 'خانه'}`
          ]}
          action={
            <button
              type="button"
              onClick={onOpenSyncIssues}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
            >
              <TriangleAlert className="h-4 w-4" />
              موارد همگام‌سازی
            </button>
          }
        />
        <NativePanelSurface
          title="ورود آفلاین"
          items={[
            'پس از شروع آفلاین، باز کردن با PIN لازم است.',
            'اعتبار ورود آفلاین بر اساس کش دستگاه منقضی می‌شود.',
            'خروج و پاک‌سازی این دستگاه فقط محلی انجام می‌شود.'
          ]}
        />
        <NativePanelSurface
          title="اقدامات"
          items={[
            `در انتظار: ${issues.pendingCount}`,
            `ناموفق: ${issues.failedCount}`,
            `دارای تعارض: ${issues.conflictedCount}`
          ]}
          action={
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onExport} className="rounded-xl border border-black/5 bg-white px-4 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                خروجی عیب‌یابی
              </button>
              <button type="button" onClick={onLogout} className="rounded-xl border border-black/5 bg-white px-4 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                خروج از حساب
              </button>
              <button type="button" onClick={onWipe} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
                پاک‌سازی دستگاه
              </button>
            </div>
          }
        />
        <NativePanelSurface
          title="چاپ"
          items={[
            setup?.printerName ? `چاپگر: ${setup.printerName}` : 'چاپگری تنظیم نشده',
            setup?.deviceProfile === 'pos_shared' ? 'برای دستگاه‌های صندوق، تنظیم چاپگر لازم است.' : 'برای این پروفایل، تنظیم چاپگر اختیاری است.'
          ]}
        />
      </div>
    </section>
  );
}

function SupportPanel({
  setup,
  user,
  issues,
  onExport
}: {
  setup: NativeDeviceSetup | null;
  user: { name: string; role: string; tenantId?: string | null };
  issues: NativeIssueSummary;
  onExport: () => void;
}) {
  return (
    <section className="space-y-6">
      <HeroBand title="پشتیبانی" subtitle="عیب‌یابی و بازیابی" actionLabel="خروجی عیب‌یابی" onAction={onExport} />
      <div className="grid gap-4 xl:grid-cols-2">
        <NativePanelSurface
          title="نشست"
          items={[
            `کاربر: ${user.name}`,
            `نقش: ${user.role}`,
            `مستاجر: ${user.tenantId || 'نامشخص'}`,
            `دستگاه: ${setup?.deviceName || 'نامشخص'}`
          ]}
        />
        <NativePanelSurface
          title="همگام‌سازی"
          items={[
            `در انتظار: ${issues.pendingCount}`,
            `ناموفق: ${issues.failedCount}`,
            `دارای تعارض: ${issues.conflictedCount}`,
            `منتظر: ${issues.waitingForDependencyCount}`
          ]}
        />
      </div>
    </section>
  );
}

function SyncIssuesPanel({
  issues,
  onRetry,
  onExport,
  onOpenSupport
}: {
  issues: NativeIssueSummary;
  onRetry: () => void;
  onExport: () => void;
  onOpenSupport: () => void;
}) {
  const problemCount = issues.failedCount + issues.conflictedCount + issues.waitingForDependencyCount;

  return (
    <section className="space-y-6">
      <HeroBand
        title={problemCount > 0 ? 'موارد همگام‌سازی' : 'همگام‌سازی بدون مشکل'}
        subtitle="فقط هنگام نیاز نمایش داده می‌شود"
        actionLabel="تلاش دوباره"
        onAction={onRetry}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ActionTile icon={HardDriveDownload} title="در انتظار" text={`${issues.pendingCount} در صف`} />
        <ActionTile icon={TriangleAlert} title="ناموفق" text={`${issues.failedCount} نیاز به تلاش دوباره`} tone="warning" />
        <ActionTile icon={BadgeAlert} title="دارای تعارض" text={`${issues.conflictedCount} نیازمند مدیر`} tone="warning" />
        <ActionTile icon={CircleGauge} title="منتظر" text={`${issues.waitingForDependencyCount} وابسته به عملیات والد`} />
      </div>
      <NativePanelSurface
        title="حل مسئله"
        items={[
          'اگر یک عملیات ناموفق شود، عملیات مستقل دیگر همچنان همگام می‌شوند.',
          'عملیات وابسته تا گرفتن شناسه سرور از والد صبر می‌کنند.',
          'حل تعارض داده‌های اصلی همچنان با مدیر انجام می‌شود.'
        ]}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onExport}
              className="rounded-xl border border-black/5 bg-white px-4 py-2 text-sm dark:border-white/10 dark:bg-white/5"
            >
                خروجی عیب‌یابی
            </button>
            <button
              type="button"
              onClick={onOpenSupport}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
            >
              پشتیبانی
            </button>
          </div>
        }
      />
    </section>
  );
}

function ActionTile({
  icon: Icon,
  title,
  text,
  tone = 'neutral',
  onClick
}: {
  icon: typeof Home;
  title: string;
  text: string;
  tone?: 'neutral' | 'warning';
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[132px] rounded-[28px] border p-5 text-left shadow-xl shadow-slate-900/10 backdrop-blur-xl transition ${
        tone === 'warning'
          ? 'border-amber-200 bg-amber-50/85 hover:bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20'
          : 'border-black/5 bg-white/85 hover:bg-white dark:border-white/10 dark:bg-slate-950/75 dark:hover:bg-slate-900'
      }`}
    >
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${
          tone === 'warning'
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
            : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-base font-semibold text-slate-900 dark:text-white">{title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</div>
    </button>
  );
}

function SegmentButton({
  active,
  onClick,
  label,
  icon: Icon
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: typeof Home;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}

function formatToman(value: number): string {
  return `${Math.round(value).toLocaleString('fa-IR')} تومان`;
}

function HeroBand({
  title,
  subtitle,
  actionLabel,
  onAction
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-[32px] border border-black/5 bg-white/85 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{subtitle}</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Sparkles className="h-4 w-4" />
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function NativePanelSurface({
  title,
  items,
  action
}: {
  title: string;
  items: string[];
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-black/5 bg-white/85 p-5 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</h3>
        {action}
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">
            <Check className="h-4 w-4 text-emerald-500" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThreeColumnInfo({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-[28px] border border-black/5 bg-white/85 p-5 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{item.label}</div>
          <div className="mt-3 text-lg font-semibold">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function ShellNav({
  active,
  onChange,
  profile,
  role
}: {
  active: NativePanel;
  onChange: (panel: NativePanel) => void;
  profile: NativeDeviceProfile;
  role: string;
}) {
  const navItems: Array<{ key: Exclude<NativePanel, 'sync'>; label: string; icon: typeof Home }> = [
    { key: 'home', label: 'خانه', icon: Home },
    { key: 'sales', label: 'فروش', icon: WalletCards },
    { key: 'inventory', label: 'انبار', icon: Box },
    { key: 'settings', label: 'تنظیمات', icon: Settings2 },
    { key: 'support', label: 'پشتیبانی', icon: Bell }
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 rounded-[30px] border border-black/5 bg-slate-900 p-4 text-white dark:border-white/10">
        <div className="text-xs uppercase tracking-[0.2em] text-white/60">پیش‌فرض نقش</div>
        <div className="mt-2 text-lg font-semibold">{role}</div>
        <div className="mt-1 text-sm text-white/70">{profileMeta[profile].title}</div>
      </div>
      <div className="space-y-2">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
              active === item.key
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-auto pt-4">
        <div className="rounded-[28px] border border-black/5 bg-white/85 p-4 text-sm text-slate-600 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75 dark:text-slate-300">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <CircleGauge className="h-4 w-4" />
            محیط بومی
          </div>
          <p className="mt-3 leading-6">حالت خصوصی برنامه، ورود آفلاین، وضعیت آرام همگام‌سازی و پیش‌فرض‌های نقش.</p>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  name,
  autoComplete
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  type?: string;
  name?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-black/5 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:focus:bg-slate-950"
      />
    </label>
  );
}

function ProfileSelect({
  value,
  onChange
}: {
  value: NativeDeviceProfile;
  onChange: (value: NativeDeviceProfile) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">پروفایل دستگاه</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as NativeDeviceProfile)}
        className="w-full rounded-2xl border border-black/5 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:focus:bg-slate-950"
      >
        {Object.entries(profileMeta).map(([key, meta]) => (
          <option key={key} value={key}>
            {meta.title}
          </option>
        ))}
      </select>
    </label>
  );
}

function ErrorBanner({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
      {text}
    </div>
  );
}

const mobileTabs: Array<{ key: Exclude<NativePanel, 'sync'>; label: string; icon: typeof Home }> = [
  { key: 'home', label: 'خانه', icon: Home },
  { key: 'sales', label: 'فروش', icon: WalletCards },
  { key: 'inventory', label: 'انبار', icon: Box },
  { key: 'settings', label: 'تنظیمات', icon: Settings2 },
  { key: 'support', label: 'پشتیبانی', icon: Bell }
];

