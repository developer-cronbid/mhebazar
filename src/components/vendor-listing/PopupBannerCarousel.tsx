// src/components/vendor-listing/PopupBannerCarousel.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PopupBannerCarouselProps {
  images: string[];        // Array of fully-resolved image URLs
  alt?: string;
}

export default function PopupBannerCarousel({ images, alt = "Banner" }: PopupBannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const total = images.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  // Auto-slide every 4 s when there are multiple images
  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [total, next]);

  if (total === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-gradient-to-r from-[#5CA131]/15 to-[#5CA131]/5 shrink-0">
        <span className="text-[#5CA131]/40 text-sm">No cover image</span>
      </div>
    );
  }

  return (
    /* Fixed height, dark bg so object-contain images don't show white gaps */
    <div className="w-full h-48 bg-gray-900 relative overflow-hidden shrink-0">

      {/* Slides */}
      {images.map((src, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-500 ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
        >
          <Image
            src={src}
            alt={`${alt} ${i + 1}`}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 672px"
            priority={i === 0}
          />
        </div>
      ))}

      {/* Prev / Next arrows — only if more than 1 image */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous banner"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            aria-label="Next banner"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
          >
            <ChevronRight size={18} />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Slide ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === current ? "bg-white scale-125" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
