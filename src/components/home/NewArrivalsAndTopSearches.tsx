// /components/home/NewArrivalsAndTopSearches.tsx

"use client";

import { useState, useEffect, JSX, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import Marquee from "react-fast-marquee";
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
  { id: 'fallback-na-4', image: "/home/new-1.png", label: "New MHE 4", alt: "New MHE 4", slug: "#" },
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
      <div className="flex items-center gap-6 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer min-h-[120px]">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex-shrink-0 flex items-center justify-center">
          {image && !showInitials ? (
            <Image
              src={image}
              alt={alt || label}
              fill
              className="object-contain p-2 transform hover:scale-105 transition-transform duration-200"
              onLoad={() => setShowInitials(false)} // Corrected: use onLoad
              onError={() => setShowInitials(true)}
              sizes="80px"
            />
          ) : (
            <span className="text-green-500 text-lg font-bold">{initials}</span>
          )}
        </div>
        <p className="font-semibold text-gray-900 flex-1 text-lg hover:text-green-700 transition-colors">{label}</p>
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
    <div className="w-32 flex-shrink-0 mr-4">
      <Link href={`/product/${item.slug}/?id=${item.id}`} className="block">
        <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 hover:shadow-md transition-all duration-200 p-4">
          <Image
            src={item.image}
            alt={item.alt}
            fill
            className="object-contain hover:scale-105 transition-transform duration-200"
            onError={() => setImageError(true)}
            sizes="128px"
          />
        </div>
      </Link>
    </div>
  );
}

// --- Main Component ---
export default function NewArrivalsAndTopSearches() {
  const [newArrivals, setNewArrivals] = useState<DisplayItem[]>(FALLBACK_NEW_ARRIVALS);
  const [topRated, setTopRated] = useState<DisplayItem[]>(FALLBACK_TOP_RATED);
  const [newArrivalsCount, setNewArrivalsCount] = useState<number>(0);
  const [isLoadingNewArrivals, setIsLoadingNewArrivals] = useState<boolean>(true);
  const [isLoadingTopRated, setIsLoadingTopRated] = useState<boolean>(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const createSlug = useCallback((text: string | undefined) => text ? text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : "#", []);

  useEffect(() => {
    const fetchData = async () => {
      if (!API_BASE_URL) {
        setIsLoadingNewArrivals(false);
        setIsLoadingTopRated(false);
        return;
      }

      // Fetch New Arrivals
      try {
        setIsLoadingNewArrivals(true);
        const response = await api.get(`${API_BASE_URL}/products/new-arrival/`);
        const res = response.data;

        const products = res?.products || [];
        const transformed = products.map((p: ProductApiResponse) => ({
          id: p.id,
          image: p.images?.[0]?.image || null,
          label: p.title || p.name || "New Product",
          alt: p.title || p.name || "New Product",
          slug: createSlug(p.title || p.name),
        })).filter((item: DisplayItem) => item.image !== null);

        setNewArrivals(transformed.slice(0, 10));
        setNewArrivalsCount(res?.count || transformed.length);
      } catch (error) {
        // Silent error for fallback data
      } finally {
        setIsLoadingNewArrivals(false);
      }

      // Fetch Top Rated
      try {
        setIsLoadingTopRated(true);
        const response = await api.get(`${API_BASE_URL}/products/top-rated/`);
        const res = response.data;

        const products = res?.products || [];
        const transformed = products.map((p: ProductApiResponse) => ({
          id: p.id,
          image: p.images?.[0]?.image || null,
          label: p.title || p.name || "Top Rated Product",
          alt: p.title || p.name || "Top Rated Product",
          slug: createSlug(p.title || p.name),
        })).filter((item: DisplayItem) => item.image !== null);

        setTopRated(transformed.slice(0, 10));
      } catch (error) {
        // Silent error for fallback data
      } finally {
        setIsLoadingTopRated(false);
      }
    };

    fetchData();
  }, [API_BASE_URL, createSlug]);

  const LoadingBoxSkeleton = () => <div className="w-44 h-44 bg-gray-200 rounded-lg animate-pulse flex-shrink-0 mr-4"></div>;

  const LoadingListItemSkeleton = () => (
    <div className="flex items-center gap-6 p-4 bg-white rounded-lg border border-gray-200 animate-pulse min-h-[120px]">
      <div className="w-20 h-20 rounded-lg bg-gray-200 flex-shrink-0"></div>
      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
    </div>
  );

  return (
    <div className="space-y-8 w-full">
      {/* New Arrivals Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
          <Link href="/new" className="text-green-600 text-sm font-medium hover:underline">View more</Link>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="mb-6">
            <p className="text-xl font-semibold text-gray-900">
              {newArrivalsCount > 0 ? `${newArrivalsCount}+ products added today` : "10+ products added today"}
            </p>
          </div>
          <div className="relative">
            {isLoadingNewArrivals ? (
              <div className="flex">
                {[...Array(4)].map((_, i) => <LoadingBoxSkeleton key={i} />)}
              </div>
            ) : (
              <Marquee
                pauseOnHover={true}
                speed={40}
                className="pb-4"
              >
                {newArrivals.map((item, index) => (
                  <NewArrivalItem key={item.id || `na-item-${index}`} item={item} />
                ))}
              </Marquee>
            )}
          </div>
        </div>
      </div>

      {/* Top Searched Products Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Top Searched Categories</h2>
        </div>
        <div className="space-y-4">
          {isLoadingTopRated ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <LoadingListItemSkeleton key={i} />)}
            </div>
          ) : (
            <div className="space-y-4">
              {topRated.map((item, index) => <TopRatedItem key={item.id || `tr-item-${index}`} item={item} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}