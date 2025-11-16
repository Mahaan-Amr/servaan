import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { requireTenant } from '../middlewares/tenantMiddleware';
import * as auditService from '../services/auditService';

const router = Router();

// CUID validator function
const isCuid = (value: string): boolean => {
  // CUID format: starts with 'c' followed by 24 alphanumeric characters
  const cuidRegex = /^c[a-z0-9]{24}$/;
  return cuidRegex.test(value);
};

// Custom CUID validation for Zod
const cuidSchema = (message: string) => z.string().refine(
  (val) => isCuid(val),
  { message }
);

// Validation schemas
const createAuditCycleSchema = z.object({
  name: z.string().min(1, 'نام چرخه انبارگردانی الزامی است'),
  description: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'فرمت تاریخ نامعتبر است'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'فرمت تاریخ نامعتبر است')
});

const addAuditEntrySchema = z.object({
  auditCycleId: cuidSchema('شناسه چرخه انبارگردانی نامعتبر است'),
  itemId: z.string().uuid('شناسه کالا نامعتبر است'),
  countedQuantity: z.number().min(0, 'مقدار شمارش شده نمی‌تواند منفی باشد'),
  reason: z.string().optional()
});

const bulkAddAuditEntriesSchema = z.object({
  entries: z.array(addAuditEntrySchema).min(1, 'حداقل یک ورودی الزامی است')
});

const applyCorrectionSchema = z.object({
  auditEntryId: cuidSchema('شناسه ورودی انبارگردانی نامعتبر است'),
  reason: z.string().min(1, 'دلیل اصلاح الزامی است')
});

const cancelAuditCycleSchema = z.object({
  cancelledReason: z.string().min(1, 'دلیل لغو الزامی است')
});

// GET /api/audit/cycles - Get all audit cycles
router.get('/cycles', authenticate, requireTenant, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const filters: any = {};
    if (status && ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status as string)) {
      filters.status = status;
    }
    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }
    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    const cycles = await auditService.getAuditCycles(req.tenant!.id, filters);
    res.json(cycles);
  } catch (error) {
    console.error('Error fetching audit cycles:', error);
    res.status(500).json({ message: 'خطا در دریافت چرخه‌های انبارگردانی' });
  }
});

// GET /api/audit/cycles/:id - Get audit cycle by ID
router.get('/cycles/:id', authenticate, requireTenant, async (req, res) => {
  try {
    const { id } = req.params;
    const cycle = await auditService.getAuditCycleById(id, req.tenant!.id);
    
    if (!cycle) {
      return res.status(404).json({ message: 'چرخه انبارگردانی یافت نشد' });
    }
    
    res.json(cycle);
  } catch (error) {
    console.error('Error fetching audit cycle:', error);
    res.status(500).json({ message: 'خطا در دریافت چرخه انبارگردانی' });
  }
});

// POST /api/audit/cycles - Create new audit cycle
router.post('/cycles', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const validatedData = createAuditCycleSchema.parse(req.body);
    const userId = (req as any).user.id;
    
    const cycle = await auditService.createAuditCycle(
      {
        name: validatedData.name,
        description: validatedData.description,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate)
      },
      userId,
      req.tenant!.id
    );
    
    res.status(201).json({
      message: 'چرخه انبارگردانی با موفقیت ایجاد شد',
      cycle
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'داده‌های ورودی نامعتبر است',
        errors: error.errors
      });
    }
    
    if (error instanceof Error && error.message.includes('تاریخ شروع')) {
      return res.status(400).json({ message: error.message });
    }
    
    console.error('Error creating audit cycle:', error);
    res.status(500).json({ message: 'خطا در ایجاد چرخه انبارگردانی' });
  }
});

// POST /api/audit/cycles/:id/start - Start audit cycle
router.post('/cycles/:id/start', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    await auditService.startAuditCycle(id, req.tenant!.id);
    
    res.json({ message: 'چرخه انبارگردانی با موفقیت شروع شد' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('یافت نشد')) {
      return res.status(404).json({ message: error.message });
    }
    
    console.error('Error starting audit cycle:', error);
    res.status(500).json({ message: 'خطا در شروع چرخه انبارگردانی' });
  }
});

// POST /api/audit/cycles/:id/complete - Complete audit cycle
router.post('/cycles/:id/complete', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    
    await auditService.completeAuditCycle(id, userId, req.tenant!.id);
    
    res.json({ message: 'چرخه انبارگردانی با موفقیت تکمیل شد' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('یافت نشد')) {
      return res.status(404).json({ message: error.message });
    }
    
    console.error('Error completing audit cycle:', error);
    res.status(500).json({ message: 'خطا در تکمیل چرخه انبارگردانی' });
  }
});

