/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
};

module.exports = nextConfig;
