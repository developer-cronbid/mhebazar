// src/app/[category]/CategoryPageClient.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductListing, { Product } from "@/components/products/ProductListing";
import Breadcrumb from "@/components/elements/Breadcrumb";
import api from "@/lib/api";

// Helper function to format slugs to display names
const formatNameFromSlug = (slug: string): string => {
  return slug.replace(/-/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

interface CategoryPageClientProps {
  params: { category: string; subcategory?: string };
  initialProducts: Product[];
  totalCount: number;
  activeCategoryName: string | null;
  activeTypeName: string | null;
  initialMinPrice: string | '';
  initialMaxPrice: string | '';
  initialManufacturer: string | null;
  initialRating: number | null;
  initialSortBy: string;
}

const PRODUCT_TYPE_CHOICES = ["new", "used", "rental", "attachments"];

export default function CategoryOrTypePageClient({
  params,
  initialProducts,
  totalCount,
  activeCategoryName,
  activeTypeName,
  initialMinPrice,
  initialMaxPrice,
  initialManufacturer,
  initialRating,
  initialSortBy,
}: CategoryPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlParamSlug: string = params.category;
  const subcategoryParamSlug: string | undefined = params.subcategory;

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [totalProducts, setTotalProducts] = useState<number>(totalCount);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noProductsFoundMessage, setNoProductsFoundMessage] = useState<string | null>(
    initialProducts.length === 0 ? `No products found for "${activeCategoryName || activeTypeName}" with the selected filters.` : null
  );
  const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState<number>(Math.ceil(totalCount / 12));
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(
    new Set<string>([activeCategoryName, activeTypeName].filter(Boolean) as string[])
  );

  // Filter states (controlled by URL)
  const [minPrice, setMinPrice] = useState<number | ''>(Number(initialMinPrice) || '');
  const [maxPrice, setMaxPrice] = useState<number | ''>(Number(initialMaxPrice) || '');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(initialManufacturer);
  const [selectedRating, setSelectedRating] = useState<number | null>(initialRating);
  const [sortBy, setSortBy] = useState<string>(initialSortBy);

  // Effect to re-fetch products when URL search params change
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      setIsLoading(true);
      setNoProductsFoundMessage(null);
      setErrorMessage(null);

      const queryParams = new URLSearchParams(searchParams.toString());
      
      try {
        const response = await api.get(`/products/?${queryParams.toString()}`);
        const data = response.data;
        
        const transformedProducts = data.results.map((p: any) => ({
            id: p.id.toString(),
            image: p.images.length > 0 ? p.images[0].image : "/placeholder-product.jpg",
            title: p.name,
            subtitle: p.description,
            price: parseFloat(p.price),
            currency: "₹",
            category_name: p.category_name,
            subcategory_name: p.subcategory_name,
            direct_sale: p.direct_sale,
            is_active: p.is_active,
            hide_price: p.hide_price,
            stock_quantity: p.stock_quantity,
            manufacturer: p.manufacturer,
            average_rating: p.average_rating,
            type: p.type,
            category_id: p.category,
            model: p.model,
            user_name: p.user_name,
            created_at: p.created_at,
        }));
        
        setProducts(transformedProducts);
        setTotalProducts(data.count);
        setTotalPages(Math.ceil(data.count / 12));
        if (transformedProducts.length === 0) {
            setNoProductsFoundMessage(`No products found with the selected filters.`);
        }
      } catch (err) {
        setErrorMessage("Failed to load products.");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch if a filter state has changed, and not on initial load
    if (
      Number(searchParams.get('page')) !== currentPage ||
      searchParams.get('min_price') !== String(minPrice) ||
      searchParams.get('max_price') !== String(maxPrice) ||
      searchParams.get('search') !== selectedManufacturer ||
      searchParams.get('average_rating') !== String(selectedRating) ||
      searchParams.get('sort_by') !== sortBy
    ) {
      fetchFilteredProducts();
    }
  }, [searchParams, currentPage, minPrice, maxPrice, selectedManufacturer, selectedRating, sortBy]);

  const handleFilterChange = useCallback((
    filterValue: string | number,
    filterType: "category" | "subcategory" | "type" | "price_range" | "manufacturer" | "rating" | "sort_by",
    newValue?: string | number | { min: number | ""; max: number | ""; } | null
  ) => {
    const currentPath = `/${urlParamSlug}${subcategoryParamSlug ? `/${subcategoryParamSlug}` : ''}`;
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('page', '1');

    if (filterType === "category" || filterType === "subcategory" || filterType === "type") {
      const formattedFilterSlug = String(filterValue).toLowerCase().replace(/\s+/g, '-');
      ['min_price', 'max_price', 'search', 'average_rating', 'sort_by'].forEach(p => newSearchParams.delete(p));
      
      let newPath = "";
      if (filterType === "category" || filterType === "type") {
        newPath = `/${formattedFilterSlug}`;
      } else if (filterType === "subcategory" && activeCategoryName) {
        const currentCategorySlug = activeCategoryName.toLowerCase().replace(/\s+/g, '-');
        newPath = `/${currentCategorySlug}/${formattedFilterSlug}`;
      }
      router.push(`${newPath}?${newSearchParams.toString()}`);
    } else {
      if (filterType === "price_range" && typeof newValue === 'object' && newValue !== null) {
        const { min, max } = newValue as { min: number | '', max: number | '' };
        min === '' ? newSearchParams.delete('min_price') : newSearchParams.set('min_price', String(min));
        max === '' ? newSearchParams.delete('max_price') : newSearchParams.set('max_price', String(max));
      } else if (filterType === "manufacturer") {
        newValue ? newSearchParams.set('search', String(newValue)) : newSearchParams.delete('search');
      } else if (filterType === "rating") {
        newValue ? newSearchParams.set('average_rating', String(newValue)) : newSearchParams.delete('average_rating');
      } else if (filterType === "sort_by" && typeof filterValue === 'string') {
        filterValue === 'relevance' ? newSearchParams.delete('sort_by') : newSearchParams.set('sort_by', filterValue);
      }
      router.push(`${currentPath}?${newSearchParams.toString()}`);
    }
  }, [urlParamSlug, subcategoryParamSlug, activeCategoryName, router, searchParams]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('page', page.toString());
    const currentPath = `/${urlParamSlug}${subcategoryParamSlug ? `/${subcategoryParamSlug}` : ''}`;
    router.push(`${currentPath}?${newSearchParams.toString()}`);
  }, [urlParamSlug, subcategoryParamSlug, router, searchParams]);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('page', '1');
    value === 'relevance' ? newSearchParams.delete('sort_by') : newSearchParams.set('sort_by', value);
    const currentPath = `/${urlParamSlug}${subcategoryParamSlug ? `/${subcategoryParamSlug}` : ''}`;
    router.push(`${currentPath}?${newSearchParams.toString()}`);
  }, [urlParamSlug, subcategoryParamSlug, router, searchParams]);

  const breadcrumbItems = [{ label: "Home", href: "/" }];
  if (activeCategoryName) {
    breadcrumbItems.push({ label: activeCategoryName, href: `/${urlParamSlug}` });
    if (params.subcategory) {
      breadcrumbItems.push({ label: formatNameFromSlug(params.subcategory), href: `/${urlParamSlug}/${params.subcategory}` });
    }
  } else if (activeTypeName) {
    breadcrumbItems.push({ label: activeTypeName, href: `/${urlParamSlug}` });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
        <p className="ml-4 text-gray-600">Loading products...</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />
      <ProductListing
        products={products}
        title={activeCategoryName || activeTypeName || "All Products"}
        totalCount={totalProducts}
        onFilterChange={handleFilterChange}
        selectedFilters={selectedFilters}
        selectedCategoryName={activeCategoryName}
        selectedSubcategoryName={null} // Subcategory is not on this page
        selectedTypeName={activeTypeName}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        noProductsMessage={noProductsFoundMessage}
        minPrice={minPrice}
        maxPrice={maxPrice}
        selectedManufacturer={selectedManufacturer}
        selectedRating={selectedRating}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        pageUrlType={urlParamSlug}
      />
    </>
  );
}