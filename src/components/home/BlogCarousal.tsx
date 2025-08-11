// components/BlogCarousel.tsx
'use client';

import * as React from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
} from '@/components/ui/carousel';
import { ArrowUpRight } from 'lucide-react';
import Autoplay from "embla-carousel-autoplay";

// Define the structure of a blog post based on your API response
interface BlogPost {
  id: number;
  blog_title: string;
  image1: string;
  blog_url: string;
}

// Define the structure of the API response
interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BlogPost[];
}

export function BlogCarousel() {
  const [blogs, setBlogs] = React.useState<BlogPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [scrollIndex, setScrollIndex] = React.useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) {
      return "/mhe-logo.png"; // Fallback image
    }
    
    const filename = imagePath.split('/').pop();
    return `/css/asset/blogimg/${filename}`;
  };

  React.useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await api.get<ApiResponse>('/blogs/');

        if (response.data && response.data.results) {
          setBlogs(response.data.results);
        } else {
          throw new Error("Invalid API response structure");
        }

      } catch (err) {
        console.error('Failed to fetch blogs:', err);
        setError('Failed to load blogs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

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
        <div className="flex space-x-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-1 p-1">
              <div className="bg-slate-200 rounded-lg h-80 animate-pulse"></div>
            </div>
          ))}
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
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">
        Our Blogs
      </h2>
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
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className="pl-4 snap-start flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/3"
            >
              <Card className="bg-white border-0 rounded-2xl overflow-hidden h-full flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300 mx-2">
                <CardContent className="flex flex-col p-0 flex-grow">
                  <div className="relative w-full aspect-video overflow-hidden rounded-t-2xl">
                    <Image
                      src={getImageUrl(blog.image1)}
                      alt={blog.blog_title}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/mhe-logo.png";
                      }}
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow justify-between">
                    <h3 className="font-semibold text-lg leading-6 text-gray-900 mb-4 line-clamp-3">
                      {blog.blog_title}
                    </h3>
                    <Link
                      href={`/blog/${blog.blog_url}`}
                      className="inline-flex items-center gap-2 text-green-600 font-semibold text-base group hover:text-green-700 transition-colors duration-200"
                    >
                      Read More
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </Carousel>
      <div className="flex justify-center space-x-2 mt-2">
        {blogs.map((_, idx) => (
          <span
            key={idx}
            onClick={() => handleDotClick(idx)}
            className={`cursor-pointer w-3 h-3 rounded-full transition-colors duration-300 ${
              idx === scrollIndex ? "bg-[#42a856]" : "bg-[#b5e0c0]"
            }`}
          ></span>
        ))}
      </div>
    </div>
  );
}