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
import { useDotButton } from "@/components/ui/carousel-dots";
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
  const router = useRouter();

  // ✅ Auto-slide every 3 seconds
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      const nextIndex = (api.selectedScrollSnap() + 1) % scrollSnaps.length;
      api.scrollTo(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [api, scrollSnaps]);

  const handleLinkClick = (url: string) => {
    if (url) router.push(url);
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
                  className="object-contain md:object-fill object-center"
                  priority={priority && idx === 0}
                  sizes="100vw"
                />

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

      {/* Dot navigation */}
      <div className="flex justify-center space-x-2 mt-4">
        {scrollSnaps.map((_, idx) => (
          <span
            key={idx}
            className={`duration-300 ${
              idx === selectedIndex
                ? "w-3 h-3 bg-[#42a856]"
                : "w-3 h-3 bg-[#b5e0c0] hover:bg-[#a5d8b2]"
            } rounded-full cursor-pointer flex items-center justify-center`}
            onClick={() => onDotClick(idx)}
          />
        ))}
      </div>
    </div>
  );
}
