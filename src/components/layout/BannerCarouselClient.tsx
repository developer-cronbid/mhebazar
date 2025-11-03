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

type BannerCarouselProps = {
  className?: string;
  banners: BannerItem[];
  isDefault: boolean;
  priority?: boolean;
};

export default function BannerCarouselClient({ banners, isDefault, className, priority }: BannerCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const { selectedIndex, scrollSnaps, onDotClick } = useDotButton(api);
  // REMOVED: loaded state, as we want instantaneous display without opacity transitions
  // REMOVED: handleImageLoad function, as it's no longer needed to manage opacity state
  const router = useRouter();

  // REMOVED: useEffect for autoplay interval. Removing animations/auto-scroll improves stability and performance focus.
  // We can add it back later if needed, but the instruction was to prioritize speed.

  const handleLinkClick = (url: string) => {
    router.push(url);
  };
  
  return (
    <div className={cn("w-full relative bg-white overflow-hidden flex flex-col", className)}>
      <Carousel
        className="w-full"
        setApi={setApi}
        opts={{
          // ADDED: loop is kept as it doesn't hurt LCP
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
                  // REMOVED ANIMATION: Removed transition-opacity and related opacity classes for instantaneous display
                  className="object-contain md:object-fill object-center"
                  
                  // CWV FIX: Apply Next.js priority loading flag to the very first image
                  priority={priority && idx === 0}
                  sizes="100vw"
                  
                  // REMOVED: onLoadingComplete and onLoad handlers that managed the unnecessary 'loaded' state
                />
                
                {/* REMOVED: The entire placeholder/pulse loading block */}
                
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

      {/* Kept dot buttons for navigation, but removed the inner DotButton component's need for selection */}
      <div className="flex justify-center space-x-2 mt-4 ">
        {scrollSnaps.map((_, idx) => (
          <span
            key={idx}
            // REMOVED: All transition-all and scale-110 animations
            className={`duration-300 ${
              idx === selectedIndex
                ? "w-3 h-3 bg-[#42a856]"
                : "w-3 h-3 bg-[#b5e0c0] hover:bg-[#a5d8b2]"
            } rounded-full cursor-pointer flex items-center justify-center`}
            onClick={() => onDotClick(idx)}
          >
             {/* Simplified DotButton usage: just a placeholder if needed, otherwise unnecessary */}
          </span>
        ))}
      </div>
    </div>
  );
}