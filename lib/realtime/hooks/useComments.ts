'use client';

import { useEffect, useState } from 'react';
import { Comment, CreateCommentInput } from '../interfaces/comment.interface';

// Import Liveblocks hooks - these will be available after wrapping with RoomProvider
let useBroadcastEvent: any;
let useEventListener: any;

try {
  const liveblocks = require('@liveblocks/react/suspense');
  useBroadcastEvent = liveblocks.useBroadcastEvent;
  useEventListener = liveblocks.useEventListener;
} catch (e) {
  // Fallback if not in Liveblocks context
  console.warn('[useComments] Liveblocks not available');
}

interface UseCommentsOptions {
  chatId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
}

export function useComments({
  chatId,
  userId,
  userName,
  userAvatar,
}: UseCommentsOptions) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use Liveblocks hooks for real-time functionality
  const broadcast = useBroadcastEvent ? useBroadcastEvent() : null;

  // Fetch initial comments from database
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/comments?chatId=${chatId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }

        const data = await response.json();
        setComments(data);
        setError(null);
      } catch (err) {
        console.error('[useComments] Error fetching comments:', err);
        setError(err instanceof Error ? err.message : 'Failed to load comments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [chatId]);

  // Subscribe to real-time comment events using Liveblocks
  if (useEventListener) {
    useEventListener(({ event }: { event: any }) => {
      console.log('[useComments] Received event:', event);

      if (event.type === 'comment:created') {
        setComments((prev) => [...prev, event.payload]);
      } else if (event.type === 'comment:updated') {
        setComments((prev) =>
          prev.map((c) => (c.id === event.payload.id ? event.payload : c))
        );
      } else if (event.type === 'comment:deleted') {
        setComments((prev) => prev.filter((c) => c.id !== event.payload));
      }
    });
  }

  const createComment = async (input: Omit<CreateCommentInput, 'userId' | 'userName' | 'userAvatar'>) => {
    try {
      // Save to database first
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          userId,
          userName,
          userAvatar,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create comment');
      }

      const newComment = await response.json();

      // Update local state immediately (optimistic update)
      setComments((prev) => [...prev, newComment]);

      // Broadcast to others in real-time using Liveblocks
      if (broadcast) {
        broadcast({
          type: 'comment:created',
          payload: newComment,
        });
      }

      return newComment;
    } catch (err) {
      console.error('[useComments] Error creating comment:', err);
      throw err;
    }
  };

  const updateComment = async (commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to update comment');
      }

      const updatedComment = await response.json();

      // Update local state immediately (optimistic update)
      setComments((prev) =>
        prev.map((c) => (c.id === updatedComment.id ? updatedComment : c))
      );

      // Broadcast to others using Liveblocks
      if (broadcast) {
        broadcast({
          type: 'comment:updated',
          payload: updatedComment,
        });
      }

      return updatedComment;
    } catch (err) {
      console.error('[useComments] Error updating comment:', err);
      throw err;
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      // Update local state immediately (optimistic update)
      setComments((prev) => prev.filter((c) => c.id !== commentId));

      // Broadcast to others using Liveblocks
      if (broadcast) {
        broadcast({
          type: 'comment:deleted',
          payload: commentId,
        });
      }
    } catch (err) {
      console.error('[useComments] Error deleting comment:', err);
      throw err;
    }
  };

  return {
    comments,
    isLoading,
    error,
    isConnected: !!broadcast, // Connected if broadcast is available
    createComment,
    updateComment,
    deleteComment,
  };
}