// POST /api/audit/cycles/:id/cancel - Cancel audit cycle
router.post('/cycles/:id/cancel', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = cancelAuditCycleSchema.parse(req.body);
    const userId = (req as any).user.id;
    
    await auditService.cancelAuditCycle(
      id,
      userId,
      validatedData.cancelledReason,
      req.tenant!.id
    );
    
    res.json({ message: 'چرخه انبارگردانی با موفقیت لغو شد' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'داده‌های ورودی نامعتبر است',
        errors: error.errors
      });
    }
    
    if (error instanceof Error && error.message.includes('یافت نشد')) {
      return res.status(404).json({ message: error.message });
    }
    
    console.error('Error cancelling audit cycle:', error);
    res.status(500).json({ message: 'خطا در لغو چرخه انبارگردانی' });
  }
});

// POST /api/audit/entries - Add audit entry (counted stock)
router.post('/entries', authenticate, requireTenant, async (req, res) => {
  try {
    // Log incoming request for debugging
    console.log('📥 POST /api/audit/entries - Request body:', JSON.stringify(req.body, null, 2));
    
    const validatedData = addAuditEntrySchema.parse(req.body);
    const userId = (req as any).user.id;
    
    const entry = await auditService.addAuditEntry(
      validatedData,
      userId,
      userId,
      req.tenant!.id
    );
    
    res.status(201).json({
      message: 'ورودی انبارگردانی با موفقیت ثبت شد',
      entry
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', JSON.stringify(error.errors, null, 2));
      return res.status(400).json({
        message: 'داده‌های ورودی نامعتبر است',
        errors: error.errors
      });
    }
    
    if (error instanceof Error && (error.message.includes('یافت نشد') || error.message.includes('غیرفعال'))) {
      return res.status(404).json({ message: error.message });
    }
    
    console.error('Error adding audit entry:', error);
    res.status(500).json({ message: 'خطا در ثبت ورودی انبارگردانی' });
  }
});

// POST /api/audit/entries/bulk - Add multiple audit entries in bulk
router.post('/entries/bulk', authenticate, requireTenant, async (req, res) => {
  try {
    const validatedData = bulkAddAuditEntriesSchema.parse(req.body);
    const userId = (req as any).user.id;
    
    const result = await auditService.addBulkAuditEntries(
      validatedData.entries,
      userId,
      userId,
      req.tenant!.id
    );
    
    res.status(201).json({
      message: `${result.created.length} ورودی انبارگردانی با موفقیت ثبت شد`,
      success: true,
      created: result.created,
      errors: result.errors,
      summary: {
        total: validatedData.entries.length,
        successful: result.created.length,
        failed: result.errors.length
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'داده‌های ورودی نامعتبر است',
        errors: error.errors
      });
    }
    
    if (error instanceof Error && (error.message.includes('یافت نشد') || error.message.includes('غیرفعال'))) {
      return res.status(404).json({ message: error.message });
    }
    
    console.error('Error adding bulk audit entries:', error);
    res.status(500).json({ message: 'خطا در ثبت ورودی‌های انبارگردانی' });
  }
});

// GET /api/audit/cycles/:id/discrepancy-report - Generate discrepancy report
router.get('/cycles/:id/discrepancy-report', authenticate, requireTenant, async (req, res) => {
  try {
    const { id } = req.params;
    const report = await auditService.generateDiscrepancyReport(id, req.tenant!.id);
    
    res.json(report);
  } catch (error) {
    if (error instanceof Error && error.message.includes('یافت نشد')) {
      return res.status(404).json({ message: error.message });
    }
    
    console.error('Error generating discrepancy report:', error);
    res.status(500).json({ message: 'خطا در تولید گزارش اختلاف' });
  }
});

// POST /api/audit/entries/:id/apply-correction - Apply correction for discrepancy
router.post('/entries/:id/apply-correction', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = applyCorrectionSchema.parse(req.body);
    const userId = (req as any).user.id;
    
    const result = await auditService.applyCorrection(
      id,
      validatedData.reason,
      userId,
      req.tenant!.id
    );
    
    res.json({
      message: 'اصلاح موجودی با موفقیت اعمال شد',
      inventoryEntry: result.inventoryEntry,
      auditEntry: result.auditEntry
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'داده‌های ورودی نامعتبر است',
        errors: error.errors
      });
    }
    
    if (error instanceof Error && (error.message.includes('یافت نشد') || error.message.includes('نیازی به اصلاح'))) {
      return res.status(400).json({ message: error.message });
    }
    
    console.error('Error applying correction:', error);
    res.status(500).json({ message: 'خطا در اعمال اصلاح موجودی' });
  }
});

export default router;

