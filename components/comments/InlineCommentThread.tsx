'use client';

import { useState } from 'react';
import { Comment } from '@/lib/realtime/interfaces/comment.interface';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Edit2, X } from 'lucide-react';
import { CommentInput } from './CommentInput';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface InlineCommentThreadProps {
  threadId: string;
  selectedText: string;
  comments: Comment[];
  onAddComment: (threadId: string, content: string) => Promise<void>;
  onEditComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onClose?: () => void;
  currentUserId?: string;
  isActive?: boolean;
}

export function InlineCommentThread({
  threadId,
  selectedText,
  comments,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onClose,
  currentUserId,
  isActive = false,
}: InlineCommentThreadProps) {
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleEdit = async (commentId: string, content: string) => {
    await onEditComment(commentId, content);
    setEditingCommentId(null);
  };

  return (
    <Card
      className={cn(
        'comment-thread-card p-4 space-y-3 transition-all',
        isActive && 'ring-2 ring-primary'
      )}
    >
      {/* Header with selected text */}
      <div className='flex items-start justify-between gap-2 pb-3 border-b'>
        <div className='flex-1'>
          <p className='text-xs text-muted-foreground mb-1'>Commenting on:</p>
          <p className='text-sm italic text-foreground/80'>"{selectedText}"</p>
        </div>
        {onClose && (
          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='h-6 w-6 shrink-0'
          >
            <X className='h-4 w-4' />
          </Button>
        )}
      </div>

      {/* Flat list of comments (no indentation for replies) */}
      <div className='space-y-3'>
        {comments.map((comment) => {
          const isOwnComment = currentUserId === comment.userId;
          const isEditing = editingCommentId === comment.id;

          return (
            <div key={comment.id} className='flex gap-2 group'>
              {/* User Avatar */}
              <div className='w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0'>
                {comment.userAvatar ? (
                  <img
                    src={comment.userAvatar}
                    alt={comment.userName}
                    className='w-7 h-7 rounded-full object-cover'
                  />
                ) : (
                  <span className='text-xs font-medium text-primary'>
                    {getUserInitials(comment.userName)}
                  </span>
                )}
              </div>

              {/* Comment Content */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-1'>
                  <span className='text-xs font-medium text-foreground'>
                    {comment.userName}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                {isEditing ? (
                  <div className='space-y-2'>
                    <CommentInput
                      onSubmit={(content) => handleEdit(comment.id, content)}
                      placeholder='Edit comment...'
                      autoFocus
                    />
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setEditingCommentId(null)}
                      className='h-7 text-xs'
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className='text-sm text-foreground whitespace-pre-wrap break-words'>
                      {comment.content}
                    </p>

                    {/* Actions - only show edit/delete for own comments */}
                    {isOwnComment && (
                      <div className='flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setEditingCommentId(comment.id)}
                          className='h-6 text-xs px-2'
                        >
                          <Edit2 className='h-3 w-3 mr-1' />
                          Edit
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => onDeleteComment(comment.id)}
                          className='h-6 text-xs px-2 text-destructive'
                        >
                          <Trash2 className='h-3 w-3 mr-1' />
                          Delete
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add new comment input */}
      <div className='pt-3 border-t'>
        <CommentInput
          onSubmit={(content) => onAddComment(threadId, content)}
          placeholder='Add a comment...'
        />
      </div>
    </Card>
  );
}
