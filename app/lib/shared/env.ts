/**
 * Environment configuration utility
 */

export const env = {
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  
  get(key: string, defaultValue: string = ""): string {
    return process.env[key] || defaultValue;
  },
  
  require(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  },
  
  has(key: string): boolean {
    return key in process.env && process.env[key] !== undefined;
  },
} as const;

