"use client";

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Calendar, Clock, Hash } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import './blog-styles.css'; // The CSS file from the previous answer

// Define the structure of your blog data
interface Blog {
  id: number;
  blog_title: string;
  blog_url: string; // The URL slug we will match against
  image1: string;
  description: string;
  author_name: string | null;
  created_at: string;
}

// Define the structure for a Table of Contents item
interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  // `params.slug` is automatically populated by Next.js with the value from the URL.
  // For a URL like "/blog/my-first-post", params.slug will be "my-first-post".
  // console.log(params.blog);
  const slug = params.blog;
  console.log(slug);

  const [blog, setBlog] = useState<Blog | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [readingTime, setReadingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Effect for fetching the blog data using the slug from the URL
  useEffect(() => {
    const fetchBlogData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // In a real application, you would fetch the specific blog using the slug.
        // The API endpoint would look something like this:
        const response = await api.get(`/blogs/${slug}`);
        const blogData = response.data; // Assuming API returns an array
        setBlog(blogData);

      } catch (err) {
        console.error("Failed to fetch blog post:", err);
        setError("Oops! We couldn't find that blog post.");
      } finally {
        setIsLoading(false);
      }
    };

    // This check ensures we have a slug before fetching
    if (slug) {
      fetchBlogData();
    }

  }, [slug]); // The effect re-runs whenever the slug in the URL changes.

  // Effect 1: Calculate TOC data and reading time when the blog loads
  useEffect(() => {
    if (!blog?.description || !contentRef.current) return;

    // Calculate reading time
    const textContent = contentRef.current.innerText || "";
    const wordsPerMinute = 225;
    const words = textContent.trim().split(/\s+/).length;
    const time = Math.ceil(words / wordsPerMinute);
    setReadingTime(time);

    // Generate the TOC data structure WITHOUT modifying the DOM
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
  }, [blog]); // This effect ONLY runs when the blog data changes

  // Effect 2: Sync IDs to the DOM whenever the TOC data is ready
  useEffect(() => {
    if (!contentRef.current || toc.length === 0) return;

    const headingElements = Array.from(
      contentRef.current.querySelectorAll("h2")
    ) as HTMLElement[];

    // Apply the IDs from our state to the actual DOM elements
    headingElements.forEach((heading, index) => {
      const tocItem = toc[index];
      if (tocItem && heading.id !== tocItem.id) {
        heading.setAttribute("id", tocItem.id);
      }
    });
  }, [toc]); // This effect ONLY runs when the toc state has been updated

  // --- Scroll handler ---
  const handleTocClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      console.warn("Element not found for id:", id);
    }
  };

  const getImageUrl = (imagePath: string | null, hasError: boolean) => {
      if (hasError || !imagePath) {
        return "/mhe-logo.png";
      }
      
      const filename = imagePath.split('/').pop();
      return `/css/asset/blogimg/${filename}`;
    };
  
    const [imageError, setImageError] = useState<{ [key: number]: boolean }>({});
  
    const handleImageError = (id: number) => {
      setImageError(prev => ({ ...prev, [id]: true }));
    };

  // --- RENDER LOGIC ---

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (error || !blog) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error || "Blog not found."}</div>;
  }

  // The rest of the JSX is identical to the previous answer...
  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 lg:py-16">
        <div className="grid grid-cols-12 lg:gap-12">

          {/* Left Sidebar: Table of Contents */}
          <motion.aside
            className="hidden lg:block col-span-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="sticky top-40 ">
              <Card className='border border-l-4 border-[#5ca030]'>
                <CardContent className="px-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center border-b border-gray-200">
                    <Hash className="mr-2 h-5 w-5" /> Table of Contents
                  </h3>
                  <ul className="space-y-2">
                    {toc.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => handleTocClick(item.id)}
                          className="text-left w-full transition-colors duration-200 cursor-pointer hover:text-[#5ca030]"
                        >
                          {item.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </motion.aside>

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
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${blog.author_name || 'A'}`} />
                      <AvatarFallback>{(blog.author_name || 'A').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{blog.author_name || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>{new Date(blog.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{readingTime} min read</span>
                  </div>
                </div>
              </div>

              {/* Main Image */}
              <img
                src={getImageUrl(blog.image1?.split('/').pop() || null, imageError[blog.id] || false)}
                alt={blog.blog_title}
                className="w-full h-auto rounded-xl object-cover mb-8 shadow-lg"
                style={{ aspectRatio: '16/9' }}
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
  );
}