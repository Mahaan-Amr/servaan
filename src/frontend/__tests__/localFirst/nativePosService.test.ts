const isDesktopApp = jest.fn();
const printDesktopReceiptText = jest.fn();
const getLocalReadModel = jest.fn();
const getLocalReadModelMeta = jest.fn();
const getNativeOnlineLoginSnapshot = jest.fn();
const isNativeSnapshotValid = jest.fn();
const enqueueSalesOrder = jest.fn();
const enqueueOfflinePayment = jest.fn();
const enqueueOfflineReceiptPrinted = jest.fn();
const getIssueSummary = jest.fn();

jest.mock('../../services/desktopBridgeService', () => ({
  isDesktopApp,
  printDesktopReceiptText
}));

jest.mock('../../services/localReadModelService', () => ({
  getLocalReadModel,
  getLocalReadModelMeta
}));

jest.mock('../../services/nativeAuthSnapshotService', () => ({
  getNativeOnlineLoginSnapshot,
  isNativeSnapshotValid
}));

jest.mock('../../services/localFirstSyncService', () => ({
  localFirstSyncService: {
    enqueueSalesOrder,
    enqueueOfflinePayment,
    enqueueOfflineReceiptPrinted,
    getIssueSummary
  }
}));

const issueSummary = {
  pendingCount: 0,
  failedCount: 0,
  conflictedCount: 0,
  waitingForDependencyCount: 0
};

function mockReadModels() {
  getLocalReadModel.mockImplementation((key: string) => {
    if (key === 'sales.menu') {
      return Promise.resolve({
        key,
        updatedAt: '2026-06-30T08:00:00.000Z',
        value: [
          {
            id: 'cat-1',
            name: 'Coffee',
            isActive: true,
            displayOrder: 1,
            items: [
              {
                id: 'menu-1',
                displayName: 'Espresso',
                menuPrice: '45000',
                isActive: true,
                isAvailable: true,
                displayOrder: 1
              }
            ]
          }
        ]
      });
    }

    if (key === 'sales.tables') {
      return Promise.resolve({
        key,
        updatedAt: '2026-06-30T08:01:00.000Z',
        value: [
          {
            id: 'table-1',
            tableNumber: '1',
            tableName: 'Table 1',
            status: 'AVAILABLE',
            isActive: true
          }
        ]
      });
    }

    if (key === 'sales.settings') {
      return Promise.resolve({
        key,
        updatedAt: '2026-06-30T08:02:00.000Z',
        value: {
          id: 'settings-1',
          tenantId: 'tenant-1',
          orderCreationEnabled: true,
          lockItemsWithoutStock: false,
          requireManagerConfirmationForNoStock: false,
          createdAt: '2026-06-30T08:00:00.000Z',
          updatedAt: '2026-06-30T08:02:00.000Z'
        }
      });
    }

    return Promise.resolve(null);
  });

  getLocalReadModelMeta.mockImplementation((key: string) =>
    Promise.resolve({
      key,
      updatedAt: key === 'sales.menu' ? '2026-06-30T08:00:00.000Z' : '2026-06-30T08:02:00.000Z'
    })
  );
}

