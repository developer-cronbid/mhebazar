"use client";

import { useState, useEffect, useCallback } from "react";
import type { CarouselApi } from "@/components/ui/carousel";

export const DotButton = ({
  selected,
  onClick,
}: {
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-2 h-2 rounded-full transition-all ${
      selected ? "bg-[#5CA131] scale-125" : "bg-gray-300"
    }`}
    aria-label="Carousel dot"
  />
);

export function useDotButton(api: CarouselApi | undefined) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!api) return;
    setSelectedIndex(api.selectedScrollSnap());
  }, [api]);

  const onDotClick = useCallback(
    (index: number) => {
      if (!api) return;
      api.scrollTo(index);
    },
    [api]
  );

  useEffect(() => {
    if (!api) return;
    setScrollSnaps(api.scrollSnapList());
    api.on("select", onSelect);
    onSelect();
  }, [api, onSelect]);

  return {
    selectedIndex,
    scrollSnaps,
    onDotClick,
  };
}
