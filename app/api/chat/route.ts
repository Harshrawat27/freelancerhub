import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

// GET - Get all chats for the current user
export async function GET() {
  try {
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

    const chats = await prisma.chat.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(chats, { status: 200 });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}

// POST - Create a new chat
export async function POST(request: Request) {
  try {
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

    const { title, rawText, senderPositions, nameMapping } = body;

    if (!title || !rawText) {
      return NextResponse.json(
        { error: 'Missing required fields: title and rawText are required' },
        { status: 400 }
      );
    }

    // Create the chat
    const chat = await prisma.chat.create({
      data: {
        title,
        rawText,
        senderPositions: senderPositions || null,
        nameMapping: nameMapping || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(chat, { status: 201 });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    );
  }
}
