/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Security: Remove X-Powered-By header
  poweredByHeader: false,
  
  // Security: Disable source maps in production
  productionBrowserSourceMaps: false,
  
  // Security: Compress responses
  compress: true,
  
  // Allow building even if there are ESLint or TS type issues (CI/CD resilience)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Danger: enables build to succeed even with type errors. Keep only for CI until issues are fixed.
    ignoreBuildErrors: true,
  },
  
  // Security headers
  async headers() {
    // Extract base URL (origin) from NEXT_PUBLIC_API_URL for CSP
    // CSP connect-src requires origins (protocol + host + port), not URLs with paths
    const getApiOrigin = () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';
      try {
        const url = new URL(apiUrl);
        // Return origin (protocol + host + port) without path
        return url.origin;
      } catch {
        // Fallback: remove /api if present
        if (apiUrl.includes('/api')) {
          return apiUrl.replace('/api', '').replace(/\/$/, '');
        }
        return apiUrl.replace(/\/$/, '');
      }
    };

    const apiOrigin = getApiOrigin();

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              `connect-src 'self' ${apiOrigin} http://admin-backend:3003`,
              "frame-ancestors 'self'",
            ].join('; ')
          }
        ],
      },
    ];
  },
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'http://admin-backend:3003/api/:path*'
          : 'http://localhost:3003/api/:path*',
      },
    ];
  },
  
  // Remove standalone mode to match main frontend pattern
  // output: 'standalone',
  // Allow dev origin used in local hosts mapping
  allowedDevOrigins: ['http://admin.localhost:3004'],
};

module.exports = nextConfig;
