// /components/NewArrivalsAndTopSearches.tsx

"use client";

import { useState, useEffect, JSX, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";

// --- Type Definitions (Refined) ---
interface ProductApiResponse {
  id: string | number;
  images?: { image: string }[];
  name?: string;
  title?: string;
}

interface DisplayItem {
  id: string | number;
  image: string | null;
  label: string;
  alt: string;
  slug: string;
}

// --- Fallback Data ---
const FALLBACK_NEW_ARRIVALS: DisplayItem[] = [
  { id: 'fallback-na-1', image: "/home/new-1.png", label: "New MHE 1", alt: "New MHE 1", slug: "#" },
  { id: 'fallback-na-2', image: "/home/new-2.png", label: "New MHE 2", alt: "New MHE 2", slug: "#" },
  { id: 'fallback-na-3', image: "/home/new-3.png", label: "New MHE 3", alt: "New MHE 3", slug: "#" },
];

const FALLBACK_TOP_RATED: DisplayItem[] = [
  { id: 'fallback-ts-1', image: "/home/search-1.png", label: "Forklift Attachments", alt: "Forklift Attachments", slug: "#" },
  { id: 'fallback-ts-2', image: "/home/search-2.png", label: "Manual Platform Trolly", alt: "Manual Platform Trolly", slug: "#" },
  { id: 'fallback-ts-3', image: "/home/search-3.png", label: "Electric Pallet Truck (BOPT)", alt: "Electric Pallet Truck (BOPT)", slug: "#" },
];

// --- Helper Component for Top Rated Items ---
function TopRatedItem({ item }: { item: DisplayItem }): JSX.Element | null {
  const { image, label, alt, slug } = item;
  const [showInitials, setShowInitials] = useState<boolean>(!image);

  if (!image && (!label || label.trim() === '')) {
    return null;
  }

  const initials = label?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Link href={`/product/${slug}/?id=${item.id}`} className="block">
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex-shrink-0 flex items-center justify-center">
          {image && !showInitials ? (
            <Image
              src={image}
              alt={alt || label}
              fill
              className="object-contain p-2 transform hover:scale-105 transition-transform duration-200"
              sizes="64px"
              onError={() => setShowInitials(true)}
            />
          ) : (
            <span className="text-green-500 text-lg font-bold">{initials}</span>
          )}
        </div>
        <p className="font-medium text-gray-900 flex-1 text-base hover:text-green-700 transition-colors">{label}</p>
      </div>
    </Link>
  );
}

// New component for New Arrivals to handle image error
function NewArrivalItem({ item }: { item: DisplayItem }): JSX.Element | null {
  const [imageError, setImageError] = useState(false);

  if (imageError || !item.image) {
    return null;
  }

  return (
    <Link href={`/product/${item.slug}/?id=${item.id}`} key={item.id} className="block">
      <div className="relative w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 hover:shadow-md transition-all duration-200 p-3">
        <Image
          src={item.image}
          alt={item.alt}
          fill
          className="object-contain hover:scale-105 transition-transform duration-200"
          sizes="112px"
          onError={() => setImageError(true)}
        />
      </div>
    </Link>
  );
}

// --- Main Component ---
export default function NewArrivalsAndTopSearches() {
  const [newArrivals, setNewArrivals] = useState<DisplayItem[]>(FALLBACK_NEW_ARRIVALS);
  const [topRated, setTopRated] = useState<DisplayItem[]>(FALLBACK_TOP_RATED);
  const [newArrivalsCount, setNewArrivalsCount] = useState<number>(0);
  const [isLoadingNewArrivals, setIsLoadingNewArrivals] = useState<boolean>(true);
  const [isLoadingTopRated, setIsLoadingTopRated] = useState<boolean>(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollIndex, setScrollIndex] = useState(0);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const createSlug = (text: string | undefined) => text ? text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : "#";

  useEffect(() => {
    setIsLoadingNewArrivals(true);
    api.get<{ count?: number; products?: ProductApiResponse[] }>(`/products/new-arrival/`)
      .then(res => {
        const products = res.data?.products || [];
        const transformed = products.map(p => ({
          id: p.id,
          image: p.images?.[0]?.image || null,
          label: p.title || p.name || "New Product",
          alt: p.title || p.name || "New Product",
          slug: createSlug(p.title || p.name),
        })).filter(item => item.image !== null);

        setNewArrivals(transformed.slice(0, 10));
        setNewArrivalsCount(res.data?.count || transformed.length);
      }).catch(console.error).finally(() => setIsLoadingNewArrivals(false));

    setIsLoadingTopRated(true);
    api.get<{ count?: number; products?: ProductApiResponse[] }>(`/products/top-rated/`)
      .then(res => {
        const products = res.data?.products || [];
        const transformed = products.map(p => ({
          id: p.id,
          image: p.images?.[0]?.image || null,
          label: p.title || p.name || "Top Rated Product",
          alt: p.title || p.name || "Top Rated Product",
          slug: createSlug(p.title || p.name),
        })).filter(item => item.image !== null);

        setTopRated(transformed.slice(0, 10));
      }).catch(console.error).finally(() => setIsLoadingTopRated(false));
  }, [API_BASE_URL]);

  const LoadingBoxSkeleton = () => <div className="w-28 h-28 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>;
  const LoadingListItemSkeleton = () => (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
  );

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

  return (
    <div className="space-y-8 w-full">
      {/* New Arrivals Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">New Arrivals</h2>
          <Link href="/products/battery" className="text-green-600 text-sm font-medium hover:underline">View more</Link>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="mb-6">
            <p className="text-lg font-semibold text-gray-900">
              {newArrivalsCount > 0 ? `${newArrivalsCount}+ products added today` : "50+ products added today"}
            </p>
          </div>
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
              {isLoadingNewArrivals ? (
                [...Array(4)].map((_, i) => <LoadingBoxSkeleton key={i} />)
              ) : (
                newArrivals.map((item) => (
                  <NewArrivalItem key={item.id} item={item} />
                ))
              )}
            </div>
            {/* Dots Navigation */}
            {newArrivals.length > 1 && (
              <div className="flex justify-center space-x-2 mt-4">
                {Array.from({ length: Math.min(newArrivals.length, 4) }).map((_, idx) => (
                  <span
                    key={idx}
                    onClick={() => handleDotClick(idx)}
                    className={`cursor-pointer w-2 h-2 rounded-full transition-colors duration-300 ${
                      idx === scrollIndex
                        ? "bg-green-600"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  ></span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Searched Products Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Top Searched Products</h2>
          <Link href="/products/battery" className="text-green-600 text-sm font-medium hover:underline">View more</Link>
        </div>
        <div className="space-y-3">
          {isLoadingTopRated ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <LoadingListItemSkeleton key={i} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {topRated.map((item) => <TopRatedItem key={item.id} item={item} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}