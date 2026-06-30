import { Prisma, PrismaClient } from '../../../shared/generated/client';
import { OrderService } from './orderService';
import { prisma } from './dbService';
import {
  AcceptedOperation,
  ConflictedOperation,
  EntityMapping,
  LocalOperation,
  RejectedOperation,
  SyncPushResponse
} from '../../../shared/localFirst';

const SUPPORTED_PROTOCOL_VERSION = 1;

type Tx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface RegisterDeviceInput {
  tenantId: string;
  userId: string;
  deviceId: string;
  name: string;
  platform?: string;
  appVersion?: string;
  syncProtocolVersion?: number;
  localSchemaVersion?: number;
  mode?: string;
}

export class LocalFirstSyncService {
  static async registerDevice(input: RegisterDeviceInput) {
    const offlineAuthExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return prisma.offlineDevice.upsert({
      where: {
        tenantId_deviceId: {
          tenantId: input.tenantId,
          deviceId: input.deviceId
        }
      },
      update: {
        name: input.name,
        platform: input.platform || 'web',
        appVersion: input.appVersion,
        syncProtocolVersion: input.syncProtocolVersion || SUPPORTED_PROTOCOL_VERSION,
        localSchemaVersion: input.localSchemaVersion || 1,
        mode: input.mode || 'personal',
        assignedUserId: input.mode === 'shared' ? undefined : input.userId,
        lastOnlineAt: new Date(),
        offlineAuthExpiresAt,
        isActive: true
      },
      create: {
        tenantId: input.tenantId,
        deviceId: input.deviceId,
        name: input.name,
        platform: input.platform || 'web',
        appVersion: input.appVersion,
        syncProtocolVersion: input.syncProtocolVersion || SUPPORTED_PROTOCOL_VERSION,
        localSchemaVersion: input.localSchemaVersion || 1,
        mode: input.mode || 'personal',
        assignedUserId: input.mode === 'shared' ? undefined : input.userId,
        lastOnlineAt: new Date(),
        offlineAuthExpiresAt
      }
    });
  }

