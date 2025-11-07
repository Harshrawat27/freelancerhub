// Core interface that defines what ANY real-time service must provide
export interface RealtimeService {
  // Connection management
  connect(roomId: string): Promise<void>;
  disconnect(): Promise<void>;

  // Broadcasting events
  broadcast(event: RealtimeEvent): void;

  // Listening to events
  subscribe<T>(eventType: string, callback: (data: T) => void): () => void;

  // Presence (who's online, cursors, etc.)
  updatePresence(data: PresenceData): void;
  subscribeToPresence(callback: (users: PresenceUser[]) => void): () => void;

  // Connection status
  isConnected(): boolean;
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected';
}

export interface RealtimeEvent {
  type: 'comment:created' | 'comment:updated' | 'comment:deleted' | 'thread:created' | 'thread:resolved';
  payload: any;
  timestamp: number;
  userId: string;
}

export interface PresenceData {
  userId: string;
  userName: string;
  userAvatar?: string;
  cursor?: { x: number; y: number };
  selection?: { start: number; end: number; text: string };
}

export interface PresenceUser extends PresenceData {
  connectionId: string;
  lastSeen: number;
}
