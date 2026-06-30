const enqueueSalesOrder = jest.fn();
const enqueueOfflinePayment = jest.fn();

jest.mock('../../services/localFirstSyncService', () => ({
  localFirstSyncService: {
    enqueueSalesOrder,
    enqueueOfflinePayment,
    enqueueDangerousAction: jest.fn(),
    enqueueMasterDataDraft: jest.fn()
  }
}));

jest.mock('../../services/offlineApiService', () => ({
  OfflineQueuedError: class OfflineQueuedError extends Error {},
  offlineApiService: {
    request: jest.fn()
  }
}));

jest.mock('../../lib/apiUtils', () => ({
  API_URL: 'http://localhost:3001/api',
  fetchWithTimeout: jest.fn(() => Promise.reject(new Error('Failed to fetch')))
}));

describe('ordering offline writes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false
    });
  });

  it('queues POS orders through the shared local-first queue while offline', async () => {
    enqueueSalesOrder.mockResolvedValue({
      entityLocalId: 'local_order_1',
      localNumber: 'OFFLINE-1',
      createdOfflineAt: '2026-06-27T12:00:00.000Z'
    });

    const { OrderService } = await import('../../services/orderingService');
    const order = await OrderService.createOrder({
      orderType: 'DINE_IN',
      items: [{ itemId: 'menu_1', quantity: 1 }]
    } as any);

    expect(enqueueSalesOrder).toHaveBeenCalledWith({
      orderType: 'DINE_IN',
      items: [{ itemId: 'menu_1', quantity: 1 }]
    });
    expect(order).toMatchObject({
      order: {
        id: 'local_order_1',
        orderNumber: 'OFFLINE-1',
        paymentStatus: 'PENDING'
      },
      stockValidation: {
        hasWarnings: false,
        overrideRequired: false
      }
    });
  });

  it('records only cash/manual-card payment evidence through the shared queue', async () => {
    enqueueOfflinePayment.mockResolvedValue({
      entityLocalId: 'local_payment_1',
      localNumber: 'OFFLINE-RECEIPT-1'
    });

    const { PaymentService } = await import('../../services/orderingService');
    const payment = await PaymentService.processPayment({
      orderId: 'local_order_1',
      amount: 500000,
      paymentMethod: 'CARD'
    } as any);

    expect(enqueueOfflinePayment).toHaveBeenCalledWith({
      orderId: 'local_order_1',
      amount: 500000,
      paymentMethod: 'CARD'
    });
    expect(payment).toMatchObject({
      success: true,
      data: {
        id: 'local_payment_1',
        paymentNumber: 'OFFLINE-RECEIPT-1',
        verificationStatus: 'OFFLINE_RECORDED',
        isOfflineRecorded: true
      }
    });
  });
});
