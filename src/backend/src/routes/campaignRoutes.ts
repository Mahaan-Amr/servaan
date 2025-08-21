import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { requireTenant } from '../middlewares/tenantMiddleware';
import campaignService from '../services/campaignService';
import { PrismaClient } from '../../shared/generated/client';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const campaignCreateSchema = z.object({
  name: z.string().min(2, 'نام کمپین باید حداقل 2 کاراکتر باشد').max(200, 'نام کمپین نباید بیش از 200 کاراکتر باشد'),
  description: z.string().max(1000, 'توضیحات نباید بیش از 1000 کاراکتر باشد').optional().nullable(),
  campaignType: z.enum(['SMS', 'INSTAGRAM', 'EMAIL', 'PUSH']),
  targetSegment: z.record(z.any()),
  templateContent: z.string().min(10, 'محتوای کمپین باید حداقل 10 کاراکتر باشد'),
  templateVariables: z.record(z.any()).optional().nullable(),
  scheduledDate: z.string().datetime().optional(),
  estimatedCost: z.number().min(0).optional(),
  costPerMessage: z.number().min(0).optional()
});

const campaignUpdateSchema = z.object({
  name: z.string().min(2, 'نام کمپین باید حداقل 2 کاراکتر باشد').max(200, 'نام کمپین نباید بیش از 200 کاراکتر باشد').optional(),
  description: z.string().max(1000, 'توضیحات نباید بیش از 1000 کاراکتر باشد').optional().nullable(),
  targetSegment: z.record(z.any()).optional(),
  templateContent: z.string().min(10, 'محتوای کمپین باید حداقل 10 کاراکتر باشد').optional(),
  templateVariables: z.record(z.any()).optional().nullable(),
  scheduledDate: z.string().datetime().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'COMPLETED', 'CANCELLED', 'FAILED']).optional(),
  estimatedCost: z.number().min(0).optional(),
  costPerMessage: z.number().min(0).optional()
});

const campaignFilterSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  search: z.string().optional(),
  campaignType: z.enum(['SMS', 'INSTAGRAM', 'EMAIL', 'PUSH']).optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'COMPLETED', 'CANCELLED', 'FAILED']).optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  scheduledFrom: z.string().datetime().optional(),
  scheduledTo: z.string().datetime().optional()
});

const templateCreateSchema = z.object({
  name: z.string().min(2, 'نام قالب باید حداقل 2 کاراکتر باشد').max(200, 'نام قالب نباید بیش از 200 کاراکتر باشد'),
  templateType: z.enum(['SMS', 'INSTAGRAM', 'EMAIL', 'PUSH']),
  content: z.string().min(10, 'محتوای قالب باید حداقل 10 کاراکتر باشد'),
  variables: z.record(z.any()).optional(),
  category: z.string().max(50).optional(),
  isSystemTemplate: z.boolean().optional()
});

// POST /api/campaigns - Create new campaign
router.post('/', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    const validatedData = campaignCreateSchema.parse(req.body);
    
    // Convert and sanitize data for the service
    const campaignData = {
      name: validatedData.name,
      description: validatedData.description || undefined,
      campaignType: validatedData.campaignType,
      targetSegment: validatedData.targetSegment as Record<string, any>,
      templateContent: validatedData.templateContent,
      templateVariables: validatedData.templateVariables ? validatedData.templateVariables as Record<string, any> : undefined,
      scheduledDate: validatedData.scheduledDate ? new Date(validatedData.scheduledDate) : undefined,
      estimatedCost: validatedData.estimatedCost,
      costPerMessage: validatedData.costPerMessage,
      tenantId: req.tenant!.id // Add tenantId from context
    };
    
    const campaign = await campaignService.createCampaign(campaignData, req.user!.id);
    
    res.status(201).json({
      success: true,
      message: 'کمپین با موفقیت ایجاد شد',
      campaign
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        message: 'اطلاعات نامعتبر', 
        errors: error.errors 
      });
    }
    next(error);
  }
});

// GET /api/campaigns - Get campaigns with filtering
router.get('/', authenticate, requireTenant, async (req, res, next) => {
  try {
    const filter = campaignFilterSchema.parse(req.query);
    
    // Convert date strings to Date objects
    const campaignFilter = {
      ...filter,
      createdFrom: filter.createdFrom ? new Date(filter.createdFrom) : undefined,
      createdTo: filter.createdTo ? new Date(filter.createdTo) : undefined,
      scheduledFrom: filter.scheduledFrom ? new Date(filter.scheduledFrom) : undefined,
      scheduledTo: filter.scheduledTo ? new Date(filter.scheduledTo) : undefined
    };
    
    const result = await campaignService.getCampaigns(campaignFilter, req.tenant!.id);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        message: 'پارامترهای جستجو نامعتبر', 
        errors: error.errors 
      });
    }
    next(error);
  }
});

// GET /api/campaigns/analytics - Get campaign analytics
router.get('/analytics', authenticate, requireTenant, async (req, res, next) => {
  try {
    const analytics = await campaignService.getCampaignAnalytics(req.tenant!.id);
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/campaigns/:id - Get campaign by ID
router.get('/:id', authenticate, requireTenant, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'شناسه کمپین الزامی است'
      });
    }
    
    const campaign = await campaignService.getCampaignById(id, req.tenant!.id);
    
    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'کمپین یافت نشد') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
});

