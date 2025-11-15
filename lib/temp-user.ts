/**
 * Utility functions for managing temporary user IDs for unauthenticated users
 */

/**
 * Get or create a temporary user ID for unauthenticated users
 * This ID is stored in localStorage and persists across page reloads
 * Format: temp_${timestamp}_${uuid}
 */
export function getTempUserId(): string {
  // Check if temp user ID already exists in localStorage
  const existingTempUserId = localStorage.getItem('temp_user_id');

  if (existingTempUserId && existingTempUserId.startsWith('temp_')) {
    return existingTempUserId;
  }

  // Generate new temp user ID
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const tempUserId = `temp_${timestamp}_${uuid}`;

  // Save to localStorage
  localStorage.setItem('temp_user_id', tempUserId);

  return tempUserId;
}

/**
 * Clear the temporary user ID from localStorage
 * Useful when user signs in or signs out
 */
export function clearTempUserId(): void {
  localStorage.removeItem('temp_user_id');
}

/**
 * Check if a user ID is a temporary user ID
 */
export function isTempUserId(userId: string): boolean {
  return userId.startsWith('temp_');
}
