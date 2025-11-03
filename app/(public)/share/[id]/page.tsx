'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

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

    setParsedMessages(messages);
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
        <h1 className='text-3xl font-bold text-foreground mb-2'>
          {chat?.title}
        </h1>
        <p className='text-sm text-muted-foreground mb-6'>Shared chat</p>

        <div className='bg-secondary rounded-lg shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.01)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)] p-6'>
          <div className='space-y-4'>
            {parsedMessages.map((msg) => {
              const position = getSenderPosition(msg.sender);
              const isLeft = position === 'left';

              return (
                <div
                  key={msg.id}
                  className={cn('flex', isLeft ? 'justify-start' : 'justify-end')}
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
