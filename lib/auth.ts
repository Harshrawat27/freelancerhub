import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from '@/lib/prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,
  },

  trustedOrigins: [
    'http://localhost:3000',
    'https://chatshare.co',
    'https://www.chatshare.co',
  ],

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  // Configure better-auth to include custom user fields in session
  user: {
    additionalFields: {
      userTier: {
        type: 'string',
        required: false,
        defaultValue: 'FREE',
        input: false, // Don't allow setting this field during signup
      },
    },
  },
});
