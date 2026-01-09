// src/app/blog/[blog]/page.tsx

// 1. Server-Side Imports (NO "use client" in this file)
// import { Metadata } from 'next'; 
// import api from "@/lib/api"; 
import BlogContentClient from './BlogContentClient'; 
// import axios from 'axios';

// ==============================================================================
// 2. Interfaces (Minimal subset needed for Server/Metadata)
// ==============================================================================

// interface Blog {
//   id: number;
//   blog_title: string;
//   image1: string; 
//   description: string;
//   meta_title: string | null;
//   description1: string | null;
// }

// // Helper to construct a full, secure image URL for metadata
// const getAbsoluteImageUrl = (imagePath: string | null): string => {
//   if (!imagePath) return "https://www.mhebazar.in/mhe-logo.png";
  
//   let finalPath = imagePath;
  
//   // ✅ FINAL FIX: Only ensure HTTPS is used for the returned path. 
//   // This uses the exact path returned by the API (image1)
//   if (finalPath.startsWith("http://")) {
//       return finalPath.replace("http://", "https://");
//   }
  
//   // If the path starts with 'media/' (relative to the API domain), construct the absolute URL
//   if (finalPath.startsWith("media/")) {
//       return `https://api.mhebazar.in/${finalPath}`;
//   }
  
//   return finalPath; 
// };

// // ==============================================================================
// // 3. generateMetadata (SERVER-SIDE) - FIXES OG/Twitter Image
// // ==============================================================================

// export async function generateMetadata({ params }: { params: Promise<{ blog: string }> }): Promise<Metadata> {
//   const { blog: slug } = await params;
//   let blog: Blog | null = null;

//   try {
//     // Corrected API path for consistency with your backend structure: /blogs/slug/
//     const apiPath = `/blogs/${slug}/`;
//     const response = await api.get(apiPath); 
//     blog = response.data;
//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//         console.error(`[SSR Metadata] API Failed for ${slug}: ${error.message}`);
//     } else {
//         console.error("Failed to fetch blog post for metadata:", error);
//     }
//   }
  
//   // If fetch failed or data is missing, return a safe default
//   if (!blog || !blog.image1) {
//     return { 
//         title: 'MHE Bazar Blog',
//         description: 'Material Handling Equipment and Intralogistics Solutions.',
//         openGraph: {
//             images: ["https://www.mhebazar.in/mhe-logo.png"],
//             type: 'website'
//         }
//     };
//   }
  
//   const metaTitle = blog.meta_title || blog.blog_title || "MHE Bazar Blog";
//   const description = blog.description1 || blog.description || "Read the latest blog posts on material handling equipment.";
//   const canonicalUrl = `https://www.mhebazar.in/blog/${slug}`;
  
//   // Uses the exact image1 path, ensuring HTTPS
//   const imageUrl = getAbsoluteImageUrl(blog.image1); 

//   return {
//     title: metaTitle,
//     description: description,
//     alternates: { canonical: canonicalUrl },
//     openGraph: {
//         title: metaTitle,
//         description: description,
//         url: canonicalUrl,
//         type: 'article',
//         // This tag now carries the correct, secured URL from the API response
//         images: [{ url: imageUrl, width: 1200, height: 630, alt: blog.blog_title }],
//     },
//     twitter: {
//         card: 'summary_large_image',
//         title: metaTitle,
//         description: description,
//         // This tag now carries the correct, secured URL from the API response
//         images: [imageUrl], 
//     },
//   };
// }


// ==============================================================================
// 4. Main Page Component (SERVER-SIDE RENDERER)
// ==============================================================================

export default async function BlogPostPage({ params }: { params: Promise<{ blog: string }> }) {
  // Renders the client component, passing the slug. 
  // The client component handles its own data fetching and loading states.
  const { blog } = await params;
  return <BlogContentClient slug={blog} />;
}