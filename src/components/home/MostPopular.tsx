"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";

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
// Data Transformation (Slightly Modified)
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
// Main Component (Rendering Logic Changed)
// ====================
export default function MostPopular() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainImageError, setMainImageError] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollIndex, setScrollIndex] = useState(0);

  const fetchData = useCallback(async () => {
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

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const firstChild = scrollContainerRef.current.children[0] as HTMLElement;
      if (firstChild) {
        const itemWidth = firstChild.clientWidth + 16;
        const newIndex = Math.round(scrollLeft / itemWidth);
        setScrollIndex(newIndex);
      }
    }
  };

  const handleDotClick = (index: number) => {
    if (scrollContainerRef.current) {
      const firstChild = scrollContainerRef.current.children[0] as HTMLElement;
      if (firstChild) {
        const itemWidth = firstChild.clientWidth + 16;
        scrollContainerRef.current.scrollTo({
          left: index * itemWidth,
          behavior: 'smooth',
        });
      }
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  const popularData = categories[0];

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
  const CarouselProductItem = ({ product, idx }: { product: { image: string; label: string; slug: string; id: string | number; }; idx: number }) => {
    const [itemImageError, setItemImageError] = useState(false);

    if (itemImageError) {
      return null;
    }

    return (
      <div key={idx} className="basis-1/3 sm:basis-1/4 md:basis-1/5 flex-shrink-0">
        <Link href={`/product/${product.slug}/?id=${product.id}`} className="p-1">
          <div className="p-3 flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-shadow duration-200 h-full rounded-lg bg-gray-100 border border-gray-200">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-3">
              <Image
                src={product.image}
                alt={product.label}
                fill
                sizes="(max-width: 640px) 96px, 112px"
                className="object-contain p-1"
                onError={() => setItemImageError(true)}
              />
            </div>
            {/* Removed the product name as per user request */}
          </div>
        </Link>
      </div>
    );
  };


  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Top Selling Products
        </h2>
        <Link href="/products" className="text-green-600 text-sm font-medium hover:underline">
          View more
        </Link>
      </div>

      {/* Main Container */}
      <div className="p-4 sm:p-6 border border-gray-200 rounded-xl bg-white shadow-sm">
        {/* --- Top Fixed Product (Two-column layout) --- */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-8 p-4 rounded-lg">
          {/* Main Image */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex-shrink-0">
            <Image
              src={popularData.mainImage}
              alt={popularData.mainLabel}
              fill
              sizes="(max-width: 768px) 192px, 224px"
              className="object-contain"
              onError={() => setMainImageError(true)}
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
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-2"
            onScroll={handleScroll}
            style={{
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {popularData.products.map((product, idx) => (
              <CarouselProductItem key={idx} product={product} idx={idx} />
            ))}
          </div>
          <div className="flex justify-center space-x-2 mt-4">
            {popularData.products.map((_, idx) => (
              <span
                key={idx}
                onClick={() => handleDotClick(idx)}
                className={`cursor-pointer w-3 h-3 rounded-full transition-colors duration-300 ${
                  idx === scrollIndex
                    ? "bg-[#42a856] scale-110"
                    : "bg-[#b5e0c0] hover:bg-[#a5d8b2]"
                }`}
              ></span>
            ))}
          </div>
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