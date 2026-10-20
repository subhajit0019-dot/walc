import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "cursed_admin_session";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || "default_super_secret_auth_key_replace_in_env_32chars!";
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/base-exe")) {
    return NextResponse.redirect(new URL("/clients", request.url));
  }

  const isAdminPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/logs");

  const isAdminApi = pathname.startsWith("/api/admin");
  const isLoginPage = pathname === "/login";

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      const secret = getSecretKey();
      await jwtVerify(token, secret);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // Redirect to dashboard if logged in and trying to access /login
  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protect Admin UI pages
  if (isAdminPage && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect Admin API routes
  if (isAdminApi && !isAuthenticated) {
    return NextResponse.json(
      { error: "Unauthorized: Admin session required" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/base-exe/:path*",
    "/logs/:path*",
    "/login",
    "/api/admin/:path*",
  ],
};
