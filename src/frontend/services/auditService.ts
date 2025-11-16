import { apiClient } from '../lib/apiClient';

export interface AuditCycle {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completedAt?: string;
  completedBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelledReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  completedByUser?: {
    id: string;
    name: string;
  };
  cancelledByUser?: {
    id: string;
    name: string;
  };
  _count?: {
    entries: number;
  };
  entries?: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  auditCycleId: string;
  itemId: string;
  countedQuantity: number;
  systemQuantity: number;
  discrepancy: number;
  reason?: string;
  correctionApplied: boolean;
  correctionEntryId?: string;
  countedBy: string;
  countedAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  item?: {
    id: string;
    name: string;
    category: string;
    unit: string;
  };
  countedByUser?: {
    id: string;
    name: string;
  };
}

export interface DiscrepancyReport {
  auditCycleId: string;
  auditCycle: {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
  };
  totalItems: number;
  itemsWithDiscrepancy: number;
  totalDiscrepancyValue: number;
  discrepancies: Array<{
    id: string;
    itemId: string;
    itemName: string;
    itemCategory: string;
    itemUnit: string;
    countedQuantity: number;
    systemQuantity: number;
    discrepancy: number;
    reason?: string;
    correctionApplied: boolean;
  }>;
}

export interface CreateAuditCycleData {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
}

export interface AddAuditEntryData {
  auditCycleId: string;
  itemId: string;
  countedQuantity: number;
  reason?: string;
}

export interface ApplyCorrectionData {
  auditEntryId: string;
  reason: string;
}

/**
 * Get all audit cycles
 */
export const getAuditCycles = async (filters?: {
  status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
}): Promise<AuditCycle[]> => {
  const params = new URLSearchParams();
  if (filters?.status) {
    params.append('status', filters.status);
  }
  if (filters?.startDate) {
    params.append('startDate', filters.startDate);
  }
  if (filters?.endDate) {
    params.append('endDate', filters.endDate);
  }

  const queryString = params.toString();
  const url = `/audit/cycles${queryString ? `?${queryString}` : ''}`;
  
  return await apiClient.get<AuditCycle[]>(url);
};

/**
 * Get audit cycle by ID
 */
export const getAuditCycleById = async (id: string): Promise<AuditCycle> => {
  return await apiClient.get<AuditCycle>(`/audit/cycles/${id}`);
};

/**
 * Create new audit cycle
 */
export const createAuditCycle = async (data: CreateAuditCycleData): Promise<{ message: string; cycle: AuditCycle }> => {
  return await apiClient.post<{ message: string; cycle: AuditCycle }>('/audit/cycles', data);
};

/**
 * Start audit cycle
 */
export const startAuditCycle = async (id: string): Promise<{ message: string }> => {
  return await apiClient.post<{ message: string }>(`/audit/cycles/${id}/start`, {});
};

/**
 * Complete audit cycle
 */
export const completeAuditCycle = async (id: string): Promise<{ message: string }> => {
  return await apiClient.post<{ message: string }>(`/audit/cycles/${id}/complete`, {});
};

/**
 * Cancel audit cycle
 */
export const cancelAuditCycle = async (id: string, cancelledReason: string): Promise<{ message: string }> => {
  return await apiClient.post<{ message: string }>(`/audit/cycles/${id}/cancel`, { cancelledReason });
};

/**
 * Add audit entry (counted stock)
 */
export const addAuditEntry = async (data: AddAuditEntryData): Promise<{ message: string; entry: AuditEntry }> => {
  return await apiClient.post<{ message: string; entry: AuditEntry }>('/audit/entries', data);
};

/**
 * Generate discrepancy report
 */
export const generateDiscrepancyReport = async (auditCycleId: string): Promise<DiscrepancyReport> => {
  return await apiClient.get<DiscrepancyReport>(`/audit/cycles/${auditCycleId}/discrepancy-report`);
};

/**
 * Apply correction for discrepancy
 */
export interface InventoryEntry {
  id: string;
  itemId: string;
  quantity: number;
  type: 'IN' | 'OUT';
  note?: string;
  createdAt: string;
}

export const applyCorrection = async (auditEntryId: string, reason: string): Promise<{
  message: string;
  inventoryEntry: InventoryEntry;
  auditEntry: AuditEntry;
}> => {
  return await apiClient.post(`/audit/entries/${auditEntryId}/apply-correction`, { reason });
};

/**
 * Add multiple audit entries in bulk
 */
export interface BulkAddAuditEntriesData {
  entries: AddAuditEntryData[];
}

export interface BulkAddAuditEntriesResponse {
  message: string;
  success: boolean;
  created: AuditEntry[];
  errors: Array<{ itemId: string; error: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export const addBulkAuditEntries = async (data: BulkAddAuditEntriesData): Promise<BulkAddAuditEntriesResponse> => {
  return await apiClient.post<BulkAddAuditEntriesResponse>('/audit/entries/bulk', data);
};

