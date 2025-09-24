// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import axios from "axios";
import redirects from "./data/redirects.json";

const ROLES = {
  ADMIN: 1,
  VENDOR: 2,
  USER: 3,
};

const publicPaths = ["/", "/login", "/register", "/forgot-password"];
const protectedPrefixes = ["/admin", "/vendor/", "/account"];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_X_API_KEY;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const decodedPathname = decodeURIComponent(pathname);
  const fullUrl = request.url;

  // --- Redirect Logic ---

  // 1. Process hardcoded redirects first
  const redirectMap = redirects as Record<string, string>;
  const redirectTarget = redirectMap[fullUrl];
  if (redirectTarget) {
    return NextResponse.redirect(new URL(redirectTarget, fullUrl));
  }

  // 2. Handle dynamic redirects
  // Handle "vendors-listing" to "vendor-listing" redirect
  if (decodedPathname.includes('/vendors-listing')) {
    const newPath = decodedPathname.replace('/vendors-listing', '/vendor-listing');
    return NextResponse.redirect(new URL(newPath, fullUrl));
  }

  // Handle old-style product URLs ending in -[id]
  // This regex is more robust for paths with multiple segments
  const productPathMatch = decodedPathname.match(/(.*\/)?([^/]+)-(\d+)$/);
  // Apply the redirect only if it's not already in the correct /product/ format
  if (productPathMatch && !decodedPathname.startsWith('/product/')) {
    const [fullMatch, categoryPath, slug, id] = productPathMatch;
    const newPath = `/product/${slug}-${id}`;
    return NextResponse.redirect(new URL(newPath, fullUrl));
  }

  // --- Authentication and Authorization Logic ---

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  let isAuthenticated = false;
  let userRole: number | null = null;

  // 1. Try validating access token
  if (accessToken) {
    try {
      const userResponse = await axios.get(`${API_BASE_URL}/users/me/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-API-KEY": API_KEY,
        },
      });
      isAuthenticated = true;
      userRole = userResponse.data?.role?.id;
    } catch (err) {
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/token/refresh/`,
            { refresh: refreshToken },
            {
              headers: {
                "X-API-KEY": API_KEY,
                "Content-Type": "application/json",
              },
            }
          );

          const newAccessToken = refreshResponse.data?.access;
          const response = NextResponse.next();
          response.cookies.set("access_token", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60,
          });

          const userResponse = await axios.get(`${API_BASE_URL}/users/me/`, {
            headers: {
              Authorization: `Bearer ${newAccessToken}`,
              "X-API-KEY": API_KEY,
            },
          });
          isAuthenticated = true;
          userRole = userResponse.data?.role?.id;

          return response;
        } catch (refreshError) {
          console.error("Token refresh failed", refreshError);
        }
      }
    }
  }

  // 3. Public Routes: Allow all public paths
  if (publicPaths.includes(pathname)) {
    if (
      isAuthenticated &&
      (pathname === "/login" || pathname === "/register")
    ) {
      return NextResponse.redirect(new URL("/", fullUrl));
    }
    return NextResponse.next();
  }

  // 4. Protected Routes: Block unauthenticated users
  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    if (!isAuthenticated) {
      const response = NextResponse.redirect(new URL("/login", fullUrl));
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    // Role-based restrictions
    if (
      userRole === ROLES.USER &&
      (pathname.startsWith("/admin") || pathname.startsWith("/vendor"))
    ) {
      return NextResponse.redirect(new URL("/", fullUrl));
    }

    if (userRole === ROLES.VENDOR && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/vendor/dashboard", fullUrl));
    }
  }

  // 5. All other routes
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.\\..).*)"],
};