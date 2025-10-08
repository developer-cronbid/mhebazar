"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

/**
 * Canonical Component
 * Dynamically generates and inserts the <link rel="canonical" href="..."> tag.
 * Must be wrapped in <Suspense> in the RootLayout <head> to allow client-side
 * hooks (usePathname/useSearchParams) to resolve correctly.
 */
export default function Canonical() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Define the base production URL (MANDATORY).
  // Update this if your domain changes.
  const BASE_URL = "https://www.mhebazar.in"; 

  const canonicalUrl = useMemo(() => {
    // Start with the current path, defaulting to '/'
    let path = pathname || "/"; 
    
    // 1. Clean trailing slash: Remove '/' unless it's the root path.
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    // 2. Handle query parameters: Convert searchParams object to a query string.
    const query = searchParams ? searchParams.toString() : '';

    // 3. Construct the full path with or without query string.
    const fullPath = query ? `${path}?${query}` : path;
    
    // Return the final, complete canonical URL.
    return `${BASE_URL}${fullPath}`;
    
  }, [pathname, searchParams]);


  // 4. Render the canonical link tag.
  return (
    <link 
      rel="canonical" 
      href={canonicalUrl} 
      // Use a key to ensure React handles updates/replacements correctly.
      key="canonical-link" 
    />
  );
}
