// This file needs to be a Client Component to support useEffect, useState, and framer-motion.
"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Calendar, Clock, Hash, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import "@/styles/blog-styles.css";

// ==============================================================================
// 1. Interfaces remain the same
// ==============================================================================

interface Blog {
  id: number;
  blog_title: string;
  blog_url: string;
  image1: string; // <-- This is the desired OG/Twitter image
  description: string;
  author_name: string | null;
  created_at: string;
  meta_title: string | null;
  description1: string | null;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TocContentProps {
  toc: TocItem[];
  onLinkClick: (id: string) => void;
}

// ==============================================================================
// 2. Reusable TocContent component remains the same
// ==============================================================================

const TocContent = ({ toc, onLinkClick }: TocContentProps) => (
  <>
    <h3 className="text-lg font-bold mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2">
      <Hash className="mr-2 h-5 w-5" /> Table of Contents
    </h3>
    <ul className="space-y-2">
      {toc.length > 0 ? (
        toc.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onLinkClick(item.id)}
              className="text-left w-full text-muted-foreground transition-colors duration-200 cursor-pointer hover:text-[#5ca030] focus:outline-none focus:text-[#5ca030]"
            >
              {item.text}
            </button>
          </li>
        ))
      ) : (
        <li className="text-sm text-muted-foreground">No headings found.</li>
      )}
    </ul>
  </>
);

// ==============================================================================
// 3. Helper functions
// ==============================================================================

// 🔥 CORE FIX: Updated getImageUrl to enforce HTTPS and handle relative path correctly
const getImageUrl = (imagePath: string | null, hasError: boolean): string => {
  // 1. Fallback to default image if no path
  if (!imagePath) {
    return "/mhe-logo.png";
  }

  // 2. Fallback to existing local asset logic ONLY if an error has occurred
  if (hasError) {
    // This part handles the secondary local fallback logic
    const filename = imagePath.split("/").pop();
    // This is where you got the /css/... path when an error occurred
    return `/css/asset/blogimg/${filename}`; 
  }

  // 3. Primary Logic: Use the API-provided path, enforcing HTTPS

  // ✅ FIX 1: If it starts with an insecure HTTP link, change it to HTTPS
  if (imagePath.startsWith("http://")) {
    return imagePath.replace("http://", "https://");
  }
  
  // ✅ FIX 2: If it starts with a secure HTTPS link, use it as is
  if (imagePath.startsWith("https://")) {
    return imagePath;
  }

  // 4. Handle relative API paths (e.g., "media/...")
  if (imagePath.startsWith("media/")) {
    // Construct the full API URL securely
    return `https://api.mhebazar.in/${imagePath}`;
  }

  // 5. Default: Treat it as a direct relative path if none of the above
  return imagePath;
};

// **Helper to safely remove existing meta/link tags by property (No change)
const removeExistingTags = (property: string) => {
  const existingTags = document.querySelectorAll(`meta[${property}]`);
  existingTags.forEach((tag) => tag.remove());
  const existingCanonical = document.querySelector('link[rel="canonical"]');
  if (existingCanonical) existingCanonical.remove();
};

