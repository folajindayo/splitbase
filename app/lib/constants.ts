/**
 * Application Constants
 * Centralized constants and configuration
 */

// Application metadata
export const APP_NAME = "SplitBase";
export const APP_DESCRIPTION = "Secure escrow and payment splitting platform";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://splitbase.app";
export const APP_VERSION = "2.0.0";

// Contact information
export const SUPPORT_EMAIL = "support@splitbase.app";
export const CONTACT_EMAIL = "contact@splitbase.app";

// Social media links
export const SOCIAL_LINKS = {
  twitter: "https://twitter.com/splitbase",
  github: "https://github.com/splitbase",
  discord: "https://discord.gg/splitbase",
};

// Network configuration
export const SUPPORTED_CHAINS = {
  BASE_MAINNET: 8453,
  BASE_SEPOLIA: 84532,
  ETHEREUM_MAINNET: 1,
  ETHEREUM_SEPOLIA: 11155111,
} as const;

export const DEFAULT_CHAIN_ID = SUPPORTED_CHAINS.BASE_SEPOLIA;

export const CHAIN_NAMES: Record<number, string> = {
  [SUPPORTED_CHAINS.BASE_MAINNET]: "Base",
  [SUPPORTED_CHAINS.BASE_SEPOLIA]: "Base Sepolia",
  [SUPPORTED_CHAINS.ETHEREUM_MAINNET]: "Ethereum",
  [SUPPORTED_CHAINS.ETHEREUM_SEPOLIA]: "Sepolia",
};

export const CHAIN_EXPLORERS: Record<number, string> = {
  [SUPPORTED_CHAINS.BASE_MAINNET]: "https://basescan.org",
  [SUPPORTED_CHAINS.BASE_SEPOLIA]: "https://sepolia.basescan.org",
  [SUPPORTED_CHAINS.ETHEREUM_MAINNET]: "https://etherscan.io",
  [SUPPORTED_CHAINS.ETHEREUM_SEPOLIA]: "https://sepolia.etherscan.io",
};

// RPC URLs
export const RPC_URLS: Record<number, string> = {
  [SUPPORTED_CHAINS.BASE_SEPOLIA]: "https://sepolia.base.org",
  [SUPPORTED_CHAINS.BASE_MAINNET]: "https://mainnet.base.org",
};

// Currency configuration
export const SUPPORTED_CURRENCIES = ["ETH", "USDC", "USDT", "DAI"] as const;
export const DEFAULT_CURRENCY = "ETH";

export const CURRENCY_DECIMALS: Record<string, number> = {
  ETH: 18,
  USDC: 6,
  USDT: 6,
  DAI: 18,
};

// Gas configuration
export const GAS_LIMITS = {
  TRANSFER: 21000,
  ESCROW_CREATE: 100000,
  ESCROW_RELEASE: 80000,
  ESCROW_REFUND: 80000,
  MILESTONE_RELEASE: 70000,
};

export const GAS_BUFFER_MULTIPLIER = 1.2; // 20% buffer

// Amount limits
export const AMOUNT_LIMITS = {
  MIN_ETH: 0.001,
  MAX_ETH: 100,
  MIN_USD: 1,
  MAX_USD: 500000,
};

// Escrow configuration
export const ESCROW_TYPES = {
  SIMPLE: "simple",
  TIME_LOCKED: "time_locked",
  MILESTONE: "milestone",
} as const;

export const ESCROW_STATUS = {
  PENDING: "pending",
  FUNDED: "funded",
  RELEASED: "released",
  DISPUTED: "disputed",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
} as const;

export const MAX_MILESTONES = 10;
export const MIN_MILESTONES = 2;

// Time configuration
export const TIME_LIMITS = {
  MIN_LOCK_DURATION: 1 * 60 * 60, // 1 hour in seconds
  MAX_LOCK_DURATION: 365 * 24 * 60 * 60, // 1 year in seconds
  AUTO_FUND_CHECK_INTERVAL: 10000, // 10 seconds
  POLLING_INTERVAL: 5000, // 5 seconds
};

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/gif", "application/pdf"],
  ALLOWED_EXTENSIONS: ["jpg", "jpeg", "png", "gif", "pdf"],
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
};

// Rate limiting
export const RATE_LIMITS = {
  API_GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  },
  API_AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
  },
  API_ESCROW_CREATE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
  },
};

// Cache TTL (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
};

// Local storage keys (already defined in localStorage.ts but repeated for reference)
export const STORAGE_KEYS = {
  USER_PREFERENCES: "splitbase_user_preferences",
  RECENT_ESCROWS: "splitbase_recent_escrows",
  DRAFT_ESCROW: "splitbase_draft_escrow",
  THEME: "splitbase_theme",
  LAST_WALLET: "splitbase_last_wallet",
} as const;

