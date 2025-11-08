'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextHighlight {
  startOffset: number;
  endOffset: number;
  threadId: string;
  isActive: boolean;
}

interface SelectableMessageProps {
  messageId: string;
  content: string;
  highlights: TextHighlight[];
  onTextSelected: (
    messageId: string,
    selectedText: string,
    startOffset: number,
    endOffset: number
  ) => void;
  onHighlightClick: (threadId: string) => void;
  className?: string;
}

export function SelectableMessage({
  messageId,
  content,
  highlights,
  onTextSelected,
  onHighlightClick,
  className,
}: SelectableMessageProps) {
  const [showCommentButton, setShowCommentButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState<{
    text: string;
    start: number;
    end: number;
  } | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  // Handle text selection
  const handleMouseUp = () => {
    const selectedText = window.getSelection();
    if (!selectedText || selectedText.isCollapsed) {
      setShowCommentButton(false);
      setSelection(null);
      return;
    }

    const range = selectedText.getRangeAt(0);
    const selectedString = selectedText.toString().trim();

    // Check if selection is within this message
    if (
      selectedString &&
      messageRef.current &&
      messageRef.current.contains(range.commonAncestorContainer)
    ) {
      // Calculate text offsets
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(messageRef.current);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preSelectionRange.toString().length;
      const endOffset = startOffset + selectedString.length;

      setSelection({
        text: selectedString,
        start: startOffset,
        end: endOffset,
      });

      // Position the comment button near the selection
      const rect = range.getBoundingClientRect();
      setButtonPosition({
        x: rect.right + 8,
        y: rect.top,
      });
      setShowCommentButton(true);
    }
  };

  const handleCommentButtonClick = () => {
    if (selection) {
      onTextSelected(messageId, selection.text, selection.start, selection.end);
      setShowCommentButton(false);
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  // Close button when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showCommentButton &&
        !(e.target as HTMLElement).closest('.comment-button')
      ) {
        setShowCommentButton(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCommentButton]);

  // Render content with highlights
  const renderHighlightedText = () => {
    if (highlights.length === 0) {
      return content;
    }

    // Sort highlights by startOffset
    const sortedHighlights = [...highlights].sort(
      (a, b) => a.startOffset - b.startOffset
    );

    const parts: React.ReactElement[] = [];
    let currentIndex = 0;

    sortedHighlights.forEach((highlight, idx) => {
      // Add text before highlight
      if (currentIndex < highlight.startOffset) {
        parts.push(
          <span key={`text-${idx}`}>
            {content.substring(currentIndex, highlight.startOffset)}
          </span>
        );
      }

      // Add highlighted text
      const highlightedText = content.substring(
        highlight.startOffset,
        highlight.endOffset
      );
      parts.push(
        <span
          key={`highlight-${idx}`}
          className={cn(
            'highlight-span cursor-pointer transition-opacity',
            highlight.isActive ? 'bg-green-500' : 'bg-green-500/50'
          )}
          onClick={() => onHighlightClick(highlight.threadId)}
        >
          {highlightedText}
        </span>
      );

      currentIndex = highlight.endOffset;
    });

    // Add remaining text
    if (currentIndex < content.length) {
      parts.push(<span key='text-end'>{content.substring(currentIndex)}</span>);
    }

    return parts;
  };

  return (
    <>
      <div
        ref={messageRef}
        className={cn('select-text whitespace-pre-wrap break-words', className)}
        onMouseUp={handleMouseUp}
      >
        {renderHighlightedText()}
      </div>

      {/* Comment button (positioned absolutely using portal-like positioning) */}
      {showCommentButton && (
        <div
          className='comment-button fixed z-50'
          style={{
            left: `${buttonPosition.x}px`,
            top: `${buttonPosition.y}px`,
          }}
        >
          <Button
            size='sm'
            onClick={handleCommentButtonClick}
            className='shadow-lg'
          >
            <MessageSquare className='h-4 w-4 mr-1' />
            Comment
          </Button>
        </div>
      )}
    </>
  );
}
