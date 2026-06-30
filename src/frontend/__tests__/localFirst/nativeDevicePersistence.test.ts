import {
  getNativeDeviceSetup,
  getNativeOfflineSession,
  hydrateNativeDeviceState,
  saveNativeDeviceSetupPersistent,
  saveNativeOfflineSessionPersistent
} from '../../services/nativeDeviceService';

const store = new Map<string, unknown>();

jest.mock('../../services/desktopBridgeService', () => ({
  deleteDesktopStoreValue: jest.fn(async (storeName: string, key: string) => {
    store.delete(`${storeName}:${key}`);
    return true;
  }),
  getDesktopStoreValue: jest.fn(async (_storeName: string, key: string) => {
    return store.get(`native.state:${key}`) || null;
  }),
  isDesktopApp: jest.fn(() => true),
  setDesktopStoreValue: jest.fn(async (storeName: string, key: string, value: unknown) => {
    store.set(`${storeName}:${key}`, value);
    return true;
  })
}));

describe('native desktop persistence', () => {
  beforeEach(() => {
    store.clear();
  });

  it('persists setup and offline session for desktop hydration', async () => {
    const setup = {
      setupComplete: true,
      deviceName: 'Smoke Test Device',
      deviceProfile: 'manager' as const,
      lastWorkspaceMode: 'manager' as const,
      pinSalt: 'salt',
      pinHash: 'hash',
      completedAt: '2026-06-12T00:00:00.000Z'
    };

    const user = {
      id: 'user_1',
      name: 'Smoke Tester',
      email: 'smoke@example.com',
      role: 'MANAGER' as const,
      tenantId: 'tenant_1',
      tenantSubdomain: 'dima',
      active: true,
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z'
    };

    await saveNativeDeviceSetupPersistent(setup);
    await saveNativeOfflineSessionPersistent(user, 'token_1');
    await hydrateNativeDeviceState();

    expect(getNativeDeviceSetup()).toMatchObject({
      setupComplete: true,
      deviceName: 'Smoke Test Device',
      pinHash: 'hash'
    });
    expect(getNativeOfflineSession()?.user.email).toBe('smoke@example.com');
  });
});
