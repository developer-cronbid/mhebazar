// src/components/elements/MostPopular.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Marquee from "react-fast-marquee";
import api from "@/lib/api";
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

const createSlug = (text: string | undefined): string => text ? text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : "#";

const getCategoryImageUrl = (categoryId: number | string | null): string => {
  if (!categoryId) {
    return "/placeholder-image.jpg";
  }
  const category = categoriesData.find(cat => cat.id === Number(categoryId));
  if (category?.image_url) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.endsWith("/") ? process.env.NEXT_PUBLIC_API_BASE_URL : `${process.env.NEXT_PUBLIC_API_BASE_URL}/`;
    const path = category.image_url.startsWith("/") ? category.image_url.substring(1) : category.image_url;
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

export default function MostPopular() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainImageError, setMainImageError] = useState(false);

  const fetchData = useCallback(async () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await api.get(`${baseUrl}/products/most_popular/`);
      const apiProducts = response.data?.results || response.data;
      if (Array.isArray(apiProducts) && apiProducts.length > 0) {
        const formattedData = transformApiData(apiProducts);
        setCategories(formattedData);
      }
    } catch (err) {
      setError("Failed to fetch popular products.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const popularData = categories[0];
  const visibleProducts = popularData?.products || [];

  const CarouselProductItem = ({ product, idx }: { product: TransformedProduct; idx: number }) => {
    const [itemImageError, setItemImageError] = useState(false);
    if (itemImageError || !product.image) return null;
    return (
      <div key={idx} className="w-44 flex-shrink-0 mr-4">
        <Link href={`/product/${product.slug}-${product.id}`} className="block">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-4 h-44 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 mb-2">
              <Image
                src={product.image}
                alt={product.label}
                fill
                className="object-contain"
                onError={() => setItemImageError(true)}
                sizes="128px"
              />
            </div>
          </div>
        </Link>
      </div>
    );
  };

  if (isLoading) return <LoadingSkeleton />;

  if (error || !popularData || mainImageError) {
    return (
      <section className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Top Selling Products
          </h2>
        </div>
        <p className="text-center text-gray-500 p-8 border rounded-lg">No popular products to display. {error}</p>
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

      <div className="bg-white border rounded-lg p-6">
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
            <Link href={`/product/${popularData.slug}-${popularData.id}`} passHref>
              <Image
                src={popularData.mainImage}
                alt={popularData.mainLabel}
                fill
                className="object-contain"
                onError={() => setMainImageError(true)}
                sizes="(max-width: 640px) 256px, 320px"
              />
            </Link>
          </div>
        </div>

        <div className="relative">
          <Marquee
            pauseOnHover={true}
            speed={40}
            className="pb-4"
          >
            {visibleProducts.map((product, idx) => (
              <CarouselProductItem key={product.id || idx} product={product} idx={idx} />
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}

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