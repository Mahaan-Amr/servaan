import { sign, verify } from 'jsonwebtoken';
import { compare, hash } from 'bcryptjs';
import { prisma } from './dbService';
import { AppError } from '../middlewares/errorHandler';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'servaan-super-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
export const generateToken = (userId: string, expiresIn: string = JWT_EXPIRES_IN): string => {
  // @ts-ignore - Ignoring TypeScript error with jwt.sign
  const token = sign({ id: userId }, JWT_SECRET, { expiresIn });
  return token;
};

// Verify JWT token
export const verifyToken = (token: string): { id: string } => {
  try {
    // @ts-ignore - Ignoring TypeScript error with jwt.verify
    return verify(token, JWT_SECRET) as { id: string };
  } catch (error) {
    throw new AppError('توکن نامعتبر یا منقضی شده', 401);
  }
};

// Get token from local storage
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Get current user from local storage
export const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

// Logout - clear local storage
export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Login user with tenant context
export const loginUser = async (email: string, password: string, tenantId?: string, rememberMe: boolean = false) => {
  let user;
  
  if (tenantId) {
    // Specific tenant login - search only in that tenant
    user = await prisma.user.findFirst({
      where: { 
        email,
        tenantId 
      },
      include: { tenant: true }
    });
  } else {
    // Universal login - search across ALL tenants
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

  // Check if user exists and password is correct
  if (!user || !(await compare(password, user.password))) {
    throw new AppError('ایمیل یا رمز عبور اشتباه است', 401);
  }

  if (!user.active) {
    throw new AppError('حساب کاربری شما غیرفعال شده است', 403);
  }

  // Check if user's tenant is active
  if (user.tenant && !user.tenant.isActive) {
    throw new AppError('حساب کاربری شما غیرفعال شده است', 403);
  }

  // Generate token with longer expiry if rememberMe is true
  const expiresIn = rememberMe ? '30d' : JWT_EXPIRES_IN;
  const token = generateToken(user.id, expiresIn);

  // Return user info with tenant information for redirection
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

// Register new user with tenant context
export const registerUser = async (
  name: string, 
  email: string, 
  password: string, 
  tenantId: string,
  role: 'ADMIN' | 'MANAGER' | 'STAFF' = 'STAFF',
  phoneNumber?: string
) => {
  // Check if user already exists in this tenant
  const existingUser = await prisma.user.findFirst({
    where: { 
      email,
      tenantId 
    }
  });

  if (existingUser) {
    throw new AppError('این ایمیل قبلا ثبت شده است', 400);
  }

  // Hash password
  const hashedPassword = await hash(password, 10);

  // Create new user with tenant context
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

  // Generate token
  const token = generateToken(newUser.id);

  // Return user info and token
  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    token
  };
};

// Types for frontend
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
