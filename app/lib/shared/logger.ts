/**
 * Logger Utility
 * Structured logging for development and production
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: any;
}

class Logger {
  private level: LogLevel = "info";
  private context: LogContext = {};

  constructor() {
    if (process.env.NODE_ENV === "development") {
      this.level = "debug";
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(this.context).length
      ? JSON.stringify(this.context)
      : "";
    const dataStr = data ? JSON.stringify(data) : "";

    return `[${timestamp}] ${level.toUpperCase()} ${message} ${contextStr} ${dataStr}`.trim();
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog("debug")) {
      console.debug(this.formatMessage("debug", message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage("info", message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, data));
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.shouldLog("error")) {
      const errorData = error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error;
      console.error(this.formatMessage("error", message, errorData));
    }
  }
}

export const logger = new Logger();
export { Logger };

