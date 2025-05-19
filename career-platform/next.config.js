/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile necessary dependencies if needed
  transpilePackages: [],
  
  // Asset prefix for CDN support
  assetPrefix: process.env.NEXT_PUBLIC_CDN_URL || undefined,
  
  // Customize base path if needed
  basePath: '',
  
  // Output standalone build for better portability
  output: 'standalone',
  
  // Disable type checking in builds for speed
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable ESLint in production builds 
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configure image optimization
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'pivotai-7f6ef.firebasestorage.app'
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.firebasestorage.app',
        pathname: '/**',
      },
    ],
  },
  
  // Custom webpack configuration
  webpack: (config) => {
    // Add polyfill for encoding
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    
    return config;
  },
  
  // Configure headers to allow CORS
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
  
  // Environment variables available at build time
  env: {
    NEXT_PUBLIC_API_URL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
  },
};

module.exports = nextConfig;