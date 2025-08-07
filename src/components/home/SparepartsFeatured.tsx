"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import api from "@/lib/api";
import ProductCard from "@/components/elements/Product";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { motion, useInView } from "framer-motion";

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
  image: string;
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

  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.3 });

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
        <div className="relative px-4 sm:px-6">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {spareParts.map((spare) => (
                <CarouselItem
                  key={spare.id}
                  className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5"
                >
                  <motion.div variants={itemVariants}>
                    <ProductCard
                      id={Number(spare.id)}
                      image={spare.images[0].image}
                      title={spare.name}
                      subtitle={spare.subtitle}
                      price={spare.price}
                      currency={spare.currency}
                      directSale={spare.direct_sale}
                      is_active={spare.is_active}
                      hide_price={spare.hide_price}
                      stock_quantity={spare.stock_quantity} 
                      type={spare.type} 
                      category_image={spare.image}   
                                       />
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="flex -left-4 sm:-left-6" />
            <CarouselNext className="flex -right-4 sm:-right-6" />
          </Carousel>
        </div>
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