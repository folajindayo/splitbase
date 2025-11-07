/**
 * Local Storage Utilities
 * Safe localStorage with error handling and TypeScript support
 */

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    const test = "__localStorage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get item from localStorage with type safety
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (!isLocalStorageAvailable()) return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Set item in localStorage
 */
export function setLocalStorage<T>(key: string, value: T): boolean {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Remove item from localStorage
 */
export function removeLocalStorage(key: string): boolean {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Clear all localStorage
 */
export function clearLocalStorage(): boolean {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error("Error clearing localStorage:", error);
    return false;
  }
}

/**
 * Get all keys from localStorage
 */
export function getAllLocalStorageKeys(): string[] {
  if (!isLocalStorageAvailable()) return [];
  
  try {
    return Object.keys(localStorage);
  } catch (error) {
    console.error("Error getting localStorage keys:", error);
    return [];
  }
}

/**
 * Get storage size in bytes
 */
export function getLocalStorageSize(): number {
  if (!isLocalStorageAvailable()) return 0;
  
  try {
    let size = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length + key.length;
      }
    }
    return size;
  } catch (error) {
    console.error("Error calculating localStorage size:", error);
    return 0;
  }
}

/**
 * Check if key exists
 */
export function hasLocalStorageKey(key: string): boolean {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error(`Error checking localStorage key "${key}":`, error);
    return false;
  }
}

// Common storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: "splitbase_user_preferences",
  RECENT_ESCROWS: "splitbase_recent_escrows",
  DRAFT_ESCROW: "splitbase_draft_escrow",
  FILTER_STATE: "splitbase_filter_state",
  SORT_PREFERENCE: "splitbase_sort_preference",
  THEME: "splitbase_theme",
  LANGUAGE: "splitbase_language",
  WALLET_CONNECTED: "splitbase_wallet_connected",
  LAST_WALLET_ADDRESS: "splitbase_last_wallet_address",
  NOTIFICATION_SETTINGS: "splitbase_notification_settings",
  TUTORIAL_COMPLETED: "splitbase_tutorial_completed",
  LAST_VISIT: "splitbase_last_visit",
  SESSION_ID: "splitbase_session_id",
} as const;

/**
 * User preferences type
 */
export interface UserPreferences {
  emailNotifications: boolean;
  autoSaveEnabled: boolean;
  defaultCurrency: string;
  showTutorials: boolean;
  compactView: boolean;
}

/**
 * Get user preferences
 */
export function getUserPreferences(): UserPreferences {
  return getLocalStorage<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES, {
    emailNotifications: true,
    autoSaveEnabled: true,
    defaultCurrency: "ETH",
    showTutorials: true,
    compactView: false,
  });
}

/**
 * Set user preferences
 */
export function setUserPreferences(preferences: Partial<UserPreferences>): boolean {
  const current = getUserPreferences();
  return setLocalStorage(STORAGE_KEYS.USER_PREFERENCES, {
    ...current,
    ...preferences,
  });
}

/**
 * Recent escrows management
 */
export function getRecentEscrows(): string[] {
  return getLocalStorage<string[]>(STORAGE_KEYS.RECENT_ESCROWS, []);
}

export function addRecentEscrow(escrowId: string, maxItems: number = 10): boolean {
  const recent = getRecentEscrows();
  const filtered = recent.filter((id) => id !== escrowId);
  filtered.unshift(escrowId);
  
  return setLocalStorage(
    STORAGE_KEYS.RECENT_ESCROWS,
    filtered.slice(0, maxItems)
  );
}

export function clearRecentEscrows(): boolean {
  return removeLocalStorage(STORAGE_KEYS.RECENT_ESCROWS);
}

/**
 * Draft escrow management
 */
export function saveDraftEscrow(data: any): boolean {
  return setLocalStorage(STORAGE_KEYS.DRAFT_ESCROW, {
    data,
    timestamp: Date.now(),
  });
}

export function getDraftEscrow(): { data: any; timestamp: number } | null {
  const draft = getLocalStorage<{ data: any; timestamp: number } | null>(
    STORAGE_KEYS.DRAFT_ESCROW,
    null
  );
  
  // Clear draft if older than 24 hours
  if (draft && Date.now() - draft.timestamp > 24 * 60 * 60 * 1000) {
    removeDraftEscrow();
    return null;
  }
  
  return draft;
}

export function removeDraftEscrow(): boolean {
  return removeLocalStorage(STORAGE_KEYS.DRAFT_ESCROW);
}

/**
 * Last visit tracking
 */
export function updateLastVisit(): boolean {
  return setLocalStorage(STORAGE_KEYS.LAST_VISIT, Date.now());
}

export function getLastVisit(): number | null {
  return getLocalStorage<number | null>(STORAGE_KEYS.LAST_VISIT, null);
}

export function getDaysSinceLastVisit(): number | null {
  const lastVisit = getLastVisit();
  if (!lastVisit) return null;
  
  const days = Math.floor((Date.now() - lastVisit) / (1000 * 60 * 60 * 24));
  return days;
}

/**
 * Tutorial tracking
 */
export function markTutorialCompleted(tutorialId: string): boolean {
  const completed = getLocalStorage<string[]>(
    STORAGE_KEYS.TUTORIAL_COMPLETED,
    []
  );
  
  if (!completed.includes(tutorialId)) {
    completed.push(tutorialId);
    return setLocalStorage(STORAGE_KEYS.TUTORIAL_COMPLETED, completed);
  }
  
  return true;
}

export function isTutorialCompleted(tutorialId: string): boolean {
  const completed = getLocalStorage<string[]>(
    STORAGE_KEYS.TUTORIAL_COMPLETED,
    []
  );
  
  return completed.includes(tutorialId);
}

/**
 * Session management
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getOrCreateSessionId(): string {
  let sessionId = getLocalStorage<string | null>(STORAGE_KEYS.SESSION_ID, null);
  
  if (!sessionId) {
    sessionId = generateSessionId();
    setLocalStorage(STORAGE_KEYS.SESSION_ID, sessionId);
  }
  
  return sessionId;
}

/**
 * Clean up old data
 */
export function cleanupOldData(): void {
  // Remove draft if older than 24 hours
  getDraftEscrow();
  
  // Keep only last 50 recent escrows
  const recent = getRecentEscrows();
  if (recent.length > 50) {
    setLocalStorage(STORAGE_KEYS.RECENT_ESCROWS, recent.slice(0, 50));
  }
}

/**
 * Export all data
 */
export function exportLocalStorageData(): Record<string, any> {
  if (!isLocalStorageAvailable()) return {};
  
  const data: Record<string, any> = {};
  const keys = getAllLocalStorageKeys();
  
  keys.forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        data[key] = JSON.parse(value);
      }
    } catch {
      data[key] = localStorage.getItem(key);
    }
  });
  
  return data;
}

/**
 * Import data
 */
export function importLocalStorageData(data: Record<string, any>): boolean {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    Object.entries(data).forEach(([key, value]) => {
      setLocalStorage(key, value);
    });
    return true;
  } catch (error) {
    console.error("Error importing localStorage data:", error);
    return false;
  }
}

