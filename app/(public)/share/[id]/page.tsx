'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { useCommentThreads } from '@/lib/realtime/hooks/useCommentThreads';
import { SelectableMessage } from '@/components/comments/SelectableMessage';
import { InlineCommentThread } from '@/components/comments/InlineCommentThread';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { LiveblocksRoomProvider } from '@/lib/realtime/providers/LiveblocksRoomProvider';

interface Message {
  id: string;
  timestamp: string;
  sender: string;
  message: string;
}

interface Chat {
  id: string;
  title: string;
  rawText: string;
  senderPositions?: { left: string[]; right: string[] } | null;
  isPublic: boolean;
  sharedWith?: Array<{ email: string; permission: string }> | null;
  createdAt: string;
  updatedAt: string;
}

// Simple hash function to generate deterministic IDs from content
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Inner component that uses Liveblocks hooks
function SharedChatPageContent({ chatId }: { chatId: string }) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [parsedMessages, setParsedMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<{
    messageId: string;
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const router = useRouter();
  const threadRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Get current user info
  useEffect(() => {
    const getUser = async () => {
      const session = await authClient.getSession();
      if (session?.data) {
        setCurrentUser(session.data.user);
      }
    };

    getUser();
  }, []);

  useEffect(() => {
    const fetchSharedChat = async () => {
      try {
        const response = await fetch(`/api/share/${chatId}`);

        if (!response.ok) {
          if (response.status === 403) {
            setError('You do not have permission to view this chat');
          } else if (response.status === 404) {
            setError('Chat not found or not shared');
          } else {
            setError('Failed to load chat');
          }
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setChat(data);
        parseChat(data.rawText, data.senderPositions);
      } catch (error) {
        console.error('Error fetching shared chat:', error);
        setError('Failed to load chat');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedChat();
  }, [chatId]);

  // Initialize comment threads hook
  const {
    threads,
    isLoading: threadsLoading,
    error: threadsError,
    isConnected,
    createThread,
    createComment,
    updateComment,
    deleteComment,
  } = useCommentThreads({
    chatId: chatId,
    userId: currentUser?.id || 'anonymous',
    userName: currentUser?.name || 'Anonymous User',
    userAvatar: currentUser?.image,
  });

  // Handle text selection - create thread
  const handleTextSelected = async (
    messageId: string,
    selectedText: string,
    startOffset: number,
    endOffset: number
  ) => {
    if (!chat || !currentUser) {
      alert('Please sign in to add comments');
      return;
    }

    try {
      // Create the thread first
      const newThread = await createThread({
        messageId,
        startOffset,
        endOffset,
        selectedText,
      });

      // Set as active thread to show the comment input
      setActiveThreadId(newThread.id);

      // Scroll to the thread
      setTimeout(() => {
        threadRefs.current[newThread.id]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 100);
    } catch (err) {
      console.error('Error creating thread:', err);
      alert('Failed to create comment thread');
    }
  };

  // Handle highlight click - activate thread
  const handleHighlightClick = (threadId: string) => {
    setActiveThreadId(threadId);

    // Scroll to thread
    setTimeout(() => {
      threadRefs.current[threadId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }, 100);
  };

  // Handle adding comment to thread
  const handleAddComment = async (threadId: string, content: string) => {
    await createComment(threadId, content);
  };

  const handleEditComment = async (commentId: string, content: string) => {
    await updateComment(commentId, content);
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
  };

  const parseChat = (
    chatText: string,
    savedPositions?: { left: string[]; right: string[] } | null
  ) => {
    let messages: Message[] = [];

    // Check if this is website format and convert to WhatsApp format first
    const websiteTimestampPattern = /^\d{1,2}\s+\w+,\s+\d{1,2}:\d{2}$/m;
    if (websiteTimestampPattern.test(chatText)) {
      chatText = convertWebsiteToWhatsApp(chatText);
    }

    // Try WhatsApp format: [date, time] Name: Message
    const whatsappRegex = /\[([^\]]+)\]\s*([^:]+):\s*([\s\S]+?)(?=\n\[|$)/g;
    let match;

    while ((match = whatsappRegex.exec(chatText)) !== null) {
      const timestamp = match[1].trim();
      const sender = match[2].trim();
      const message = match[3].trim();

      // Generate deterministic ID based on content
      const contentForHash = `${timestamp}-${sender}-${message}`;
      const deterministicId = hashString(contentForHash);

      messages.push({
        id: deterministicId,
        timestamp,
        sender,
        message,
      });
    }

    // If WhatsApp didn't work, try Telegram format: Name, [timestamp]: Message
    if (messages.length === 0) {
      const telegramRegex =
        /([^,]+),\s*\[([^\]]+)\]:\s*([\s\S]+?)(?=\n[^,\n]+,\s*\[|$)/g;

      while ((match = telegramRegex.exec(chatText)) !== null) {
        const sender = match[1].trim();
        const timestamp = match[2].trim();
        const message = match[3].trim();

        // Generate deterministic ID based on content
        const contentForHash = `${timestamp}-${sender}-${message}`;
        const deterministicId = hashString(contentForHash);

        messages.push({
          id: deterministicId,
          sender,
          timestamp,
          message,
        });
      }
    }

    setParsedMessages(messages);
  };

  const convertWebsiteToWhatsApp = (text: string): string => {
    const lines = text.split('\n');
    const timestampPattern = /^\d{1,2}\s+\w+,\s+\d{1,2}:\d{2}$/;
    const convertedMessages: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (timestampPattern.test(line)) {
        const timestamp = line;

        // Look backwards for sender name (skip Profile Image and single letters)
        let sender = 'Unknown';
        for (let k = i - 1; k >= 0; k--) {
          const prevLine = lines[k].trim();
          if (
            prevLine &&
            prevLine !== 'Profile Image' &&
            prevLine.length > 0 &&
            !/^[A-Z]$/.test(prevLine)
          ) {
            sender = prevLine;
            break;
          }
        }

        // Collect message lines
        let message = '';
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim();

          // Stop if we hit next timestamp or Profile Image
          if (timestampPattern.test(nextLine) || nextLine === 'Profile Image') {
            break;
          }

          // Look ahead when hitting single letter to check if it's start of next message
          if (/^[A-Z]$/.test(nextLine)) {
            let hasTimestampAhead = false;
            for (let k = j + 1; k < Math.min(j + 4, lines.length); k++) {
              const aheadLine = lines[k].trim();
              if (timestampPattern.test(aheadLine)) {
                hasTimestampAhead = true;
                break;
              }
            }
            if (hasTimestampAhead) {
              break;
            }
          }

          // Skip single letters, file attachments, and system messages
          if (
            nextLine &&
            !/^[A-Z]$/.test(nextLine) &&
            !nextLine.includes('File') &&
            !nextLine.includes('Please note:') &&
            !nextLine.includes('cannot be scanned') &&
            !nextLine.includes('Learn more') &&
            !nextLine.match(/^\([\d\.]+ (MB|KB|GB)\)$/) &&
            !nextLine.match(/\.(mov|mp4|jpg|png|pdf)$/i)
          ) {
            message += (message ? ' ' : '') + nextLine;
          }
        }

        // Only add if we have a valid message and sender
        if (message && sender && sender !== 'Profile Image') {
          convertedMessages.push(`[${timestamp}] ${sender}: ${message.trim()}`);
        }
      }
    }

    return convertedMessages.length > 0 ? convertedMessages.join('\n') : text;
  };

  const getSenderPosition = (sender: string): 'left' | 'right' => {
    if (!chat?.senderPositions) return 'left';
    if (chat.senderPositions.right?.includes(sender)) return 'right';
    return 'left';
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-muted-foreground'>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-red-500 text-lg mb-4'>{error}</div>
          <button
            onClick={() => router.push('/')}
            className='text-primary hover:underline'
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Get highlights for a message
  const getMessageHighlights = (messageId: string) => {
    return threads
      .filter((thread) => thread.messageId === messageId)
      .map((thread) => ({
        startOffset: thread.startOffset,
        endOffset: thread.endOffset,
        threadId: thread.id,
        isActive: thread.id === activeThreadId,
      }));
  };

  // Get thread for a message
  const getMessageThreads = (messageId: string) => {
    return threads.filter((thread) => thread.messageId === messageId);
  };

  return (
    <div className='min-h-screen bg-background p-6'>
      <div className='max-w-6xl mx-auto'>
        <Topbar pageName={chat?.title || 'Loading...'} />

        {isConnected && (
          <div className='flex items-center gap-2 text-sm text-muted-foreground mb-4 mt-4'>
            <span className='w-2 h-2 bg-green-500 rounded-full'></span>
            <span>Live</span>
          </div>
        )}

        {/* Chat Content with Inline Comments */}
        <div className='bg-secondary rounded-lg shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.01)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)] p-6'>
          <div className='space-y-6'>
            {parsedMessages.map((msg) => {
              const position = getSenderPosition(msg.sender);
              const isLeft = position === 'left';
              const messageThreads = getMessageThreads(msg.id);
              const highlights = getMessageHighlights(msg.id);

              return (
                <div key={msg.id} className='space-y-3'>
                  {/* Message Bubble */}
                  <div
                    className={cn(
                      'flex',
                      isLeft ? 'justify-start' : 'justify-end'
                    )}
                  >
                    <div className={cn('max-w-[75%]')}>
                      <div
                        className={cn(
                          'rounded-lg p-3 shadow-sm',
                          isLeft
                            ? 'bg-background text-foreground'
                            : 'bg-primary/70 text-primary-foreground'
                        )}
                      >
                        <p className='font-medium text-sm mb-1 opacity-50'>
                          {msg.sender}
                        </p>
                        <SelectableMessage
                          messageId={msg.id}
                          content={msg.message}
                          highlights={highlights}
                          onTextSelected={handleTextSelected}
                          onHighlightClick={handleHighlightClick}
                          className='text-sm'
                        />
                        <p
                          className={cn(
                            'text-xs mt-2 opacity-50',
                            isLeft
                              ? 'text-muted-foreground'
                              : 'text-primary-foreground/70'
                          )}
                        >
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Inline Comment Threads for this message */}
                  {messageThreads.length > 0 && (
                    <div className='ml-8 space-y-3'>
                      {messageThreads.map((thread) => (
                        <div
                          key={thread.id}
                          ref={(el) => {
                            threadRefs.current[thread.id] = el;
                          }}
                        >
                          <InlineCommentThread
                            threadId={thread.id}
                            selectedText={thread.selectedText}
                            comments={thread.comments}
                            onAddComment={handleAddComment}
                            onEditComment={handleEditComment}
                            onDeleteComment={handleDeleteComment}
                            currentUserId={currentUser?.id}
                            isActive={thread.id === activeThreadId}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!currentUser && (
            <Card className='p-4 mt-6 bg-muted/50 text-center'>
              <p className='text-sm text-muted-foreground'>
                Sign in to select text and add comments
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Outer wrapper component that provides the Liveblocks room
export default function SharedChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  if (!id) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-muted-foreground'>Loading...</div>
      </div>
    );
  }

  return (
    <LiveblocksRoomProvider roomId={`chat-${id}`}>
      <SharedChatPageContent chatId={id} />
    </LiveblocksRoomProvider>
  );
}
