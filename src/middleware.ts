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

  // --- Dynamic Redirect Logic (High Priority) ---

  // 1. Handle "vendors-listing" to "vendor-listing" redirect
  if (decodedPathname.includes('/vendors-listing')) {
    const newPath = decodedPathname.replace('/vendors-listing', '/vendor-listing');
    return NextResponse.redirect(new URL(newPath, fullUrl));
  }

  // 2. Handle old-style product URLs ending in -[id]
  const productPathMatch = decodedPathname.match(/(.*\/)?([^/]+)-(\d+)$/);
  // Redirect only if it's not already in the correct /product/ format
  if (productPathMatch && !decodedPathname.startsWith('/product/')) {
    const [fullMatch, categoryPath, slug, id] = productPathMatch;
    const newPath = `/product/${slug}-${id}`;
    return NextResponse.redirect(new URL(newPath, fullUrl));
  }
  
  // 3. Handle /compare/ cleanup (Redirects /compare/add/123 to /compare)
  if (decodedPathname.startsWith('/compare/')) {
    if (decodedPathname !== '/compare') { // Skip if it's already the canonical path
      return NextResponse.redirect(new URL('/compare', fullUrl));
    }
  }

  // 4. Handle /wishlist/ cleanup (Redirects /wishlist/add/123 to /account/wishlist)
  if (decodedPathname.includes('/wishlist/')) {
    // Check if the current path is NOT the new canonical path
    if (decodedPathname !== '/account/wishlist') {
      return NextResponse.redirect(new URL('/account/wishlist', fullUrl));
    }
  }

  // --- Filtered Hardcoded Redirects ---

  // The redirect map from your JSON file
  const redirectMap = redirects as Record<string, string>;
  
  // 1. First, create a URL-encoded version of the redirect map keys.
  // This ensures that improperly spaced/newline URLs match the correct key.
  const encodedRedirectMap = Object.keys(redirectMap).reduce((acc: Record<string, string>, key: string) => {
    if (key === "URL") { // Skip the header key
      acc[key] = redirectMap[key];
      return acc;
    }
    
    // Clean and encode the key: replace newlines with a space, then replace spaces with %20
    const cleanedKey = key.replace(/\n/g, ' ').replace(/\s/g, '%20');
    acc[cleanedKey] = redirectMap[key];
    return acc;
  }, {});


  // 2. Filter out any entries that are now covered by dynamic redirects.
  // We iterate over the newly created encoded map.
  const filteredRedirects = Object.keys(encodedRedirectMap).reduce((acc: Record<string, string>, key: string) => {
    
    // If the key is the header, just include it and skip checks
    if (key === "URL") {
      acc[key] = encodedRedirectMap[key];
      return acc;
    }
    
    // The key is already URL-encoded (with %20) here. 
    // We must decode it for regex matching on path segments 
    // (e.g., matching a full product name, which should be decoded).
    
    let keyPathname: string;
    try {
      keyPathname = new URL(key).pathname;
    } catch (e) {
      keyPathname = key;
    }

    // It's safer to decode for content-based matching logic (like checking for /vendors-listing)
    const keyDecodedPathname = decodeURIComponent(keyPathname);
    
    // Dynamic Product Pattern: ends with -[number] 
    const isProductUrl = keyDecodedPathname.match(/-\d+$/);
    
    // Dynamic Vendor Pattern: includes /vendors-listing
    const isVendorsListing = keyDecodedPathname.includes('/vendors-listing');
    
    // Dynamic Compare Pattern: includes /compare/
    const isCompare = keyDecodedPathname.includes('/compare/');
    
    // Dynamic Wishlist Pattern: includes /wishlist/
    const isWishlist = keyDecodedPathname.includes('/wishlist/');
    
    // Include the redirect only if it doesn't match any of the dynamic patterns
    // We use the already encoded key from the outer iteration
    if (!isProductUrl && !isVendorsListing && !isCompare && !isWishlist) {
      acc[key] = encodedRedirectMap[key]; // Use the encoded key and its corresponding value
    }
    return acc;
  }, {});

  // 3. Match the current request URL (which should also be normalized if necessary, 
  // but assuming it's already a clean string or fullUrl is the target lookup).
  // Note: For this to work correctly, the incoming 'fullUrl' string should also
  // be normalized to use '%20' instead of spaces/newlines if it was somehow malformed 
  // during the request handling, but for robust middleware matching, we assume 
  // Next.js/Browser handles the initial request path, but the lookup must use the
  // encoded format generated above.

  // Process the filtered hardcoded redirects
  // Assuming fullUrl here is the complete URL string passed to the lookup.
  const redirectTarget = filteredRedirects[fullUrl];
  if (redirectTarget) {
      return NextResponse.redirect(new URL(redirectTarget, fullUrl));
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
      // 2. Try refreshing token if access token fails
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