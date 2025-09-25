// /components/home/NewArrivalsAndTopSearches.tsx

"use client";

import { useState, useEffect, JSX, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Marquee from "react-fast-marquee";
import api from "@/lib/api";

// --- Type Definitions ---
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
function TopRatedItem({ item, index }: { item: DisplayItem; index: number }): JSX.Element | null {
  const { image, label, alt, slug } = item;
  const [showInitials, setShowInitials] = useState<boolean>(!image);

  if (!image && (!label || label.trim() === '')) {
    return null;
  }

  const initials = label?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Link href={`/product/${slug}-${item.id}`} className="block group">
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer min-h-[100px] group-hover:border-green-300">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
          {image && !showInitials ? (
            <Image
              src={image}
              alt={alt || label}
              fill
              className="object-contain p-2"
              onLoad={() => setShowInitials(false)}
              onError={() => setShowInitials(true)}
              sizes="64px"
              loading="lazy"
            />
          ) : (
            <span className="text-green-500 text-sm font-bold">{initials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-base group-hover:text-green-600 transition-colors truncate">
            {label}
          </p>
          <div className="flex items-center mt-1">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              #{index + 1} Popular
            </span>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

// New Arrivals Item Component
function NewArrivalItem({ item }: { item: DisplayItem }): JSX.Element | null {
  const [imageError, setImageError] = useState(false);

  if (imageError || !item.image) {
    return null;
  }

  return (
    <div className="w-36 flex-shrink-0 mr-4 group">
      <Link href={`/product/${item.slug}-${item.id}`} className="block">
        <div className="relative w-36 h-36 rounded-xl overflow-hidden bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 p-3 group-hover:border-green-300">
          <Image
            src={item.image}
            alt={item.alt}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            sizes="144px"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
        </div>
        <p className="text-sm font-medium text-gray-700 mt-2 text-center line-clamp-2 group-hover:text-green-600 transition-colors">
          {item.label}
        </p>
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
  const [showAllTopRated, setShowAllTopRated] = useState<boolean>(false);
  const [marqueeSpeed, setMarqueeSpeed] = useState(40);
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const createSlug = useCallback((text: string | undefined) => 
    text ? text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : "#", []);

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

        setNewArrivals(transformed.slice(0, 15));
        setNewArrivalsCount(res?.count || transformed.length);
      } catch (error) {
        // Silent error for fallback data
        console.warn('Failed to fetch new arrivals:', error);
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
        }));

        setTopRated(transformed.slice(0, 10));
      } catch (error) {
        // Silent error for fallback data
        console.warn('Failed to fetch top rated:', error);
      } finally {
        setIsLoadingTopRated(false);
      }
    };

    fetchData();
  }, [API_BASE_URL, createSlug]);

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

  const displayedTopRated = showAllTopRated ? topRated : topRated.slice(0, 3);

  const LoadingBoxSkeleton = () => (
    <div className="w-36 h-36 bg-gray-200 rounded-xl animate-pulse flex-shrink-0 mr-4" />
  );

  const LoadingListItemSkeleton = () => (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 animate-pulse min-h-[100px]">
      <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 w-full">
      {/* New Arrivals Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
          <Link href="/new" className="text-green-600 text-sm font-medium hover:underline hover:text-green-700 transition-colors">
            View more →
          </Link>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* New Arrivals Header */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-semibold text-gray-900">
                  {newArrivalsCount > 0 ? `${newArrivalsCount}+ products added today` : "10+ products added today"}
                </p>
                <p className="text-sm text-gray-600 mt-1">Fresh inventory just arrived</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMarqueeControl(isMarqueePaused ? 'play' : 'pause')}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  aria-label={isMarqueePaused ? 'Play carousel' : 'Pause carousel'}
                >
                  {isMarqueePaused ? (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => handleMarqueeControl('slower')}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-xs font-medium"
                >
                  −
                </button>
                <button
                  onClick={() => handleMarqueeControl('faster')}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-xs font-medium"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* New Arrivals Content */}
          <div className="p-6">
            {isLoadingNewArrivals ? (
              <div className="flex overflow-hidden">
                {[...Array(4)].map((_, i) => <LoadingBoxSkeleton key={i} />)}
              </div>
            ) : (
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
                >
                  {newArrivals.map((item, index) => (
                    <NewArrivalItem key={`${item.id}-${index}`} item={item} />
                  ))}
                </Marquee>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Searched Categories Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Top Searched Categories</h2>
          {topRated.length > 3 && (
            <button
              onClick={() => setShowAllTopRated(!showAllTopRated)}
              className="text-green-600 text-sm font-medium hover:underline hover:text-green-700 transition-colors"
            >
              {showAllTopRated ? 'Show Less' : `View All (${topRated.length})`}
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Top Categories Header */}
          <div className="bg-gradient-to-r from-green-50 to-yellow-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Most Popular Categories</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">Based on customer searches and engagement</p>
          </div>

          {/* Top Categories Content */}
          <div className="p-6">
            {isLoadingTopRated ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <LoadingListItemSkeleton key={i} />)}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {displayedTopRated.map((item, index) => (
                    <TopRatedItem 
                      key={`${item.id}-${index}`} 
                      item={item} 
                      index={showAllTopRated ? index : index}
                    />
                  ))}
                </div>
                
                {/* Collapse Animation for Additional Items */}
                {showAllTopRated && topRated.length > 3 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid gap-3">
                      {topRated.slice(3).map((item, index) => (
                        <TopRatedItem 
                          key={`${item.id}-additional-${index}`} 
                          item={item} 
                          index={index + 3}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {topRated.length === 0 && !isLoadingTopRated && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="font-medium">No categories to display</p>
                    <p className="text-sm mt-1">Check back later for popular categories</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}