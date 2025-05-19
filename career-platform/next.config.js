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
  
  // Enable experimental features for edge runtime support and API response caching
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
    workerThreads: true, // Enable worker threads for better parallelization
    optimizeCss: true, // Enable CSS optimization
    serverActions: {
      bodySizeLimit: '4mb', // Increase limit for large request bodies
    },
    instrumentationHook: true, // Enable instrumentation hooks for monitoring
  },

  // Enable incremental static regeneration with short revalidation periods
  staticPageGenerationTimeout: 120, // Increase timeout for static page generation
  
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
    minimumCacheTTL: 60 * 60 * 24, // 24 hours cache for images
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
    
    // Add performance optimizations
    config.optimization = {
      ...config.optimization,
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 20000,
        maxSize: 250000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              // Get the name of the package
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
              return `npm.${packageName.replace('@', '')}`;
            },
          },
        },
      },
    };
    
    return config;
  },
  
  // Configure headers to allow CORS and add caching
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
      {
        // Add caching for static assets
        source: '/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Add caching for API responses that don't need to be real-time
        source: '/api/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=300, stale-while-revalidate=300' },
        ],
      },
    ];
  },
  
  // Environment variables available at build time
  env: {
    NEXT_PUBLIC_API_URL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
  },
  
  // Configure memory for Vercel serverless functions (available on Pro plan)
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname
  },
};

module.exports = nextConfig;