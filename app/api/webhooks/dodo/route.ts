import { NextRequest, NextResponse } from 'next/server';
import { dodoClient } from '@/lib/dodo-payment';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const webhookId = req.headers.get('webhook-id');
    const webhookSignature = req.headers.get('webhook-signature');
    const webhookTimestamp = req.headers.get('webhook-timestamp');

    if (!webhookId || !webhookSignature || !webhookTimestamp) {
      console.error('Missing webhook headers');
      return new NextResponse('Missing webhook headers', { status: 400 });
    }

    // Verify webhook signature and parse event
    let event: any;
    try {
      event = dodoClient.webhooks.unwrap(body, {
        headers: {
          'webhook-id': webhookId,
          'webhook-signature': webhookSignature,
          'webhook-timestamp': webhookTimestamp,
        },
      });
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return new NextResponse('Invalid signature', { status: 401 });
    }

    // Extract event type - it's a property of the unwrapped event
    const eventType = (event as any).event_type || (event as any).type;
    const eventData = (event as any).data || event;

    console.log('Webhook event received:', eventType);

    // Handle payment succeeded event
    if (eventType === 'payment.succeeded') {
      const metadata = eventData.metadata;

      if (metadata && metadata.userId) {
        // Update user tier to PRO
        await prisma.user.update({
          where: { id: metadata.userId as string },
          data: { userTier: 'PRO' },
        });

        console.log(`User ${metadata.userId} upgraded to PRO`);
      } else {
        console.warn('No userId found in payment metadata');
      }
    }

    // Handle subscription events
    if (eventType === 'subscription.active') {
      const metadata = eventData.metadata;

      if (metadata && metadata.userId) {
        await prisma.user.update({
          where: { id: metadata.userId as string },
          data: { userTier: 'PRO' },
        });

        console.log(`User ${metadata.userId} subscription activated`);
      }
    }

    if (
      eventType === 'subscription.cancelled' ||
      eventType === 'subscription.expired'
    ) {
      const metadata = eventData.metadata;

      if (metadata && metadata.userId) {
        await prisma.user.update({
          where: { id: metadata.userId as string },
          data: { userTier: 'FREE' },
        });

        console.log(`User ${metadata.userId} downgraded to FREE`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Webhook handler error', { status: 500 });
  }
}
