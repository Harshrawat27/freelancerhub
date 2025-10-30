import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['cdn.prod.website-files.com'],
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
