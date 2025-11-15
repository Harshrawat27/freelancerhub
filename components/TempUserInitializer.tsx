'use client';

import { useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { getTempUserId } from '@/lib/temp-user';

/**
 * Component that initializes temp_user_id for unauthenticated users
 * This runs once when the app loads
 */
export function TempUserInitializer() {
  const session = useSession();

  useEffect(() => {
    // Wait for session to load
    if (session.isPending) return;

    // If user is not authenticated, ensure temp_user_id exists
    if (!session.data?.user) {
      getTempUserId();
    }
  }, [session.isPending, session.data?.user]);

  // This component doesn't render anything
  return null;
}
