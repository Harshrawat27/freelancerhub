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

 * Convert Telegram mobile export format to WhatsApp format

 * Input format:

 * Initial (optional single letter)

 * Profile Image (optional)

 * Name

 *

 * Date, time

 * Message

 *

 * Output: [Date, time] Name: Message

 */

function convertTelegramMobileToWhatsApp(text: string): string {

  console.log('=== Starting Telegram Mobile Conversion ===');

  console.log('Input text:', text.substring(0, 200)); // Log first 200 chars



  const lines = text.split('\n');

  const result: string[] = [];

  let i = 0;



  while (i < lines.length) {

    const line = lines[i].trim();



    // Skip empty lines at the start

    if (!line) {

      i++;

      continue;

    }



    console.log(`\n--- Processing line ${i}: "${line}" ---`);



    // Check if this looks like a sender line (single letter or name)

    // Next few lines should be: [Profile Image], Name, empty, Date, Message

    let senderName = '';

    let startIndex = i;



    // Line 1: Could be initial (single letter) or full name

    const firstLine = lines[i].trim();



    // Check if next line exists

    if (i + 1 < lines.length) {

      const secondLine = lines[i + 1]?.trim() || '';



      // If first line is single letter/char and second line is not empty and not a date

      if (

        firstLine.length <= 2 &&

        secondLine &&

        !secondLine.match(/^\d{1,2}\s+\w{3},\s+\d{1,2}:\d{2}/)

      ) {

        console.log('  -> Detected single letter initial');

        // First line is initial, check if second line is "Profile Image" or name

        if (secondLine.toLowerCase().includes('profile image')) {

          console.log(

            '  -> Found "Profile Image", looking for name on line',

            i + 2

          );

          // Third line should be the name

          if (i + 2 < lines.length) {

            senderName = lines[i + 2].trim();

            console.log('  -> Sender name:', senderName);

            i += 3; // Skip initial, "Profile Image", and name

          } else {

            i++;

            continue;

          }

        } else {

          // Second line is the name

          senderName = secondLine;

          console.log('  -> Sender name (from second line):', senderName);

          i += 2; // Skip initial and name

        }

      } else {

        // First line is the full name (like "Me")

        senderName = firstLine;

        console.log('  -> Sender name (full name):', senderName);

        i += 1;

      }

    } else {

      i++;

      continue;

    }



    // Skip empty line

    console.log('  -> Skipping empty lines...');

    while (i < lines.length && !lines[i].trim()) {

      i++;

    }



    // Next line should be date/time

    if (i >= lines.length) {

      console.log('  -> Reached end of lines');

      break;

    }



    const dateTimeLine = lines[i].trim();

    console.log('  -> Checking date/time line:', dateTimeLine);

    const dateTimeMatch = dateTimeLine.match(

      /^(\d{1,2}\s+\w{3},\s+\d{1,2}:\d{2})$/

    );



    if (!dateTimeMatch) {

      // Not a valid date/time, skip this block

      console.log('  -> Not a valid date/time format, skipping');

      i++;

      continue;

    }



    const dateTime = dateTimeMatch[1];

    console.log('  -> Date/time:', dateTime);

    i++;



    // Next lines are the message (until we hit another sender pattern or end)

    const messageLines: string[] = [];



    while (i < lines.length) {

      const currentLine = lines[i];



      // Check if this is the start of a new message block

      // (single letter, or name followed by empty line and date)

      const isNewBlock =

        i + 2 < lines.length &&

        currentLine.trim() &&

        currentLine.trim().length > 0 &&

        !lines[i + 1]?.trim() && // Next line is empty

        lines[i + 2]?.trim().match(/^\d{1,2}\s+\w{3},\s+\d{1,2}:\d{2}/); // Line after that is date



      // Or if it's a single letter followed by name

      const isSingleLetterBlock =

        currentLine.trim().length <= 2 &&

        i + 1 < lines.length &&

        lines[i + 1]?.trim() &&

        !lines[i + 1]?.trim().match(/^\d{1,2}\s+\w{3},\s+\d{1,2}:\d{2}/);



      if (isNewBlock || isSingleLetterBlock) {

        break;

      }



      messageLines.push(currentLine);

      i++;

    }



    const message = messageLines.join('\n').trim();

    console.log('  -> Message text:', message);



    if (senderName && dateTime && message) {

      // Convert to WhatsApp format

      const formatted = `[${dateTime}] ${senderName}: ${message}`;

      console.log('  -> ✓ Added formatted message:', formatted);

      result.push(formatted);

    } else {

      console.log('  -> ✗ Skipping - missing data:', {

        senderName,

        dateTime,

        hasMessage: !!message,

      });

    }

  }



  console.log('\n=== Conversion Complete ===');

  console.log('Total messages converted:', result.length);

  console.log('Output:', result.join('\n'));



  return result.join('\n');

}



/**

 * Converts a generic "Sender, Timestamp, Message" format to WhatsApp format.

 * Input format:

 * Sender Name

 * 1:33 AM

 * Message content

 */

