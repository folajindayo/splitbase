/**
 * Logging utility
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (this.isDevelopment) {
      const logFn = console[level] || console.log;
      if (data) {
        logFn(`[${level.toUpperCase()}] ${message}`, data);
      } else {
        logFn(`[${level.toUpperCase()}] ${message}`);
      }
    }
  }

  debug(message: string, data?: any): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: any): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: any): void {
    this.log("warn", message, data);
  }

  error(message: string, error?: any): void {
    this.log("error", message, error);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = new Logger();
