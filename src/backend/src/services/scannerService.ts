import { prisma } from './dbService';
import axios from 'axios';
import { toDataURL } from 'qrcode';

export interface ScanResult {
  code: string;
  format: string;
  scanMode: 'barcode' | 'qr';
  timestamp: number;
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

class ScannerService {
  /**
   * Record a scan in the database
   */
  async recordScan(userId: string, scanData: ScanResult, tenantId: string): Promise<any> {
    try {
      // Convert format string to enum value
      const formatEnum = this.formatToEnum(scanData.format);
      const scanModeEnum = scanData.scanMode.toUpperCase() as 'BARCODE' | 'QR';
      
      // Look up item by barcode/QR code
      const item = await this.findItemByCode(scanData.code);
      
      const scanHistory = await prisma.scanHistory.create({
        data: {
          userId,
          code: scanData.code,
          format: formatEnum,
          scanMode: scanModeEnum,
          itemFound: !!item,
          itemId: item?.id || null,
          metadata: {
            timestamp: scanData.timestamp,
            userAgent: 'web',
          },
          tenantId, // Added tenantId
        },
        include: {
          user: true,
          item: true,
        },
      });

      return scanHistory;
    } catch (error) {
      console.error('Error recording scan:', error);
      throw new Error('خطا در ثبت اسکن');
    }
  }

  /**
   * Look up product by barcode/QR code
   */
  async lookupProduct(code: string, mode: 'barcode' | 'qr', tenantId?: string): Promise<ProductLookupResult> {
    try {
      // First, try to find the item in our system
      const item = await this.findItemByCode(code, tenantId);
      
      if (item) {
        // Calculate current stock
        const currentStock = await this.calculateCurrentStock(item.id, tenantId);
        
        return {
          found: true,
          item: {
            id: item.id,
            name: item.name,
            category: item.category,
            unit: item.unit,
            barcode: item.barcode || undefined,
            currentStock,
            minStock: item.minStock || undefined,
            image: item.image || undefined,
          },
        };
      }

      // If not found in our system and it's a barcode, try external lookup
      if (mode === 'barcode' && tenantId) {
        const externalData = await this.lookupExternalBarcode(code, tenantId);
        return {
          found: false,
          externalData: externalData || undefined,
        };
      }

      return {
        found: false,
      };
    } catch (error) {
      console.error('Error looking up product:', error);
      throw new Error('خطا در جستجوی محصول');
    }
  }

  /**
   * Get scan history for a user
   */
  async getUserScanHistory(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const scanHistory = await prisma.scanHistory.findMany({
        where: { userId },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              category: true,
              unit: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return scanHistory.map(scan => ({
        id: scan.id,
        code: scan.code,
        format: scan.format,
        scanMode: scan.scanMode.toLowerCase(),
        itemFound: scan.itemFound,
        itemId: scan.itemId,
        itemName: scan.item?.name,
        metadata: scan.metadata,
        timestamp: scan.createdAt,
      }));
    } catch (error) {
      console.error('Error getting scan history:', error);
      throw new Error('خطا در دریافت تاریخچه اسکن');
    }
  }

  /**
   * Get scan statistics for a user
   */
  async getScanStatistics(userId: string): Promise<ScanStatistics> {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfDay.getTime() - (startOfDay.getDay() * 24 * 60 * 60 * 1000));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalScans,
        successfulScans,
        barcodeScans,
        qrScans,
        todayScans,
        weeklyScans,
        monthlyScans,
        mostScannedItems,
      ] = await Promise.all([
        // Total scans
        prisma.scanHistory.count({ where: { userId } }),
        
        // Successful scans (items found)
        prisma.scanHistory.count({ where: { userId, itemFound: true } }),
        
        // Barcode scans
        prisma.scanHistory.count({ where: { userId, scanMode: 'BARCODE' } }),
        
        // QR scans
        prisma.scanHistory.count({ where: { userId, scanMode: 'QR' } }),
        
        // Today's scans
        prisma.scanHistory.count({
          where: {
            userId,
            createdAt: { gte: startOfDay },
          },
        }),
        
        // Weekly scans
        prisma.scanHistory.count({
          where: {
            userId,
            createdAt: { gte: startOfWeek },
          },
        }),
        
        // Monthly scans
        prisma.scanHistory.count({
          where: {
            userId,
            createdAt: { gte: startOfMonth },
          },
        }),
        
        // Most scanned items
        prisma.scanHistory.groupBy({
          by: ['itemId'],
          where: {
            userId,
            itemFound: true,
            itemId: { not: null },
          },
          _count: {
            itemId: true,
          },
          orderBy: {
            _count: {
              itemId: 'desc',
            },
          },
          take: 10,
        }),
      ]);

      // Get item details for most scanned items
      const itemIds = mostScannedItems.map(item => item.itemId).filter(Boolean) as string[];
      const items = await prisma.item.findMany({
        where: { id: { in: itemIds } },
        select: { id: true, name: true },
      });

