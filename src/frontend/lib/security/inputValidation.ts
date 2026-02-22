/**
 * Input Validation and Sanitization Utilities
 * 
 * This module provides utilities for validating and sanitizing user inputs
 * to prevent XSS, injection attacks, and other security vulnerabilities.
 */

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers (onclick, onerror, etc.)
    .trim();
}

/**
 * Sanitize HTML content (more permissive than sanitizeString)
 */
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove script tags and event handlers
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate phone number (Iranian format)
 */
export function validatePhoneNumber(phone: string): boolean {
  if (typeof phone !== 'string') {
    return false;
  }
  
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Iranian phone number patterns
  const patterns = [
    /^09\d{9}$/, // Mobile: 09xxxxxxxxx
    /^0\d{10}$/, // Landline: 0xxxxxxxxxx
    /^\+989\d{9}$/, // International mobile: +989xxxxxxxxx
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * Validate and sanitize numeric input
 */
export function validateNumber(input: unknown, min?: number, max?: number): number | null {
  if (typeof input === 'number') {
    const value = input;
    if (min !== undefined && value < min) return null;
    if (max !== undefined && value > max) return null;
    return value;
  }
  
  if (typeof input === 'string') {
    const parsed = parseFloat(input);
    if (isNaN(parsed)) return null;
    if (min !== undefined && parsed < min) return null;
    if (max !== undefined && parsed > max) return null;
    return parsed;
  }
  
  return null;
}

/**
 * Validate and sanitize integer input
 */
export function validateInteger(input: unknown, min?: number, max?: number): number | null {
  const num = validateNumber(input, min, max);
  if (num === null) return null;
  return Number.isInteger(num) ? num : null;
}

/**
 * Validate string length
 */
export function validateLength(input: string, min: number, max: number): boolean {
  if (typeof input !== 'string') {
    return false;
  }
  
  const length = input.trim().length;
  return length >= min && length <= max;
}

/**
 * Validate URL format
 */
export function validateURL(url: string): boolean {
  if (typeof url !== 'string') {
    return false;
  }
  
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as Record<string, unknown>;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * Validate required fields
 */
export function validateRequired<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missing: (keyof T)[] } {
  const missing: (keyof T)[] = [];
  
  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      missing.push(field);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Escape special characters for SQL (basic protection)
 * Note: Always use parameterized queries with Prisma instead of this
 */
export function escapeSQL(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/;/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments
    .replace(/\*\//g, '');
}