describe('native POS service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isDesktopApp.mockReturnValue(true);
    getNativeOnlineLoginSnapshot.mockResolvedValue({
      offlineAuthExpiresAt: '2026-07-07T08:00:00.000Z'
    });
    isNativeSnapshotValid.mockReturnValue(true);
    getIssueSummary.mockResolvedValue(issueSummary);
    printDesktopReceiptText.mockResolvedValue(true);
    enqueueOfflineReceiptPrinted.mockResolvedValue({
      localOperationId: 'local_receipt_1',
      localNumber: 'RCPT-AUDIT-1'
    });
    mockReadModels();
  });

  it('reports missing cache before exposing POS data', async () => {
    getLocalReadModel.mockImplementation((key: string) => {
      if (key === 'sales.menu') return Promise.resolve(null);
      return Promise.resolve({ key, updatedAt: '2026-06-30T08:00:00.000Z', value: key === 'sales.settings' ? {} : [] });
    });

    const { loadNativePosSnapshot } = await import('../../features/native-pos/nativePosService');
    const snapshot = await loadNativePosSnapshot();

    expect(snapshot.readiness).toMatchObject({
      kind: 'missing-cache',
      missing: ['sales.menu']
    });
    expect(snapshot.categories).toEqual([]);
  });

  it('blocks native POS when offline auth is expired', async () => {
    isNativeSnapshotValid.mockReturnValue(false);
    getNativeOnlineLoginSnapshot.mockResolvedValue({
      offlineAuthExpiresAt: '2026-06-01T08:00:00.000Z'
    });

    const { loadNativePosSnapshot } = await import('../../features/native-pos/nativePosService');
    const snapshot = await loadNativePosSnapshot();

    expect(snapshot.readiness).toMatchObject({
      kind: 'offline-auth-expired',
      expiresAt: '2026-06-01T08:00:00.000Z'
    });
    expect(getLocalReadModel).not.toHaveBeenCalledWith('sales.menu');
  });

  it('normalizes cached menu and table data for the native UI', async () => {
    const { loadNativePosSnapshot } = await import('../../features/native-pos/nativePosService');
    const snapshot = await loadNativePosSnapshot();

    expect(snapshot.readiness).toMatchObject({
      kind: 'ready',
      updatedAt: '2026-06-30T08:00:00.000Z'
    });
    expect(snapshot.categories[0].items[0]).toMatchObject({
      id: 'menu-1',
      name: 'Espresso',
      price: 45000,
      available: true
    });
    expect(snapshot.tables).toEqual([
      {
        id: 'table-1',
        label: 'Table 1',
        status: 'AVAILABLE'
      }
    ]);
  });

  it('queues one order plus one full manual-card payment without printing when no printer is configured', async () => {
    enqueueSalesOrder.mockResolvedValue({
      entityLocalId: 'local_order_1',
      localNumber: 'OFF-1'
    });
    enqueueOfflinePayment.mockResolvedValue({
      entityLocalId: 'local_payment_1',
      localNumber: 'RCPT-1'
    });

    const { submitNativePosPaidOrder } = await import('../../features/native-pos/nativePosService');
    const result = await submitNativePosPaidOrder({
      orderType: 'DINE_IN',
      tableId: 'table-1',
      items: [
        {
          itemId: 'menu-1',
          itemName: 'Espresso',
          unitPrice: 45000,
          quantity: 2,
          total: 90000
        }
      ],
      payment: {
        method: 'manual-card',
        amount: 90000,
        manualCard: {
          terminalId: 'terminal-1',
          transactionRef: 'ref-1'
        }
      }
    });

    expect(enqueueSalesOrder).toHaveBeenCalledWith({
      orderType: 'DINE_IN',
      tableId: 'table-1',
      guestCount: undefined,
      customerName: undefined,
      customerPhone: undefined,
      notes: undefined,
      items: [
        {
          itemId: 'menu-1',
          quantity: 2,
          specialRequest: undefined
        }
      ]
    });
    expect(enqueueOfflinePayment).toHaveBeenCalledWith({
      orderId: 'local_order_1',
      amount: 90000,
      paymentMethod: 'CARD',
      cashReceived: undefined,
      cardInfo: {
        terminalId: 'terminal-1',
        transactionRef: 'ref-1',
        cardMask: undefined
      }
    });
    expect(result).toMatchObject({
      orderLocalId: 'local_order_1',
      paymentLocalId: 'local_payment_1',
      orderNumber: 'OFF-1',
      paymentNumber: 'RCPT-1',
      receipt: {
        status: 'not_configured'
      }
    });
    expect(printDesktopReceiptText).not.toHaveBeenCalled();
    expect(enqueueOfflineReceiptPrinted).not.toHaveBeenCalled();
  });

  it('prints a native receipt and queues the receipt audit flag after sale/payment are queued', async () => {
    enqueueSalesOrder.mockResolvedValue({
      entityLocalId: 'local_order_1',
      localNumber: 'OFF-1'
    });
    enqueueOfflinePayment.mockResolvedValue({
      entityLocalId: 'local_payment_1',
      localNumber: 'RCPT-1'
    });

    const { submitNativePosPaidOrder } = await import('../../features/native-pos/nativePosService');
    const result = await submitNativePosPaidOrder({
      orderType: 'TAKEAWAY',
      items: [
        {
          itemId: 'menu-1',
          itemName: 'Espresso',
          unitPrice: 45000,
          quantity: 1,
          total: 45000
        }
      ],
      payment: {
        method: 'cash',
        amount: 45000
      },
      receipt: {
        printerName: 'U80 USB',
        businessName: 'Pilot Cafe',
        printedAt: '2026-07-04T10:00:00.000Z'
      }
    });

    expect(printDesktopReceiptText).toHaveBeenCalledWith(expect.stringContaining('Pending Sync'), 'U80 USB');
    expect(printDesktopReceiptText).toHaveBeenCalledWith(expect.stringContaining('OFF-1'), 'U80 USB');
    expect(printDesktopReceiptText).toHaveBeenCalledWith(expect.stringContaining('RCPT-1'), 'U80 USB');
    expect(enqueueOfflineReceiptPrinted).toHaveBeenCalledWith('local_order_1', expect.any(Date));
    expect(result.receipt).toMatchObject({
      status: 'printed',
      printerName: 'U80 USB',
      auditOperation: {
        localOperationId: 'local_receipt_1'
      }
    });
  });

  it('keeps the queued sale/payment when receipt printing fails', async () => {
    enqueueSalesOrder.mockResolvedValue({
      entityLocalId: 'local_order_1',
      localNumber: 'OFF-1'
    });
    enqueueOfflinePayment.mockResolvedValue({
      entityLocalId: 'local_payment_1',
      localNumber: 'RCPT-1'
    });
    printDesktopReceiptText.mockRejectedValue(new Error('USB printer offline'));

    const { submitNativePosPaidOrder } = await import('../../features/native-pos/nativePosService');
    const result = await submitNativePosPaidOrder({
      orderType: 'TAKEAWAY',
      items: [
        {
          itemId: 'menu-1',
          itemName: 'Espresso',
          unitPrice: 45000,
          quantity: 1,
          total: 45000
        }
      ],
      payment: {
        method: 'cash',
        amount: 45000
      },
      receipt: {
        printerName: 'U80 USB'
      }
    });

    expect(result).toMatchObject({
      orderLocalId: 'local_order_1',
      paymentLocalId: 'local_payment_1',
      receipt: {
        status: 'failed',
        printerName: 'U80 USB',
        errorMessage: 'USB printer offline'
      }
    });
    expect(enqueueOfflineReceiptPrinted).not.toHaveBeenCalled();
  });

  it('rejects empty carts and delivery orders in V1', async () => {
    const { submitNativePosPaidOrder } = await import('../../features/native-pos/nativePosService');

    await expect(
      submitNativePosPaidOrder({
        orderType: 'TAKEAWAY',
        items: [],
        payment: { method: 'cash', amount: 0 }
      })
    ).rejects.toThrow('Order cart is empty.');

    await expect(
      submitNativePosPaidOrder({
        orderType: 'DELIVERY' as never,
        items: [
          {
            itemId: 'menu-1',
            itemName: 'Espresso',
            unitPrice: 45000,
            quantity: 1,
            total: 45000
          }
        ],
        payment: { method: 'cash', amount: 45000 }
      })
    ).rejects.toThrow('Native POS V1 supports only dine-in and takeaway orders.');
  });
});
