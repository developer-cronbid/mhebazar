// src/context/UserContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback
} from "react";
import Cookies from "js-cookie";
import api from "@/lib/api";
// import axios from "axios";

interface UserBannerItem {
  id: number;
  url: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
  };
  phone: string | null;
  address: string | null;
  user_banner: UserBannerItem[];
  is_email_verified: boolean;
  is_account_locked: boolean;
  date_joined: string;
  last_login: string | null;
  is_staff: boolean;
}

// API interfaces (from your original code)
interface ApiProductData {
  id: number;
  category_name?: string;
  subcategory_name?: string | null;
  images: { id: number; image: string }[];
  name: string;
  description: string;
  price: string;
  direct_sale: boolean;
  type: string;
  is_active: boolean;
  hide_price: boolean;
  stock_quantity: number;
  manufacturer?: string;
  average_rating?: number | null;
  category_id?: number | null;
}

interface CartItemApi {
  id: number;
  product: number;
  product_details: ApiProductData;
  quantity: number;
  total_price: number;
}

interface WishlistItemApi {
  id: number;
  product: number;
  product_details: ApiProductData;
}

// Context interfaces
interface CartItem {
  cartItemId: number;
  productId: number;
  quantity: number;
}

interface WishlistItem {
  wishlistItemId: number;
  productId: number;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  logout: () => void;

  // Wishlist & Cart data
  wishlistItems: WishlistItem[];
  cartItems: CartItem[];
  isWishlistLoading: boolean;
  isCartLoading: boolean;

  // Helper functions
  isProductWishlisted: (productId: number) => boolean;
  isProductInCart: (productId: number) => boolean;
  getCartItemQuantity: (productId: number) => number;
  getCartItemId: (productId: number) => number | null;

  // Action functions
  addToWishlist: (productId: number) => Promise<boolean>;
  removeFromWishlist: (productId: number) => Promise<boolean>;
  addToCart: (productId: number, quantity?: number) => Promise<boolean>;
  removeFromCart: (productId: number) => Promise<boolean>;
  updateCartQuantity: (productId: number, newQuantity: number) => Promise<boolean>;

