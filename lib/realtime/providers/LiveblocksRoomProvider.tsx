'use client';

import { ReactNode } from 'react';
import { LiveblocksProvider, RoomProvider } from '@liveblocks/react/suspense';
import { realtimeConfig } from '../realtime.config';

interface LiveblocksRoomProviderProps {
  roomId: string;
  children: ReactNode;
}

export function LiveblocksRoomProvider({
  roomId,
  children,
}: LiveblocksRoomProviderProps) {
  const publicKey = realtimeConfig.liveblocks.publicKey;

  if (!publicKey) {
    console.error('[Liveblocks] Public key is missing');
    return <>{children}</>;
  }

  return (
    <LiveblocksProvider publicApiKey={publicKey}>
      <RoomProvider id={roomId} initialPresence={{ cursor: null, userName: 'Anonymous', userAvatar: undefined }}>
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}
