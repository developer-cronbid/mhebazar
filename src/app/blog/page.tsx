import React, { Suspense } from "react";
import BlogListClient from "./BlogListClient";
import { Loader2 } from "lucide-react";
import { motion as m } from "framer-motion";

const BlogListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  const searchTerm = searchParams.search as string || "";
  const selectedCategoryId = searchParams.blog_category as string || "";
  const sortOrder = searchParams.ordering as string || "-created_at";

  return (
    <Suspense
      fallback={
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen bg-white flex items-center justify-center p-6"
        >
          <Loader2 className="h-16 w-16 text-[#5ca131] animate-spin" />
        </m.div>
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