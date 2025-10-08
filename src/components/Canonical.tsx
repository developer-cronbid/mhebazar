"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

/**
 * Canonical Component
 * Generates and inserts the <link rel="canonical" href="..."> tag into the document's head.
 * This component is used in the RootLayout and is wrapped in <Suspense>
 * to allow client-side hooks like usePathname to function correctly within the head.
 * * NOTE: The BASE_URL must be set to your production domain.
 */
export default function Canonical() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Define the base production URL.
  // UPDATE THIS IF YOUR DOMAIN CHANGES
  const BASE_URL = "https://www.mhebazar.in"; 

  const canonicalUrl = useMemo(() => {
    // 1. Handle URL path: Clean trailing slash if it exists AND the path is not just "/"
    let path = pathname || "/"; 
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    // 2. Handle query parameters
    let query = searchParams ? searchParams.toString() : '';

    // 3. Construct the full URL
    const fullPath = query ? `${path}?${query}` : path;
    return `${BASE_URL}${fullPath}`;
    
  }, [pathname, searchParams]);


  // 4. Render the Tag
  // The 'key' attribute prevents React from warning about duplicate links on re-render.
  return (
    <link 
      rel="canonical" 
      href={canonicalUrl} 
      key="canonical-link" 
    />
  );
}