  static async pushOperations(params: {
    tenantId: string;
    actorUserId: string;
    deviceId: string;
    operations: LocalOperation[];
    protocolVersion?: number;
    batchId?: string;
  }): Promise<SyncPushResponse> {
    const protocolVersion = params.protocolVersion || SUPPORTED_PROTOCOL_VERSION;
    const syncBatchId = params.batchId || `sync_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    if (protocolVersion !== SUPPORTED_PROTOCOL_VERSION) {
      return {
        accepted: [],
        rejected: [],
        conflicted: [],
        entityMappings: [],
        requiredUpgrade: true,
        newCursor: new Date().toISOString()
      };
    }

    const device = await prisma.offlineDevice.findUnique({
      where: {
        tenantId_deviceId: {
          tenantId: params.tenantId,
          deviceId: params.deviceId
        }
      }
    });

    if (!device) {
      return {
        accepted: [],
        rejected: params.operations.map((operation) => ({
          localOperationId: operation.localOperationId,
          errorCode: 'DEVICE_NOT_REGISTERED',
          errorMessage: 'Device must be registered before sync.'
        })),
        conflicted: [],
        entityMappings: [],
        newCursor: new Date().toISOString()
      };
    }

    if (device.revokedAt || !device.isActive) {
      return {
        accepted: [],
        rejected: [],
        conflicted: [],
        entityMappings: [],
        revoked: true,
        newCursor: new Date().toISOString()
      };
    }

    const accepted: AcceptedOperation[] = [];
    const rejected: RejectedOperation[] = [];
    const conflicted: ConflictedOperation[] = [];
    const entityMappings: EntityMapping[] = [];

    for (const operation of params.operations) {
      if (operation.tenantId !== params.tenantId || operation.deviceId !== params.deviceId) {
        rejected.push({
          localOperationId: operation.localOperationId,
          errorCode: 'OPERATION_SCOPE_MISMATCH',
          errorMessage: 'Operation tenant/device does not match sync request.'
        });
        continue;
      }

      const previous = await prisma.syncOperation.findUnique({
        where: {
          tenantId_deviceId_localOperationId: {
            tenantId: params.tenantId,
            deviceId: params.deviceId,
            localOperationId: operation.localOperationId
          }
        }
      });

      if (previous) {
        if (previous.status === 'accepted') {
          accepted.push({
            localOperationId: previous.localOperationId,
            entityType: previous.entityType,
            entityLocalId: previous.entityLocalId || undefined,
            entityServerId: previous.entityServerId || undefined
          });
          if (previous.entityLocalId && previous.entityServerId) {
            entityMappings.push({
              entityType: previous.entityType,
              localId: previous.entityLocalId,
              serverId: previous.entityServerId
            });
          }
        } else if (previous.status === 'conflicted') {
          conflicted.push({
            localOperationId: previous.localOperationId,
            reason: previous.errorMessage || 'Operation is conflicted.'
          });
        } else {
          rejected.push({
            localOperationId: previous.localOperationId,
            errorCode: previous.errorCode || 'PREVIOUSLY_REJECTED',
            errorMessage: previous.errorMessage || 'Operation was previously rejected.'
          });
        }
        continue;
      }

      try {
        const result = await this.applyOperation(operation, params.tenantId);
        await this.recordOperation(operation, params.tenantId, syncBatchId, 'accepted', result.entityServerId);
        accepted.push({
          localOperationId: operation.localOperationId,
          entityType: operation.entityType,
          entityLocalId: operation.entityLocalId,
          entityServerId: result.entityServerId
        });
        if (operation.entityLocalId && result.entityServerId) {
          entityMappings.push({
            entityType: operation.entityType,
            localId: operation.entityLocalId,
            serverId: result.entityServerId
          });
        }
      } catch (error) {
        const syncError = normalizeSyncError(error);

        if (syncError.conflict) {
          const conflict = await prisma.syncConflict.create({
            data: {
              tenantId: params.tenantId,
              deviceId: params.deviceId,
              localOperationId: operation.localOperationId,
              syncBatchId,
              workspaceId: operation.workspaceId,
              entityType: operation.entityType,
              entityLocalId: operation.entityLocalId,
              entityServerId: operation.entityServerId,
              conflictType: syncError.code,
              reason: syncError.message,
              localPayload: operation.payload as Prisma.InputJsonValue,
              actorUserId: operation.actorUserId,
              createdOfflineAt: new Date(operation.createdOfflineAt)
            }
          });

          await this.recordOperation(operation, params.tenantId, syncBatchId, 'conflicted', undefined, syncError.code, syncError.message);
          conflicted.push({
            localOperationId: operation.localOperationId,
            conflictId: conflict.id,
            reason: syncError.message
          });
        } else {
          await this.recordOperation(operation, params.tenantId, syncBatchId, 'rejected', undefined, syncError.code, syncError.message);
          rejected.push({
            localOperationId: operation.localOperationId,
            errorCode: syncError.code,
            errorMessage: syncError.message
          });
        }
      }
    }

    await prisma.offlineDevice.update({
      where: {
        tenantId_deviceId: {
          tenantId: params.tenantId,
          deviceId: params.deviceId
        }
      },
      data: {
        lastOnlineAt: new Date(),
        lastSyncAt: new Date()
      }
    });

    return {
      accepted,
      rejected,
      conflicted,
      entityMappings,
      newCursor: new Date().toISOString()
    };
  }

  static async getSyncIssues(tenantId: string, deviceId?: string) {
    const [operations, conflicts] = await Promise.all([
      prisma.syncOperation.findMany({
        where: {
          tenantId,
          ...(deviceId ? { deviceId } : {}),
          status: { in: ['rejected', 'conflicted'] }
        },
        orderBy: { updatedAt: 'desc' },
        take: 100
      }),
      prisma.syncConflict.findMany({
        where: {
          tenantId,
          ...(deviceId ? { deviceId } : {}),
          status: 'open'
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    ]);

    return { operations, conflicts };
  }

  private static async applyOperation(operation: LocalOperation, tenantId: string): Promise<{ entityServerId?: string }> {
    switch (operation.operationType) {
      case 'inventory.entry.create':
        return this.applyInventoryEntryCreate(operation, tenantId);
      case 'sales.order.create':
        return this.applySalesOrderCreate(operation, tenantId);
      case 'sales.payment.record_offline':
        return this.applyOfflinePayment(operation, tenantId);
      case 'sales.receipt.mark_printed_offline':
        return this.applyOfflineReceiptFlag(operation, tenantId);
      case 'master_data.upsert_draft':
        throw syncConflict('MASTER_DATA_REQUIRES_REVIEW', 'Master data changes require manager resolution.');
      case 'dangerous.action.request_approval':
        throw syncConflict('DANGEROUS_ACTION_REQUIRES_APPROVAL', 'Dangerous actions require manager approval.');
      default:
        throw syncReject('UNSUPPORTED_OPERATION', `Unsupported offline operation: ${operation.operationType}`);
    }
  }

  private static async applyInventoryEntryCreate(operation: LocalOperation, tenantId: string): Promise<{ entityServerId?: string }> {
    const payload = operation.payload as any;
    const quantity = Number(payload.quantity);

    if (!payload.itemId || !Number.isFinite(quantity) || quantity <= 0 || !['IN', 'OUT'].includes(payload.type)) {
      throw syncReject('INVALID_INVENTORY_ENTRY', 'Inventory entry payload is invalid.');
    }

    const entryQuantity = payload.type === 'OUT' ? -quantity : quantity;

    const entry = await prisma.inventoryEntry.create({
      data: {
        tenantId,
        itemId: payload.itemId,
        quantity: entryQuantity,
        type: payload.type,
        note: payload.note,
        userId: operation.actorUserId,
        unitPrice: payload.unitPrice,
        batchNumber: payload.batchNumber,
        expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : undefined,
        sourceDeviceId: operation.deviceId,
        sourceLocalOperationId: operation.localOperationId,
        sourceLocalNumber: operation.localNumber
      }
    });

    return { entityServerId: entry.id };
  }

  private static async applySalesOrderCreate(operation: LocalOperation, tenantId: string): Promise<{ entityServerId?: string }> {
    const payload = operation.payload as any;
    const orderPayload = payload.orderData || payload;

    if (!Array.isArray(orderPayload.items) || orderPayload.items.length === 0) {
      throw syncReject('INVALID_ORDER', 'Order must contain at least one item.');
    }

    const items = await hydrateOrderItems(tenantId, orderPayload.items);
    const subtotal = Number(orderPayload.subtotal ?? items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
    const discountAmount = Number(orderPayload.discountAmount || 0);
    const taxAmount = Number(orderPayload.taxAmount || 0);
    const serviceCharge = Number(orderPayload.serviceCharge || 0);
    const totalAmount = Number(orderPayload.totalAmount ?? subtotal - discountAmount + taxAmount + serviceCharge);

    const order = await OrderService.createOrder({
      tenantId,
      orderType: orderPayload.orderType || 'DINE_IN',
      customerId: orderPayload.customerId,
      customerName: orderPayload.customerName,
      customerPhone: orderPayload.customerPhone,
      tableId: orderPayload.tableId,
      guestCount: orderPayload.guestCount,
      items,
      subtotal,
      discountAmount,
      taxAmount,
      serviceCharge,
      totalAmount,
      paymentType: orderPayload.paymentType || 'PAY_AFTER_SERVICE',
      paymentMethod: orderPayload.paymentMethod,
      paidAmount: Number(orderPayload.paidAmount || 0),
      notes: appendOfflineNote(orderPayload.notes, operation.localNumber),
      kitchenNotes: orderPayload.kitchenNotes,
      allergyInfo: orderPayload.allergyInfo,
      createdBy: operation.actorUserId
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        sourceDeviceId: operation.deviceId,
        sourceLocalOperationId: operation.localOperationId,
        sourceLocalNumber: operation.localNumber,
        offlineRecordedAt: new Date(operation.createdOfflineAt)
      }
    });

    return { entityServerId: order.id };
  }

  private static async applyOfflinePayment(operation: LocalOperation, tenantId: string): Promise<{ entityServerId?: string }> {
    const payload = operation.payload as any;
    const amount = Number(payload.amount);

    if (!payload.orderId || !Number.isFinite(amount) || amount <= 0 || !['CASH', 'CARD'].includes(payload.paymentMethod)) {
      throw syncReject('INVALID_OFFLINE_PAYMENT', 'Offline payment must be cash or manual card with a positive amount.');
    }

    const payment = await prisma.$transaction(async (tx: Tx) => {
      const order = await tx.order.findFirst({
        where: { id: payload.orderId, tenantId },
        include: { payments: true }
      });

      if (!order) {
        throw syncReject('ORDER_NOT_FOUND', 'Payment parent order was not found.');
      }

      const createdPayment = await tx.orderPayment.create({
        data: {
          tenantId,
          paymentNumber: await OrderService.generatePaymentNumber(tenantId),
          orderId: order.id,
          amount,
          paymentMethod: payload.paymentMethod,
          paymentStatus: 'PAID',
          referenceNumber: payload.referenceNumber || payload.cardInfo?.transactionRef,
          terminalId: payload.terminalId || payload.cardInfo?.terminalId,
          cardMask: payload.cardMask || payload.cardInfo?.cardMask,
          cardType: payload.cardType || payload.cardInfo?.cardType,
          paymentDate: payload.paymentDate ? new Date(payload.paymentDate) : new Date(operation.createdOfflineAt),
          processedBy: operation.actorUserId,
          processedAt: new Date(),
          isOfflineRecorded: true,
          verificationStatus: 'OFFLINE_RECORDED',
          sourceDeviceId: operation.deviceId,
          sourceLocalOperationId: operation.localOperationId,
          sourceLocalNumber: operation.localNumber
        }
      });

      const totalPaid = Number(order.paidAmount) + amount;
      const remainingAmount = Number(order.totalAmount) - totalPaid;

      await tx.order.update({
        where: { id: order.id },
        data: {
          paidAmount: totalPaid,
          remainingAmount,
          paymentStatus: remainingAmount <= 0 ? 'PAID' : 'PARTIAL',
          paymentMethod: payload.paymentMethod,
          lastPaymentAt: new Date(),
          paymentNotes: appendOfflineNote(payload.notes || order.paymentNotes, operation.localNumber)
        }
      });

      return createdPayment;
    });

    return { entityServerId: payment.id };
  }

  private static async applyOfflineReceiptFlag(operation: LocalOperation, tenantId: string): Promise<{ entityServerId?: string }> {
    const payload = operation.payload as any;

    if (!payload.orderId) {
      throw syncReject('INVALID_RECEIPT_FLAG', 'Receipt operation requires orderId.');
    }

    const order = await prisma.order.findFirst({
      where: { id: payload.orderId, tenantId }
    });

    if (!order) {
      throw syncReject('ORDER_NOT_FOUND', 'Receipt parent order was not found.');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        printedOffline: true,
        sourceLocalNumber: payload.localNumber || operation.localNumber
      }
    });

    return { entityServerId: updatedOrder.id };
  }

  private static async recordOperation(
    operation: LocalOperation,
    tenantId: string,
    syncBatchId: string,
    status: string,
    entityServerId?: string,
    errorCode?: string,
    errorMessage?: string
  ) {
    await prisma.syncOperation.create({
      data: {
        tenantId,
        deviceId: operation.deviceId,
        localOperationId: operation.localOperationId,
        syncBatchId,
        workspaceId: operation.workspaceId,
        entityType: operation.entityType,
        entityLocalId: operation.entityLocalId,
        entityServerId,
        operationType: operation.operationType,
        status,
        payload: operation.payload as Prisma.InputJsonValue,
        dependsOn: operation.dependsOn as Prisma.InputJsonValue,
        errorCode,
        errorMessage,
        createdOfflineAt: new Date(operation.createdOfflineAt),
        syncedAt: status === 'accepted' ? new Date() : undefined,
        actorUserId: operation.actorUserId
      }
    });
  }
}

async function hydrateOrderItems(tenantId: string, items: any[]) {
  const menuItemIds = items.map((item) => item.itemId);
  const menuItems = await prisma.menuItem.findMany({
    where: {
      tenantId,
      id: { in: menuItemIds },
      isActive: true
    },
    select: {
      id: true,
      menuPrice: true
    }
  });
  const menuPriceById = new Map(menuItems.map((item) => [item.id, Number(item.menuPrice)]));

  return items.map((item) => {
    const unitPrice = Number(item.unitPrice ?? menuPriceById.get(item.itemId));
    if (!Number.isFinite(unitPrice)) {
      throw syncReject('MENU_ITEM_NOT_FOUND', `Menu item ${item.itemId} was not found for offline order sync.`);
    }

    return {
      itemId: item.itemId,
      quantity: Number(item.quantity || 1),
      unitPrice,
      modifiers: item.modifiers || [],
      specialRequest: item.specialRequest
    };
  });
}

function appendOfflineNote(note: string | undefined, localNumber?: string) {
  const offlineNote = localNumber ? `OFFLINE_RECORDED ${localNumber}` : 'OFFLINE_RECORDED';
  return note ? `${note}\n${offlineNote}` : offlineNote;
}

function syncReject(code: string, message: string) {
  return Object.assign(new Error(message), { code, conflict: false });
}

function syncConflict(code: string, message: string) {
  return Object.assign(new Error(message), { code, conflict: true });
}

function normalizeSyncError(error: unknown): { code: string; message: string; conflict: boolean } {
  if (error && typeof error === 'object') {
    const typedError = error as { code?: string; message?: string; conflict?: boolean };
    return {
      code: typedError.code || 'SYNC_OPERATION_FAILED',
      message: typedError.message || 'Sync operation failed.',
      conflict: Boolean(typedError.conflict)
    };
  }

  return {
    code: 'SYNC_OPERATION_FAILED',
    message: 'Sync operation failed.',
    conflict: false
  };
}
