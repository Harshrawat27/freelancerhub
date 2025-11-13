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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { emailSchema } from '@/lib/validations';
import {
  ChevronDown,
  Eye,
  FileText,
  Image as ImageIcon,
  X,
  Download,
  Paperclip,
  Link,
  ExternalLink,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { MessageAssetUpload } from '@/components/MessageAssetUpload';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  type Message as MessageType,
  parseTextToMessages,
  messagesToText,
  reconcileMessages,
  serializeMessages,
  deserializeMessages,
  isJsonFormat,
} from '@/lib/message-utils';

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
  const router = useRouter();
  const session = useSession();
  const [id, setId] = useState<string | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [rawChat, setRawChat] = useState('');
  const [parsedMessages, setParsedMessages] = useState<Message[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingShare, setIsSavingShare] = useState(false);
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
  const [assets, setAssets] = useState<
    Array<{
      id: string;
      messageId: string;
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
    }>
  >([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [pendingAssets, setPendingAssets] = useState<Record<string, File[]>>(
    {}
  );
  const [previousMessages, setPreviousMessages] = useState<Message[]>([]);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  // Check if the current user is the owner
  const isOwner = chat && session.data?.user?.id === chat.userId;

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
        setChatTitle(data.title);

        // Load sender positions and name mapping
        if (data.senderPositions) {
          setLeftSenders(data.senderPositions.left || []);
          setRightSenders(data.senderPositions.right || []);
        }
        if (data.nameMapping) {
          setNameMapping(data.nameMapping);
        }

        // Load share settings
        if (data.isPublic !== undefined) {
          setLinkAccess(data.isPublic ? 'anyone' : 'restricted');
        }
        if (data.sharedWith) {
          setSharedWith(data.sharedWith);
        }

        // Check if data is in JSON format or old text format
        if (isJsonFormat(data.rawText)) {
          // New JSON format - deserialize
          const messages = deserializeMessages(data.rawText);
          // Apply sender positions
          if (data.senderPositions) {
            messages.forEach((msg) => {
              if (data.senderPositions.left.includes(msg.sender)) {
                msg.isLeft = true;
              } else if (data.senderPositions.right.includes(msg.sender)) {
                msg.isLeft = false;
              }
            });
          }
          setParsedMessages(messages);
          // Set rawChat as text for editing
          setRawChat(messagesToText(messages));
        } else {
          // Old text format - parse as text
          setRawChat(data.rawText);
          parseChat(data.rawText, data.senderPositions);
        }
      } catch (error) {
        console.error('Error fetching chat:', error);
        toast.error('Failed to load chat');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChat();
  }, [id]);

  // Fetch assets
  useEffect(() => {
    if (!id) return;

    const fetchAssets = async () => {
      try {
        const response = await fetch(`/api/assets?chatId=${id}`);
        if (response.ok) {
          const data = await response.json();
          setAssets(data.assets || []);
        }
      } catch (error) {
        console.error('Error fetching assets:', error);
      }
    };

    fetchAssets();
  }, [id]);

  const addSharedUser = async () => {
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
    const updatedSharedWith = [
      ...sharedWith,
      { email: validEmail, permission: 'viewer' },
    ];
    setSharedWith(updatedSharedWith);
    setShareEmail('');

    // Save to database
    setIsSavingShare(true);
    try {
      const response = await fetch(`/api/chat/${id}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublic: linkAccess === 'anyone',
          sharedWith: updatedSharedWith,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');
      toast.success(`Shared with ${validEmail}`);
    } catch (error) {
      toast.error('Failed to share');
      setSharedWith(sharedWith); // Revert on error
    } finally {
      setIsSavingShare(false);
    }
  };

  const removeSharedUser = async (email: string) => {
    const updatedSharedWith = sharedWith.filter((u) => u.email !== email);
    setSharedWith(updatedSharedWith);

    // Save to database
    setIsSavingShare(true);
    try {
      const response = await fetch(`/api/chat/${id}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublic: linkAccess === 'anyone',
          sharedWith: updatedSharedWith.length > 0 ? updatedSharedWith : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');
      toast.success('Access removed');
    } catch (error) {
      toast.error('Failed to remove access');
      setSharedWith(sharedWith); // Revert on error
    } finally {
      setIsSavingShare(false);
    }
  };

  const updatePermission = (email: string, permission: string) => {
    setSharedWith(
      sharedWith.map((u) => (u.email === email ? { ...u, permission } : u))
    );
    // Note: This just updates locally, will be saved when dialog closes or link access changes
  };

  const saveShareSettings = async () => {
    if (!id) return;

    setIsSavingShare(true);

    try {
      const response = await fetch(`/api/chat/${id}/share`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublic: linkAccess === 'anyone',
          sharedWith: sharedWith.length > 0 ? sharedWith : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update share settings');
      }

      await response.json();
      toast.success('Share settings updated!');
    } catch (error) {
      console.error('Error saving share settings:', error);
      toast.error('Failed to update share settings');
    } finally {
      setIsSavingShare(false);
    }
  };

  const handleOpenUpload = (messageId: string) => {
    if (!editMode) return;
    setCurrentMessageId(messageId);
    setUploadDialogOpen(true);
  };

  const handleFilesAdded = (messageId: string, files: File[]) => {
    setPendingAssets((prev) => ({
      ...prev,
      [messageId]: files,
    }));
  };

  const uploadPendingAssets = async () => {
    if (!id || Object.keys(pendingAssets).length === 0) return;

    try {
      const uploadPromises = [];

      for (const [messageId, files] of Object.entries(pendingAssets)) {
        if (files.length > 0) {
          const formData = new FormData();
          formData.append('chatId', id);
          formData.append('messageId', messageId);
          files.forEach((file) => {
            formData.append('files', file);
          });

          uploadPromises.push(
            fetch('/api/assets', {
              method: 'POST',
              body: formData,
            })
          );
        }
      }

      if (uploadPromises.length > 0) {
        const results = await Promise.all(uploadPromises);

        // Fetch updated assets
        const response = await fetch(`/api/assets?chatId=${id}`);
        if (response.ok) {
          const data = await response.json();
          setAssets(data.assets || []);
        }

        setPendingAssets({});
        toast.success('Assets uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading assets:', error);
      toast.error('Failed to upload assets');
    }
  };

  const deleteAsset = async (assetId: string) => {
    if (!editMode) return;

    setDeletingAssetId(assetId);
    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete asset');
      }

      // Remove from local state
      setAssets((prev) => prev.filter((asset) => asset.id !== assetId));
      toast.success('File deleted');
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete file');
    } finally {
      setDeletingAssetId(null);
    }
  };

  // const downloadAsset = async (assetId: string, fileName: string) => {
  //   try {
  //     const response = await fetch(`/api/assets/${assetId}/download`);
  //     if (!response.ok) throw new Error('Failed to fetch file');

  //     const blob = await response.blob();
  //     const url = window.URL.createObjectURL(blob);
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.download = fileName;
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //     window.URL.revokeObjectURL(url);
  //   } catch (error) {
  //     console.error('Error downloading file:', error);
  //     toast.error('Failed to download file');
  //   }
  // };

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

  const removePendingFile = (messageId: string, fileName: string) => {
    setPendingAssets((prev) => ({
      ...prev,
      [messageId]: prev[messageId]?.filter((f) => f.name !== fileName) || [],
    }));
  };

  const copyShareableLink = () => {
    const link = `${window.location.origin}/share/${id}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  // Parse chat text (for backward compatibility with old text format)
  const parseChat = (
    text: string,
    savedPositions?: { left: string[]; right: string[] } | null
  ): Message[] => {
    if (!text.trim()) {
      setParsedMessages([]);
      return [];
    }

    // Use utility function to parse text to messages
    const messages = parseTextToMessages(text, savedPositions);
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

    return messages;
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
        // Upload pending assets first
        await uploadPendingAssets();

        // Store current messages before reconciliation
        const oldMessages = [...parsedMessages];

        // Reconcile messages to preserve IDs where content matches
        const reconciledMessages = reconcileMessages(oldMessages, rawChat, {
          left: leftSenders,
          right: rightSenders,
        });

        // Serialize messages to JSON
        const messagesJson = serializeMessages(reconciledMessages);

        const response = await fetch(`/api/chat/${id}`, {
          method: 'PUT',
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
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update chat');
        }

        const updatedChat = await response.json();
        setChat(updatedChat);

        // Update parsed messages with reconciled messages
        setParsedMessages(reconciledMessages);

        // Compare old and new message IDs to update assets
        const updates: Array<{ oldMessageId: string; newMessageId: string }> =
          [];

        // Create a map of old messages for efficient lookup
        const oldMsgMap = new Map(oldMessages.map((msg) => [msg.id, msg]));

        // Find messages whose IDs have changed
        reconciledMessages.forEach((newMsg) => {
          const signature = `${newMsg.timestamp}|${newMsg.sender}|${newMsg.message}`;

          // Find the old message with same content but different ID
          const oldMsg = oldMessages.find((om) => {
            const oldSignature = `${om.timestamp}|${om.sender}|${om.message}`;
            return oldSignature === signature && om.id !== newMsg.id;
          });

          if (oldMsg) {
            updates.push({
              oldMessageId: oldMsg.id,
              newMessageId: newMsg.id,
            });
          }
        });

        // Update asset messageIds if any changed
        if (updates.length > 0) {
          const updateResponse = await fetch('/api/assets/update-message-ids', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chatId: id,
              updates,
            }),
          });

          if (!updateResponse.ok) {
            console.error('Failed to update asset messageIds');
          }

          // Refresh assets to get updated data
          const assetsResponse = await fetch(`/api/assets?chatId=${id}`);
          if (assetsResponse.ok) {
            const data = await assetsResponse.json();
            setAssets(data.assets || []);
          }
        }

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
      // Entering edit mode - save current messages
      setPreviousMessages([...parsedMessages]);
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
        <main className='margin-left-right-side p-6 flex flex-col min-h-screen'>
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
        <main className='margin-left-right-side p-6 flex flex-col min-h-screen'>
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
      <main className='margin-left-right-side p-6 flex flex-col min-h-screen max-h-screen'>
        <Topbar
          pageName={chat.title}
          button={
            isOwner ? (
              <button
                onClick={() => router.push(`/share/${id}`)}
                className={cn(
                  'flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium',
                  'bg-secondary text-secondary-foreground',
                  'shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)]',
                  'hover:bg-secondary/80',
                  'transition-colors duration-200 cursor-pointer'
                )}
              >
                <Eye className='w-4 h-4' />
                Share Mode
              </button>
            ) : null
          }
        />

        <div className='mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 grow h-[calc(100vh-110px)]'>
          {/* Left Side - Input and Controls */}
          {/* <div className='flex flex-col gap-4 overflow-y-auto'> */}
          <div className='flex flex-col overflow-y-auto'>
            {/* Raw Chat Text */}
            {/* <div className='bg-secondary rounded-lg p-4 shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.01)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)] grow flex flex-col pb-0 rounded-b-none'> */}
            <div className='rounded-lg p-1 grow flex flex-col pb-0 rounded-b-none'>
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
              // <div className='bg-secondary rounded-lg p-4 shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.01)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)] pt-4 rounded-t-none'>
              <div className='rounded-lg p-1 pt-4 rounded-t-none'>
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
                        {/* Loading line at top */}
                        {isSavingShare && (
                          <div className='absolute top-0 left-0 right-0 h-1 bg-primary animate-pulse rounded-full' />
                        )}

                        <DialogHeader>
                          <DialogTitle className='font-heading text-xl'>
                            Share Chat
                          </DialogTitle>
                          <DialogDescription>
                            Share this chat with people via email or link
                          </DialogDescription>
                        </DialogHeader>

                        <div
                          className={cn(
                            'space-y-6 mt-4 transition-opacity duration-200',
                            isSavingShare && 'opacity-50 pointer-events-none'
                          )}
                        >
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
                              <DropdownMenu>
                                <DropdownMenuTrigger className='w-[150px] h-8 text-xs px-2 rounded-md border border-border bg-background hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer flex items-center justify-between'>
                                  <span>
                                    {linkAccess === 'restricted'
                                      ? 'Restricted'
                                      : 'Anyone with link'}
                                  </span>
                                  <ChevronDown className='w-3 h-3 text-muted-foreground' />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      const newAccess = 'restricted';
                                      setLinkAccess(newAccess);

                                      // Save to database
                                      setIsSavingShare(true);
                                      try {
                                        const response = await fetch(
                                          `/api/chat/${id}/share`,
                                          {
                                            method: 'PUT',
                                            headers: {
                                              'Content-Type':
                                                'application/json',
                                            },
                                            body: JSON.stringify({
                                              isPublic: false,
                                              sharedWith:
                                                sharedWith.length > 0
                                                  ? sharedWith
                                                  : null,
                                            }),
                                          }
                                        );

                                        if (!response.ok)
                                          throw new Error('Failed to update');
                                        toast.success('Link access updated!');
                                      } catch (error) {
                                        toast.error(
                                          'Failed to update link access'
                                        );
                                        setLinkAccess(linkAccess);
                                      } finally {
                                        setIsSavingShare(false);
                                      }
                                    }}
                                    className='cursor-pointer'
                                  >
                                    Restricted
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      const newAccess = 'anyone';
                                      setLinkAccess(newAccess);

                                      // Save to database
                                      setIsSavingShare(true);
                                      try {
                                        const response = await fetch(
                                          `/api/chat/${id}/share`,
                                          {
                                            method: 'PUT',
                                            headers: {
                                              'Content-Type':
                                                'application/json',
                                            },
                                            body: JSON.stringify({
                                              isPublic: true,
                                              sharedWith:
                                                sharedWith.length > 0
                                                  ? sharedWith
                                                  : null,
                                            }),
                                          }
                                        );

                                        if (!response.ok)
                                          throw new Error('Failed to update');
                                        toast.success('Link access updated!');
                                      } catch (error) {
                                        toast.error(
                                          'Failed to update link access'
                                        );
                                        setLinkAccess(linkAccess);
                                      } finally {
                                        setIsSavingShare(false);
                                      }
                                    }}
                                    className='cursor-pointer'
                                  >
                                    Anyone with link
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

                            {/* Display assets */}
                            {(assets.filter(
                              (asset) => asset.messageId === msg.id
                            ).length > 0 ||
                              (pendingAssets[msg.id] &&
                                pendingAssets[msg.id].length > 0)) && (
                              <div
                                className={cn(
                                  'mt-3 space-y-2',
                                  !editMode && 'opacity-100'
                                )}
                              >
                                {/* Existing assets */}
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
                                              {(asset.fileSize / 1024).toFixed(
                                                1
                                              )}{' '}
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
                                              {(asset.fileSize / 1024).toFixed(
                                                1
                                              )}{' '}
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
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <ExternalLink className='w-3 h-3' />
                                        </a>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // downloadAsset(
                                            //   asset.id,
                                            //   asset.fileName
                                            // );
                                            downloadAsset(
                                              asset.fileUrl,
                                              asset.fileName
                                            );
                                          }}
                                          className='hover:bg-background/20 rounded p-1 cursor-pointer'
                                        >
                                          <Download className='w-3 h-3' />
                                        </button>
                                        {isOwner && editMode && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteAsset(asset.id);
                                            }}
                                            disabled={
                                              deletingAssetId === asset.id
                                            }
                                            className='hover:bg-destructive/20 rounded p-1 cursor-pointer transition-colors disabled:cursor-not-allowed'
                                          >
                                            {deletingAssetId === asset.id ? (
                                              <Loader2 className='w-3 h-3 animate-spin' />
                                            ) : (
                                              <Trash2 className='w-3 h-3' />
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}

                                {/* Pending assets (not yet uploaded) */}
                                {pendingAssets[msg.id] &&
                                  pendingAssets[msg.id].length > 0 && (
                                    <>
                                      {pendingAssets[msg.id].map((file) => (
                                        <div
                                          key={file.name}
                                          className={cn(
                                            'flex items-center gap-2 p-2 rounded text-xs border border-dashed',
                                            isLeft
                                              ? 'bg-muted border-muted-foreground/30'
                                              : 'bg-primary-foreground/20 border-primary-foreground/30'
                                          )}
                                        >
                                          {file.type.startsWith('image/') ? (
                                            <ImageIcon className='w-4 h-4 shrink-0' />
                                          ) : (
                                            <FileText className='w-4 h-4 shrink-0' />
                                          )}
                                          <div className='flex-1 min-w-0 overflow-hidden'>
                                            <p className='truncate font-medium'>
                                              {file.name}
                                            </p>
                                            <p className='text-xs opacity-70'>
                                              {(file.size / 1024).toFixed(1)} KB
                                              (Pending)
                                            </p>
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removePendingFile(
                                                msg.id,
                                                file.name
                                              );
                                            }}
                                            className='hover:bg-destructive/20 rounded p-1 shrink-0'
                                          >
                                            <X className='w-3 h-3' />
                                          </button>
                                        </div>
                                      ))}
                                    </>
                                  )}
                              </div>
                            )}

                            {/* Upload button */}
                            {isOwner && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenUpload(msg.id);
                                      }}
                                      variant='ghost'
                                      size='sm'
                                      disabled={!editMode}
                                      className={cn(
                                        'mt-2 w-full text-xs',
                                        isLeft
                                          ? 'hover:bg-muted'
                                          : 'hover:bg-primary-foreground/20',
                                        !editMode &&
                                          'opacity-50 cursor-not-allowed'
                                      )}
                                    >
                                      <Paperclip className='w-3 h-3 mr-1' />
                                      {assets.filter(
                                        (a) => a.messageId === msg.id
                                      ).length > 0 ||
                                      (pendingAssets[msg.id] &&
                                        pendingAssets[msg.id].length > 0)
                                        ? 'Manage Files'
                                        : 'Attach Files'}
                                    </Button>
                                  </div>
                                </TooltipTrigger>
                                {!editMode && (
                                  <TooltipContent>
                                    <p>Click Edit button to change</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            )}
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

        {/* Asset Upload Dialog */}
        {currentMessageId && (
          <MessageAssetUpload
            messageId={currentMessageId}
            open={uploadDialogOpen}
            onOpenChange={setUploadDialogOpen}
            onFilesAdded={handleFilesAdded}
            existingFiles={pendingAssets[currentMessageId] || []}
          />
        )}
      </main>
    </div>
  );
}
