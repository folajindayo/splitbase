/**
 * Application Constants
 * Centralized configuration values
 */

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
export const API_TIMEOUT = 30000; // 30 seconds

// Blockchain Configuration
export const SUPPORTED_CHAINS = [
  {
    id: 1,
    name: "Ethereum",
    currency: "ETH",
    rpcUrl: process.env.NEXT_PUBLIC_ETH_RPC_URL,
  },
  {
    id: 137,
    name: "Polygon",
    currency: "MATIC",
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL,
  },
];

export const DEFAULT_CHAIN_ID = 1;

// Escrow Configuration
export const ESCROW_DEFAULTS = {
  MIN_AMOUNT: 0.001,
  MAX_AMOUNT: 1000,
  PLATFORM_FEE_PERCENTAGE: 0,
  GAS_ESTIMATE: 0.0005,
};

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Time Constants
export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;

// UI Constants
export const TOAST_DURATION = 5000;
export const MODAL_ANIMATION_DURATION = 200;
export const DEBOUNCE_DELAY = 300;

// Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: "splitbase_user_preferences",
  RECENT_SEARCHES: "splitbase_recent_searches",
  THEME: "splitbase_theme",
  WALLET_CONNECTED: "splitbase_wallet_connected",
};

// Feature Flags
export const FEATURES = {
  CUSTODY_ENABLED: process.env.NEXT_PUBLIC_CUSTODY_ENABLED === "true",
  ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true",
  NOTIFICATIONS_ENABLED: process.env.NEXT_PUBLIC_NOTIFICATIONS_ENABLED === "true",
};

// Validation Rules
export const VALIDATION = {
  MIN_WALLET_ADDRESS_LENGTH: 42,
  MAX_WALLET_ADDRESS_LENGTH: 42,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 500,
};

// Rate Limiting
export const RATE_LIMITS = {
  API_REQUESTS_PER_MINUTE: 60,
  AUTH_ATTEMPTS_PER_HOUR: 5,
  FILE_UPLOAD_MAX_SIZE: 10 * 1024 * 1024, // 10MB
};

// External Links
export const LINKS = {
  DOCUMENTATION: "https://docs.splitbase.io",
  SUPPORT: "https://support.splitbase.io",
  GITHUB: "https://github.com/splitbase",
  TWITTER: "https://twitter.com/splitbase",
};

