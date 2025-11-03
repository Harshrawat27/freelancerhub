import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

// PUT - Update chat sharing settings
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const incomingHeaders = await headers();
    const session = await auth.api.getSession({
      headers: new Headers(incomingHeaders),
    });

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized or user ID missing' },
        { status: 401 }
      );
    }

    const { isPublic, sharedWith } = body;

    // Check if chat exists and belongs to user
    const existingChat = await prisma.chat.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Update sharing settings
    const updatedChat = await prisma.chat.update({
      where: {
        id,
      },
      data: {
        isPublic: isPublic ?? false,
        sharedWith: sharedWith || null,
      },
    });

    return NextResponse.json(updatedChat, { status: 200 });
  } catch (error) {
    console.error('Error updating chat sharing:', error);
    return NextResponse.json(
      { error: 'Failed to update sharing settings' },
      { status: 500 }
    );
  }
}
