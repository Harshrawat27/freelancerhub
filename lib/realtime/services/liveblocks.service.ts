import { createClient, Room } from '@liveblocks/client';
import {
  RealtimeService,
  RealtimeEvent,
  PresenceData,
  PresenceUser,
} from '../interfaces/realtime.interface';

export class LiveblocksRealtimeService implements RealtimeService {
  private client: any;
  private room: Room | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private presenceCallbacks: Set<Function> = new Set();

  constructor(publicKey: string) {
    this.client = createClient({
      publicApiKey: publicKey,
    });
  }

  async connect(roomId: string): Promise<void> {
    try {
      this.room = this.client.enter(roomId, {
        initialPresence: {},
      });

      // Set up Liveblocks-specific event listeners
      this.room.subscribe('event', (eventMessage: any) => {
        // Liveblocks wraps the event in { connectionId, event }
        // We need to extract the actual event from eventMessage.event
        if (eventMessage && eventMessage.event) {
          console.log('[Liveblocks] Received event:', eventMessage.event);
          this.handleIncomingEvent(eventMessage.event);
        }
      });

      // Subscribe to presence changes
      if (this.room && 'subscribe' in this.room) {
        this.room.subscribe('others', (others: any) => {
          const users: PresenceUser[] = others
            .toArray()
            .map((other: any) => ({
              ...other.presence,
              connectionId: other.connectionId,
              lastSeen: Date.now(),
            }));

          this.presenceCallbacks.forEach((cb) => cb(users));
        });
      }

      console.log('[Liveblocks] Connected to room:', roomId);
    } catch (error) {
      console.error('[Liveblocks] Failed to connect:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.room) {
      if ('leave' in this.room && typeof this.room.leave === 'function') {
        this.room.leave();
      }
      this.room = null;
      this.listeners.clear();
      this.presenceCallbacks.clear();
      console.log('[Liveblocks] Disconnected');
    }
  }

  broadcast(event: RealtimeEvent): void {
    if (!this.room) {
      console.warn('[Liveblocks] Cannot broadcast: not connected');
      return;
    }

    try {
      this.room.broadcastEvent(event as any);
      console.log('[Liveblocks] Broadcasted event:', event.type);
    } catch (error) {
      console.error('[Liveblocks] Failed to broadcast:', error);
    }
  }

  subscribe<T>(eventType: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(callback);
    console.log('[Liveblocks] Subscribed to event:', eventType);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        console.log('[Liveblocks] Unsubscribed from event:', eventType);
      }
    };
  }

  updatePresence(data: PresenceData): void {
    if (!this.room) {
      console.warn('[Liveblocks] Cannot update presence: not connected');
      return;
    }

    try {
      this.room.updatePresence(data as any);
    } catch (error) {
      console.error('[Liveblocks] Failed to update presence:', error);
    }
  }

  subscribeToPresence(callback: (users: PresenceUser[]) => void): () => void {
    this.presenceCallbacks.add(callback);
    console.log('[Liveblocks] Subscribed to presence');

    // Return unsubscribe function
    return () => {
      this.presenceCallbacks.delete(callback);
      console.log('[Liveblocks] Unsubscribed from presence');
    };
  }

  isConnected(): boolean {
    return !!this.room;
  }

  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    return this.room ? 'connected' : 'disconnected';
  }

  private handleIncomingEvent(event: any): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(event.payload);
        } catch (error) {
          console.error('[Liveblocks] Error in event callback:', error);
        }
      });
    }
  }
}
