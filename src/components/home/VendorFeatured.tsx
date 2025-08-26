"use client";

import React, { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import ProductCardContainer from "@/components/elements/Product";
import Link from "next/link";
import axios from "axios";

interface Product {
  id: number;
  name: string;
  description: string;
  images: { image: string }[];
  price: string;
  currency: string;
  direct_sale: boolean;
  is_active: boolean;
  hide_price: boolean;
  stock_quantity: number;
  type: string;
  category: number;
  model: string;
  manufacturer: string;
  user_name: string;
}

const VendorProductsFeatured: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollIndex, setScrollIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const PRODUCT_IDS = [
    588, 614, 190, 388, 412, 177, 182, 120, 343, 94, 108, 362, 133, 145, 273,
    343, 102, 86,
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const productPromises = PRODUCT_IDS.map((id) =>
          api.get(`/products/${id}/`)
        );
        const responses = await Promise.all(productPromises);
        const allProducts = responses.map((response) => response.data);
        setProducts(allProducts);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError("Failed to load products. Please try again later.");
        } else {
          setError("An unexpected error occurred. Please try again.");
        }
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDotClick = (index: number) => {
    if (scrollContainerRef.current && products.length > 0) {
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
    if (scrollContainerRef.current && products.length > 0) {
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
    if (!products.length || products.length <= 0) return 0;
    if (!safeItemsPerView || safeItemsPerView <= 0) return 0;
    const calculated = Math.ceil(products.length / safeItemsPerView);
    if (!Number.isFinite(calculated) || calculated <= 0) return 0;
    return calculated;
  };

  const totalDots = calculateTotalDots();

  if (loading) {
    return (
      <div className="w-full mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Vendor Products</h2>
          <Link href="/vendor-listing">
            <span className="text-[#42a856] font-medium cursor-pointer">
              View More
            </span>
          </Link>
        </div>
        <div className="flex space-x-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-gray-200 rounded-lg h-80 animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <section className="w-full mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Vendor Products</h2>
          <Link href="/vendor-listing">
            <span className="text-[#42a856] font-medium cursor-pointer">
              View More
            </span>
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm border border-gray-100">
          <p className="text-red-500 text-center">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full mx-auto md:px-4 py-4">
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
          {products.map((product) => (
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