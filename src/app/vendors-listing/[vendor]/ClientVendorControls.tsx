// src/app/vendors-listing/[vendor]/ClientVendorControls.tsx
"use client";

import { useMemo, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductListing from "@/components/products/ProductListing";
import { Product } from "@/types";

// --- Helper Functions ---
const formatNameFromSlug = (slug: string): string => {
  if (!slug) return '';
  return slug.replace(/-/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const slugify = (str: string): string =>
  str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

// Props are the initial data fetched on the server
export default function ClientVendorControls({
  initialProducts,
  totalCount,
  totalPages,
  noProductsMessage,
}: {
  initialProducts: Product[];
  totalCount: number;
  totalPages: number;
  noProductsMessage: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive state from URL search params for the UI
  const {
    currentPage,
    sortBy,
    searchQuery,
    categorySlug,
    subcategorySlug,
    typeSlug,
    minPrice,
    maxPrice,
    rating,
  } = useMemo(() => {
    return {
      currentPage: parseInt(searchParams.get("page") || "1", 10),
      sortBy: searchParams.get("sort_by") || "relevance",
      searchQuery: searchParams.get("search") || "",
      categorySlug: searchParams.get("category") || null,
      subcategorySlug: searchParams.get("subcategory") || null,
      typeSlug: searchParams.get("type") || null,
      minPrice: searchParams.get("min_price") ? Number(searchParams.get("min_price")) : '',
      maxPrice: searchParams.get("max_price") ? Number(searchParams.get("max_price")) : '',
      rating: searchParams.get("average_rating") ? Number(searchParams.get("average_rating")) : null,
    };
  }, [searchParams]);

  // Determine selected filters for the UI
  const selectedFilters = useMemo(() => {
    const filters = new Set<string>();
    if (categorySlug) filters.add(formatNameFromSlug(categorySlug));
    if (subcategorySlug) filters.add(formatNameFromSlug(subcategorySlug));
    if (typeSlug) filters.add(formatNameFromSlug(typeSlug));
    return filters;
  }, [categorySlug, subcategorySlug, typeSlug]);

  // --- EVENT HANDLERS ---
  const handleFilterChange = useCallback((
    filterValue: string | number,
    filterType: "category" | "subcategory" | "type" | "price_range" | "manufacturer" | "rating",
    newValue?: string | number | { min: number | ""; max: number | "" } | null
  ) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('page', '1');

    const updateOrDeleteParam = (param: string, value: any) => {
      value ? newSearchParams.set(param, String(value)) : newSearchParams.delete(param);
    };

    switch (filterType) {
      case 'category':
        updateOrDeleteParam('category', newValue ? slugify(String(newValue)) : null);
        newSearchParams.delete('subcategory');
        break;
      case 'subcategory':
        updateOrDeleteParam('subcategory', newValue ? slugify(String(newValue)) : null);
        break;
      case 'type':
        updateOrDeleteParam('type', filterValue);
        break;
      case 'price_range':
        const range = newValue as { min: number | '', max: number | '' } | null;
        updateOrDeleteParam('min_price', range?.min);
        updateOrDeleteParam('max_price', range?.max);
        break;
      case 'rating':
        updateOrDeleteParam('average_rating', newValue);
        break;
      // 'manufacturer' case is intentionally omitted as it's not used on this page
    }
    router.push(`${window.location.pathname}?${newSearchParams.toString()}`);
  }, [router, searchParams]);

  const handleSortChange = useCallback((value: string) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("page", "1");
    value === "relevance" ? newSearchParams.delete("sort_by") : newSearchParams.set("sort_by", value);
    router.push(`${window.location.pathname}?${newSearchParams.toString()}`);
  }, [router, searchParams]);

  const handlePageChange = useCallback((page: number) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("page", page.toString());
    router.push(`${window.location.pathname}?${newSearchParams.toString()}`);
  }, [router, searchParams]);

  return (
    <ProductListing
      products={initialProducts}
      title="Vendor Products"
      totalCount={totalCount}
      onFilterChange={handleFilterChange}
      selectedFilters={selectedFilters}
      selectedCategoryName={formatNameFromSlug(categorySlug || '')}
      selectedSubcategoryName={formatNameFromSlug(subcategorySlug || '')}
      selectedTypeName={formatNameFromSlug(typeSlug || '')}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      noProductsMessage={noProductsMessage}
      minPrice={minPrice}
      maxPrice={maxPrice}
      selectedManufacturer={null} // Explicitly null
      selectedRating={rating}
      sortBy={sortBy}
      onSortChange={handleSortChange}
      showManufacturerFilter={false}
    />
  );
}