// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import axios from "axios";

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
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // ✅ Step 0: Handle old product redirect first
  if (!pathname.startsWith("/product")) {
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    const productPattern = /-\d+$/;

    if (lastSegment && productPattern.test(lastSegment)) {
      return NextResponse.redirect(new URL(`/product/${lastSegment}`, request.url));
    }
  }

  // ✅ Step 0.1: Handle old query param style product URLs
  if (pathname.startsWith("/product") && request.nextUrl.searchParams.has("id")) {
    const id = request.nextUrl.searchParams.get("id");
    const segments = pathname.split("/").filter(Boolean);

    // e.g. /product/manual-stacker -> "manual-stacker"
    const productSlug = segments[segments.length - 1];

    if (id && productSlug && !productSlug.endsWith(`-${id}`)) {
      return NextResponse.redirect(
        new URL(`/product/${productSlug}-${id}`, request.url)
      );
    }
  }


  // ✅ Step 1: Auth handling
  let isAuthenticated = false;
  let userRole: number | null = null;

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

  // ✅ Step 2: Public routes
  if (publicPaths.includes(pathname)) {
    if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // ✅ Step 3: Protected routes
  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    if (!isAuthenticated) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    if (userRole === ROLES.USER && (pathname.startsWith("/admin") || pathname.startsWith("/vendor"))) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (userRole === ROLES.VENDOR && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/vendor/dashboard", request.url));
    }
  }

  // ✅ Step 4: Default allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
