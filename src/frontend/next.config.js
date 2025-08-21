/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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