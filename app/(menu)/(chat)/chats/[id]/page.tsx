'use client';

import { Sidebar } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { emailSchema } from '@/lib/validations';

interface Message {
  id: string;
  timestamp: string;
  sender: string;
  message: string;
  isRedacted?: boolean;
  originalIndex?: number;
  originalLength?: number;
}

interface Chat {
  id: string;
  title: string;
  rawText: string;
  senderPositions?: { left: string[]; right: string[] } | null;
  nameMapping?: Record<string, string> | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function ChatDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [rawChat, setRawChat] = useState('');
  const [parsedMessages, setParsedMessages] = useState<Message[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharedWith, setSharedWith] = useState<
    { email: string; permission: string }[]
  >([]);
  const [linkAccess, setLinkAccess] = useState<'restricted' | 'anyone'>(
    'restricted'
  );
  const [chatTitle, setChatTitle] = useState('');
  const [leftSenders, setLeftSenders] = useState<string[]>([]);
  const [rightSenders, setRightSenders] = useState<string[]>([]);
  const [nameMapping, setNameMapping] = useState<Record<string, string>>({});

  // Unwrap params
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  // Fetch chat data
  useEffect(() => {
    if (!id) return;

    const fetchChat = async () => {
      try {
        const response = await fetch(`/api/chat/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Chat not found');
          } else if (response.status === 401) {
            toast.error('Unauthorized');
          } else {
            toast.error('Failed to load chat');
          }
          return;
        }

        const data = await response.json();
        setChat(data);
        setRawChat(data.rawText);
        setChatTitle(data.title);

        // Load sender positions and name mapping
        if (data.senderPositions) {
          setLeftSenders(data.senderPositions.left || []);
          setRightSenders(data.senderPositions.right || []);
        }
        if (data.nameMapping) {
          setNameMapping(data.nameMapping);
        }

        // Parse the chat immediately
        parseChat(data.rawText, data.senderPositions);
      } catch (error) {
        console.error('Error fetching chat:', error);
        toast.error('Failed to load chat');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChat();
  }, [id]);

  const addSharedUser = () => {
    // Validate email using Zod schema
    const result = emailSchema.safeParse(shareEmail.trim());

    if (!result.success) {
      toast.error('Please enter a valid email address');
      return;
    }

    const validEmail = result.data;

    // Check if already shared
    if (sharedWith.find((u) => u.email === validEmail)) {
      toast.error('This email is already added');
      return;
    }

    // Add user
    setSharedWith([...sharedWith, { email: validEmail, permission: 'viewer' }]);
    setShareEmail('');
    toast.success(`Shared with ${validEmail}`);
  };

  const removeSharedUser = (email: string) => {
    setSharedWith(sharedWith.filter((u) => u.email !== email));
    toast.success('Access removed');
  };

  const updatePermission = (email: string, permission: string) => {
    setSharedWith(
      sharedWith.map((u) => (u.email === email ? { ...u, permission } : u))
    );
  };

  const copyShareableLink = () => {
    const link = `${window.location.origin}/chats/${id}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  // Parse chat text
  const parseChat = (
    text: string,
    savedPositions?: { left: string[]; right: string[] } | null
  ) => {
    if (!text.trim()) {
      setParsedMessages([]);
      return;
    }

    let messages: Message[] = [];

    // Try WhatsApp format: [date, time] Name: Message
    const whatsappRegex = /\[([^\]]+)\]\s*([^:]+):\s*([\s\S]+?)(?=\n\[|$)/g;
    let match;

    while ((match = whatsappRegex.exec(text)) !== null) {
      messages.push({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: match[1].trim(),
        sender: match[2].trim(),
        message: match[3].trim(),
        isRedacted: false,
        originalIndex: match.index,
        originalLength: match[0].length,
      });
    }

    // If WhatsApp didn't work, try Telegram format: Name, [timestamp]: Message
    if (messages.length === 0) {
      const telegramRegex =
        /([^,]+),\s*\[([^\]]+)\]:\s*([\s\S]+?)(?=\n[^,\n]+,\s*\[|$)/g;

      while ((match = telegramRegex.exec(text)) !== null) {
        messages.push({
          id: Math.random().toString(36).substr(2, 9),
          sender: match[1].trim(),
          timestamp: match[2].trim(),
          message: match[3].trim(),
          isRedacted: false,
          originalIndex: match.index,
          originalLength: match[0].length,
        });
      }
    }

    // If Telegram didn't work, try simple format: Name\ntimestamp\nmessage
    if (messages.length === 0) {
      const lines = text.split('\n').filter((line) => line.trim());

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

    setParsedMessages(messages);

    // Set default sender positions if not already set
    if (
      !savedPositions &&
      leftSenders.length === 0 &&
      rightSenders.length === 0
    ) {
      const uniqueSenders = Array.from(
        new Set(messages.map((msg) => msg.sender))
      );
      if (uniqueSenders.length > 0) {
        setRightSenders([uniqueSenders[0]]);
        setLeftSenders(uniqueSenders.slice(1));
      }
    }
  };

  const moveSenderToRight = (sender: string) => {
    setLeftSenders(leftSenders.filter((s) => s !== sender));
    setRightSenders([...rightSenders, sender]);
  };

  const moveSenderToLeft = (sender: string) => {
    setRightSenders(rightSenders.filter((s) => s !== sender));
    setLeftSenders([...leftSenders, sender]);
  };

  const renameSender = (originalName: string, newName: string) => {
    if (!newName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    // Update name mapping
    setNameMapping((prev) => ({
      ...prev,
      [originalName]: newName.trim(),
    }));

    // Replace all occurrences in rawChat
    const updatedChat = rawChat.replace(
      new RegExp(
        `\\b${originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'g'
      ),
      newName.trim()
    );
    setRawChat(updatedChat);

    // Update sender lists
    setLeftSenders((prev) =>
      prev.map((s) => (s === originalName ? newName.trim() : s))
    );
    setRightSenders((prev) =>
      prev.map((s) => (s === originalName ? newName.trim() : s))
    );

    // Re-parse the chat to update messages
    parseChat(updatedChat, { left: leftSenders, right: rightSenders });

    toast.success(`Renamed "${originalName}" to "${newName}"`);
  };

  const handleEditToggle = async () => {
    if (editMode) {
      // Exiting edit mode - save changes
      if (!rawChat.trim()) {
        toast.error('Chat cannot be empty');
        return;
      }

      if (!chatTitle.trim()) {
        toast.error('Title cannot be empty');
        return;
      }

      // Disable edit mode immediately to prevent further changes
      setEditMode(false);
      setSelectedMessage(null);
      setIsUpdating(true);

      try {
        const response = await fetch(`/api/chat/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: chatTitle,
            rawText: rawChat,
            senderPositions: {
              left: leftSenders,
              right: rightSenders,
            },
            nameMapping,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update chat');
        }

        const updatedChat = await response.json();
        setChat(updatedChat);
        parseChat(rawChat, { left: leftSenders, right: rightSenders });
        toast.success('Chat updated successfully!');
      } catch (error) {
        console.error('Error updating chat:', error);
        toast.error('Failed to update chat');
        // Re-enable edit mode if save failed
        setEditMode(true);
      } finally {
        setIsUpdating(false);
      }
    } else {
      // Entering edit mode
      setEditMode(true);
    }
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
  };

  const copyToClipboard = () => {
    const chatText = parsedMessages
      .map((msg) => {
        return `[${msg.timestamp}] ${msg.sender}: ${msg.message}`;
      })
      .join('\n');
    navigator.clipboard.writeText(chatText);
    toast.success('Chat text copied to clipboard!');
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
    a.download = `${chat?.title || 'chat'}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Chat downloaded!');
  };

  const getSenderColor = (sender: string) => {
    if (rightSenders.includes(sender)) {
      return 'right';
    }
    return 'left';
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background transition-colors duration-300'>
        <Sidebar />
        <main className='ml-[270px] p-6 flex flex-col min-h-screen'>
          <Topbar pageName='Chat' />
          <div className='flex items-center justify-center flex-1'>
            <div className='text-center'>
              <div className='w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
              <p className='text-muted-foreground'>Loading chat...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className='min-h-screen bg-background transition-colors duration-300'>
        <Sidebar />
        <main className='ml-[270px] p-6 flex flex-col min-h-screen'>
          <Topbar pageName='Chat' />
          <div className='flex items-center justify-center flex-1'>
            <div className='text-center'>
              <p className='text-muted-foreground text-lg'>Chat not found</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background transition-colors duration-300'>
      <Sidebar />
      <main className='ml-[270px] p-6 flex flex-col min-h-screen max-h-screen'>
        <Topbar pageName={chat.title} />

        <div className='mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 grow h-[calc(100vh-110px)]'>
          {/* Left Side - Input and Controls */}
          {/* <div className='flex flex-col gap-4 overflow-y-auto'> */}
          <div className='flex flex-col overflow-y-auto'>
            {/* Raw Chat Text */}
            <div className='bg-secondary rounded-lg p-4 shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.01)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)] grow flex flex-col pb-0 rounded-b-none'>
              <h2 className='font-heading text-xl font-bold text-foreground mb-2'>
                {editMode ? 'Edit Chat' : 'Chat Source'}
              </h2>

              <div className='mb-4'>
                <label className='text-sm font-medium text-foreground mb-2 block'>
                  Chat Title
                </label>
                <Input
                  value={chatTitle}
                  onChange={(e) => setChatTitle(e.target.value)}
                  placeholder='Enter chat title...'
                  disabled={!editMode}
                  className={cn(
                    'w-full',
                    !editMode && 'opacity-60 cursor-not-allowed'
                  )}
                />
              </div>

              <p className='text-muted-foreground text-sm mb-4'>
                {editMode
                  ? 'Edit the raw chat text and click "Done" to save changes.'
                  : 'Raw chat text from WhatsApp, Telegram, or other platforms.'}
              </p>

              <Textarea
                ref={textareaRef}
                value={rawChat}
                onChange={(e) => setRawChat(e.target.value)}
                disabled={!editMode}
                className={cn(
                  'min-h-[100px] font-mono text-sm text-muted-foreground grow',
                  !editMode && 'opacity-60 cursor-not-allowed',
                  selectedMessage &&
                    editMode &&
                    'bg-primary/10 ring-2 ring-primary'
                )}
              />
            </div>

            {/* Title and Sender Assignment */}
            {parsedMessages.length > 0 && (
              <div className='bg-secondary rounded-lg p-4 shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.01)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)] pt-4 rounded-t-none'>
                {/* Title Input */}
                {/* <div className='mb-4'>
                  <label className='text-sm font-medium text-foreground mb-2 block'>
                    Chat Title
                  </label>
                  <Input
                    value={chatTitle}
                    onChange={(e) => setChatTitle(e.target.value)}
                    placeholder='Enter chat title...'
                    disabled={!editMode}
                    className={cn(
                      'w-full',
                      !editMode && 'opacity-60 cursor-not-allowed'
                    )}
                  />
                </div> */}

                {/* Sender Assignment */}
                <div>
                  <label className='text-sm font-medium text-foreground mb-2 block'>
                    Assign Participants
                  </label>
                  <p className='text-xs text-muted-foreground mb-3'>
                    {editMode
                      ? 'Click on names to move them between left and right sides'
                      : 'Participant positions (click Edit to change)'}
                  </p>

                  <div className='grid grid-cols-2 gap-4'>
                    {/* Left Side Senders */}
                    <div className='border border-border rounded-lg p-3 bg-background/50'>
                      <h3 className='text-xs font-semibold text-foreground mb-2 flex items-center'>
                        <svg
                          className='w-3 h-3 mr-1'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M15 19l-7-7 7-7'
                          />
                        </svg>
                        Left Side
                      </h3>
                      <div className='space-y-2'>
                        {leftSenders.length === 0 ? (
                          <p className='text-xs text-muted-foreground italic'>
                            No participants
                          </p>
                        ) : (
                          leftSenders.map((sender) => (
                            <div
                              key={sender}
                              onClick={() =>
                                editMode && moveSenderToRight(sender)
                              }
                              className={cn(
                                'px-3 py-2 bg-muted rounded-md text-xs font-medium flex items-center justify-between group',
                                editMode
                                  ? 'cursor-pointer hover:bg-muted/70 transition-colors'
                                  : 'opacity-60 cursor-not-allowed'
                              )}
                            >
                              <span>{sender}</span>
                              {editMode && (
                                <svg
                                  className='w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M9 5l7 7-7 7'
                                  />
                                </svg>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Right Side Senders */}
                    <div className='border border-border rounded-lg p-3 bg-primary/5'>
                      <h3 className='text-xs font-semibold text-foreground mb-2 flex items-center'>
                        <svg
                          className='w-3 h-3 mr-1'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M9 5l7 7-7 7'
                          />
                        </svg>
                        Right Side
                      </h3>
                      <div className='space-y-2'>
                        {rightSenders.length === 0 ? (
                          <p className='text-xs text-muted-foreground italic'>
                            No participants
                          </p>
                        ) : (
                          rightSenders.map((sender) => (
                            <div
                              key={sender}
                              onClick={() =>
                                editMode && moveSenderToLeft(sender)
                              }
                              className={cn(
                                'px-3 py-2 bg-primary/20 rounded-md text-xs font-medium flex items-center justify-between group',
                                editMode
                                  ? 'cursor-pointer hover:bg-primary/30 transition-colors'
                                  : 'opacity-60 cursor-not-allowed'
                              )}
                            >
                              {editMode && (
                                <svg
                                  className='w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M15 19l-7-7 7-7'
                                  />
                                </svg>
                              )}
                              <span>{sender}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rename Participants */}
                <div className='mt-6 border-t border-border pt-6'>
                  <label className='text-sm font-medium text-foreground mb-2 block'>
                    Rename Participants
                  </label>
                  <p className='text-xs text-muted-foreground mb-3'>
                    {editMode
                      ? 'Change participant names. Original name → New name'
                      : 'Participant name mappings (click Edit to change)'}
                  </p>

                  <div className='space-y-2'>
                    {[...leftSenders, ...rightSenders].map((sender) => {
                      const originalName =
                        Object.keys(nameMapping).find(
                          (key) => nameMapping[key] === sender
                        ) || sender;
                      const hasBeenRenamed =
                        nameMapping[originalName] !== undefined;

                      return (
                        <div
                          key={sender}
                          className='flex items-center gap-2 p-2 bg-muted/30 rounded-lg'
                        >
                          <div className='flex-1 flex items-center gap-2'>
                            {hasBeenRenamed && (
                              <>
                                <span className='text-xs text-muted-foreground line-through'>
                                  {originalName}
                                </span>
                                <svg
                                  className='w-3 h-3 text-muted-foreground'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M9 5l7 7-7 7'
                                  />
                                </svg>
                              </>
                            )}
                            <Input
                              key={sender}
                              defaultValue={sender}
                              onBlur={(e) => {
                                if (editMode) {
                                  const newName = e.target.value.trim();
                                  if (newName && newName !== sender) {
                                    renameSender(sender, newName);
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                              disabled={!editMode}
                              className={cn(
                                'text-xs h-8',
                                !editMode && 'opacity-60 cursor-not-allowed'
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
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
                      </DialogTrigger>
                      <DialogContent className='max-w-lg'>
                        <DialogHeader>
                          <DialogTitle className='font-heading text-xl'>
                            Share Chat
                          </DialogTitle>
                          <DialogDescription>
                            Share this chat with people via email or link
                          </DialogDescription>
                        </DialogHeader>

                        <div className='space-y-6 mt-4'>
                          {/* Add people */}
                          <div className='space-y-3'>
                            <label className='text-sm font-medium text-foreground'>
                              Add people
                            </label>
                            <div className='flex gap-2 mt-2'>
                              <input
                                type='email'
                                placeholder='Enter email address...'
                                value={shareEmail}
                                onChange={(e) => setShareEmail(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addSharedUser();
                                  }
                                }}
                                className='flex-1 px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary'
                              />
                              <Button
                                onClick={addSharedUser}
                                size='sm'
                                className='bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                              >
                                Add
                              </Button>
                            </div>
                          </div>

                          {/* People with access */}
                          {sharedWith.length > 0 && (
                            <div className='space-y-2'>
                              <label className='text-sm font-medium text-foreground'>
                                People with access
                              </label>
                              <div className='space-y-2 max-h-[200px] overflow-y-auto'>
                                {sharedWith.map((user) => (
                                  <div
                                    key={user.email}
                                    className='flex items-center justify-between p-3 bg-muted/30 rounded-lg mt-2.5'
                                  >
                                    <div className='flex items-center gap-3'>
                                      <div className='w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center'>
                                        <span className='text-xs font-medium text-primary'>
                                          {user.email[0].toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <p className='text-sm font-medium text-foreground'>
                                          {user.email}
                                        </p>
                                      </div>
                                    </div>
                                    <div className='flex items-center gap-2'>
                                      <select
                                        value={user.permission}
                                        onChange={(e) =>
                                          updatePermission(
                                            user.email,
                                            e.target.value
                                          )
                                        }
                                        className='w-[110px] h-8 text-xs px-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer'
                                      >
                                        <option value='viewer'>Viewer</option>
                                        <option value='editor'>Editor</option>
                                      </select>
                                      <Button
                                        onClick={() =>
                                          removeSharedUser(user.email)
                                        }
                                        size='sm'
                                        variant='ghost'
                                        className='h-8 w-8 p-0 cursor-pointer'
                                      >
                                        <svg
                                          className='w-4 h-4'
                                          fill='none'
                                          stroke='currentColor'
                                          viewBox='0 0 24 24'
                                        >
                                          <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M6 18L18 6M6 6l12 12'
                                          />
                                        </svg>
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* General access */}
                          <div className='border-t border-border pt-4 space-y-3'>
                            <label className='text-sm font-medium text-foreground'>
                              General access
                            </label>
                            <div className='flex items-center justify-between p-3 bg-muted/30 rounded-lg mt-2.5'>
                              <div className='flex items-center gap-3'>
                                <svg
                                  className='w-5 h-5 text-muted-foreground'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                                  />
                                </svg>
                                <div>
                                  <p className='text-sm font-medium text-foreground'>
                                    {linkAccess === 'anyone'
                                      ? 'Anyone with the link'
                                      : 'Restricted'}
                                  </p>
                                  <p className='text-xs text-muted-foreground'>
                                    {linkAccess === 'anyone'
                                      ? 'Anyone on the internet with the link can view'
                                      : 'Only people with access can open'}
                                  </p>
                                </div>
                              </div>
                              <select
                                value={linkAccess}
                                onChange={(e) =>
                                  setLinkAccess(
                                    e.target.value as 'restricted' | 'anyone'
                                  )
                                }
                                className='w-[130px] h-8 text-xs px-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer'
                              >
                                <option value='restricted'>Restricted</option>
                                <option value='anyone'>Anyone with link</option>
                              </select>
                            </div>
                          </div>

                          {/* Copy link button */}
                          <div className='flex gap-2'>
                            <Button
                              onClick={copyShareableLink}
                              variant='outline'
                              className='flex-1 cursor-pointer'
                            >
                              <svg
                                className='w-4 h-4 mr-2'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                                />
                              </svg>
                              Copy link
                            </Button>
                            <Button
                              onClick={copyToClipboard}
                              className='flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer'
                            >
                              Copy chat text
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

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
                      onClick={handleEditToggle}
                      size='sm'
                      variant='outline'
                      className='text-xs cursor-pointer'
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Saving...' : editMode ? 'Done' : 'Edit'}
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
                      No messages to display
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
                              'rounded-lg p-3 shadow-sm',
                              isLeft
                                ? 'bg-background text-foreground'
                                : 'bg-primary/70 text-primary-foreground',
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
