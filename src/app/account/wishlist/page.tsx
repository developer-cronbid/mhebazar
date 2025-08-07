// src/app/account/wishlist/page.tsx
"use client";
import Breadcrumb from "@/components/elements/Breadcrumb";
import AccountTabsUI from "@/components/account/OrderWishTabs";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button"; // Assuming you have this button component

interface ProductDetailsInWishlist {
  id: number;
  name: string;
  price: string;
  images: { id: number; image: string }[];
  hide_price: boolean;
}

interface WishlistItemApi {
  id: number; // Wishlist item ID from backend
  product: number; // Product ID
  product_details: ProductDetailsInWishlist; // Nested product details
  created_at: string;
}

interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItemApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Assuming /wishlist/ endpoint returns a list of wishlist items for the logged-in user
      const response = await api.get<ApiResponse<WishlistItemApi>>("/wishlist/");
      setWishlistItems(response.data.results);
      console.log("Wishlist fetched:", response.data.results);
    } catch (err: unknown) {
      console.error("Failed to fetch wishlist:", err);
      setError("Failed to load your wishlist. Please try again later.");
      toast.error("Failed to load wishlist.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 text-center">
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
          <p className="ml-4 text-gray-600">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchWishlist} className="mt-4">Retry Loading Wishlist</Button>
      </div>
    );
  }

  // Transform fetched wishlist items into the format expected by AccountTabsUI
  const transformedWishlist = wishlistItems.map(item => ({
    id: String(item.id), // Use wishlist item ID for client-side key
    title: item.product_details.name,
    image: item.product_details.images?.[0]?.image || "/no-product.png",
    price: item.product_details.hide_price ? "₹ ******" : `₹ ${parseFloat(item.product_details.price).toLocaleString('en-IN')}`,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "My Account", href: "/account/wishlist" },
        ]}
      />
      <AccountTabsUI activeTab="wishlist" wishlist={transformedWishlist} />
    </div>
  );
}