// src/components/BlogCarousel.tsx (FIXED)
import React from 'react';
import _BlogCarouselClient from './BlogCarouselClient';

// Define the structure of a blog post based on your API response
interface BlogPost {
  id: number;
  blog_title: string;
  image1?: string | null;
  blog_url: string;
  blog_category_name?: string | null;
  author_name?: string | null;
  created_at?: string | null;
  preview_description?: string | null;
  description1?: string | null;
}

export async function BlogCarousel() {
  let blogs: BlogPost[] = [];
  let error: string | null = null;
  let data: any = null;

  try {
    // 🚀 STABLE FETCH: Use standard fetch with an absolute public URL.
    // This is the most reliable method for build-time data fetching.
    const res = await fetch('https://api.mhebazar.in/api/blogs/?limit=3', { 
        // Revalidate is good for performance and fresh data
        next: { revalidate: 300 } 
    });
    
    if (!res.ok) {
        // Throw a standard error if the HTTP status is not 200-299
        throw new Error(`Failed to fetch blogs: HTTP status ${res.status}`);
    }
    
    data = await res.json();

    // If server sends paginated shape, extract results
    if (data && !Array.isArray(data) && Array.isArray(data.results)) {
      data = data.results;
    }

    if (Array.isArray(data)) {
      // Ensure we send the latest three blogs (sorted by created_at desc)
      blogs = data
        .slice()
        .sort((a: BlogPost, b: BlogPost) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        })
        .slice(0, 3);
    } else {
      throw new Error("Unexpected API response format (not an array)");
    }
  } catch (err: any) {
    // Log the error for debugging purposes in Vercel logs
    console.error('Next.js Build-Time Blog Fetch Failed:', err.message || err);
    error = 'Failed to load blogs. Please try again later.';
    // Ensure 'blogs' remains an empty array on failure so client component renders gracefully
    blogs = []; 
  }

  // Pass the data and any error to the client component
  return <_BlogCarouselClient initialBlogs={blogs} initialError={error} />;
}