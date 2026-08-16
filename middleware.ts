// middleware.ts  (project root, next to /app)
import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "token";

// Paths inside each section that must stay reachable WITHOUT a cookie
const PUBLIC_PATHS: Record<string, string[]> = {
  "/admin": ["/admin/login"],
  "/educators": ["/educators/login", "/educators/register"],
  "/students": ["/students/login"],
};

function loginPathFor(pathname: string): string | null {
  if (pathname.startsWith("/admin")) return "/admin/login";
  if (pathname.startsWith("/educators")) return "/educators/login";
  if (pathname.startsWith("/students")) return "/students/login";
  return null;
}

function isPublicPath(pathname: string): boolean {
  for (const [prefix, publicList] of Object.entries(PUBLIC_PATHS)) {
    if (pathname.startsWith(prefix)) {
      return publicList.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      );
    }
  }
  return true; // outside our three guarded sections — let it through
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const hasToken = req.cookies.has(AUTH_COOKIE);
  if (!hasToken) {
    const loginPath = loginPathFor(pathname);
    if (loginPath) {
      const url = req.nextUrl.clone();
      url.pathname = loginPath;
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/educators/:path*", "/students/:path*"],
};