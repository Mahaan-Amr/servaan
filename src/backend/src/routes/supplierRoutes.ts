import { Router } from 'express';
import { prisma } from '../services/dbService';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { requireTenant } from '../middlewares/tenantMiddleware';

const router = Router();

// Apply authentication middleware to all supplier routes
router.use(authenticate);

// Schema for supplier creation/validation
const supplierSchema = z.object({
  name: z.string().min(3),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional()
});

// GET /api/suppliers - Get all suppliers
router.get('/', requireTenant, async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: {
        isActive: req.query.active === 'true' ? true : undefined,
        tenantId: req.tenant!.id
      },
      orderBy: {
        name: 'asc'
      }
    });
    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ message: 'خطا در دریافت تأمین‌کنندگان' });
  }
});

// GET /api/suppliers/:id - Get a supplier by ID
router.get('/:id', requireTenant, async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { 
        id: req.params.id,
        tenantId: req.tenant!.id
      },
      include: {
        items: {
          include: {
            item: true
          }
        }
      }
    });
    
    if (!supplier) {
      return res.status(404).json({ message: 'تأمین‌کننده یافت نشد' });
    }
    
    res.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ message: 'خطا در دریافت اطلاعات تأمین‌کننده' });
  }
});

// POST /api/suppliers - Create a new supplier (restricted to ADMIN and MANAGER)
router.post('/', requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    // Validate input
    const validatedData = supplierSchema.parse(req.body);
    
    // Create supplier
    const newSupplier = await prisma.supplier.create({
      data: {
        name: validatedData.name,
        contactName: validatedData.contactName,
        email: validatedData.email,
        phoneNumber: validatedData.phoneNumber,
        address: validatedData.address,
        notes: validatedData.notes,
        isActive: validatedData.isActive !== undefined ? validatedData.isActive : true,
        tenantId: req.tenant!.id
      }
    });
    
    res.status(201).json(newSupplier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'اطلاعات نامعتبر', errors: error.errors });
    }
    console.error('Error creating supplier:', error);
    res.status(500).json({ message: 'خطا در ایجاد تأمین‌کننده جدید' });
  }
});

// PUT /api/suppliers/:id - Update a supplier (restricted to ADMIN and MANAGER)
router.put('/:id', requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    // Validate input
    const validatedData = supplierSchema.parse(req.body);
    
    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { 
        id: req.params.id,
        tenantId: req.tenant!.id
      }
    });
    
    if (!supplier) {
      return res.status(404).json({ message: 'تأمین‌کننده یافت نشد' });
    }
    
    // Update supplier
    const updatedSupplier = await prisma.supplier.update({
      where: { 
        id: req.params.id,
        tenantId: req.tenant!.id
      },
      data: {
        name: validatedData.name,
        contactName: validatedData.contactName,
        email: validatedData.email,
        phoneNumber: validatedData.phoneNumber,
        address: validatedData.address,
        notes: validatedData.notes,
        isActive: validatedData.isActive
      }
    });
    
    res.json(updatedSupplier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'اطلاعات نامعتبر', errors: error.errors });
    }
    console.error('Error updating supplier:', error);
    res.status(500).json({ message: 'خطا در بروزرسانی تأمین‌کننده' });
  }
});

// DELETE /api/suppliers/:id - Delete a supplier (restricted to ADMIN)
router.delete('/:id', requireTenant, authorize(['ADMIN']), async (req, res) => {
  try {
    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { 
        id: req.params.id,
        tenantId: req.tenant!.id
      }
    });
    
    if (!supplier) {
      return res.status(404).json({ message: 'تأمین‌کننده یافت نشد' });
    }
    
    // Check if supplier has related items
    const relatedItems = await prisma.itemSupplier.count({
      where: { 
        supplierId: req.params.id,
        tenantId: req.tenant!.id
      }
    });
    
    if (relatedItems > 0) {
      // Soft delete by marking as inactive
      await prisma.supplier.update({
        where: { 
          id: req.params.id,
          tenantId: req.tenant!.id
        },
        data: { isActive: false }
      });
      
      return res.json({ 
        message: 'تأمین‌کننده به دلیل وجود کالا‌های مرتبط به حالت غیرفعال تغییر داده شد' 
      });
    }
    
    // Hard delete if no related items
    await prisma.supplier.delete({
      where: { 
        id: req.params.id,
        tenantId: req.tenant!.id
      }
    });
    
    res.json({ message: 'تأمین‌کننده با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ message: 'خطا در حذف تأمین‌کننده' });
  }
});

