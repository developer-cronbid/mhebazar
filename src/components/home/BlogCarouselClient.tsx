// src/components/_BlogCarouselClient.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Carousel } from '@/components/ui/carousel';
import { ArrowRight, Calendar, User, Loader2 } from 'lucide-react';
import Autoplay from "embla-carousel-autoplay";

interface BlogPost {
  id: number;
  blog_title: string;
  image1: string | null;
  blog_url: string;
  blog_category_name?: string | null;
  author_name?: string | null;
  created_at?: string | null;
  preview_description?: string | null;
  description1?: string | null;
}

interface BlogCarouselClientProps {
  initialBlogs: BlogPost[];
  initialError: string | null;
}

// Animation variants from page.tsx
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

function _BlogCarouselClient({ initialBlogs, initialError }: BlogCarouselClientProps) {
  const [blogs, setBlogs] = React.useState<BlogPost[]>(initialBlogs);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(initialError);
  const [scrollIndex, setScrollIndex] = React.useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = React.useState<{ [key: number]: boolean }>({});

  React.useEffect(() => {
    if (initialError) {
      setError(initialError);
    } else if (initialBlogs && initialBlogs.length > 0) {
      setBlogs(initialBlogs);
    }
  }, [initialBlogs, initialError]);

  const getOptimizedImageUrl = (imagePath: string | null, hasError: boolean): string => {
    if (!imagePath) {
      return "/mhe-logo.png";
    }

    if (hasError) {
      const filename = imagePath.split('/').pop();
      if (filename) {
        return `/css/asset/blogimg/${filename}`;
      }
      return "/mhe-logo.png";
    }

    // If API already returns a full URL, use it directly
    if (imagePath.startsWith("http")) {
      return imagePath;
    }
    
    return `https://api.mhebazar.in/media/${imagePath}`;
  };

  const handleImageError = (id: number) => {
    setImageError(prev => ({ ...prev, [id]: true }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const stripHtml = (html: string) => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  };

  const handleDotClick = (index: number) => {
    if (scrollContainerRef.current) {
      const carouselContent = scrollContainerRef.current;
      const itemWidth = carouselContent.children[0].clientWidth + 16;
      carouselContent.scrollTo({
        left: index * itemWidth,
        behavior: 'smooth',
      });
    }
  };

  // memoize blogs to avoid unnecessary re-renders / mapping work
  const memoBlogs = React.useMemo(() => blogs || [], [blogs]);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-4">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">
          Our Blogs
        </h2>
        <div className="flex justify-center items-center h-80">
          <Loader2 className="h-12 w-12 text-[#5ca131] animate-spin" />
        </div>
      </div>
    );
  }

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
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 4000,
          }),
        ]}
        className="w-full max-w-none"
      >
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto snap-x snap-mandatory -ml-4 gap-4"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          onScroll={(e) => {
            const carouselContent = e.currentTarget;
            const itemWidth = carouselContent.children[0].clientWidth + 16;
            const newIndex = Math.round(carouselContent.scrollLeft / itemWidth);
            setScrollIndex(newIndex);
          }}
        >
          {memoBlogs.map((blog) => {
            const imageUrl = getOptimizedImageUrl(blog.image1, imageError[blog.id] || false);
            return (
              <div
                key={`blog-${blog.id}`}
                // fixed width slides -> broader look (adjust sizes if you want wider/narrower)
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
                      {/* image area: consistent aspect ratio so entire image is visible (clean look) */}
                      <div className="relative overflow-hidden rounded-t-lg w-full bg-gray-50">
                        <div className="w-full aspect-[155/96] relative">
                          {imageUrl.startsWith('http') ? (
                            <img
                              src={imageUrl}
                              alt={blog.blog_title || 'blog image'}
                              className="w-full h-full object-contain bg-gray-50 p-4"
                              onError={() => handleImageError(blog.id)}
                              loading="lazy"
                              decoding="async"
                              style={{ display: 'block' }}
                            />
                          ) : (
                            <Image
                              src={imageUrl}
                              alt={blog.blog_title || 'blog image'}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              style={{ objectFit: 'contain' }}
                              className="bg-gray-50 p-4"
                              onError={() => handleImageError(blog.id)}
                            />
                          )}
                        </div>
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-[#5ca131] text-white border-0 px-3 py-1 rounded-full text-xs font-semibold">
                            {blog.blog_category_name || 'Blog'}
                          </Badge>
                        </div>
                      </div>

                      {/* content area: remaining height; neat spacing and truncation */}
                      <div className="flex flex-col justify-between grow p-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(blog.created_at || '')}
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
                              ? blog.description1
                              : (stripHtml(blog.preview_description || '').substring(0, 120) + "...")}
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
      </Carousel>
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