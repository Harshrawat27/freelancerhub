import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET() {
  const incomingHeaders = await headers();
  const session = await auth.api.getSession({
    headers: new Headers(incomingHeaders),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find all chats for the current user that have assets
    const chatsWithAssets = await prisma.chat.findMany({
      where: {
        userId: session.user.id,
        assets: {
          some: {}, // This ensures we only get chats that have at least one asset
        },
      },
      include: {
        assets: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // We can simplify the response structure if needed, but for now,
    // returning the full chat with nested assets is flexible.
    return NextResponse.json(chatsWithAssets);
  } catch (error) {
    console.error('Error fetching all assets:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