// POST /api/suppliers/:id/items - Add an item to a supplier
router.post('/:id/items', requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { itemId, preferredSupplier, unitPrice } = req.body;
    
    // Validate required fields
    if (!itemId) {
      return res.status(400).json({ message: 'شناسه کالا الزامی است' });
    }
    
    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { 
        id: req.params.id,
        tenantId: req.tenant!.id
      }
    });
    
    if (!supplier) {
      return res.status(404).json({ message: 'تأمین‌کننده یافت نشد' });
    }
    
    // Check if item exists
    const item = await prisma.item.findUnique({
      where: { 
        id: itemId,
        tenantId: req.tenant!.id
      }
    });
    
    if (!item) {
      return res.status(404).json({ message: 'کالا یافت نشد' });
    }
    
    // Check if relation already exists
    const existingRelation = await prisma.itemSupplier.findUnique({
      where: {
        tenantId_itemId_supplierId: {
          tenantId: req.tenant!.id,
          itemId,
          supplierId: req.params.id
        }
      }
    });
    
    if (existingRelation) {
      // Update existing relation
      const updatedRelation = await prisma.itemSupplier.update({
        where: {
          tenantId_itemId_supplierId: {
            tenantId: req.tenant!.id,
            itemId,
            supplierId: req.params.id
          }
        },
        data: {
          preferredSupplier: preferredSupplier || false,
          unitPrice: unitPrice || null
        }
      });
      
      return res.json(updatedRelation);
    }
    
    // Create new relation
    const newRelation = await prisma.itemSupplier.create({
      data: {
        itemId,
        supplierId: req.params.id,
        preferredSupplier: preferredSupplier || false,
        unitPrice: unitPrice || null,
        tenantId: req.tenant!.id
      }
    });
    
    res.status(201).json(newRelation);
  } catch (error) {
    console.error('Error adding item to supplier:', error);
    res.status(500).json({ message: 'خطا در افزودن کالا به تأمین‌کننده' });
  }
});

// DELETE /api/suppliers/:id/items/:itemId - Remove an item from a supplier
router.delete('/:id/items/:itemId', requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    // Check if relation exists
    const relation = await prisma.itemSupplier.findUnique({
      where: {
        tenantId_itemId_supplierId: {
          tenantId: req.tenant!.id,
          itemId: req.params.itemId,
          supplierId: req.params.id
        }
      }
    });
    
    if (!relation) {
      return res.status(404).json({ message: 'ارتباط بین کالا و تأمین‌کننده یافت نشد' });
    }
    
    // Delete relation
    await prisma.itemSupplier.delete({
      where: {
        tenantId_itemId_supplierId: {
          tenantId: req.tenant!.id,
          itemId: req.params.itemId,
          supplierId: req.params.id
        }
      }
    });
    
    res.json({ message: 'کالا با موفقیت از لیست تأمین‌کننده حذف شد' });
  } catch (error) {
    console.error('Error removing item from supplier:', error);
    res.status(500).json({ message: 'خطا در حذف کالا از تأمین‌کننده' });
  }
});

// GET /api/suppliers/:id/transactions - Get transaction history for a supplier
router.get('/:id/transactions', requireTenant, async (req, res) => {
  try {
    const { id: supplierId } = req.params;
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;
    
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const offset = (pageNumber - 1) * limitNumber;
    
    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { 
        id: supplierId,
        tenantId: req.tenant!.id
      }
    });
    
    if (!supplier) {
      return res.status(404).json({ message: 'تأمین‌کننده یافت نشد' });
    }
    
    // Build where clause for filtering
    const whereClause: any = {
      tenantId: req.tenant!.id,
      item: {
        suppliers: {
          some: {
            supplierId: supplierId,
            tenantId: req.tenant!.id
          }
        }
      }
    };
    
    // Add type filter
    if (type && ['IN', 'OUT'].includes(type as string)) {
      whereClause.type = type as string;
    }
    
    // Add date range filter
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate as string);
      }
    }
    
    // Get transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      prisma.inventoryEntry.findMany({
        where: whereClause,
        include: {
          item: {
            select: {
              id: true,
              name: true,
              category: true,
              unit: true
            }
          },
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limitNumber
      }),
      prisma.inventoryEntry.count({
        where: whereClause
      })
    ]);
    
    // Calculate summary statistics
    const summaryStats = await prisma.inventoryEntry.groupBy({
      by: ['type'],
      where: {
        tenantId: req.tenant!.id,
        item: {
          suppliers: {
            some: {
              supplierId: supplierId,
              tenantId: req.tenant!.id
            }
          }
        }
      },
      _sum: {
        quantity: true
      },
      _count: {
        id: true
      }
    });
    
    const summary = {
      totalTransactions: totalCount,
      totalIn: summaryStats.find(s => s.type === 'IN')?._sum.quantity || 0,
      totalOut: summaryStats.find(s => s.type === 'OUT')?._sum.quantity || 0,
      inTransactions: summaryStats.find(s => s.type === 'IN')?._count.id || 0,
      outTransactions: summaryStats.find(s => s.type === 'OUT')?._count.id || 0
    };
    
    res.json({
      transactions,
      summary,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalCount / limitNumber),
        totalCount,
        hasNext: pageNumber < Math.ceil(totalCount / limitNumber),
        hasPrev: pageNumber > 1
      }
    });
  } catch (error) {
    console.error('Error fetching supplier transactions:', error);
    res.status(500).json({ message: 'خطا در دریافت تاریخچه تراکنش‌های تأمین‌کننده' });
  }
});

export const supplierRoutes = router; 