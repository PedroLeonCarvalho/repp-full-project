import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "repp_session";

function getAuthSecretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    "repp-fallback-development-secret-key-32-chars-minimum";
  return new TextEncoder().encode(secret);
}

const PUBLIC_PATHS = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static assets, next internal routes, and favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let isValidSession = false;

  if (sessionCookie) {
    try {
      const key = getAuthSecretKey();
      await jwtVerify(sessionCookie, key, {
        algorithms: ["HS256"],
      });
      isValidSession = true;
    } catch {
      isValidSession = false;
    }
  }

  // If unauthenticated and accessing protected route -> redirect to /login
  if (!isValidSession && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and accessing login or register -> redirect to /
  if (isValidSession && isPublicPath) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
