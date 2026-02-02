"use client";

import React, { useEffect, useState, useRef } from "react";
// import api from "@/lib/api";
import ProductCardContainer from "@/components/elements/Product";
import Link from "next/link";
// import axios from "axios";
interface Props {
  initialProducts: any[];
}

const VendorProductsFeatured: React.FC<Props> = ({ initialProducts }) => {
  const [scrollIndex, setScrollIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

if (!initialProducts || initialProducts.length === 0) {
    return null; 
  }
  const handleDotClick = (index: number) => {
    if (scrollContainerRef.current && initialProducts.length > 0) {
      const container = scrollContainerRef.current;
      const itemsPerView = Math.floor(container.clientWidth / 280);
      const targetIndex = index * itemsPerView;
      const itemWidth = container.children[0]?.clientWidth + 16 || 280;
      container.scrollTo({
        left: targetIndex * itemWidth,
        behavior: "smooth",
      });
      setScrollIndex(index);
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current && initialProducts.length > 0) {
      const container = scrollContainerRef.current;
      const itemsPerView = Math.floor(container.clientWidth / 280);
      const itemWidth = container.children[0]?.clientWidth + 16 || 280;
      const newIndex = Math.floor(
        container.scrollLeft / (itemWidth * itemsPerView)
      );
      setScrollIndex(newIndex);
    }
  };

  const getItemsPerView = () => {
    if (!scrollContainerRef.current) return 4;
    const containerWidth = scrollContainerRef.current.clientWidth;
    if (!containerWidth || containerWidth <= 0) return 4;
    return Math.floor(containerWidth / 280);
  };

  const itemsPerView = getItemsPerView();
  const safeItemsPerView = Math.max(1, itemsPerView);

  const calculateTotalDots = () => {
    if (!initialProducts.length || initialProducts.length <= 0) return 0;
    if (!safeItemsPerView || safeItemsPerView <= 0) return 0;
    const calculated = Math.ceil(initialProducts.length / safeItemsPerView);
    if (!Number.isFinite(calculated) || calculated <= 0) return 0;
    return calculated;
  };

  const totalDots = calculateTotalDots();

  return (
    <section className="w-full mx-auto md:px-4 min-h-[480px] py-4">

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Vendor Products</h2>
        <Link
          href="/vendor-listing"
          className="text-[#42a856] font-medium hover:text-[#369447] transition-colors duration-200 cursor-pointer"
        >
          View More
        </Link>
      </div>

      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide snap-x snap-mandatory"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
          onScroll={handleScroll}
        >
          {initialProducts.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 snap-start w-72"
            >
              <ProductCardContainer
                id={product.id}
                image={product.images[0]?.image || "/placeholder-image.png"}
                title={product.name}
                subtitle={product.description}
                price={product.price}
                currency="₹"
                directSale={product.direct_sale}
                is_active={product.is_active}
                hide_price={product.hide_price}
                stock_quantity={product.stock_quantity}
                type={product.type}
                category_id={product.category}
                model={product.model}
                manufacturer={product.manufacturer}
                user_name={product.user_name}
                created_at={product.created_at}
              />
            </div>
          ))}
        </div>

        {totalDots > 1 && (
          <div className="flex justify-center space-x-2 mt-4">
            {totalDots > 0 &&
              Number.isFinite(totalDots) &&
              Array.from({ length: totalDots }, (_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDotClick(idx)}
                  className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                    idx === scrollIndex ? "bg-[#42a856]" : "bg-gray-300"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default VendorProductsFeatured;