function convertGenericFormatToWhatsApp(text: string): string {

  const lines = text.split('\n');

  const convertedMessages: string[] = [];

  const timePattern = /^\d{1,2}:\d{2}\s+(?:AM|PM)$/i;



  let i = 0;

  while (i < lines.length) {

    const sender = lines[i]?.trim();

    const timestamp = lines[i + 1]?.trim();



    // Check if the current and next lines look like a sender/timestamp pair

    if (sender && timestamp && timePattern.test(timestamp)) {

      const messageLines: string[] = [];

      let j = i + 2;



      // Collect message lines until the next sender/timestamp pair

      while (j < lines.length) {

        const nextSender = lines[j]?.trim();

        const nextTimestamp = lines[j + 1]?.trim();



        if (nextSender && nextTimestamp && timePattern.test(nextTimestamp)) {

          // Found the start of the next message, so stop here.

          break;

        }

        messageLines.push(lines[j]);

        j++;

      }



      const message = messageLines.join('\n').trim();

      if (message) {

        convertedMessages.push(`[${timestamp}] ${sender}: ${message}`);

      }



      // Move the main loop index to the start of the next message

      i = j;

    } else {

      // Not a sender/timestamp pair, move to the next line

      i++;

    }

  }



  return convertedMessages.join('\n');

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



  let processedText = text;



  // --- Format Conversion Logic ---



  // 1. Check for the generic "Sender/Time/Message" format

  const genericFormatTimePattern = /^\d{1,2}:\d{2}\s+(?:AM|PM)$/m;

  const hasBrackets = /\[.*\]/.test(text);

  if (genericFormatTimePattern.test(text) && !hasBrackets) {

    const converted = convertGenericFormatToWhatsApp(text);

    if (converted && converted.trim()) {

      processedText = converted;

      console.log('Converted generic format to WhatsApp format:', converted);

    }

  } else {

    // 2. If not the generic format, check for Telegram mobile format

    const isTelegramMobile =

      /^\w+\s*\n\s*\n\d{1,2}\s+\w{3},\s+\d{1,2}:\d{2}/m.test(text) || // Pattern: Name\n\nDate

      /^[A-Z]\s*\n\w+\s*\n\s*\n\d{1,2}\s+\w{3},\s+\d{1,2}:\d{2}/m.test(text); // Pattern: Initial\nName\n\nDate



    const hasStandardFormat =

      (text.includes('[') && text.includes(':')) || // Has brackets and colon

      /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(text); // Date with slashes



    if (!hasStandardFormat || isTelegramMobile) {

      const converted = convertTelegramMobileToWhatsApp(text);

      if (converted && converted.trim()) {

        processedText = converted;

        console.log('Converted Telegram mobile format:', converted);

      }

    }

  }



  const lines = processedText.split('\n');

  const messages: Message[] = [];

  let currentMessage: Message | null = null;



  // Regex patterns for different message formats

  // WhatsApp format: [20/10/24, 10:30:45 pm] Name: Message

  const whatsappPattern =

    /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}:\d{2}\s*(?:am|pm))\]?\s*[-:–—]?\s*([^:]+?):\s*(.*)$/i;



  // Telegram format: Name, [20 Aug 2025 at 2:54:44 PM]:

  const telegramPattern =

    /^([^,]+?),\s*\[(\d{1,2}\s+\w{3}\s+\d{4}\s+at\s+\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM))\]:\s*(.*)$/i;



  // Converted Telegram mobile format: [09 Nov, 12:24] Name: Message

  const convertedTelegramMobilePattern =

    /^\[(\d{1,2}\s+\w{3},\s+\d{1,2}:\d{2})\]\s+([^:]+?):\s*(.*)$/i;



  for (const line of lines) {

    const trimmedLine = line.trim();

    if (!trimmedLine) continue;



    // Try different formats in order

    let match = trimmedLine.match(convertedTelegramMobilePattern);

    let formatType: 'telegram' | 'whatsapp' | 'mobile' = 'mobile';



    if (match) {

      formatType = 'mobile';

    } else {

      // Try Telegram desktop format

      match = trimmedLine.match(telegramPattern);

      if (match) {

        formatType = 'telegram';

      } else {

        // Try WhatsApp format (now more generic)

        match = trimmedLine.match(whatsappPattern);

        if (match) {

          formatType = 'whatsapp';

        }

      }

    }



    if (match) {

      // Save previous message if exists

      if (currentMessage) {

        messages.push(currentMessage);

      }



      // Extract timestamp, sender, message based on format

      let timestamp: string;

      let sender: string;

      let messageText: string;



      if (formatType === 'telegram') {

        // Telegram desktop format: match[1]=sender, match[2]=timestamp, match[3]=message

        sender = match[1].trim();

        timestamp = normalizeTimestamp(match[2].trim());

        messageText = match[3].trim();

      } else if (formatType === 'mobile') {

        // Converted mobile format: match[1]=timestamp, match[2]=sender, match[3]=message

        timestamp = normalizeTimestamp(match[1].trim());

        sender = match[2].trim();

        messageText = match[3].trim();

      } else {

        // WhatsApp format: match[1]=timestamp, match[2]=sender, match[3]=message

        timestamp = normalizeTimestamp(match[1].trim());

        sender = match[2].trim();

        messageText = match[3].trim();

      }



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
