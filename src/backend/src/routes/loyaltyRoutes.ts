import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { requireTenant } from '../middlewares/tenantMiddleware';
import {
  addLoyaltyPoints,
  redeemLoyaltyPoints,
  getLoyaltyTransactions,
  getCustomerLoyaltyDetails,
  awardBirthdayBonus,
  getLoyaltyStatistics,
  getTierBenefits,
  calculateTierRequirements,
  LoyaltyTransactionFilter,
  LoyaltyTransactionData,
  LoyaltyRedemption
} from '../services/loyaltyService';
import { AppError } from '../middlewares/errorHandler';
import { prisma } from '../services/dbService';

const router = Router();

// Validation schemas
const addPointsSchema = z.object({
  customerId: z.string().uuid('شناسه مشتری نامعتبر است'),
  pointsToAdd: z.number().min(1, 'تعداد امتیاز باید مثبت باشد').max(10000, 'حداکثر 10000 امتیاز در هر تراکنش'),
  transactionType: z.enum([
    'EARNED_PURCHASE', 'EARNED_BONUS', 'EARNED_REFERRAL', 'EARNED_BIRTHDAY'
  ]),
  description: z.string().min(5, 'توضیحات باید حداقل 5 کاراکتر باشد').max(500, 'توضیحات نباید بیش از 500 کاراکتر باشد'),
  notes: z.string().max(200, 'یادداشت نباید بیش از 200 کاراکتر باشد').optional(),
  visitId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  orderReference: z.string().max(100).optional(),
  relatedAmount: z.number().min(0).optional()
});

const redeemPointsSchema = z.object({
  customerId: z.string().uuid('شناسه مشتری نامعتبر است'),
  pointsToRedeem: z.number().min(1, 'تعداد امتیاز باید مثبت باشد'),
  description: z.string().min(5, 'توضیحات باید حداقل 5 کاراکتر باشد').max(500, 'توضیحات نباید بیش از 500 کاراکتر باشد'),
  orderReference: z.string().max(100).optional(),
  relatedAmount: z.number().min(0).optional()
});

const transactionFilterSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  customerId: z.string().uuid().optional(),
  transactionType: z.enum([
    'EARNED_PURCHASE', 'EARNED_BONUS', 'EARNED_REFERRAL', 'EARNED_BIRTHDAY',
    'REDEEMED_DISCOUNT', 'REDEEMED_ITEM', 'ADJUSTMENT_ADD', 'ADJUSTMENT_SUBTRACT', 'EXPIRED'
  ]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

const birthdayBonusSchema = z.object({
  customerId: z.string().uuid('شناسه مشتری نامعتبر است')
});

// POST /api/loyalty/points/add - Add loyalty points
router.post('/points/add', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER', 'STAFF']), async (req, res, next) => {
  try {
    const validatedData = addPointsSchema.parse(req.body);
    
    const result = await addLoyaltyPoints(
      validatedData.customerId,
      validatedData.pointsToAdd,
      validatedData.transactionType,
      validatedData.description,
      req.tenant!.id,
      req.user!.id,
      {
        visitId: validatedData.visitId,
        campaignId: validatedData.campaignId,
        orderReference: validatedData.orderReference,
        relatedAmount: validatedData.relatedAmount
      }
    );

    res.status(201).json({
      success: true,
      message: 'امتیاز با موفقیت اضافه شد',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/loyalty/points/redeem - Redeem loyalty points
router.post('/points/redeem', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER', 'STAFF']), async (req, res, next) => {
  try {
    const validatedData = redeemPointsSchema.parse(req.body);
    
    const result = await redeemLoyaltyPoints(
      validatedData,
      req.tenant!.id,
      req.user!.id
    );

    res.status(200).json({
      success: true,
      message: 'امتیاز با موفقیت استفاده شد',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/loyalty/transactions - Get loyalty transactions
router.get('/transactions', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER', 'STAFF']), async (req, res, next) => {
  try {
    const filter = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      customerId: req.query.customerId as string,
      transactionType: req.query.transactionType as any,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
    };

    const result = await getLoyaltyTransactions(filter, req.tenant!.id);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/loyalty/customer/:customerId - Get customer loyalty details
router.get('/customer/:customerId', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER', 'STAFF']), async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    const result = await getCustomerLoyaltyDetails(customerId, req.tenant!.id);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/loyalty/statistics - Get loyalty program statistics
router.get('/statistics', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    const result = await getLoyaltyStatistics(req.tenant!.id);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/loyalty/tiers/:tier/benefits - Get tier benefits
router.get('/tiers/:tier/benefits', authenticate, requireTenant, async (req, res, next) => {
  try {
    const { tier } = req.params;
    
    if (!['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].includes(tier)) {
      throw new AppError('سطح وفاداری نامعتبر است', 400);
    }

    const benefits = getTierBenefits(tier as any);

    res.status(200).json({
      success: true,
      data: benefits
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/loyalty/tiers/requirements/:customerId - Get tier requirements for customer
router.get('/tiers/requirements/:customerId', authenticate, requireTenant, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    const loyalty = await prisma.customerLoyalty.findUnique({
      where: { 
        customerId,
        tenantId: req.tenant!.id
      }
    });

    if (!loyalty) {
      throw new AppError('اطلاعات وفاداری مشتری یافت نشد', 404);
    }

    const requirements = calculateTierRequirements(
      loyalty.tierLevel,
      Number(loyalty.lifetimeSpent),
      loyalty.totalVisits,
      Number(loyalty.currentYearSpent)
    );

    res.status(200).json({
      success: true,
      data: requirements
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/loyalty/birthday-bonus - Award birthday bonus
router.post('/birthday-bonus', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER', 'STAFF']), async (req, res, next) => {
  try {
    const { customerId } = req.body;
    
    if (!customerId) {
      throw new AppError('شناسه مشتری الزامی است', 400);
    }

    const result = await awardBirthdayBonus(customerId, req.tenant!.id, req.user!.id);

    res.status(200).json({
      success: true,
      message: 'جایزه تولد با موفقیت اعطا شد',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/loyalty/customer/:customerId/balance - Get customer balance
router.get('/customer/:customerId/balance', authenticate, requireTenant, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    const loyalty = await prisma.customerLoyalty.findUnique({
      where: { 
        customerId,
        tenantId: req.tenant!.id
      },
      select: {
        currentPoints: true,
        tierLevel: true,
        pointsEarned: true,
        pointsRedeemed: true
      }
    });

    if (!loyalty) {
      throw new AppError('اطلاعات وفاداری مشتری یافت نشد', 404);
    }

    res.status(200).json({
      success: true,
      data: loyalty
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/loyalty/adjust/:customerId - Adjust customer points
router.post('/adjust/:customerId', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { pointsChange, reason } = req.body;
    
    if (typeof pointsChange !== 'number') {
      throw new AppError('تغییر امتیاز باید عدد باشد', 400);
    }

    if (!reason) {
      throw new AppError('دلیل تغییر امتیاز الزامی است', 400);
    }

    const transactionType = pointsChange > 0 ? 'ADJUSTMENT_ADD' : 'ADJUSTMENT_SUBTRACT';
    const description = `تنظیم دستی: ${reason}`;

    const result = await addLoyaltyPoints(
      customerId,
      Math.abs(pointsChange),
      transactionType,
      description,
      req.tenant!.id,
      req.user!.id
    );

    res.status(200).json({
      success: true,
      message: 'امتیاز با موفقیت تنظیم شد',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

export const loyaltyRoutes = router; 