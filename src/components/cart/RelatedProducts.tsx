// src/components/cart/RelatedProducts.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ProductCardContainer } from "@/components/elements/Product"; // Use ProductCardContainer
import Image from "next/image";
import api from "@/lib/api"; // Import your API client

// Define API data structures for products
interface ApiProduct {
  id: number;
  category_name: string;
  subcategory_name: string;
  images: { id: number; image: string }[];
  name: string;
  description: string;
  price: string;
  direct_sale: boolean;
  type: string;
  is_active: boolean;
  hide_price: boolean;
  stock_quantity: number;
  manufacturer: string;
  average_rating: number | null;
  category_details?: {
    cat_image: string | null;
  };
}

interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function RelatedProducts() {
  const [relatedProducts, setRelatedProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRelatedProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // For related products, you would ideally fetch based on current cart items' categories/subcategories.
      // Since that's complex without a specific backend endpoint for "related products by cart,"
      // we'll just fetch a few general products for now as a placeholder for "related".
      // A real "related products" API might look like: `/products/related/?product_ids=1,2,3`
      // or `/products/?category_id=X&limit=Y`
      const response = await api.get<ApiResponse<ApiProduct>>(`/products/?limit=4`); // Fetch 4 random products
      setRelatedProducts(response.data.results);
    } catch (err: unknown) {
      console.error("Failed to fetch related products:", err);
      setError("Failed to load related products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRelatedProducts();
  }, [fetchRelatedProducts]);

  if (loading) {
    return (
      <div className="w-full flex justify-center p-10 text-center text-gray-500">
        Loading related products...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex justify-center p-10 text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-900">
        Related Products
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7 justify-items-center">
        {relatedProducts.length > 0 ? (
          relatedProducts.map((item) => (
            // Directly render ProductCardContainer without an extra div wrapper if not needed for specific styling
            <ProductCardContainer
              key={item.id}
              id={item.id}
              image={item.images?.[0]?.image || "/no-product.png"}
              title={item.name}
              subtitle={item.description}
              price={item.price}
              currency={"₹"} // Assuming currency is Indian Rupee
              directSale={item.direct_sale}
              is_active={item.is_active}
              hide_price={item.hide_price}
              stock_quantity={item.stock_quantity}
               type={item.type}
               category_image={null}            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <Image
              src="/no-product.png"
              alt="No product"
              width={112}
              height={112}
              className="mb-4 opacity-70"
            />
            <div className="text-lg font-semibold text-gray-700 mb-1">
              No related products found
            </div>
            <div className="text-gray-500">
              There are no related products available at the moment.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}