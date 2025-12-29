// src/components/elements/MostPopular.tsx
"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import Marquee from "react-fast-marquee";
import categoriesData from "@/data/categories.json";


interface ApiProduct {
  id: number;
  name: string;
  images: { image: string }[];
  description: string;
  category: number;
}

interface TransformedProduct {
  id: string | number;
  image: string;
  label: string;
  slug: string;
}

interface Category {
  id: string | number;
  title: string;
  subtitle: string;
  mainImage: string;
  mainLabel: string;
  note: string;
  slug: string;
  products: TransformedProduct[];
}

const createSlug = (text: string | undefined): string => 
  text ? text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : "#";

const getCategoryImageUrl = (categoryId: number | string | null): string => {
  if (!categoryId) {
    return "/placeholder-image.jpg";
  }
  const category = categoriesData.find(cat => cat.id === Number(categoryId));
  if (category?.image_url) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.endsWith("/") 
      ? process.env.NEXT_PUBLIC_API_BASE_URL 
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/`;
    const path = category.image_url.startsWith("/") 
      ? category.image_url.substring(1) 
      : category.image_url;
    return `${baseUrl}${path}`;
  }
  return "/placeholder-image.jpg";
};

const transformApiData = (apiProducts: ApiProduct[]): Category[] => {
  if (!apiProducts || apiProducts.length === 0) {
    return [];
  }

  const mainProduct = apiProducts[0];
  const otherProducts = apiProducts.slice(1);

  const getPrimaryImageUrl = (product: ApiProduct): string =>
    product.images?.[0]?.image || getCategoryImageUrl(product.category);

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


const CarouselProductItem = memo(({ product, idx }: { product: TransformedProduct; idx: number }) => {
  const [itemImageError, setItemImageError] = useState(false);
  if (itemImageError || !product.image) return null;
    
    return (
      <div key={`${product.id}-${idx}`} className="w-48 flex-shrink-0 mr-4 group">
        <Link href={`/product/${product.slug}-${product.id}`} className="block">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 p-4 h-48 flex flex-col items-center justify-center group-hover:border-green-300">
            <div className="relative w-36 h-32 mb-3 overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={product.image}
                alt={product.label}
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-300"
                onError={() => setItemImageError(true)}
                sizes="144px"
                loading="lazy"
              />
            </div>
            <p className="text-sm font-medium text-gray-700 text-center line-clamp-2 group-hover:text-green-600 transition-colors">
              {product.label}
            </p>
          </div>
        </Link>
      </div>
    );
  });

interface MostPopularProps {
  initialData: ApiProduct[];
}

export default function MostPopular({ initialData }: MostPopularProps) {
  // const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [categories, setCategories] = useState<Category[]>([]);
  const [mainImageError, setMainImageError] = useState(false);
  const [marqueeSpeed, setMarqueeSpeed] = useState(40);
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);

  // const fetchData = useCallback(async () => {
  //   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  //   if (!baseUrl) {
  //     setIsLoading(false);
  //     return;
  //   }
  //   try {
  //     const response = await api.get(`${baseUrl}/products/most_popular/`);
  //     const apiProducts = response.data?.results || response.data;
  //     if (Array.isArray(apiProducts) && apiProducts.length > 0) {
  //       const formattedData = transformApiData(apiProducts);
  //       setCategories(formattedData);
  //     }
  //   } catch (err) {
  //     setError("Failed to fetch popular products.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, []);

  // useEffect(() => {
  //   fetchData();
  // }, [fetchData]);

 const popularData = useMemo(() => {
    const transformed = transformApiData(initialData);
    return transformed[0] || null;
  }, [initialData]);

  const visibleProducts = useMemo(() => {
    return popularData?.products || [];
  }, [popularData]);

  // const popularData = categories[0];
  // const visibleProducts = popularData?.products || [];

  

  const handleMarqueeControl = (action: 'pause' | 'play' | 'slower' | 'faster') => {
    switch (action) {
      case 'pause':
        setIsMarqueePaused(true);
        break;
      case 'play':
        setIsMarqueePaused(false);
        break;
      case 'slower':
        setMarqueeSpeed(prev => Math.max(20, prev - 20));
        break;
      case 'faster':
        setMarqueeSpeed(prev => Math.min(100, prev + 20));
        break;
    }
  };

  // if (isLoading) return <LoadingSkeleton />;

  if (error || !popularData || mainImageError) {
    return (
      <section className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Top Selling Products
          </h2>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-5.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H1" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No popular products to display</p>
          {error && <p className="text-sm text-gray-500 mt-1">{error}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Top Selling Products
        </h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                Most Popular
              </h3>
              <p className="text-sm text-gray-600">
                {popularData.subtitle}
              </p>
              <p className="text-xs text-green-600 font-medium mt-1">
                {popularData.note}
              </p>
            </div>
          </div>
        </div>

        {/* Main Product Section */}
        <div className="p-6">
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <Link href={`/product/${popularData.slug}-${popularData.id}`} className="block">
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-xl overflow-hidden border-4 border-gray-200 group-hover:border-green-300 transition-all duration-300 shadow-lg">
                  <Image
                    src={popularData.mainImage}
                    alt={popularData.mainLabel}
                    fill
                    priority
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    onError={() => setMainImageError(true)}
                    sizes="(max-width: 640px) 256px, 320px"
                    
                  />
                </div>
                <div className="mt-4 text-center">
                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                    {popularData.mainLabel}
                  </h4>
                </div>
              </Link>
            </div>
          </div>

          {/* Controls for Marquee */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Related Products</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMarqueeControl(isMarqueePaused ? 'play' : 'pause')}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label={isMarqueePaused ? 'Play carousel' : 'Pause carousel'}
              >
                {isMarqueePaused ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => handleMarqueeControl('slower')}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-xs font-medium"
                aria-label="Slower speed"
              >
                −
              </button>
              <button
                onClick={() => handleMarqueeControl('faster')}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-xs font-medium"
                aria-label="Faster speed"
              >
                +
              </button>
            </div>
          </div>

          {/* Carousel Section */}
          {visibleProducts.length > 0 ? (
            <div className="relative bg-gray-50 rounded-xl p-4">
              <Marquee
                pauseOnHover={true}
                pauseOnClick={true}
                speed={marqueeSpeed}
                play={!isMarqueePaused}
                className="pb-2"
                gradient={true}
                gradientColor="#f9fafb"
                gradientWidth={50}
                will-change-transform
                style={{ willChange: "transform" }}
              >
                {visibleProducts.map((product, idx) => (
                  <CarouselProductItem key={`${product.id}-${idx}`} product={product} idx={idx} />
                ))}
              </Marquee>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No related products available</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// function LoadingSkeleton() {
//   return (
//     <div className="w-full">
//       <div className="flex justify-between items-center mb-6">
//         <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse" />
//       </div>
//       <div className="w-full border border-gray-200 rounded-xl bg-white overflow-hidden">
//         {/* Header skeleton */}
//         <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
//           <div className="h-8 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
//           <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
//         </div>
        
//         {/* Content skeleton */}
//         <div className="p-6">
//           <div className="flex justify-center mb-8">
//             <div className="w-64 h-64 sm:w-80 sm:h-80 bg-gray-200 rounded-xl animate-pulse" />
//           </div>
//           <div className="flex gap-4 overflow-hidden">
//             {[1, 2, 3, 4].map((i) => (
//               <div key={i} className="w-48 h-48 bg-gray-200 rounded-xl flex-shrink-0 animate-pulse" />
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }