/* eslint-disable @typescript-eslint/no-unused-expressions */
// src/app/[category]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, notFound } from "next/navigation";
import ProductListing, { Product } from "@/components/products/ProductListing";
import Breadcrumb from "@/components/elements/Breadcrumb";
import api from "@/lib/api";
import { AxiosError } from "axios";

// Helper function to format slugs to display names
const formatNameFromSlug = (slug: string): string => {
  return slug.replace(/-/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Define API data structures
interface ApiProduct {
  id: number;
  category_name: string;
  subcategory_name: string;
  images: { id: number; image: string }[];
  name: string;
  description: string;
  price: string;
  direct_sale: boolean;
  type: string;
  is_active: boolean;
  hide_price: boolean;
  stock_quantity: number;
  manufacturer: string;
  average_rating: number | null;
  category: number | null;
  model: string | null;
  user_name: string | null;
  created_at: string;
}

interface ApiSubcategory {
  id: number;
  name: string;
  category_name: string;
  sub_image: string | null;
  sub_banner: string | null;
  product_count: number;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  category: number;
}

interface ApiCategory {
  id: number;
  name: string;
  subcategories: ApiSubcategory[];
  cat_image: string | null;
  cat_banner: string | null;
  product_count: number;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  product_details: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Validation context return type
interface RouteContext {
  type: 'category' | 'subcategory' | 'type' | 'invalid';
  name: string | null;
  subName: string | null;
  id: number | null;
  subId: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
}


const PRODUCT_TYPE_CHOICES = ["new", "used", "rental", "attachments"];

export default function CategoryOrTypePage({
  params,
}: {
  params: { category: string; subcategory?: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlParamSlug: string = params.category;
  const subcategoryParamSlug: string | undefined = params.subcategory;

  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noProductsFoundMessage, setNoProductsFoundMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set<string>());

  // Filter states
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('relevance');

  // Page metadata states
  const [metaTitle, setMetaTitle] = useState<string>('');
  const [metaDescription, setMetaDescription] = useState<string>('');

  const [activeCategoryName, setActiveCategoryName] = useState<string | null>(null);
  const [activeSubcategoryName, setActiveSubcategoryName] = useState<string | null>(null);
  const [activeTypeName, setActiveTypeName] = useState<string | null>(null);

  // Validate the URL parameter against categories and product types
  const validateRouteContext = useCallback(async (paramSlug: string, subParamSlug?: string): Promise<RouteContext> => {
    setActiveCategoryName(null);
    setActiveSubcategoryName(null);
    setActiveTypeName(null);
    setErrorMessage(null);
    setMetaTitle('');
    setMetaDescription('');

    const formattedParamName = formatNameFromSlug(paramSlug);
    const formattedSubParamName = subParamSlug ? formatNameFromSlug(subParamSlug) : null;

    // 1. Check if it's a product type
    if (PRODUCT_TYPE_CHOICES.includes(paramSlug)) {
      if (subParamSlug) {
        return { type: 'invalid', name: null, subName: null, id: null, subId: null, metaTitle: null, metaDescription: null };
      }
      setActiveTypeName(formattedParamName);
      setSelectedFilters(new Set<string>([formattedParamName]));
      // No metadata for types, or default can be set here
      const defaultTitle = `${formattedParamName} Products | MHE Bazar`;
      const defaultDescription = `Browse our selection of ${formattedParamName} products.`;
      return { type: 'type', name: formattedParamName, subName: null, id: null, subId: null, metaTitle: defaultTitle, metaDescription: defaultDescription };
    }

    // 2. Check if it's a valid category or subcategory
    try {
      const categoryResponse = await api.get<ApiCategory[]>(`/categories/?name=${formattedParamName}`);
      const categories = categoryResponse.data;

      if (categories && categories.length > 0) {
        const category = categories[0];
        setActiveCategoryName(category.name);

        if (formattedSubParamName) {
          const subcategory = category.subcategories.find(
            sub => sub.name.toLowerCase() === formattedSubParamName.toLowerCase()
          );

          if (subcategory) {
            setActiveSubcategoryName(subcategory.name);
            setSelectedFilters(new Set<string>([category.name, subcategory.name]));
            return {
              type: 'subcategory',
              name: category.name,
              subName: subcategory.name,
              id: category.id,
              subId: subcategory.id,
              metaTitle: subcategory.meta_title,
              metaDescription: subcategory.meta_description
            };
          } else {
            return { type: 'invalid', name: null, subName: null, id: null, subId: null, metaTitle: null, metaDescription: null };
          }
        } else {
          setSelectedFilters(new Set<string>([category.name]));
          return {
            type: 'category',
            name: category.name,
            subName: null,
            id: category.id,
            subId: null,
            metaTitle: category.meta_title,
            metaDescription: category.meta_description
          };
        }
      }
    } catch (err) {
      console.error("[Category/Type Page] Failed to check category existence:", err);
    }

    return { type: 'invalid', name: null, subName: null, id: null, subId: null, metaTitle: null, metaDescription: null };
  }, []);

  // Fetch products based on the determined context and filters
  const fetchProductsData = useCallback(async (
    contextType: 'category' | 'subcategory' | 'type',
    contextName: string,
    contextSubName: string | null,
    categoryId: number | null,
    subcategoryId: number | null,
    page: number,
    minPriceFilter: number | '',
    maxPriceFilter: number | '',
    manufacturerFilter: string | null,
    ratingFilter: number | null,
    sortByFilter: string
  ) => {
    setIsLoading(true);
    setNoProductsFoundMessage(null);

    try {
      const queryParams = new URLSearchParams();

      if (contextType === 'subcategory' && subcategoryId) {
        queryParams.append("subcategory", subcategoryId.toString());
      } else if (contextType === 'category' && categoryId) {
        queryParams.append("category", categoryId.toString());
      } else if (contextType === 'type') {
        if (contextName.toLowerCase() === 'rental') {
          // New Logic: When on the rental page, fetch both 'rental' and 'used' products
          queryParams.append("type", "rental");
          queryParams.append("type", "used");
        } else {
          queryParams.append("type", contextName.toLowerCase());
        }
      }

      queryParams.append("page", page.toString());

      if (minPriceFilter !== '') queryParams.append("min_price", minPriceFilter.toString());
      if (maxPriceFilter !== '') queryParams.append("max_price", maxPriceFilter.toString());
      if (ratingFilter !== null) queryParams.append("average_rating", ratingFilter.toString());

      if (manufacturerFilter) queryParams.append("search", manufacturerFilter);

      if (sortByFilter && sortByFilter !== 'relevance') {
        let sortParam = '';
        if (sortByFilter === 'price_asc') sortParam = 'price';
        else if (sortByFilter === 'price_desc') sortParam = '-price';
        else if (sortByFilter === 'newest') sortParam = '-created_at';
        if (sortParam) queryParams.append("ordering", sortParam);
      }

      const response = await api.get<ApiResponse<ApiProduct>>(
        `/products/?${queryParams.toString()}`
      );

      if (response.data && response.data.results) {
        if (response.data.results.length === 0) {
          setNoProductsFoundMessage(`No products found for "${contextSubName || contextName}" with the selected filters.`);
        }

        const transformedProducts: Product[] = response.data.results.map((p: ApiProduct) => ({
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
          created_at: p.created_at
        }));

        setProducts(transformedProducts);
        setTotalProducts(response.data.count);
        setTotalPages(Math.ceil(response.data.count / 12));
      } else {
        setNoProductsFoundMessage(`Failed to load products. Unexpected API response structure.`);
        setProducts([]);
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        setErrorMessage(`Failed to load products. API error: ${err.message}`);
      } else {
        setErrorMessage(`Failed to load products. An unknown error occurred.`);
      }
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to apply filters from URL search params on initial load
  useEffect(() => {
    const minP = searchParams.get('min_price');
    const maxP = searchParams.get('max_price');
    const manufacturer = searchParams.get('search');
    const rating = searchParams.get('average_rating');
    const sort = searchParams.get('sort_by');
    const page = searchParams.get('page');

    if (minP) setMinPrice(Number(minP));
    if (maxP) setMaxPrice(Number(maxP));
    if (manufacturer) setSelectedManufacturer(manufacturer);
    if (rating) setSelectedRating(Number(rating));
    if (sort) setSortBy(sort);
    if (page) setCurrentPage(Number(page));
  }, [searchParams]);

  // Main effect to determine context and fetch data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const context = await validateRouteContext(urlParamSlug, subcategoryParamSlug);

      if (context.type !== 'invalid' && context.name) {
        // Set metadata based on the fetched context
        setMetaTitle(context.metaTitle || `${context.subName || context.name} Products | MHE Bazar`);
        setMetaDescription(context.metaDescription || `Browse our wide range of ${context.subName || context.name} products and equipment.`);

        await fetchProductsData(
          context.type as 'category' | 'subcategory' | 'type',
          context.name,
          context.subName,
          context.id,
          context.subId,
          currentPage,
          minPrice,
          maxPrice,
          selectedManufacturer,
          selectedRating,
          sortBy
        );
      } else {
        setIsLoading(false);
        notFound(); // Trigger Next.js 404
      }
    };
    loadData();
  }, [
    urlParamSlug,
    subcategoryParamSlug,
    currentPage,
    validateRouteContext,
    fetchProductsData,
    minPrice,
    maxPrice,
    selectedManufacturer,
    selectedRating,
    sortBy,
  ]);

  // Effect to handle dynamic meta title and description updates
  useEffect(() => {
    if (metaTitle) {
      document.title = metaTitle;
    }
    if (metaDescription) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', metaDescription);
    }
  }, [metaTitle, metaDescription]);


  // Handle filter changes
  const handleFilterChange = useCallback((
    filterValue: string | number,
    filterType: "category" | "subcategory" | "type" | "price_range" | "manufacturer" | "rating" | "sort_by",
    newValue?: string | number | { min: number | ""; max: number | ""; } | null
  ) => {
    const currentPath = `/${urlParamSlug}${subcategoryParamSlug ? `/${subcategoryParamSlug}` : ''}`;
    const newSearchParams = new URLSearchParams(searchParams.toString());

    if (filterType === "category" || filterType === "subcategory" || filterType === "type") {
      let newPath = "";
      const formattedFilterSlug = String(filterValue).toLowerCase().replace(/\s+/g, '-');

      ['min_price', 'max_price', 'search', 'average_rating', 'sort_by'].forEach(p => newSearchParams.delete(p));
      newSearchParams.set('page', '1');

      setMinPrice('');
      setMaxPrice('');
      setSelectedManufacturer(null);
      setSelectedRating(null);
      setSortBy('relevance');
      setCurrentPage(1);

      if (filterType === "category" || filterType === "type") {
        newPath = `/${formattedFilterSlug}`;
      } else if (filterType === "subcategory") {
        const currentCategorySlug = activeCategoryName?.toLowerCase().replace(/\s+/g, '-');
        newPath = currentCategorySlug ? `/${currentCategorySlug}/${formattedFilterSlug}` : `/${formattedFilterSlug}`;
      }

      router.push(`${newPath}?${newSearchParams.toString()}`);

    } else {
      // Handle other filter changes
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

      newSearchParams.set('page', '1');
      router.push(`${currentPath}?${newSearchParams.toString()}`);
    }
  }, [urlParamSlug, subcategoryParamSlug, activeCategoryName, router, searchParams]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('page', page.toString());
    router.push(`/${urlParamSlug}${subcategoryParamSlug ? `/${subcategoryParamSlug}` : ''}?${newSearchParams.toString()}`);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    value === 'relevance' ? newSearchParams.delete('sort_by') : newSearchParams.set('sort_by', value);
    newSearchParams.set('page', '1');
    router.push(`/${urlParamSlug}${subcategoryParamSlug ? `/${subcategoryParamSlug}` : ''}?${newSearchParams.toString()}`);
  };


  const breadcrumbItems = [{ label: "Home", href: "/" }];
  if (activeCategoryName) {
    breadcrumbItems.push({ label: activeCategoryName, href: `/${urlParamSlug}` });
    if (activeSubcategoryName) {
      breadcrumbItems.push({ label: activeSubcategoryName, href: `/${urlParamSlug}/${subcategoryParamSlug}` });
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
        title={activeSubcategoryName || activeCategoryName || activeTypeName || "All Products"}
        totalCount={totalProducts}
        onFilterChange={handleFilterChange}
        selectedFilters={selectedFilters}
        selectedCategoryName={activeCategoryName}
        selectedSubcategoryName={activeSubcategoryName}
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
        // Pass the URL param type to the listing component
        pageUrlType={urlParamSlug}
      />
    </>
  );
}