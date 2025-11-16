'use client';

import { useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { getTempUserId } from '@/lib/temp-user';
import { toast } from 'sonner';

/**
 * Component that initializes temp_user_id for unauthenticated users
 * and handles data migration when a user signs in.
 * This runs once when the app loads.
 */
export function TempUserInitializer() {
  const { data: session, isPending } = useSession();

  useEffect(() => {
    // Wait for session to be loaded
    if (isPending) return;

    const migrateDataIfNeeded = async () => {
      const migrationPromises = [];

      // 1. Check for and migrate chats from the global temp_user_id
      const tempUserId = localStorage.getItem('temp_user_id');
      if (tempUserId && tempUserId.startsWith('temp_')) {
        migrationPromises.push(
          fetch('/api/migrate-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tempUserId }),
          })
        );
      }

      // 2. Check for and migrate comments from chat-specific anonymous IDs
      const anonymousIds: string[] = [];
      const anonIdKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('anon_commenter_id_')) {
          const anonId = localStorage.getItem(key);
          if (anonId) {
            anonymousIds.push(anonId);
            anonIdKeys.push(key);
          }
        }
      }

      if (anonymousIds.length > 0) {
        migrationPromises.push(
          fetch('/api/migrate-comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ anonymousIds }),
          })
        );
      }

      // If there's nothing to migrate, do nothing.
      if (migrationPromises.length === 0) return;

      try {
        // toast.info('Checking for data to migrate to your new account...');
        const results = await Promise.all(migrationPromises);

        // Process migration results
        let totalMigratedChats = 0;
        let totalMigratedComments = 0;

        for (const response of results) {
          if (!response.ok) continue;
          const data = await response.json();
          if (response.url.includes('/api/migrate-chats')) {
            totalMigratedChats += data.migratedCount || 0;
          } else if (response.url.includes('/api/migrate-comments')) {
            totalMigratedComments += data.migratedCount || 0;
          }
        }

        if (totalMigratedChats > 0) {
          toast.success(`Successfully migrated ${totalMigratedChats} chat(s)!`);
        }
        if (totalMigratedComments > 0) {
          toast.success(
            `Successfully migrated ${totalMigratedComments} comment(s)!`
          );
        }

        // Clean up all temporary keys from localStorage
        localStorage.removeItem('temp_user_id');
        anonIdKeys.forEach((key) => localStorage.removeItem(key));
      } catch (error) {
        console.error('Error migrating data:', error);
        toast.error('Something went wrong while migrating your data.');
      }
    };

    if (session?.user) {
      // If user is authenticated, check if there's any data to migrate.
      migrateDataIfNeeded();
    } else {
      // If user is not authenticated, ensure a temp_user_id exists.
      getTempUserId();
    }
  }, [isPending, session]);

  // This component doesn't render anything
  return null;
}
