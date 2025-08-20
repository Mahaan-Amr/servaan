import { apiClient } from '../lib/apiClient';
import { UniversalScanResult } from '../components/scanner/UniversalScanner';

export interface ScanHistory {
  id: string;
  code: string;
  format: string;
  scanMode: 'barcode' | 'qr';
  timestamp: Date;
  itemFound?: boolean;
  itemId?: string;
  itemName?: string;
  metadata?: Record<string, unknown>;
}

export interface ProductLookupResult {
  found: boolean;
  item?: {
    id: string;
    name: string;
    category: string;
    unit: string;
    barcode?: string;
    currentStock?: number;
    minStock?: number;
    image?: string;
  };
  suggestions?: Array<{
    id: string;
    name: string;
    similarity: number;
  }>;
  externalData?: {
    name?: string;
    brand?: string;
    category?: string;
    description?: string;
    image?: string;
    source: string;
  };
}

export interface ScanStatistics {
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  barcodeScans: number;
  qrScans: number;
  todayScans: number;
  weeklyScans: number;
  monthlyScans: number;
  mostScannedItems: Array<{
    itemId: string;
    itemName: string;
    scanCount: number;
  }>;
}

/**
 * Record a scan in the database
 */
export const recordScan = async (scanResult: UniversalScanResult): Promise<ScanHistory> => {
  try {
    return await apiClient.post<ScanHistory>('/scanner/history', {
      code: scanResult.code,
      format: scanResult.format,
      scanMode: scanResult.mode,
      timestamp: new Date(scanResult.timestamp),
    });
  } catch (error) {
    console.error('Failed to record scan:', error);
    throw new Error('خطا در ثبت اسکن');
  }
};

/**
 * Look up product by barcode/QR code
 */
export const lookupProduct = async (code: string, format: string): Promise<ProductLookupResult> => {
  try {
    return await apiClient.get<ProductLookupResult>(`/scanner/lookup/${code}`, { format });
  } catch (error) {
    if (error instanceof Error && (error as Error & { statusCode?: number }).statusCode === 404) {
      return {
        found: false,
        suggestions: [],
        externalData: {
          source: 'local'
        }
      };
    }
    throw new Error('خطا در جستجوی محصول');
  }
};

/**
 * Get scan history with optional filters
 */
export const getScanHistory = async (filters?: {
  startDate?: string;
  endDate?: string;
  format?: string;
  scanMode?: string;
  limit?: number;
}): Promise<ScanHistory[]> => {
  try {
    const params: Record<string, string | number | boolean> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value.toString();
        }
      });
    }

    return await apiClient.get<ScanHistory[]>('/scanner/history', params);
  } catch {
    throw new Error('خطا در دریافت تاریخچه اسکن');
  }
};

/**
 * Get scan statistics
 */
export const getScanStatistics = async (period?: string): Promise<ScanStatistics> => {
  try {
    const params: Record<string, string | number | boolean> = {};
    if (period) {
      params.period = period;
    }

    return await apiClient.get<ScanStatistics>('/scanner/statistics', params);
  } catch {
    throw new Error('خطا در دریافت آمار اسکن');
  }
};

/**
 * Clear scan history
 */
export const clearScanHistory = async (): Promise<void> => {
  try {
    await apiClient.delete<void>('/scanner/history');
  } catch {
    throw new Error('خطا در پاک کردن تاریخچه اسکن');
  }
};

/**
 * Export scan history
 */
export const exportScanHistory = async (format: 'excel' | 'csv', filters?: {
  startDate?: string;
  endDate?: string;
  format?: string;
}): Promise<{ downloadUrl: string; fileName: string }> => {
  try {
    const params: Record<string, string | number | boolean> = { format };
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value.toString();
        }
      });
    }

    return await apiClient.post<{ downloadUrl: string; fileName: string }>('/scanner/export', params);
  } catch {
    throw new Error('خطا در صادرات تاریخچه اسکن');
  }
};