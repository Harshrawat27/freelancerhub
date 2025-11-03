'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Topbar from '@/components/Topbar';

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

export default function SharedChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [parsedMessages, setParsedMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchSharedChat = async () => {
      try {
        const response = await fetch(`/api/share/${id}`);

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
  }, [id]);

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
      messages.push({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: match[1].trim(),
        sender: match[2].trim(),
        message: match[3].trim(),
      });
    }

    // If WhatsApp didn't work, try Telegram format: Name, [timestamp]: Message
    if (messages.length === 0) {
      const telegramRegex =
        /([^,]+),\s*\[([^\]]+)\]:\s*([\s\S]+?)(?=\n[^,\n]+,\s*\[|$)/g;

      while ((match = telegramRegex.exec(chatText)) !== null) {
        messages.push({
          id: Math.random().toString(36).substr(2, 9),
          sender: match[1].trim(),
          timestamp: match[2].trim(),
          message: match[3].trim(),
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

  return (
    <div className='min-h-screen bg-background p-6'>
      <div className='max-w-4xl mx-auto'>
        <Topbar pageName={chat?.title || 'Loading...'} />

        <div className='bg-secondary rounded-lg shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.01)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)] p-6 mt-6'>
          <div className='space-y-4'>
            {parsedMessages.map((msg) => {
              const position = getSenderPosition(msg.sender);
              const isLeft = position === 'left';

              return (
                <div
                  key={msg.id}
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
                      <p className='text-sm whitespace-pre-wrap wrap-break-word'>
                        {msg.message}
                      </p>
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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
