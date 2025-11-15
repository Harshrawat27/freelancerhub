import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chatId } = await params;

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      );
    }

    // Find all comments for the given chat that are from anonymous users
    const anonymousComments = await prisma.comment.findMany({
      where: {
        chatId: chatId,
        // An anonymous user is either the original temp creator or a designated anon commenter
        userId: {
          startsWith: 'temp_',
        },
      },
      distinct: ['userId'],
      select: {
        userId: true,
      },
    });

    // The user also specified a new format for anonymous commenters on shared chats,
    // which will be of the format `${chatId}_anon_user_`. We should account for that too.
    const anonCommentersOnShare = await prisma.comment.findMany({
      where: {
        chatId: chatId,
        userId: {
          startsWith: `${chatId}_anon_user_`,
        },
      },
      distinct: ['userId'],
      select: {
        userId: true,
      },
    });

    // Combine the distinct user IDs and create a Set to ensure uniqueness
    const allAnonymousIds = new Set([
      ...anonymousComments.map((c) => c.userId),
      ...anonCommentersOnShare.map((c) => c.userId),
    ]);

    return NextResponse.json({ count: allAnonymousIds.size });
  } catch (error) {
    console.error('Error counting anonymous commenters:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
