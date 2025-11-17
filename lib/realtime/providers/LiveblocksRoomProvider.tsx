'use client';

import { ReactNode } from 'react';
import { LiveblocksProvider, RoomProvider } from '@liveblocks/react/suspense';
import { getTempUserId } from '@/lib/temp-user';

interface LiveblocksRoomProviderProps {
  roomId: string;
  children: ReactNode;
}

export function LiveblocksRoomProvider({
  roomId,
  children,
}: LiveblocksRoomProviderProps) {
  // Auth endpoint function to pass tempUserId for unauthenticated users
  const authEndpoint = async (room?: string) => {
    // Get temp user ID for unauthenticated users
    const tempUserId = getTempUserId();

    // Call our auth endpoint
    const response = await fetch('/api/liveblocks-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        room,
        tempUserId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to authenticate with Liveblocks');
    }

    // Return the JSON token
    return await response.json();
  };

  return (
    <LiveblocksProvider authEndpoint={authEndpoint}>
      <RoomProvider id={roomId} initialPresence={{ cursor: null, userName: 'Anonymous', userAvatar: undefined }}>
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}
