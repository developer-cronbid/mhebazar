"use client";

import { usePathname, useSearchParams } from "next/navigation";

export default function Canonical() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Define the base production URL. 
  const BASE_URL = "https://www.mhebazar.in"; 

  // 2. Construct the clean path for the canonical URL.
  const query = searchParams.toString();
  
  // Start with the raw path
  let path = pathname; 
  
  // CRITICAL FIX: Clean trailing slash: Remove slash if it exists AND the path is not just "/"
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  
  // Construct the full path (path + query parameters)
  const fullPath = query ? `${path}?${query}` : path;

  // 3. Combine base URL and path
  const canonicalUrl = `${BASE_URL}${fullPath}`;

  // 4. Return the standard <link> element.
  return (
    <link 
      rel="canonical" 
      href={canonicalUrl} 
      key="canonical-link" 
      // The canonical URL should not contain trailing slashes unless it's the root.
    />
  );
}
