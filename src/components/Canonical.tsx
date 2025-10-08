"use client";

import { usePathname, useSearchParams } from "next/navigation";

export default function Canonical() {
  const pathname = usePathname();
  // Using useSearchParams is problematic on 404 pages. 
  // We will try to access it, but wrap the call in a try/catch or assume no params on non-page routes.
  const searchParams = useSearchParams();

  // Define the base production URL.
  const BASE_URL = "https://www.mhebazar.in"; 

  // --- 1. Construct the Canonical URL ---

  // Handle URL path: Clean trailing slash if it exists AND the path is not just "/"
  let path = pathname; 
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  
  // Handle query parameters: Safely access searchParams
  // We check if searchParams exists and if it can be converted to a string.
  let query = '';
  try {
    if (searchParams) {
      query = searchParams.toString();
    }
  } catch (e) {
    // This catch handles the error that happens specifically on the /_not-found page, 
    // ensuring the component doesn't crash the entire head render.
    console.warn("Canonical component skipped query params due to rendering error.");
  }

  // Construct the final path
  const fullPath = query ? `${path}?${query}` : path;
  const canonicalUrl = `${BASE_URL}${fullPath}`;

  // --- 2. Render the Tag ---
  return (
    <link 
      rel="canonical" 
      href={canonicalUrl} 
      key="canonical-link" 
    />
  );
}
