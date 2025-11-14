import type { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  /**
   * The shape of the user object.
   */
  interface User extends DefaultUser {
    userTier?: 'FREE' | 'PRO';
  }

  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user?: User;
  }
}

declare module 'next-auth/jwt' {
  /**
   * The shape of the JWT token.
   */
  interface JWT {
    userTier?: 'FREE' | 'PRO';
  }
}