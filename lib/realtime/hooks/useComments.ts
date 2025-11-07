'use client';

import { useEffect, useState } from 'react';
import { useRealtime } from './useRealtime';
import { Comment, CreateCommentInput } from '../interfaces/comment.interface';

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
  const { broadcast, subscribe, isConnected } = useRealtime(`chat-${chatId}`);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Subscribe to real-time comment events
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeCreate = subscribe<Comment>('comment:created', (comment) => {
      setComments((prev) => [...prev, comment]);
    });

    const unsubscribeUpdate = subscribe<Comment>('comment:updated', (comment) => {
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? comment : c))
      );
    });

    const unsubscribeDelete = subscribe<string>('comment:deleted', (commentId) => {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    });

    return () => {
      unsubscribeCreate();
      unsubscribeUpdate();
      unsubscribeDelete();
    };
  }, [isConnected, subscribe]);

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

      // Broadcast to others in real-time
      broadcast({
        type: 'comment:created',
        payload: newComment,
        timestamp: Date.now(),
        userId,
      });

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

      // Broadcast to others
      broadcast({
        type: 'comment:updated',
        payload: updatedComment,
        timestamp: Date.now(),
        userId,
      });

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

      // Broadcast to others
      broadcast({
        type: 'comment:deleted',
        payload: commentId,
        timestamp: Date.now(),
        userId,
      });
    } catch (err) {
      console.error('[useComments] Error deleting comment:', err);
      throw err;
    }
  };

  return {
    comments,
    isLoading,
    error,
    isConnected,
    createComment,
    updateComment,
    deleteComment,
  };
}
