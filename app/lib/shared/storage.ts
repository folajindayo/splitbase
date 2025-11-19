/**
 * Storage utilities
 * Helper functions for localStorage and sessionStorage
 */

/**
 * Check if storage is available
 */
function isStorageAvailable(type: "localStorage" | "sessionStorage"): boolean {
  try {
    const storage = window[type];
    const test = "__storage_test__";
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get item from storage
 */
export function getItem<T>(key: string, storage: Storage = localStorage): T | null {
  if (typeof window === "undefined") return null;

  try {
    const item = storage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error getting item "${key}" from storage:`, error);
    return null;
  }
}

/**
 * Set item in storage
 */
export function setItem<T>(
  key: string,
  value: T,
  storage: Storage = localStorage
): boolean {
  if (typeof window === "undefined") return false;

  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting item "${key}" in storage:`, error);
    return false;
  }
}

/**
 * Remove item from storage
 */
export function removeItem(key: string, storage: Storage = localStorage): boolean {
  if (typeof window === "undefined") return false;

  try {
    storage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing item "${key}" from storage:`, error);
    return false;
  }
}

/**
 * Clear all items from storage
 */
export function clear(storage: Storage = localStorage): boolean {
  if (typeof window === "undefined") return false;

  try {
    storage.clear();
    return true;
  } catch (error) {
    console.error("Error clearing storage:", error);
    return false;
  }
}

/**
 * Get all keys from storage
 */
export function getAllKeys(storage: Storage = localStorage): string[] {
  if (typeof window === "undefined") return [];

  try {
    return Object.keys(storage);
  } catch (error) {
    console.error("Error getting storage keys:", error);
    return [];
  }
}

/**
 * Check if key exists in storage
 */
export function hasItem(key: string, storage: Storage = localStorage): boolean {
  if (typeof window === "undefined") return false;

  try {
    return storage.getItem(key) !== null;
  } catch {
    return false;
  }
}

/**
 * Get storage size in bytes
 */
export function getStorageSize(storage: Storage = localStorage): number {
  if (typeof window === "undefined") return 0;

  try {
    let size = 0;
    for (const key in storage) {
      if (storage.hasOwnProperty(key)) {
        size += key.length + (storage.getItem(key)?.length || 0);
      }
    }
    return size;
  } catch {
    return 0;
  }
}

/**
 * Storage with expiry
 */
interface StorageItem<T> {
  value: T;
  expiry: number;
}

export function setItemWithExpiry<T>(
  key: string,
  value: T,
  ttlSeconds: number,
  storage: Storage = localStorage
): boolean {
  const now = new Date().getTime();
  const item: StorageItem<T> = {
    value,
    expiry: now + ttlSeconds * 1000,
  };

  return setItem(key, item, storage);
}

export function getItemWithExpiry<T>(
  key: string,
  storage: Storage = localStorage
): T | null {
  const item = getItem<StorageItem<T>>(key, storage);

  if (!item) return null;

  const now = new Date().getTime();

  if (now > item.expiry) {
    removeItem(key, storage);
    return null;
  }

  return item.value;
}