  // Refresh functions
  refreshWishlist: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);

  // Fetch user profile
  const fetchUser = useCallback(async () => {
    try {
      //console.log("[UserContext] Attempting to fetch user profile...");
      const userResponse = await api.get('/users/me/');
      const userData = userResponse.data as User;
      setUser(userData);
      //console.log("[UserContext] User data fetched successfully.");

      // Fetch wishlist and cart data after user is set
      await Promise.all([
        fetchWishlist(userData.id),
        fetchCart(userData.id)
      ]);
    } catch (error) {
      //console.error("[UserContext] Failed to fetch user profile:", error);
      setUser(null);
      setWishlistItems([]);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch wishlist
  const fetchWishlist = useCallback(async (userId?: number) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    setIsWishlistLoading(true);
    try {
      //console.log("[UserContext] Fetching wishlist...");
      const response = await api.get<{ results: WishlistItemApi[] }>(`/wishlist/?user=${targetUserId}`);
      const wishlistData: WishlistItem[] = response.data.results.map(item => ({
        wishlistItemId: item.id,
        productId: item.product
      }));
      setWishlistItems(wishlistData);
      //console.log(`[UserContext] Wishlist fetched: ${wishlistData.length} items`);
    } catch (error) {
      // //console.error("[UserContext] Failed to fetch wishlist:", error);
      setWishlistItems([]);
    } finally {
      setIsWishlistLoading(false);
    }
  }, [user?.id]);

  // Fetch cart
  const fetchCart = useCallback(async (userId?: number) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    setIsCartLoading(true);
    try {
      //console.log("[UserContext] Fetching cart...");
      const response = await api.get<{ results: CartItemApi[] }>(`/cart/?user=${targetUserId}`);
      const cartData: CartItem[] = response.data.results.map(item => ({
        cartItemId: item.id,
        productId: item.product,
        quantity: item.quantity
      }));
      setCartItems(cartData);
      //console.log(`[UserContext] Cart fetched: ${cartData.length} items`);
    } catch (error) {
      //console.error("[UserContext] Failed to fetch cart:", error);
      setCartItems([]);
    } finally {
      setIsCartLoading(false);
    }
  }, [user?.id]);

  // Helper functions
  const isProductWishlisted = useCallback((productId: number): boolean => {
    return wishlistItems.some(item => item.productId === productId);
  }, [wishlistItems]);

  const isProductInCart = useCallback((productId: number): boolean => {
    return cartItems.some(item => item.productId === productId);
  }, [cartItems]);

  const getCartItemQuantity = useCallback((productId: number): number => {
    const cartItem = cartItems.find(item => item.productId === productId);
    return cartItem ? cartItem.quantity : 0;
  }, [cartItems]);

  const getCartItemId = useCallback((productId: number): number | null => {
    const cartItem = cartItems.find(item => item.productId === productId);
    return cartItem ? cartItem.cartItemId : null;
  }, [cartItems]);

  // Action functions
  const addToWishlist = useCallback(async (productId: number): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    const tempWishlistItem: WishlistItem = {
      wishlistItemId: -1, // Temporary ID
      productId
    };
    setWishlistItems(prev => [...prev, tempWishlistItem]);

    try {
      //console.log(`[UserContext] Adding product ${productId} to wishlist...`);
      const response = await api.post(`/wishlist/`, { product: productId });

      // Update with real ID
      setWishlistItems(prev => prev.map(item =>
        item.productId === productId && item.wishlistItemId === -1
          ? { ...item, wishlistItemId: response.data.id }
          : item
      ));

      //console.log(`[UserContext] Successfully added product ${productId} to wishlist`);
      return true;
    } catch (error) {
      //console.error(`[UserContext] Failed to add product ${productId} to wishlist:`, error);

      // Revert optimistic update
      setWishlistItems(prev => prev.filter(item =>
        !(item.productId === productId && item.wishlistItemId === -1)
      ));

      return false;
    }
  }, [user]);

  const removeFromWishlist = useCallback(async (productId: number): Promise<boolean> => {
    if (!user) return false;

    const wishlistItem = wishlistItems.find(item => item.productId === productId);
    if (!wishlistItem) return false;

    // Optimistic update
    setWishlistItems(prev => prev.filter(item => item.productId !== productId));

    try {
      //console.log(`[UserContext] Removing product ${productId} from wishlist...`);
      await api.delete(`/wishlist/${wishlistItem.wishlistItemId}/`);
      //console.log(`[UserContext] Successfully removed product ${productId} from wishlist`);
      return true;
    } catch (error) {
      //console.error(`[UserContext] Failed to remove product ${productId} from wishlist:`, error);

      // Revert optimistic update
      setWishlistItems(prev => [...prev, wishlistItem]);
      return false;
    }
  }, [user, wishlistItems]);

  const addToCart = useCallback(async (productId: number, quantity: number = 1): Promise<boolean> => {
    if (!user) return false;

    // Check if already in cart
    const existingCartItem = cartItems.find(item => item.productId === productId);
    if (existingCartItem) {
      //console.log(`[UserContext] Product ${productId} already in cart`);
      return true;
    }

    // Optimistic update
    const tempCartItem: CartItem = {
      cartItemId: -1, // Temporary ID
      productId,
      quantity
    };
    setCartItems(prev => [...prev, tempCartItem]);

    try {
      //console.log(`[UserContext] Adding product ${productId} to cart with quantity ${quantity}...`);
      const response = await api.post(`/cart/`, { product: productId, quantity });

      // Update with real ID
      setCartItems(prev => prev.map(item =>
        item.productId === productId && item.cartItemId === -1
          ? { ...item, cartItemId: response.data.id }
          : item
      ));

      //console.log(`[UserContext] Successfully added product ${productId} to cart`);
      return true;
    } catch (error) {
      //console.error(`[UserContext] Failed to add product ${productId} to cart:`, error);

      // Revert optimistic update
      setCartItems(prev => prev.filter(item =>
        !(item.productId === productId && item.cartItemId === -1)
      ));

      return false;
    }
  }, [user, cartItems]);

  const removeFromCart = useCallback(async (productId: number): Promise<boolean> => {
    if (!user) return false;

    const cartItem = cartItems.find(item => item.productId === productId);
    if (!cartItem) return false;

    // Optimistic update
    setCartItems(prev => prev.filter(item => item.productId !== productId));

    try {
      //console.log(`[UserContext] Removing product ${productId} from cart...`);
      await api.delete(`/cart/${cartItem.cartItemId}/`);
      //console.log(`[UserContext] Successfully removed product ${productId} from cart`);
      return true;
    } catch (error) {
      //console.error(`[UserContext] Failed to remove product ${productId} from cart:`, error);

      // Revert optimistic update
      setCartItems(prev => [...prev, cartItem]);
      return false;
    }
  }, [user, cartItems]);

  const updateCartQuantity = useCallback(async (productId: number, newQuantity: number): Promise<boolean> => {
    if (!user || newQuantity < 1) return false;

    const cartItem = cartItems.find(item => item.productId === productId);
    if (!cartItem) return false;

    const oldQuantity = cartItem.quantity;

    // Optimistic update
    setCartItems(prev => prev.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));

    try {
      //console.log(`[UserContext] Updating cart quantity for product ${productId} to ${newQuantity}...`);
      await api.patch(`/cart/${cartItem.cartItemId}/`, { quantity: newQuantity });
      //console.log(`[UserContext] Successfully updated cart quantity for product ${productId}`);
      return true;
    } catch (error) {
      //console.error(`[UserContext] Failed to update cart quantity for product ${productId}:`, error);

      // Revert optimistic update
      setCartItems(prev => prev.map(item =>
        item.productId === productId
          ? { ...item, quantity: oldQuantity }
          : item
      ));

      return false;
    }
  }, [user, cartItems]);

  // Refresh functions
  const refreshWishlist = useCallback(async () => {
    await fetchWishlist();
  }, [fetchWishlist]);

  const refreshCart = useCallback(async () => {
    await fetchCart();
  }, [fetchCart]);

  // Initial load
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Logout function
  const logout = useCallback(() => {
    setUser(null);
    setWishlistItems([]);
    setCartItems([]);
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    window.location.href = "/login";
  }, []);

  const contextValue: UserContextType = {
    user,
    setUser,
    isLoading,
    logout,
    wishlistItems,
    cartItems,
    isWishlistLoading,
    isCartLoading,
    isProductWishlisted,
    isProductInCart,
    getCartItemQuantity,
    getCartItemId,
    addToWishlist,
    removeFromWishlist,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    refreshWishlist,
    refreshCart
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};