// **Helper to create and append a meta tag (No change)
const createMetaTag = (attribute: 'name' | 'property', value: string, content: string) => {
  let tag = document.querySelector(`meta[${attribute}="${value}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, value);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

// ==============================================================================
// 4. Component
// ==============================================================================

export default function BlogPostPage({ params }: { params: { blog: string } }) {
  const slug = params.blog;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [readingTime, setReadingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [, setIsTocOpen] = useState(false);
  const [imageError, setImageError] = useState<{ [key: number]: boolean }>({});

  // Effect for fetching the blog data (no change)
  useEffect(() => {
    const fetchBlogData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get(`/blogs/${slug}`);
        setBlog(response.data);
      } catch (err) {
        console.error("Failed to fetch blog post:", err);
        setError("Oops! We couldn't find that blog post.");
      } finally {
        setIsLoading(false);
      }
    };
    if (slug) {
      fetchBlogData();
    }
  }, [slug]);

  // SEO Effect: Uses the corrected getImageUrl to set HTTPS for all social images
  useEffect(() => {
    if (blog) {
      const metaTitle = blog.meta_title || blog.blog_title || "MHE Bazar Blog";
      const description =
        blog.description1 ||
        blog.description ||
        "Read the latest blog posts on material handling equipment.";
      const canonicalUrl = `https://www.mhebazar.in/blog/${slug}`;
      
      // The imageUrl now uses the corrected helper function, ensuring HTTPS is used 
      // for the primary image and the correct fallback is used on error.
      const imageUrl = getImageUrl(blog.image1, imageError[blog.id] || false);

      // 1. Clean up existing tags to prevent duplication
      removeExistingTags('name');
      removeExistingTags('property');

      // 2. Set Document Title
      document.title = metaTitle;

      // 3. Standard SEO Tags (name attribute)
      createMetaTag("name", "description", description);
      createMetaTag("name", "title", metaTitle); 

      // 4. Canonical Link
      let canonicalLinkTag = document.querySelector('link[rel="canonical"]');
      if (!canonicalLinkTag) {
        canonicalLinkTag = document.createElement("link");
        canonicalLinkTag.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalLinkTag);
      }
      canonicalLinkTag.setAttribute("href", canonicalUrl);

      // 5. Open Graph (OG) Tags
      createMetaTag("property", "og:title", metaTitle);
      createMetaTag("property", "og:description", description);
      createMetaTag("property", "og:url", canonicalUrl);
      createMetaTag("property", "og:type", "article"); 
      
      // OG Image (Now guaranteed to be HTTPS if it's a full API path)
      createMetaTag("property", "og:image", imageUrl); 
      createMetaTag("property", "og:image:width", "1200");
      createMetaTag("property", "og:image:height", "630");
      
      // 6. Twitter Card Tags
      createMetaTag("name", "twitter:card", "summary_large_image");
      createMetaTag("name", "twitter:title", metaTitle);
      createMetaTag("name", "twitter:description", description);
      
      // Twitter Image (Now guaranteed to be HTTPS if it's a full API path)
      createMetaTag("name", "twitter:image", imageUrl); 
      createMetaTag("name", "twitter:url", canonicalUrl);
      
      // 7. General SEO
      createMetaTag("name", "robots", "index, follow");
      
    }
  }, [blog, slug, imageError]); 


  // Effect 1: Calculate TOC data and reading time (no change)
  useEffect(() => {
    if (!blog?.description || !contentRef.current) return;

    // Calculate reading time
    const textContent = contentRef.current.innerText || "";
    const wordsPerMinute = 225;
    const words = textContent.trim().split(/\s+/).length;
    const time = Math.ceil(words / wordsPerMinute);
    setReadingTime(time);

    // Generate TOC data (h2 elements only)
    const headingElements = Array.from(
      contentRef.current.querySelectorAll("h2")
    ) as HTMLElement[];
    const newToc = headingElements.map((heading, index) => {
      const text = heading.innerText.trim();
      const id =
        text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") + `-${index}`;
      return { id, text, level: 2 };
    });
    setToc(newToc);
  }, [blog]);

  // Effect 2: Sync IDs to the DOM (no change)
  useEffect(() => {
    if (!contentRef.current || toc.length === 0) return;
    const headingElements = Array.from(
      contentRef.current.querySelectorAll("h2")
    ) as HTMLElement[];
    headingElements.forEach((heading, index) => {
      const tocItem = toc[index];
      if (tocItem && heading.id !== tocItem.id) {
        heading.setAttribute("id", tocItem.id);
      }
    });
  }, [toc]);

  // Scroll handler (no change)
  const handleTocClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsTocOpen(false);
    } else {
      console.warn("Element not found for id:", id);
    }
  };

  const handleImageError = (id: number) => {
    setImageError((prev) => ({ ...prev, [id]: true }));
  };

  // --- RENDER LOGIC ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error || "Blog not found."}
      </div>
    );
  }

  // Determine the image URL for rendering
  const renderImageUrl = getImageUrl(blog.image1, imageError[blog.id] || false);

  // --- HTML Content ---
  return (
    <>
      <div className="bg-background text-foreground">
        <div className="container mx-auto px-2 py-8 lg:py-16">
          <div className="grid grid-cols-12 lg:gap-12">
            {/* --- Desktop Sidebar: Table of Contents --- */}
            <aside className="hidden lg:block col-span-3">
              <div className="sticky top-40">
                <Card className="border border-l-4 border-[#5ca030]">
                  <CardContent className="px-6">
                    <TocContent toc={toc} onLinkClick={handleTocClick} />
                  </CardContent>
                </Card>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="col-span-12 lg:col-span-9">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Blog Header */}
                <div className="mb-8">
                  <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4 tracking-tight">
                    {blog.blog_title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground text-sm">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8 bg-green-300 dark:bg-green-700">
                        <AvatarFallback>
                          <User className="h-5 w-5 text-green-600 dark:text-green-900" />
                        </AvatarFallback>
                      </Avatar>
                      <span>{blog.author_name || "Anonymous"}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>
                        {new Date(blog.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      <span>{readingTime} min read</span>
                    </div>
                  </div>
                </div>

                {/* Main Image (Uses the correct, HTTPS-enforced URL) */}
                <img
                  src={renderImageUrl}
                  alt={blog.blog_title}
                  loading="eager" 
                  title={blog.blog_title}
                  className="w-full h-auto rounded-xl object-cover mb-8 shadow-lg"
                  style={{ aspectRatio: "16/9" }}
                  onError={() => handleImageError(blog.id)}
                />
              </motion.div>

              {/* Rendered HTML Blog Content */}
              <motion.div
                ref={contentRef}
                className="blog-content prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: blog.description }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              />
            </main>
          </div>
        </div>
      </div>
    </>
  );
}