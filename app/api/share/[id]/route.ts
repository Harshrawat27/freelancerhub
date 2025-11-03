import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

// GET - Get a shared chat (public or email-restricted)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get session (if user is logged in)
    const incomingHeaders = await headers();
    const session = await auth.api.getSession({
      headers: new Headers(incomingHeaders),
    });

    const userEmail = session?.user?.email;

    // Fetch the chat
    const chat = await prisma.chat.findUnique({
      where: { id },
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if chat is public
    if (chat.isPublic) {
      return NextResponse.json(chat, { status: 200 });
    }

    // Check if user has email-based access
    if (chat.sharedWith && userEmail) {
      const sharedWithArray = chat.sharedWith as Array<{
        email: string;
        permission: string;
      }>;
      const hasAccess = sharedWithArray.some(
        (user) => user.email === userEmail
      );

      if (hasAccess) {
        return NextResponse.json(chat, { status: 200 });
      }
    }

    // Check if user is the owner
    if (session?.user?.id === chat.userId) {
      return NextResponse.json(chat, { status: 200 });
    }

    // No access
    return NextResponse.json(
      { error: 'You do not have access to this chat' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error fetching shared chat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat' },
      { status: 500 }
    );
  }
}
