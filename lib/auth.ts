import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from '@/lib/prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql', // or "mysql", "postgresql", ...etc
  }),

  secret: process.env.BETTER_AUTH_SECRET, // Add this line

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

  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user && 'userTier' in user) {
        token.userTier = user.userTier;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user && token.userTier) {
        session.user.userTier = token.userTier as 'FREE' | 'PRO';
      }
      return session;
    },
  },
});
