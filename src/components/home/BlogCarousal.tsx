// src/components/BlogCarousel.tsx
import React from 'react';
import api from '@/lib/api';
import _BlogCarouselClient from './BlogCarouselClient';

// Define the structure of a blog post based on your API response
interface BlogPost {
  id: number;
  blog_title: string;
  image1: string;
  blog_url: string;
  blog_category_name: string;
  author_name: string;
  created_at: string;
  description: string;
  description1: string;
}

// Define the structure of the API response
interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BlogPost[];
}

export async function BlogCarousel() {
  let blogs: BlogPost[] = [];
  let error: string | null = null;

  try {
    const response = await api.get<ApiResponse>('/blogs/?limit=3');
    if (response.data && response.data.results) {
      blogs = response.data.results;
    } else {
      throw new Error("Invalid API response structure");
    }
  } catch (err) {
    console.error('Failed to fetch blogs:', err);
    error = 'Failed to load blogs. Please try again later.';
  }

  // Pass the fetched blogs to the client component
  return <_BlogCarouselClient initialBlogs={blogs} initialError={error} />;
}