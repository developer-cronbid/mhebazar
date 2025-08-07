"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import api from "@/lib/api";
import ProductCard from "@/components/elements/Product";

// Import shadcn/ui carousel components
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Interface for product data
interface Product {
  images: { image: string }[];
  is_active: boolean;
  hide_price: boolean;
  direct_sale: boolean;
  stock_quantity: number;
  name: string;
  id: string | number;
  category: string | number; // Added category field to get the category ID
  // Optional: If your API returns category details within the product
  category_details?: {
    name: string;
  };
  subtitle: string;
  price: number;
  currency: string;
}

interface CategoryProductsProps {
  currentProductId: string | number;
}

export default function CategoryProducts({ currentProductId }: CategoryProductsProps) {
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("this category");

  useEffect(() => {
    if (!currentProductId) return;

    const fetchProductsByCategory = async () => {
      setLoading(true);
      try {
        // Step 1: Fetch the current product to find its category ID
        const productRes = await api.get(`/products/${currentProductId}/`);
        const categoryId = productRes.data.category;

        // Use the category name from the response if available
        if (productRes.data.category_details?.name) {
          setCategoryName(productRes.data.category_details.name);
        }

        if (categoryId) {
          // Step 2: Fetch all products from that category
          const allCategoryProductsRes = await api.get(`/products/`, {
            params: {
              category: categoryId, // Filter by the category ID
            },
          });

          // Step 3: Filter out the current product from the list
          const otherProducts = (allCategoryProductsRes.data?.results || []).filter(
            (product: Product) => product.id.toString() !== currentProductId.toString()
          );

          setCategoryProducts(otherProducts);
        } else {
          setCategoryProducts([]);
        }
      } catch (error) {
        console.error("Failed to fetch category products:", error);
        setCategoryProducts([]); // Reset on error
      } finally {
        setLoading(false);
      }
    };

    fetchProductsByCategory();
  }, [currentProductId]);

  return (
    <section className="w-full mx-auto px-4 py-10">
      <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-900">
        Similar Products in {categoryName}
      </h2>
      {loading ? (
        <div className="w-full flex justify-center items-center py-16 text-gray-500 text-lg">
          Loading...
        </div>
      ) : categoryProducts.length > 0 ? (
        <div className="relative px-4 sm:px-6">
          <Carousel
            opts={{
              align: "start",
              loop: categoryProducts.length > 5, // Loop only if there are enough items
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {categoryProducts.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5"
                >
                  <ProductCard
                    id={Number(product.id)}
                    image={product.images?.[0]?.image || "/placeholder.png"}
                    title={product.name}
                    subtitle={product.subtitle}
                    price={product.price}
                    currency={product.currency}
                    directSale={product.direct_sale}
                    is_active={product.is_active}
                    hide_price={product.hide_price}
                    stock_quantity={product.stock_quantity}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="flex -left-4 sm:-left-6" />
            <CarouselNext className="flex -right-4 sm:-right-6" />
          </Carousel>
        </div>
      ) : (
        // Message when no other products are in the category
        <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-[0_4px_16px_0_rgba(0,0,0,0.04)]">
          <Image
            src="/no-product.png"
            alt="No other products"
            width={112}
            height={112}
            className="mb-4 opacity-70"
          />
          <div className="text-lg font-semibold text-gray-700 mb-1">
            No similar products found
          </div>
          <div className="text-gray-500">
            There are no other products in this category right now.
          </div>
        </div>
      )}
    </section>
  );
}