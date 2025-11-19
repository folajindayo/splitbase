import { NextRequest, NextResponse } from "next/server";

export interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  ip?: string;
  userAgent?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  log(entry: LogEntry): void {
    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // In production, send to logging service
    console.log(
      `[${entry.timestamp}] ${entry.method} ${entry.url} - ${entry.status} (${entry.duration}ms)`
    );
  }

  getLogs(limit?: number): LogEntry[] {
    return limit ? this.logs.slice(-limit) : this.logs;
  }

  clear(): void {
    this.logs = [];
  }
}

export const logger = new Logger();

export async function loggingMiddleware(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");

  let response: NextResponse;
  let error: Error | null = null;

  try {
    response = await handler();
  } catch (err) {
    error = err as Error;
    response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  const duration = Date.now() - startTime;

  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    status: response.status,
    duration,
    ip: ip || undefined,
    userAgent: userAgent || undefined,
  };

  logger.log(logEntry);

  if (error) {
    console.error("Request error:", error);
  }

  return response;
}

