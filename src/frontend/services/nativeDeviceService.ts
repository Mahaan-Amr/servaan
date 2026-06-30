import { User } from '../types';
import {
  deleteDesktopStoreValue,
  getDesktopStoreValue,
  isDesktopApp,
  setDesktopStoreValue
} from './desktopBridgeService';

export type NativeDeviceProfile = 'pos_shared' | 'inventory' | 'manager' | 'staff_mobile';
export type NativeWorkspaceMode = 'manager' | 'sales' | 'inventory' | 'support' | 'settings';

export interface NativeDeviceSetup {
  setupComplete: boolean;
  deviceName: string;
  deviceProfile: NativeDeviceProfile;
  lastWorkspaceMode: NativeWorkspaceMode;
  printerName?: string;
  lastOperationalRoute?: string;
  pinSalt?: string;
  pinHash?: string;
  completedAt?: string;
}

const NATIVE_SESSION_KEY = 'servaan.native.active';

export interface NativeOfflineSession {
  user: User;
  token?: string;
  tenantId?: string;
  tenantSubdomain?: string;
  offlineAuthExpiresAt: string;
  lastOnlineLoginAt: string;
}

export interface NativeSidecarStatus {
  healthy: boolean;
  state: 'starting' | 'healthy' | 'restarting' | 'degraded';
  detail: string;
  port: number;
  url: string;
  version?: string | null;
  restart_attempts: number;
  sequence: number;
}

const SETUP_KEY = 'servaan.native.setup';
const SESSION_KEY = 'servaan.native.session';
const DEFAULT_OFFLINE_AUTH_DAYS = 7;
const DESKTOP_STORE = {
  nativeState: 'native.state'
} as const;
const DESKTOP_SETUP_KEY = 'setup';
const DESKTOP_SESSION_KEY = 'session';
const DESKTOP_ACTIVE_SESSION_KEY = 'active_session';

const defaultSetup: NativeDeviceSetup = {
  setupComplete: false,
  deviceName: 'دستگاه سروان',
  deviceProfile: 'manager',
  lastWorkspaceMode: 'manager'
};

let desktopSetupCache: NativeDeviceSetup = defaultSetup;
let desktopSessionCache: NativeOfflineSession | null = null;
let desktopSessionActiveCache = false;

export function isNativeRoute(pathname?: string): boolean {
  if (pathname) return pathname.startsWith('/native');
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/native');
}

export function getDefaultModeForProfile(
  profile: NativeDeviceProfile,
  role?: User['role']
): NativeWorkspaceMode {
  if (profile === 'pos_shared') return 'sales';
  if (profile === 'inventory') return 'inventory';
  if (profile === 'staff_mobile') return 'sales';
  if (role === 'ADMIN' || role === 'MANAGER') return 'manager';
  return 'sales';
}

export function getNativeDeviceSetup(): NativeDeviceSetup {
  if (isDesktopApp()) return desktopSetupCache;

  if (typeof window === 'undefined') return defaultSetup;
  const raw = localStorage.getItem(SETUP_KEY);
  if (!raw) return defaultSetup;

  try {
    return { ...defaultSetup, ...JSON.parse(raw) };
  } catch {
    return defaultSetup;
  }
}

export function saveNativeDeviceSetup(setup: NativeDeviceSetup): void {
  if (isDesktopApp()) {
    desktopSetupCache = setup;
    setDesktopStoreValue(DESKTOP_STORE.nativeState, DESKTOP_SETUP_KEY, setup).catch(() => undefined);
    return;
  }

  if (typeof window === 'undefined') return;
  localStorage.setItem(SETUP_KEY, JSON.stringify(setup));
}

export async function saveNativeDeviceSetupPersistent(setup: NativeDeviceSetup): Promise<void> {
  if (isDesktopApp()) {
    desktopSetupCache = setup;
    await setDesktopStoreValue(DESKTOP_STORE.nativeState, DESKTOP_SETUP_KEY, setup);
    return;
  }

  saveNativeDeviceSetup(setup);
}

export function markNativeSessionActive(): void {
  if (isDesktopApp()) {
    desktopSessionActiveCache = true;
    setDesktopStoreValue(DESKTOP_STORE.nativeState, DESKTOP_ACTIVE_SESSION_KEY, true).catch(() => undefined);
    return;
  }

  if (typeof window === 'undefined') return;
  localStorage.setItem(NATIVE_SESSION_KEY, 'true');
}

export async function markNativeSessionActivePersistent(): Promise<void> {
  if (isDesktopApp()) {
    desktopSessionActiveCache = true;
    await setDesktopStoreValue(DESKTOP_STORE.nativeState, DESKTOP_ACTIVE_SESSION_KEY, true);
    return;
  }

  markNativeSessionActive();
}

export function isNativeSessionActive(): boolean {
  if (isDesktopApp()) return desktopSessionActiveCache;

  if (typeof window === 'undefined') return false;
  return localStorage.getItem(NATIVE_SESSION_KEY) === 'true';
}

