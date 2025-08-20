// src/components/product/IndividualProduct.tsx
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
  ChevronUp,
  ShoppingCart,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import axios from "axios";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import QuoteForm from "@/components/forms/enquiryForm/quotesForm";
import RentalForm from "@/components/forms/enquiryForm/rentalForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import MheWriteAReview from "@/components/forms/product/ProductReviewForm";
import ReviewSection from "./Reviews";
import DOMPurify from "dompurify";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
  review_count: number;
  category_details?: {
    cat_image: string | null;
  };
  videos?: string[];
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
  productId: number | string | null;
}

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
      unoptimized={
        imgSrc.startsWith("/placeholder-image.png") || imgSrc === fallbackSrc
      }
      onError={handleError}
    />
  );
};

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function ProductSection({ productId }: ProductSectionProps) {
  const router = useRouter();
  const { user } = useUser();

  const [data, setData] = useState<ProductData | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<
    "desc" | "spec" | "vendor" | null
  >("desc");
  const [isInCart, setIsInCart] = useState(false);
  const [currentCartQuantity, setCurrentCartQuantity] = useState(0);
  const [cartItemId, setCartItemId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for the media gallery modal
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const reviewsRefresher = useRef<(() => void) | null>(null);
  const latestCartState = useRef({ currentCartQuantity, cartItemId, isInCart });
  useEffect(() => {
    latestCartState.current = { currentCartQuantity, cartItemId, isInCart };
  }, [currentCartQuantity, cartItemId, isInCart]);

  const formatKey = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .trim();
  };

  const getValidSpecs = (specs: Record<string, unknown> | null) => {
    if (!specs) return [];
    return Object.entries(specs).filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        value !== "" &&
        String(value).trim() !== ""
    );
  };

  const fetchInitialStatus = useCallback(async () => {
    if (user && data?.id) {
      try {
        const wishlistResponse = await api.get<{ results: WishlistItemApi[] }>(
          `/wishlist/?product=${data.id}&user=${user.id}`
        );
        setIsWishlisted(wishlistResponse.data.results.length > 0);

        const cartResponse = await api.get<{ results: CartItemApi[] }>(
          `/cart/?product=${data.id}&user=${user.id}`
        );
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
      setIsLoading(true);
      if (!productId) {
        router.push("/404");
        return;
      }
      try {
        const productRes = await api.get<ProductData>(
          `/products/${productId}/`
        );
        const foundProduct = productRes.data;

        const categoryRes = await api.get(`/categories/${foundProduct.category}`);
        const categoryWithImage = {
          ...foundProduct,
          category_details: categoryRes.data,
        };

        if (categoryWithImage) {
          setData(categoryWithImage);
          if (categoryWithImage.images.length > 0) {
            setSelectedImage(0);
          }
        } else {
          router.push("/404");
        }
      } catch (error) {
        console.error("Failed to fetch product data:", error);
        router.push("/404");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [productId, router]);

  useEffect(() => {
    fetchInitialStatus();
  }, [fetchInitialStatus]);

  const handleAddToCart = useCallback(
    async (productId: number) => {
      if (!user) {
        toast.error("Please log in to add products to your cart.");
        router.push("/login");
        return;
      }
      try {
        if (latestCartState.current.isInCart) {
          toast.info("This product is already in your cart.", {
            action: {
              label: "View Cart",
              onClick: () => router.push("/cart"),
            },
          });
          return;
        }
        const response = await api.post(`/cart/`, {
          product: productId,
          quantity: 1,
        });
        setIsInCart(true);
        setCurrentCartQuantity(1);
        setCartItemId(response.data.id);
        toast.success("Product added to cart!", {
          action: {
            label: "View Cart",
            onClick: () => router.push("/cart"),
          },
        });
      } catch (error: unknown) {
        console.error("Error adding to cart:", error);
        if (axios.isAxiosError(error) && error.response) {
          if (
            error.response.status === 400 &&
            error.response.data?.non_field_errors?.[0] ===
            "The fields user, product must make a unique set."
          ) {
            toast.info("Product is already in your cart.", {
              action: {
                label: "View Cart",
                onClick: () => router.push("/cart"),
              },
            });
            fetchInitialStatus();
          } else {
            toast.error(
              error.response.data?.message ||
              `Failed to add to cart: ${error.response.statusText}`
            );
          }
        } else {
          toast.error(
            "An unexpected error occurred while adding to cart. Please try again."
          );
        }
      }
    },
    [user, router, fetchInitialStatus]
  );

  const handleRemoveFromCart = useCallback(
    async (cartId: number) => {
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
    },
    [user]
  );

  const handleIncreaseQuantity = useCallback(
    async (cartId: number) => {
      if (!user || !cartId) return;
      try {
        const newQuantity = latestCartState.current.currentCartQuantity + 1;
        await api.patch(`/cart/${cartId}/`, { quantity: newQuantity });
        setCurrentCartQuantity(newQuantity);
        toast.success("Quantity increased!");
      } catch (error) {
        console.error("Error increasing quantity:", error);
        if (
          axios.isAxiosError(error) &&
          error.response &&
          error.response.data?.quantity
        ) {
          toast.error(
            `Failed to increase quantity: ${error.response.data.quantity[0]}`
          );
        } else {
          toast.error("Failed to increase quantity.");
        }
      }
    },
    [user]
  );

  const handleDecreaseQuantity = useCallback(
    async (cartId: number) => {
      if (!user || !cartId) return;
      if (latestCartState.current.currentCartQuantity <= 1) {
        toast.info(
          "Quantity cannot be less than 1. Use the remove button (trash icon) to take it out of cart.",
          {
            action: {
              label: "Remove",
              onClick: () => handleRemoveFromCart(cartId),
            },
          }
        );
        return;
      }
      try {
        const newQuantity = latestCartState.current.currentCartQuantity - 1;
        await api.patch(`/cart/${cartId}/`, { quantity: newQuantity });
        setCurrentCartQuantity(newQuantity);
        toast.success("Quantity decreased!");
      } catch (error) {
        console.error("Error decreasing quantity:", error);
        if (
          axios.isAxiosError(error) &&
          error.response &&
          error.response.data?.quantity
        ) {
          toast.error(
            `Failed to decrease quantity: ${error.response.data.quantity[0]}`
          );
        } else {
          toast.error("Failed to decrease quantity.");
        }
      }
    },
    [user, handleRemoveFromCart]
  );

  const handleWishlist = useCallback(async () => {
    if (!user || !data?.id) {
      toast.error("Please log in to manage your wishlist.");
      router.push("/login");
      return;
    }
    try {
      if (isWishlisted) {
        const wishlistResponse = await api.get<{ results: WishlistItemApi[] }>(
          `/wishlist/?product=${data.id}&user=${user.id}`
        );
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
        await api.post(`/wishlist/`, { product: data.id });
        setIsWishlisted(true);
        toast.success("Product added to wishlist!");
      }
    } catch (error: unknown) {
      console.error("Error updating wishlist:", error);
      if (axios.isAxiosError(error) && error.response) {
        if (
          error.response.status === 400 &&
          error.response.data?.non_field_errors?.[0] ===
          "The fields user, product must make a unique set."
        ) {
          toast.info("Product is already in your wishlist.");
          setIsWishlisted(true);
        } else {
          toast.error(
            error.response.data?.message ||
            `Failed to add to wishlist: ${error.response.statusText}`
          );
        }
      } else {
        toast.error(
          "An unexpected error occurred while updating wishlist. Please try again."
        );
      }
    }
  }, [user, data?.id, isWishlisted, router]);

  const handleCompare = useCallback(() => {
    if (!data) return;
    const COMPARE_KEY = "mhe_compare_products";
    if (typeof window !== "undefined") {
      const currentCompare: ProductData[] = JSON.parse(
        localStorage.getItem(COMPARE_KEY) || "[]"
      );
      const existingProduct = currentCompare.find(
        (p: ProductData) => p.id === data.id
      );
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
      router.push("/login");
      return;
    }
    if (
      !data ||
      !data.direct_sale ||
      data.stock_quantity === 0 ||
      !data.is_active
    ) {
      toast.error("This product is not available for direct purchase.");
      return;
    }
    try {
      if (!latestCartState.current.isInCart) {
        await api.post(`/cart/`, { product: data.id, quantity: 1 });
      }
      router.push("/cart");
    } catch (error: unknown) {
      console.error("Error during buy now process:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data?.message ||
          `Failed to add product to cart: ${error.response.statusText}`
        );
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
      navigator
        .share({
          title: productTitle,
          url: productUrl,
        })
        .then(() => {
          toast.success("Product link shared successfully!");
        })
        .catch((error) => {
          if (error.name === "AbortError") {
            toast.info("Sharing cancelled.");
          } else {
            toast.error("Failed to share product link.");
            console.error("Error sharing:", error);
          }
        });
    } else {
      navigator.clipboard
        .writeText(productUrl)
        .then(() => {
          toast.success("Product link copied to clipboard!");
        })
        .catch((err) => {
          toast.error("Failed to copy link to clipboard.");
          console.error("Error copying link:", err);
        });
    }
  }, [data]);

  const registerReviewsRefresher = useCallback((refresher: () => void) => {
    reviewsRefresher.current = refresher;
  }, []);

  const openGallery = (index: number) => {
    setCurrentMediaIndex(index);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
  };

  const goToNextMedia = () => {
    if (data?.images) {
      setCurrentMediaIndex((prevIndex) =>
        (prevIndex + 1) % data.images.length
      );
    }
  };

  const goToPrevMedia = () => {
    if (data?.images) {
      setCurrentMediaIndex((prevIndex) =>
        (prevIndex - 1 + data.images.length) % data.images.length
      );
    }
  };

  if (isLoading) {
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

  if (!data) {
    return null;
  }

  const isPurchasable =
    data.is_active && (!data.direct_sale || data.stock_quantity > 0);
  const displayPrice = parseFloat(data.price).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const originalPrice = parseFloat(data.price);
  const fakePrice = (originalPrice * 1.1).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const youSaveAmount = (originalPrice * 0.1).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formButtonText =
    data.type === "rental" || data.type === "used" ? "Rent Now" : "Get a Quote";
  const validSpecs = getValidSpecs(data.product_details);

  return (
    <motion.div
      className="px-4 mx-auto p-2 sm:p-4 bg-white w-full max-w-7xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* --- Breadcrumb Section (Corrected and Responsive) --- */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm md:text-base">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="text-gray-600 hover:underline">
              Home
            </Link>
          </li>
          {data.category_name && (
            <>
              <li className="text-gray-400">/</li>
              <li className="truncate max-w-[100px] sm:max-w-none">
                <Link
                  href={`/products?category=${data.category_name.toLowerCase()}`}
                  className="text-gray-600 hover:underline"
                >
                  {data.category_name}
                </Link>
              </li>
            </>
          )}
          {data.subcategory_name && (
            <>
              <li className="text-gray-400">/</li>
              <li className="truncate max-w-[100px] sm:max-w-none">
                <Link
                  href={`/products?category=${data.category_name.toLowerCase()}&subcategory=${data.subcategory_name.toLowerCase()}`}
                  className="text-gray-600 hover:underline"
                >
                  {data.subcategory_name}
                </Link>
              </li>
            </>
          )}
          <li className="text-gray-400">/</li>
          <li className="truncate max-w-[200px] sm:max-w-full font-semibold text-gray-800">
            {data.name}
          </li>
        </ol>
      </nav>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side - Product Images */}
        <div className="flex flex-col md:flex-row-reverse gap-4 w-full md:w-[40%]">
          {/* Main Product Image with Trigger */}
          <button
            className="relative bg-gray-50 rounded-lg overflow-hidden aspect-square w-full md:w-[464px] md:h-[464px] mx-auto group cursor-zoom-in"
            onClick={() => openGallery(selectedImage)}
            aria-label="View product images in full-screen gallery"
          >
            <FallbackImage
              src={data.images[selectedImage]?.image || "/no-product.png"}
              alt={data.name}
              className="h-full w-full object-contain"
              width={700}
              height={700}
              fallbackSrc={data.category_details?.cat_image}
              priority
            />
            {/* Top right icons */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
                onClick={(e) => { e.stopPropagation(); handleWishlist(); }}
                disabled={!data.is_active}
                aria-label="Add to wishlist"
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${isWishlisted
                    ? "fill-red-500 text-red-500"
                    : "text-gray-600"
                    }`}
                />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                aria-label="Share product"
              >
                <Share2 className="w-4 h-4 text-gray-600" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
                onClick={(e) => { e.stopPropagation(); handleCompare(); }}
                disabled={!data.is_active}
                aria-label="Compare product"
              >
                <RotateCcw className="w-4 h-4 text-gray-600" />
              </motion.button>
            </div>
          </button>

          {/* Responsive Thumbnail Bar */}
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-hidden p-2 md:p-0 md:h-auto">
            {data.images.map((img, index) => (
              <motion.button
                key={img.id}
                onClick={() => setSelectedImage(index)}
                className={`rounded border-2 overflow-hidden flex-shrink-0 w-20 h-20 md:w-[104px] md:h-[104px] ${selectedImage === index
                  ? "border-orange-500"
                  : "border-gray-200"
                  } hover:border-orange-300 transition-colors`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Select image ${index + 1}`}
              >
                <Image
                  src={img.image}
                  alt={`${data.name} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  width={104}
                  height={104}
                />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right Side - Product Details */}
        <div className="space-y-6 w-full md:w-[60%]">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-2/3">
              {/* Product Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {`${data.name} ${data.model} ${data.manufacturer ? data.manufacturer : data.user_name.replace('_', ' ')}`}
              </h1>
              {/* Rating and Reviews */}
              <div className="flex items-center gap-1 mb-4 flex-wrap">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 transition-colors ${data.average_rating !== null && star <= data.average_rating
                        ? "fill-orange-400 text-orange-400"
                        : "text-gray-300"
                        }`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-1">
                    ({data.average_rating ? data.average_rating.toFixed(1) : "0.0"})
                  </span>
                </div>
                <p className="text-sm text-gray-600">|</p>

                <Dialog>
                  <DialogTrigger asChild>
                    <span className="text-sm hover:underline cursor-pointer">
                      {data.review_count > 0
                        ? `${data.review_count} Reviews`
                        : "Write a Review"}
                    </span>
                  </DialogTrigger>
                  <DialogContent className="w-full max-w-2xl">
                    <MheWriteAReview productId={data.id} />
                  </DialogContent>
                </Dialog>

                <p className="text-sm text-gray-600">|</p>

                <span className="text-base text-gray-600">by</span>
                <Link
                  href={`/vendor-listing/${data.user_name}`}
                  className="text-base hover:underline"
                >
                  {data.user_name || "MHE Bazar"}
                </Link>
              </div>
              {/* Price */}
              <div className="mb-2">
                {data.hide_price || Number(data.price) <= 0 ? (
                  <span className="text-2xl font-semibold text-[#5CA131]">
                    ₹ *******
                  </span>
                ) : (
                  <>
                    <p className="text-2xl font-semibold text-[#5CA131]">
                      ₹{displayPrice} excl. GST
                    </p>
                    <p className="text-sm text-gray-500 line-through">
                      ₹{fakePrice} incl. GST
                    </p>
                    <p className="text-sm mt-1">
                      You Save: ₹{youSaveAmount} incl. of all taxes
                    </p>
                  </>
                )}
              </div>
            </div>
            {/* Delivery & Actions */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
              {/* Delivery Info */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="space-y-2">
                  {data.stock_quantity > 0 && data.direct_sale ? (
                    <p className="text-base font-bold text-green-600">
                      Only {data.stock_quantity} left in stock
                    </p>
                  ) : data.stock_quantity === 0 && data.direct_sale ? (
                    <p className="text-base font-semibold text-red-600">
                      Out of Stock
                    </p>
                  ) : (
                    <p className="text-base font-semibold text-blue-600">
                      Available for{" "}
                      {data.type === "rental" ? "Rental" : "Quote"}
                    </p>
                  )}
                  {!data.is_active && (
                    <p className="text-sm font-semibold text-red-600">
                      Product is currently inactive.
                    </p>
                  )}
                </div>
                {data.direct_sale && isPurchasable ? (
                  <div className="mt-4 flex flex-col gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAddToCart(data.id)}
                      className="w-full bg-[#5CA131] hover:bg-green-700 text-white font-semibold py-3 rounded-md text-base transition"
                      aria-label="Add to cart"
                    >
                      <ShoppingCart className="inline-block mr-2 w-5 h-5" /> Add
                      to Cart
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBuyNow}
                      className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-md text-base transition"
                      aria-label="Buy now"
                    >
                      Buy Now
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCompare}
                      className="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-md text-base hover:bg-gray-50 transition"
                      disabled={!data.is_active}
                      aria-label="Compare product"
                    >
                      Compare
                    </motion.button>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-2">
                    {(data.type === "rental" || data.type === "used") ? (
                      <>
                        <Dialog>
                          <DialogTrigger asChild>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full bg-[#5CA131] hover:bg-green-700 text-white font-semibold py-3 rounded-md text-base transition"
                              aria-label="Rent Now"
                              disabled={!data.is_active}
                            >
                              Rent Now
                            </motion.button>
                          </DialogTrigger>
                          <DialogContent className="w-full max-w-2xl">
                            <RentalForm
                              productId={data.id}
                              productDetails={{
                                image:
                                  data.images[0]?.image ||
                                  data.category_details?.cat_image ||
                                  "/no-product.png",
                                title: data.name,
                                description: data.description,
                                price: data.price,
                                stock_quantity: data.stock_quantity,
                              }}
                              onClose={() => document.querySelector<HTMLButtonElement>('[data-dialog-close]')?.click()}
                            />
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-md text-base transition"
                              aria-label="Get a Quote"
                              disabled={!data.is_active}
                            >
                              Get a Quote
                            </motion.button>
                          </DialogTrigger>
                          <DialogContent className="w-full max-w-2xl">
                            <QuoteForm product={data} onClose={() => document.querySelector<HTMLButtonElement>('[data-dialog-close]')?.click()} />
                          </DialogContent>
                        </Dialog>
                      </>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-[#5CA131] hover:bg-green-700 text-white font-semibold py-3 rounded-md text-base transition"
                            aria-label={formButtonText}
                            disabled={!data.is_active}
                          >
                            {formButtonText}
                          </motion.button>
                        </DialogTrigger>
                        <DialogContent className="w-full max-w-2xl">
                          <QuoteForm product={data} onClose={() => document.querySelector<HTMLButtonElement>('[data-dialog-close]')?.click()}
                          />
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                )}
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
              <p className="text-xs text-gray-600">
                We deliver products globally
              </p>
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
              <p className="font-semibold text-xs mb-1">
                First Purchase Discount
              </p>
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

          <div className="pt-6 border-t border-gray-200">
            <p className="text-2xl font-bold">Product Details</p>
            <p
              className="line-clamp-4"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(data.description),
              }}
            ></p>
            <Dialog>
              <DialogTrigger asChild>
                <motion.p
                  whileHover={{ x: 5 }}
                  className=" underline cursor-pointer font-semibold"
                  aria-label={formButtonText}
                  disabled={!data.is_active}
                >
                  {formButtonText}
                </motion.p>
              </DialogTrigger>
              <DialogContent className="w-full max-w-2xl">
                {data.type === "rental" || data.type === "used" ? (
                  <RentalForm
                    productId={data.id}
                    productDetails={{
                      image:
                        data.images[0]?.image ||
                        data.category_details?.cat_image ||
                        "/no-product.png",
                      title: data.name,
                      description: data.description,
                      price: data.price,
                      stock_quantity: data.stock_quantity,
                    }}
                    onClose={() => document.querySelector<HTMLButtonElement>('[data-dialog-close]')?.click()}
                  />
                ) : (
                  <QuoteForm product={data} onClose={() => document.querySelector<HTMLButtonElement>('[data-dialog-close]')?.click()}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Accordion Section */}
      <div className="mt-8">
        {/* Description */}
        <div className="border rounded-lg mb-4 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors"
            onClick={() =>
              setOpenAccordion(openAccordion === "desc" ? null : "desc")
            }
          >
            <span className="font-bold text-xl">Description</span>
            <motion.div
              animate={{ rotate: openAccordion === "desc" ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </button>
          <AnimatePresence>
            {openAccordion === "desc" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="px-4 py-3 text-gray-700 text-sm whitespace-pre-line overflow-hidden"
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(data.description),
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Specification */}
        <div className="border rounded-lg mb-4 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors"
            onClick={() =>
              setOpenAccordion(openAccordion === "spec" ? null : "spec")
            }
          >
            <span className="font-bold text-xl">Specification</span>
            <motion.div
              animate={{ rotate: openAccordion === "spec" ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </button>
          <AnimatePresence>
            {openAccordion === "spec" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="p-0 overflow-hidden"
              >
                {
                  validSpecs.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
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
                          {validSpecs.flatMap(([key, value], index) => {
                            if (
                              typeof value === "string" &&
                              value.startsWith("[") &&
                              value.endsWith("]")
                            ) {
                              try {
                                const parsedArray = JSON.parse(value);
                                if (Array.isArray(parsedArray)) {
                                  return parsedArray.map((item, specIndex) => {
                                    const parts = item.split(/:\s*(.*)/s);
                                    const specKey = parts[0] || "Detail";
                                    const specValue = parts[1] || item;

                                    return (
                                      <tr
                                        key={`${key}-${specIndex}`}
                                        className={`hover:bg-gray-50 transition-colors duration-150 ${specIndex % 2 === 0 ? "bg-white" : "bg-gray-25"
                                          }`}
                                      >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <span className="text-sm font-medium text-gray-700">
                                            {specKey}
                                          </span>
                                        </td>
                                        <td className="px-6 py-4">
                                          <span className="text-sm text-gray-900 font-medium">
                                            {specValue}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  });
                                }
                              } catch (e) {
                                console.error("Failed to parse spec string:", value, e);
                              }
                            }

                            return (
                              <tr
                                key={key}
                                className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? "bg-white" : "bg-gray-25"
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
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 px-6">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">
                        No specifications available at this time.
                      </p>
                    </div>
                  )
                }
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Vendor */}
        <div className="border rounded-lg mb-4 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors"
            onClick={() =>
              setOpenAccordion(openAccordion === "vendor" ? null : "vendor")
            }
          >
            <span className="font-bold text-xl">Vendor</span>
            <motion.div
              animate={{ rotate: openAccordion === "vendor" ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </button>
          <AnimatePresence>
            {openAccordion === "vendor" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="px-4 py-3 text-gray-700 text-sm whitespace-pre-line"
              >
                {data.user_name || "N/A"}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {data.id && (
        <ReviewSection
          productId={data.id}
          registerRefresher={registerReviewsRefresher}
        />
      )}

      {/* --- New, Dedicated, Centered Media Gallery Modal --- */}
      <AnimatePresence>
        {isGalleryOpen && (
          <motion.div
            className="fixed inset-0 z-[9999] bg-black/90 p-4 md:p-8 flex items-center justify-center overflow-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative w-full h-full max-w-6xl flex flex-col items-center justify-center">
              {/* Close button at the top right */}
              <button
                className="absolute top-4 right-4 text-white z-20 hover:scale-110 transition-transform"
                onClick={closeGallery}
                aria-label="Close media gallery"
              >
                <X className="w-8 h-8" />
              </button>

              {/* Main media view */}
              <div className="relative w-full h-[70vh] md:h-[80vh] flex items-center justify-center">
                <FallbackImage
                  src={data.images[currentMediaIndex]?.image || "/no-product.png"}
                  alt={`${data.name} media ${currentMediaIndex + 1}`}
                  className="max-h-full max-w-full object-contain rounded-md"
                  width={1000}
                  height={1000}
                  fallbackSrc={data.category_details?.cat_image}
                  priority
                />

                {/* Navigation arrows */}
                {data.images.length > 1 && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-40 transition-colors z-10"
                      onClick={goToPrevMedia}
                      aria-label="Previous media item"
                    >
                      <ChevronLeft className="w-6 h-6 text-black" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-40 transition-colors z-10"
                      onClick={goToNextMedia}
                      aria-label="Next media item"
                    >
                      <ChevronRight className="w-6 h-6 text-black" />
                    </motion.button>
                  </>
                )}
              </div>

              {/* Responsive Thumbnails at the bottom */}
              <div className="mt-4 w-full flex justify-center overflow-x-auto gap-2">
                {data.images.map((img, index) => (
                  <motion.button
                    key={img.id}
                    onClick={() => setCurrentMediaIndex(index)}
                    className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 ${currentMediaIndex === index
                      ? "border-orange-500"
                      : "border-transparent hover:border-gray-600"
                      }`}
                    aria-label={`Select media thumbnail ${index + 1}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Image
                      src={img.image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      width={80}
                      height={80}
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}