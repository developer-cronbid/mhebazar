// src/components/_BlogCarouselClient.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, User, Loader2 } from 'lucide-react';
import { BlogPost } from './BlogCarousal'; // FIXED: Import type from Server Component
import { useCallback } from 'react';

interface BlogCarouselClientProps {
  initialBlogs: BlogPost[];
  initialError: string | null;
}

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
  hover: {
    y: -4,
    scale: 1.01,
    borderColor: "#5ca131",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

const FALLBACK_URL = "/mhe-logo.png";

function _BlogCarouselClient({ initialBlogs, initialError }: BlogCarouselClientProps) {
  // Use useMemo for blogs state initialization for better stability
  const [blogs] = React.useState<BlogPost[]>(initialBlogs);
  const [error] = React.useState<string | null>(initialError);
  const [scrollIndex, setScrollIndex] = React.useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  
  // State to track permanently failed image IDs
  const [imageFailed, setImageFailed] = React.useState<{ [key: number]: boolean }>({}); 

  // Image Error Handler that STOPS LOOPS AND FORCES FALLBACK
  const handleImageError = useCallback((id: number) => {
    // Only update state if the image is NOT already marked as failed
    setImageFailed(prev => {
        if (!prev[id]) {
            console.warn(`[Image Error] Blog ID ${id} image failed. Switching to permanent fallback.`);
            // CRITICAL FIX: Ensure state update happens only once
            return { ...prev, [id]: true }; 
        }
        return prev;
    });
  }, []);

  // FIX: Simplified image URL getter. Checks failure state first.
  const getOptimizedImageUrl = useCallback((imagePath: string | null, id: number): string => {
    
    // CRITICAL FIX: If marked as failed, RETURN THE FALLBACK URL DIRECTLY. 
    // This is the only way to make the Next.js Image component stop requesting the bad src.
    if (imageFailed[id]) {
      return FALLBACK_URL;
    }

    if (!imagePath) {
      return FALLBACK_URL;
    }

    // Construct URL.
    if (imagePath.startsWith("http")) {
      return imagePath;
    }
    
    return `https://api.mhebazar.in/media/${imagePath}`;
  }, [imageFailed]); 

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Date Unknown";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
        return "Invalid Date";
    }
  };

  const stripHtml = (html: string | null): string => {
    if (!html) return "";
    // PERF: Check if running in a browser environment
    if (typeof document === 'undefined') {
        return html.replace(/<[^>]*>?/gm, ''); 
    }
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  };

  const handleDotClick = (index: number) => {
    if (scrollContainerRef.current) {
      const carouselContent = scrollContainerRef.current;
      // Calculate scroll position based on the first child's width + gap
      const firstChild = carouselContent.children[0] as HTMLElement;
      if (!firstChild) return;

      const style = window.getComputedStyle(carouselContent);
      const gapMatch = style.gap.match(/(\d+)px/);
      const gap = gapMatch ? parseInt(gapMatch[1], 10) : 16;
      
      const itemWidth = firstChild.clientWidth + gap;

      carouselContent.scrollTo({
        left: index * itemWidth,
        behavior: 'smooth',
      });
    }
  };

  // memoize blogs to avoid unnecessary re-renders / mapping work
  const memoBlogs = React.useMemo(() => blogs || [], [blogs]);

  if (error) {
    return (
      <div className="w-full px-4 py-4">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">
          Our Blogs
        </h2>
        <p className="text-center text-red-500">{error}</p>
      </div>
    );
  }

  if (memoBlogs.length === 0 && !error) {
    return null;
  }

  return (
    <div className="w-full px-4 py-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Our Blogs
        </h2>
        <Link href="/blog" className="text-green-600 font-medium hover:text-green-700 transition-colors duration-200">
          View More
        </Link>
      </div>
      <div
        ref={scrollContainerRef}
        // CWV FIX: Use native scrolling. Removed Embla dependencies for simplicity and performance.
        className="flex overflow-x-auto snap-x snap-mandatory -ml-4 gap-4 pb-4" 
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        onScroll={(e) => {
          const carouselContent = e.currentTarget;
          const firstChild = carouselContent.children[0] as HTMLElement;
          if (!firstChild) return;
          
          const style = window.getComputedStyle(carouselContent);
          const gapMatch = style.gap.match(/(\d+)px/);
          const gap = gapMatch ? parseInt(gapMatch[1], 10) : 16;
          
          const itemWidth = firstChild.clientWidth + gap;

          const newIndex = Math.round(carouselContent.scrollLeft / itemWidth);
          setScrollIndex(newIndex);
        }}
      >
        {memoBlogs.map((blog) => {
          const imageUrl = getOptimizedImageUrl(blog.image1, blog.id);
          const isFallback = imageUrl === FALLBACK_URL;
          
          return (
            <div
              key={`blog-${blog.id}`}
              className="pl-4 snap-start flex-shrink-0 w-[320px] sm:w-[360px] md:w-[420px] lg:w-[460px] flex"
              aria-roledescription="slide"
            >
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                className="w-full flex"
              >
                <Card className="overflow-hidden border border-gray-200 bg-white rounded-lg h-[480px] w-full flex flex-col transition-all duration-300 shadow-sm">
                  <Link href={`/blog/${blog.blog_url}`} className="block h-full">
                    {/* Image Area: Consistent Aspect Ratio is CRITICAL for CLS */}
                    <div className="relative overflow-hidden rounded-t-lg w-full bg-gray-50">
                      <div className="w-full aspect-[155/96] relative">
                          <Image
                            src={imageUrl}
                            alt={blog.blog_title || 'blog image'}
                            fill
                            sizes="(max-width: 640px) 100vw, 33vw"
                            style={{ objectFit: isFallback ? 'contain' : 'cover' }}
                            className={isFallback ? "bg-gray-50 p-4" : "bg-gray-50"}
                            onError={() => handleImageError(blog.id)}
                            loading="lazy"
                            // If it's a fallback, Next/Image knows the source is local and should stop trying to fetch the original
                          />
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-[#5ca131] text-white border-0 px-3 py-1 rounded-full text-xs font-semibold">
                          {blog.blog_category_name || 'Blog'}
                        </Badge>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex flex-col justify-between grow p-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(blog.created_at)}
                          </div>
                          {blog.author_name && (
                            <div className="flex items-center text-xs text-gray-500">
                              <User className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-[100px] font-medium">{blog.author_name}</span>
                            </div>
                          )}
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 hover:text-[#5ca131] transition-colors line-clamp-2 leading-tight">
                          {blog.blog_title}
                        </h2>
                        <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed mt-2">
                          {(blog.description1 && blog.description1.trim())
                            ? stripHtml(blog.description1)
                            : (stripHtml(blog.preview_description) || '').substring(0, 120) + "..."}
                        </p>
                      </div>

                      <div className="flex items-center text-[#5ca131] text-sm font-semibold hover:text-[#4a8429]">
                        Read More
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </Card>
              </motion.div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center space-x-2 mt-2">
        {memoBlogs.map((blog, index) => (
          <span
            key={`dot-${blog.id}`}
            onClick={() => handleDotClick(index)}
            className={`cursor-pointer w-3 h-3 rounded-full transition-colors duration-300 ${index === scrollIndex ? "bg-[#42a856]" : "bg-[#b5e0c0]"}`}
          />
        ))}
      </div>
    </div>
  );
}

// Export memoized component to reduce unnecessary re-renders
export default React.memo(_BlogCarouselClient);