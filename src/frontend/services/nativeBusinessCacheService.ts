import { API_URL, fetchWithTimeout, getTenantSubdomainHeader } from '../lib/apiUtils';
import {
  getLocalReadModelMeta,
  hasLocalReadModel,
  LocalReadModelKey,
  setLocalReadModel
} from './localReadModelService';
import { getToken } from './authService';
import { getNativeOfflineSession } from './nativeDeviceService';
import { getNativeOnlineLoginSnapshot } from './nativeAuthSnapshotService';

export type NativeCacheSeedStatus = 'fresh' | 'partial' | 'failed';

export interface NativeCacheSeedResult {
  status: NativeCacheSeedStatus;
  refreshed: LocalReadModelKey[];
  failed: Array<{ key: LocalReadModelKey; message: string }>;
  completedAt: string;
}

export interface NativeV1CacheReadiness {
  ready: boolean;
  missing: LocalReadModelKey[];
  updatedAt?: string;
}

const V1_REQUIRED_KEYS: LocalReadModelKey[] = [
  'sales.menu',
  'sales.tables',
  'sales.settings',
  'inventory.items',
  'inventory.current',
  'inventory.settings'
];

const CACHE_TARGETS: Array<{
  key: LocalReadModelKey;
  endpoint: string;
}> = [
  { key: 'sales.menu', endpoint: '/ordering/menu/full' },
  { key: 'sales.tables', endpoint: '/ordering/tables' },
  { key: 'sales.settings', endpoint: '/ordering/settings' },
  { key: 'inventory.items', endpoint: '/items' },
  { key: 'inventory.current', endpoint: '/inventory/current' },
  { key: 'inventory.settings', endpoint: '/inventory/settings' },
  { key: 'inventory.lowStock', endpoint: '/inventory/low-stock' },
  { key: 'inventory.entries', endpoint: '/inventory' }
];

export async function seedNativeV1BusinessCache(): Promise<NativeCacheSeedResult> {
  const refreshed: LocalReadModelKey[] = [];
  const failed: NativeCacheSeedResult['failed'] = [];
  const headers = await getNativeBusinessCacheHeaders();

  await Promise.all(
    CACHE_TARGETS.map(async (target) => {
      try {
        const value = await getFreshApiValue(target.endpoint, headers);
        await setLocalReadModel(target.key, value);
        refreshed.push(target.key);
      } catch (error) {
        failed.push({
          key: target.key,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    })
  );

  return {
    status: failed.length === 0 ? 'fresh' : refreshed.length > 0 ? 'partial' : 'failed',
    refreshed,
    failed,
    completedAt: new Date().toISOString()
  };
}

export async function getNativeV1CacheReadiness(): Promise<NativeV1CacheReadiness> {
  const checks = await Promise.all(
    V1_REQUIRED_KEYS.map(async (key) => ({
      key,
      exists: await hasLocalReadModel(key),
      meta: await getLocalReadModelMeta(key)
    }))
  );

  const missing = checks.filter((check) => !check.exists).map((check) => check.key);
  const updatedAtValues = checks
    .map((check) => check.meta?.updatedAt)
    .filter((value): value is string => Boolean(value))
    .sort();

  return {
    ready: missing.length === 0,
    missing,
    updatedAt: updatedAtValues[0]
  };
}

export function formatNativeCacheLastUpdated(updatedAt?: string): string {
  if (!updatedAt) return 'همگام‌سازی اولیه لازم است';

  try {
    return new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(updatedAt));
  } catch {
    return updatedAt;
  }
}

async function getNativeBusinessCacheHeaders(): Promise<HeadersInit> {
  const nativeSession = getNativeOfflineSession();
  const immediateToken = getToken() || nativeSession?.token;
  const immediateTenantSubdomain =
    nativeSession?.tenantSubdomain ||
    nativeSession?.user.tenantSubdomain ||
    getTenantSubdomainHeader();

  if (immediateToken) {
    return {
      Authorization: `Bearer ${immediateToken}`,
      'Content-Type': 'application/json',
      'X-Tenant-Subdomain': immediateTenantSubdomain
    };
  }

  const nativeSnapshot = await getNativeOnlineLoginSnapshot().catch(() => null);
  const token = nativeSnapshot?.token;
  const tenantSubdomain =
    nativeSnapshot?.tenantSubdomain ||
    nativeSnapshot?.user.tenantSubdomain ||
    immediateTenantSubdomain;

  if (!token) {
    throw new Error('توکن ورود برای همگام‌سازی پیدا نشد');
  }

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Tenant-Subdomain': tenantSubdomain
  };
}

async function getFreshApiValue<T = unknown>(endpoint: string, authHeaders: HeadersInit): Promise<T> {
  const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
    method: 'GET',
    headers: authHeaders,
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      typeof errorData === 'object' && errorData && 'message' in errorData
        ? String((errorData as { message?: unknown }).message)
        : `HTTP ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  return unwrapApiData<T>(data);
}

function unwrapApiData<T>(data: unknown): T {
  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    (data as { data?: unknown }).data !== undefined
  ) {
    return (data as { data: T }).data;
  }

  return data as T;
}
