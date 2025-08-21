import { Router } from 'express';
import { AccountingController } from '../controllers/accountingController';
import { authenticate } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validation';
import { body, query, param } from 'express-validator';
import { prisma } from '../services/dbService';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Custom CUID validator
const isCuid = (value: string) => {
  // CUID format: starts with 'c' followed by 24 alphanumeric characters
  const cuidRegex = /^c[a-z0-9]{24}$/;
  return cuidRegex.test(value);
};

// ==========================================
// CHART OF ACCOUNTS ROUTES
// ==========================================

/**
 * Initialize Iranian Chart of Accounts
 * POST /api/accounting/chart-of-accounts/initialize
 */
router.post(
  '/chart-of-accounts/initialize',
  AccountingController.initializeChartOfAccounts
);

/**
 * Get account hierarchy
 * GET /api/accounting/chart-of-accounts/hierarchy
 */
router.get(
  '/chart-of-accounts/hierarchy',
  [
    query('accountType')
      .optional()
      .isIn(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])
      .withMessage('نوع حساب نامعتبر است')
  ],
  validateRequest,
  AccountingController.getAccountHierarchy
);

/**
 * Create new account
 * POST /api/accounting/chart-of-accounts
 */
router.post(
  '/chart-of-accounts',
  [
    body('accountCode')
      .notEmpty()
      .withMessage('کد حساب الزامی است')
      .isLength({ max: 20 })
      .withMessage('کد حساب نباید بیش از 20 کاراکتر باشد'),
    body('accountName')
      .notEmpty()
      .withMessage('نام حساب الزامی است')
      .isLength({ max: 255 })
      .withMessage('نام حساب نباید بیش از 255 کاراکتر باشد'),
    body('accountType')
      .isIn(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])
      .withMessage('نوع حساب نامعتبر است'),
    body('normalBalance')
      .isIn(['DEBIT', 'CREDIT'])
      .withMessage('نوع مانده طبیعی نامعتبر است'),
    body('parentAccountId')
      .optional()
      .custom(isCuid)
      .withMessage('شناسه حساب والد نامعتبر است')
  ],
  validateRequest,
  AccountingController.createAccount
);

/**
 * Search accounts
 * GET /api/accounting/chart-of-accounts/search
 */
router.get(
  '/chart-of-accounts/search',
  [
    query('query')
      .notEmpty()
      .withMessage('پارامتر جستجو الزامی است'),
    query('accountType')
      .optional()
      .isIn(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])
      .withMessage('نوع حساب نامعتبر است')
  ],
  validateRequest,
  AccountingController.searchAccounts
);

/**
 * Get account balance
 * GET /api/accounting/chart-of-accounts/:accountId/balance
 */
router.get(
  '/chart-of-accounts/:accountId/balance',
  [
    param('accountId')
      .custom(isCuid)
      .withMessage('شناسه حساب نامعتبر است'),
    query('asOfDate')
      .optional()
      .isISO8601()
      .withMessage('تاریخ نامعتبر است')
  ],
  validateRequest,
  AccountingController.getAccountBalance
);

/**
 * Get single account by ID
 * GET /api/accounting/chart-of-accounts/:id
 */
router.get(
  '/chart-of-accounts/:id',
  [
    param('id')
      .custom(isCuid)
      .withMessage('شناسه حساب نامعتبر است')
  ],
  validateRequest,
  AccountingController.getAccountById
);

/**
 * Update account
 * PUT /api/accounting/chart-of-accounts/:id
 */
router.put(
  '/chart-of-accounts/:id',
  [
    param('id')
      .custom(isCuid)
      .withMessage('شناسه حساب نامعتبر است'),
    body('accountCode')
      .optional()
      .isLength({ max: 20 })
      .withMessage('کد حساب نباید بیش از 20 کاراکتر باشد'),
    body('accountName')
      .optional()
      .isLength({ max: 255 })
      .withMessage('نام حساب نباید بیش از 255 کاراکتر باشد'),
    body('accountType')
      .optional()
      .isIn(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])
      .withMessage('نوع حساب نامعتبر است'),
    body('normalBalance')
      .optional()
      .isIn(['DEBIT', 'CREDIT'])
      .withMessage('نوع مانده طبیعی نامعتبر است'),
    body('parentAccountId')
      .optional()
      .custom(isCuid)
      .withMessage('شناسه حساب والد نامعتبر است'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('توضیحات نباید بیش از 1000 کاراکتر باشد')
  ],
  validateRequest,
  AccountingController.updateAccount
);