// Feature flags
export const FEATURES = {
  ESCROW_ENABLED: true,
  SPLITS_ENABLED: true,
  MILESTONES_ENABLED: true,
  TIME_LOCK_ENABLED: true,
  DISPUTES_ENABLED: true,
  EMAIL_NOTIFICATIONS: true,
  WEBHOOKS_ENABLED: true,
  ANALYTICS_ENABLED: true,
  DARK_MODE: false, // Disabled
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
} as const;

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "Please connect your wallet",
  INSUFFICIENT_FUNDS: "Insufficient funds",
  TRANSACTION_FAILED: "Transaction failed",
  NETWORK_ERROR: "Network error. Please try again",
  INVALID_ADDRESS: "Invalid wallet address",
  INVALID_AMOUNT: "Invalid amount",
  SERVER_ERROR: "Server error. Please try again later",
  NOT_AUTHORIZED: "You are not authorized to perform this action",
  ESCROW_NOT_FOUND: "Escrow not found",
  MILESTONE_NOT_FOUND: "Milestone not found",
};

// Success messages
export const SUCCESS_MESSAGES = {
  ESCROW_CREATED: "Escrow created successfully",
  FUNDS_RELEASED: "Funds released successfully",
  FUNDS_REFUNDED: "Funds refunded successfully",
  MILESTONE_COMPLETED: "Milestone completed successfully",
  DISPUTE_OPENED: "Dispute opened successfully",
  COPIED: "Copied to clipboard",
  SAVED: "Saved successfully",
};

// API endpoints
export const API_ROUTES = {
  ESCROW: {
    CREATE: "/api/escrow/create",
    GET: "/api/escrow/get",
    LIST: "/api/escrow/list",
    RELEASE: "/api/escrow/release-funds",
    REFUND: "/api/escrow/refund-funds",
    CHECK_BALANCE: "/api/escrow/check-balance",
    AUTO_FUND_CHECK: "/api/escrow/auto-fund-check",
    RELEASE_MILESTONE: "/api/escrow/release-milestone",
    CUSTODY_STATS: "/api/escrow/custody-stats",
    CUSTODY_TRANSACTIONS: "/api/escrow/custody-transactions",
    HEALTH: "/api/escrow/health",
    PROCESS_RETRIES: "/api/escrow/process-retries",
  },
  SYSTEM: {
    STATUS: "/api/system/status",
    HEALTH: "/api/health",
  },
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ETHEREUM_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  TRANSACTION_HASH: /^0x[a-fA-F0-9]{64}$/,
  ENS_DOMAIN: /^[a-zA-Z0-9-]+\.(eth|base\.eth)$/,
  URL: /^https?:\/\/.+/,
  PHONE: /^[\d\s\-\+\(\)]+$/,
};

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// Breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// Z-index layers
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  NOTIFICATION: 1080,
};

// Date formats
export const DATE_FORMATS = {
  SHORT: "MMM dd, yyyy",
  LONG: "MMMM dd, yyyy",
  WITH_TIME: "MMM dd, yyyy HH:mm",
  TIME_ONLY: "HH:mm",
  ISO: "yyyy-MM-dd",
};

// Number formats
export const NUMBER_FORMATS = {
  CRYPTO: { minimumFractionDigits: 2, maximumFractionDigits: 6 },
  CURRENCY: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  PERCENTAGE: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
};

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  SEARCH: "ctrl+k",
  NEW_ESCROW: "ctrl+n",
  DASHBOARD: "ctrl+d",
  HELP: "shift+?",
  CLOSE: "escape",
};

// External links
export const EXTERNAL_LINKS = {
  DOCS: "https://docs.splitbase.app",
  HELP: "https://help.splitbase.app",
  TERMS: "https://splitbase.app/terms",
  PRIVACY: "https://splitbase.app/privacy",
  STATUS: "https://status.splitbase.app",
};

// Development flags
export const IS_DEV = process.env.NODE_ENV === "development";
export const IS_PROD = process.env.NODE_ENV === "production";
export const IS_TEST = process.env.NODE_ENV === "test";

// API configuration
export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY_COUNT = 3;
export const API_RETRY_DELAY = 1000; // 1 second

// Security
export const ENCRYPTION_ALGORITHM = "aes-256-cbc";
export const PASSWORD_MIN_LENGTH = 8;
export const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

// Monitoring
export const MONITORING = {
  ERROR_RETENTION_DAYS: 30,
  PERFORMANCE_SAMPLE_RATE: 0.1, // 10%
  LOG_RETENTION_DAYS: 7,
};

export default {
  APP_NAME,
  APP_VERSION,
  SUPPORTED_CHAINS,
  DEFAULT_CHAIN_ID,
  ESCROW_TYPES,
  ESCROW_STATUS,
  FEATURES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
