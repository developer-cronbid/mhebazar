/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Heart,
  Share2,
  Star,
  Truck,
  Headphones,
  CreditCard,
  RotateCcw,
  ChevronDown,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import axios from "axios";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import QuoteForm from "@/components/forms/enquiryForm/quotesForm";
import RentalForm from "@/components/forms/enquiryForm/rentalForm";
// import SparePartsFeatured from "@/components/home/SparePartsFeatured";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import MheWriteAReview from "@/components/forms/product/ProductReviewForm";
import ReviewSection from "./Reviews";

import DOMPurify from 'dompurify';
import SparePartsFeatured from "../home/SparepartsFeatured";

type ProductImage = {
  id: number;
  image: string;
};

type ProductData = {
  id: number;
  name: string;
  description: string;
  meta_title: string | null;
  meta_description: string | null;
  manufacturer: string | null;
  model: string | null;
  product_details: Record<string, unknown> | null;
  price: string;
  type: string;
  is_active: boolean;
  direct_sale: boolean;
  online_payment: boolean;
  hide_price: boolean;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
  user: number;
  category: number;
  subcategory: number | null;
  category_name: string;
  subcategory_name: string | null;
  user_name: string;
  images: ProductImage[];
  brochure: string | null;
  average_rating: number | null;
  category_details?: {
    cat_image: string | null;
  }
};

interface CartItemApi {
  id: number;
  product: number;
  product_details: ProductData;
  quantity: number;
  total_price: number;
}

interface WishlistItemApi {
  id: number;
  product: number;
  product_details: ProductData;
}

interface ProductSectionProps {
  productSlug: string;
  productId: number | string | null;
}

