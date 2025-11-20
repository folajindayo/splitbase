/**
 * Logger Utility
 */

export const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SplitBase]', ...args);
    }
  },

  error: (...args: any[]) => {
    console.error('[SplitBase Error]', ...args);
  },

  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[SplitBase Warning]', ...args);
    }
  },
};

