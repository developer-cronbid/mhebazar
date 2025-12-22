// src/components/BlogListClient.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, User, ArrowRight, Loader2, Filter, SortDesc, SortAsc, Grid3X3, List } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface Blog {
  id: number;
  blog_title: string;
  blog_category: number;
  blog_category_name: string;
  image1: string | null;
  preview_description: string;
  blog_url: string;
  tags: string | null;
  author_name: string | null;
  created_at: string;
  updated_at: string;
}

interface BlogResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Blog[];
}

interface Category {
  id: number;
  name: string;
}

interface BlogListClientProps {
  initialSearchTerm: string;
  initialCategoryId: string;
  initialSortOrder: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

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

const BlogListClient: React.FC<BlogListClientProps> = ({
  initialSearchTerm,
  initialCategoryId,
  initialSortOrder,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [previousPage, setPreviousPage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategoryId);
  const [sortOrder, setSortOrder] = useState<string>(initialSortOrder);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  // Memoized URL creation
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  // Memoized data fetcher
  const fetchBlogs = useCallback(async (page: number, search: string, categoryId: string, order: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories and blogs in parallel
      const [categoriesResponse, blogsResponse] = await Promise.all([
        api.get<Category[]>("/categories/"),
        api.get<BlogResponse>(`/blogs/?page=${page}&search=${encodeURIComponent(search)}&blog_category=${categoryId}&ordering=${order}`)
      ]);

      setAvailableCategories(categoriesResponse.data);
      setBlogs(blogsResponse.data.results);
      setTotalCount(blogsResponse.data.count);
      setNextPage(blogsResponse.data.next);
      setPreviousPage(blogsResponse.data.previous);
    } catch (err) {
      console.error("Error fetching blogs:", err);
      setError("Failed to load blogs. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBlogs(currentPage, searchTerm, selectedCategoryId, sortOrder);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm, selectedCategoryId, sortOrder, fetchBlogs]);

  // SEO optimization
  useEffect(() => {
    document.title = "Empower Your Material Handling Expertise: Insights from Mhe Bazar's Blog";
    
    // Update meta tags efficiently
    const updateMetaTag = (name: string, content: string) => {
      let metaTag = document.querySelector(`meta[name="${name}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', name);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    };

    updateMetaTag('title', "MHE Bazar Blog | Insights on Material Handling and Safety");
    updateMetaTag('description', "Explore expert articles on material handling equipment, warehouse safety, battery solutions, and industrial trends—only on the official MHE Bazar Blog");
  }, []);

  // Event handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    router.push(`${pathname}?${createQueryString('search', searchTerm)}`, { scroll: false });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategoryId = e.target.value;
    setSelectedCategoryId(newCategoryId);
    setCurrentPage(1);
    router.push(`${pathname}?${createQueryString('blog_category', newCategoryId)}`, { scroll: false });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortOrder = e.target.value;
    setSortOrder(newSortOrder);
    setCurrentPage(1);
    router.push(`${pathname}?${createQueryString('ordering', newSortOrder)}`, { scroll: false });
  };

  const handleNextPage = () => {
    if (nextPage) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    if (previousPage) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Memoized utility functions
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const getOptimizedImageUrl = useCallback((imagePath: string | null, hasError: boolean): string => {
    if (!imagePath) return "/mhe-logo.png";
    if (hasError) {
      const filename = imagePath.split('/').pop();
      return filename ? `/css/asset/blogimg/${filename}` : "/mhe-logo.png";
    }
    return imagePath.startsWith("http") ? imagePath : `https://api.mhebazar.in/media/${imagePath}`;
  }, []);

  const handleImageError = useCallback((id: number) => {
    setImageError(prev => ({ ...prev, [id]: true }));
  }, []);

  // Memoized blog cards for better performance
  const renderBlogCards = useMemo(() => {
    return blogs.map((blog, index) => {
      const imageUrl = getOptimizedImageUrl(blog.image1, imageError[blog.id] || false);
      
      return (
        <motion.div
          key={blog.id}
          variants={cardVariants}
          whileHover="hover"
          custom={index}
        >
          <Card className="overflow-hidden border border-gray-200 bg-white rounded-lg h-full transition-all duration-300 pt-0">
            <Link href={`/blog/${blog.blog_url}`} className="block h-full" prefetch={false}>
              <div className="relative overflow-hidden rounded-t-lg">
                <div className="w-full h-auto aspect-[155/96] relative">
                  <Image
                    src={imageUrl}
                    alt={blog.blog_title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="bg-gray-50 object-contain"
                    onError={() => handleImageError(blog.id)}
                    priority={index < 4} // Priority load first 4 images
                  />
                </div>
                <div className="absolute top-3 right-3">
  <Badge
    className="text-white border-0 px-3 py-1 rounded-full text-xs font-semibold bg-[#5ca131]"
  >
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
                  {blog.preview_description}
                </p>
                <div className="flex items-center text-[#5ca131] text-sm font-semibold hover:text-[#4a8429]">
                  Read More
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform" />
                </div>
              </CardContent>
            </Link>
          </Card>
        </motion.div>
      );
    });
  }, [blogs, imageError, getOptimizedImageUrl, handleImageError, formatDate]);

  const renderListView = useMemo(() => {
    return blogs.map((blog, index) => {
      const imageUrl = getOptimizedImageUrl(blog.image1, imageError[blog.id] || false);
      
      return (
        <motion.div
          key={blog.id}
          variants={cardVariants}
          whileHover="hover"
          custom={index}
        >
          <Card className="overflow-hidden border border-gray-200 bg-white rounded-lg transition-all duration-300">
            <Link href={`/blog/${blog.blog_url}`} className="block" prefetch={false}>
              <div className="flex flex-col md:flex-row">
                <div className="relative md:w-64 lg:w-80 flex-shrink-0">
                  <div className="w-full h-48 md:h-full relative">
                    <Image
                      src={imageUrl}
                      alt={blog.blog_title}
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                      className="bg-gray-50 object-contain rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
                      onError={() => handleImageError(blog.id)}
                      priority={index < 2}
                    />
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-[#5ca131] text-white border-0 px-3 py-1 rounded-full text-xs font-semibold">
                      {blog.blog_category_name}
                    </Badge>
                  </div>
                </div>
                <div className="flex-1 p-6 md:p-8">
                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(blog.created_at)}
                    </div>
                    {blog.author_name && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        <span className="font-medium">{blog.author_name}</span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 hover:text-[#5ca131] transition-colors mb-3 line-clamp-2 leading-tight">
                    {blog.blog_title}
                  </h2>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-6 leading-relaxed">
                    {blog.preview_description}
                  </p>
                  <div className="flex items-center text-[#5ca131] text-sm font-bold hover:text-[#4a8429]">
                    Read Full Article
                    <ArrowRight className="h-4 w-4 ml-2 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </Card>
        </motion.div>
      );
    });
  }, [blogs, imageError, getOptimizedImageUrl, handleImageError, formatDate]);

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-white flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-lg w-full border border-gray-200 rounded-xl">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <Image
                  src="/mhe-logo.png"
                  alt="MHE Bazar Logo"
                  width={80}
                  height={80}
                  className="mx-auto mb-4 object-contain"
                  unoptimized
                />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{error}</p>
              </div>
              <Button
                onClick={() => fetchBlogs(currentPage, searchTerm, selectedCategoryId, sortOrder)}
                className="bg-[#5ca131] hover:bg-[#4a8429] text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300"
              >
                <Loader2 className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white pt-8 pb-10 sm:pt-12 sm:pb-14"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">
              MHE Bazar <span className="text-[#5ca131]">Blog</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Discover insights, tips, and industry knowledge about material handling equipment
            </p>
          </div>

          {/* Search Bar */}
          <motion.form
            onSubmit={handleSearch}
            className="max-w-xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#5ca131] transition-colors duration-300" />
              </div>
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-28 py-6 text-base rounded-full border border-gray-300 focus:border-[#5ca131] focus:ring-1 focus:ring-[#5ca131]/20 transition-all duration-300"
              />
              <Button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#5ca131] hover:bg-[#4a8429] text-white rounded-full px-6 py-3 font-semibold transition-all duration-300"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </motion.form>
        </div>
      </motion.div>

      {/* Filter and Sort Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-gray-50 py-6 px-5"
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-[#5ca131]" />
                <span className="text-sm font-semibold text-gray-700">Category:</span>
                <select
                  value={selectedCategoryId}
                  onChange={handleCategoryChange}
                  className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm font-medium focus:border-[#5ca131] focus:ring-1 focus:ring-[#5ca131]/10 bg-white"
                >
                  <option value="">All Categories</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                {sortOrder === "-created_at" ? (
                  <SortDesc className="h-5 w-5 text-[#5ca131]" />
                ) : (
                  <SortAsc className="h-5 w-5 text-[#5ca131]" />
                )}
                <span className="text-sm font-semibold text-gray-700">Sort:</span>
                <select
                  value={sortOrder}
                  onChange={handleSortChange}
                  className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm font-medium focus:border-[#5ca131] focus:ring-1 focus:ring-[#5ca131]/10 bg-white"
                >
                  <option value="-created_at">Latest First</option>
                  <option value="created_at">Oldest First</option>
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
              <Button
                onClick={() => setViewMode('grid')}
                variant="ghost"
                className={`p-2 h-auto rounded-md transition-all duration-300 ${
                  viewMode === 'grid'
                    ? 'bg-[#5ca131] text-white hover:bg-[#5ca131]'
                    : 'text-gray-500 hover:text-[#5ca131] hover:bg-gray-100'
                }`}
              >
                <Grid3X3 className="h-5 w-5" />
              </Button>
              <Button
                onClick={() => setViewMode('list')}
                variant="ghost"
                className={`p-2 h-auto rounded-md transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-[#5ca131] text-white hover:bg-[#5ca131]'
                    : 'text-gray-500 hover:text-[#5ca131] hover:bg-gray-100'
                }`}
              >
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col justify-center items-center min-h-[60vh]"
            >
              <Loader2 className="h-16 w-16 text-[#5ca131] animate-spin mb-4" />
              <p className="mt-4 text-lg text-gray-600 font-medium">Loading...</p>
            </motion.div>
          ) : blogs.length === 0 ? (
            <motion.div
              key="no-blogs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No blogs found</h3>
              <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
                Try adjusting your search or filter criteria.
              </p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategoryId("");
                  setCurrentPage(1);
                  router.push(pathname);
                }}
                className="bg-[#5ca131] hover:bg-[#4a8429] text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300"
              >
                Clear All Filters
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="blogs"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="px-5"
            >
              {/* Results Info */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4"
              >
                <div className="flex items-center gap-2">
                  <p className="text-base text-gray-700 font-medium">
                    Showing <span className="text-[#5ca131] font-bold text-lg">{blogs.length}</span> of
                    <span className="text-[#5ca131] font-bold text-lg"> {totalCount}</span> articles
                  </p>
                </div>
                {searchTerm && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-gray-600 text-sm">Results for:</span>
                    <Badge className="bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1 font-medium rounded-full">
                      {searchTerm}
                    </Badge>
                  </motion.div>
                )}
              </motion.div>

              {/* Blog Content */}
              {viewMode === 'grid' ? (
                <motion.div
                  variants={containerVariants}
                  className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8"
                >
                  {renderBlogCards}
                </motion.div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  className="space-y-6"
                >
                  {renderListView}
                </motion.div>
              )}

              {/* Pagination */}
              {(nextPage || previousPage) && (
                <motion.div
                  variants={itemVariants}
                  className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 mt-12"
                >
                  <Button
                    variant="outline"
                    onClick={handlePreviousPage}
                    disabled={!previousPage || loading}
                    className="w-full sm:w-auto border border-gray-300 hover:border-[#5ca131] hover:text-[#5ca131] disabled:opacity-50 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300"
                  >
                    <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                    Previous
                  </Button>
                  <span className="text-gray-500 text-sm font-medium">Page {currentPage}</span>
                  <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={!nextPage || loading}
                    className="w-full sm:w-auto border border-gray-300 hover:border-[#5ca131] hover:text-[#5ca131] disabled:opacity-50 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BlogListClient;