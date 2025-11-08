'use client';

import { Comment } from '@/lib/realtime/interfaces/comment.interface';
import { CommentItem } from './CommentItem';
import { CommentInput } from './CommentInput';
import { Card } from '@/components/ui/card';

interface CommentThreadProps {
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
  onEditComment?: (commentId: string, content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onReplyToComment?: (parentId: string, content: string) => Promise<void>;
  currentUserId?: string;
  threadTitle?: string;
}

export function CommentThread({
  comments,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onReplyToComment,
  currentUserId,
  threadTitle,
}: CommentThreadProps) {
  // Organize comments into a tree structure
  const topLevelComments = comments.filter((c) => !c.parentId);

  const getReplies = (parentId: string) => {
    return comments.filter((c) => c.parentId === parentId);
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    const replies = getReplies(comment.id);

    return (
      <div key={comment.id} className={depth > 0 ? 'ml-8 mt-3' : ''}>
        <CommentItem
          comment={comment}
          onEdit={onEditComment}
          onDelete={onDeleteComment}
          onReply={
            onReplyToComment
              ? (content) => onReplyToComment(comment.id, content)
              : undefined
          }
          currentUserId={currentUserId}
          showReplyButton={true} // Allow unlimited nesting
        />

        {/* Render replies */}
        {replies.length > 0 && (
          <div className='mt-3 space-y-3'>
            {replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className='p-4'>
      {threadTitle && (
        <h3 className='text-sm font-medium mb-4'>{threadTitle}</h3>
      )}

      {/* Comments List */}
      {topLevelComments.length > 0 && (
        <div className='space-y-4 mb-4'>
          {topLevelComments.map((comment) => renderComment(comment))}
        </div>
      )}

      {/* Add Comment Input */}
      <div className='mt-4 pt-4 border-t'>
        <CommentInput onSubmit={onAddComment} placeholder='Add a comment...' />
      </div>
    </Card>
  );
}