      const mostScannedWithNames = mostScannedItems.map(item => {
        const itemDetails = items.find(i => i.id === item.itemId);
        return {
          itemId: item.itemId!,
          itemName: itemDetails?.name || 'نامشخص',
          scanCount: item._count.itemId,
        };
      });

      return {
        totalScans,
        successfulScans,
        failedScans: totalScans - successfulScans,
        barcodeScans,
        qrScans,
        todayScans,
        weeklyScans,
        monthlyScans,
        mostScannedItems: mostScannedWithNames,
      };
    } catch (error) {
      console.error('Error getting scan statistics:', error);
      throw new Error('خطا در دریافت آمار اسکن');
    }
  }

  /**
   * Clear scan history for a user
   */
  async clearScanHistory(userId: string): Promise<void> {
    try {
      await prisma.scanHistory.deleteMany({
        where: { userId },
      });
    } catch (error) {
      console.error('Error clearing scan history:', error);
      throw new Error('خطا در پاک کردن تاریخچه');
    }
  }

  /**
   * Create item from scanned barcode
   */
  async createItemFromScan(userId: string, tenantId: string, scanData: {
    code: string;
    mode: 'barcode' | 'qr';
    itemData: {
      name: string;
      category: string;
      unit: string;
      description?: string;
      minStock?: number;
      image?: string;
    };
  }) {
    try {
      const item = await prisma.item.create({
        data: {
          name: scanData.itemData.name,
          category: scanData.itemData.category,
          unit: scanData.itemData.unit,
          description: scanData.itemData.description,
          minStock: scanData.itemData.minStock,
          image: scanData.itemData.image,
          barcode: scanData.mode === 'barcode' ? scanData.code : undefined,
          tenantId: tenantId,  // Add tenant context
        },
      });

      // Record the scan with the new item
      await this.recordScan(userId, {
        code: scanData.code,
        format: 'UNKNOWN',
        scanMode: scanData.mode,
        timestamp: Date.now(),
      }, tenantId);

      return item;
    } catch (error) {
      console.error('Error creating item from scan:', error);
      throw new Error('خطا در ایجاد محصول از اسکن');
    }
  }

  /**
   * Update item barcode
   */
  async updateItemBarcode(itemId: string, barcode: string): Promise<void> {
    try {
      await prisma.item.update({
        where: { id: itemId },
        data: { barcode },
      });
    } catch (error) {
      console.error('Error updating item barcode:', error);
      throw new Error('خطا در بروزرسانی بارکد محصول');
    }
  }

  /**
   * Generate QR code for item
   */
  async generateItemQR(itemId: string): Promise<string> {
    try {
      const item = await prisma.item.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new Error('محصول یافت نشد');
      }

      // Create QR data with item information
      const qrData = JSON.stringify({
        type: 'item',
        id: itemId,
        name: item.name,
        category: item.category,
      });

      // Generate QR code as base64 string
      const qrCodeDataURL = await toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('خطا در تولید QR کد');
    }
  }

  /**
   * Search items by partial code or name
   */
  async searchItems(query: string, tenantId: string) {
    try {
      const items = await prisma.item.findMany({
        where: {
          tenantId: tenantId,  // Filter by tenant
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { barcode: { contains: query } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          barcode: true,
          category: true,
        },
        take: 20,
      });

      // Calculate current stock for each item
      const itemsWithStock = await Promise.all(
        items.map(async (item) => {
          const currentStock = await this.calculateCurrentStock(item.id, tenantId);
          return {
            ...item,
            currentStock,
          };
        })
      );

      return itemsWithStock;
    } catch (error) {
      console.error('Error searching items:', error);
      throw new Error('خطا در جستجوی محصولات');
    }
  }

  /**
   * Validate barcode format and calculate checksum
   */
  validateBarcode(barcode: string): {
    isValid: boolean;
    format?: string;
    checksum?: boolean;
  } {
    // EAN-13 validation
    if (/^\d{13}$/.test(barcode)) {
      const checksum = this.calculateEAN13Checksum(barcode.slice(0, 12));
      return {
        isValid: checksum === parseInt(barcode[12]),
        format: 'EAN-13',
        checksum: checksum === parseInt(barcode[12]),
      };
    }

    // EAN-8 validation
    if (/^\d{8}$/.test(barcode)) {
      const checksum = this.calculateEAN8Checksum(barcode.slice(0, 7));
      return {
        isValid: checksum === parseInt(barcode[7]),
        format: 'EAN-8',
        checksum: checksum === parseInt(barcode[7]),
      };
    }

    // UPC-A validation
    if (/^\d{12}$/.test(barcode)) {
      const checksum = this.calculateUPCAChecksum(barcode.slice(0, 11));
      return {
        isValid: checksum === parseInt(barcode[11]),
        format: 'UPC-A',
        checksum: checksum === parseInt(barcode[11]),
      };
    }

    // Basic format check for other codes
    if (/^[0-9A-Za-z\-\.]+$/.test(barcode) && barcode.length >= 4) {
      return {
        isValid: true,
        format: 'Unknown',
      };
    }

    return {
      isValid: false,
    };
  }

  // Private helper methods

  private formatToEnum(format: string): any {
    const formatMap: { [key: string]: string } = {
      'ean_13': 'EAN_13',
      'ean_8': 'EAN_8',
      'upc_a': 'UPC_A',
      'upc_e': 'UPC_E',
      'code_128': 'CODE_128',
      'code_39': 'CODE_39',
      'i2of5': 'I2OF5',
      'qr_code': 'QR_CODE',
      'data_matrix': 'DATA_MATRIX',
      'aztec': 'AZTEC',
      'pdf_417': 'PDF_417',
    };

    return formatMap[format.toLowerCase()] || 'UNKNOWN';
  }

  private async findItemByCode(code: string, tenantId?: string) {
    // Try exact barcode match first
    let item = await prisma.item.findFirst({
      where: {
        barcode: code,
        isActive: true,
        ...(tenantId && { tenantId }), // Filter by tenant if provided
      },
    });

    // If not found and it's a QR code, try parsing JSON
    if (!item && code.startsWith('{')) {
      try {
        const qrData = JSON.parse(code);
        if (qrData.type === 'item' && qrData.id) {
          item = await prisma.item.findFirst({
            where: { 
              id: qrData.id,
              ...(tenantId && { tenantId }), // Filter by tenant if provided
            },
          });
        }
      } catch (error) {
        // Not a valid JSON QR code
      }
    }

    return item;
  }

  private async calculateCurrentStock(itemId: string, tenantId?: string): Promise<number> {
    const result = await prisma.inventoryEntry.aggregate({
      where: { 
        itemId,
        ...(tenantId && { tenantId }), // Filter by tenant if provided
      },
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity || 0;
  }

  private async lookupExternalBarcode(barcode: string, tenantId: string) {
    try {
      // Check if we have cached data first
      const cached = await prisma.externalBarcodeData.findFirst({
        where: { 
          barcode,
          tenantId
        },
      });

      if (cached && cached.isActive) {
        // Check if cache is less than 30 days old
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        if (cached.lastUpdated > thirtyDaysAgo) {
          return {
            name: cached.productName,
            brand: cached.brand,
            category: cached.category,
            description: cached.description,
            image: cached.imageUrl,
            source: cached.source,
          };
        }
      }

      // Try to lookup from external APIs
      const externalData = await this.fetchFromExternalAPIs(barcode);
      
      if (externalData) {
        // Cache the result
        await prisma.externalBarcodeData.upsert({
          where: { 
            barcode
          },
          update: {
            productName: externalData.name,
            brand: externalData.brand,
            category: externalData.category,
            description: externalData.description,
            imageUrl: externalData.image,
            source: externalData.source,
            lastUpdated: new Date(),
            isActive: true,
          },
          create: {
            barcode,
            productName: externalData.name,
            brand: externalData.brand,
            category: externalData.category,
            description: externalData.description,
            imageUrl: externalData.image,
            source: externalData.source,
            tenantId,
          },
        });
      }

      return externalData;
    } catch (error) {
      console.error('Error looking up external barcode:', error);
      return null;
    }
  }

  private async fetchFromExternalAPIs(barcode: string) {
    // This is a placeholder for external API integration
    // In a real implementation, you would integrate with services like:
    // - Open Food Facts
    // - UPC Database
    // - Product API services
    
    try {
      // Example: Open Food Facts API
      const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
        timeout: 5000,
      });

      if (response.data.status === 1 && response.data.product) {
        const product = response.data.product;
        return {
          name: product.product_name || product.product_name_fa,
          brand: product.brands,
          category: product.categories,
          description: product.ingredients_text,
          image: product.image_url,
          source: 'Open Food Facts',
        };
      }
    } catch (error: any) {
      console.log('Open Food Facts lookup failed:', error.message);
    }

    return null;
  }

  private calculateEAN13Checksum(digits: string): number {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(digits[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    return (10 - (sum % 10)) % 10;
  }

  private calculateEAN8Checksum(digits: string): number {
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const digit = parseInt(digits[i]);
      sum += i % 2 === 0 ? digit * 3 : digit;
    }
    return (10 - (sum % 10)) % 10;
  }

  private calculateUPCAChecksum(digits: string): number {
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      const digit = parseInt(digits[i]);
      sum += i % 2 === 0 ? digit * 3 : digit;
    }
    return (10 - (sum % 10)) % 10;
  }
}

export const scannerService = new ScannerService();
export default scannerService; 