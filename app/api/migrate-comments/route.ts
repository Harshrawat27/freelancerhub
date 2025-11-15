import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - Migrate comments from anonymous user IDs to a registered user
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { anonymousIds } = body;

    // Validate the input
    if (
      !anonymousIds ||
      !Array.isArray(anonymousIds) ||
      anonymousIds.length === 0
    ) {
      return NextResponse.json(
        { error: 'Invalid or empty list of anonymous IDs' },
        { status: 400 }
      );
    }

    // Filter for valid-looking IDs to be safe
    const validIds = anonymousIds.filter(
      (id) => typeof id === 'string' && id.includes('_anon_user_')
    );

    if (validIds.length === 0) {
      return NextResponse.json(
        { message: 'No valid comments to migrate', migratedCount: 0 },
        { status: 200 }
      );
    }

    // Update all comments matching the anonymous IDs to the new user ID
    const result = await prisma.comment.updateMany({
      where: {
        userId: {
          in: validIds,
        },
      },
      data: {
        userId: session.user.id,
        // Also update the user name and avatar to the registered user's details
        userName: session.user.name,
        userAvatar: session.user.image,
      },
    });

    return NextResponse.json(
      {
        message: 'Comments migrated successfully',
        migratedCount: result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Comment migration error:', error);
    return NextResponse.json(
      { error: 'Failed to migrate comments' },
      { status: 500 }
    );
  }
}
