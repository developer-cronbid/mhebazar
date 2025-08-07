// src/components/cart/CartSummary.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner"; // Import sonner for toasts
import axios from "axios"; // Import axios for error handling
import Image from 'next/image';


// Type definitions based on your API response
interface ProductDetails {
  id: number;
  name: string;
  price: string; // Price is string from API
  images: { id: number; image: string }[]; // Images are objects with 'image' property
}

interface CartItemApi {
  id: number; // Cart item ID
  product: number; // Product ID
  product_details: ProductDetails; // Full product details are nested
  quantity: number;
  total_price: number; // Total price for this item, already calculated by backend
}

interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface CartSummaryProps {
  onNext?: () => void;
  onUpdateTotal?: (total: number) => void; // Prop to pass total amount to the parent page
}

const cartAPI = {
  getCart: () => api.get<ApiResponse<CartItemApi>>("/cart/"), // Updated to expect ApiResponse
  updateCartItem: (itemId: number, quantity: number) =>
    api.patch(`/cart/${itemId}/`, { quantity }),
  deleteCartItem: (itemId: number) => api.delete(`/cart/${itemId}/`),
  // Assuming a clear cart endpoint exists
  clearCart: () => api.post("/cart/clear/"),
};

const CartSummary: React.FC<CartSummaryProps> = ({ onNext, onUpdateTotal }) => {
  const [cartItems, setCartItems] = useState<CartItemApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartAPI.getCart();
      setCartItems(response.data.results); // API returns results in an array
    } catch (err: unknown) {
      console.error("Error fetching cart:", err);
      setError("Failed to load cart items. Please try again.");
      toast.error("Failed to load cart items.");
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies, runs once on mount

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Update parent's total when cart items change
  useEffect(() => {
    if (onUpdateTotal) {
      onUpdateTotal(calculateTotal());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, onUpdateTotal]);

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      toast.error("Quantity cannot be less than 1.");
      return;
    }
    try {
      await cartAPI.updateCartItem(itemId, newQuantity);
      // Instead of re-fetching all, we can update locally for a smoother UX
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity: newQuantity,
                total_price:
                  parseFloat(item.product_details.price) * newQuantity,
              }
            : item
        )
      );
      toast.success("Cart item quantity updated.");
    } catch (err: unknown) {
      console.error("Error updating quantity:", err);
      if (
        axios.isAxiosError(err) &&
        err.response &&
        err.response.data?.quantity
      ) {
        toast.error(
          `Failed to update quantity: ${err.response.data.quantity[0]}`
        );
      } else {
        toast.error("Failed to update quantity. Please try again.");
      }
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await cartAPI.deleteCartItem(itemId);
      setCartItems((prevItems) =>
        prevItems.filter((item) => item.id !== itemId)
      ); // Optimistically remove from UI
      toast.success("Product removed from cart.");
    } catch (err: unknown) {
      console.error("Error removing item:", err);
      toast.error("Failed to remove item. Please try again.");
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clearCart(); // Assuming this endpoint clears all
      setCartItems([]);
      toast.success("Cart cleared successfully!");
    } catch (err: unknown) {
      console.error("Error clearing cart:", err);
      toast.error("Failed to clear cart. Please try again.");
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.total_price, // Use total_price from API
      0
    );
  };

  const calculateTotal = () => {
    // For now, assuming no discounts or shipping charges applied here.
    return calculateSubtotal();
  };

  const formatPrice = (price: number) =>
    `₹ ${price.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i: number) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchCart} className="mt-4">
          Retry Loading Cart
        </Button>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Button onClick={() => (window.location.href = "/")}>
            Continue Shopping
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Cart Summary</h2>
        <Button
          variant="outline"
          onClick={clearCart}
          disabled={cartItems.length === 0}
        >
          Clear Cart
        </Button>
      </div>

      {cartItems.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Image
                src={
                  item.product_details.images?.[0]?.image || "/no-product.png"
                }
                alt={item.product_details.name || "Product Image"}
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded"
                unoptimized={item.product_details.images?.[0]?.image?.startsWith(
                  "http"
                )}
              />

              <div className="flex-1">
                <h3 className="font-semibold">{item.product_details.name}</h3>
                <p className="text-gray-600 text-sm">
                  {formatPrice(parseFloat(item.product_details.price))} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive" // Use destructive variant for delete
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatPrice(calculateSubtotal())}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>Free</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatPrice(calculateTotal())}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proceed Button */}
      {onNext && (
        <Button
          className="w-full mt-4"
          onClick={onNext}
          disabled={cartItems.length === 0}
        >
          Proceed to Address
        </Button>
      )}
    </div>
  );
};

export default CartSummary;