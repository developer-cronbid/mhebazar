'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, ShoppingCart } from 'lucide-react';
import Image from 'next/image';


// Define or import this type based on your backend response
interface WishlistItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    description: string;
    images?: string[];
  };
}

// Assuming you have a wishlistAPI file
const wishlistAPI = {
  getWishlist: () => api.get('/wishlist/'),
  deleteWishlistItem: (id: number) => api.delete(`/wishlist/${id}/`),
};

export default function WishlistForm() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await wishlistAPI.getWishlist();
      setWishlistItems(response.data);
    } catch (err) {
      setError('Failed to load wishlist items');
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (itemId: number) => {
    try {
      await wishlistAPI.deleteWishlistItem(itemId);
      await fetchWishlist();
    } catch (err) {
      console.error('Error removing from wishlist:', err);
    }
  };

  const addToCart = async (productId: number) => {
    try {
      // Add proper cart API here later
      console.log('Product added to cart', productId);
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
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
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500 mb-4">Your wishlist is empty</p>
          <Button onClick={() => window.location.href = '/'}>
            Start Shopping
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">My Wishlist</h2>

      {wishlistItems.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">

<Image
  src={item.product.images?.[0] || '/no-product.png'}
  alt={item.product.name}
  width={64}
  height={64}
  className="object-cover rounded"
/>

              <div className="flex-1">
                <h3 className="font-semibold">{item.product.name}</h3>
                <p className="text-gray-600 text-sm">
                  ${item.product.price}
                </p>
                <p className="text-gray-500 text-sm line-clamp-2">
                  {item.product.description}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => addToCart(item.product.id)}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Add to Cart
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeFromWishlist(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
