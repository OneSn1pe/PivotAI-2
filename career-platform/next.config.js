/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['firebasestorage.googleapis.com'],
    },
    // Enable static optimization
    swcMinify: true,
    // Configure output for Vercel
    output: 'standalone',
    // Add security headers
    async headers() {
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
              key: 'X-XSS-Protection',
              value: '1; mode=block'
            },
            {
              key: 'X-Frame-Options',
              value: 'SAMEORIGIN'
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff'
            }
          ]
        }
      ]
    }
  };
  
  module.exports = nextConfig;