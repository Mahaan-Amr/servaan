import { Router } from 'express';
import { z } from 'zod';
import { loginUser, registerUser } from '../services/authService';
import { authenticate } from '../middlewares/authMiddleware';
import { prisma } from '../services/dbService';
import { AppError } from '../middlewares/errorHandler';

// Extract subdomain from host (same logic as tenantMiddleware)
function extractSubdomain(host: string): string | null {
  // Remove port if present
  const hostname = host.split(':')[0];
  
  // Split by dots
  const parts = hostname.split('.');
  
  // For localhost development: handle subdomains like dima.localhost
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // If we have a subdomain before localhost (e.g., dima.localhost)
    if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
      return parts[0]; // Return the subdomain (e.g., 'dima')
    }
    // If it's just localhost without subdomain
    if (parts.length === 1 || (parts.length === 2 && parts[1] === 'localhost')) {
      return null; // No subdomain
    }
  }
  
  // For production domains: require at least 3 parts (subdomain.domain.tld)
  if (parts.length < 3) {
    return null;
  }
  
  // Return first part as subdomain
  return parts[0];
}

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  rememberMe: z.boolean().optional()
});

const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']).optional(),
  phoneNumber: z.string().optional()
});

const invitationRegisterSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  phoneNumber: z.string(),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']),
  invitationCode: z.string()
});

// POST /api/auth/login - User login
router.post('/login', async (req, res, next) => {
  try {
    // Validate request body
    const { email, password, rememberMe } = loginSchema.parse(req.body);
    
    // Extract tenant from subdomain if available
    const host = req.get('host') || '';
    const subdomain = extractSubdomain(host);
    let tenantId: string | undefined;
    
    if (subdomain) {
      const tenant = await prisma.tenant.findUnique({
        where: { subdomain }
      });
      tenantId = tenant?.id;
    }
    
    // Login user with tenant context (supports universal login)
    const userData = await loginUser(email, password, tenantId, rememberMe);
    
    // Update last login time
    await prisma.user.update({
      where: { id: userData.id },
      data: { lastLogin: new Date() }
    });
    
    // Return user data with token and tenant information
    res.json({
      success: true,
      message: 'ورود موفقیت‌آمیز بود',
      data: userData
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        message: 'اطلاعات نامعتبر', 
        errors: error.errors 
      });
    }
    
    // Handle specific auth errors
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    
    next(error);
  }
});

// POST /api/auth/register - User registration
router.post('/register', async (req, res, next) => {
  try {
    // Validate request body
    const data = registerSchema.parse(req.body);
    
    // Extract tenant from subdomain
    const host = req.get('host') || '';
    const subdomain = extractSubdomain(host);
    
    if (!subdomain) {
      return res.status(400).json({ message: 'دسترسی از طریق ساب‌دامین مورد نیاز است' });
    }
    
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain }
    });
    
    if (!tenant) {
      return res.status(404).json({ message: 'تنانت یافت نشد' });
    }
    
    // Register user with tenant context
    const userData = await registerUser(
      data.name,
      data.email,
      data.password,
      tenant.id,
      data.role,
      data.phoneNumber
    );
    
    // Return user data with token
    res.status(201).json(userData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'اطلاعات نامعتبر', errors: error.errors });
    }
    next(error);
  }
});

// POST /api/auth/register-invitation - Register user from invitation
router.post('/register-invitation', async (req, res, next) => {
  try {
    // Validate request body
    const data = invitationRegisterSchema.parse(req.body);
    
    // For now, we'll accept any invitation code since we're not storing them
    // In a production system, you'd validate the invitation code against a database
    if (!data.invitationCode) {
      return res.status(400).json({ message: 'کد دعوت‌نامه نامعتبر است' });
    }
    
    // Extract tenant from subdomain or use default
    const host = req.get('host') || '';
    const subdomain = extractSubdomain(host);
    
    let tenant;
    if (subdomain && subdomain !== 'default') {
      tenant = await prisma.tenant.findUnique({
        where: { subdomain }
      });
    } else {
      // For development, find the first tenant or create a default one
      tenant = await prisma.tenant.findFirst();
    }
    
    if (!tenant) {
      return res.status(404).json({ message: 'تنانت یافت نشد' });
    }
    
    // Check if user with this email already exists in this tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        tenantId: tenant.id
      }
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'کاربری با این ایمیل قبلاً ثبت‌نام کرده است' });
    }
    
    // Register user with invitation data
    const userData = await registerUser(
      data.name,
      data.email,
      data.password,
      tenant.id,
      data.role,
      data.phoneNumber
    );
    
    // Return user data with token and tenant info
    res.status(201).json({
      ...userData,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'اطلاعات نامعتبر', errors: error.errors });
    }
    next(error);
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
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
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'خطا در دریافت اطلاعات کاربر' });
  }
});

export const authRoutes = router; 