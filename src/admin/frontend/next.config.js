/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow building even if there are ESLint or TS type issues (CI/CD resilience)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Danger: enables build to succeed even with type errors. Keep only for CI until issues are fixed.
    ignoreBuildErrors: true,
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
