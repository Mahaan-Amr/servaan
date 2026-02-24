/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // TypeScript configuration
  typescript: {
    // Don't ignore build errors - keep type checking strict
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration with warnings instead of errors for specific rules
  eslint: {
    // Run ESLint during production builds
    dirs: ['pages', 'components', 'lib', 'utils', 'app', 'contexts'],
    // Ignore certain patterns/files if needed
    ignoreDuringBuilds: false,
  },
  
  // Security: Remove X-Powered-By header
  poweredByHeader: false,
  
  // Security: Disable source maps in production
  productionBrowserSourceMaps: false,
  
  // Security: Compress responses
  compress: true,
  
  // Security headers
  async headers() {
    // Extract base URL (origin) from NEXT_PUBLIC_API_URL for CSP
    // CSP connect-src requires origins (protocol + host + port), not URLs with paths
    const getApiOrigin = () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Adjust based on your needs
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              `connect-src 'self' ${apiOrigin} https://api.servaan.com https://*.servaan.com wss://api.servaan.com wss://*.servaan.com ws://localhost:*`,
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
          ? 'https://api.servaan.com/api/:path*'
          : 'http://localhost:3000/api/:path*',
      },
    ];
  },
  
  // Enable output for production
  output: 'standalone',
};

module.exports = nextConfig; 
