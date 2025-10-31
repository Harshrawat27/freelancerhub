'use client';

import { Sidebar } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Message {
  id: string;
  timestamp: string;
  sender: string;
  message: string;
  isRedacted?: boolean;
  originalIndex?: number;
  originalLength?: number;
}

export default function CreateChats() {
  const [rawChat, setRawChat] = useState('');
  const [parsedMessages, setParsedMessages] = useState<Message[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Parse WhatsApp/Telegram/other chat formats
  const parseChat = () => {
    if (!rawChat.trim()) {
      toast.error('Please paste a chat first');
      return;
    }

    let messages: Message[] = [];

    // Try WhatsApp format: [date, time] Name: Message
    const whatsappRegex = /\[([^\]]+)\]\s*([^:]+):\s*([\s\S]+?)(?=\n\[|$)/g;
    let match;

    while ((match = whatsappRegex.exec(rawChat)) !== null) {
      messages.push({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: match[1].trim(),
        sender: match[2].trim(),
        message: match[3].trim().replace(/\n/g, ' '),
        isRedacted: false,
        originalIndex: match.index,
        originalLength: match[0].length,
      });
    }

    // If WhatsApp didn't work, try Telegram format: Name, [timestamp]: Message
    if (messages.length === 0) {
      const telegramRegex =
        /([^,]+),\s*\[([^\]]+)\]:\s*([\s\S]+?)(?=\n[^\s]|$)/g;

      while ((match = telegramRegex.exec(rawChat)) !== null) {
        messages.push({
          id: Math.random().toString(36).substr(2, 9),
          sender: match[1].trim(),
          timestamp: match[2].trim(),
          message: match[3].trim().replace(/\n/g, ' '),
          isRedacted: false,
          originalIndex: match.index,
          originalLength: match[0].length,
        });
      }
    }

    // If Telegram didn't work, try simple format: Name\ntimestamp\nmessage
    if (messages.length === 0) {
      const lines = rawChat.split('\n').filter((line) => line.trim());

      for (let i = 0; i < lines.length; i++) {
        // Look for timestamp pattern (dates with commas or slashes)
        const timestampPattern =
          /\d{1,2}\s+\w+,?\s+\d{1,2}:\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}/;

        if (timestampPattern.test(lines[i])) {
          // Previous line should be the name
          const sender = i > 0 ? lines[i - 1].trim() : 'Unknown';
          const timestamp = lines[i].trim();

          // Next lines until another timestamp are the message
          let message = '';
          for (let j = i + 1; j < lines.length; j++) {
            if (timestampPattern.test(lines[j])) break;
            if (
              lines[j].trim() &&
              !lines[j].includes('Profile Image') &&
              lines[j].trim().length > 1
            ) {
              message += (message ? ' ' : '') + lines[j].trim();
            }
          }

          if (
            message &&
            sender !== 'Me' &&
            sender !== 'Profile Image' &&
            sender !== 'Replied'
          ) {
            messages.push({
              id: Math.random().toString(36).substr(2, 9),
              sender,
              timestamp,
              message,
              isRedacted: false,
            });
          }
        }
      }
    }

    if (messages.length === 0) {
      toast.error(
        'Could not parse chat format. Please try WhatsApp or Telegram format.'
      );
      return;
    }

    setParsedMessages(messages);
    toast.success(`Parsed ${messages.length} messages successfully!`);
  };

  const clearChat = () => {
    setRawChat('');
    setParsedMessages([]);
    setEditMode(false);
    setSelectedMessage(null);
    toast.success('Chat cleared');
  };

  const handleMessageEdit = (id: string) => {
    if (!editMode) return;

    const message = parsedMessages.find((msg) => msg.id === id);
    if (
      !message ||
      message.originalIndex === undefined ||
      message.originalLength === undefined
    ) {
      return;
    }

    // Focus textarea and select the message text
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        message.originalIndex,
        message.originalIndex + message.originalLength
      );
      textareaRef.current.scrollTop =
        (message.originalIndex / rawChat.length) *
        textareaRef.current.scrollHeight;
    }

    setSelectedMessage(id);
    // toast.info('Message selected in textarea - edit and parse again!');
  };

  const shareChat = () => {
    const chatText = parsedMessages
      .map((msg) => {
        return `[${msg.timestamp}] ${msg.sender}: ${msg.message}`;
      })
      .join('\n');

    navigator.clipboard.writeText(chatText);
    toast.success('Chat copied to clipboard!');
  };

  const downloadChat = () => {
    const chatText = parsedMessages
      .map((msg) => {
        return `[${msg.timestamp}] ${msg.sender}: ${msg.message}`;
      })
      .join('\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Chat downloaded!');
  };

  // Get unique senders for color coding
  const uniqueSenders = Array.from(
    new Set(parsedMessages.map((msg) => msg.sender))
  );

  const getSenderColor = (sender: string) => {
    const index = uniqueSenders.indexOf(sender);
    return index % 2 === 0 ? 'right' : 'left';
  };

  return (
    <div className='min-h-screen bg-background transition-colors duration-300'>
      <Sidebar />
      <main className='ml-[270px] p-6 flex flex-col min-h-screen max-h-screen'>
        <Topbar pageName='Create Chats' />

        <div className='mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 grow h-[calc(100vh-110px)]'>
          {/* Left Side - Input */}
          <div className='flex flex-col gap-4'>
            <div className='bg-secondary rounded-lg p-6 shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.01)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)]'>
              <h2 className='font-heading text-xl font-bold text-foreground mb-2'>
                Paste Chat
              </h2>
              <p className='text-muted-foreground text-sm mb-4'>
                Paste your chat from WhatsApp, Telegram, or other platforms.
                Supports multiple formats!
              </p>

              <Textarea
                ref={textareaRef}
                value={rawChat}
                onChange={(e) => setRawChat(e.target.value)}
                placeholder='WhatsApp: [28/10/25, 12:48:08 PM] John Doe: Hello there!&#10;Telegram: John Doe, [20 Aug 2025 at 1:10:46 PM]: Hello there!&#10;Other: Name on one line, timestamp next, then message'
                className={cn(
                  'min-h-[300px] font-mono text-sm text-muted-foreground transition-all duration-200',
                  selectedMessage &&
                    editMode &&
                    'bg-primary/10 ring-2 ring-primary'
                )}
              />

              <div className='flex gap-2 mt-4'>
                <Button
                  onClick={clearChat}
                  variant='outline'
                  className='flex-1 cursor-pointer'
                >
                  Clear
                </Button>
                <Button
                  onClick={parseChat}
                  className='flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer'
                >
                  Parse Chat
                </Button>
              </div>
            </div>
          </div>

          {/* Right Side - Chat Display */}
          <div className='flex flex-col max-h-full overflow-auto'>
            <div className='bg-secondary rounded-lg shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.01)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)] flex flex-col h-full'>
              {/* Header */}
              <div className='p-4 border-b border-border flex items-center justify-between'>
                <h2 className='font-heading text-xl font-bold text-foreground'>
                  Chat Preview
                </h2>
                {parsedMessages.length > 0 && (
                  <div className='flex gap-2'>
                    <Button
                      onClick={shareChat}
                      size='sm'
                      variant='outline'
                      className='text-xs cursor-pointer'
                    >
                      <svg
                        className='w-4 h-4 mr-1'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
                        />
                      </svg>
                      Share
                    </Button>
                    <Button
                      onClick={downloadChat}
                      size='sm'
                      variant='outline'
                      className='text-xs cursor-pointer'
                    >
                      <svg
                        className='w-4 h-4 mr-1'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                        />
                      </svg>
                      Download
                    </Button>
                    <Button
                      onClick={() => setEditMode(!editMode)}
                      size='sm'
                      variant='outline'
                      className='text-xs cursor-pointer'
                    >
                      {editMode ? 'Done' : 'Edit'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Chat Messages */}
              <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                {parsedMessages.length === 0 ? (
                  <div className='flex flex-col items-center justify-center h-full text-center'>
                    <svg
                      className='w-16 h-16 text-muted-foreground/30 mb-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                      />
                    </svg>
                    <p className='text-muted-foreground text-lg mb-2'>
                      No chat to display
                    </p>
                    <p className='text-muted-foreground text-sm'>
                      Paste a chat on the left and click "Parse Chat"
                    </p>
                  </div>
                ) : (
                  parsedMessages.map((msg) => {
                    const position = getSenderColor(msg.sender);
                    const isLeft = position === 'left';

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex',
                          isLeft ? 'justify-start' : 'justify-end'
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[75%] group relative',
                            editMode && 'cursor-pointer'
                          )}
                          onClick={() => handleMessageEdit(msg.id)}
                        >
                          <div
                            className={cn(
                              'rounded-lg p-3 shadow-sm transition-all duration-200',
                              isLeft
                                ? 'bg-background text-foreground'
                                : 'bg-primary text-primary-foreground',
                              selectedMessage === msg.id &&
                                editMode &&
                                'ring-2 ring-gray-600 dark:ring-gray-400',
                              editMode &&
                                'hover:ring-2 hover:ring-gray-500 dark:hover:ring-gray-500'
                            )}
                          >
                            <p className='font-medium text-sm mb-1 opacity-50'>
                              {msg.sender}
                            </p>
                            <p className='text-sm break-words'>{msg.message}</p>
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
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
