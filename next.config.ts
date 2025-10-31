import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: [
      'cdn.prod.website-files.com',
      'pub-2b2bf292b6bc4b2c8725dd4b980e6800.r2.dev',
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@prisma/engines'],
  },
  outputFileTracingIncludes: {
    '/api/**/*': [
      './node_modules/.prisma/client/**/*',
      './node_modules/@prisma/client/**/*',
    ],
  },
};

export default nextConfig;
