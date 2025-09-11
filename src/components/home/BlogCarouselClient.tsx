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
  image1: string;
  blog_url: string;
  blog_category_name: string;
  author_name: string;
  created_at: string;
  description: string;
  description1: string;
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

export default function _BlogCarouselClient({ initialBlogs, initialError }: BlogCarouselClientProps) {
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
          className="flex overflow-x-auto snap-x snap-mandatory -ml-4"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          onScroll={(e) => {
            const carouselContent = e.currentTarget;
            const itemWidth = carouselContent.children[0].clientWidth + 16;
            const newIndex = Math.round(carouselContent.scrollLeft / itemWidth);
            setScrollIndex(newIndex);
          }}
        >
          {blogs.map((blog) => {
            const imageUrl = getOptimizedImageUrl(blog.image1, imageError[blog.id] || false);
            return (
              <div
                key={`blog-${blog.id}`}
                className="pl-4 snap-start flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/3"
              >
                <motion.div
                  variants={cardVariants}
                  whileHover="hover"
                >
                  <Card className="overflow-hidden border border-gray-200 bg-white rounded-lg h-full transition-all duration-300 pt-0">
                    <Link href={`/blog/${blog.blog_url}`} className="block h-full">
                      <div className="relative overflow-hidden rounded-t-lg">
                        <div className="w-full h-auto aspect-[155/96] relative">
                          <Image
                            src={imageUrl}
                            alt={blog.blog_title}
                            layout="fill"
                            objectFit="contain"
                            className="bg-gray-50"
                            onError={() => handleImageError(blog.id)}
                          />
                        </div>
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-[#5ca131] text-white border-0 px-3 py-1 rounded-full text-xs font-semibold">
                            {blog.blog_category_name}
                          </Badge>
                        </div>
                      </div>

                      <CardHeader className="p-4">
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
                        <h2 className="text-lg font-bold text-gray-900 hover:text-[#5ca131] transition-colors line-clamp-2 leading-tight">
                          {blog.blog_title}
                        </h2>
                      </CardHeader>
                      <CardContent className="pt-0 p-4">
                        <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                          {blog.description1 || stripHtml(blog.description).substring(0, 100) + "..."}
                        </p>
                        <div className="flex items-center text-[#5ca131] text-sm font-semibold hover:text-[#4a8429]">
                          Read More
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                </motion.div>
              </div>
            );
          })}
        </div>
      </Carousel>
      <div className="flex justify-center space-x-2 mt-2">
        {blogs.map((blog, index) => (
          <span
            key={`dot-${blog.id}`}
            onClick={() => handleDotClick(index)}
            className={`cursor-pointer w-3 h-3 rounded-full transition-colors duration-300 ${
              index === scrollIndex ? "bg-[#42a856]" : "bg-[#b5e0c0]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}