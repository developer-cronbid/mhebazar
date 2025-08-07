"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import axios from "axios";

// ====================
// Types (Unchanged)
// ====================
interface ApiProduct {
  id: number;
  name: string;
  images: { image: string }[];
}

interface Category {
  id?: string;
  title: string;
  subtitle: string;
  mainImage: string;
  mainLabel: string;
  note: string;
  products: {
    image: string;
    label: string;
  }[];
}

// ====================
// Data Transformation (Slightly Modified)
// ====================
const transformApiData = (apiProducts: ApiProduct[]): Category[] => {
  if (!apiProducts || apiProducts.length === 0) {
    return [];
  }

  const mainProduct = apiProducts[0];
  // UPDATED: Get all other products (2nd to last) for the carousel
  const otherProducts = apiProducts.slice(1);

  const getPrimaryImageUrl = (product: ApiProduct): string =>
    product.images?.[0]?.image || "/images/placeholder.png"; // A safe placeholder

  const transformedCategory: Category = {
    id: "most-popular",
    title: "Most Popular",
    subtitle: "Our Top Selling Product",
    mainImage: getPrimaryImageUrl(mainProduct),
    mainLabel: mainProduct.name,
    note: "*Based on user activity",
    products: otherProducts.map((p) => ({
      image: getPrimaryImageUrl(p),
      label: p.name,
    })),
  };

  return [transformedCategory];
};


// ====================
// Main Component (Rendering Logic Changed)
// ====================
export default function MostPopular() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainImageError, setMainImageError] = useState(false); // New state for main image error

  const fetchData = useCallback(async () => {
    // This data fetching logic remains the same
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await axios.get<ApiProduct[]>(
        `${baseUrl}/products/most_popular/`
      );
      const apiProducts = res.data;
      if (Array.isArray(apiProducts) && apiProducts.length > 0) {
        const formattedData = transformApiData(apiProducts);
        setCategories(formattedData);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unknown error while fetching"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <LoadingSkeleton />;

  const popularData = categories[0];

  // If no popular data or main image fails to load, show fallback
  if (!popularData || mainImageError) {
    return (
      <section className="w-full sm:px-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
            Top Selling Products
          </h2>
        </div>
        <p className="text-center text-gray-500 p-8 border rounded-lg">No popular products to display.</p>
      </section>
    );
  }

  // Component to handle individual carousel item rendering and image error
  const CarouselProductItem = ({ product, idx }: { product: { image: string; label: string; }; idx: number }) => {
    const [itemImageError, setItemImageError] = useState(false);

    if (itemImageError) {
      return null; // Don't render this carousel item if its image fails
    }

    return (
      <CarouselItem key={idx} className="pl-2 basis-1/2 sm:basis-1/3 md:basis-1/4">
        <div className="p-1">
          <Card className="p-3 flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-shadow duration-200 h-full">
            <div className="relative w-28 h-28 mb-3">
              <Image
                src={product.image}
                alt={product.label}
                fill
                sizes="112px"
                className="object-contain"
                onError={() => setItemImageError(true)} // Set error state if image fails
              />
            </div>
            <p className="text-sm font-semibold h-10 leading-tight flex items-center justify-center">
              {product.label}
            </p>
          </Card>
        </div>
      </CarouselItem>
    );
  };


  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Most Popular
        </h2>
        <a href="/products" className="text-green-600 text-sm font-medium hover:underline">
          View more
        </a>
      </div>

      {/* Main Container */}
      <div className="p-4 sm:p-6 border border-gray-200 rounded-xl bg-white shadow-sm">

        {/* --- Top Fixed Product (Two-column layout) --- */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-8 p-4 bg-gray-50 rounded-lg">
          {/* Main Image */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex-shrink-0">
            <Image
              src={popularData.mainImage}
              alt={popularData.mainLabel}
              fill
              sizes="(max-width: 768px) 192px, 224px"
              className="object-contain"
              onError={() => setMainImageError(true)} // Set error state for main image
            />
          </div>
          {/* Main Details */}
          <div className="text-center md:text-left flex-1">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              {popularData.mainLabel}
            </h3>
            <p className="text-md sm:text-lg text-gray-500 font-medium">{popularData.subtitle}</p>
            <p className="text-xs text-gray-500 mt-4">{popularData.note}</p>
          </div>
        </div>

        {/* --- Carousel for Other Popular Products --- */}
        <h4 className="text-md font-semibold text-gray-700 mb-4">Also Popular</h4>
        <Carousel
          opts={{ align: "start", loop: true }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {popularData.products.map((product, idx) => (
              <CarouselProductItem key={idx} product={product} idx={idx} />
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-[-10px] sm:left-[-20px]" />
          <CarouselNext className="absolute right-[-10px] sm:right-[-20px]" />
        </Carousel>

        {error && (
          <p className="mt-4 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            Error: {error}. Could not load latest data.
          </p>
        )}
      </div>
    </section>
  );
}


// ====================
// Skeleton Loader (Unchanged)
// ====================
function LoadingSkeleton() {
  return (
    <div className="w-full sm:px-6">
      <div className="flex justify-between items-center mb-4">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
      </div>
      <div className="w-full p-6 border border-gray-200 rounded-lg bg-white animate-pulse">
        <div className="flex flex-col md:flex-row items-center gap-12 mb-8">
          <div className="w-56 h-56 bg-gray-200 rounded-lg" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
        <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
        <div className="h-48 bg-gray-200 rounded" />
      </div>
    </div>
  );
}