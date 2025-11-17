import { Liveblocks } from '@liveblocks/node';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Check if secret key exists
if (!process.env.LIVEBLOCKS_SECRET_KEY) {
  console.error('[Liveblocks] LIVEBLOCKS_SECRET_KEY is not set in environment variables!');
}

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || '',
});

/**
 * Liveblocks authentication endpoint
 * This endpoint authenticates users (both authenticated and temp users) with Liveblocks
 * Liveblocks will call this endpoint to get user info and track MAU
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body once
    const body = await request.json();
    const { room, tempUserId } = body;

    // Get session using better-auth
    const incomingHeaders = await headers();
    const session = await auth.api.getSession({
      headers: new Headers(incomingHeaders),
    });

    let userId: string;
    let userName: string;

    // Check if user is authenticated
    if (session?.user?.id) {
      userId = session.user.id;
      userName = session.user.name || 'User';
    } else {
      // User is not authenticated - check for temp user ID
      if (!tempUserId || !tempUserId.startsWith('temp_')) {
        return NextResponse.json(
          { error: 'Unauthorized: No valid user ID or temp user ID provided' },
          { status: 401 }
        );
      }

      userId = tempUserId;
      userName = 'Anonymous User';
    }

    // Prepare session for Liveblocks
    const liveblocksSession = liveblocks.prepareSession(userId, {
      userInfo: {
        name: userName,
      },
    });

    // Authorize access to the room
    // You can add room-specific permissions here if needed
    if (room) {
      liveblocksSession.allow(room, liveblocksSession.FULL_ACCESS);
    }

    // Authorize and return token
    const { status, body: responseBody } = await liveblocksSession.authorize();

    console.log('[Liveblocks Auth] Authorization successful, status:', status);
    console.log('[Liveblocks Auth] Response body type:', typeof responseBody);

    return new Response(responseBody, {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[Liveblocks Auth] Error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate with Liveblocks' },
      { status: 500 }
    );
  }
}
