import { canUseOfflineAuth, createOfflineAuthExpiry } from '../../services/offlineAuthCacheService';
import { localFirstStorage } from '../../services/localFirstStorageService';

jest.mock('../../services/localFirstStorageService', () => ({
  localFirstStorage: {
    getOfflineAuth: jest.fn()
  }
}));

describe('offline auth cache rules', () => {
  it('creates an expiry window in the future', () => {
    const expiry = createOfflineAuthExpiry(7);
    expect(new Date(expiry).getTime()).toBeGreaterThan(Date.now());
  });

  it('allows offline auth only before expiry', async () => {
    (localFirstStorage.getOfflineAuth as jest.Mock).mockResolvedValue({
      userId: 'user_1',
      tenantId: 'tenant_1',
      userName: 'Test User',
      role: 'STAFF',
      workspacePermissions: [],
      lastSuccessfulLoginAt: '2026-06-01T00:00:00.000Z',
      offlineAuthExpiresAt: '2026-06-15T00:00:00.000Z'
    });

    await expect(canUseOfflineAuth('user_1', new Date('2026-06-10T00:00:00.000Z'))).resolves.toBe(true);
    await expect(canUseOfflineAuth('user_1', new Date('2026-06-16T00:00:00.000Z'))).resolves.toBe(false);
  });
});
