// src/app/vendor-listing/[vendor]/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams, notFound } from "next/navigation";
import ProductListing from "@/components/products/ProductListing";
import { Product } from "@/types";
import Breadcrumb from "@/components/elements/Breadcrumb";
import VendorBanner from "@/components/vendor-listing/VendorBanner";
import api from "@/lib/api";
import { AxiosError } from "axios";

// --- Helper Functions ---
const formatNameFromSlug = (slug: string): string => {
  if (!slug) return '';
  return slug.replace(/-/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const slugify = (str: string): string =>
  str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

// NEW HELPER: Reverses the slugify process
const normalizeVendorSlug = (str: string): string => {
  return decodeURIComponent(str)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
};

// --- API Response and Type Interfaces ---
// These interfaces should be in a global types file in a real app
interface VendorDetails {
  id: number;
  user_info: {
    id: number;
    username: string;
    profile_photo: string | null;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    role: string | null;
    description: string | null;
    date_joined: string;
    is_active: boolean;
  };
  user_banner: { id: number; image: string }[];
  company_name: string;
  company_email: string;
  company_address: string;
  company_phone: string;
  brand: string;
  pcode: string | null;
  gst_no: string | null;
  application_date: string;
  is_approved: boolean;
}

interface UserProfile {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  description: string;
  phone: string;
  address: string | null;
  profile_photo: string | null;
  user_banner: { id: number; image: string }[];
}

interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface ApiProduct {
  id: number;
  name: string;
  description: string;
  images: { id: number; image: string }[];
  price: string;
  direct_sale: boolean;
  is_active: boolean;
  hide_price: boolean;
  stock_quantity: number;
  manufacturer: string;
  average_rating: number;
  type: string;
  category: number;
  category_name: string;
  subcategory: number | null;
  subcategory_name: string | null;
  model: string | null;
  user_name: string;
}

export default function VendorPage({ params }: { params: { vendor: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const normalizedVendorSlug = useMemo(() => normalizeVendorSlug(params.vendor), [params.vendor]);

  // --- State for Data and Loading ---
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [vendorDetails, setVendorDetails] = useState<VendorDetails | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [noProductsFoundMessage, setNoProductsFoundMessage] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set<string>());

  // --- Derived State from URL Search Params ---
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

  // Syncs search input with the URL on load or URL change
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // --- DATA FETCHING (COMBINED LOGIC) ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setNoProductsFoundMessage(null);

      let fetchedVendorDetails: VendorDetails | null = null;
      let fetchedUserProfile: UserProfile | null = null;

      try {
        // Step 1: Fetch Vendor details using the slug
        const vendorResponse = await api.get<VendorDetails>(`/vendor/by-slug/${normalizedVendorSlug}/`);
        fetchedVendorDetails = vendorResponse.data;
        
        if (!fetchedVendorDetails) {
          notFound();
          return;
        }

        // Step 2: Fetch User Profile using the ID from vendor details
        const userProfileResponse = await api.get<UserProfile>(`/users/${fetchedVendorDetails.user_info.id}/`);
        fetchedUserProfile = userProfileResponse.data;
        
      } catch (err: unknown) {
        console.error("[Vendor Page] Failed to fetch vendor context:", err);
        if (err instanceof AxiosError && err.response?.status === 404) {
          notFound();
        } else {
          setError("Failed to load vendor details. Please try again later.");
        }
        setIsLoading(false);
        return; // Exit if the first two fetches fail
      }

      setVendorDetails(fetchedVendorDetails);
      setUserProfile(fetchedUserProfile);

      // Step 3: Fetch products using the user_id obtained from the previous call
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("user", fetchedVendorDetails.user_info.id.toString());
        queryParams.append("page", currentPage.toString());

        const currentSelectedFilters = new Set<string>();
        if (categorySlug) {
          const formattedCatName = formatNameFromSlug(categorySlug);
          const catResponse = await api.get<any>(`/categories/?name=${formattedCatName}`);
          const category = catResponse.data[0];
          if (category) {
            queryParams.append("category", category.id.toString());
            currentSelectedFilters.add(category.name);
            if (subcategorySlug) {
              const subcategory = category.subcategories.find(sub => slugify(sub.name) === subcategorySlug);
              if (subcategory) {
                queryParams.append("subcategory", subcategory.id.toString());
                currentSelectedFilters.add(subcategory.name);
              }
            }
          }
        }
        if (typeSlug) currentSelectedFilters.add(formatNameFromSlug(typeSlug));
        setSelectedFilters(currentSelectedFilters);

        if (searchQuery) queryParams.append("search", searchQuery);
        if (typeSlug) queryParams.append("type", typeSlug);
        if (minPrice !== '') queryParams.append("min_price", minPrice.toString());
        if (maxPrice !== '') queryParams.append("max_price", maxPrice.toString());
        if (rating !== null) queryParams.append("average_rating", rating.toString());
        if (sortBy && sortBy !== "relevance") {
          const sortParam = sortBy === "price_asc" ? "price" : sortBy === "price_desc" ? "-price" : "-created_at";
          queryParams.append("ordering", sortParam);
        }

        const response = await api.get<ApiResponse<ApiProduct>>(`/products/?${queryParams.toString()}`);

        const transformedProducts: Product[] = response.data.results.map((p) => ({
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
        }));

        setProducts(transformedProducts);
        setTotalProducts(response.data.count);
        setTotalPages(Math.ceil(response.data.count / 12));

        if (response.data.count === 0) {
          setNoProductsFoundMessage("No products found for this vendor with the selected filters.");
        }
      } catch (err: unknown) {
        console.error("[Vendor Page] Failed to fetch products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [normalizedVendorSlug, searchParams]);

  // --- EVENT HANDLERS ---
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("page", "1");
    searchInput ? newSearchParams.set("search", searchInput) : newSearchParams.delete("search");
    router.push(`${window.location.pathname}?${newSearchParams.toString()}`);
  };

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
    }
    router.push(`${window.location.pathname}?${newSearchParams.toString()}`);
  }, [router, searchParams]);

  const handleSortChange = (value: string) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("page", "1");
    value === "relevance" ? newSearchParams.delete("sort_by") : newSearchParams.set("sort_by", value);
    router.push(`${window.location.pathname}?${newSearchParams.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("page", page.toString());
    router.push(`${window.location.pathname}?${newSearchParams.toString()}`);
  };

  // --- RENDER LOGIC ---
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading Vendor...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  }

  if (!vendorDetails) {
    return <div className="flex justify-center items-center min-h-screen">Vendor not found.</div>;
  }

  const bannerImageUrls = userProfile?.user_banner?.map(b => b.image) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-4 py-2">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Vendors", href: "/vendor-listing" },
            { label: vendorDetails.company_name, href: `/vendor-listing/${normalizedVendorSlug}` },
          ]}
        />
        {userProfile && (
          <VendorBanner
            company_name={vendorDetails.company_name}
            brand={vendorDetails.brand}
            description={userProfile.description || "No description available."}
            profile_photo={userProfile.profile_photo || "/images/default_profile.png"}
            productCount={totalProducts}
            bannerImages={bannerImageUrls.length > 0 ? bannerImageUrls : ['/images/default_banner.jpg']}
          />
        )}
        <ProductListing
          products={products}
          title={`Products from ${vendorDetails.company_name}`}
          totalCount={totalProducts}
          onFilterChange={handleFilterChange}
          selectedFilters={selectedFilters}
          selectedCategoryName={formatNameFromSlug(categorySlug || '')}
          selectedSubcategoryName={formatNameFromSlug(subcategorySlug || '')}
          selectedTypeName={formatNameFromSlug(typeSlug || '')}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          noProductsMessage={noProductsFoundMessage}
          minPrice={minPrice}
          maxPrice={maxPrice}
          selectedManufacturer={null}
          selectedRating={rating}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          showManufacturerFilter={false}
        />
      </div>
    </div>
  );
}