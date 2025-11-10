import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { deleteFromR2 } from '@/lib/r2-upload';

// DELETE - Delete an asset
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const incomingHeaders = await headers();
    const session = await auth.api.getSession({
      headers: new Headers(incomingHeaders),
    });

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assetId = params.id;

    // Find the asset and verify ownership
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        chat: {
          select: { userId: true },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    if (asset.chat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete from Cloudflare R2
    try {
      await deleteFromR2(asset.fileUrl);
    } catch (error) {
      console.error('Error deleting from R2:', error);
      // Continue with database deletion even if R2 deletion fails
    }

    // Delete from database
    await prisma.asset.delete({
      where: { id: assetId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete asset error:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}