// ==========================================
// JOURNAL ENTRIES ROUTES
// ==========================================

/**
 * Create journal entry
 * POST /api/accounting/journal-entries
 */
router.post(
  '/journal-entries',
  [
    body('entryDate')
      .isISO8601()
      .withMessage('تاریخ سند نامعتبر است'),
    body('description')
      .notEmpty()
      .withMessage('شرح سند الزامی است')
      .isLength({ max: 1000 })
      .withMessage('شرح سند نباید بیش از 1000 کاراکتر باشد'),
    body('reference')
      .optional({ nullable: true, checkFalsy: true })
      .isLength({ max: 100 })
      .withMessage('شماره مرجع نباید بیش از 100 کاراکتر باشد'),
    body('lines')
      .isArray({ min: 2 })
      .withMessage('سند باید حداقل 2 سطر داشته باشد'),
    body('lines.*.accountId')
      .custom(isCuid)
      .withMessage('شناسه حساب نامعتبر است'),
    body('lines.*.description')
      .optional({ nullable: true, checkFalsy: true })
      .isLength({ max: 500 })
      .withMessage('شرح سطر نباید بیش از 500 کاراکتر باشد'),
    body('lines.*.debitAmount')
      .isNumeric({ no_symbols: false })
      .withMessage('مبلغ بدهکار باید عدد باشد')
      .custom((value) => {
        const num = Number(value);
        if (num < 0) {
          throw new Error('مبلغ بدهکار نمی‌تواند منفی باشد');
        }
        return true;
      }),
    body('lines.*.creditAmount')
      .isNumeric({ no_symbols: false })
      .withMessage('مبلغ بستانکار باید عدد باشد')
      .custom((value) => {
        const num = Number(value);
        if (num < 0) {
          throw new Error('مبلغ بستانکار نمی‌تواند منفی باشد');
        }
        return true;
      }),
    body('lines.*.costCenterId')
      .optional({ nullable: true, checkFalsy: true })
      .custom(isCuid)
      .withMessage('شناسه مرکز هزینه نامعتبر است'),
    body('lines.*.projectCode')
      .optional({ nullable: true, checkFalsy: true })
      .isLength({ max: 50 })
      .withMessage('کد پروژه نباید بیش از 50 کاراکتر باشد')
  ],
  validateRequest,
  AccountingController.createJournalEntry
);

/**
 * Get journal entries
 * GET /api/accounting/journal-entries
 */
