// src/app/[category]/[subcategory]/page.tsx

import { Metadata } from "next";
import api from "@/lib/api";
import { notFound } from "next/navigation";
import SubcategoryPageClient from "./SubcategoryPageClient";
import { Product } from "@/components/products/ProductListing";

// Helper function to format slugs to display names
const formatNameFromSlug = (slug: string): string => {
  return slug
    .replace(/-/g, " ")
    .split(" ")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
  meta_title?: string;
  meta_description?: string;
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
  created_at: string;
}

interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---------------------------------------------------------------------
// Server-Side Logic for Metadata
// ---------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: { category: string; subcategory: string };
}): Promise<Metadata> {
  const formattedCatName = formatNameFromSlug(params.category);
  const formattedSubcatName = formatNameFromSlug(params.subcategory);

  try {
    const categoryResponse = await api.get<ApiCategory[]>(
      `/categories/?name=${formattedCatName}`
    );
    const category = categoryResponse.data[0];

    if (category) {
      const subcategory = category.subcategories.find(
        (sub: ApiSubcategory) => slugify(sub.name) === slugify(formattedSubcatName)
      );

      if (subcategory) {
        return {
          title: subcategory.meta_title || subcategory.name,
          description:
            subcategory.meta_description ||
            `Explore products in the ${subcategory.name} subcategory under ${category.name} on MHE Bazar.`,
        };
      }
    }
  } catch (err) {
    console.error(
      "[Subcategory Page Metadata] Failed to fetch metadata:",
      err
    );
  }

  // Fallback for invalid or not found routes
  return {
    title: "Page Not Found | MHE Bazar",
    description: "The page you are looking for does not exist.",
  };
}

// ---------------------------------------------------------------------
// Server-Side Component (Fetches initial data and renders client component)
// ---------------------------------------------------------------------
export default async function SubCategoryPage({
  params,
  searchParams,
}: {
  params: { category: string; subcategory: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const formattedCatName = formatNameFromSlug(params.category);
  const formattedSubcatName = formatNameFromSlug(params.subcategory);
  
  let validCategoryName: string | null = null;
  let validSubcategoryName: string | null = null;
  let categoryId: number | null = null;
  let subcategoryId: number | null = null;

  try {
    const categoryResponse = await api.get<ApiCategory[]>(
      `/categories/?name=${formattedCatName}`
    );
    const category = categoryResponse.data[0];

    if (category) {
      const subcategory = category.subcategories.find(
        (sub: ApiSubcategory) => slugify(sub.name) === slugify(formattedSubcatName)
      );
      if (subcategory) {
        validCategoryName = category.name;
        validSubcategoryName = subcategory.name;
        categoryId = category.id;
        subcategoryId = subcategory.id;
      }
    }
  } catch (err) {
    console.error("Failed to validate route:", err);
  }

  if (!categoryId || !subcategoryId) {
    notFound(); // Trigger Next.js 404 page
  }
  
  // FIX: Safely create URLSearchParams from the searchParams object
  const queryParams = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === 'string') {
        queryParams.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach(item => {
          if (typeof item === 'string') {
            queryParams.append(key, item);
          }
        });
      }
    }
  }
  
  queryParams.append("category", categoryId.toString());
  queryParams.append("subcategory", subcategoryId.toString());
  if (!queryParams.get("page")) {
    queryParams.set("page", "1");
  }

  let products: Product[] = [];
  let totalProducts = 0;

  try {
    const response = await api.get<ApiResponse<ApiProduct>>(
      `/products/?${queryParams.toString()}`
    );
    if (response.data && response.data.results) {
      products = response.data.results.map((p: ApiProduct) => ({
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
      totalProducts = response.data.count;
    }
  } catch (err) {
    console.error("Failed to fetch products:", err);
    // You could handle this error differently, but for now, no products will be rendered
  }

  return (
    <SubcategoryPageClient
      initialProducts={products}
      totalCount={totalProducts}
      validCategoryName={validCategoryName}
      validSubcategoryName={validSubcategoryName}
      initialMinPrice={searchParams?.min_price || ''}
      initialMaxPrice={searchParams?.max_price || ''}
      initialManufacturer={searchParams?.search || null}
      initialRating={searchParams?.average_rating ? Number(searchParams.average_rating) : null}
      initialSortBy={searchParams?.sort_by || 'relevance'}
    />
  );
}