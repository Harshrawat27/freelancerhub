import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

// POST - Migrate chats from temp user to registered user
export async function POST(request: Request) {
  try {
    const incomingHeaders = await headers();
    const session = await auth.api.getSession({
      headers: new Headers(incomingHeaders),
    });

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tempUserId } = body;

    // Validate temp user ID
    if (!tempUserId || !tempUserId.startsWith('temp_')) {
      return NextResponse.json(
        { error: 'Invalid temp user ID' },
        { status: 400 }
      );
    }

    // Find all chats belonging to the temp user
    const tempUserChats = await prisma.chat.findMany({
      where: {
        userId: tempUserId,
      },
      select: {
        id: true,
      },
    });

    if (tempUserChats.length === 0) {
      return NextResponse.json(
        { message: 'No chats to migrate', migratedCount: 0 },
        { status: 200 }
      );
    }

    // Update all chats to the new user ID
    const result = await prisma.chat.updateMany({
      where: {
        userId: tempUserId,
      },
      data: {
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        message: 'Chats migrated successfully',
        migratedCount: result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Chat migration error:', error);
    return NextResponse.json(
      { error: 'Failed to migrate chats' },
      { status: 500 }
    );
  }
}
