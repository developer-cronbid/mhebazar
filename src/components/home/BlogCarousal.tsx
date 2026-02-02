// src/components/BlogCarousel.tsx
import _BlogCarouselClient from './BlogCarouselClient';

// --- FIXED TYPE DEFINITION (Source of Truth) ---
export interface BlogPost {
  id: number;
  blog_title: string;
  image1: string | null; // Must allow null from API
  blog_url: string;
  blog_category_name: string | null;
  author_name: string | null;
  created_at: string | null;
  preview_description: string | null;
  description1: string | null;
}
// ------------------------------------------------

export async function BlogCarousel() {
  let blogs: BlogPost[] = [];
  let error: string | null = null;
  let data: any = null;

  try {
    // STABLE FETCH: Use standard fetch with an absolute public URL.
    // Fetch top 5 blogs to ensure we have enough data to pick the top 3 after sorting.
    const res = await fetch('https://api.mhebazar.in/api/blogs/?limit=5', { 
        // Revalidate is crucial for fresh data and performance (fast subsequent server renders)
        next: { revalidate: 300 } 
    });
    
    if (!res.ok) {
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
    // console.error('Next.js Build-Time Blog Fetch Failed:', err.message || err);
    error = 'Failed to load blogs. Please try again later.';
    blogs = []; 
  }

  // Pass the data and any error to the client component
  return <_BlogCarouselClient initialBlogs={blogs} initialError={error} />;
}