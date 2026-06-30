import { OfflineAuthCacheEntry } from '../../shared/localFirst';
import { localFirstStorage } from './localFirstStorageService';

const DEFAULT_OFFLINE_AUTH_DAYS = 7;

export function createOfflineAuthExpiry(days = DEFAULT_OFFLINE_AUTH_DAYS): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export async function cacheOnlineLogin(user: {
  id: string;
  name?: string;
  email?: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  tenantId?: string;
  tenant?: { id?: string };
  workspaces?: string[];
}): Promise<OfflineAuthCacheEntry | null> {
  const tenantId = user.tenantId || user.tenant?.id;
  if (!user.id || !tenantId) return null;

  const entry: OfflineAuthCacheEntry = {
    userId: user.id,
    tenantId,
    userName: user.name || user.email || user.id,
    role: user.role,
    workspacePermissions: user.workspaces || [],
    lastSuccessfulLoginAt: new Date().toISOString(),
    offlineAuthExpiresAt: createOfflineAuthExpiry()
  };

  await localFirstStorage.saveOfflineAuth(entry);
  return entry;
}

export async function canUseOfflineAuth(userId: string, now = new Date()): Promise<boolean> {
  const cachedAuth = await localFirstStorage.getOfflineAuth(userId);
  if (!cachedAuth) return false;
  return new Date(cachedAuth.offlineAuthExpiresAt) > now;
}
