import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // ppr: true, // Disabled as it requires Next.js canary version
    turbo: {
      loaders: {
        // Add any specific loaders you need to configure here
        // Example: '.svg': ['@svgr/webpack']
      },
      rules: {
        // Add any specific rules you need here
      }
    }
  },
  // Optimize chunk loading to avoid ChunkLoadError
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Improve chunk splitting for better loading performance
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            reuseExistingChunk: true
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
            priority: 10
          }
        },
        maxInitialRequests: 25,
        minSize: 20000
      };
    }
    return config;
  }
};

export default nextConfig;
