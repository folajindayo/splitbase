/**
 * Shared constants
 */

export const APP_NAME = "Splitbase";
export const APP_VERSION = "1.0.0";

export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY = 1000;

export const PAGINATION_DEFAULT_PAGE = 1;
export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;

export const DEBOUNCE_DELAY = 300;
export const THROTTLE_DELAY = 1000;

export const TOAST_DURATION = 3000;
export const TOAST_MAX_VISIBLE = 3;

export const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
export const CACHE_MAX_SIZE = 100;

export const DATE_FORMAT = "MMM DD, YYYY";
export const TIME_FORMAT = "HH:mm:ss";
export const DATETIME_FORMAT = "MMM DD, YYYY HH:mm";

export const STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  GENERIC: "Something went wrong. Please try again.",
  NETWORK: "Network error. Please check your connection.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION: "Please check your input and try again.",
} as const;

export const ROUTES = {
  HOME: "/",
  ESCROW: "/escrow",
  SPLITS: "/splits",
  CUSTODY: "/custody",
  PROFILE: "/profile",
} as const;

