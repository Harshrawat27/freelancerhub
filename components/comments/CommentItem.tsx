'use client';

import { useState } from 'react';
import { Comment } from '@/lib/realtime/interfaces/comment.interface';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2 } from 'lucide-react';
import { CommentInput } from './CommentInput';
import { formatDistanceToNow } from 'date-fns';

interface CommentItemProps {
  comment: Comment;
  onEdit?: (commentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  onReply?: (content: string) => Promise<void>;
  currentUserId?: string;
  showReplyButton?: boolean;
}

export function CommentItem({
  comment,
  onEdit,
  onDelete,
  onReply,
  currentUserId,
  showReplyButton = false,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const isOwnComment = currentUserId === comment.userId;

  const handleEdit = async (content: string) => {
    if (onEdit) {
      await onEdit(comment.id, content);
      setIsEditing(false);
    }
  };

  const handleReply = async (content: string) => {
    if (onReply) {
      await onReply(content);
      setIsReplying(false);
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className='flex gap-3 group'>
      {/* User Avatar */}
      <div className='w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0'>
        {comment.userAvatar ? (
          <img
            src={comment.userAvatar}
            alt={comment.userName}
            className='w-8 h-8 rounded-full object-cover'
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
          <span className='text-sm font-medium text-foreground'>
            {comment.userName}
          </span>
          <span className='text-xs text-muted-foreground'>
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>

        {isEditing ? (
          <div className='mt-2'>
            <CommentInput
              onSubmit={handleEdit}
              placeholder='Edit comment...'
              autoFocus
            />
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setIsEditing(false)}
              className='mt-2'
            >
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <p className='text-sm text-foreground whitespace-pre-wrap break-words'>
              {comment.content}
            </p>

            {/* Actions */}
            <div className='flex items-center gap-2 mt-2'>
              {showReplyButton && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setIsReplying(!isReplying)}
                  className='h-7 text-xs'
                >
                  Reply
                </Button>
              )}

              {isOwnComment && onEdit && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setIsEditing(true)}
                  className='h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity'
                >
                  <Edit2 className='h-3 w-3 mr-1' />
                  Edit
                </Button>
              )}

              {isOwnComment && onDelete && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => onDelete(comment.id)}
                  className='h-7 text-xs text-destructive opacity-0 group-hover:opacity-100 transition-opacity'
                >
                  <Trash2 className='h-3 w-3 mr-1' />
                  Delete
                </Button>
              )}
            </div>

            {/* Reply Input */}
            {isReplying && onReply && (
              <div className='mt-3'>
                <CommentInput
                  onSubmit={handleReply}
                  placeholder='Write a reply...'
                  autoFocus
                />
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setIsReplying(false)}
                  className='mt-2'
                >
                  Cancel
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
