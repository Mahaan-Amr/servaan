import { buildNativeDiagnosticsExport } from '../../features/native-sync/nativeDiagnosticsExport';
import type { NativeSyncIssueGroup } from '../../features/native-sync/nativeSyncIssues';

const syncGroups: NativeSyncIssueGroup[] = [
  {
    key: 'attention',
    title: 'نیازمند توجه',
    description: 'ناموفق',
    rows: [
      {
        id: 'local_op_123',
        group: 'attention',
        operationType: 'sales.payment.record_offline',
        status: 'failed',
        typeLabel: 'پرداخت آفلاین',
        statusLabel: 'ناموفق',
        localNumber: 'PAY-OFF-1',
        createdAt: '2026-07-01T08:30:00.000Z',
        primaryText: 'پرداخت نقدی',
        secondaryText: '۱۲۰٬۰۰۰ تومان، برای سفارش local_order_1',
        dependencyCount: 1,
        dependencyState: 'waiting_for_parent',
        error: {
          code: 'NETWORK',
          messagePreview: 'اتصال برقرار نشد',
          hasFullMessage: false
        },
        errorText: 'NETWORK: اتصال برقرار نشد',
        helperText: 'با تلاش دوباره، همگام‌سازی این عملیات دوباره بررسی می‌شود.'
      }
    ]
  },
  {
    key: 'pending',
    title: 'در انتظار همگام‌سازی',
    description: 'هنوز فقط روی این دستگاه ثبت شده است',
    rows: []
  },
  {
    key: 'syncing',
    title: 'در حال همگام‌سازی',
    description: 'در تلاش جاری برای ارسال به سرور',
    rows: []
  }
];

describe('native diagnostics export', () => {
  it('builds an operator-safe redacted payload with sync summaries and cache context', () => {
    const payload = buildNativeDiagnosticsExport({
      exportedAt: '2026-07-01T09:00:00.000Z',
      appVersion: '0.1.0',
      device: {
        setupComplete: true,
        deviceName: 'صندوق اصلی',
        deviceProfile: 'pos_shared',
        lastWorkspaceMode: 'sales',
        printerName: 'receipt-printer',
        pinHash: 'must-not-export',
        pinSalt: 'must-not-export'
      },
      user: {
        id: 'user_1',
        role: 'STAFF',
        tenantId: 'tenant_1'
      },
      cacheReadiness: {
        ready: false,
        missing: ['sales.menu'],
        updatedAt: '2026-07-01T08:00:00.000Z'
      },
      issueSummary: {
        pendingCount: 1,
        failedCount: 1,
        conflictedCount: 0,
        waitingForDependencyCount: 1
      },
      syncGroups
    });

    expect(payload.exportType).toBe('operator_redacted_diagnostics');
    expect(payload.redaction.rawPayloadsIncluded).toBe(false);
    expect(payload.redaction.authSecretsIncluded).toBe(false);
    expect(payload.device).toEqual({
      deviceName: 'صندوق اصلی',
      deviceProfile: 'pos_shared',
      setupComplete: true,
      lastWorkspaceMode: 'sales',
      printerConfigured: true
    });
    expect(payload.cache).toEqual({
      ready: false,
      missingKeys: ['sales.menu'],
      updatedAt: '2026-07-01T08:00:00.000Z'
    });
    expect(payload.sync.unsyncedOperationCount).toBe(1);
    expect(payload.sync.groups[0].rows[0]).toMatchObject({
      localOperationId: 'local_op_123',
      operationType: 'sales.payment.record_offline',
      dependencyCount: 1,
      dependencyState: 'waiting_for_parent',
      error: {
        code: 'NETWORK',
        messagePreview: 'اتصال برقرار نشد'
      }
    });

    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain('must-not-export');
    expect(serialized).not.toContain('pinHash');
    expect(serialized).not.toContain('pinSalt');
    expect(serialized).not.toContain('payload');
    expect(serialized).not.toContain('errorText');
    expect(serialized).not.toContain('receipt-printer');
  });
});
