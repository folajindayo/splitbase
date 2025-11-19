/**
 * Application configuration
 */

import { env } from "./env";
import { ROUTES, ERROR_MESSAGES, HTTP_STATUS } from "./constants";

export const config = {
  app: {
    name: "Splitbase",
    version: "1.0.0",
    environment: env.isDevelopment ? "development" : "production",
  },

  api: {
    baseUrl: env.apiUrl,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },

  supabase: {
    url: env.supabaseUrl,
    anonKey: env.supabaseKey,
  },

  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  },

  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
  },

  routes: ROUTES,
  errors: ERROR_MESSAGES,
  httpStatus: HTTP_STATUS,
} as const;

export type Config = typeof config;

