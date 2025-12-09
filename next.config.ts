import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.prod.website-files.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-2b2bf292b6bc4b2c8725dd4b980e6800.r2.dev',
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    // Or remove specific ones: removeConsole: { exclude: ["error"] }
  },
  serverExternalPackages: ['@prisma/client', '@prisma/engines'],
  outputFileTracingIncludes: {
    '/api/**/*': [
      './node_modules/.prisma/client/**/*',
      './node_modules/@prisma/client/**/*',
    ],
  },
};

export default nextConfig;
