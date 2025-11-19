/**
 * Crypto Utilities
 * Hashing and encryption helpers
 */

/**
 * Generate a random ID
 */
export function generateId(length = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Simple hash function
 */
export async function simpleHash(text: string): Promise<string> {
  if (typeof window === "undefined") {
    // Node.js environment
    const crypto = await import("crypto");
    return crypto.createHash("sha256").update(text).digest("hex");
  }

  // Browser environment
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Encode data to base64
 */
export function toBase64(data: string): string {
  if (typeof window === "undefined") {
    return Buffer.from(data).toString("base64");
  }
  return btoa(data);
}

/**
 * Decode base64 to string
 */
export function fromBase64(encoded: string): string {
  if (typeof window === "undefined") {
    return Buffer.from(encoded, "base64").toString();
  }
  return atob(encoded);
}

/**
 * Compare two strings securely (constant time)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

