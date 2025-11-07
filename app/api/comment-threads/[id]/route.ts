import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PATCH /api/comment-threads/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { resolved } = body;

    if (resolved === undefined) {
      return NextResponse.json(
        { error: 'resolved field is required' },
        { status: 400 }
      );
    }

    const thread = await prisma.commentThread.update({
      where: { id },
      data: {
        resolved,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(thread);
  } catch (error) {
    console.error('[API] Error updating comment thread:', error);
    return NextResponse.json(
      { error: 'Failed to update comment thread' },
      { status: 500 }
    );
  }
}

// DELETE /api/comment-threads/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id} = await params;

    await prisma.commentThread.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error deleting comment thread:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment thread' },
      { status: 500 }
    );
  }
}
