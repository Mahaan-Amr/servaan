import { Router } from 'express';
import { prisma } from '../services/dbService';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { notificationService } from '../services/notificationService';

const router = Router();

// Schema for item creation/validation
const itemSchema = z.object({
  name: z.string().min(2, { message: 'نام کالا باید حداقل ۲ کاراکتر باشد' }),
  category: z.string().min(2, { message: 'دسته‌بندی باید حداقل ۲ کاراکتر باشد' }),
  unit: z.string().min(1, { message: 'واحد اندازه‌گیری الزامی است' }),
  minStock: z.number().positive().optional(),
  description: z.string().optional(),
  barcode: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional().default(true)
});

// GET /api/items - Get all items
router.get('/', async (req, res) => {
  try {
    // Ensure tenant context is available
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    const items = await prisma.item.findMany({
      orderBy: {
        name: 'asc'
      },
      where: {
        // Filter by tenant to ensure data isolation
        tenantId: req.tenant.id,
        // By default, only show active items unless explicitly requested
        isActive: req.query.includeInactive === 'true' ? undefined : true,
        // If category param is provided, filter by it
        ...(req.query.category && {
          category: req.query.category as string
        }),
        // If search param is provided, search in name
        ...(req.query.search && {
          name: {
            contains: req.query.search as string,
            mode: 'insensitive'
          }
        })
      },
      include: {
        // Include suppliers when requested for reports
        ...(req.query.includeSuppliers === 'true' && {
          suppliers: {
            include: {
              supplier: true
            }
          }
        })
      }
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'خطا در دریافت کالاها' });
  }
});

// Get total items count (MUST come before /:id route)
router.get('/count', authenticate, async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    const count = await prisma.item.count({
      where: {
        tenantId: req.tenant.id,  // Filter by tenant
        isActive: true
      }
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error getting items count:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تعداد کالاها',
      error: (error as Error).message
    });
  }
});

// GET /api/items/:id - Get an item by ID (MUST come after specific routes)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await prisma.item.findFirst({
      where: { 
        id: req.params.id,
        tenantId: (req as any).user.tenantId  // Filter by tenant
      },
      include: {
        inventoryEntries: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10, // Get only the 10 most recent entries
          include: {
            user: {
              select: {
                name: true,
                id: true
              }
            }
          }
        },
        suppliers: {
          include: {
            supplier: true
          }
        }
      }
    });
    
    if (!item) {
      return res.status(404).json({ message: 'کالا یافت نشد' });
    }
    
    // Return 404 for inactive items unless explicitly requested
    if (!item.isActive && req.query.includeInactive !== 'true') {
      return res.status(404).json({ message: 'کالا یافت نشد' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ message: 'خطا در دریافت اطلاعات کالا' });
  }
});

// POST /api/items - Create a new item
router.post('/', authenticate, async (req, res) => {
  try {
    // Validate input
    const validatedData = itemSchema.parse(req.body);
    
    // Create item with tenant context
    const newItem = await prisma.item.create({
      data: {
        ...validatedData,
        tenantId: (req as any).user.tenantId  // Add tenant context
      }
    });

    // Send item creation notification
    try {
      await notificationService.sendUserActivityNotification({
        userId: (req as any).user.id,
        userName: (req as any).user.name,
        action: 'ایجاد کرد',
        entityType: 'کالا',
        entityId: newItem.id,
        entityName: newItem.name,
        tenantId: req.tenant!.id
      });
    } catch (notificationError) {
      console.error('Error sending item creation notification:', notificationError);
      // Don't fail the request if notification fails
    }
    
    res.status(201).json(newItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'اطلاعات نامعتبر', errors: error.errors });
    }
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'خطا در ایجاد کالای جدید' });
  }
});

// PUT /api/items/:id - Update an item
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Get item to check if exists and belongs to tenant
    const item = await prisma.item.findFirst({
      where: { 
        id: req.params.id,
        tenantId: (req as any).user.tenantId  // Filter by tenant
      }
    });
    
    if (!item) {
      return res.status(404).json({ message: 'کالا یافت نشد' });
    }
    
    // Validate input
    const validatedData = itemSchema.parse(req.body);
    
    // Update the item
    const updatedItem = await prisma.item.update({
      where: { id: req.params.id },
      data: validatedData
    });
    
    res.json(updatedItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'اطلاعات نامعتبر', errors: error.errors });
    }
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'خطا در بروزرسانی کالا' });
  }
});

// DELETE /api/items/:id - Delete an item (restricted to ADMIN)
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    // Check if item exists and belongs to tenant
    const item = await prisma.item.findFirst({
      where: { 
        id: req.params.id,
        tenantId: (req as any).user.tenantId  // Filter by tenant
      },
      include: {
        inventoryEntries: {
          select: { id: true },
          take: 1
        }
      }
    });
    
    if (!item) {
      return res.status(404).json({ message: 'کالا یافت نشد' });
    }
    
    // If the item has inventory entries, use soft delete
    if (item.inventoryEntries.length > 0) {
      await prisma.item.update({
        where: { id: req.params.id },
        data: { isActive: false }
      });
      
      // Send deletion notification
      try {
        await notificationService.sendUserActivityNotification({
          userId: (req as any).user.id,
          userName: (req as any).user.name,
          action: 'غیرفعال کرد',
          entityType: 'کالا',
          entityId: item.id,
          entityName: item.name,
          tenantId: req.tenant!.id
        });
      } catch (notificationError) {
        console.error('Error sending item deactivation notification:', notificationError);
        // Don't fail the request if notification fails
      }
      
      return res.json({ message: 'کالا غیرفعال شد (حذف نرم)' });
    }
    
    // If no inventory entries, we can hard delete
    await prisma.item.delete({
      where: { id: req.params.id }
    });
    
    // Send deletion notification
    try {
      await notificationService.sendUserActivityNotification({
        userId: (req as any).user.id,
        userName: (req as any).user.name,
        action: 'حذف کرد',
        entityType: 'کالا',
        entityId: item.id,
        entityName: item.name,
        tenantId: req.tenant!.id
      });
    } catch (notificationError) {
      console.error('Error sending item deletion notification:', notificationError);
      // Don't fail the request if notification fails
    }
    
    res.json({ message: 'کالا با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'خطا در حذف کالا' });
  }
});

export const itemRoutes = router; 