// src/app/[category]/page.tsx

import { Metadata } from "next";
import api from "@/lib/api";
import { notFound } from "next/navigation";
import CategoryPageClient from "./CategoryPageClient";
import { Product } from "@/components/products/ProductListing";

// Helper function to format slugs to display names
const formatNameFromSlug = (slug: string): string => {
  return slug
    .replace(/-/g, " ")
    .split(" ")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Define API data structures
interface ApiCategory {
  id: number;
  name: string;
  meta_title: string;
  meta_description: string;
  subcategories: { id: number; name: string }[];
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

const PRODUCT_TYPE_CHOICES = ["new", "used", "rental", "attachments"];

// ---------------------------------------------------------------------
// Server-Side Logic for Metadata
// ---------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  const urlParamSlug: string = params.category;
  const formattedParamName = formatNameFromSlug(urlParamSlug);

  if (PRODUCT_TYPE_CHOICES.includes(urlParamSlug)) {
    return {
      title: `${formattedParamName} | MHE Bazar`,
      description: `Browse all our ${formattedParamName.toLowerCase()} products on MHE Bazar.`,
    };
  }

  try {
    const categoryResponse = await api.get<ApiCategory[]>(
      `/categories/?name=${formattedParamName}`
    );
    const category = categoryResponse.data[0];

    if (category) {
      return {
        title: category.meta_title || category.name,
        description:
          category.meta_description ||
          `Explore products in the ${category.name} category on MHE Bazar.`,
      };
    }
  } catch (err) {
    console.error(
      "[Category Page Metadata] Failed to fetch metadata for category:",
      err
    );
  }

  return {
    title: "Page Not Found | MHE Bazar",
    description: "The page you are looking for does not exist.",
  };
}

// ---------------------------------------------------------------------
// Server-Side Component (Fetches initial data and renders client component)
// ---------------------------------------------------------------------
export default async function CategoryOrTypePage({
  params,
  searchParams,
}: {
  params: { category: string; subcategory?: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const urlParamSlug: string = params.category;
  const formattedParamName = formatNameFromSlug(urlParamSlug);

  let activeCategoryName: string | null = null;
  let activeTypeName: string | null = null;
  let categoryId: number | null = null;

  if (PRODUCT_TYPE_CHOICES.includes(urlParamSlug)) {
    activeTypeName = formattedParamName;
  } else {
    try {
      const categoryResponse = await api.get<ApiCategory[]>(
        `/categories/?name=${formattedParamName}`
      );
      const category = categoryResponse.data[0];
      if (category) {
        activeCategoryName = category.name;
        categoryId = category.id;
      }
    } catch (err) {
      console.error("Failed to validate route:", err);
    }
  }

  if (!activeCategoryName && !activeTypeName) {
    notFound();
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
  
  if (categoryId) {
    queryParams.append("category", categoryId.toString());
  } else if (activeTypeName) {
    if (activeTypeName.toLowerCase() === 'rental') {
      queryParams.append("type", "rental");
      queryParams.append("type", "used");
    } else {
      queryParams.append("type", activeTypeName.toLowerCase());
    }
  }
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
  }

  return (
    <CategoryPageClient
      params={params}
      initialProducts={products}
      totalCount={totalProducts}
      activeCategoryName={activeCategoryName}
      activeTypeName={activeTypeName}
      initialMinPrice={searchParams?.min_price || ''}
      initialMaxPrice={searchParams?.max_price || ''}
      initialManufacturer={searchParams?.search || null}
      initialRating={searchParams?.average_rating ? Number(searchParams.average_rating) : null}
      initialSortBy={searchParams?.sort_by || 'relevance'}
    />
  );
}