router.get(
  '/journal-entries',
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('تاریخ شروع نامعتبر است'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('تاریخ پایان نامعتبر است'),
    query('status')
      .optional()
      .isIn(['DRAFT', 'POSTED', 'REVERSED'])
      .withMessage('وضعیت سند نامعتبر است'),
    query('sourceType')
      .optional()
      .isIn(['MANUAL', 'POS', 'INVENTORY', 'PAYROLL', 'SYSTEM', 'BANK', 'PURCHASE'])
      .withMessage('نوع منبع نامعتبر است'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('شماره صفحه باید عدد مثبت باشد'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('تعداد رکورد باید بین 1 تا 100 باشد')
  ],
  validateRequest,
  AccountingController.getJournalEntries
);

/**
 * Get journal entry by ID
 * GET /api/accounting/journal-entries/:id
 */
router.get(
  '/journal-entries/:id',
  [
    param('id')
      .custom(isCuid)
      .withMessage('شناسه سند نامعتبر است')
  ],
  validateRequest,
  AccountingController.getJournalEntryById
);

/**
 * Post journal entry
 * PUT /api/accounting/journal-entries/:id/post
 */
router.put(
  '/journal-entries/:id/post',
  [
    param('id')
      .custom(isCuid)
      .withMessage('شناسه سند نامعتبر است')
  ],
  validateRequest,
  AccountingController.postJournalEntry
);

/**
 * Reverse journal entry
 * PUT /api/accounting/journal-entries/:id/reverse
 */
router.put(
  '/journal-entries/:id/reverse',
  [
    param('id')
      .custom(isCuid)
      .withMessage('شناسه سند نامعتبر است'),
    body('reversalReason')
      .notEmpty()
      .withMessage('دلیل ابطال الزامی است')
      .isLength({ max: 500 })
      .withMessage('دلیل ابطال نباید بیش از 500 کاراکتر باشد')
  ],
  validateRequest,
  AccountingController.reverseJournalEntry
);

/**
 * Update journal entry
 * PUT /api/accounting/journal-entries/:id
 */
router.put(
  '/journal-entries/:id',
  [
    param('id')
      .custom(isCuid)
      .withMessage('شناسه سند نامعتبر است'),
    body('entryDate')
      .optional()
      .isISO8601()
      .withMessage('تاریخ سند نامعتبر است'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('شرح سند نباید بیش از 1000 کاراکتر باشد'),
    body('reference')
      .optional({ nullable: true, checkFalsy: true })
      .isLength({ max: 100 })
      .withMessage('شماره مرجع نباید بیش از 100 کاراکتر باشد'),
    body('lines')
      .optional()
      .isArray({ min: 2 })
      .withMessage('سند باید حداقل 2 سطر داشته باشد'),
    body('lines.*.accountId')
      .optional()
      .custom(isCuid)
      .withMessage('شناسه حساب نامعتبر است'),
    body('lines.*.description')
      .optional({ nullable: true, checkFalsy: true })
      .isLength({ max: 500 })
      .withMessage('شرح سطر نباید بیش از 500 کاراکتر باشد'),
    body('lines.*.debitAmount')
      .optional()
      .isNumeric({ no_symbols: false })
      .withMessage('مبلغ بدهکار باید عدد باشد')
      .custom((value) => {
        const num = Number(value);
        if (num < 0) {
          throw new Error('مبلغ بدهکار نمی‌تواند منفی باشد');
        }
        return true;
      }),
    body('lines.*.creditAmount')
      .optional()
      .isNumeric({ no_symbols: false })
      .withMessage('مبلغ بستانکار باید عدد باشد')
      .custom((value) => {
        const num = Number(value);
        if (num < 0) {
          throw new Error('مبلغ بستانکار نمی‌تواند منفی باشد');
        }
        return true;
      }),
    body('lines.*.costCenterId')
      .optional({ nullable: true, checkFalsy: true })
      .custom(isCuid)
      .withMessage('شناسه مرکز هزینه نامعتبر است'),
    body('lines.*.projectCode')
      .optional({ nullable: true, checkFalsy: true })
      .isLength({ max: 50 })
      .withMessage('کد پروژه نباید بیش از 50 کاراکتر باشد')
  ],
  validateRequest,
  AccountingController.updateJournalEntry
);

/**
 * Delete journal entry
 * DELETE /api/accounting/journal-entries/:id
 */
router.delete(
  '/journal-entries/:id',
  [
    param('id')
      .custom(isCuid)
      .withMessage('شناسه سند نامعتبر است')
  ],
  validateRequest,
  AccountingController.deleteJournalEntry
);

/**
 * Get trial balance
 * GET /api/accounting/trial-balance
 */
router.get(
  '/trial-balance',
  [
    query('asOfDate')
      .optional()
      .isISO8601()
      .withMessage('تاریخ نامعتبر است')
  ],
  validateRequest,
  AccountingController.getTrialBalance
);

// ==========================================
// FINANCIAL STATEMENTS ROUTES
// ==========================================

/**
 * Generate balance sheet
 * GET /api/accounting/financial-statements/balance-sheet
 */
router.get(
  '/financial-statements/balance-sheet',
  [
    query('asOfDate')
      .optional()
      .isISO8601()
      .withMessage('تاریخ نامعتبر است')
  ],
  validateRequest,
  AccountingController.generateBalanceSheet
);

/**
 * Generate income statement
 * GET /api/accounting/financial-statements/income-statement
 */
router.get(
  '/financial-statements/income-statement',
  [
    query('startDate')
      .isISO8601()
      .withMessage('تاریخ شروع الزامی و نامعتبر است'),
    query('endDate')
      .isISO8601()
      .withMessage('تاریخ پایان الزامی و نامعتبر است')
  ],
  validateRequest,
  AccountingController.generateIncomeStatement
);

/**
 * Generate cash flow statement
 * GET /api/accounting/financial-statements/cash-flow
 */
router.get(
  '/financial-statements/cash-flow',
  [
    query('startDate')
      .isISO8601()
      .withMessage('تاریخ شروع الزامی و نامعتبر است'),
    query('endDate')
      .isISO8601()
      .withMessage('تاریخ پایان الزامی و نامعتبر است')
  ],
  validateRequest,
  AccountingController.generateCashFlowStatement
);

/**
 * Get financial ratios
 * GET /api/accounting/financial-statements/ratios
 */
router.get(
  '/financial-statements/ratios',
  [
    query('asOfDate')
      .optional()
      .isISO8601()
      .withMessage('تاریخ نامعتبر است')
  ],
  validateRequest,
  AccountingController.getFinancialRatios
);

/**
 * Get comparative statements
 * GET /api/accounting/financial-statements/comparative
 */
router.get(
  '/financial-statements/comparative',
  [
    query('currentPeriodEnd')
      .isISO8601()
      .withMessage('تاریخ پایان دوره جاری الزامی و نامعتبر است'),
    query('previousPeriodEnd')
      .isISO8601()
      .withMessage('تاریخ پایان دوره قبلی الزامی و نامعتبر است')
  ],
  validateRequest,
  AccountingController.getComparativeStatements
);

// ==========================================
// AUTOMATIC JOURNAL ENTRIES ROUTES
// ==========================================

/**
 * Generate sales journal entry
 * POST /api/accounting/journal-entries/sales
 */
router.post(
  '/journal-entries/sales',
  [
    body('saleId')
      .notEmpty()
      .withMessage('شناسه فروش الزامی است'),
    body('totalAmount')
      .isNumeric()
      .withMessage('مبلغ کل باید عدد باشد'),
    body('taxAmount')
      .isNumeric()
      .withMessage('مبلغ مالیات باید عدد باشد'),
    body('costOfGoodsSold')
      .isNumeric()
      .withMessage('بهای تمام شده باید عدد باشد'),
    body('paymentMethod')
      .isIn(['CASH', 'CARD', 'CREDIT'])
      .withMessage('روش پرداخت نامعتبر است')
  ],
  validateRequest,
  AccountingController.generateSalesEntry
);

/**
 * Generate purchase journal entry
 * POST /api/accounting/journal-entries/purchase
 */
router.post(
  '/journal-entries/purchase',
  [
    body('purchaseId')
      .notEmpty()
      .withMessage('شناسه خرید الزامی است'),
    body('totalAmount')
      .isNumeric()
      .withMessage('مبلغ کل باید عدد باشد'),
    body('taxAmount')
      .isNumeric()
      .withMessage('مبلغ مالیات باید عدد باشد'),
    body('paymentMethod')
      .isIn(['CASH', 'CARD', 'CREDIT'])
      .withMessage('روش پرداخت نامعتبر است')
  ],
  validateRequest,
  AccountingController.generatePurchaseEntry
);

/**
 * Get cost centers
 * GET /api/accounting/cost-centers
 */
router.get('/cost-centers', AccountingController.getCostCenters);

// Accounting dashboard summary endpoint
router.get('/summary', AccountingController.getSummary);

// Get accounts count
router.get('/accounts/count', authenticate, async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    // Note: ChartOfAccount model doesn't have tenantId field yet
    // For MVP, return count without tenant filtering but with auth requirement
    const count = await prisma.chartOfAccount.count({
      where: {
        isActive: true
      }
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error getting accounts count:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تعداد حساب‌ها',
      error: (error as Error).message
    });
  }
});

// Get journal entries count
router.get('/journal-entries/count', authenticate, async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    // Filter by tenant through the user relation
    const count = await prisma.journalEntry.count({
      where: {
        createdByUser: {
          tenantId: req.tenant.id
        }
      }
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error getting journal entries count:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تعداد سند حسابداری',
      error: (error as Error).message
    });
  }
});

