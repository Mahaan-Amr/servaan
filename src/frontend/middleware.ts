import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window
const RATE_LIMIT_STRICT_MAX_REQUESTS = 20; // Stricter limit for auth endpoints

// In-memory rate limit store (use Redis in production for multi-instance deployments)
// For Ubuntu server with single instance, this is sufficient
// For load balancer/multiple instances, implement Redis-based rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  // Collect keys to delete
  rateLimitStore.forEach((value, key) => {
    if (now > value.resetTime) {
      keysToDelete.push(key);
    }
  });
  
  // Delete expired entries
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}, 60 * 1000); // Clean up every minute

function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || request.ip || 'unknown';
  
  // Also include user agent for additional identification
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return `${ip}:${userAgent}`;
}

function checkRateLimit(identifier: string, maxRequests: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
    return true;
  }
  
  // Increment count
  record.count++;
  
  if (record.count > maxRequests) {
    return false; // Rate limit exceeded
  }
  
  return true; // Within limit
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip rate limiting for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/health')
  ) {
    return NextResponse.next();
  }
  
  // Get client identifier
  const identifier = getClientIdentifier(request);
  
  // Apply stricter rate limiting for authentication endpoints
  const isAuthEndpoint = pathname.startsWith('/api/auth') || 
                         pathname.startsWith('/api/login') ||
                         pathname.startsWith('/api/register');
  
  const maxRequests = isAuthEndpoint 
    ? RATE_LIMIT_STRICT_MAX_REQUESTS 
    : RATE_LIMIT_MAX_REQUESTS;
  
  // Check rate limit
  if (!checkRateLimit(identifier, maxRequests)) {
    return NextResponse.json(
      {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(RATE_LIMIT_WINDOW_MS / 1000).toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + RATE_LIMIT_WINDOW_MS).toString()
        }
      }
    );
  }
  
  // Add security headers to response
  const response = NextResponse.next();
  
  // Get current rate limit info
  const record = rateLimitStore.get(identifier);
  if (record) {
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString());
    response.headers.set('X-RateLimit-Reset', record.resetTime.toString());
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

