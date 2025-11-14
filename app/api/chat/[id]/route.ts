import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

// GET - Get a specific chat
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const incomingHeaders = await headers();
    const session = await auth.api.getSession({
      headers: new Headers(incomingHeaders),
    });

    // Get tempUserId from query params for unregistered users
    const { searchParams } = new URL(request.url);
    const tempUserId = searchParams.get('tempUserId');

    // Determine user ID: either from session or temp user ID
    let userId: string;
    if (session?.user?.id) {
      userId = session.user.id;
    } else if (tempUserId && tempUserId.startsWith('temp_')) {
      userId = tempUserId;
    } else {
      return NextResponse.json(
        { error: 'Unauthorized: No valid user ID or temp user ID provided' },
        { status: 401 }
      );
    }

    const chat = await prisma.chat.findUnique({
      where: {
        id,
        userId, // Ensure user can only access their own chats
      },
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(chat, { status: 200 });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat' },
      { status: 500 }
    );
  }
}

// PUT - Update a chat
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

    const { title, rawText, senderPositions, nameMapping, tempUserId } = body;

    // Determine user ID: either from session or temp user ID
    let userId: string;
    if (session?.user?.id) {
      userId = session.user.id;
    } else if (tempUserId && tempUserId.startsWith('temp_')) {
      userId = tempUserId;
    } else {
      return NextResponse.json(
        { error: 'Unauthorized: No valid user ID or temp user ID provided' },
        { status: 401 }
      );
    }

    if (!title && !rawText && !senderPositions && !nameMapping) {
      return NextResponse.json(
        { error: 'At least one field to update is required' },
        { status: 400 }
      );
    }

    // Check if chat exists and belongs to user
    const existingChat = await prisma.chat.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!existingChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Update the chat
    const updatedChat = await prisma.chat.update({
      where: {
        id,
      },
      data: {
        ...(title && { title }),
        ...(rawText && { rawText }),
        ...(senderPositions !== undefined && { senderPositions }),
        ...(nameMapping !== undefined && { nameMapping }),
      },
    });

    return NextResponse.json(updatedChat, { status: 200 });
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json(
      { error: 'Failed to update chat' },
      { status: 500 }
    );
  }
}
