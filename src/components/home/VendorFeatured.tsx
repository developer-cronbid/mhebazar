"use client";

import React, { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
  CarouselItem,
} from "../ui/carousel";
import api from "@/lib/api";
import { ProductCardContainer } from "../elements/Product";

// Define the structure of a product based on your API response
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
  category_image: string | null;
}

const VendorProductsFeatured: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch products instead of vendors
        const response = await api.get("/products/");
        if (response.data && response.data.results) {
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

  if (loading) {
    return (
      <div className="w-full mx-auto px-4 py-10">
        <div className="flex space-x-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-1 p-1">
              <div className="bg-slate-200 rounded-lg h-[400px] animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  return (
    <section className="w-full mx-auto px-4 py-10">
      <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-900">
        Vendor Products
      </h2>
      <div className="relative px-4 sm:px-6">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent className="-ml-4">
            {products.map((product) => (
              <CarouselItem
                key={product.id}
                className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <div className="p-1">
                  <ProductCardContainer
                    id={product.id}
                    image={product.images[0]?.image || "/placeholder-image.png"}
                    title={product.name}
                    subtitle={product.description}
                    price={product.price}
                    currency="₹" // Assuming INR based on your API response
                    directSale={product.direct_sale}
                    is_active={product.is_active}
                    hide_price={product.hide_price}
                    stock_quantity={product.stock_quantity}
                    type={product.type}
                    category_image={product.category_image || null}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-[-20px] top-1/2 -translate-y-1/2 sm:flex hidden" />
          <CarouselNext className="absolute right-[-20px] top-1/2 -translate-y-1/2 sm:flex hidden" />
        </Carousel>
      </div>
    </section>
  );
};

export default VendorProductsFeatured;