export function clearNativeSessionActive(): void {
  if (isDesktopApp()) {
    desktopSessionActiveCache = false;
    deleteDesktopStoreValue(DESKTOP_STORE.nativeState, DESKTOP_ACTIVE_SESSION_KEY).catch(() => undefined);
    return;
  }

  if (typeof window === 'undefined') return;
  localStorage.removeItem(NATIVE_SESSION_KEY);
}

export function rememberNativeOperationalRoute(route: string): void {
  if (route !== '/workspaces' && !route.startsWith('/workspaces/')) return;
  const setup = getNativeDeviceSetup();
  saveNativeDeviceSetup({ ...setup, lastOperationalRoute: route });
}

export function updateLastWorkspaceMode(mode: NativeWorkspaceMode): void {
  const setup = getNativeDeviceSetup();
  saveNativeDeviceSetup({ ...setup, lastWorkspaceMode: mode });
}

export function getNativeOfflineSession(): NativeOfflineSession | null {
  if (isDesktopApp()) return desktopSessionCache;

  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as NativeOfflineSession;
  } catch {
    return null;
  }
}

export function clearNativeOfflineSession(): void {
  if (isDesktopApp()) {
    desktopSessionCache = null;
    deleteDesktopStoreValue(DESKTOP_STORE.nativeState, DESKTOP_SESSION_KEY).catch(() => undefined);
    return;
  }

  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

export function saveNativeOfflineSession(user: User, token?: string): NativeOfflineSession {
  const session: NativeOfflineSession = {
    user,
    token,
    tenantId: user.tenantId,
    tenantSubdomain: user.tenantSubdomain,
    lastOnlineLoginAt: new Date().toISOString(),
    offlineAuthExpiresAt: new Date(Date.now() + DEFAULT_OFFLINE_AUTH_DAYS * 24 * 60 * 60 * 1000).toISOString()
  };

  if (isDesktopApp()) {
    desktopSessionCache = session;
    setDesktopStoreValue(DESKTOP_STORE.nativeState, DESKTOP_SESSION_KEY, session).catch(() => undefined);
  } else if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  return session;
}

export async function saveNativeOfflineSessionPersistent(user: User, token?: string): Promise<NativeOfflineSession> {
  const session: NativeOfflineSession = {
    user,
    token,
    tenantId: user.tenantId,
    tenantSubdomain: user.tenantSubdomain,
    lastOnlineLoginAt: new Date().toISOString(),
    offlineAuthExpiresAt: new Date(Date.now() + DEFAULT_OFFLINE_AUTH_DAYS * 24 * 60 * 60 * 1000).toISOString()
  };

  if (isDesktopApp()) {
    desktopSessionCache = session;
    await setDesktopStoreValue(DESKTOP_STORE.nativeState, DESKTOP_SESSION_KEY, session);
    return session;
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  return session;
}

export function nativeOfflineSessionIsValid(session: NativeOfflineSession | null): boolean {
  if (!session) return false;
  return new Date(session.offlineAuthExpiresAt).getTime() > Date.now();
}

export function wipeNativeDeviceState(): void {
  if (isDesktopApp()) {
    desktopSetupCache = defaultSetup;
    desktopSessionCache = null;
    desktopSessionActiveCache = false;
    Promise.all([
      deleteDesktopStoreValue(DESKTOP_STORE.nativeState, DESKTOP_SETUP_KEY),
      deleteDesktopStoreValue(DESKTOP_STORE.nativeState, DESKTOP_SESSION_KEY),
      deleteDesktopStoreValue(DESKTOP_STORE.nativeState, DESKTOP_ACTIVE_SESSION_KEY)
    ]).catch(() => undefined);
    return;
  }

  if (typeof window === 'undefined') return;
  localStorage.removeItem(SETUP_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(NATIVE_SESSION_KEY);
}

export async function hydrateNativeDeviceState(): Promise<void> {
  if (!isDesktopApp()) return;

  const [storedSetup, storedSession, storedActiveSession] = await Promise.all([
    getDesktopStoreValue<NativeDeviceSetup>(DESKTOP_STORE.nativeState, DESKTOP_SETUP_KEY),
    getDesktopStoreValue<NativeOfflineSession>(DESKTOP_STORE.nativeState, DESKTOP_SESSION_KEY),
    getDesktopStoreValue<boolean>(DESKTOP_STORE.nativeState, DESKTOP_ACTIVE_SESSION_KEY)
  ]);

  desktopSetupCache = storedSetup ? { ...defaultSetup, ...storedSetup } : defaultSetup;
  desktopSessionCache = storedSession || null;
  desktopSessionActiveCache = Boolean(storedActiveSession);
}

export async function createPinHash(pin: string, salt = createSalt()): Promise<{ salt: string; hash: string }> {
  const hash = await sha256(`${salt}:${pin}`);
  return { salt, hash };
}

export async function verifyPin(pin: string, salt?: string, hash?: string): Promise<boolean> {
  if (!salt || !hash) return false;
  return (await sha256(`${salt}:${pin}`)) === hash;
}

function createSalt(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function sha256(value: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  return btoa(unescape(encodeURIComponent(value)));
}
