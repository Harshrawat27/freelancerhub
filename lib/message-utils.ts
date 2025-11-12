export interface Message {
  id: string;
  timestamp: string;
  sender: string;
  message: string;
  isLeft?: boolean;
}

/**
 * Normalize timestamp to handle special characters
 * Replaces narrow no-break space (\u202f) and other whitespace with regular space
 */
function normalizeTimestamp(timestamp: string): string {
  // Replace all whitespace variants with regular space
  return timestamp.replace(/[\s\u202f\u00a0]/g, ' ').trim();
}

/**
 * Generate a unique message ID using content hash + 5-digit random suffix
 * Format: hash-random5
 * - hash: based on timestamp + sender + message (for some consistency)
 * - random5: cryptographically random 5-character suffix (ensures uniqueness)
 */
export function generateStableMessageId(
  timestamp: string,
  sender: string,
  message: string
): string {
  // Normalize timestamp to handle special characters
  const normalizedTimestamp = normalizeTimestamp(timestamp);

  // Generate hash from content for some consistency
  const content = `${normalizedTimestamp}|${sender}|${message}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const hashStr = Math.abs(hash).toString(36);

  // Generate a truly random 5-character suffix using crypto for uniqueness
  // This ensures no collisions even when same user sends multiple messages at exact same time
  let random5Char: string;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    // Use crypto.randomUUID if available (browser/modern Node)
    random5Char = crypto.randomUUID().replace(/-/g, '').substring(0, 5);
  } else {
    // Fallback to Math.random (less secure but works everywhere)
    random5Char = Math.random().toString(36).substring(2, 7);
  }

  return `${hashStr}-${random5Char}`;
}

/**
 * Parse WhatsApp/Telegram text format into structured messages with stable IDs
 * Supports formats like:
 * - [20/10/24, 10:30:45 pm] Name: Message
 * - 20/10/24, 10:30:45 pm - Name: Message
 */
export function parseTextToMessages(
  text: string,
  savedPositions?: { left: string[]; right: string[] } | null
): Message[] {
  if (!text.trim()) {
    return [];
  }

  const lines = text.split('\n');
  const messages: Message[] = [];
  let currentMessage: Message | null = null;

  // Regex patterns for different message formats
  const whatsappPattern =
    /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)\]?\s*[-:]?\s*([^:]+):\s*(.*)$/i;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const match = trimmedLine.match(whatsappPattern);

    if (match) {
      // Save previous message if exists
      if (currentMessage) {
        messages.push(currentMessage);
      }

      // Start new message
      const timestamp = normalizeTimestamp(match[1].trim());
      const sender = match[2].trim();
      const messageText = match[3].trim();

      const messageId = generateStableMessageId(timestamp, sender, messageText);

      currentMessage = {
        id: messageId,
        timestamp,
        sender,
        message: messageText,
      };
    } else if (currentMessage) {
      // Continue previous message (multiline)
      currentMessage.message += '\n' + trimmedLine;
    }
  }

  // Add last message
  if (currentMessage) {
    messages.push(currentMessage);
  }

  // Apply sender positions (left/right)
  if (savedPositions) {
    messages.forEach((msg) => {
      if (savedPositions.left.includes(msg.sender)) {
        msg.isLeft = true;
      } else if (savedPositions.right.includes(msg.sender)) {
        msg.isLeft = false;
      }
    });
  }

  return messages;
}

/**
 * Convert JSON messages back to text format for editing
 */
export function messagesToText(messages: Message[]): string {
  return messages
    .map((msg) => {
      const lines = msg.message.split('\n');
      const firstLine = `[${msg.timestamp}] ${msg.sender}: ${lines[0]}`;

      if (lines.length > 1) {
        return firstLine + '\n' + lines.slice(1).join('\n');
      }

      return firstLine;
    })
    .join('\n');
}

/**
 * Reconcile edited text with existing messages
 * Strategy:
 * 1. First pass: Match by exact content (timestamp + sender + message) - for unchanged messages
 * 2. Second pass: Match by position index with same timestamp+sender - for edited messages
 * 3. Third pass: Remaining new messages get new IDs - for newly added messages
 */
export function reconcileMessages(
  oldMessages: Message[],
  newText: string,
  savedPositions?: { left: string[]; right: string[] } | null
): Message[] {
  // Parse the new text into messages (with new IDs)
  const newMessages = parseTextToMessages(newText, savedPositions);

  // Create a map of old messages by exact content signature
  const oldMessagesByContent = new Map<string, Message>();
  oldMessages.forEach((msg) => {
    const contentSig = `${msg.timestamp}|${msg.sender}|${msg.message}`;
    oldMessagesByContent.set(contentSig, msg);
  });

  // Track which old messages have been matched
  const matchedOldMessages = new Set<Message>();

  // First pass: Match by exact content
  const reconciledMessages = newMessages.map((newMsg) => {
    const contentSig = `${newMsg.timestamp}|${newMsg.sender}|${newMsg.message}`;
    const exactMatch = oldMessagesByContent.get(contentSig);

    if (exactMatch && !matchedOldMessages.has(exactMatch)) {
      matchedOldMessages.add(exactMatch);
      return {
        ...newMsg,
        id: exactMatch.id,
      };
    }

    // No exact match, return as-is for now (will handle in second pass)
    return newMsg;
  });

  // Second pass: For messages without exact match, try position-based matching
  // This handles the case where message content was edited
  let oldMessageIndex = 0;
  for (let i = 0; i < reconciledMessages.length; i++) {
    const newMsg = reconciledMessages[i];

    // Check if this message already has a matched ID (from first pass)
    const contentSig = `${newMsg.timestamp}|${newMsg.sender}|${newMsg.message}`;
    const exactMatch = oldMessagesByContent.get(contentSig);
    if (exactMatch && matchedOldMessages.has(exactMatch)) {
      // Already matched in first pass, skip
      continue;
    }

    // Try to find an unmatched old message at a nearby position with same timestamp+sender
    // Look ahead in oldMessages for an unmatched message with same timestamp+sender
    while (oldMessageIndex < oldMessages.length) {
      const oldMsg = oldMessages[oldMessageIndex];

      if (matchedOldMessages.has(oldMsg)) {
        // This old message already matched, skip it
        oldMessageIndex++;
        continue;
      }

      // Check if timestamp and sender match
      if (
        oldMsg.timestamp === newMsg.timestamp &&
        oldMsg.sender === newMsg.sender
      ) {
        // Found an unmatched old message at same timestamp+sender position
        // This is likely an edited message
        matchedOldMessages.add(oldMsg);
        reconciledMessages[i] = {
          ...newMsg,
          id: oldMsg.id,
        };
        oldMessageIndex++;
        break;
      }

      // Different timestamp or sender, move to next old message
      oldMessageIndex++;
    }
  }

  return reconciledMessages;
}

/**
 * Serialize messages for Prisma Json type (no-op, returns as-is)
 * Kept for API compatibility
 */
export function serializeMessages(messages: Message[]): Message[] {
  return messages;
}

/**
 * Deserialize messages from Prisma Json type
 * Handles both array (new) and string (legacy) formats
 */
export function deserializeMessages(data: any): Message[] {
  // If it's already an array, return it
  if (Array.isArray(data)) {
    return data;
  }

  // If it's a string (legacy format), try to parse it
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error deserializing messages:', error);
      return [];
    }
  }

  return [];
}

/**
 * Check if stored data is JSON array format (new) or plain text (old)
 */
export function isJsonFormat(data: any): boolean {
  // New format: data is an array
  if (Array.isArray(data)) return true;

  // Legacy format: data is a string that looks like JSON
  if (typeof data === 'string') {
    const trimmed = data.trim();
    return trimmed.startsWith('[') && trimmed.endsWith(']');
  }

  return false;
}
