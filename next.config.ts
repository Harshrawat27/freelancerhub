import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@prisma/engines'],
  },
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/.prisma/client/**/*', './node_modules/@prisma/client/**/*'],
  },
};

export default nextConfig;
