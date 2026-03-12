// proxy.ts
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

// **********************************************
// CWV FIX: Process Redirects ONLY ONCE at module load
// **********************************************
const redirectMap = redirects as Record<string, string>;

const filteredRedirects: Record<string, string> = {};

for (const [rawKey, rawTarget] of Object.entries(redirectMap)) {
  if (rawKey === "URL") continue;

  const cleanedKey = rawKey.replace(/\n/g, '').trim();

  let keyPathWithSearch: string;
  try {
    const parsed = new URL(cleanedKey);
    // CRITICAL FIX: Decode the dictionary keys immediately!
    keyPathWithSearch = decodeURIComponent(parsed.pathname + parsed.search);
  } catch (e) {
    keyPathWithSearch = decodeURIComponent(cleanedKey); 
  }

  const keyDecodedPathname = keyPathWithSearch.split('?')[0];

  const isProductUrl = keyDecodedPathname.match(/-\d+$/);
  const isVendorsListing = keyDecodedPathname.includes('/vendors-listing');
  const isCompare = keyDecodedPathname.includes('/compare/');
  const isWishlist = keyDecodedPathname.includes('/wishlist/');

  if (isProductUrl || isVendorsListing || isCompare || isWishlist) continue;

  let targetPath: string;
  try {
    const parsedTarget = new URL(rawTarget);
    targetPath = parsedTarget.pathname + parsedTarget.search;
  } catch (e) {
    targetPath = rawTarget;
  }

  filteredRedirects[keyPathWithSearch] = targetPath;
}
// **********************************************
// End CWV FIX
// **********************************************


export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  
  // CRITICAL FIX: Decode the incoming request path and search
  const decodedPathname = decodeURIComponent(pathname);
  const decodedSearch = decodeURIComponent(search);
  const fullUrl = request.url;

  // --- Dynamic Redirect Logic (High Priority) ---
  if (decodedPathname.includes('/vendors-listing')) {
    const newPath = decodedPathname.replace('/vendors-listing', '/vendor-listing');
    return NextResponse.redirect(new URL(newPath, fullUrl));
  }

  const productPathMatch = decodedPathname.match(/(.*\/)?([^/]+)-(\d+)$/);
  if (productPathMatch && !decodedPathname.startsWith('/product/')) {
    const [, , slug, id] = productPathMatch;
    const newPath = `/product/${slug}-${id}`;
    return NextResponse.redirect(new URL(newPath, fullUrl));
  }

  if (decodedPathname.startsWith('/compare/') && decodedPathname !== '/compare') {
    return NextResponse.redirect(new URL('/compare', fullUrl));
  }

  if (decodedPathname.includes('/wishlist/') && decodedPathname !== '/account/wishlist') {
    return NextResponse.redirect(new URL('/account/wishlist', fullUrl));
  }

  // --- Filtered Hardcoded Redirects ---
  // CRITICAL FIX: Use the decoded path and search to look up the redirect
  const lookupWithSearch = decodedPathname + decodedSearch;
  const redirectTarget = filteredRedirects[lookupWithSearch] || filteredRedirects[decodedPathname];

  if (redirectTarget) {
    return NextResponse.redirect(new URL(redirectTarget, fullUrl), 301);
  }

  // --- Authentication and Authorization Logic ---
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

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

  if (publicPaths.includes(pathname)) {
    if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/", fullUrl));
    }
    return NextResponse.next();
  }

  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    if (!isAuthenticated) {
      const response = NextResponse.redirect(new URL("/login", fullUrl));
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    if (userRole === ROLES.USER && (pathname.startsWith("/admin") || pathname.startsWith("/vendor"))) {
      return NextResponse.redirect(new URL("/", fullUrl));
    }

    if (userRole === ROLES.VENDOR && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/vendor/dashboard", fullUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.\\..).*)"],
};