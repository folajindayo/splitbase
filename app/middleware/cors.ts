import { NextRequest, NextResponse } from "next/server";

export function corsMiddleware(request: NextRequest, response: NextResponse): NextResponse {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["*"];
  const origin = request.headers.get("origin");

  if (allowedOrigins.includes("*") || (origin && allowedOrigins.includes(origin))) {
    response.headers.set("Access-Control-Allow-Origin", origin || "*");
  }

  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}

export function handleCorsPreFlight(request: NextRequest): NextResponse | null {
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    return corsMiddleware(request, response);
  }
  return null;
}

