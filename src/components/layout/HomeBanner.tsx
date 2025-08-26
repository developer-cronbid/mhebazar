'use client';

import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { DotButton, useDotButton } from "@/components/ui/carousel-dots";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

type BannerCarouselProps = {
  className?: string;
};

// Define the banner data with specific links for each banner.
// The fourth banner has a special 'splitUrls' property for two different click targets.
const BANNER_DATA = [
  {
    image: "/Banner1.png",
    alt: "Forklift rentals and purchases",
    url: '/forklift'
  },
  // {
  //   image: "/Banner2.png",
  //   alt: "Industrial Forklifts & Spare Parts Hub",
  //   url: '/spare-parts'
  // },
  {
    image: "/Banner3.png",
    alt: "Reliable batteries for your operations",
    url: '/battery'
  },
  {
    image: "/Banner4.png",
    alt: "Keep your machines running and operate with skill",
    splitUrls: {
      left: '/spare-parts',
      right: '/training'
    }
  },
];

export default function BannerCarousel({ className }: BannerCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const { selectedIndex, scrollSnaps, onDotClick } = useDotButton(api);
  const [banners, setBanners] = useState<any[]>(BANNER_DATA);
  const [isDefault, setIsDefault] = useState(true);
  const [loaded, setLoaded] = useState<boolean[]>(Array(BANNER_DATA.length).fill(false));
  const router = useRouter();

  type BannerItem = { image?: string; alt?: string; url?: string; splitUrls?: { left: string, right: string } };

  // Fetch banners from API, with a fallback to local data
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/craousels`);
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data: BannerItem[] = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setBanners(
            data.map((item: BannerItem, index: number) => ({
              image: item.image || BANNER_DATA[index % BANNER_DATA.length].image,
              alt: item.alt || `Banner ${index + 1}`,
              url: item.url || BANNER_DATA[index % BANNER_DATA.length].url,
              splitUrls: item.splitUrls || BANNER_DATA[index % BANNER_DATA.length].splitUrls,
            }))
          );
          setIsDefault(false);
          setLoaded(Array(data.length).fill(false));
        }
      } catch {
        setIsDefault(true);
        setLoaded(Array(banners.length).fill(true));
      }
    };
    fetchBanners();
  }, [banners.length]);

  // Autoplay functionality
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => api.scrollNext(), 5000);
    return () => clearInterval(interval);
  }, [api]);

  const handleImageLoad = (idx: number) => {
    setLoaded((prev) => {
      const copy = [...prev];
      copy[idx] = true;
      return copy;
    });
  };

  const handleLinkClick = (url: string) => {
    router.push(url);
  };
  
  return (
    <div className={cn("w-full relative bg-white overflow-hidden flex flex-col", className)}>
      <Carousel
        className="w-full"
        setApi={setApi}
        opts={{
          loop: true,
          align: "center",
        }}
      >
        <CarouselContent className="-ml-0">
          {banners.map((banner, idx) => (
            <CarouselItem key={idx} className="pl-0 w-full">
              <div className="relative w-full h-[200px] sm:h-[280px] md:h-[350px] lg:h-[400px] xl:h-[450px] overflow-hidden cursor-pointer">
                <Image
                  src={banner.image}
                  alt={banner.alt}
                  fill
                  className={`object-contain object-center transition-opacity duration-700 ${
                    loaded[idx] ? "opacity-100" : "opacity-0"
                  }`}
                  priority={idx === 0}
                  sizes="100vw"
                  onLoadingComplete={() => handleImageLoad(idx)}
                  onLoad={() => {
                    if (isDefault) handleImageLoad(idx);
                  }}
                />
                {!loaded[idx] && !isDefault && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin opacity-50"></div>
                  </div>
                )}
                {/* Check if the banner has split URLs */}
                {banner.splitUrls ? (
                  <>
                    {/* Left half clickable area */}
                    <div
                      className="absolute inset-y-0 left-0 w-1/2"
                      onClick={() => handleLinkClick(banner.splitUrls.left)}
                    />
                    {/* Right half clickable area */}
                    <div
                      className="absolute inset-y-0 right-0 w-1/2"
                      onClick={() => handleLinkClick(banner.splitUrls.right)}
                    />
                  </>
                ) : (
                  // Full banner clickable area
                  <div
                    className="absolute inset-0"
                    onClick={() => handleLinkClick(banner.url)}
                  />
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="flex justify-center space-x-2 mt-4 ">
        {scrollSnaps.map((_, idx) => (
          <span
            key={idx}
            className={`transition-all duration-300 ${
              idx === selectedIndex
                ? "w-3 h-3 bg-[#42a856] scale-110"
                : "w-3 h-3 bg-[#b5e0c0] hover:bg-[#a5d8b2] hover:scale-110"
            } rounded-full cursor-pointer flex items-center justify-center`}
          >
            <DotButton
              selected={idx === selectedIndex}
              onClick={() => onDotClick(idx)}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

