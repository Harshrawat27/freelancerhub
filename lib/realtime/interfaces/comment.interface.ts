// Domain types - these NEVER change regardless of real-time provider
export interface Comment {
  id: string;
  chatId: string;
  messageId: string;
  threadId: string | null;
  parentId: string | null;
  content: string;
  textSelection?: {
    startOffset: number;
    endOffset: number;
    selectedText: string;
  };
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentThread {
  id: string;
  chatId: string;
  messageId: string;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommentInput {
  chatId: string;
  messageId: string;
  threadId?: string | null;
  parentId?: string | null;
  content: string;
  textSelection?: {
    startOffset: number;
    endOffset: number;
    selectedText: string;
  };
  userId: string;
  userName: string;
  userAvatar?: string;
}

export interface CreateThreadInput {
  chatId: string;
  messageId: string;
  startOffset: number;
  endOffset: number;
  selectedText: string;
}
