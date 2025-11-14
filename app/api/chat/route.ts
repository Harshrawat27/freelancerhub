import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

// GET - Get all chats for the current user (or temp user)
export async function GET(request: Request) {
  try {
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
      // Registered user
      userId = session.user.id;
    } else if (tempUserId && tempUserId.startsWith('temp_')) {
      // Unregistered user with temp ID
      userId = tempUserId;
    } else {
      return NextResponse.json(
        { error: 'Unauthorized: No valid user ID or temp user ID provided' },
        { status: 401 }
      );
    }

    const chats = await prisma.chat.findMany({
      where: {
        userId,
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

    const { title, rawText, senderPositions, nameMapping, tempUserId } = body;

    // Determine user ID: either from session or temp user ID
    let userId: string;
    if (session?.user?.id) {
      // Registered user
      userId = session.user.id;
    } else if (tempUserId && tempUserId.startsWith('temp_')) {
      // Unregistered user with temp ID
      userId = tempUserId;
    } else {
      return NextResponse.json(
        { error: 'Unauthorized: No valid user ID or temp user ID provided' },
        { status: 401 }
      );
    }

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
        userId,
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
