// src/app/vendor-listing/[vendor]/page.tsx

// This is a Server Component by default. No "use client" directive here.

import ProductListing from "@/components/products/ProductListing";
import { Product } from "@/types";
import Breadcrumb from "@/components/elements/Breadcrumb";
import VendorBanner from "@/components/vendor-listing/VendorBanner";
import api from "@/lib/api";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import ClientVendorControls from "./ClientVendorControls"; // New Client Component

// --- Helper Functions ---
const formatNameFromSlug = (slug: string): string => {
  if (!slug) return '';
  return slug.replace(/-/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const slugify = (str: string): string =>
  str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

// --- API Response and Type Interfaces ---
interface VendorDetails {
  id: number;
  user_id: number;
  username: string;
  company_name: string;
  brand: string;
}

interface UserProfile {
  id: number;
  description: string | null;
  profile_photo: string | null;
  user_banner: { id: number; image: string }[];
}

interface ApiSubcategory {
  id: number;
  name: string;
}

interface ApiCategory {
  id: number;
  name: string;
  subcategories: ApiSubcategory[];
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
}

interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// --- SERVER-SIDE DATA FETCHING WITH CACHING ---
const getVendorAndProfileData = unstable_cache(
  async (vendorSlug: string) => {
    try {
      const vendorResponse = await api.get<ApiResponse<VendorDetails>>(`/vendor/?brand=${vendorSlug}`);
      const vendorData = vendorResponse.data?.results?.[0];

      if (!vendorData) {
        notFound();
      }

      const userProfileResponse = await api.get<UserProfile>(`/users/${vendorData.user_id}/`);
      return { vendorData, userProfile: userProfileResponse.data };
    } catch (err: unknown) {
      console.error("[Vendor Page] Failed to fetch vendor context:", err);
      notFound();
    }
  },
  ['vendor-and-profile-data'],
  { revalidate: 3600 } // Cache for 1 hour.
);

const getVendorProducts = unstable_cache(
  async (userId: number, searchParams: URLSearchParams) => {
    const queryParams = searchParams;
    queryParams.append("user", userId.toString());

    // Category and Subcategory handling
    const categorySlug = queryParams.get("category");
    if (categorySlug) {
      try {
        const formattedCatName = formatNameFromSlug(categorySlug);
        const catResponse = await api.get<ApiCategory[]>(`/categories/?name=${formattedCatName}`);
        const category = catResponse.data[0];
        if (category) {
          queryParams.set("category", category.id.toString());
          const subcategorySlug = queryParams.get("subcategory");
          if (subcategorySlug) {
            const subcategory = category.subcategories.find(sub => slugify(sub.name) === subcategorySlug);
            if (subcategory) {
              queryParams.set("subcategory", subcategory.id.toString());
            } else {
              queryParams.delete("subcategory");
            }
          }
        } else {
          queryParams.delete("category");
          queryParams.delete("subcategory");
        }
      } catch (e) {
        console.error(`Could not resolve category ID for slug: ${categorySlug}`, e);
        queryParams.delete("category");
        queryParams.delete("subcategory");
      }
    }

    // Handle sorting
    const sortBy = queryParams.get("sort_by");
    if (sortBy && sortBy !== "relevance") {
      const sortParam = sortBy === "price_asc" ? "price" : sortBy === "price_desc" ? "-price" : "-created_at";
      queryParams.set("ordering", sortParam);
    }

    try {
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

      const totalProducts = response.data.count;
      const totalPages = Math.ceil(totalProducts / 12);
      const noProductsFoundMessage = totalProducts === 0 ? "No products found for this vendor with the selected filters." : null;

      return { products: transformedProducts, totalProducts, totalPages, noProductsFoundMessage };
    } catch (err) {
      console.error("[Vendor Page] Failed to fetch products:", err);
      return { products: [], totalProducts: 0, totalPages: 1, noProductsFoundMessage: "Failed to load products. Please try again later." };
    }
  },
  ['vendor-products'],
  { revalidate: 60 } // Cache for 1 minute.
);

// Main Component - Now a Server Component that fetches data
export default async function VendorPage({ params, searchParams }: { params: { vendor: string }, searchParams: { [key: string]: string | string[] | undefined } }) {
  const { vendor: vendorSlug } = params;

  // Fetch vendor details first to get user_id
  const { vendorData, userProfile } = await getVendorAndProfileData(vendorSlug);

  // **THE FIX:** Create a new URLSearchParams object correctly from the searchParams object
  const cleanSearchParams = new URLSearchParams();
  for (const key in searchParams) {
    const value = searchParams[key];
    if (Array.isArray(value)) {
      value.forEach(v => cleanSearchParams.append(key, v));
    } else if (typeof value === 'string') {
      cleanSearchParams.append(key, value);
    }
  }

  // Then pass the correctly constructed object to the data-fetching function
  const productsData = await getVendorProducts(vendorData.user_id, cleanSearchParams);

  const { products, totalProducts, totalPages, noProductsFoundMessage } = productsData;

  const bannerImageUrls = userProfile?.user_banner?.map(b => b.image) || [];
  const descriptionContent = userProfile?.description || `Discover high-quality products from **${vendorData.company_name}**.`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-4 py-2">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Vendors", href: "/vendor-listing" },
            { label: vendorData.company_name, href: `/vendor-listing/${vendorSlug}` },
          ]}
        />
        {userProfile && (
          <VendorBanner
            company_name={vendorData.company_name}
            brand={vendorData.brand}
            description={descriptionContent}
            profile_photo={userProfile.profile_photo || "/images/default_profile.png"}
            productCount={totalProducts}
            bannerImages={bannerImageUrls.length > 0 ? bannerImageUrls : ['/images/default_banner.jpg']}
          />
        )}

        {/* The client-side controls are now in their own component */}
        <ClientVendorControls
          initialProducts={products}
          totalCount={totalProducts}
          totalPages={totalPages}
          noProductsMessage={noProductsFoundMessage}
        />
      </div>
    </div>
  );
}