// Custom Image component with an error handler to show a fallback
const FallbackImage = ({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc,
  style,
  priority,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className: string;
  fallbackSrc?: string | null;
  style?: React.CSSProperties;
  priority?: boolean;
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [error, setError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setError(false);
  }, [src]);

  const handleError = () => {
    if (!error) {
      if (fallbackSrc) {
        setImgSrc(fallbackSrc);
      } else {
        setImgSrc("/placeholder-image.png");
      }
      setError(true);
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      priority={priority}
      unoptimized={imgSrc.startsWith("/placeholder-image.png") || imgSrc === fallbackSrc}
      onError={handleError}
    />
  );
};


export default function ProductSection({ productId, productSlug }: ProductSectionProps) {
  const router = useRouter();
  const { user } = useUser();

  const [data, setData] = useState<ProductData | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [openAccordion, setOpenAccordion] = useState<"desc" | "spec" | "vendor" | null>("desc");
  const [isInCart, setIsInCart] = useState(false);
  const [currentCartQuantity, setCurrentCartQuantity] = useState(0);
  const [cartItemId, setCartItemId] = useState<number | null>(null);

  const formatKey = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  };

  const getValidSpecs = (specs: Record<string, unknown> | null) => {
    if (!specs) return [];
    return Object.entries(specs).filter(([key, value]) =>
      value !== null &&
      value !== undefined &&
      value !== '' &&
      String(value).trim() !== ''
    );
  };

  const reviewsRefresher = useRef<(() => void) | null>(null);

  const latestCartState = useRef({ currentCartQuantity, cartItemId, isInCart });
  useEffect(() => {
    latestCartState.current = { currentCartQuantity, cartItemId, isInCart };
  }, [currentCartQuantity, cartItemId, isInCart]);

  const fetchInitialStatus = useCallback(async () => {
    if (user && data?.id) {
      try {
        const wishlistResponse = await api.get<{ results: WishlistItemApi[] }>(`/wishlist/?product=${data.id}&user=${user.id}`);
        setIsWishlisted(wishlistResponse.data.results.length > 0);

        const cartResponse = await api.get<{ results: CartItemApi[] }>(`/cart/?product=${data.id}&user=${user.id}`);
        if (cartResponse.data.results.length > 0) {
          const itemInCart = cartResponse.data.results[0];
          setIsInCart(true);
          setCurrentCartQuantity(itemInCart.quantity);
          setCartItemId(itemInCart.id);
        } else {
          setIsInCart(false);
          setCurrentCartQuantity(0);
          setCartItemId(null);
        }
      } catch (error) {
        console.error("Failed to fetch initial wishlist/cart status:", error);
      }
    } else {
      setIsWishlisted(false);
      setIsInCart(false);
      setCurrentCartQuantity(0);
      setCartItemId(null);
    }
  }, [user, data?.id]);

  useEffect(() => {
    async function fetchData() {
      if (!productId) {
        router.push('/404');
        return;
      }
      try {
        const productRes = await api.get<ProductData>(`/products/${productId}/`);
        const foundProduct = productRes.data;

        // Fetch category details for the fallback image
        const categoryRes = await api.get(`/categories/${foundProduct.category}`);
        const categoryWithImage = { ...foundProduct, category_details: categoryRes.data };

        if (categoryWithImage) {
          setData(categoryWithImage);
          if (categoryWithImage.images.length > 0) {
            setSelectedImage(0);
          }
        } else {
          router.push('/404');
        }
      } catch (error) {
        console.error("Failed to fetch product data:", error);
        router.push('/404');
      }
    }
    fetchData();
  }, [productId, router]);

  useEffect(() => {
    fetchInitialStatus();
  }, [fetchInitialStatus]);

  const handleAddToCart = useCallback(async (productId: number) => {
    if (!user) {
      toast.error("Please log in to add products to your cart.");
      router.push('/login');
      return;
    }
    try {
      if (latestCartState.current.isInCart) {
        toast.info("This product is already in your cart.", {
          action: {
            label: 'View Cart',
            onClick: () => router.push('/cart'),
          },
        });
        return;
      }
      const response = await api.post(`/cart/`, { product: productId, quantity: 1 });
      setIsInCart(true);
      setCurrentCartQuantity(1);
      setCartItemId(response.data.id);
      toast.success("Product added to cart!", {
        action: {
          label: 'View Cart',
          onClick: () => router.push('/cart'),
        },
      });
    } catch (error: unknown) {
      console.error("Error adding to cart:", error);
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 400 && error.response.data?.non_field_errors?.[0] === "The fields user, product must make a unique set.") {
          toast.info("Product is already in your cart.", {
            action: {
              label: 'View Cart',
              onClick: () => router.push('/cart'),
            },
          });
          fetchInitialStatus();
        } else {
          toast.error(error.response.data?.message || `Failed to add to cart: ${error.response.statusText}`);
        }
      } else {
        toast.error("An unexpected error occurred while adding to cart. Please try again.");
      }
    }
  }, [user, router, fetchInitialStatus]);


  const handleRemoveFromCart = useCallback(async (cartId: number) => {
    if (!user || !cartId) return;
    try {
      await api.delete(`/cart/${cartId}/`);
      setIsInCart(false);
      setCurrentCartQuantity(0);
      setCartItemId(null);
      toast.success("Product removed from cart.");
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Failed to remove product from cart.");
    }
  }, [user]);

  const handleIncreaseQuantity = useCallback(async (cartId: number) => {
    if (!user || !cartId) return;
    try {
      const newQuantity = latestCartState.current.currentCartQuantity + 1;
      await api.patch(`/cart/${cartId}/`, { quantity: newQuantity });
      setCurrentCartQuantity(newQuantity);
      toast.success("Quantity increased!");
    } catch (error) {
      console.error("Error increasing quantity:", error);
      if (axios.isAxiosError(error) && error.response && error.response.data?.quantity) {
        toast.error(`Failed to increase quantity: ${error.response.data.quantity[0]}`);
      } else {
        toast.error("Failed to increase quantity.");
      }
    }
  }, [user]);

  const handleDecreaseQuantity = useCallback(async (cartId: number) => {
    if (!user || !cartId) return;
    if (latestCartState.current.currentCartQuantity <= 1) {
      toast.info("Quantity cannot be less than 1. Use the remove button (trash icon) to take it out of cart.", {
        action: {
          label: 'Remove',
          onClick: () => handleRemoveFromCart(cartId),
        },
      });
      return;
    }
    try {
      const newQuantity = latestCartState.current.currentCartQuantity - 1;
      await api.patch(`/cart/${cartId}/`, { quantity: newQuantity });
      setCurrentCartQuantity(newQuantity);
      toast.success("Quantity decreased!");
    } catch (error) {
      console.error("Error decreasing quantity:", error);
      if (axios.isAxiosError(error) && error.response && error.response.data?.quantity) {
        toast.error(`Failed to decrease quantity: ${error.response.data.quantity[0]}`);
      } else {
        toast.error("Failed to decrease quantity.");
      }
    }
  }, [user, handleRemoveFromCart]);

  const handleWishlist = useCallback(async () => {
    if (!user || !data?.id) {
      toast.error("Please log in to manage your wishlist.");
      router.push('/login');
      return;
    }
    try {
      if (isWishlisted) {
        const wishlistResponse = await api.get<{ results: WishlistItemApi[] }>(`/wishlist/?product=${data.id}&user=${user.id}`);
        if (wishlistResponse.data.results.length > 0) {
          const wishlistItemId = wishlistResponse.data.results[0].id;
          await api.delete(`/wishlist/${wishlistItemId}/`);
          setIsWishlisted(false);
          toast.success("Product removed from wishlist!");
        } else {
          setIsWishlisted(false);
          toast.info("Product was not found in your wishlist. Syncing state.");
        }
      } else {
        const response = await api.post(`/wishlist/`, { product: data.id });
        setIsWishlisted(true);
        toast.success("Product added to wishlist!");
      }
    } catch (error: unknown) {
      console.error("Error updating wishlist:", error);
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 400 && error.response.data?.non_field_errors?.[0] === "The fields user, product must make a unique set.") {
          toast.info("Product is already in your wishlist.");
          setIsWishlisted(true);
        } else {
          toast.error(error.response.data?.message || `Failed to add to wishlist: ${error.response.statusText}`);
        }
      } else {
        toast.error("An unexpected error occurred while updating wishlist. Please try again.");
      }
    }
  }, [user, data?.id, isWishlisted, router]);

  const handleCompare = useCallback(() => {
    if (!data) return;
    const COMPARE_KEY = 'mhe_compare_products';
    if (typeof window !== 'undefined') {
      const currentCompare: ProductData[] = JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]');
      const existingProduct = currentCompare.find((p: ProductData) => p.id === data.id);
      if (!existingProduct) {
        const dataToStore = { ...data };
        if (data.hide_price) {
          const { price: _, ...restOfData } = dataToStore;
          currentCompare.push(restOfData as unknown as ProductData);
        } else {
          currentCompare.push(dataToStore);
        }
        localStorage.setItem(COMPARE_KEY, JSON.stringify(currentCompare));
        toast.success("Product added to comparison!");
      } else {
        toast.info("Product is already in comparison.");
      }
    }
  }, [data]);

  const handleBuyNow = useCallback(async () => {
    if (!user) {
      toast.error("Please log in to proceed with purchase.");
      router.push('/login');
      return;
    }
    if (!data || !data.direct_sale || data.stock_quantity === 0 || !data.is_active) {
      toast.error("This product is not available for direct purchase.");
      return;
    }
    try {
      if (!latestCartState.current.isInCart) {
        await api.post(`/cart/`, { product: data.id, quantity: 1 });
      }
      router.push('/cart');
    } catch (error: unknown) {
      console.error("Error during buy now process:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data?.message || `Failed to add product to cart: ${error.response.statusText}`);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  }, [user, router, data]);

  const handleShare = useCallback(() => {
    if (!data) return;
    const productUrl = window.location.href;
    const productTitle = data.name;
    if (navigator.share) {
      navigator.share({
        title: productTitle,
        url: productUrl,
      }).then(() => {
        toast.success('Product link shared successfully!');
      }).catch((error) => {
        if (error.name === 'AbortError') {
          toast.info('Sharing cancelled.');
        } else {
          toast.error('Failed to share product link.');
          console.error('Error sharing:', error);
        }
      });
    } else {
      navigator.clipboard.writeText(productUrl).then(() => {
        toast.success('Product link copied to clipboard!');
      }).catch((err) => {
        toast.error('Failed to copy link to clipboard.');
        console.error('Error copying link:', err);
      });
    }
  }, [data]);

  const registerReviewsRefresher = useCallback((refresher: () => void) => {
    reviewsRefresher.current = refresher;
  }, []);


  if (!data) {
    return (
      <div className="animate-pulse p-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="bg-gray-200 rounded-lg w-full md:w-96 h-96 mb-4" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-10 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const isPurchasable = data.is_active && (!data.direct_sale || data.stock_quantity > 0);
  const displayPrice = parseFloat(data.price).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formButtonText = data.type === 'rental' || data.type === 'used' ? "Rent Now" : "Get a Quote";
  const validSpecs = getValidSpecs(data.product_details);

  return (
    <div className="px-4 mx-auto p-2 sm:p-4 bg-white max-w-7xl">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side - Product Images */}
        <div className="flex flex-row-reverse gap-2 lg:gap-4 w-full md:w-fit">
          {/* Main Product Image */}
          <div
            className="relative bg-gray-50 rounded-lg overflow-hidden aspect-square w-full mx-auto group"
            onMouseMove={e => {
              if (isZoomed) {
                const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - left) / width) * 100;
                const y = ((e.clientY - top) / height) * 100;
                setPosition({ x, y });
              }
            }}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
          >
            <FallbackImage
              src={data.images[selectedImage]?.image || "/no-product.png"}
              alt={data.name}
              className="h-full object-contain transition-transform duration-200 ease-out"
              width={700}
              height={700}
              style={{
                transform: isZoomed ? "scale(2)" : "scale(1)",
                transformOrigin: `${position.x}% ${position.y}%`,
              }}
              fallbackSrc={data.category_details?.cat_image}
              priority
            />
            {/* Top right icons */}
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              <button
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
                onClick={handleWishlist}
                disabled={!data.is_active}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
              </button>
              <button
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 text-gray-600" />
              </button>
              <button
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
                onClick={handleCompare}
                disabled={!data.is_active}
              >
                <RotateCcw className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          {/* Thumbnail Images */}
          <div className="flex flex-col gap-2">
            {data.images.map((img, index) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(index)}
                className={`rounded border-2 overflow-hidden ${selectedImage === index ? "border-orange-500" : "border-gray-200"
                  } hover:border-orange-300 transition-colors`}
              >
                <Image
                  src={img.image}
                  alt={`${data.name} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  width={104}
                  height={104}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right Side - Product Details */}
        <div className="space-y-6 w-full">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-2/3">
              {/* Product Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{data.name}</h1>
              <div className="text-base text-gray-600 mb-2">
                {data.category_name} {data.subcategory_name ? `> ${data.subcategory_name}` : ''}
              </div>
              {/* Rating and Reviews */}
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                {data.average_rating !== null && data.average_rating > 0 ? (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= (data.average_rating || 0) ? "fill-orange-400 text-orange-400" : "text-gray-300"
                          }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-1">({data.average_rating.toFixed(1)})</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-600">No ratings yet</span>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <span
                      className="text-sm text-blue-600 hover:underline cursor-pointer"
                    >
                      Write a Review
                    </span>
                  </DialogTrigger>
                  <DialogContent className="w-full max-w-2xl">
                    <MheWriteAReview
                      productId={data.id}
                    />
                  </DialogContent>
                </Dialog>
                {data.manufacturer && (
                  <span className="text-sm text-gray-600">by {data.manufacturer}</span>
                )}
              </div>
              {/* Price */}
              <div className="mb-2">
                {(data.hide_price || Number(data.price) <= 0) ? (
                  <span className="text-2xl font-bold text-gray-400">₹ *******</span>
                ) : (
                  <span className="text-2xl font-bold text-green-700">₹{displayPrice}</span>
                )}
              </div>
              <div className="text-xs text-gray-500 mb-2">Incl. of all taxes</div>
            </div>
            {/* Delivery & Actions */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
              {/* Delivery Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="space-y-2">
                  {data.stock_quantity > 0 && data.direct_sale ? (
                    <p className="text-sm font-semibold text-green-800">
                      <span className="font-bold">In Stock: {data.stock_quantity} units</span>
                    </p>
                  ) : data.stock_quantity === 0 && data.direct_sale ? (
                    <p className="text-sm font-semibold text-red-600">
                      Out of Stock
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-blue-600">
                      Available for {data.type === 'rental' ? 'Rental' : 'Quote'}
                    </p>
                  )}
                  {!data.is_active && (
                    <p className="text-sm font-semibold text-red-600">
                      Product is currently inactive.
                    </p>
                  )}
                  <p className="font-semibold text-green-800">
                    <span className="font-bold">FREE delivery</span> (Delivery details coming soon.){" "}
                    <span className="text-blue-600 hover:underline cursor-pointer">Details</span>
                  </p>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                {data.direct_sale && isPurchasable ? (
                  <>
                    {isInCart ? (
                      <div className="flex items-center justify-between bg-green-50 text-green-700 font-medium py-2 px-3 rounded-md text-base">
                        <button
                          onClick={() => cartItemId && handleDecreaseQuantity(cartItemId)}
                          disabled={currentCartQuantity <= 1}
                          className="p-1 rounded hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="text-green-800 font-semibold text-center w-8">
                          {currentCartQuantity}
                        </span>
                        <button
                          onClick={() => cartItemId && handleIncreaseQuantity(cartItemId)}
                          className="p-1 rounded hover:bg-green-100"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => cartItemId && handleRemoveFromCart(cartItemId)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors ml-2"
                          aria-label="Remove from cart"
                          title="Remove from Cart"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(data.id)}
                        className="w-full bg-[#5CA131] hover:bg-green-700 text-white font-semibold py-3 rounded-md text-base transition"
                        aria-label="Add to cart"
                      >
                        <ShoppingCart className="inline-block mr-2 w-5 h-5" /> Add to Cart
                      </button>
                    )}
                    <button
                      onClick={handleBuyNow}
                      className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-md text-base transition"
                      aria-label="Buy now"
                    >
                      Buy Now
                    </button>
                  </>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        className="w-full bg-[#5CA131] hover:bg-green-700 text-white font-semibold py-3 rounded-md text-base transition"
                        aria-label={formButtonText}
                        disabled={!data.is_active}
                      >
                        {formButtonText}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-2xl">
                      {data.type === 'rental' || data.type === 'used' ? (
                        <RentalForm
                          productId={data.id}
                          productDetails={{
                            image: data.images[0]?.image || data.category_details?.cat_image || "/no-product.png",
                            title: data.name,
                            description: data.description,
                            price: data.price,
                            stock_quantity: data.stock_quantity,
                          }}
                        />
                      ) : (
                        <QuoteForm product={data} />
                      )}
                    </DialogContent>
                  </Dialog>
                )}
                <button
                  onClick={handleCompare}
                  className="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-md text-base hover:bg-gray-50 transition"
                >
                  Compare
                </button>
              </div>
            </div>
          </div>
          {/* Features Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-semibold text-xs mb-1">Worldwide Delivery</p>
              <p className="text-xs text-gray-600">We deliver products globally</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Headphones className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-semibold text-xs mb-1">Support 24/7</p>
              <p className="text-xs text-gray-600">Reach our experts today!</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-semibold text-xs mb-1">First Purchase Discount</p>
              <p className="text-xs text-gray-600">Up to 15% discount</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <RotateCcw className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-semibold text-xs mb-1">Easy Returns</p>
              <p className="text-xs text-gray-600">Read our return policy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion Section */}
      <div className="mt-8">
        {/* Description */}
        <div className="border rounded-lg mb-4 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition"
            onClick={() => setOpenAccordion(openAccordion === "desc" ? null : "desc")}
          >
            <span className="font-semibold">Description</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${openAccordion === "desc" ? "rotate-180" : ""}`} />
          </button>
          {openAccordion === "desc" && (
            <div className="px-4 py-3 text-gray-700 text-sm whitespace-pre-line" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.description) }} />
          )}
        </div>
        {/* Specification */}
        <div className="border rounded-lg mb-4 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition"
            onClick={() => setOpenAccordion(openAccordion === "spec" ? null : "spec")}
          >
            <span className="font-semibold">Product Specifications</span>
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-200 text-gray-600 ${openAccordion === "spec" ? "rotate-180" : ""
                }`}
            />
          </button>
          {openAccordion === "spec" && (
            <div className="p-0">
              {validSpecs.length > 0 ? (
                <div className="overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Specification
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {validSpecs.map(([key, value], index) => (
                        <tr
                          key={key}
                          className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                            }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-700">
                              {formatKey(key)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900 font-medium">
                              {String(value)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No specifications available at this time.</p>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Vendor */}
        <div className="border rounded-lg mb-4 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition"
            onClick={() => setOpenAccordion(openAccordion === "vendor" ? null : "vendor")}
          >
            <span className="font-semibold">Vendor</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${openAccordion === "vendor" ? "rotate-180" : ""}`} />
          </button>
          {openAccordion === "vendor" && (
            <div className="px-4 py-3 text-gray-700 text-sm whitespace-pre-line">{data.user_name || "N/A"}</div>
          )}
        </div>
      </div>
      {data.id && <ReviewSection productId={data.id} registerRefresher={registerReviewsRefresher} />}

      
    </div>
  );
}