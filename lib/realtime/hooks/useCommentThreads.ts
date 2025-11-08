'use client';

import { useEffect, useState } from 'react';
import {
  CommentThread,
  Comment,
  CreateThreadInput,
  CreateCommentInput,
} from '../interfaces/comment.interface';

// Import Liveblocks hooks
let useBroadcastEvent: any;
let useEventListener: any;

try {
  const liveblocks = require('@liveblocks/react/suspense');
  useBroadcastEvent = liveblocks.useBroadcastEvent;
  useEventListener = liveblocks.useEventListener;
} catch (e) {
  console.warn('[useCommentThreads] Liveblocks not available');
}

interface ThreadWithComments extends CommentThread {
  comments: Comment[];
}

interface UseCommentThreadsOptions {
  chatId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
}

export function useCommentThreads({
  chatId,
  userId,
  userName,
  userAvatar,
}: UseCommentThreadsOptions) {
  const [threads, setThreads] = useState<ThreadWithComments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use Liveblocks hooks for real-time functionality
  const broadcast = useBroadcastEvent ? useBroadcastEvent() : null;

  // Fetch initial threads with comments from database
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/comment-threads?chatId=${chatId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch threads');
        }

        const data = await response.json();
        setThreads(data);
        setError(null);
      } catch (err) {
        console.error('[useCommentThreads] Error fetching threads:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load comment threads'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreads();
  }, [chatId]);

  // Subscribe to real-time thread and comment events using Liveblocks
  if (useEventListener) {
    useEventListener(({ event }: { event: any }) => {
      console.log('[useCommentThreads] Received event:', event);

      if (event.type === 'thread:created') {
        setThreads((prev) => [event.payload, ...prev]);
      } else if (event.type === 'thread:updated') {
        setThreads((prev) =>
          prev.map((t) => (t.id === event.payload.id ? event.payload : t))
        );
      } else if (event.type === 'thread:deleted') {
        setThreads((prev) => prev.filter((t) => t.id !== event.payload));
      } else if (event.type === 'comment:created') {
        // Add comment to the appropriate thread
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === event.payload.threadId
              ? { ...thread, comments: [...thread.comments, event.payload] }
              : thread
          )
        );
      } else if (event.type === 'comment:updated') {
        setThreads((prev) =>
          prev.map((thread) => ({
            ...thread,
            comments: thread.comments.map((c) =>
              c.id === event.payload.id ? event.payload : c
            ),
          }))
        );
      } else if (event.type === 'comment:deleted') {
        setThreads((prev) =>
          prev.map((thread) => ({
            ...thread,
            comments: thread.comments.filter((c) => c.id !== event.payload),
          }))
        );
      }
    });
  }

  const createThread = async (input: Omit<CreateThreadInput, 'chatId'>) => {
    try {
      // Create thread first
      const response = await fetch('/api/comment-threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          ...input,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create thread');
      }

      const newThread = await response.json();

      // Add empty comments array
      const threadWithComments: ThreadWithComments = {
        ...newThread,
        comments: [],
      };

      // Update local state immediately (optimistic update)
      setThreads((prev) => [threadWithComments, ...prev]);

      // Broadcast to others in real-time using Liveblocks
      if (broadcast) {
        broadcast({
          type: 'thread:created',
          payload: threadWithComments,
        });
      }

      return threadWithComments;
    } catch (err) {
      console.error('[useCommentThreads] Error creating thread:', err);
      throw err;
    }
  };

  const createComment = async (
    threadId: string,
    content: string,
    parentId?: string
  ) => {
    try {
      // Find the thread to get messageId
      const thread = threads.find((t) => t.id === threadId);
      if (!thread) {
        throw new Error('Thread not found');
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          messageId: thread.messageId,
          threadId,
          parentId: parentId || null,
          content,
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
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, comments: [...t.comments, newComment] }
            : t
        )
      );

      // Broadcast to others using Liveblocks
      if (broadcast) {
        broadcast({
          type: 'comment:created',
          payload: newComment,
        });
      }

      return newComment;
    } catch (err) {
      console.error('[useCommentThreads] Error creating comment:', err);
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
      setThreads((prev) =>
        prev.map((thread) => ({
          ...thread,
          comments: thread.comments.map((c) =>
            c.id === updatedComment.id ? updatedComment : c
          ),
        }))
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
      console.error('[useCommentThreads] Error updating comment:', err);
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
      setThreads((prev) =>
        prev.map((thread) => ({
          ...thread,
          comments: thread.comments.filter((c) => c.id !== commentId),
        }))
      );

      // Broadcast to others using Liveblocks
      if (broadcast) {
        broadcast({
          type: 'comment:deleted',
          payload: commentId,
        });
      }
    } catch (err) {
      console.error('[useCommentThreads] Error deleting comment:', err);
      throw err;
    }
  };

  const resolveThread = async (threadId: string, resolved: boolean) => {
    try {
      const response = await fetch(`/api/comment-threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved }),
      });

      if (!response.ok) {
        throw new Error('Failed to update thread');
      }

      const updatedThread = await response.json();

      // Update local state immediately (optimistic update)
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, ...updatedThread } : t
        )
      );

      // Broadcast to others using Liveblocks
      if (broadcast) {
        broadcast({
          type: 'thread:updated',
          payload: updatedThread,
        });
      }

      return updatedThread;
    } catch (err) {
      console.error('[useCommentThreads] Error updating thread:', err);
      throw err;
    }
  };

  const deleteThread = async (threadId: string) => {
    try {
      const response = await fetch(`/api/comment-threads/${threadId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete thread');
      }

      // Update local state immediately (optimistic update)
      setThreads((prev) => prev.filter((t) => t.id !== threadId));

      // Broadcast to others using Liveblocks
      if (broadcast) {
        broadcast({
          type: 'thread:deleted',
          payload: threadId,
        });
      }
    } catch (err) {
      console.error('[useCommentThreads] Error deleting thread:', err);
      throw err;
    }
  };

  return {
    threads,
    isLoading,
    error,
    isConnected: !!broadcast,
    createThread,
    createComment,
    updateComment,
    deleteComment,
    resolveThread,
    deleteThread,
  };
}
