'use client';

import { useEffect, useRef, useState } from 'react';
import {
  RealtimeService,
  RealtimeEvent,
  PresenceUser,
} from '../interfaces/realtime.interface';
import { RealtimeFactory } from '../realtime.factory';
import { realtimeConfig } from '../realtime.config';

export function useRealtime(roomId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const serviceRef = useRef<RealtimeService | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeConnection = async () => {
      try {
        // Create service instance
        const service = RealtimeFactory.create(realtimeConfig.provider);
        serviceRef.current = service;

        // Connect
        await service.connect(roomId);

        if (!mounted) {
          service.disconnect();
          return;
        }

        setIsConnected(true);
        setConnectionError(null);

        // Subscribe to presence
        const unsubscribePresence = service.subscribeToPresence((users) => {
          if (mounted) {
            setPresenceUsers(users);
          }
        });

        // Cleanup function stored for later
        return unsubscribePresence;
      } catch (error) {
        console.error('[useRealtime] Connection error:', error);
        if (mounted) {
          setConnectionError(
            error instanceof Error ? error.message : 'Failed to connect'
          );
          setIsConnected(false);
        }
      }
    };

    const cleanup = initializeConnection();

    // Cleanup on unmount
    return () => {
      mounted = false;
      cleanup.then((unsubscribe) => {
        if (unsubscribe) unsubscribe();
      });
      serviceRef.current?.disconnect();
      setIsConnected(false);
    };
  }, [roomId]);

  const broadcast = (event: RealtimeEvent) => {
    serviceRef.current?.broadcast(event);
  };

  const subscribe = <T,>(eventType: string, callback: (data: T) => void) => {
    return serviceRef.current?.subscribe(eventType, callback) || (() => {});
  };

  const updatePresence = (data: any) => {
    serviceRef.current?.updatePresence(data);
  };

  return {
    isConnected,
    connectionError,
    presenceUsers,
    broadcast,
    subscribe,
    updatePresence,
    service: serviceRef.current,
  };
}
