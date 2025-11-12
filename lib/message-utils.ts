export interface Message {
  id: string;
  timestamp: string;
  sender: string;
  message: string;
  isLeft?: boolean;
}

/**
 * Generate a stable message ID using content hash + 4-digit random number
 * Uses last 4 digits of timestamp as random component for uniqueness
 */
export function generateStableMessageId(
  timestamp: string,
  sender: string,
  message: string
): string {
  const content = `${timestamp}|${sender}|${message}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const hashStr = Math.abs(hash).toString(36);

  // Use last 4 digits of timestamp as random component
  const random4Digit = timestamp.slice(-4);

  return `${hashStr}-${random4Digit}`;
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
      const timestamp = match[1].trim();
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
 * - Preserve IDs for messages that haven't changed
 * - Assign new IDs to new or edited messages
 * - Detect deleted messages
 */
export function reconcileMessages(
  oldMessages: Message[],
  newText: string,
  savedPositions?: { left: string[]; right: string[] } | null
): Message[] {
  // Parse the new text into messages (with new IDs)
  const newMessages = parseTextToMessages(newText, savedPositions);

  // Create a map of old messages by their content signature (timestamp|sender|message)
  const oldMessageMap = new Map<string, string>();
  oldMessages.forEach((msg) => {
    const signature = `${msg.timestamp}|${msg.sender}|${msg.message}`;
    oldMessageMap.set(signature, msg.id);
  });

  // For each new message, check if it matches an old message
  // If yes, preserve the old ID; if no, keep the new ID
  const reconciledMessages = newMessages.map((newMsg) => {
    const signature = `${newMsg.timestamp}|${newMsg.sender}|${newMsg.message}`;
    const oldId = oldMessageMap.get(signature);

    if (oldId) {
      // Message exists in old messages, preserve ID
      return {
        ...newMsg,
        id: oldId,
      };
    }

    // New message or edited message, keep new ID
    return newMsg;
  });

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
