import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

// GET - Download an asset (proxied to avoid CORS)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const incomingHeaders = await headers();
    const session = await auth.api.getSession({
      headers: new Headers(incomingHeaders),
    });

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assetId } = await params;

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

    // Fetch the file from R2
    const fileResponse = await fetch(asset.fileUrl);

    if (!fileResponse.ok) {
      throw new Error('Failed to fetch file from storage');
    }

    const fileBlob = await fileResponse.blob();

    // Return the file with proper headers to trigger download
    return new NextResponse(fileBlob, {
      headers: {
        'Content-Type': asset.fileType,
        'Content-Disposition': `attachment; filename="${asset.fileName}"`,
        'Content-Length': asset.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error('Download asset error:', error);
    return NextResponse.json(
      { error: 'Failed to download asset' },
      { status: 500 }
    );
  }
}
