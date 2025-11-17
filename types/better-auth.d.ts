import 'better-auth';

declare module 'better-auth' {
  interface User {
    userTier: 'FREE' | 'PRO';
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      userTier: 'FREE' | 'PRO';
    };
  }
}
