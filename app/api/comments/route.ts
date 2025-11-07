import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/comments?chatId=xxx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId is required' },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        chatId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('[API] Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/comments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      chatId,
      messageId,
      threadId,
      parentId,
      content,
      textSelection,
      userId,
      userName,
      userAvatar,
    } = body;

    // Validation
    if (!chatId || !messageId || !content || !userId || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        chatId,
        messageId,
        threadId: threadId || null,
        parentId: parentId || null,
        content,
        startOffset: textSelection?.startOffset || null,
        endOffset: textSelection?.endOffset || null,
        selectedText: textSelection?.selectedText || null,
        userId,
        userName,
        userAvatar: userAvatar || null,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
