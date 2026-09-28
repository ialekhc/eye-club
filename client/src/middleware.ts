import { NextResponse } from "next/server";

export function middleware() {
  const response = NextResponse.next();
  const isDev = process.env.NODE_ENV !== 'production';
  
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' blob: data: https://images.unsplash.com",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${isDev ? "'unsafe-eval'" : ""}`,
    "worker-src 'self' blob:",
    "connect-src 'self' https://storage.googleapis.com http://localhost:3001"
  ].join('; ') + ';';

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