// Get monthly journal entries count
router.get('/journal-entries/monthly/count', authenticate, async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Filter by tenant through the user relation and current month
    const count = await prisma.journalEntry.count({
      where: {
        createdByUser: {
          tenantId: req.tenant.id
        },
        entryDate: {
          gte: firstDayOfMonth,
          lt: firstDayOfNextMonth
        }
      }
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error getting monthly journal entries count:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تعداد اسناد ماه جاری',
      error: (error as Error).message
    });
  }
});

// Get today's balance
router.get('/balance/today', authenticate, async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Calculate balance from today's transactions filtered by tenant
    const todayEntries = await prisma.journalEntry.findMany({
      where: {
        createdByUser: {
          tenantId: req.tenant.id
        },
        entryDate: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        lines: true
      }
    });

    let totalDebit = 0;
    let totalCredit = 0;

    todayEntries.forEach((entry: any) => {
      entry.lines.forEach((line: any) => {
        totalDebit += Number(line.debitAmount) || 0;
        totalCredit += Number(line.creditAmount) || 0;
      });
    });

    const balance = totalDebit - totalCredit;

    res.json({ 
      success: true, 
      data: { 
        balance,
        totalDebit,
        totalCredit,
        entriesCount: todayEntries.length
      } 
    });
  } catch (error) {
    console.error('Error getting today balance:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت موجودی امروز',
      error: (error as Error).message
    });
  }
});

export default router; 
