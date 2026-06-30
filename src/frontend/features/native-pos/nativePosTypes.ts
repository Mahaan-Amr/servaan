import type { LocalOperation, SyncIssueSummary } from '../../../shared/localFirst';
import type { OrderingSettings } from '../../services/orderingService';

export type NativePosPaymentMethod = 'cash' | 'manual-card';
export type NativePosOrderType = 'DINE_IN' | 'TAKEAWAY';
export type NativePosCacheKey = 'sales.menu' | 'sales.tables' | 'sales.settings';

export type NativePosReadiness =
  | {
      kind: 'ready';
      updatedAt: string;
      stale: boolean;
      message?: string;
    }
  | {
      kind: 'missing-cache';
      missing: NativePosCacheKey[];
      message: string;
    }
  | {
      kind: 'offline-auth-expired';
      expiresAt?: string;
      message: string;
    }
  | {
      kind: 'not-native';
      message: string;
    };

export interface NativePosMenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  description?: string;
  available: boolean;
}

export interface NativePosMenuCategory {
  id: string;
  name: string;
  items: NativePosMenuItem[];
}

export interface NativePosTable {
  id: string;
  label: string;
  status: string;
}

export interface NativePosSnapshot {
  readiness: NativePosReadiness;
  categories: NativePosMenuCategory[];
  tables: NativePosTable[];
  settings: OrderingSettings | null;
  syncIssues: SyncIssueSummary;
}

export interface NativePosCartLine {
  itemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  total: number;
  specialRequest?: string;
}

export interface NativePosPaidOrderInput {
  orderType: NativePosOrderType;
  tableId?: string;
  guestCount?: number;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  items: NativePosCartLine[];
  payment: {
    method: NativePosPaymentMethod;
    amount: number;
    cashReceived?: number;
    manualCard?: {
      terminalId?: string;
      transactionRef?: string;
      cardMask?: string;
    };
  };
}

export interface NativePosPaidOrderResult {
  orderOperation: LocalOperation;
  paymentOperation: LocalOperation;
  orderLocalId: string;
  paymentLocalId: string;
  orderNumber?: string;
  paymentNumber?: string;
  message: string;
}
