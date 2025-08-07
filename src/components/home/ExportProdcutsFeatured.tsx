"use client";

import React, { useEffect, useState, useRef } from "react";
import ProductCardContainer from "@/components/elements/Product";
import Image from "next/image";
import axios from "axios";
import categoriesData from "@/data/categories.json";
import { motion, useInView } from "framer-motion";

const NEXT_PUBLIC_BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const getCategoryImageUrl = (categoryId: number | string | null): string => {
  if (!categoryId) {
    return "/placeholder-image.jpg";
  }

  const category = categoriesData.find(cat => cat.id === Number(categoryId));
  if (category && category.image_url) {
    return `${NEXT_PUBLIC_BACKEND_BASE_URL}${category.image_url}`;
  }

  return "/placeholder-image.jpg";
};

interface ExportProduct {
  id: string | number;
  title: string;
  subtitle: string | null;
  price: string | number;
  currency: string;
  image: string;
  direct_sale: boolean;
  is_active: boolean;
  hide_price: boolean;
  stock_quantity: number;
  type: string;
  category: string | number | null;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

export default function ExportProductsFeatured() {
  const [exportProducts, setExportProducts] = useState<ExportProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.3 });

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        const response = await axios.get(`${NEXT_PUBLIC_API_BASE_URL}/products/?category=&subcategory=&type=used&user=`);

        const rawData = Array.isArray(response.data)
          ? response.data
          : response.data?.results ?? [];

        const formattedProducts: ExportProduct[] = rawData.map((item: any) => ({
          id: item.id,
          title: item.name,
          subtitle: item.description || null,
          price: item.price,
          currency: "₹",
          image: (item.images && item.images.length > 0) ? item.images[0].image : getCategoryImageUrl(item.category),
          direct_sale: item.direct_sale,
          is_active: item.is_active,
          hide_price: item.hide_price,
          stock_quantity: item.stock_quantity,
          type: item.type,
          category: item.category,
        }));

        setExportProducts(formattedProducts.slice(0, 4));
      } catch (error) {
        console.error("Failed to fetch new arrival products:", error);
        setExportProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularProducts();
  }, []);

  return (
    <motion.section
      ref={sectionRef}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={sectionVariants}
      className="w-full mx-auto px-4 py-10"
    >
      <motion.h2 variants={itemVariants} className="text-3xl font-bold mb-8 text-gray-900">
        Export Products
      </motion.h2>
      {loading ? (
        <div className="w-full flex justify-center items-center py-16 text-gray-500 text-lg">
          Loading...
        </div>
      ) : (
        <motion.div variants={sectionVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {exportProducts.length > 0 ? (
            exportProducts.map((export_product) => (
              <motion.div variants={itemVariants} key={export_product.id}>
                <ProductCardContainer
                  id={Number(export_product.id)}
                  image={export_product.image}
                  title={export_product.title}
                  subtitle={export_product.subtitle}
                  price={export_product.price}
                  currency={export_product.currency}
                  directSale={export_product.direct_sale}
                  is_active={export_product.is_active}
                  hide_price={export_product.hide_price}
                  stock_quantity={export_product.stock_quantity}
                  type={export_product.type}
                />
              </motion.div>
            ))
          ) : (
            <motion.div variants={itemVariants} className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
              <Image
                src="/no-product.png"
                alt="No product"
                width={112}
                height={112}
                className="mb-4 opacity-70"
              />
              <div className="text-lg font-semibold text-gray-700 mb-1">
                No export products available
              </div>
              <div className="text-gray-500">
                There are no export products available at the moment.
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.section>
  );
}