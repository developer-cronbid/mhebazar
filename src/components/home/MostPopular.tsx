// src/components/elements/MostPopular.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";

// ====================
// Types (Unchanged)
// ====================
interface ApiProduct {
  id: number;
  name: string;
  images: { image: string }[];
  slug?: string;
}

interface Category {
  id: string | number;
  title: string;
  subtitle: string;
  mainImage: string;
  mainLabel: string;
  note: string;
  slug: string;
  products: {
    id: string | number;
    image: string;
    label: string;
    slug: string;
  }[];
}

// ====================
// Data Transformation (Unchanged)
// ====================
const createSlug = (text: string | undefined) => text ? text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : "#";

const transformApiData = (apiProducts: ApiProduct[]): Category[] => {
  if (!apiProducts || apiProducts.length === 0) {
    return [];
  }

  const mainProduct = apiProducts[0];
  const otherProducts = apiProducts.slice(1);

  const getPrimaryImageUrl = (product: ApiProduct): string =>
    product.images?.[0]?.image || "/images/placeholder.png";

  const transformedCategory: Category = {
    id: mainProduct.id,
    title: "Most Popular",
    subtitle: "Our Top Selling Product",
    mainImage: getPrimaryImageUrl(mainProduct),
    mainLabel: mainProduct.name,
    note: "*Based on user activity",
    slug: createSlug(mainProduct.name),
    products: otherProducts.map((p) => ({
      id: p.id,
      image: getPrimaryImageUrl(p),
      label: p.name,
      slug: createSlug(p.name),
    })),
  };

  return [transformedCategory];
};

// ====================
// Main Component
// ====================
export default function MostPopular() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainImageError, setMainImageError] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // NEW: State and ref for automatic carousel
  const [activePage, setActivePage] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(`${baseUrl}/products/most_popular/`);
      const apiProducts = await response.json();

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

  const popularData = categories[0];
  const visibleProducts = popularData?.products.slice(0, 9) || [];
  const itemsPerPage = 3;
  const itemWidth = 180; // Approximate width of each item + gap
  const totalPages = Math.ceil(visibleProducts.length / itemsPerPage);

  // NEW: Function to start the auto-scroll interval
  const startAutoScroll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setActivePage(prevPage => (prevPage + 1) % totalPages);
    }, 2000); // 2-second interval
  }, [totalPages]);

  // NEW: Effect to manage the lifecycle of the auto-scroll
  useEffect(() => {
    if (totalPages > 1) {
      startAutoScroll();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [totalPages, startAutoScroll]);

  // NEW: Effect to perform the actual scroll when activePage changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: activePage * itemsPerPage * itemWidth,
        behavior: 'smooth',
      });
    }
  }, [activePage, itemsPerPage]);

  // MODIFIED: Dot click handler now sets the page and resets the timer
  const handleDotClick = (pageIndex: number) => {
    setActivePage(pageIndex);
    startAutoScroll(); // Reset interval on user interaction
  };

  if (isLoading) return <LoadingSkeleton />;

  if (!popularData || mainImageError) {
    return (
      <section className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Top Selling Products
          </h2>
        </div>
        <p className="text-center text-gray-500 p-8 border rounded-lg">No popular products to display.</p>
      </section>
    );
  }

  const CarouselProductItem = ({ product, idx }: { product: { image: string; label: string; slug: string; id: string | number; }; idx: number }) => {
    const [itemImageError, setItemImageError] = useState(false);
    if (itemImageError) return null;
    return (
      <div key={idx} className="w-44 flex-shrink-0 mr-4">
        <Link href={`/product/${product.slug}/?id=${product.id}`} className="block">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-4 h-44 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 mb-2">
              <Image
                src={product.image}
                alt={product.label}
                fill
                className="object-contain"
                onError={() => setItemImageError(true)}
              />
            </div>
          </div>
        </Link>
      </div>
    );
  };

  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Top Selling Products
        </h2>
      </div>

      {/* Main Container */}
      <div className="bg-white border rounded-lg p-6">
        {/* Top Section with Main Product */}
        <div className="flex flex-col items-center gap-8 mb-10">
          <div className="w-full">
            <h2 className="text-3xl font-semibold text-black leading-tight mb-1">
              Most Popular
            </h2>
            <p className="text-sm font-normal text-gray-500">
              {popularData.subtitle}
            </p>
          </div>

          <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex-shrink-0">
            <Link href={`/product/${popularData.slug}/?id=${popularData.id}`} passHref>
              <Image
                src={popularData.mainImage}
                alt={popularData.mainLabel}
                fill
                className="object-contain"
                onError={() => setMainImageError(true)}
              />
            </Link>
          </div>
        </div>

        {/* Bottom Products Carousel */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide"
            // REMOVED: onScroll handler is no longer needed
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {visibleProducts.map((product, idx) => (
              <CarouselProductItem key={idx} product={product} idx={idx} />
            ))}
          </div>

          {/* Dots Navigation - MODIFIED */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-4">
              {[...Array(totalPages)].map((_, dotIndex) => (
                <button
                  key={dotIndex}
                  onClick={() => handleDotClick(dotIndex)}
                  className={`w-3 h-3 rounded-full transition-colors duration-300 ${activePage === dotIndex
                      ? "bg-green-600"
                      : "bg-gray-300 hover:bg-gray-400"
                    }`}
                />
              ))}
            </div>
          )}
        </div>

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
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
      </div>
      <div className="w-full p-6 border border-gray-200 rounded-lg bg-white animate-pulse">
        <div className="flex flex-col items-center gap-8 mb-8">
          <div className="w-full">
            <div className="h-10 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="w-64 h-64 sm:w-80 sm:h-80 bg-gray-200 rounded-lg" />
        </div>
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-44 h-44 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}