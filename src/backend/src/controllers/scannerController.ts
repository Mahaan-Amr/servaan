import { Request, Response } from 'express';
import { scannerService } from '../services/scannerService';

export class ScannerController {
  /**
   * Record a scan in the database
   * POST /api/scanner/history
   */
  async recordScan(req: Request, res: Response) {
    try {
      const { code, format, scanMode, timestamp } = req.body;
      const userId = req.user!.id;

      if (!code || !format || !scanMode) {
        return res.status(400).json({
          error: 'کد، فرمت و نوع اسکن الزامی است',
        });
      }

      if (!req.tenant?.id) {
        return res.status(400).json({
          error: 'Tenant context required'
        });
      }
      
      const scanHistory = await scannerService.recordScan(userId, {
        code,
        format,
        scanMode,
        timestamp: timestamp || Date.now(),
      }, req.tenant.id);

      res.status(201).json(scanHistory);
    } catch (error: any) {
      console.error('Error recording scan:', error);
      res.status(500).json({
        error: error.message || 'خطا در ثبت اسکن',
      });
    }
  }

  /**
   * Look up product by barcode/QR code
   * GET /api/scanner/lookup/:code
   */
  async lookupProduct(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const { mode } = req.query;

      if (!code) {
        return res.status(400).json({
          error: 'کد الزامی است',
        });
      }

      if (!mode || (mode !== 'barcode' && mode !== 'qr')) {
        return res.status(400).json({
          error: 'نوع اسکن (barcode یا qr) الزامی است',
        });
      }

      const result = await scannerService.lookupProduct(
        decodeURIComponent(code),
        mode as 'barcode' | 'qr'
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error looking up product:', error);
      res.status(500).json({
        error: error.message || 'خطا در جستجوی محصول',
      });
    }
  }

  /**
   * External barcode lookup
   * GET /api/scanner/external-lookup/:barcode
   */
  async externalLookup(req: Request, res: Response) {
    try {
      const { barcode } = req.params;

      if (!barcode) {
        return res.status(400).json({
          error: 'بارکد الزامی است',
        });
      }

      const result = await scannerService.lookupProduct(
        decodeURIComponent(barcode),
        'barcode'
      );

      if (result.externalData) {
        res.json(result);
      } else {
        res.status(404).json({
          found: false,
          message: 'محصول در پایگاه‌های داده خارجی یافت نشد',
        });
      }
    } catch (error: any) {
      console.error('Error in external lookup:', error);
      res.status(500).json({
        error: error.message || 'خطا در جستجوی خارجی',
      });
    }
  }

