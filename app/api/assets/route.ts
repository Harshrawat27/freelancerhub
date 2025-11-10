import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { uploadToR2 } from '@/lib/r2-upload';
import prisma from '@/lib/prisma';

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

    // Upload files and create asset records
    const uploadedAssets = [];

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
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
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
