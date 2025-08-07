// src/app/blog/[blog]/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  User,
  ArrowLeft,
  Share2,
  Bookmark,
  Clock,
  Tag,
  Loader2,
  Menu,
  X,
  ChevronRight,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react";
import api from "@/lib/api";
import parse from "html-react-parser";
import { Element, HTMLReactParserOptions } from "html-react-parser";
import domToReact from "html-react-parser/lib/dom-to-react";

interface Blog {
  id: number;
  blog_title: string;
  blog_category_id: number;
  blog_category_name: string;
  image1: string | null;
  image2: string | null;
  description: string;
  meta_title: string | null;
  description1: string;
  blog_url: string;
  tags: string | null;
  author_name: string | null;
  created_at: string;
  updated_at: string;
}

interface BlogResponse {
  results: any[];
}

interface Category {
  id: number;
  name: string;
}

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

const SingleBlogPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const blogUrl = params.blog as string;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [activeSection, setActiveSection] = useState<string>("");
  const [tocOpen, setTocOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  // Memoize API calls to avoid redundant requests
  const fetchBlog = async () => {
    try {
      setLoading(true);
      setError(null);

      const categoriesResponse = await api.get<Category[]>("/categories/");
      const categoryMap = new Map<number, string>();
      categoriesResponse.data.forEach((cat) => {
        categoryMap.set(cat.id, cat.name);
      });

      const response = await api.get<BlogResponse>(`/blogs/`);
      const foundBlogData = response.data.results.find(
        (b: any) => b.blog_url === blogUrl
      );

      if (foundBlogData) {
        const enrichedBlog: Blog = {
          ...foundBlogData,
          blog_category_id: foundBlogData.blog_category,
          blog_category_name:
            categoryMap.get(foundBlogData.blog_category) || "Uncategorized",
        };
        setBlog(enrichedBlog);
      } else {
        setError("Blog not found");
      }
    } catch (err) {
      console.error("Error fetching blog:", err);
      setError("Failed to load blog. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBlogs = async () => {
    try {
      const response = await api.get<BlogResponse>(`/blogs/?limit=3`);
      setRelatedBlogs(response.data.results.filter((b) => b.blog_url !== blogUrl));
    } catch (err) {
      console.error("Error fetching related blogs:", err);
    }
  };

  useEffect(() => {
    if (blogUrl) {
      fetchBlog();
      fetchRelatedBlogs();
    }
  }, [blogUrl]);

  useEffect(() => {
    if (blog) {
      generateTOC();
    }
  }, [blog]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("[data-toc-id]");
      let currentSection = "";

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          currentSection = section.getAttribute("data-toc-id") || "";
        }
      });
      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [tocItems]);

  const generateTOC = () => {
    if (!contentRef.current) return;
    const headings = contentRef.current.querySelectorAll("h2, h3, h4, h5, h6");
    const items: TOCItem[] = [];
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      const text = heading.textContent || "";
      const id = `heading-${index}`;
      heading.setAttribute("id", id);
      heading.setAttribute("data-toc-id", id);
      items.push({ id, text, level });
    });
    setTocItems(items);
  };

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      setTocOpen(false);
    }
  };

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return "/mhe-logo.png";
    const filename = imagePath.split("/").pop();
    return `/css/asset/blogimg/${filename}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const estimateReadingTime = (html: string) => {
    const text = html.replace(/<[^>]*>/g, "");
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const handleShare = async () => {
    if (navigator.share && blog) {
      try {
        await navigator.share({
          title: blog.blog_title,
          text: blog.description1,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const parseOptions: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (domNode instanceof Element) {
        if (domNode.name === "img") {
          const src = domNode.attribs.src;
          const alt = domNode.attribs.alt || "";
          const filename = src?.split("/").pop() || "";
          const newSrc = `/css/asset/blogimg/${blogUrl}/${filename}`;
          return (
            <div className="my-8 mx-auto max-w-full rounded-2xl overflow-hidden shadow-xl border border-gray-200">
              <Image
                src={newSrc}
                alt={alt}
                width={1200}
                height={600}
                className="w-full h-auto object-cover"
                sizes="(max-width: 768px) 100vw, 700px"
              />
            </div>
          );
        }

        if (domNode.name === "h2") {
          const text = domToReact(domNode.children, parseOptions);
          const id = `toc-h2-${Math.random().toString(36).substring(7)}`;
          return (
            <h2
              id={id}
              data-toc-id={id}
              className="mt-10 mb-4 text-3xl font-extrabold text-gray-900 border-b pb-2"
            >
              {text}
            </h2>
          );
        }
        if (domNode.name === "h3") {
          const text = domToReact(domNode.children, parseOptions);
          const id = `toc-h3-${Math.random().toString(36).substring(7)}`;
          return (
            <h3
              id={id}
              data-toc-id={id}
              className="mt-8 mb-3 text-2xl font-bold text-[#5da031]"
            >
              {text}
            </h3>
          );
        }
        if (domNode.name === "p") {
          return (
            <p className="mb-6 text-lg text-gray-700 leading-relaxed">
              {domToReact(domNode.children, parseOptions)}
            </p>
          );
        }
        if (domNode.name === "a") {
          return (
            <a
              href={domNode.attribs.href}
              className="text-[#5da031] font-semibold hover:underline transition-colors"
            >
              {domToReact(domNode.children, parseOptions)}
            </a>
          );
        }

        if (domNode.name === "ul" || domNode.name === "ol") {
          return (
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 pl-4">
              {domToReact(domNode.children, parseOptions)}
            </ul>
          );
        }

        if (domNode.name === "li") {
          return <li>{domToReact(domNode.children, parseOptions)}</li>;
        }

        if (domNode.name === "pre") {
          return (
            <pre className="my-6 p-4 bg-gray-100 rounded-xl overflow-x-auto text-sm">
              {domToReact(domNode.children, parseOptions)}
            </pre>
          );
        }

        if (domNode.name === "blockquote") {
          return (
            <blockquote className="my-8 p-6 border-l-4 border-[#f1bf25] italic text-xl text-gray-800 bg-[#f1bf25]/10">
              {domToReact(domNode.children, parseOptions)}
            </blockquote>
          );
        }

        if (domNode.name === "table") {
          return (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full divide-y divide-gray-200 rounded-lg shadow overflow-hidden">
                {domToReact(domNode.children, parseOptions)}
              </table>
            </div>
          );
        }

        if (domNode.name === "thead") {
          return (
            <thead className="bg-gray-50">
              {domToReact(domNode.children, parseOptions)}
            </thead>
          );
        }

        if (domNode.name === "tbody") {
          return (
            <tbody className="bg-white divide-y divide-gray-200">
              {domToReact(domNode.children, parseOptions)}
            </tbody>
          );
        }

        if (domNode.name === "tr") {
          return (
            <tr className="hover:bg-gray-50 transition-colors">
              {domToReact(domNode.children, parseOptions)}
            </tr>
          );
        }

        if (domNode.name === "th") {
          return (
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
            >
              {domToReact(domNode.children, parseOptions)}
            </th>
          );
        }

        if (domNode.name === "td") {
          return (
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              {domToReact(domNode.children, parseOptions)}
            </td>
          );
        }
      }
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5fbff] to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#5da031] mx-auto mb-4" />
          <p className="text-gray-600">Loading amazing content...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className=" bg-gradient-to-br from-[#f5fbff] to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">{error || "Blog not found"}</p>
            <div className="space-y-3">
              <Button
                onClick={() => router.back()}
                className="w-full bg-[#5da031] hover:bg-[#4a8728]"
              >
                Go Back
              </Button>
              <Link href="/blog">
                <Button
                  variant="outline"
                  className="w-full border-[#5da031] text-[#5da031] hover:bg-[#5da031] hover:text-white"
                >
                  Browse All Blogs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { blog_title, blog_category_name, created_at, updated_at, description, description1, author_name, tags, image1 } = blog;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5fbff] via-white to-[#f5fbff]">
      {/* Sticky Header */}
      <div className="bg-white shadow-sm border-b-2 border-[#5da031]/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/blog">
            <Button variant="ghost" className="text-[#5da031] hover:bg-[#5da031]/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blogs
            </Button>
          </Link>
          {tocItems.length > 0 && (
            <Button
              onClick={() => setTocOpen(!tocOpen)}
              variant="outline"
              size="sm"
              className="md:hidden border-[#5da031] text-[#5da031]"
            >
              <Menu className="h-4 w-4 mr-2" />
              Contents
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Table of Contents (Desktop) */}
          {tocItems.length > 0 && (
            <div className="hidden lg:block lg:w-64 xl:w-80 flex-shrink-0">
              <div className="sticky top-24">
                <Card className="shadow-xl border-l-4 border-l-[#5da031]">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                      <Menu className="h-5 w-5 mr-2 text-[#5da031]" />
                      Table of Contents
                    </h3>
                    <nav className="space-y-2">
                      {tocItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => scrollToSection(item.id)}
                          className={`block w-full text-left py-2 px-3 rounded-lg transition-all duration-200 ${
                            activeSection === item.id
                              ? "bg-[#5da031] text-white shadow-md"
                              : "text-gray-600 hover:bg-[#5da031]/10 hover:text-[#5da031]"
                          }`}
                          style={{ paddingLeft: `${(item.level - 1) * 16 + 12}px` }}
                        >
                          <span className="text-sm font-medium truncate block">
                            {item.text}
                          </span>
                        </button>
                      ))}
                    </nav>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Table of Contents (Mobile Overlay) */}
          {tocOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
              <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-900">Table of Contents</h3>
                    <Button onClick={() => setTocOpen(false)} variant="ghost" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <nav className="space-y-2">
                    {tocItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`block w-full text-left py-2 px-3 rounded-lg transition-all duration-200 ${
                          activeSection === item.id
                            ? "bg-[#5da031] text-white"
                            : "text-gray-600 hover:bg-[#5da031]/10"
                        }`}
                        style={{ paddingLeft: `${(item.level - 1) * 16 + 12}px` }}
                      >
                        <span className="text-sm font-medium">{item.text}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <article className="flex-1 max-w-full">
            <header className="mb-10">
              <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 border-t-4 border-t-[#5da031]">
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge className="bg-[#5da031] hover:bg-[#4a8728] text-white px-4 py-1">
                    {blog_category_name || "Uncategorized"}
                  </Badge>
                  {tags && (
                    <div className="flex items-center bg-[#f1bf25]/10 text-[#f1bf25] px-3 py-1 rounded-full text-sm">
                      <Tag className="h-3 w-3 mr-1" />
                      <span className="font-medium">{tags}</span>
                    </div>
                  )}
                </div>

                {/* Title and Summary */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 bg-gradient-to-r from-gray-900 to-[#5da031] bg-clip-text text-transparent">
                  {blog_title}
                </h1>
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                  {description1}
                </p>

                {/* Author and Date */}
                <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-gray-600">
                  {author_name && (
                    <div className="flex items-center bg-gray-50 px-3 py-2 rounded-full">
                      <User className="h-4 w-4 mr-2 text-[#5da031]" />
                      <span className="font-medium">{author_name}</span>
                    </div>
                  )}
                  <div className="flex items-center bg-gray-50 px-3 py-2 rounded-full">
                    <Calendar className="h-4 w-4 mr-2 text-[#5da031]" />
                    {created_at && formatDate(created_at)}
                  </div>
                  <div className="flex items-center bg-gray-50 px-3 py-2 rounded-full">
                    <Clock className="h-4 w-4 mr-2 text-[#5da031]" />
                    {description && estimateReadingTime(description)} min read
                  </div>
                </div>

                {/* Engagement and Social Actions */}
                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {Math.floor(Math.random() * 1000) + 100} views
                  </div>
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 mr-1" />
                    {Math.floor(Math.random() * 50) + 10} likes
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Comments
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button
                    onClick={handleShare}
                    className="bg-[#5da031] hover:bg-[#4a8728] text-white"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    onClick={handleBookmark}
                    variant="outline"
                    className={`border-[#f1bf25] ${
                      isBookmarked
                        ? "bg-[#f1bf25] text-white"
                        : "text-[#f1bf25] hover:bg-[#f1bf25] hover:text-white"
                    }`}
                  >
                    <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? "fill-current" : ""}`} />
                    {isBookmarked ? "Saved" : "Save"}
                  </Button>
                </div>
              </div>
            </header>

            {/* Main Image */}
            {image1 && (
              <div className="mb-10">
                <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src={getImageUrl(image1)}
                    alt={blog_title}
                    width={1200}
                    height={600}
                    className="w-full h-auto object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/mhe-logo.png";
                    }}
                    sizes="(max-width: 768px) 100vw, 700px"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </div>
            )}

            {/* Blog Content */}
            <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 mb-10 border-l-4 border-l-[#5da031]">
              <div ref={contentRef} className="blog-content prose max-w-none">
                {description && parse(description, parseOptions)}
              </div>
            </div>

            {/* Footer and Related Blogs */}
            <footer className="bg-white rounded-2xl shadow-xl p-6 mb-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Last updated:</span> {updated_at && formatDate(updated_at)}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    size="sm"
                    className="border-[#5da031] text-[#5da031] hover:bg-[#5da031] hover:text-white"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Article
                  </Button>
                </div>
              </div>
            </footer>

            {/* Related Articles Section */}
            {relatedBlogs.length > 0 && (
              <section className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Related Articles</h2>
                  <p className="text-gray-600">Discover more amazing content</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedBlogs.map((relatedBlog) => (
                    <Link key={relatedBlog.id} href={`/blog/${relatedBlog.blog_url}`}>
                      <Card className="group h-full flex flex-col hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-[#5da031]/20">
                        <div className="relative overflow-hidden rounded-t-lg flex-shrink-0">
                          <Image
                            src={getImageUrl(relatedBlog.image1)}
                            alt={relatedBlog.blog_title}
                            width={400}
                            height={250}
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/mhe-logo.png";
                            }}
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <CardContent className="p-6 flex flex-col flex-grow">
                          <h3 className="font-bold text-gray-900 group-hover:text-[#5da031] transition-colors line-clamp-2 mb-3 text-lg">
                            {relatedBlog.blog_title}
                          </h3>
                          <p className="text-gray-600 line-clamp-2 mb-4 flex-grow">
                            {relatedBlog.description1}
                          </p>
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(relatedBlog.created_at)}
                            </div>
                            <ChevronRight className="h-4 w-4 text-[#5da031] group-hover:translate-x-1 transition-transform duration-200" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>
        </div>
      </div>
    </div>
  );
};

export default SingleBlogPage;