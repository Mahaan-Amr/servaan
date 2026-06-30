import { User } from '../types';
import { UserWorkspaceAccess } from '../types/workspace';
import {
  deleteDesktopStoreValue,
  getDesktopStoreValue,
  isDesktopApp,
  setDesktopStoreValue
} from './desktopBridgeService';
import {
  getNativeDeviceSetup,
  NativeDeviceSetup,
  saveNativeOfflineSession
} from './nativeDeviceService';

const DESKTOP_STORE = {
  nativeState: 'native.state'
} as const;

const SNAPSHOT_KEY = 'online_login_snapshot';
const DEFAULT_OFFLINE_AUTH_DAYS = 7;

export interface NativeOnlineLoginSnapshot {
  user: User;
  token?: string;
  tenantId?: string;
  tenantSubdomain?: string;
  deviceSetup?: NativeDeviceSetup;
  workspaceAccess: UserWorkspaceAccess[];
  lastOnlineLoginAt: string;
  offlineAuthExpiresAt: string;
}

export function createOfflineAuthExpiresAt(): string {
  return new Date(Date.now() + DEFAULT_OFFLINE_AUTH_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function isNativeSnapshotValid(snapshot: NativeOnlineLoginSnapshot | null | undefined): boolean {
  if (!snapshot) return false;
  return new Date(snapshot.offlineAuthExpiresAt).getTime() > Date.now();
}

export async function cacheNativeOnlineLoginSnapshot(input: {
  user: User;
  token?: string;
  workspaceAccess?: UserWorkspaceAccess[];
}): Promise<NativeOnlineLoginSnapshot | null> {
  if (!isDesktopApp()) return null;

  const existing = await getNativeOnlineLoginSnapshot();
  const offlineAuthExpiresAt = existing?.offlineAuthExpiresAt || createOfflineAuthExpiresAt();
  const snapshot: NativeOnlineLoginSnapshot = {
    user: input.user,
    token: input.token,
    tenantId: input.user.tenantId,
    tenantSubdomain: input.user.tenantSubdomain,
    deviceSetup: getNativeDeviceSetup(),
    workspaceAccess: input.workspaceAccess || existing?.workspaceAccess || [],
    lastOnlineLoginAt: new Date().toISOString(),
    offlineAuthExpiresAt
  };

  await setDesktopStoreValue(DESKTOP_STORE.nativeState, SNAPSHOT_KEY, snapshot);
  saveNativeOfflineSession(input.user, input.token);
  return snapshot;
}

export async function cacheNativeWorkspaceAccessSnapshot(
  user: User,
  workspaceAccess: UserWorkspaceAccess[],
  token?: string
): Promise<NativeOnlineLoginSnapshot | null> {
  return cacheNativeOnlineLoginSnapshot({ user, token, workspaceAccess });
}

export async function getNativeOnlineLoginSnapshot(): Promise<NativeOnlineLoginSnapshot | null> {
  if (!isDesktopApp()) return null;
  return getDesktopStoreValue<NativeOnlineLoginSnapshot>(DESKTOP_STORE.nativeState, SNAPSHOT_KEY);
}

export async function clearNativeOnlineLoginSnapshot(): Promise<void> {
  if (!isDesktopApp()) return;
  await deleteDesktopStoreValue(DESKTOP_STORE.nativeState, SNAPSHOT_KEY);
}

export async function updateNativeSnapshotDeviceSetup(
  deviceSetup: NativeDeviceSetup
): Promise<NativeOnlineLoginSnapshot | null> {
  if (!isDesktopApp()) return null;

  const existing = await getNativeOnlineLoginSnapshot();
  if (!existing) return null;

  const snapshot: NativeOnlineLoginSnapshot = {
    ...existing,
    deviceSetup
  };

  await setDesktopStoreValue(DESKTOP_STORE.nativeState, SNAPSHOT_KEY, snapshot);
  return snapshot;
}

export async function getValidNativeWorkspaceAccessSnapshot(
  userId: string
): Promise<UserWorkspaceAccess[] | null> {
  const snapshot = await getNativeOnlineLoginSnapshot();
  if (!snapshot || !isNativeSnapshotValid(snapshot)) return null;
  if (snapshot.user.id !== userId) return null;
  if (!Array.isArray(snapshot.workspaceAccess) || snapshot.workspaceAccess.length === 0) return null;
  return snapshot.workspaceAccess;
}