  /**
   * Get scan history for current user
   * GET /api/scanner/history
   */
  async getScanHistory(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { limit = '50', offset = '0' } = req.query;

      const scanHistory = await scannerService.getUserScanHistory(
        userId,
        parseInt(limit as string, 10),
        parseInt(offset as string, 10)
      );

      res.json(scanHistory);
    } catch (error: any) {
      console.error('Error getting scan history:', error);
      res.status(500).json({
        error: error.message || 'خطا در دریافت تاریخچه اسکن',
      });
    }
  }

  /**
   * Get scan statistics for current user
   * GET /api/scanner/statistics
   */
  async getScanStatistics(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      const statistics = await scannerService.getScanStatistics(userId);

      res.json(statistics);
    } catch (error: any) {
      console.error('Error getting scan statistics:', error);
      res.status(500).json({
        error: error.message || 'خطا در دریافت آمار اسکن',
      });
    }
  }

  /**
   * Clear scan history for current user
   * DELETE /api/scanner/history
   */
  async clearScanHistory(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      await scannerService.clearScanHistory(userId);

      res.json({ message: 'تاریخچه اسکن با موفقیت پاک شد' });
    } catch (error: any) {
      console.error('Error clearing scan history:', error);
      res.status(500).json({
        error: error.message || 'خطا در پاک کردن تاریخچه',
      });
    }
  }

  /**
   * Create item from scanned barcode
   * POST /api/scanner/create-item
   */
  async createItemFromScan(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const tenantId = (req.user as any)!.tenantId;  // Get tenant from user
      const { code, mode, itemData } = req.body;

      if (!code || !mode || !itemData) {
        return res.status(400).json({
          error: 'کد، نوع اسکن و اطلاعات محصول الزامی است',
        });
      }

      if (!itemData.name || !itemData.category || !itemData.unit) {
        return res.status(400).json({
          error: 'نام، دسته‌بندی و واحد محصول الزامی است',
        });
      }

      const item = await scannerService.createItemFromScan(userId, tenantId, {
        code,
        mode,
        itemData,
      });

      res.status(201).json(item);
    } catch (error: any) {
      console.error('Error creating item from scan:', error);
      res.status(500).json({
        error: error.message || 'خطا در ایجاد محصول از اسکن',
      });
    }
  }

  /**
   * Update item barcode
   * PATCH /api/inventory/:itemId/barcode
   */
  async updateItemBarcode(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const { barcode } = req.body;

      if (!barcode) {
        return res.status(400).json({
          error: 'بارکد الزامی است',
        });
      }

      await scannerService.updateItemBarcode(itemId, barcode);

      res.json({ message: 'بارکد محصول با موفقیت بروزرسانی شد' });
    } catch (error: any) {
      console.error('Error updating item barcode:', error);
      res.status(500).json({
        error: error.message || 'خطا در بروزرسانی بارکد محصول',
      });
    }
  }

  /**
   * Generate QR code for item
   * POST /api/scanner/generate-qr/:itemId
   */
  async generateItemQR(req: Request, res: Response) {
    try {
      const { itemId } = req.params;

      const qrCodeDataURL = await scannerService.generateItemQR(itemId);

      res.json({ qrCode: qrCodeDataURL });
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      res.status(500).json({
        error: error.message || 'خطا در تولید QR کد',
      });
    }
  }

  /**
   * Search items by partial barcode/name
   * GET /api/scanner/search
   */
  async searchItems(req: Request, res: Response) {
    try {
      const tenantId = (req.user as any)!.tenantId;  // Get tenant from user
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          error: 'عبارت جستجو الزامی است',
        });
      }

      const items = await scannerService.searchItems(q, tenantId);

      res.json(items);
    } catch (error: any) {
      console.error('Error searching items:', error);
      res.status(500).json({
        error: error.message || 'خطا در جستجوی محصولات',
      });
    }
  }

  /**
   * Validate barcode format
   * POST /api/scanner/validate
   */
  async validateBarcode(req: Request, res: Response) {
    try {
      const { barcode } = req.body;

      if (!barcode) {
        return res.status(400).json({
          error: 'بارکد الزامی است',
        });
      }

      const validation = scannerService.validateBarcode(barcode);

      res.json(validation);
    } catch (error: any) {
      console.error('Error validating barcode:', error);
      res.status(500).json({
        error: error.message || 'خطا در اعتبارسنجی بارکد',
      });
    }
  }

  /**
   * Bulk scan processing (future enhancement)
   * POST /api/scanner/bulk-process
   */
  async processBulkScans(req: Request, res: Response) {
    try {
      const { scans } = req.body;
      const userId = req.user!.id;
      const tenantId = (req.user as any)!.tenantId;  // Get tenant from user

      if (!scans || !Array.isArray(scans)) {
        return res.status(400).json({
          error: 'فهرست اسکن‌ها الزامی است',
        });
      }

      const results = {
        processed: scans.length,
        successful: 0,
        failed: 0,
        results: [] as any[],
      };

      // Process each scan
      for (const scan of scans) {
        try {
          const scanHistory = await scannerService.recordScan(userId, scan, tenantId);
          const lookup = await scannerService.lookupProduct(scan.code, scan.scanMode, tenantId);
          
          results.results.push({
            scan,
            success: true,
            scanHistory,
            lookup,
          });
          results.successful++;
        } catch (error: any) {
          results.results.push({
            scan,
            success: false,
            error: error.message,
          });
          results.failed++;
        }
      }

      res.json(results);
    } catch (error: any) {
      console.error('Error processing bulk scans:', error);
      res.status(500).json({
        error: error.message || 'خطا در پردازش اسکن‌های گروهی',
      });
    }
  }
}

export const scannerController = new ScannerController(); 