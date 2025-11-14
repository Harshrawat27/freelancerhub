/**
 * User tier system with limits and restrictions
 */

export type UserTierType = 'UNREGISTERED' | 'FREE' | 'PRO';

export interface TierLimits {
  maxWords: number; // Max words per chat
  maxChats: number; // Max number of chats
  maxStorage: number; // Max storage in bytes
  canSharePrivately: boolean; // Can share with specific emails
  canUploadAssets: boolean; // Can upload assets
}

export const TIER_LIMITS: Record<UserTierType, TierLimits> = {
  UNREGISTERED: {
    maxWords: 500,
    maxChats: 5,
    maxStorage: 0, // No assets allowed
    canSharePrivately: false,
    canUploadAssets: false,
  },
  FREE: {
    maxWords: 1000,
    maxChats: 10,
    maxStorage: 2 * 1024 * 1024 * 1024, // 2GB
    canSharePrivately: true,
    canUploadAssets: true,
  },
  PRO: {
    maxWords: Infinity,
    maxChats: Infinity,
    maxStorage: 50 * 1024 * 1024 * 1024, // 50GB
    canSharePrivately: true,
    canUploadAssets: true,
  },
};

/**
 * Get tier limits for a user
 */
export function getTierLimits(tier: UserTierType): TierLimits {
  return TIER_LIMITS[tier];
}

/**
 * Calculate total words in messages
 */
export function calculateTotalWords<T extends { message: string }>(
  messages: T[]
): number {
  return messages.reduce((total, msg) => {
    const words = msg.message.trim().split(/\s+/).filter((w) => w.length > 0);
    return total + words.length;
  }, 0);
}

/**
 * Trim messages to fit within word limit
 * Removes messages from the end until word count is within limit
 */
export function trimMessagesToLimit<T extends { message: string }>(
  messages: T[],
  maxWords: number
): T[] {
  if (maxWords === Infinity) return messages;

  let totalWords = calculateTotalWords(messages);
  let trimmedMessages = [...messages];

  while (totalWords > maxWords && trimmedMessages.length > 0) {
    // Remove the last message
    const removedMessage = trimmedMessages.pop();
    if (removedMessage) {
      const removedWords = removedMessage.message
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
      totalWords -= removedWords;
    }
  }

  return trimmedMessages;
}

/**
 * Format storage size for display
 */
export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes === Infinity) return 'Unlimited';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if user can create more chats
 */
export function canCreateChat(currentChatCount: number, tier: UserTierType): boolean {
  const limits = getTierLimits(tier);
  return currentChatCount < limits.maxChats;
}

/**
 * Check if user can upload asset
 */
export function canUploadAsset(
  currentStorageUsed: number,
  assetSize: number,
  tier: UserTierType
): boolean {
  const limits = getTierLimits(tier);

  if (!limits.canUploadAssets) return false;
  if (limits.maxStorage === Infinity) return true;

  return currentStorageUsed + assetSize <= limits.maxStorage;
}

/**
 * Generate temp user ID for unregistered users
 */
export function generateTempUserId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Check if user ID is temporary
 */
export function isTempUserId(userId: string): boolean {
  return userId.startsWith('temp_');
}

/**
 * Get or create temp user ID from localStorage
 */
export function getOrCreateTempUserId(): string {
  if (typeof window === 'undefined') return '';

  const TEMP_USER_KEY = 'temp_user_id';
  let tempId = localStorage.getItem(TEMP_USER_KEY);

  if (!tempId) {
    tempId = generateTempUserId();
    localStorage.setItem(TEMP_USER_KEY, tempId);
  }

  return tempId;
}

/**
 * Clear temp user ID from localStorage
 */
export function clearTempUserId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('temp_user_id');
}

/**
 * Get user tier based on registration status
 */
export function getUserTier(
  isRegistered: boolean,
  dbUserTier?: 'FREE' | 'PRO'
): UserTierType {
  if (!isRegistered) return 'UNREGISTERED';
  return dbUserTier || 'FREE';
}
