// src/components/layout/BannerCarouselClient.tsx
'use client';

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { DotButton, useDotButton } from "@/components/ui/carousel-dots";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

type BannerItem = { image?: string; alt?: string; url?: string; splitUrls?: { left: string, right: string } };

// UPDATED TYPE: Accept the new priority prop
type BannerCarouselProps = {
  className?: string;
  banners: BannerItem[];
  isDefault: boolean;
  priority?: boolean; // NEW: Define priority prop
};

export default function BannerCarouselClient({ banners, isDefault, className, priority }: BannerCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const { selectedIndex, scrollSnaps, onDotClick } = useDotButton(api);
  const [loaded, setLoaded] = useState<boolean[]>(Array(banners.length).fill(false));
  const router = useRouter();

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
              <div className="relative w-full h-auto aspect-[72/23] overflow-hidden cursor-pointer">
                <Image
                  src={banner.image || ''}
                  alt={banner.alt || ''}
                  fill
                  className={`object-contain md:object-fill object-center transition-opacity duration-700 ${
                    loaded[idx] ? "opacity-100" : "opacity-0"
                  }`}
                  // CWV FIX: Use the passed priority prop for the first image
                  priority={priority && idx === 0}
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
                {banner.splitUrls ? (
                  <>
                    <div
                      className="absolute inset-y-0 left-0 w-1/2"
                      onClick={() => handleLinkClick(banner.splitUrls?.left || '')}
                    />
                    <div
                      className="absolute inset-y-0 right-0 w-1/2"
                      onClick={() => handleLinkClick(banner.splitUrls?.right || '')}
                    />
                  </>
                ) : (
                  <div
                    className="absolute inset-0"
                    onClick={() => handleLinkClick(banner.url || '')}
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