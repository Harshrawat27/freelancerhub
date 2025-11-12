/**
 * Script to fix asset message IDs that don't match current message IDs
 * This happens when messages were edited before the reconcileMessages fix
 */

import prisma from '../lib/prisma';
import { deserializeMessages, type Message } from '../lib/message-utils';

async function fixAssetMessageIds() {
  console.log('Starting asset message ID fix...\n');

  // Get all chats with assets
  const chats = await prisma.chat.findMany({
    include: {
      assets: true,
    },
  });

  let totalChatsProcessed = 0;
  let totalAssetsFixed = 0;

  for (const chat of chats) {
    if (chat.assets.length === 0) continue;

    console.log(`\nProcessing chat: ${chat.title} (${chat.id})`);
    console.log(`  Assets: ${chat.assets.length}`);

    // Deserialize messages from the chat
    const messages: Message[] = deserializeMessages(chat.rawText);

    if (messages.length === 0) {
      console.log('  ⚠️  No messages found in chat');
      continue;
    }

    // Create a map of old message IDs to new message IDs by matching position
    const messageMap = new Map<string, string>();

    // For each asset, try to find the matching message by extracting timestamp from the old message ID
    for (const asset of chat.assets) {
      // Try to find a message that matches this asset
      // Asset messageId format might be different due to special characters or regeneration
      // We need to find the message by looking for a message with a similar timestamp

      let matchedMessage: Message | null = null;

      // Strategy 1: Try exact match first
      matchedMessage = messages.find((m) => m.id === asset.messageId) || null;

      if (!matchedMessage) {
        // Strategy 2: Try to find by matching hash component (first part of ID)
        // Both old (hash-timestamp) and new (hash-random5) formats have hash as first part
        // If hash matches, it's likely the same message position
        const parts = asset.messageId.split('-');
        if (parts.length >= 2) {
          const hashComponent = parts[0]; // e.g., "xj71t6"

          // Find messages whose ID starts with the same hash
          const candidateMessages = messages.filter((m) =>
            m.id.startsWith(hashComponent + '-')
          );

          if (candidateMessages.length === 1) {
            // If only one message has this hash, it's likely the match
            matchedMessage = candidateMessages[0];
          } else if (candidateMessages.length > 1) {
            // Multiple matches - this shouldn't happen often, but if it does,
            // we can't safely determine which one, so skip
            console.log(
              `  ⚠️  Multiple candidates for asset ${asset.fileName} (${asset.messageId})`
            );
          }
        }
      }

      if (matchedMessage && matchedMessage.id !== asset.messageId) {
        console.log(
          `  ✓ Updating asset ${asset.fileName}: ${asset.messageId} → ${matchedMessage.id}`
        );

        await prisma.asset.update({
          where: { id: asset.id },
          data: { messageId: matchedMessage.id },
        });

        totalAssetsFixed++;
      } else if (!matchedMessage) {
        console.log(
          `  ⚠️  Could not find matching message for asset ${asset.fileName} (${asset.messageId})`
        );
      } else {
        console.log(`  ✓ Asset ${asset.fileName} already has correct ID`);
      }
    }

    totalChatsProcessed++;
  }

  console.log('\n=================================');
  console.log('Fix complete!');
  console.log(`Chats processed: ${totalChatsProcessed}`);
  console.log(`Assets fixed: ${totalAssetsFixed}`);
  console.log('=================================\n');
}

fixAssetMessageIds()
  .catch((error) => {
    console.error('Error fixing asset message IDs:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
