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
    // API returns an array of blog objects
    const response = await api.get<BlogPost[]>('/blogs/?limit=3');

    if (response.data) {
      const data = response.data;
      if (!Array.isArray(data)) {
        throw new Error("Unexpected API response format");
      }

      // Ensure we send the latest three blogs (sorted by created_at desc)
      blogs = data
        .slice()
        .sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        })
        .slice(0, 3);
    } else {
      throw new Error("Invalid API response");
    }
  } catch (err) {
    console.error('Failed to fetch blogs:', err);
    error = 'Failed to load blogs. Please try again later.';
  }

  return <_BlogCarouselClient initialBlogs={blogs} initialError={error} />;
}