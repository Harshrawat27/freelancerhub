'use client';

import { Sidebar } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Paperclip } from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { parseTextToMessages, serializeMessages } from '@/lib/message-utils';
import {
  calculateTotalWords,
  trimMessagesToLimit,
  getUserTier,
  getTierLimits,
  getOrCreateTempUserId,
} from '@/lib/user-tiers';
import { WordLimitDialog, ChatLimitDialog } from '@/components/limits';
import { useSession } from '@/lib/auth-client';
import { canCreateChat } from '@/lib/user-tiers';

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
  const router = useRouter();
  const { data: session } = useSession();
  const [rawChat, setRawChat] = useState('');
  const [parsedMessages, setParsedMessages] = useState<Message[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [chatTitle, setChatTitle] = useState('');
  const [leftSenders, setLeftSenders] = useState<string[]>([]);
  const [rightSenders, setRightSenders] = useState<string[]>([]);
  const [nameMapping, setNameMapping] = useState<Record<string, string>>({});

  // Word limit dialog state
  const [showWordLimitDialog, setShowWordLimitDialog] = useState(false);
  const [currentWords, setCurrentWords] = useState(0);
  const [maxWords, setMaxWords] = useState(0);

  // Chat limit dialog state
  const [showChatLimitDialog, setShowChatLimitDialog] = useState(false);
  const [currentChats, setCurrentChats] = useState(0);
  const [maxChats, setMaxChats] = useState(0);

  // Handle chat migration from temp user to registered user on sign-in
  useEffect(() => {
    const migrateChatsIfNeeded = async () => {
      // Only proceed if user is authenticated
      if (!session?.user?.id) return;

      // Check if there's a temp user ID in localStorage
      const tempUserId = localStorage.getItem('tempUserId');
      if (!tempUserId || !tempUserId.startsWith('temp_')) return;

      try {
        const response = await fetch('/api/migrate-chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tempUserId }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.migratedCount > 0) {
            toast.success(
              `Successfully migrated ${data.migratedCount} chat${
                data.migratedCount > 1 ? 's' : ''
              } to your account!`
            );
          }
          // Remove temp user ID from localStorage after successful migration
          localStorage.removeItem('tempUserId');
        }
      } catch (error) {
        console.error('Error migrating chats:', error);
        // Don't show error to user - fail silently to avoid confusion
      }
    };

    migrateChatsIfNeeded();
  }, [session?.user?.id]);

  const saveChat = async () => {
    if (!rawChat.trim() || parsedMessages.length === 0) {
      toast.error('Please parse a chat first');
      return;
    }

    if (!chatTitle.trim()) {
      toast.error('Please enter a chat title');
      return;
    }

    // Check chat count limits before saving
    const isRegistered = !!session?.user;
    const userTier = getUserTier(
      isRegistered,
      (session?.user as any)?.userTier as 'FREE' | 'PRO' | undefined
    );
    const tierLimits = getTierLimits(userTier);

    // Get or create temp user ID if not authenticated
    const tempUserId = !session?.user ? getOrCreateTempUserId() : undefined;

    // Fetch current chat count
    try {
      const chatCountUrl = tempUserId
        ? `/api/chat?tempUserId=${tempUserId}`
        : '/api/chat';
      const response = await fetch(chatCountUrl);

      if (response.ok) {
        const chats = await response.json();
        const currentChatCount = chats.length;

        // Check if user can create more chats
        if (!canCreateChat(currentChatCount, userTier)) {
          setCurrentChats(currentChatCount);
          setMaxChats(tierLimits.maxChats);
          setShowChatLimitDialog(true);
          return; // Stop here, don't save
        }
      }
    } catch (error) {
      console.error('Error checking chat count:', error);
      // Continue anyway - don't block user if API fails
    }

    setIsSaving(true);

    try {
      // Serialize messages to JSON with stable IDs
      const messagesJson = serializeMessages(parsedMessages);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: chatTitle,
          rawText: messagesJson, // Save as JSON
          senderPositions: {
            left: leftSenders,
            right: rightSenders,
          },
          nameMapping,
          tempUserId, // Include temp user ID for unregistered users
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save chat');
      }

      const savedChat = await response.json();

      toast.success('Chat saved successfully!');

      // Redirect to the saved chat page
      router.push(`/chats/${savedChat.id}`);
    } catch (error) {
      console.error('Error saving chat:', error);
      toast.error('Failed to save chat');
    } finally {
      setIsSaving(false);
    }
  };

  // Convert website format to WhatsApp format
  const convertWebsiteToWhatsApp = (text: string): string => {
    const lines = text.split('\n');
    const timestampPattern = /^\d{1,2}\s+\w+,\s+\d{1,2}:\d{2}$/;
    const convertedMessages: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (timestampPattern.test(line)) {
        // Look backwards for the sender name (skip "Profile Image" and single letter initials)
        let sender = 'Unknown';
        for (let k = i - 1; k >= 0; k--) {
          const prevLine = lines[k].trim();
          // Skip empty lines, "Profile Image", and single uppercase letters (A-Z)
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

        const timestamp = line;

        // Collect message lines until we hit another name/timestamp pattern
        let message = '';
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim();

          // Stop if we hit a timestamp or profile image marker
          if (timestampPattern.test(nextLine) || nextLine === 'Profile Image') {
            break;
          }

          // If we hit a single uppercase letter, check if it's followed by a sender name/timestamp
          if (/^[A-Z]$/.test(nextLine)) {
            // Look ahead to see if there's a timestamp coming (within next 3 lines)
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

          // Skip empty lines, single letters, and file attachments
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

        if (message && sender && sender !== 'Profile Image') {
          // Convert to WhatsApp format: [timestamp] sender: message
          convertedMessages.push(`[${timestamp}] ${sender}: ${message.trim()}`);
        }
      }
    }

    return convertedMessages.length > 0 ? convertedMessages.join('\n') : text;
  };

  // Parse WhatsApp/Telegram/other chat formats
  const parseChat = (textToParse?: string) => {
    let chatText = textToParse ?? rawChat;

    if (!chatText.trim()) {
      toast.error('Please paste a chat first');
      return;
    }

    // Check if it's website format and convert to WhatsApp format
    const websiteTimestampPattern = /^\d{1,2}\s+\w+,\s+\d{1,2}:\d{2}$/m;
    if (websiteTimestampPattern.test(chatText)) {
      const convertedText = convertWebsiteToWhatsApp(chatText);
      chatText = convertedText;
      // Update rawChat with converted text so click-to-edit works
      setRawChat(convertedText);
    }

    // Use utility function to parse text to messages with stable IDs
    const messages = parseTextToMessages(chatText);

    if (messages.length === 0) {
      toast.error('Could not this parse chat format.');
      return;
    }

    // Check word limits based on user tier
    const isRegistered = !!session?.user;
    const userTier = getUserTier(
      isRegistered,
      (session?.user as any)?.userTier as 'FREE' | 'PRO' | undefined
    );
    const tierLimits = getTierLimits(userTier);

    // Calculate total words
    const totalWords = calculateTotalWords(messages);

    let finalMessages = messages;
    let wasTrimmed = false;

    // Check if we need to trim messages
    if (totalWords > tierLimits.maxWords) {
      finalMessages = trimMessagesToLimit(messages, tierLimits.maxWords);
      const trimmedWords = calculateTotalWords(finalMessages);

      // Show word limit dialog
      setCurrentWords(trimmedWords);
      setMaxWords(tierLimits.maxWords);
      setShowWordLimitDialog(true);
      wasTrimmed = true;
    }

    setParsedMessages(finalMessages);

    // Extract unique senders and auto-populate title and assignments
    const uniqueSenders = Array.from(
      new Set(finalMessages.map((msg) => msg.sender))
    );

    // Auto-generate title
    const autoTitle =
      uniqueSenders.length > 1
        ? `${uniqueSenders[0]} and ${uniqueSenders.length - 1} other${
            uniqueSenders.length > 2 ? 's' : ''
          }`
        : uniqueSenders[0] || 'Untitled Chat';
    setChatTitle(autoTitle);

    // Default assignment: first sender to right, rest to left
    if (uniqueSenders.length > 0) {
      setRightSenders([uniqueSenders[0]]);
      setLeftSenders(uniqueSenders.slice(1));
    }

    if (wasTrimmed) {
      toast.warning(
        `Parsed ${finalMessages.length} messages (trimmed to ${tierLimits.maxWords} words)`
      );
    } else {
      toast.success(`Parsed ${finalMessages.length} messages successfully!`);
    }
  };

  const clearChat = () => {
    setRawChat('');
    setParsedMessages([]);
    setEditMode(false);
    setSelectedMessage(null);
    setChatTitle('');
    setLeftSenders([]);
    setRightSenders([]);
    setNameMapping({});
    toast.success('Chat cleared');
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

    // Re-parse the chat to update messages with the updated text
    parseChat(updatedChat);

    toast.success(`Renamed "${originalName}" to "${newName}"`);
  };

  const handleMessageEdit = (id: string) => {
    if (!editMode) return;

    const clickedMessageIndex = parsedMessages.findIndex(
      (msg) => msg.id === id
    );
    if (clickedMessageIndex === -1 || !textareaRef.current) {
      return;
    }

    // Find the start index of ALL messages in the raw chat.
    // The order of these indices will correspond to the order in parsedMessages.
    const allMessageStartIndices = [];
    const lines = rawChat.split('\n');
    let cumulativeLength = 0;

    // Use the same regexes from the parsing utility to ensure we identify message starts correctly.
    const whatsappPattern =
      /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}:\d{2}\s*(?:am|pm))\]?\s*[-:–—]?\s*([^:]+?):\s*(.*)$/i;
    const telegramPattern =
      /^([^,]+?),\s*\[(\d{1,2}\s+\w{3}\s+\d{4}\s+at\s+\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM))\]:\s*(.*)$/i;
    const convertedTelegramMobilePattern =
      /^\[(\d{1,2}\s+\w{3},\s+\d{1,2}:\d{2})\]\s+([^:]+?):\s*(.*)$/i;
    // Regex for the new generic format's timestamp
    const genericFormatTimePattern = /^\d{1,2}:\d{2}\s+(?:AM|PM)$/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      let isMessageStart = false;

      // Check for standard bracketed formats on the current line
      if (
        trimmedLine.match(whatsappPattern) ||
        trimmedLine.match(telegramPattern) ||
        trimmedLine.match(convertedTelegramMobilePattern)
      ) {
        isMessageStart = true;
      }
      // Check for the new generic format (current line is sender, next is timestamp)
      else {
        const nextLine = lines[i + 1];
        if (
          trimmedLine &&
          nextLine &&
          genericFormatTimePattern.test(nextLine.trim())
        ) {
          isMessageStart = true;
        }
      }

      if (isMessageStart) {
        allMessageStartIndices.push(cumulativeLength);
      }

      cumulativeLength += line.length + 1; // +1 for newline
    }

    if (clickedMessageIndex >= allMessageStartIndices.length) {
      toast.error(
        'Could not find the message to edit. The parsed messages and raw text may be out of sync.'
      );
      return;
    }

    const messageStartIndex = allMessageStartIndices[clickedMessageIndex];
    const nextMessageStartIndex =
      allMessageStartIndices[clickedMessageIndex + 1];

    // The end of the message is the start of the next message, or the end of the whole text.
    const messageEndIndex =
      nextMessageStartIndex !== undefined
        ? nextMessageStartIndex
        : rawChat.length;

    // The selection should be from the start of our message to the start of the next, trimmed of trailing whitespace.
    const selectionEnd = messageEndIndex;
    const selectedText = rawChat.substring(messageStartIndex, selectionEnd);
    const trimmedSelection = selectedText.trimEnd();
    const finalEnd = messageStartIndex + trimmedSelection.length;

    // Focus textarea and select the message text
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(messageStartIndex, finalEnd);

    // Scroll to make the selection visible
    const lineHeight = parseInt(
      window.getComputedStyle(textareaRef.current).lineHeight
    );
    const linesBefore = rawChat
      .substring(0, messageStartIndex)
      .split('\n').length;
    textareaRef.current.scrollTop = (linesBefore - 1) * lineHeight;

    setSelectedMessage(id);
  };

  // const copyToClipboard = () => {
  //   const chatText = parsedMessages
  //     .map((msg) => {
  //       return `[${msg.timestamp}] ${msg.sender}: ${msg.message}`;
  //     })
  //     .join('\n');
  //   navigator.clipboard.writeText(chatText);
  //   toast.success('Chat text copied to clipboard!');
  // };

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

  const getSenderColor = (sender: string) => {
    if (rightSenders.includes(sender)) {
      return 'right';
    }
    return 'left';
  };

  const handleSignup = () => {
    router.push('/api/auth/signin');
  };

  const handleUpgrade = () => {
    // TODO: Implement upgrade flow to Pro plan
    toast.info('Upgrade to Pro feature coming soon!');
  };

  return (
    <div className='min-h-screen bg-background transition-colors duration-300'>
      <Sidebar />
      <main className='margin-left-right-side p-6 flex flex-col min-h-screen max-h-screen'>
        <Topbar pageName='Create Chats' />

        <div className='mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5 grow h-[calc(100vh-110px)]'>
          {/* Left Side - Input */}
          <div className='flex flex-col gap-4 overflow-auto hide-scrollbar'>
            {/* <div className='bg-secondary rounded-lg p-6 shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.01)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)] flex flex-col grow'> */}
            {/* <div className='bg-secondary rounded-lg flex flex-col grow'> */}
            <div className='rounded-lg flex flex-col grow px-1'>
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
                  'min-h-[200px] font-mono text-sm text-muted-foreground grow',
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
                  onClick={() => parseChat()}
                  className='flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer'
                >
                  Parse Chat
                </Button>
              </div>
            </div>

            {/* Title and Sender Assignment */}
            {parsedMessages.length > 0 && (
              // <div className='bg-secondary rounded-lg p-6 shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.01)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)]'>
              <div className='px-1'>
                {/* Title Input */}
                <div className='mb-4'>
                  <label className='text-sm font-medium text-foreground mb-2 block'>
                    Chat Title
                  </label>
                  <Input
                    value={chatTitle}
                    onChange={(e) => setChatTitle(e.target.value)}
                    placeholder='Enter chat title...'
                    className='w-full'
                  />
                </div>

                {/* Sender Assignment */}
                <div>
                  <label className='text-sm font-medium text-foreground mb-2 block'>
                    Assign Participants
                  </label>
                  <p className='text-xs text-muted-foreground mb-3'>
                    Click on names to move them between left and right sides
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
                              onClick={() => moveSenderToRight(sender)}
                              className='px-3 py-2 bg-muted rounded-md text-xs font-medium cursor-pointer hover:bg-muted/70 transition-colors flex items-center justify-between group'
                            >
                              <span>{sender}</span>
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
                              onClick={() => moveSenderToLeft(sender)}
                              className='px-3 py-2 bg-primary/20 rounded-md text-xs font-medium cursor-pointer hover:bg-primary/30 transition-colors flex items-center justify-between group'
                            >
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
                    Change participant names. Original name → New name
                  </p>

                  <div className='space-y-2'>
                    {[...leftSenders, ...rightSenders].map((sender, index) => {
                      const originalName =
                        Object.keys(nameMapping).find(
                          (key) => nameMapping[key] === sender
                        ) || sender;
                      const hasBeenRenamed =
                        nameMapping[originalName] !== undefined;

                      return (
                        <div
                          key={`rename-${index}-${sender}`}
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
                              key={`input-${index}-${sender}`}
                              defaultValue={sender}
                              onBlur={(e) => {
                                const newName = e.target.value.trim();
                                if (newName && newName !== sender) {
                                  renameSender(sender, newName);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                              className='text-xs h-8'
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
              <div className='p-4 border-b border-background flex items-center justify-between'>
                <h2 className='font-heading text-xl font-bold text-foreground'>
                  Chat Preview
                </h2>
                {parsedMessages.length > 0 && (
                  <div className='flex gap-2'>
                    <Button
                      onClick={saveChat}
                      size='sm'
                      disabled={isSaving}
                      className='text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer'
                    >
                      {isSaving ? 'Saving...' : 'Save'}
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
                              // 'rounded-lg p-3 shadow-sm transition-all duration-200',
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

                          {/* Disabled upload button with tooltip */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className='mt-2'>
                                <Button
                                  disabled
                                  variant='ghost'
                                  size='sm'
                                  className={cn(
                                    'w-full text-xs cursor-not-allowed opacity-50',
                                    isLeft
                                      ? 'hover:bg-muted'
                                      : 'hover:bg-primary-foreground/20'
                                  )}
                                >
                                  <Paperclip className='w-3 h-3 mr-1' />
                                  Attach Files
                                </Button>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Save chat first then you will be able to upload
                                assets
                              </p>
                            </TooltipContent>
                          </Tooltip>
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

      {/* Word Limit Dialog */}
      <WordLimitDialog
        open={showWordLimitDialog}
        onOpenChange={setShowWordLimitDialog}
        currentWords={currentWords}
        maxWords={maxWords}
        userType={session?.user ? 'FREE' : 'UNREGISTERED'}
        onSignup={handleSignup}
        onUpgrade={handleUpgrade}
      />

      {/* Chat Limit Dialog */}
      <ChatLimitDialog
        open={showChatLimitDialog}
        onOpenChange={setShowChatLimitDialog}
        currentChats={currentChats}
        maxChats={maxChats}
        userType={session?.user ? 'FREE' : 'UNREGISTERED'}
        onSignup={handleSignup}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}
