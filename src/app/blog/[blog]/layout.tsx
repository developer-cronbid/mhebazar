// src/app/blog/[blog]/layout.tsx
import { Metadata } from 'next';
// We use native fetch here to support next: { revalidate }

type Props = {
  params: Promise<{ blog: string }>;
  children: React.ReactNode;
};

const getAbsoluteImageUrl = (imagePath: string | null): string => {
  const isProd = process.env.NODE_ENV === "production";
  const siteUrl = isProd ? "https://www.mhebazar.in" : "http://localhost:3000";
  const apiUrl = isProd ? "https://api.mhebazar.in" : "http://127.0.0.1:8000";

  if (!imagePath) return `${siteUrl}/mhe-logo.png`;
  let finalPath = imagePath.trim().replace(/\/$/, "");

  if (finalPath.startsWith("http")) return finalPath.replace("http://", "https://");

  if (finalPath.startsWith("/media/") || finalPath.startsWith("media/")) {
    const cleanMedia = finalPath.startsWith("/") ? finalPath : `/${finalPath}`;
    return `${apiUrl}${cleanMedia}`;
  }
  return finalPath.startsWith("/") ? `${siteUrl}${finalPath}` : `${siteUrl}/${finalPath}`;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { blog: slug } = await params;
  const isProd = process.env.NODE_ENV === "production";
  const siteUrl = isProd ? "https://www.mhebazar.in" : "http://localhost:3000";
  
  // Define your base API URL
  const API_BASE = isProd ? "https://api.mhebazar.in/api" : "http://127.0.0.1:8000/api";

  try {
    // ✅ Performance Fix: Using native fetch with revalidate (1 hour)
    // This stops the server from waiting for the API on every single request
    const res = await fetch(`${API_BASE}/blogs/${slug}/`, { 
      next: { revalidate: 3600 } 
    });

    if (!res.ok) throw new Error('Blog not found');
    const blog = await res.json();

    const metaTitle = blog.meta_title || blog.blog_title || "MHE Bazar Blog";
    const description = blog.description1 || blog.description?.substring(0, 160) || "Read the latest blog posts.";
    const imageUrl = getAbsoluteImageUrl(blog.image1);
    const canonicalUrl = `${siteUrl}/blog/${slug}`;

    return {
      title: metaTitle,
      description: description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: metaTitle,
        description: description,
        url: canonicalUrl,
        images: [{ url: imageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        images: [imageUrl],
      },
    };
  } catch (error) {
    return {
      title: "Blog | MHE Bazar",
      description: "Expert insights into Material Handling Equipment."
    };
  }
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}