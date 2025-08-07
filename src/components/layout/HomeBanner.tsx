// BannerCarousel.tsx

"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { DotButton, useDotButton } from "@/components/ui/carousel-dots";
import { cn } from "@/lib/utils";
// import { motion } from "framer-motion";

type BannerCarouselProps = {
  className?: string;
};

export default function BannerCarousel({ className }: BannerCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const { selectedIndex, scrollSnaps, onDotClick } = useDotButton(api);

  const [banners, setBanners] = useState<{ image: string; alt: string }[]>([
    { image: "/Banner1.png", alt: "Default 1" },
    { image: "/Banner2.png", alt: "Default 2" },
    { image: "/Banner3.png", alt: "Default 3" },

  ]);
  const [isDefault, setIsDefault] = useState(true);
  const [loaded, setLoaded] = useState<boolean[]>([false, false]);

  type BannerItem = { image?: string; alt?: string };

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/craousels`);
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data: BannerItem[] = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setBanners(
            data.map((item: BannerItem, index: number) => ({
              image: item.image || "/Banner3.png",
              alt: item.alt || `Banner ${index + 1}`,
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
              <div className="relative w-full h-[200px] sm:h-[280px] md:h-[350px] lg:h-[400px] xl:h-[450px] overflow-hidden bg-gradient-to-r from-gray-100 to-gray-200">
                <Image
                  src={banner.image}
                  alt={banner.alt}
                  fill
                  className={`object-cover object-center transition-opacity duration-700 ${
                    loaded[idx] ? "opacity-100" : "opacity-0"
                  }`}
                  priority={idx === 0}
                  sizes="100vw"
                  onLoadingComplete={() => handleImageLoad(idx)}
                  onLoad={() => {
                    if (isDefault) handleImageLoad(idx);
                  }}
                  unoptimized={banner.image.startsWith("/")}
                />
                {!loaded[idx] && !isDefault && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin opacity-50"></div>
                  </div>
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