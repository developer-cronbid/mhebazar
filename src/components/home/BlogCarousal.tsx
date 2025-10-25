// src/components/BlogCarousel.tsx
import React from 'react';
import api from '@/lib/api';
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

  try {
    // Use absolute production endpoint for reliable data during build on Vercel
    let data: any = null;

    // Primary: fetch production API (guaranteed to be accessible during build)
    try {
      const res = await fetch('https://api.mhebazar.in/api/blogs/?limit=3', { next: { revalidate: 300 } });
      if (res.ok) {
        data = await res.json();
      } else {
        throw new Error(`Production fetch failed: ${res.status}`);
      }
    } catch (prodErr) {
      // Fallback: try app api client if configured (keeps local dev working)
      try {
        const response = await api.get<any>('/blogs/?limit=3');
        data = response.data;
      } catch (clientErr) {
        console.error('Both production fetch and api client failed:', prodErr, clientErr);
        throw prodErr;
      }
    }

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
      throw new Error("Unexpected API response format");
    }
  } catch (err) {
    console.error('Failed to fetch blogs:', err);
    error = 'Failed to load blogs. Please try again later.';
  }

  return <_BlogCarouselClient initialBlogs={blogs} initialError={error} />;
}