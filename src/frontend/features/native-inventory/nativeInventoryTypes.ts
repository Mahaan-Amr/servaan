import type { LocalOperation } from '../../../shared/localFirst';

export type NativeInventoryMovementType = 'IN' | 'OUT';
export type NativeInventoryCacheKey = 'inventory.items' | 'inventory.current';

export type NativeInventoryReadiness =
  | {
      kind: 'ready';
      updatedAt: string;
      stale: boolean;
    }
  | {
      kind: 'missing-cache';
      missing: NativeInventoryCacheKey[];
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

export interface NativeInventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  current: number;
  minStock?: number;
}

export interface NativeInventoryIssueSummary {
  pendingCount: number;
  failedCount: number;
  conflictedCount: number;
  waitingForDependencyCount: number;
}

export interface NativeInventorySnapshot {
  readiness: NativeInventoryReadiness;
  items: NativeInventoryItem[];
  pendingInventoryCount: number;
  syncIssues: NativeInventoryIssueSummary;
}

export interface NativeInventoryEntryInput {
  itemId: string;
  type: NativeInventoryMovementType;
  quantity: number;
  note?: string;
}

export interface NativeInventoryEntryResult {
  operation: LocalOperation;
  localNumber?: string;
  itemName: string;
  type: NativeInventoryMovementType;
  quantity: number;
  unit: string;
  estimatedStock: number;
  message: string;
}
