// src/app/[category]/[subcategory]/SubcategoryPageClient.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductListing, { Product } from "@/components/products/ProductListing";
import Breadcrumb from "@/components/elements/Breadcrumb";
import api from "@/lib/api";

// Helper function to create a URL-friendly slug
const slugify = (str: string): string =>
  str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

// Define props for the client component
interface SubcategoryPageClientProps {
  initialProducts: Product[];
  totalCount: number;
  validCategoryName: string | null;
  validSubcategoryName: string | null;
  initialMinPrice: string | '';
  initialMaxPrice: string | '';
  initialManufacturer: string | null;
  initialRating: number | null;
  initialSortBy: string;
}

export default function SubcategoryPageClient({
  initialProducts,
  totalCount,
  validCategoryName,
  validSubcategoryName,
  initialMinPrice,
  initialMaxPrice,
  initialManufacturer,
  initialRating,
  initialSortBy,
}: SubcategoryPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [totalProducts, setTotalProducts] = useState<number>(totalCount);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noProductsFoundMessage, setNoProductsFoundMessage] = useState<string | null>(
    initialProducts.length === 0 ? `No products found with the selected filters.` : null
  );
  const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState<number>(Math.ceil(totalCount / 12));

  // Filter states
  const [minPrice, setMinPrice] = useState<number | ''>(Number(initialMinPrice) || '');
  const [maxPrice, setMaxPrice] = useState<number | ''>(Number(initialMaxPrice) || '');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(initialManufacturer);
  const [selectedRating, setSelectedRating] = useState<number | null>(initialRating);
  const [sortBy, setSortBy] = useState<string>(initialSortBy);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(
    new Set<string>([validCategoryName, validSubcategoryName].filter(Boolean) as string[])
  );

  const productCache = useRef(new Map());

  // This useEffect will be triggered by filter/sort/page changes
  useEffect(() => {
    // We already have the initial products, so only re-fetch on changes
    const fetchFilteredProducts = async () => {
      const urlCategorySlug = slugify(validCategoryName || "");
      const urlSubcategorySlug = slugify(validSubcategoryName || "");

      setIsLoading(true);
      setNoProductsFoundMessage(null);

      try {
        const queryParams = new URLSearchParams(searchParams.toString());
        
        const cacheKey = queryParams.toString();
        if (productCache.current.has(cacheKey)) {
          // Use cached data to avoid redundant API calls
          const cachedData = productCache.current.get(cacheKey);
          let transformedProducts = cachedData.results.map((p: any) => ({
            // ... (product mapping logic) ...
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

          if (validCategoryName?.toLowerCase().includes('spare parts')) {
            transformedProducts = transformedProducts.sort((a, b) => {
              const aIsMHE = a.manufacturer?.toLowerCase().includes("mhe");
              const bIsMHE = b.manufacturer?.toLowerCase().includes("mhe");
              if (aIsMHE && !bIsMHE) return -1;
              if (!aIsMHE && bIsMHE) return 1;
              return 0;
            });
          }
          
          setProducts(transformedProducts);
          setTotalProducts(cachedData.count);
          setTotalPages(Math.ceil(cachedData.count / 12));
          if (transformedProducts.length === 0) {
            setNoProductsFoundMessage(`No products found with the selected filters.`);
          }
          setIsLoading(false);
          return;
        }

        const response = await api.get(`/products/?${queryParams.toString()}`);
        const data = response.data;
        
        let transformedProducts = data.results.map((p: any) => ({
          // ... (product mapping logic) ...
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
        if (validCategoryName?.toLowerCase().includes('spare parts')) {
          transformedProducts = transformedProducts.sort((a, b) => {
            const aIsMHE = a.manufacturer?.toLowerCase().includes("mhe");
            const bIsMHE = b.manufacturer?.toLowerCase().includes("mhe");
            if (aIsMHE && !bIsMHE) return -1;
            if (!aIsMHE && bIsMHE) return 1;
            return 0;
          });
        }
        productCache.current.set(cacheKey, data);
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
    
    // Don't re-fetch on initial load, only when search params change
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
  }, [searchParams, currentPage, minPrice, maxPrice, selectedManufacturer, selectedRating, sortBy, validCategoryName, validSubcategoryName]);

  const handleFilterChange = useCallback((
    filterValue: string | number,
    filterType: "category" | "subcategory" | "type" | "price_range" | "manufacturer" | "rating" | "sort_by",
    newValue?: string | number | { min: number | ""; max: number | ""; } | null | undefined
  ) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('page', '1');

    if (filterType === "category" || filterType === "subcategory" || filterType === "type") {
      const formattedFilterSlug = slugify(String(filterValue));
      ['min_price', 'max_price', 'search', 'average_rating', 'sort_by'].forEach(p => newSearchParams.delete(p));
      
      let newPath = '';
      if (filterType === "category" || filterType === "type") {
        newPath = `/${formattedFilterSlug}`;
      } else if (filterType === "subcategory" && validCategoryName) {
        newPath = `/${slugify(validCategoryName)}/${formattedFilterSlug}`;
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
      const currentPath = `/${slugify(validCategoryName || "")}/${slugify(validSubcategoryName || "")}`;
      router.push(`${currentPath}?${newSearchParams.toString()}`);
    }
  }, [router, searchParams, validCategoryName, validSubcategoryName]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('page', page.toString());
    const currentPath = `/${slugify(validCategoryName || "")}/${slugify(validSubcategoryName || "")}`;
    router.push(`${currentPath}?${newSearchParams.toString()}`);
  }, [router, searchParams, validCategoryName, validSubcategoryName]);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('page', '1');
    value === 'relevance' ? newSearchParams.delete('sort_by') : newSearchParams.set('sort_by', value);
    const currentPath = `/${slugify(validCategoryName || "")}/${slugify(validSubcategoryName || "")}`;
    router.push(`${currentPath}?${newSearchParams.toString()}`);
  }, [router, searchParams, validCategoryName, validSubcategoryName]);
  
  const breadcrumbItems = [
    { label: "Home", href: "/" },
  ];
  if (validCategoryName) {
    breadcrumbItems.push({ label: validCategoryName, href: `/${slugify(validCategoryName)}` });
  }
  if (validSubcategoryName) {
    breadcrumbItems.push({ label: validSubcategoryName, href: `/${slugify(validCategoryName)}/${slugify(validSubcategoryName)}` });
  }

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />
      <ProductListing
        products={products}
        title={validSubcategoryName || validCategoryName || "Products"}
        totalCount={totalProducts}
        onFilterChange={handleFilterChange}
        selectedFilters={selectedFilters}
        selectedCategoryName={validCategoryName}
        selectedSubcategoryName={validSubcategoryName}
        selectedTypeName={null}
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
        showManufacturerFilter={true}
      />
    </>
  );
}