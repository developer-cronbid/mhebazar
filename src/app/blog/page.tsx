import React, { Suspense } from "react";
import BlogListClient from "./BlogListClient";
import { Loader2 } from "lucide-react";

interface BlogListPageProps {
  searchParams: { 
    search?: string;
    blog_category?: string;
    ordering?: string;
  };
}

const BlogListPage: React.FC<BlogListPageProps> = ({ searchParams }) => {
  const searchTerm = searchParams.search || "";
  const selectedCategoryId = searchParams.blog_category || "";
  const sortOrder = searchParams.ordering || "-created_at";

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