"use client";

import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation"; // Or from 'next/router' in pages directory
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

// Re-using the same interface for product data consistency
interface Product {
  images: { image: string }[];
  is_active: boolean;
  hide_price: boolean;
  direct_sale: boolean;
  stock_quantity: number;
  name: string;
  id: string | number;
  user: string | number; // Added user field to get the vendor ID
  title: string;
  subtitle: string;
  price: number;
  currency: string;
}

interface VendorProductsProps {
  currentProductId: string | number;
}

export default function VendorProducts({ currentProductId }: VendorProductsProps) {
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorName, setVendorName] = useState(""); // Optional: to display vendor name

  useEffect(() => {
    if (!currentProductId) return;

    const fetchProductsByVendor = async () => {
      setLoading(true);
      try {
        // Step 1: Fetch the current product to get its vendor (user) ID
        const productRes = await api.get(`/products/${currentProductId}/`);
        const vendorId = productRes.data.user;

        // Optional: Get vendor's name if available in the response
        // This assumes the product detail response includes user info like `productRes.data.user_details.name`
        // Adjust the path according to your actual API response structure.
        // For now, we'll just create a generic title.
        setVendorName("this Vendor");

        if (vendorId) {
          // Step 2: Fetch all products from that vendor
          const allVendorProductsRes = await api.get(`/products/`, {
            params: {
              user: vendorId, // Filter by the vendor's ID
            },
          });

          // Step 3: Filter out the current product from the list to avoid showing it
          const otherProducts = (allVendorProductsRes.data?.results || []).filter(
            (product: Product) => product.id.toString() !== currentProductId.toString()
          );

          setVendorProducts(otherProducts);
        } else {
          setVendorProducts([]);
        }
      } catch (error) {
        console.error("Failed to fetch vendor products:", error);
        setVendorProducts([]); // Reset on error
      } finally {
        setLoading(false);
      }
    };

    fetchProductsByVendor();
  }, [currentProductId]);

  return (
    <section className="w-full mx-auto px-4 py-10">
      <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-900">
        More from {vendorName}
      </h2>
      {loading ? (
        <div className="w-full flex justify-center items-center py-16 text-gray-500 text-lg">
          Loading...
        </div>
      ) : vendorProducts.length > 0 ? (
        <div className="relative px-4 sm:px-6">
          <Carousel
            opts={{
              align: "start",
              loop: vendorProducts.length > 5, // Only loop if there are more items than visible
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {vendorProducts.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5"
                >
                  <ProductCard
                    id={Number(product.id)}
                    image={product.images?.[0]?.image || "/placeholder.png"} // Safety check for image
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
        <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-[0_4px_16px_0_rgba(0,0,0,0.04)]">
          <Image
            src="/no-product.png"
            alt="No other products"
            width={112}
            height={112}
            className="mb-4 opacity-70"
          />
          <div className="text-lg font-semibold text-gray-700 mb-1">
            No other products available
          </div>
          <div className="text-gray-500">
            This vendor has not listed any other products yet.
          </div>
        </div>
      )}
    </section>
  );
}