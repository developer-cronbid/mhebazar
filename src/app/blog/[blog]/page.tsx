// src/app/blog/[blog]/page.tsx

// 1. Server-Side Imports (NO "use client" in this file)
import { Metadata } from 'next';
import api from "@/lib/api";
import BlogContentClient from './BlogContentClient';
import axios from 'axios';

// ==============================================================================
// 2. Interfaces (Minimal subset needed for Server/Metadata)
// ==============================================================================

interface Blog {
  id: number;
  blog_title: string;
  image1: string;
  description: string;
  meta_title: string | null;
  description1: string | null;
}

// Helper to construct a full, secure image URL for metadata
const getAbsoluteImageUrl = (imagePath: string | null): string => {
  if (!imagePath) return "https://www.mhebazar.in/mhe-logo.png";

  let finalPath = imagePath;

  if (finalPath.startsWith("http://")) {
    return finalPath.replace("http://", "https://");
  }

  if (finalPath.startsWith("media/")) {
    return `https://api.mhebazar.in/${finalPath}`;
  }

  return finalPath;
};

// Strips HTML tags and collapses whitespace so raw markup can never leak
// into a meta description, even when falling back to the full body field.
const stripHtml = (html: string, maxLength = 160): string => {
  const text = html
    .replace(/<[^>]*>/g, " ")   // remove all tags
    .replace(/\s+/g, " ")       // collapse whitespace/newlines
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
};

// ==============================================================================
// 3. generateMetadata (SERVER-SIDE) - FIXES OG/Twitter Image + description leak
// ==============================================================================

export async function generateMetadata({ params }: { params: Promise<{ blog: string }> }): Promise<Metadata> {
  const { blog: slug } = await params;
  let blog: Blog | null = null;

  try {
    const apiPath = `/blogs/${slug}/`;
    const response = await api.get(apiPath);
    blog = response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`[SSR Metadata] API Failed for ${slug}: ${error.message}`);
    } else {
      console.error("Failed to fetch blog post for metadata:", error);
    }
  }

  // If fetch failed or data is missing, return a safe default
  if (!blog || !blog.image1) {
    return {
      title: 'MHE Bazar Blog',
      description: 'Material Handling Equipment and Intralogistics Solutions.',
      openGraph: {
        images: ["https://www.mhebazar.in/mhe-logo.png"],
        type: 'website'
      }
    };
  }

  const metaTitle = blog.meta_title || blog.blog_title || "MHE Bazar Blog";

  // Prefer the dedicated meta-description field. Only fall back to the full
  // HTML body if it's missing — and if we do, strip tags first so nothing
  // like "<h1>..." can ever leak into a link preview again.
  const rawDescription = blog.description1 || blog.description || "Read the latest blog posts on material handling equipment.";
  const description = blog.description1
    ? blog.description1
    : stripHtml(rawDescription);

  const canonicalUrl = `https://www.mhebazar.in/blog/${slug}`;
  const imageUrl = getAbsoluteImageUrl(blog.image1);

  return {
    title: metaTitle,
    description: description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: metaTitle,
      description: description,
      url: canonicalUrl,
      type: 'article',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: blog.blog_title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: description,
      images: [imageUrl],
    },
  };
}

// ==============================================================================
// 4. Main Page Component (SERVER-SIDE RENDERER)
// ==============================================================================

export default async function BlogPostPage({ params }: { params: Promise<{ blog: string }> }) {
  const { blog } = await params;
  return <BlogContentClient slug={blog} />;
}