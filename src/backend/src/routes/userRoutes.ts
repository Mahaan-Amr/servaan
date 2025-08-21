import { Router } from 'express';
import { prisma } from '../services/dbService';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Schema for user creation/validation
const createUserSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']).optional(),
  phoneNumber: z.string().optional()
});

// Schema for user update
const updateUserSchema = z.object({
  name: z.string().min(3).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']).optional(),
  phoneNumber: z.string().optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).optional()
});

// GET /api/users - Get all users
router.get('/', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        phoneNumber: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'خطا در دریافت کاربران' });
  }
});

// GET /api/users/:id - Get a user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    // Users can view their own profile, admins and managers can view any profile
    if (req.params.id !== req.user?.id && !['ADMIN', 'MANAGER'].includes(req.user?.role || '')) {
      return res.status(403).json({ message: 'شما دسترسی لازم برای مشاهده این کاربر را ندارید' });
    }
    
    const user = await prisma.user.findFirst({
      where: { 
        id: req.params.id,
        tenantId: req.tenant.id  // Filter by tenant
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        phoneNumber: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'خطا در دریافت اطلاعات کاربر' });
  }
});

// POST /api/users - Create a new user
router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    // Validate input
    const validatedData = createUserSchema.parse(req.body);
    
    // Get tenant ID - use from tenant context or user context
    const tenantId = req.tenant?.id || req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'خطا در شناسایی مجموعه' });
    }

    // Check if user already exists in this tenant
    const existingUser = await prisma.user.findFirst({
      where: { 
        email: validatedData.email,
        tenantId: tenantId  // Check within tenant
      }
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'این ایمیل قبلا ثبت شده است' });
    }
    
    // Only admins can create admin users
    if (validatedData.role === 'ADMIN' && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'شما دسترسی لازم برای ایجاد کاربر مدیر سیستم را ندارید' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user with tenant context
    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role || 'STAFF',
        phoneNumber: validatedData.phoneNumber,
        tenantId: tenantId  // Add tenant context
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.status(201).json(newUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'اطلاعات نامعتبر', errors: error.errors });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'خطا در ایجاد کاربر جدید' });
  }
});

// PUT /api/users/:id - Update a user
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Validate input
    const validatedData = updateUserSchema.parse(req.body);
    
    // Get user to check if exists
    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    
    // Check permissions
    // 1. Users can update their own basic info
    // 2. Admins can update anyone
    // 3. Managers can update staff users
    const isSelf = req.params.id === req.user?.id;
    const isAdmin = req.user?.role === 'ADMIN';
    const isManager = req.user?.role === 'MANAGER';
    const targetIsStaff = user.role === 'STAFF';
    
    if (!isSelf && !isAdmin && !(isManager && targetIsStaff)) {
      return res.status(403).json({ message: 'شما دسترسی لازم برای بروزرسانی این کاربر را ندارید' });
    }
    
    // Only admins can change roles to ADMIN
    if (validatedData.role === 'ADMIN' && !isAdmin) {
      return res.status(403).json({ message: 'فقط مدیر سیستم می‌تواند نقش مدیر سیستم را اختصاص دهد' });
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.phoneNumber) updateData.phoneNumber = validatedData.phoneNumber;
    
    // Only admins and managers can change roles and active status
    if ((isAdmin || (isManager && targetIsStaff)) && validatedData.role) {
      updateData.role = validatedData.role;
    }
    
    if ((isAdmin || (isManager && targetIsStaff)) && validatedData.active !== undefined) {
      updateData.active = validatedData.active;
    }
    
    // Handle password update if provided
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 10);
    }
    
    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'اطلاعات نامعتبر', errors: error.errors });
    }
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'خطا در بروزرسانی کاربر' });
  }
});

// DELETE /api/users/:id - Delete a user
router.delete('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    
    // Only admins can delete other admins or managers
    // Managers can only delete staff users
    if ((user.role === 'ADMIN' || user.role === 'MANAGER') && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'شما دسترسی لازم برای حذف این کاربر را ندارید' });
    }
    
    // Delete the user
    await prisma.user.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'کاربر با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'خطا در حذف کاربر' });
  }
});

// Get workspace user access
router.get('/workspace/user_access/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // For now, return basic access info - this can be expanded later
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد'
      });
    }

    // Basic workspace access based on role
    const workspaceAccess = {
      'inventory-management': user.role !== 'STAFF',
      'business-intelligence': user.role === 'ADMIN',
      'accounting': user.role === 'ADMIN',
      'user-management': user.role === 'ADMIN'
    };

    res.json({ 
      success: true, 
      data: { 
        user,
        workspaceAccess
      } 
    });
  } catch (error) {
    console.error('Error getting workspace user access:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت دسترسی کاربر',
      error: (error as Error).message
    });
  }
});

export const userRoutes = router; 
