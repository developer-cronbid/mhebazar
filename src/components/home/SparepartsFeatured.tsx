"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import api from "@/lib/api";
import ProductCard from "@/components/elements/Product";
import {
  Carousel,
} from "@/components/ui/carousel";
import { motion, useInView } from "framer-motion";
import Autoplay from "embla-carousel-autoplay";

interface SparePart {
  type: string;
  images: { image: string }[];
  is_active: boolean;
  hide_price: boolean;
  direct_sale: boolean;
  stock_quantity: number;
  name: string;
  id: string | number;
  title: string;
  subtitle: string;
  price: number;
  currency: string;
  category: number;
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
  const [scrollIndex, setScrollIndex] = useState(0);

  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.3 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSpareParts = async () => {
      try {
        const res = await api.get(`/products/`, {
          params: {
            category: 18,
          },
        });

        console.log("Fetched spare parts:", res.data);
        setSpareParts(res.data?.results || []);
      } catch (error) {
        console.error("Failed to fetch spare parts:", error);
        setSpareParts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSpareParts();
  }, []);

  const handleDotClick = (index: number) => {
    if (scrollContainerRef.current) {
      const carouselContent = scrollContainerRef.current;
      const itemWidth = carouselContent.children[0].clientWidth + 16;
      carouselContent.scrollTo({
        left: index * itemWidth,
        behavior: 'smooth',
      });
    }
  };

  return (
    <motion.section
      ref={sectionRef}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={sectionVariants}
      className="w-full mx-auto px-4 py-10"
    >
      <motion.h2 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-8 text-gray-900">
        Spare Parts
      </motion.h2>
      {loading ? (
        <div className="w-full flex justify-center items-center py-16 text-gray-500 text-lg">
          Loading...
        </div>
      ) : spareParts.length > 0 ? (
        <>
          <div className="relative">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 4000,
                }),
              ]}
              className="w-full"
            >
              <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto snap-x snap-mandatory -ml-4"
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                onScroll={(e) => {
                  const carouselContent = e.currentTarget;
                  const itemWidth = carouselContent.children[0].clientWidth + 16;
                  const newIndex = Math.round(carouselContent.scrollLeft / itemWidth);
                  setScrollIndex(newIndex);
                }}
              >
                {spareParts.map((spare) => (
                  <div
                    key={spare.id}
                    className="pl-4 snap-start flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5"
                  >
                    <motion.div variants={itemVariants}>
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
                      />
                    </motion.div>
                  </div>
                ))}
              </div>
            </Carousel>
            <div className="flex justify-center space-x-2 mt-4">
              {spareParts.map((_, idx) => (
                <span
                  key={idx}
                  onClick={() => handleDotClick(idx)}
                  className={`cursor-pointer w-3 h-3 rounded-full transition-colors duration-300 ${
                    idx === scrollIndex ? "bg-[#42a856]" : "bg-[#b5e0c0]"
                  }`}
                ></span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-[0_4px_16px_0_rgba(0,0,0,0.04)]">
          <Image
            src="/no-product.png"
            alt="No product"
            width={112}
            height={112}
            className="mb-4 opacity-70"
          />
          <div className="text-lg font-semibold text-gray-700 mb-1">
            No spare parts available
          </div>
          <div className="text-gray-500">
            There are no spare parts in this category at the moment.
          </div>
        </div>
      )}
    </motion.section>
  );
}