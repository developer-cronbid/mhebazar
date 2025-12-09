import React, { Suspense } from "react";
import BlogListClient from "./BlogListClient";
import { Loader2 } from "lucide-react";

interface BlogListPageProps {
  searchParams: Promise<{ 
    search?: string;
    blog_category?: string;
    ordering?: string;
  }>;
}

const BlogListPage: React.FC<BlogListPageProps> = async ({ searchParams }) => {
  const { search: searchTerm = "", blog_category: selectedCategoryId = "", ordering: sortOrder = "-created_at" } = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <Loader2 className="h-16 w-16 text-[#5ca131] animate-spin" />
        </div>
      }
    >
      <BlogListClient 
        initialSearchTerm={searchTerm}
        initialCategoryId={selectedCategoryId}
        initialSortOrder={sortOrder}
      />
    </Suspense>
  );
};

export default BlogListPage;