import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

// PUT - Update messageIds for assets after message edits
export async function PUT(request: Request) {
  try {
    const incomingHeaders = await headers();
    const session = await auth.api.getSession({
      headers: new Headers(incomingHeaders),
    });

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, updates } = await request.json();

    if (!chatId || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify chat ownership
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { userId: true },
    });

    if (!chat || chat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update all messageIds in a transaction
    await prisma.$transaction(
      updates.map((update: { oldMessageId: string; newMessageId: string }) =>
        prisma.asset.updateMany({
          where: {
            chatId,
            messageId: update.oldMessageId,
          },
          data: {
            messageId: update.newMessageId,
          },
        })
      )
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Update asset messageIds error:', error);
    return NextResponse.json(
      { error: 'Failed to update asset messageIds' },
      { status: 500 }
    );
  }
}
