// src/proxy.ts
//
// Next.js 16 renamed `middleware.ts` to `proxy.ts` (same runtime, new file/export name).
// This only checks for the *presence* of the auth cookie so protected pages don't
// flash before redirecting to /login. It cannot validate the JWT (httpOnly, signed
// with a backend-only secret) — that verification happens via GET /api/me in
// AuthGuard, and every API call is authorized server-side regardless.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE_NAME = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? "hrms_auth";
const PUBLIC_PATHS = ["/login", "/unauthorized"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuthCookie = request.cookies.has(AUTH_COOKIE_NAME);
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!hasAuthCookie && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ?expired=1 is set by the API client after a failed refresh: the cookie is
  // present but the session is dead, so do not bounce back to /dashboard
  // (that caused a /login <-> /dashboard redirect loop).
  if (hasAuthCookie && pathname === "/login" && !request.nextUrl.searchParams.has("expired")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|images|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
