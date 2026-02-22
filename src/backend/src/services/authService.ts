import { sign, verify } from 'jsonwebtoken';
import { compare, hash } from 'bcryptjs';
import { prisma } from './dbService';
import { AppError } from '../middlewares/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'servaan-super-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (userId: string, expiresIn: string = JWT_EXPIRES_IN): string => {
  // @ts-ignore - Ignoring TypeScript error with jwt.sign
  const token = sign({ id: userId }, JWT_SECRET, { expiresIn });
  return token;
};

export const verifyToken = (token: string): { id: string } => {
  try {
    // @ts-ignore - Ignoring TypeScript error with jwt.verify
    return verify(token, JWT_SECRET) as { id: string };
  } catch (_error) {
    throw new AppError('ØªÙˆÚ©Ù† Ù†Ø§Ù…Ø¹ØªØ¨Ø± ÛŒØ§ Ù…Ù†Ù‚Ø¶ÛŒ Ø´Ø¯Ù‡', 401);
  }
};

export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const loginUser = async (email: string, password: string, tenantId?: string, rememberMe: boolean = false) => {
  const requestId = `auth_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  console.info('[AUTH] Login attempt', {
    requestId,
    tenantId: tenantId || 'universal',
    emailDomain: email.includes('@') ? email.split('@')[1] : 'unknown'
  });

  let user;

  if (tenantId) {
    console.info('[AUTH] Tenant-scoped lookup', { requestId, tenantId });
    user = await prisma.user.findFirst({
      where: {
        email,
        tenantId
      },
      include: { tenant: true }
    });
  } else {
    console.info('[AUTH] Universal lookup', { requestId });
    user = await prisma.user.findFirst({
      where: { email },
      include: {
        tenant: {
          select: {
            id: true,
            subdomain: true,
            name: true,
            displayName: true,
            isActive: true
          }
        }
      }
    });
  }

  const passwordMatch = user ? await compare(password, user.password) : false;

  if (!user || !passwordMatch) {
    console.warn('[AUTH] Login failed', {
      requestId,
      tenantId: tenantId || 'universal',
      reason: 'INVALID_CREDENTIALS'
    });
    throw new AppError('Ø§ÛŒÙ…ÛŒÙ„ ÛŒØ§ Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø§Ø´ØªØ¨Ø§Ù‡ Ø§Ø³Øª', 401);
  }

  if (!user.active) {
    console.warn('[AUTH] Login failed', {
      requestId,
      tenantId: user.tenantId,
      reason: 'USER_INACTIVE'
    });
    throw new AppError('Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±ÛŒ Ø´Ù…Ø§ ØºÛŒØ±ÙØ¹Ø§Ù„ Ø´Ø¯Ù‡ Ø§Ø³Øª', 403);
  }

  if (user.tenant && !user.tenant.isActive) {
    console.warn('[AUTH] Login failed', {
      requestId,
      tenantId: user.tenantId,
      reason: 'TENANT_INACTIVE'
    });
    throw new AppError('Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±ÛŒ Ø´Ù…Ø§ ØºÛŒØ±ÙØ¹Ø§Ù„ Ø´Ø¯Ù‡ Ø§Ø³Øª', 403);
  }

  const expiresIn = rememberMe ? '30d' : JWT_EXPIRES_IN;
  const token = generateToken(user.id, expiresIn);

  console.info('[AUTH] Login success', {
    requestId,
    tenantId: user.tenantId,
    userId: user.id
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    tenantSubdomain: user.tenant?.subdomain,
    tenantName: user.tenant?.displayName || user.tenant?.name,
    token
  };
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  tenantId: string,
  role: 'ADMIN' | 'MANAGER' | 'STAFF' = 'STAFF',
  phoneNumber?: string
) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      email,
      tenantId
    }
  });

  if (existingUser) {
    throw new AppError('Ø§ÛŒÙ† Ø§ÛŒÙ…ÛŒÙ„ Ù‚Ø¨Ù„Ø§ Ø«Ø¨Øª Ø´Ø¯Ù‡ Ø§Ø³Øª', 400);
  }

  const hashedPassword = await hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      phoneNumber,
      tenantId
    }
  });

  const token = generateToken(newUser.id);

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    token
  };
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'MANAGER' | 'STAFF';
  phoneNumber?: string;
}
