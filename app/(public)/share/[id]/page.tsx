'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { useCommentThreads } from '@/lib/realtime/hooks/useCommentThreads';
import { SelectableMessage } from '@/components/comments/SelectableMessage';
import { InlineCommentThread } from '@/components/comments/InlineCommentThread';
import { Card } from '@/components/ui/card';
import {
  AlertCircle,
  Edit,
  FileText,
  Download,
  ExternalLink,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { LiveblocksRoomProvider } from '@/lib/realtime/providers/LiveblocksRoomProvider';
import { toast } from 'sonner';

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
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface Asset {
  id: string;
  chatId: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

// Hash function to create stable message IDs (must match /chats/[id] implementation)
const createStableMessageId = (
  timestamp: string,
  sender: string,
  message: string
): string => {
  const content = `${timestamp}|${sender}|${message}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

// Inner component that uses Liveblocks hooks
function SharedChatPageContent({ chatId }: { chatId: string }) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [parsedMessages, setParsedMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [commentPositions, setCommentPositions] = useState<{
    [key: string]: number;
  }>({});
  const [pendingSelection, setPendingSelection] = useState<{
    messageId: string;
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const router = useRouter();
  const threadRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const commentsContainerRef = useRef<HTMLDivElement | null>(null);

  // Check if the current user is the owner
  const isOwner = chat && currentUser?.id === chat.userId;

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

  // Deselect active thread when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Don't deselect if clicking on a highlight, comment thread, or interactive elements
      if (
        target.closest('.highlight-span') ||
        target.closest('.comment-thread-card') ||
        target.closest('.comment-input') ||
        target.closest('textarea') ||
        target.closest('button')
      ) {
        return;
      }

      setActiveThreadId(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // Fetch assets for the chat
  useEffect(() => {
    const fetchAssets = async () => {
      if (!chatId) return;

      try {
        const response = await fetch(`/api/assets?chatId=${chatId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched assets:', data.assets);
          setAssets(data.assets || []);
        }
      } catch (error) {
        console.error('Error fetching assets:', error);
      }
    };

    fetchAssets();
  }, [chatId]);

  // Debug: Log message IDs and asset message IDs
  useEffect(() => {
    if (parsedMessages.length > 0 && assets.length > 0) {
      console.log('Parsed Message IDs:', parsedMessages.map(m => m.id));
      console.log('Asset Message IDs:', assets.map(a => a.messageId));
      console.log('Messages with assets:', parsedMessages.filter(msg =>
        assets.some(asset => asset.messageId === msg.id)
      ).map(m => ({ id: m.id, sender: m.sender })));
    }
  }, [parsedMessages, assets]);

  // Download asset function
  const downloadAsset = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Failed to fetch file');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

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

  // Sort threads by message order (based on message position in parsedMessages array)
  const sortedThreads = React.useMemo(() => {
    const messageOrder = new Map(
      parsedMessages.map((msg, idx) => [msg.id, idx])
    );

    return threads
      .filter(
        (thread) =>
          thread.id === activeThreadId ||
          (thread.comments && thread.comments.length > 0)
      )
      .sort((a, b) => {
        const orderA = messageOrder.get(a.messageId) ?? Infinity;
        const orderB = messageOrder.get(b.messageId) ?? Infinity;
        return orderA - orderB;
      });
  }, [threads, parsedMessages, activeThreadId]);

  // Calculate comment positions based on highlight positions with collision detection
  const calculateCommentPositions = React.useCallback(() => {
    if (!messagesContainerRef.current || !commentsContainerRef.current) return;

    const positions: { [key: string]: number } = {};
    const commentsContainerTop =
      commentsContainerRef.current.getBoundingClientRect().top;
    const MIN_GAP = 8;

    // Step 1: Get ideal Y position for each comment from its highlight
    const idealPositions: { threadId: string; y: number; height: number }[] =
      [];

    sortedThreads.forEach((thread) => {
      const highlightSpan = messagesContainerRef.current?.querySelector(
        `[data-thread-id="${thread.id}"]`
      ) as HTMLElement;
      const commentEl = threadRefs.current[thread.id];

      if (highlightSpan && commentEl) {
        const highlightRect = highlightSpan.getBoundingClientRect();
        const commentHeight = commentEl.offsetHeight || 200;
        const idealY = highlightRect.top - commentsContainerTop;

        idealPositions.push({
          threadId: thread.id,
          y: idealY,
          height: commentHeight,
        });
      }
    });

    if (idealPositions.length === 0) return;

    // Step 2: Load saved positions from localStorage
    const savedPositions = localStorage.getItem(
      `comment-positions-${chat?.id}`
    );
    const parsedSavedPositions: { [key: string]: number } = savedPositions
      ? JSON.parse(savedPositions)
      : {};

    // Step 3: Calculate positions
    if (activeThreadId) {
      // When a comment is active, align it exactly with its highlight
      const activeIndex = idealPositions.findIndex(
        (p) => p.threadId === activeThreadId
      );

      if (activeIndex !== -1) {
        const activeItem = idealPositions[activeIndex];
        positions[activeItem.threadId] = activeItem.y;

        // Position comments BEFORE active comment
        for (let i = activeIndex - 1; i >= 0; i--) {
          const currentItem = idealPositions[i];
          const nextItem = idealPositions[i + 1];
          const nextY = positions[nextItem.threadId];

          // Try to use ideal position, but avoid collision with next comment
          let finalY = currentItem.y;
          const wouldCollide = finalY + currentItem.height + MIN_GAP > nextY;

          if (wouldCollide) {
            // Stack above the next comment
            finalY = nextY - currentItem.height - MIN_GAP;
          }

          positions[currentItem.threadId] = finalY;
        }

        // Position comments AFTER active comment
        for (let i = activeIndex + 1; i < idealPositions.length; i++) {
          const currentItem = idealPositions[i];
          const prevItem = idealPositions[i - 1];
          const prevY = positions[prevItem.threadId];
          const prevBottom = prevY + prevItem.height;

          // Try to use ideal position, but avoid collision with previous comment
          let finalY = currentItem.y;
          const wouldCollide = finalY < prevBottom + MIN_GAP;

          if (wouldCollide) {
            // Stack below the previous comment
            finalY = prevBottom + MIN_GAP;
          }

          positions[currentItem.threadId] = finalY;
        }

        // Save to localStorage
        localStorage.setItem(
          `comment-positions-${chat?.id}`,
          JSON.stringify(positions)
        );
      }
    } else {
      // No active comment - use saved positions or calculate initial positions
      const hasSavedPositions =
        Object.keys(parsedSavedPositions).length > 0 &&
        idealPositions.some(
          (item) => parsedSavedPositions[item.threadId] !== undefined
        );

      if (hasSavedPositions) {
        // Use saved positions
        idealPositions.forEach((item) => {
          positions[item.threadId] =
            parsedSavedPositions[item.threadId] ?? item.y;
        });
      } else {
        // Initial layout: align first comment, stack others below
        idealPositions.forEach((item, index) => {
          if (index === 0) {
            // First comment aligns with its highlight
            positions[item.threadId] = item.y;
          } else {
            // Other comments stack below without overlap
            const prevItem = idealPositions[index - 1];
            const prevY = positions[prevItem.threadId];
            const prevBottom = prevY + prevItem.height;

            // Try ideal position first
            let finalY = item.y;
            const wouldCollide = finalY < prevBottom + MIN_GAP;

            if (wouldCollide) {
              // Stack below previous comment
              finalY = prevBottom + MIN_GAP;
            }

            positions[item.threadId] = finalY;
          }
        });

        // Save initial positions
        localStorage.setItem(
          `comment-positions-${chat?.id}`,
          JSON.stringify(positions)
        );
      }
    }

    setCommentPositions(positions);
  }, [sortedThreads, activeThreadId, threadRefs, chat?.id]);

  // Recalculate positions when threads, active thread, or layout changes
  React.useEffect(() => {
    calculateCommentPositions();

    // Also recalculate on scroll and resize
    const handleRecalculate = () => {
      requestAnimationFrame(calculateCommentPositions);
    };

    window.addEventListener('scroll', handleRecalculate, true);
    window.addEventListener('resize', handleRecalculate);

    return () => {
      window.removeEventListener('scroll', handleRecalculate, true);
      window.removeEventListener('resize', handleRecalculate);
    };
  }, [calculateCommentPositions]);

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

      messages.push({
        id: createStableMessageId(timestamp, sender, message),
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

        messages.push({
          id: createStableMessageId(timestamp, sender, message),
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

  // Get all threads with comments (only show threads that have at least one comment)
  const threadsWithComments = threads.filter(
    (thread) => thread.comments && thread.comments.length > 0
  );

  // Check if sidebar should be visible
  const showCommentsSidebar =
    activeThreadId !== null || threadsWithComments.length > 0;

  return (
    <div className='min-h-screen bg-background p-6'>
      <div className='max-w-7xl mx-auto'>
        <Topbar
          pageName={chat?.title || 'Loading...'}
          button={
            isOwner ? (
              <button
                onClick={() => router.push(`/chats/${chatId}`)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                  'bg-secondary text-secondary-foreground',
                  'shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)]',
                  'hover:bg-secondary/80',
                  'transition-colors duration-200 cursor-pointer'
                )}
              >
                <Edit className='w-4 h-4' />
                Edit Mode
              </button>
            ) : null
          }
        />

        {isConnected && (
          <div className='flex items-center gap-2 text-sm text-muted-foreground mb-4 mt-4'>
            <span className='w-2 h-2 bg-green-500 rounded-full'></span>
            <span>Live</span>
          </div>
        )}

        <div className='flex flex-row gap-6'>
          {/* Chat Content */}
          <div
            ref={messagesContainerRef}
            className={cn(
              'bg-secondary rounded-lg shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.01)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)] p-6 transition-all',
              showCommentsSidebar ? 'w-1/2' : 'w-full'
            )}
          >
            <div className='space-y-6'>
              {parsedMessages.map((msg) => {
                const position = getSenderPosition(msg.sender);
                const isLeft = position === 'left';
                const highlights = getMessageHighlights(msg.id);

                return (
                  <div key={msg.id}>
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

                          {/* Display assets */}
                          {assets.filter((asset) => asset.messageId === msg.id)
                            .length > 0 && (
                            <div className='mt-3 space-y-2'>
                              {assets
                                .filter((asset) => asset.messageId === msg.id)
                                .map((asset) => (
                                  <div
                                    key={asset.id}
                                    className={cn(
                                      'flex items-center gap-2 p-2 rounded text-xs group/asset',
                                      isLeft
                                        ? 'bg-muted'
                                        : 'bg-primary-foreground/20'
                                    )}
                                  >
                                    {asset.fileType.startsWith('image/') ? (
                                      <div className='flex flex-col items-start gap-2 flex-1 min-w-0'>
                                        <img
                                          src={asset.fileUrl}
                                          alt={asset.fileName}
                                          className='max-w-[200px] max-h-[200px] rounded object-cover'
                                        />
                                        <div className='flex-1 min-w-0 overflow-hidden'>
                                          <p className='truncate font-medium'>
                                            {asset.fileName}
                                          </p>
                                          <p className='text-xs opacity-70'>
                                            {(asset.fileSize / 1024).toFixed(1)}{' '}
                                            KB
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <FileText className='w-4 h-4 shrink-0' />
                                        <div className='flex-1 min-w-0 overflow-hidden'>
                                          <p className='truncate font-medium'>
                                            {asset.fileName}
                                          </p>
                                          <p className='text-xs opacity-70'>
                                            {(asset.fileSize / 1024).toFixed(1)}{' '}
                                            KB
                                          </p>
                                        </div>
                                      </>
                                    )}
                                    <div className='flex gap-1 shrink-0'>
                                      <a
                                        href={asset.fileUrl}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='hover:bg-background/20 rounded p-1'
                                      >
                                        <ExternalLink className='w-3 h-3' />
                                      </a>
                                      <button
                                        onClick={() =>
                                          downloadAsset(
                                            asset.fileUrl,
                                            asset.fileName
                                          )
                                        }
                                        className='hover:bg-background/20 rounded p-1 cursor-pointer'
                                      >
                                        <Download className='w-3 h-3' />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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

          {/* Comments Sidebar - Only show if there's an active thread or threads with comments */}
          {showCommentsSidebar && (
            <div className='w-1/2 overflow-hidden'>
              <h3 className='text-lg font-semibold mb-4 bg-background sticky top-0 z-10'>
                Comments
              </h3>
              <div
                ref={commentsContainerRef}
                className='relative min-h-[500px]'
              >
                {sortedThreads.map((thread) => {
                  const position = commentPositions[thread.id] ?? 0;

                  return (
                    <div
                      key={thread.id}
                      ref={(el) => {
                        threadRefs.current[thread.id] = el;
                      }}
                      className='absolute left-0 right-0'
                      style={{
                        top: `${position}px`,
                        transition: 'top 0.3s ease-out',
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
                  );
                })}
              </div>
            </div>
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
