import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { uploadToR2 } from '@/lib/r2-upload';
import prisma from '@/lib/prisma';
import { getUserTier, getTierLimits, canUploadAsset } from '@/lib/user-tiers';

// POST - Bulk upload assets for a chat
export async function POST(request: Request) {
  try {
    const incomingHeaders = await headers();
    const session = await auth.api.getSession({
      headers: new Headers(incomingHeaders),
    });

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const chatId = formData.get('chatId') as string;
    const messageId = formData.get('messageId') as string;
    const files = formData.getAll('files') as File[];

    if (!chatId || !messageId || files.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify chat ownership
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { userId: true },
    });

    if (!chat || chat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get user and check storage limits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { storageUsed: true, userTier: true },
    });

    const userTier = getUserTier(true, user?.userTier as 'FREE' | 'PRO' | undefined);
    const tierLimits = getTierLimits(userTier);

    // Check if user tier allows assets
    if (!tierLimits.canUploadAssets) {
      return NextResponse.json(
        { error: 'Asset uploads are not available for unregistered users', code: 'TIER_RESTRICTION' },
        { status: 403 }
      );
    }

    // Calculate total size of files to upload
    const totalUploadSize = files.reduce((sum, file) => sum + file.size, 0);
    const currentStorage = Number(user?.storageUsed || 0);

    // Check if upload would exceed storage limit
    if (!canUploadAsset(currentStorage, totalUploadSize, userTier)) {
      return NextResponse.json(
        {
          error: 'Storage limit exceeded',
          code: 'STORAGE_LIMIT',
          currentStorage,
          maxStorage: tierLimits.maxStorage
        },
        { status: 403 }
      );
    }

    // Upload files and create asset records
    const uploadedAssets = [];
    let totalUploadedSize = 0;

    for (const file of files) {
      try {
        // Upload to R2
        const fileUrl = await uploadToR2(file, 'chat-assets');

        // Create asset record
        const asset = await prisma.asset.create({
          data: {
            chatId,
            messageId,
            fileName: file.name,
            fileUrl,
            fileType: file.type,
            fileSize: file.size,
          },
        });

        uploadedAssets.push(asset);
        totalUploadedSize += file.size;
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }

    // Update user's storage usage
    if (totalUploadedSize > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          storageUsed: {
            increment: totalUploadedSize,
          },
        },
      });
    }

    return NextResponse.json({ assets: uploadedAssets }, { status: 200 });
  } catch (error) {
    console.error('Assets upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload assets' },
      { status: 500 }
    );
  }
}

// GET - Fetch assets for a chat
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId is required' },
        { status: 400 }
      );
    }

    const assets = await prisma.asset.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ assets }, { status: 200 });
  } catch (error) {
    console.error('Fetch assets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}