// GET /api/campaigns/:id/performance - Get campaign performance
router.get('/:id/performance', authenticate, requireTenant, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'شناسه کمپین الزامی است'
      });
    }
    
    const performance = await campaignService.getCampaignPerformance(id, req.tenant!.id);
    
    res.json({
      success: true,
      performance
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'کمپین یافت نشد') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
});

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = campaignUpdateSchema.parse(req.body);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'شناسه کمپین الزامی است'
      });
    }
    
    // Convert and sanitize data for the service
    const updateData = {
      ...validatedData,
      description: validatedData.description || undefined,
      targetSegment: validatedData.targetSegment ? validatedData.targetSegment as Record<string, any> : undefined,
      templateVariables: validatedData.templateVariables ? validatedData.templateVariables as Record<string, any> : undefined,
      scheduledDate: validatedData.scheduledDate ? new Date(validatedData.scheduledDate) : undefined
    };
    
    const campaign = await campaignService.updateCampaign(id, updateData, req.user!.id, req.tenant!.id);
    
    res.json({
      success: true,
      message: 'کمپین با موفقیت بروزرسانی شد',
      campaign
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        message: 'اطلاعات نامعتبر', 
        errors: error.errors 
      });
    }
    if (error instanceof Error && (error.message === 'کمپین یافت نشد' || error.message.includes('نمی‌توان کمپین'))) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
});

// DELETE /api/campaigns/:id - Delete campaign
router.delete('/:id', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'شناسه کمپین الزامی است'
      });
    }
    
    const result = await campaignService.deleteCampaign(id, req.tenant!.id);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    if (error instanceof Error && (error.message === 'کمپین یافت نشد' || error.message.includes('نمی‌توان کمپین'))) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
});

// POST /api/campaigns/:id/send - Send campaign
router.post('/:id/send', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'شناسه کمپین الزامی است'
      });
    }
    
    const result = await campaignService.sendCampaign(id, req.user!.id, req.tenant!.id);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    if (error instanceof Error && (error.message === 'کمپین یافت نشد' || error.message.includes('فقط کمپین‌های'))) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
});

// POST /api/campaigns/:id/duplicate - Duplicate campaign
router.post('/:id/duplicate', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'شناسه کمپین الزامی است'
      });
    }
    
    const originalCampaign = await campaignService.getCampaignById(id, req.tenant!.id);
    
    const duplicatedCampaign = await campaignService.createCampaign({
      name: `کپی از ${originalCampaign.name}`,
      description: originalCampaign.description || undefined,
      campaignType: originalCampaign.campaignType,
      targetSegment: originalCampaign.targetSegment as Record<string, any>,
      templateContent: originalCampaign.templateContent,
      templateVariables: originalCampaign.templateVariables as Record<string, any>,
      costPerMessage: Number(originalCampaign.costPerMessage) || 100,
      tenantId: req.tenant!.id // Add tenantId
    }, req.user!.id);
    
    res.status(201).json({
      success: true,
      message: 'کمپین با موفقیت کپی شد',
      campaign: duplicatedCampaign
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'کمپین یافت نشد') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
});

// Campaign Templates

// GET /api/campaigns/templates - Get campaign templates
router.get('/templates/list', authenticate, requireTenant, async (req, res, next) => {
  try {
    const { type, category } = req.query;
    
    const where: any = {
      tenantId: req.tenant!.id // Add tenant filtering
    };
    
    if (type) {
      where.templateType = type;
    }
    
    if (category) {
      where.category = category;
    }
    
    const templates = await prisma.campaignTemplate.findMany({
      where,
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { isSystemTemplate: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/campaigns/templates - Create campaign template
router.post('/templates', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    const validatedData = templateCreateSchema.parse(req.body);
    
    const template = await prisma.campaignTemplate.create({
      data: {
        ...validatedData,
        createdBy: req.user!.id,
        tenantId: req.tenant!.id // Add tenantId
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'قالب کمپین با موفقیت ایجاد شد',
      template
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        message: 'اطلاعات نامعتبر', 
        errors: error.errors 
      });
    }
    next(error);
  }
});

// GET /api/campaigns/templates/:id - Get template by ID
router.get('/templates/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const template = await prisma.campaignTemplate.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'قالب یافت نشد'
      });
    }
    
    res.json({
      success: true,
      template
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/campaigns/templates/:id - Update template
router.put('/templates/:id', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = templateCreateSchema.partial().parse(req.body);
    
    const existingTemplate = await prisma.campaignTemplate.findUnique({
      where: { id }
    });
    
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: 'قالب یافت نشد'
      });
    }
    
    // Prevent updating system templates
    if (existingTemplate.isSystemTemplate) {
      return res.status(400).json({
        success: false,
        message: 'نمی‌توان قالب‌های سیستمی را ویرایش کرد'
      });
    }
    
    const template = await prisma.campaignTemplate.update({
      where: { id },
      data: validatedData,
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      message: 'قالب با موفقیت بروزرسانی شد',
      template
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        message: 'اطلاعات نامعتبر', 
        errors: error.errors 
      });
    }
    next(error);
  }
});

// DELETE /api/campaigns/templates/:id - Delete template
router.delete('/templates/:id', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const existingTemplate = await prisma.campaignTemplate.findUnique({
      where: { id }
    });
    
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: 'قالب یافت نشد'
      });
    }
    
    // Prevent deleting system templates
    if (existingTemplate.isSystemTemplate) {
      return res.status(400).json({
        success: false,
        message: 'نمی‌توان قالب‌های سیستمی را حذف کرد'
      });
    }
    
    await prisma.campaignTemplate.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'قالب با موفقیت حذف شد'
    });
  } catch (error) {
    next(error);
  }
});

export const campaignRoutes = router; 
