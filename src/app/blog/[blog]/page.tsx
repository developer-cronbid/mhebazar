"use client";

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
// NEW: AnimatePresence for exit animations and new icons
import { motion } from 'framer-motion';
import { Calendar, Clock, Hash } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import '@/styles/blog-styles.css'

// Interfaces remain the same
interface Blog {
  id: number;
  blog_title: string;
  blog_url: string;
  image1: string;
  description: string;
  author_name: string | null;
  created_at: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

// NEW: Props for our reusable TOC component
interface TocContentProps {
  toc: TocItem[];
  onLinkClick: (id: string) => void;
}

// NEW: Reusable component for the Table of Contents list to avoid duplication
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


export default function BlogPostPage({ params }: { params: { slug: string } }) {
  // `params.slug` is automatically populated by Next.js with the value from the URL.
  // For a URL like "/blog/my-first-post", params.slug will be "my-first-post".
  const slug = params.blog;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [readingTime, setReadingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // NEW: State to manage the mobile TOC drawer visibility
  const [, setIsTocOpen] = useState(false);

  // Effect for fetching the blog data (no changes here)
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

  // Effect 1: Calculate TOC data and reading time (no changes here)
  useEffect(() => {
    if (!blog?.description || !contentRef.current) return;

    // Calculate reading time
    const textContent = contentRef.current.innerText || "";
    const wordsPerMinute = 225;
    const words = textContent.trim().split(/\s+/).length;
    const time = Math.ceil(words / wordsPerMinute);
    setReadingTime(time);

    // Generate TOC data
    const headingElements = Array.from(
      contentRef.current.querySelectorAll("h2")
    ) as HTMLElement[];
    const newToc = headingElements.map((heading, index) => {
      const text = heading.innerText.trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + `-${index}`;
      return { id, text, level: 2 };
    });
    setToc(newToc);
  }, [blog]);

  // Effect 2: Sync IDs to the DOM (no changes here)
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

  // --- Scroll handler ---
  // MODIFIED: Now closes the mobile drawer when a link is clicked
  const handleTocClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsTocOpen(false); // Close mobile TOC on navigation
    } else {
      console.warn("Element not found for id:", id);
    }
  };

  // Image handling logic remains the same
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

  return (
    <>
      <div className="bg-background text-foreground">
        <div className="container mx-auto px-2 py-8 lg:py-16">
          <div className="grid grid-cols-12 lg:gap-12">

            {/* --- Desktop Sidebar: Table of Contents --- */}
            <aside className="hidden lg:block col-span-3">
              <div className="sticky top-40">
                <Card className='border border-l-4 border-[#5ca030]'>
                  <CardContent className="px-6">
                    {/* Use the reusable component */}
                    <TocContent toc={toc} onLinkClick={handleTocClick} />
                  </CardContent>
                </Card>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="col-span-12 lg:col-span-9">
              {/* The rest of the main content is unchanged... */}
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
                  src={getImageUrl(blog.image1, imageError[blog.id] || false)}
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

      {/* --- NEW: Mobile TOC Drawer --- */}
      {/* <AnimatePresence>
        {isTocOpen && (
          <> */}
            {/* Overlay */}
            {/* <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTocOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            /> */}
            {/* Drawer */}
            {/* <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-72 bg-background p-6 z-50 lg:hidden"
            >
              <button
                onClick={() => setIsTocOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground"
                aria-label="Close table of contents"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="mt-8">
                <TocContent toc={toc} onLinkClick={handleTocClick} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence> */}

      {/* --- NEW: Floating Button to open Mobile TOC ---
      <div className="fixed top-40 right-6 z-30 lg:hidden">
        <button
          onClick={() => setIsTocOpen(true)}
          className="bg-[#5ca030] text-white p-2 rounded-full shadow-lg hover:bg-[#4a8a25] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5ca030]"
          aria-label="Open table of contents"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div> */}
    </>
  );
}