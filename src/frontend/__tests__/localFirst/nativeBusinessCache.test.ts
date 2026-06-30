import {
  formatNativeCacheLastUpdated,
  getNativeV1CacheReadiness,
  seedNativeV1BusinessCache
} from '../../services/nativeBusinessCacheService';
import { fetchWithTimeout } from '../../lib/apiUtils';
import {
  getLocalReadModelMeta,
  hasLocalReadModel,
  setLocalReadModel
} from '../../services/localReadModelService';
import { getToken } from '../../services/authService';
import { getNativeOfflineSession } from '../../services/nativeDeviceService';
import { getNativeOnlineLoginSnapshot } from '../../services/nativeAuthSnapshotService';

jest.mock('../../services/authService', () => ({
  getToken: jest.fn(() => 'token')
}));

jest.mock('../../services/nativeDeviceService', () => ({
  getNativeOfflineSession: jest.fn(() => null)
}));

jest.mock('../../services/nativeAuthSnapshotService', () => ({
  getNativeOnlineLoginSnapshot: jest.fn(() => Promise.resolve(null))
}));

jest.mock('../../lib/apiUtils', () => ({
  API_URL: 'http://localhost:3001/api',
  fetchWithTimeout: jest.fn(),
  getTenantSubdomainHeader: jest.fn(() => 'dima')
}));

jest.mock('../../services/localReadModelService', () => ({
  getLocalReadModelMeta: jest.fn(),
  hasLocalReadModel: jest.fn(),
  setLocalReadModel: jest.fn()
}));

const fetchWithTimeoutMock = fetchWithTimeout as jest.Mock;
const setLocalReadModelMock = setLocalReadModel as jest.Mock;
const hasLocalReadModelMock = hasLocalReadModel as jest.Mock;
const getLocalReadModelMetaMock = getLocalReadModelMeta as jest.Mock;
const getTokenMock = getToken as jest.Mock;
const getNativeOfflineSessionMock = getNativeOfflineSession as jest.Mock;
const getNativeOnlineLoginSnapshotMock = getNativeOnlineLoginSnapshot as jest.Mock;

function jsonResponse(data: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    json: jest.fn().mockResolvedValue(data)
  };
}

describe('native V1 business cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getTokenMock.mockReturnValue('token');
    getNativeOfflineSessionMock.mockReturnValue(null);
    getNativeOnlineLoginSnapshotMock.mockResolvedValue(null);
  });

  it('silently seeds all V1 read models after online login', async () => {
    fetchWithTimeoutMock.mockResolvedValue(jsonResponse({ data: [] }));

    const result = await seedNativeV1BusinessCache();

    expect(result.status).toBe('fresh');
    expect(result.failed).toEqual([]);
    expect(setLocalReadModelMock).toHaveBeenCalledWith('sales.menu', []);
    expect(setLocalReadModelMock).toHaveBeenCalledWith('sales.tables', []);
    expect(setLocalReadModelMock).toHaveBeenCalledWith('sales.settings', []);
    expect(setLocalReadModelMock).toHaveBeenCalledWith('inventory.items', []);
    expect(setLocalReadModelMock).toHaveBeenCalledWith('inventory.current', []);
    expect(setLocalReadModelMock).toHaveBeenCalledWith('inventory.settings', []);
  });

  it('does not wait for the desktop snapshot when a fresh browser token exists', async () => {
    fetchWithTimeoutMock.mockResolvedValue(jsonResponse({ data: [] }));

    await seedNativeV1BusinessCache();

    expect(getNativeOnlineLoginSnapshotMock).not.toHaveBeenCalled();
    expect(fetchWithTimeoutMock).toHaveBeenCalledWith(
      expect.stringContaining('/ordering/menu/full'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token'
        })
      })
    );
    expect(fetchWithTimeoutMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.not.objectContaining({
          'Cache-Control': expect.anything(),
          Pragma: expect.anything()
        })
      })
    );
  });

  it('uses the native offline session token when browser auth storage is empty', async () => {
    getTokenMock.mockReturnValue(null);
    getNativeOfflineSessionMock.mockReturnValue({
      token: 'native-token',
      tenantSubdomain: 'dima',
      offlineAuthExpiresAt: '2026-07-04T12:00:00.000Z',
      lastOnlineLoginAt: '2026-06-27T12:00:00.000Z',
      user: {
        id: 'u1',
        email: 'manager@example.com',
        name: 'Manager',
        role: 'MANAGER',
        tenantSubdomain: 'dima'
      }
    });
    fetchWithTimeoutMock.mockResolvedValue(jsonResponse({ data: [] }));

    await seedNativeV1BusinessCache();

    expect(fetchWithTimeoutMock).toHaveBeenCalledWith(
      expect.stringContaining('/ordering/menu/full'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer native-token',
          'X-Tenant-Subdomain': 'dima'
        })
      })
    );
  });

  it('keeps successful cache writes when one refresh target fails', async () => {
    fetchWithTimeoutMock.mockImplementation((url: string) => {
      if (url.includes('/ordering/settings')) {
        return Promise.resolve(jsonResponse({ message: 'settings unavailable' }, false));
      }
      return Promise.resolve(jsonResponse({ data: [] }));
    });

    const result = await seedNativeV1BusinessCache();

    expect(result.status).toBe('partial');
    expect(result.failed).toEqual([
      { key: 'sales.settings', message: 'settings unavailable' }
    ]);
    expect(setLocalReadModelMock).toHaveBeenCalledWith('sales.menu', []);
  });

  it('reports missing required cache keys before offline work starts', async () => {
    hasLocalReadModelMock.mockImplementation((key: string) => Promise.resolve(key !== 'sales.menu'));
    getLocalReadModelMetaMock.mockResolvedValue({ key: 'inventory.items', updatedAt: '2026-06-27T12:00:00.000Z' });

    await expect(getNativeV1CacheReadiness()).resolves.toEqual({
      ready: false,
      missing: ['sales.menu'],
      updatedAt: '2026-06-27T12:00:00.000Z'
    });
  });

  it('formats a Persian last-updated label', () => {
    expect(formatNativeCacheLastUpdated('2026-06-27T12:00:00.000Z')).not.toBe('2026-06-27T12:00:00.000Z');
    expect(formatNativeCacheLastUpdated()).toBe('همگام‌سازی اولیه لازم است');
  });
});
