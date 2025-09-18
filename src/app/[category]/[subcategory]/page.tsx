/* eslint-disable @typescript-eslint/no-unused-expressions */
// src/app/[category]/[subcategory]/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams, notFound } from "next/navigation";
import ProductListing, { Product } from "@/components/products/ProductListing";
import Breadcrumb from "@/components/elements/Breadcrumb";
import api from "@/lib/api";

// Helper function to format slugs to display names
const formatNameFromSlug = (slug: string): string => {
  return slug.replace(/-/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Helper function to create a URL-friendly slug
const slugify = (str: string): string =>
  str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

// Define API data structures
interface ApiSubcategory {
  id: number;
  name: string;
  category_name: string;
  category: number;
  meta_title: string | null;
  meta_description: string | null;
}

interface ApiCategory {
  id: number;
  name: string;
  subcategories: ApiSubcategory[];
  meta_title: string | null;
  meta_description: string | null;
}

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

interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface RouteContext {
  category: string | null;
  subcategory: string | null;
  categoryId: number | null;
  subcategoryId: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

export default function SubCategoryPage({
  params,
}: {
  params: { category: string; subcategory: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlCategorySlug: string = params.category;
  const urlSubcategorySlug: string = params.subcategory;

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

  const [validCategoryName, setValidCategoryName] = useState<string | null>(null);
  const [validSubcategoryName, setValidSubcategoryName] = useState<string | null>(null);

  // Use a ref for a simple in-memory cache to avoid re-fetching data
  const productCache = useRef(new Map());

  // Validate category and subcategory existence and hierarchy
  const validateRouteAndGetIds = useCallback(async (
    catSlug: string,
    subcatSlug: string
  ): Promise<RouteContext> => {
    const formattedCatName = formatNameFromSlug(catSlug);
    const formattedSubcatName = formatNameFromSlug(subcatSlug);

    try {
      const categoryResponse = await api.get<ApiCategory[]>(`/categories/?name=${formattedCatName}`);
      const category = categoryResponse.data[0];

      if (!category) {
        setErrorMessage(`Category "${formattedCatName}" not found.`);
        return { category: null, subcategory: null, categoryId: null, subcategoryId: null, metaTitle: null, metaDescription: null };
      }

      const subcategory = category.subcategories.find((sub: ApiSubcategory) =>
        slugify(sub.name) === slugify(formattedSubcatName)
      );

      if (!subcategory) {
        setErrorMessage(`Subcategory "${formattedSubcatName}" not found under category "${formattedCatName}".`);
        return { category: null, subcategory: null, categoryId: null, subcategoryId: null, metaTitle: null, metaDescription: null };
      }

      setValidCategoryName(category.name);
      setValidSubcategoryName(subcategory.name);
      setSelectedFilters(new Set<string>([category.name, subcategory.name]));

      return {
        category: category.name,
        subcategory: subcategory.name,
        categoryId: category.id,
        subcategoryId: subcategory.id,
        metaTitle: subcategory.meta_title,
        metaDescription: subcategory.meta_description,
      };

    } catch (err: unknown) {
      console.error("[Subcategory Page] Error validating route:", err);
      setErrorMessage("An error occurred while validating the path.");
      return { category: null, subcategory: null, categoryId: null, subcategoryId: null, metaTitle: null, metaDescription: null };
    }
  }, []);

  // Fetch products based on validated category and subcategory IDs and filters
  const fetchProductsData = useCallback(async (
    categoryId: number,
    subcategoryId: number,
    page: number,
    minPriceFilter: number | '',
    maxPriceFilter: number | '',
    manufacturerFilter: string | null,
    ratingFilter: number | null,
    sortByFilter: string,
    categoryName: string // Pass the name to apply special sorting
  ) => {
    setIsLoading(true);
    setNoProductsFoundMessage(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append("category", categoryId.toString());
      queryParams.append("subcategory", subcategoryId.toString());
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

      // 1. Caching Check: Create a cache key from the query params
      const cacheKey = queryParams.toString();
      if (productCache.current.has(cacheKey)) {
        const cachedData = productCache.current.get(cacheKey);

        let transformedProducts = cachedData.results.map((p: ApiProduct) => ({
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

        // 2. Conditional Sorting: Give priority to MHE products if the category is 'Spare Parts'
        if (categoryName.toLowerCase().includes('spare parts')) {
          transformedProducts = transformedProducts.sort((a, b) => {
            const aIsMHE = a.manufacturer?.toLowerCase().includes("mhe");
            const bIsMHE = b.manufacturer?.toLowerCase().includes("mhe");

            if (aIsMHE && !bIsMHE) return -1;
            if (!aIsMHE && bIsMHE) return 1;
            return 0; // Keep the original order for other products
          });
        }

        if (transformedProducts.length === 0) {
          setNoProductsFoundMessage(`No products found with the selected filters.`);
        }

        setProducts(transformedProducts);
        setTotalProducts(cachedData.count);
        setTotalPages(Math.ceil(cachedData.count / 12));
        setIsLoading(false);
        return;
      }

      // 3. API Request: If not in cache, fetch from the API
      const response = await api.get<ApiResponse<ApiProduct>>(`/products/?${queryParams.toString()}`);

      if (response.data && response.data.results) {
        if (response.data.results.length === 0) {
          setNoProductsFoundMessage(`No products found with the selected filters.`);
        }

        let transformedProducts: Product[] = response.data.results.map((p: ApiProduct) => ({
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

        // 4. Conditional Sorting: Apply special sorting to MHE products if the category is 'Spare Parts'
        if (categoryName.toLowerCase().includes('spare parts')) {
          transformedProducts = transformedProducts.sort((a, b) => {
            const aIsMHE = a.manufacturer?.toLowerCase().includes("mhe");
            const bIsMHE = b.manufacturer?.toLowerCase().includes("mhe");

            if (aIsMHE && !bIsMHE) return -1;
            if (!aIsMHE && bIsMHE) return 1;
            return 0;
          });
        }

        // 5. Caching: Store the new data in the cache
        productCache.current.set(cacheKey, response.data);

        setProducts(transformedProducts);
        setTotalProducts(response.data.count);
        setTotalPages(Math.ceil(response.data.count / 12));

      } else {
        setNoProductsFoundMessage(`Failed to load products. Unexpected API response structure.`);
        setProducts([]);
      }
    } catch (err: unknown) {
      console.error("[Subcategory Page] Failed to fetch products:", err);
      setErrorMessage("Failed to load products. An API error occurred.");
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

  // Main effect to validate route and fetch data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const { category, subcategory, categoryId, subcategoryId, metaTitle, metaDescription } = await validateRouteAndGetIds(
        urlCategorySlug,
        urlSubcategorySlug
      );

      if (category && subcategory && categoryId !== null && subcategoryId !== null) {
        // Set metadata from the validated route data
        setMetaTitle(metaTitle || `${subcategory} Products | MHE Bazar`);
        setMetaDescription(metaDescription || `Browse our wide range of ${subcategory} products and equipment.`);

        await fetchProductsData(
          categoryId,
          subcategoryId,
          currentPage,
          minPrice,
          maxPrice,
          selectedManufacturer,
          selectedRating,
          sortBy,
          category // Pass the category name to fetch function
        );
      } else {
        setIsLoading(false);
        if (errorMessage) {
          // Render error message from state
          return;
        }
        // If no error message set, it's a 404
        notFound();
      }
    };
    loadData();
  }, [
    urlCategorySlug,
    urlSubcategorySlug,
    currentPage,
    validateRouteAndGetIds,
    fetchProductsData,
    minPrice,
    maxPrice,
    selectedManufacturer,
    selectedRating,
    sortBy,
    errorMessage
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

  const handleFilterChange = useCallback((
    filterValue: string | number,
    filterType: "category" | "subcategory" | "type" | "price_range" | "manufacturer" | "rating" | "sort_by",
    newValue?: string | number | { min: number | ""; max: number | ""; } | null | undefined
  ) => {
    const currentPath = `/${urlCategorySlug}/${urlSubcategorySlug}`;
    const newSearchParams = new URLSearchParams(searchParams.toString());

    if (filterType === "category" || filterType === "subcategory" || filterType === "type") {
      let newPath = "";
      const formattedFilterSlug = slugify(String(filterValue));

      newSearchParams.delete('min_price');
      newSearchParams.delete('max_price');
      newSearchParams.delete('search');
      newSearchParams.delete('average_rating');
      newSearchParams.delete('sort_by');
      newSearchParams.set('page', '1');

      if (filterType === "category") {
        newPath = `/${formattedFilterSlug}`;
      } else if (filterType === "subcategory") {
        newPath = `/${urlCategorySlug}/${formattedFilterSlug}`;
      } else if (filterType === "type") {
        newPath = `/${formattedFilterSlug}`;
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

      newSearchParams.set('page', '1');
      router.push(`${currentPath}?${newSearchParams.toString()}`);
    }
  }, [urlCategorySlug, urlSubcategorySlug, router, searchParams]);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
  ];
  if (validCategoryName) {
    breadcrumbItems.push({ label: validCategoryName, href: `/${slugify(validCategoryName)}` });
  }
  if (validSubcategoryName) {
    breadcrumbItems.push({ label: validSubcategoryName, href: `/${slugify(validCategoryName)}/${slugify(validSubcategoryName)}` });
  }

  const handlePageChange = (page: number) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('page', page.toString());
    router.push(`/${urlCategorySlug}/${urlSubcategorySlug}?${newSearchParams.toString()}`);
  };

  const handleSortChange = (value: string) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('page', '1');
    value === 'relevance' ? newSearchParams.delete('sort_by') : newSearchParams.set('sort_by', value);
    router.push(`/${urlCategorySlug}/${urlSubcategorySlug}?${newSearchParams.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
        <p className="ml-4 text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Page Not Found</h2>
        <p className="text-gray-700 text-lg">{errorMessage}</p>
      </div>
    );
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
        sortBy={sortBy}
        onSortChange={handleSortChange}
        showManufacturerFilter={true}
      />
    </>
  );
}