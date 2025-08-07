// src/app/blog/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, User, ArrowRight, Loader2, Filter, SortDesc, SortAsc } from "lucide-react";
import api from "@/lib/api";

interface Blog {
  id: number;
  blog_title: string;
  blog_category_id: number; // Storing the original ID
  blog_category_name: string; // New field for the name
  image1: string | null;
  image2: string | null;
  description: string;
  description1: string;
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

const BlogListPage: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [previousPage, setPreviousPage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // New state for filtering and sorting
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("-created_at"); // Default to latest first

  // A memoized function to fetch data to prevent unnecessary re-creations
  const fetchBlogs = useCallback(async (page: number, search: string, categoryId: string, order: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all categories to create a lookup map
      const categoriesResponse = await api.get<Category[]>("/categories/");
      setCategories(categoriesResponse.data);
      const categoryMap = new Map<number, string>();
      categoriesResponse.data.forEach((cat) => {
        categoryMap.set(cat.id, cat.name);
      });

      let url = `/blogs/?page=${page}`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (categoryId) {
        url += `&blog_category=${categoryId}`;
      }
      if (order) {
        url += `&ordering=${order}`;
      }

      const response = await api.get<BlogResponse>(url);
      
      const enrichedBlogs = response.data.results.map((blog: any) => ({
        ...blog,
        blog_category_id: blog.blog_category,
        blog_category_name: categoryMap.get(blog.blog_category) || "Uncategorized",
      }));

      setBlogs(enrichedBlogs);
      setTotalCount(response.data.count);
      setNextPage(response.data.next);
      setPreviousPage(response.data.previous);
    } catch (err) {
      console.error("Error fetching blogs:", err);
      setError("Failed to load blogs. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs(currentPage, searchTerm, selectedCategoryId, sortOrder);
  }, [currentPage, searchTerm, selectedCategoryId, sortOrder, fetchBlogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (nextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (previousPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const stripHtml = (html: string) => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => fetchBlogs(currentPage, searchTerm, selectedCategoryId, sortOrder)}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              MHE Bazar Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover insights, tips, and industry knowledge about material handling equipment
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mt-8">
            <div className="flex items-center space-x-2">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search blogs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-24 py-3 text-lg"
                />
              </div>
              <Button type="submit" className="shrink-0" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Filter and Sort Section */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 bg-white border-b flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by:</span>
          <select
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-md border border-gray-300 py-1 pl-3 pr-8 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          {sortOrder === "-created_at" ? (
            <SortDesc className="h-5 w-5 text-gray-500" />
          ) : (
            <SortAsc className="h-5 w-5 text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-md border border-gray-300 py-1 pl-3 pr-8 text-sm"
          >
            <option value="-created_at">Latest First</option>
            <option value="created_at">Oldest First</option>
          </select>
        </div>
      </div>


      {/* Blog Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No blogs found.</p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-8">
              <p className="text-gray-600">
                Showing {blogs.length} of {totalCount} blogs
              </p>
            </div>

            {/* Blog Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => {
                const filename = blog.image1?.split('/').pop() || null;
                const imageUrl = getImageUrl(filename, imageError[blog.id] || false);

                return (
                  <Card key={blog.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="relative overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={blog.blog_title}
                        width={400}
                        height={250}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => handleImageError(blog.id)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {blog.blog_category_name}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(blog.created_at)}
                        </div>
                      </div>
                      
                      <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {blog.blog_title}
                      </h2>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                        {blog.description1 || stripHtml(blog.description).substring(0, 150) + "..."}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        {blog.author_name && (
                          <div className="flex items-center text-sm text-gray-500">
                            <User className="h-4 w-4 mr-1" />
                            {blog.author_name}
                          </div>
                        )}
                        
                        <Link href={`/blog/${blog.blog_url}`}>
                          <Button variant="outline" size="sm" className="group/btn">
                            Read More
                            <ArrowRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {(nextPage || previousPage) && (
              <div className="flex justify-center items-center space-x-4 mt-12">
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={!previousPage || loading}
                >
                  Previous
                </Button>
                
                <span className="text-gray-600">
                  Page {currentPage}
                </span>
                
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={!nextPage || loading}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BlogListPage;