/**
 * Environment Configuration
 * Type-safe environment variable access
 */

interface Env {
  // Node Environment
  NODE_ENV: "development" | "production" | "test";
  
  // App Configuration
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_API_URL: string;
  
  // Blockchain
  NEXT_PUBLIC_ETH_RPC_URL?: string;
  NEXT_PUBLIC_POLYGON_RPC_URL?: string;
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  
  // Feature Flags
  NEXT_PUBLIC_CUSTODY_ENABLED?: string;
  NEXT_PUBLIC_ANALYTICS_ENABLED?: string;
  NEXT_PUBLIC_NOTIFICATIONS_ENABLED?: string;
}

/**
 * Get environment variable with validation
 */
function getEnv<K extends keyof Env>(key: K, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value && !defaultValue) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    console.warn(`Missing environment variable: ${key}`);
    return "";
  }
  
  return value || defaultValue || "";
}

/**
 * Validate required environment variables
 */
export function validateEnv(): void {
  const required: Array<keyof Env> = [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];

  const missing = required.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0 && process.env.NODE_ENV === "production") {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

// Export typed environment access
export const env = {
  NODE_ENV: getEnv("NODE_ENV", "development") as Env["NODE_ENV"],
  NEXT_PUBLIC_APP_URL: getEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  NEXT_PUBLIC_API_URL: getEnv("NEXT_PUBLIC_API_URL", "/api"),
  NEXT_PUBLIC_ETH_RPC_URL: getEnv("NEXT_PUBLIC_ETH_RPC_URL"),
  NEXT_PUBLIC_POLYGON_RPC_URL: getEnv("NEXT_PUBLIC_POLYGON_RPC_URL"),
  NEXT_PUBLIC_SUPABASE_URL: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  NEXT_PUBLIC_CUSTODY_ENABLED: getEnv("NEXT_PUBLIC_CUSTODY_ENABLED"),
  NEXT_PUBLIC_ANALYTICS_ENABLED: getEnv("NEXT_PUBLIC_ANALYTICS_ENABLED"),
  NEXT_PUBLIC_NOTIFICATIONS_ENABLED: getEnv("NEXT_PUBLIC_NOTIFICATIONS_ENABLED"),
};

// Check if running in production
export const isProd = env.NODE_ENV === "production";
export const isDev = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";

