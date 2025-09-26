// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import axios from "axios";
// ASSUMPTION: 'redirects' is loaded from redirects.json
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
  // Redirect only if it's not already in the correct format or is a special case
  if (productPathMatch) {
    const [_, basePath, name, id] = productPathMatch;
    // Construct the expected new path without the -[id] at the end
    const expectedPath = `${basePath || ''}${name}`; 

    // Check if the expectedPath is *not* the same as the decodedPathname
    if (expectedPath !== decodedPathname) {
      // In a real application, you might add more checks here (e.g., check for existence of the new path)
      // For now, assume we redirect to the path without the trailing ID.
      // This logic seems incomplete based on the snippet, but I will keep your original logic structure.
    }
  }

  // --- Static Redirect Logic from redirects.json (NEW LOGIC ADDED HERE) ---

  // Normalize the decoded path for lookup in redirects.json
  // This step ensures any literal spaces (' ') are consistently encoded as '%20' for a reliable map lookup.
  const normalizedPathname = decodedPathname.replace(/ /g, '%20');

  if (normalizedPathname in redirects) {
    const destination = redirects[normalizedPathname as keyof typeof redirects];
    return NextResponse.redirect(new URL(destination, fullUrl));
  }

  // --- Authentication/Authorization Logic ---
  
  let isAuthenticated = false;
  let userRole = null;

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (accessToken) {
    try {
      const userResponse = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-api-key": API_KEY,
        },
      });
      isAuthenticated = true;
      userRole = userResponse.data?.role?.id;
    } catch (error) {
      // Handle expired access token
      if (refreshToken) {
        try {
          // Attempt to refresh token
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/auth/refresh-token`,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
                "x-api-key": API_KEY,
              },
            }
          );

          const newAccessToken = refreshResponse.data.accessToken;
          const newRefreshToken = refreshResponse.data.refreshToken;

          const response = NextResponse.next();
          response.cookies.set("access_token", newAccessToken, { httpOnly: true });
          response.cookies.set("refresh_token", newRefreshToken, { httpOnly: true });

          // Re-fetch user data with the new token
          const userResponse = await axios.get(`${API_BASE_URL}/users/me`, {
            headers: {
              Authorization: `Bearer ${newAccessToken}`,
              "x-api-key": API_KEY,
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

  return NextResponse.next();
}