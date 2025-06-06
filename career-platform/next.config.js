/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental optimizations
  experimental: {
    // optimizeCss: true, // Disabled due to Vercel build issues with critters module
    optimizeServerReact: true,
  },
  
  // Transpile necessary dependencies if needed
  transpilePackages: [],
  
  // Asset prefix for CDN support
  assetPrefix: process.env.NEXT_PUBLIC_CDN_URL || undefined,
  
  // Customize base path if needed
  basePath: '',
  
  // Output standalone build for better portability
  output: 'standalone',
  
  // Enable proper type checking and linting
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Enable compression
  compress: true,
  
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
  webpack: (config, { isServer }) => {
    // Add polyfill for encoding and handle problematic modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      critters: false, // Handle critters module issue
    };
    
    // Optimize client-side bundles
    if (!isServer) {
      // Ensure server-only packages don't get bundled
      config.resolve.alias = {
        ...config.resolve.alias,
        '@google-cloud/storage': false,
        'firebase-admin': false,
      };
    }
    
    // Bundle analyzer in development
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
        })
      );
    }
    
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