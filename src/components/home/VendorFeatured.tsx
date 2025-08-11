"use client";

import React, { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { ProductCardContainer } from "../elements/Product";

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
  category: number | null;
}

const VendorProductsFeatured: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollIndex, setScrollIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products/");
        if (response.data?.results) {
          setProducts(response.data.results || []);
        } else {
          throw new Error("Invalid API response structure");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleDotClick = (index: number) => {
    if (scrollContainerRef.current && products.length > 0) {
      const container = scrollContainerRef.current;
      const itemsPerView = Math.floor(container.clientWidth / 280); // Approximate card width
      const targetIndex = index * itemsPerView;
      const itemWidth = container.children[0]?.clientWidth + 16 || 280;
      container.scrollTo({
        left: targetIndex * itemWidth,
        behavior: 'smooth',
      });
      setScrollIndex(index);
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current && products.length > 0) {
      const container = scrollContainerRef.current;
      const itemsPerView = Math.floor(container.clientWidth / 280);
      const itemWidth = container.children[0]?.clientWidth + 16 || 280;
      const newIndex = Math.floor(container.scrollLeft / (itemWidth * itemsPerView));
      setScrollIndex(newIndex);
    }
  };

  const totalDots = products.length > 0 ? Math.ceil(products.length / Math.floor((scrollContainerRef.current?.clientWidth || 1200) / 280)) : 0;

  if (loading) {
    return (
      <div className="w-full mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Vendor Products</h2>
          <button className="text-[#42a856] font-medium">View More</button>
        </div>
        <div className="flex space-x-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-1 bg-gray-200 rounded-lg h-80 animate-pulse"></div>
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
          <button className="text-[#42a856] font-medium">View More</button>
        </div>
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm border border-gray-100">
          <p className="text-red-500 text-center">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full mx-auto px-4 py-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Vendor Products</h2>
        <button className="text-[#42a856] font-medium hover:text-[#369447] transition-colors duration-200">
          View More
        </button>
      </div>
      
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide snap-x snap-mandatory"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
          onScroll={handleScroll}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 snap-start w-64"
            >
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 h-full">
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
                />
              </div>
            </div>
          ))}
        </div>
        
        {totalDots > 1 && (
          <div className="flex justify-center space-x-2 mt-4">
            {Array.from({ length: totalDots }, (_, idx) => (
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