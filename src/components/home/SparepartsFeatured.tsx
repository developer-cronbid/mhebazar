"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import api from "@/lib/api";
import ProductCard from "@/components/elements/Product";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

interface SparePart {
  type: string;
  images: { image: string }[];
  is_active: boolean;
  hide_price: boolean;
  direct_sale: boolean;
  stock_quantity: number;
  name: string;
  id: string | number;
  title?: string;
  subtitle: string;
  price: number;
  currency: string;
  category: number;
  model: string;
  manufacturer: string;
  user_name: string;
  created_at: string;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

export default function SparePartsFeatured() {
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollIndex, setScrollIndex] = useState(0);

  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.3 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchSpareParts = useCallback(async () => {
    try {
      const res = await api.get(`/products/`, {
        params: {
          category: 18,
          limit: 10,
        },
      });
      // The API response for `results` is an array of objects.
      setSpareParts(res.data?.results || []);
    } catch (error) {
      setError('Failed to fetch spare parts.');
      setSpareParts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpareParts();
  }, [fetchSpareParts]);

  const handleDotClick = useCallback((index: number) => {
    if (scrollContainerRef.current && spareParts.length > 0) {
      const container = scrollContainerRef.current;
      const itemsPerView = Math.floor(container.clientWidth / 240);
      const targetIndex = index * itemsPerView;
      const itemWidth = (container.children[0] as HTMLElement)?.clientWidth + 16 || 240;
      container.scrollTo({
        left: targetIndex * itemWidth,
        behavior: 'smooth',
      });
      setScrollIndex(index);
    }
  }, [spareParts]);

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current && spareParts.length > 0) {
      const container = scrollContainerRef.current;
      const itemsPerView = Math.floor(container.clientWidth / 240);
      const itemWidth = (container.children[0] as HTMLElement)?.clientWidth + 16 || 240;
      const newIndex = Math.floor(container.scrollLeft / (itemWidth * itemsPerView));
      setScrollIndex(newIndex);
    }
  }, [spareParts]);

  const totalDots = useMemo(() => {
    if (spareParts.length === 0) return 0;
    const itemsPerView = Math.floor(((scrollContainerRef.current?.clientWidth || 240) + 16) / 256); // 240px width + 16px gap
    return Math.ceil(spareParts.length / Math.max(1, itemsPerView));
  }, [spareParts, scrollContainerRef.current?.clientWidth]);


  return (
    <motion.section
      ref={sectionRef}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={sectionVariants}
      className="w-full mx-auto md:px-4 py-2"
    >
      <motion.div variants={itemVariants} className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Spare Parts</h2>
        <Link
          href="/spare-parts"
          className="text-[#42a856] font-medium hover:text-[#369447] transition-colors duration-200"
        >
          View More
        </Link>
      </motion.div>

      {loading ? (
        <div className="w-full flex justify-center items-center py-16 text-gray-500 text-lg">
          Loading...
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm border border-gray-100">
          <p className="text-red-500 text-center">{error}</p>
        </div>
      ) : spareParts.length > 0 ? (
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
            {spareParts.map((spare) => (
              <motion.div
                variants={itemVariants}
                key={spare.id}
                className="flex-shrink-0 snap-start w-72"
              >
                <ProductCard
                  id={Number(spare.id)}
                  image={spare.images[0]?.image || "/placeholder-image.png"}
                  title={spare.name}
                  subtitle={spare.subtitle}
                  price={spare.price}
                  currency={spare.currency}
                  directSale={spare.direct_sale}
                  is_active={spare.is_active}
                  hide_price={spare.hide_price}
                  stock_quantity={spare.stock_quantity}
                  type={spare.type}
                  category_id={spare.category}
                  model={spare.model}
                  manufacturer={spare.manufacturer}
                  user_name={spare.user_name}
                  created_at={spare.created_at} pageUrlType={""}                />
              </motion.div>
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
      ) : (
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm border border-gray-100"
        >
          <Image
            src="/no-product.jpg"
            alt="No product"
            width={112}
            height={112}
            className="mb-4 opacity-70"
          />
          <div className="text-lg font-semibold text-gray-700 mb-1">
            No spare parts available
          </div>
          <div className="text-gray-500 text-center">
            There are no spare parts in this category at the moment.
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}