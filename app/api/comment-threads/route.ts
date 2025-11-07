import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/comment-threads?chatId=xxx
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

    const threads = await prisma.commentThread.findMany({
      where: {
        chatId,
      },
      include: {
        comments: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(threads);
  } catch (error) {
    console.error('[API] Error fetching comment threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comment threads' },
      { status: 500 }
    );
  }
}

// POST /api/comment-threads
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, messageId, startOffset, endOffset, selectedText } = body;

    // Validation
    if (
      !chatId ||
      !messageId ||
      startOffset === undefined ||
      endOffset === undefined ||
      !selectedText
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create thread
    const thread = await prisma.commentThread.create({
      data: {
        chatId,
        messageId,
        startOffset,
        endOffset,
        selectedText,
      },
    });

    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating comment thread:', error);
    return NextResponse.json(
      { error: 'Failed to create comment thread' },
      { status: 500 }
    );
  }
}
