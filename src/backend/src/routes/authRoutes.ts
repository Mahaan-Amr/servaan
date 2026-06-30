import { Router } from 'express';
import { z } from 'zod';
import { loginUser, registerUser } from '../services/authService';
import { authenticate } from '../middlewares/authMiddleware';
import { prisma } from '../services/dbService';
import { AppError } from '../middlewares/errorHandler';

function extractSubdomain(host: string): string | null {
  const hostname = host.split(':')[0].trim().toLowerCase();

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return null;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return null;
  }

  if (hostname.endsWith('.localhost')) {
    const candidate = hostname.split('.')[0];
    return candidate && candidate !== 'www' && candidate !== 'api' && candidate !== 'admin' ? candidate : null;
  }

  const parts = hostname.split('.');
  if (parts.length < 3) {
    return null;
  }

  const candidate = parts[0];
  if (['www', 'api', 'admin'].includes(candidate)) {
    return null;
  }

  return candidate;
}

const router = Router();

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

router.post('/login', async (req, res, next) => {
  try {
    const { email, password, rememberMe } = loginSchema.parse(req.body);

    const host = req.get('host') || '';
    const subdomain = extractSubdomain(host);
    let tenantId: string | undefined;

    if (subdomain) {
      const tenant = await prisma.tenant.findUnique({ where: { subdomain } });
      tenantId = tenant?.id;
    }

    const userData = await loginUser(email, password, tenantId, rememberMe);

    await prisma.user.update({
      where: { id: userData.id },
      data: { lastLogin: new Date() }
    });

    res.json({
      success: true,
      message: 'ورود با موفقیت انجام شد',
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

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const host = req.get('host') || '';
    const subdomain = extractSubdomain(host);

    if (!subdomain) {
      return res.status(400).json({ message: 'دسترسی از طریق ساب‌دامین لازم است' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { subdomain }
    });

    if (!tenant) {
      return res.status(404).json({ message: 'مستاجر پیدا نشد' });
    }

    const userData = await registerUser(
      data.name,
      data.email,
      data.password,
      tenant.id,
      data.role,
      data.phoneNumber
    );

    res.status(201).json(userData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'اطلاعات نامعتبر', errors: error.errors });
    }
    next(error);
  }
});

router.post('/register-invitation', async (req, res, next) => {
  try {
    const data = invitationRegisterSchema.parse(req.body);

    if (!data.invitationCode) {
      return res.status(400).json({ message: 'کد دعوت‌نامه نامعتبر است' });
    }

    const host = req.get('host') || '';
    const subdomain = extractSubdomain(host);

    let tenant;
    if (subdomain && subdomain !== 'default') {
      tenant = await prisma.tenant.findUnique({ where: { subdomain } });
    } else {
      tenant = await prisma.tenant.findFirst();
    }

    if (!tenant) {
      return res.status(404).json({ message: 'مستاجر پیدا نشد' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        tenantId: tenant.id
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'کاربری با این ایمیل قبلا ثبت‌نام کرده است' });
    }

    const userData = await registerUser(
      data.name,
      data.email,
      data.password,
      tenant.id,
      data.role,
      data.phoneNumber
    );

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

router.post('/forgot-password', async (_req, res) => {
  res.json({ message: 'این قابلیت در این نسخه آماده نیست' });
});

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
        updatedAt: true,
        tenantId: true,
        tenant: {
          select: {
            subdomain: true,
            name: true,
            displayName: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'کاربر پیدا نشد' });
    }

    res.json({
      ...user,
      tenantSubdomain: user.tenant?.subdomain,
      tenantName: user.tenant?.displayName || user.tenant?.name
    });
  } catch (error) {
    console.error('خطا در دریافت اطلاعات کاربر:', error);
    res.status(500).json({ message: 'خطا در دریافت اطلاعات کاربر' });
  }
});

export { router as authRoutes };

