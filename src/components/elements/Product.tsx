/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Heart,
  Repeat,
  Share2,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@/context/UserContext"; 
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import QuoteForm from "../forms/enquiryForm/quotesForm";
import RentalForm from "../forms/enquiryForm/rentalForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import DOMPurify from "dompurify";
import categories from "@/data/categories.json";
import { Badge } from "../ui/badge";

const imgUrl =
  process.env.NEXT_PUBLIC_API_BASE_MEDIA_URL ||
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

// Helper function for SEO-friendly slug (URL part - unchanged as requested)
const slugify = (text: string): string => {
  // 1. Convert to lowercase, trim.
  let slug = (text || '')
    .toString()
    .toLowerCase()
    .trim();

  // 2. Replace unwanted characters with a space first. 
  // Allowed characters for the URL slug are a-z, 0-9, and period (.).
  // Everything else (including -, /, (, ), \) is replaced by a space.
  slug = slug.replace(/[^a-z0-9\.\s]/g, ' ');

  // 3. Collapse multiple spaces into a single hyphen (-).
  // This is the desired primary separator for URL slugs.
  slug = slug.replace(/\s+/g, '-');

  // 4. Remove leading/trailing hyphens or periods.
  slug = slug.replace(/^-+|-+$/g, '');
  slug = slug.replace(/^\.+|\.+$/g, '');

  return slug;
};

// Interface for ProductCard display props
interface ProductCardDisplayProps {
  id: number;
  image: string;
  category_id: number | null;
  title: string;
  subtitle: string | null | undefined;
  price: string | number;
  currency: string;
  directSale: boolean;
  is_active: boolean;
  hide_price: boolean;
  stock_quantity: number;
  isWishlisted: boolean;
  isInCart: boolean;
  currentCartQuantity: number;
  cartItemId: number | null;
  onAddToCartClick: (productId: number) => void;
  onWishlistClick: (productId: number) => void;
  onCompareClick: (productData: Record<string, unknown>) => void;
  onBuyNowClick: (productId: number) => void;
  onShareClick: (url: string, title: string) => void;
  onIncreaseQuantity: (cartItemId: number) => void;
  onDecreaseQuantity: (cartItemId: number) => void;
  onRemoveFromCart: (cartItemId: number) => void;
  productData: Record<string, unknown>;
  productType: string;
  pageUrlType: string;
}

// Custom Image component with an error handler to show a fallback
const FallbackImage = ({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc,
  sizes,
  quality,
}: {
  src: string | null | undefined;
  alt: string;
  width: number;
  height: number;
  className: string;
  fallbackSrc?: string | null;
  sizes?: string;
  quality?: number;
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src || "/placeholder-image.png");
  const [error, setError] = useState(false);

  useEffect(() => {
    setImgSrc(src || "/placeholder-image.png");
    setError(false);
  }, [src]);

  const handleError = () => {
    if (!error) {
      if (fallbackSrc) {
        setImgSrc(imgUrl + fallbackSrc);
      } else {
        setImgSrc("/placeholder-image.png"); // Default placeholder
      }
      setError(true);
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt || "Product Image"}
      width={width}
      height={height}
      className={className}
      quality={quality}
      sizes={sizes}
      unoptimized={
        imgSrc?.startsWith("/placeholder-image.png") || imgSrc === fallbackSrc
      }
      onError={handleError}
    />
  );
};

const ProductCard = ({
  id,
  image,
  category_id,
  title,
  subtitle,
  price,
  currency,
  directSale,
  is_active,
  hide_price,
  stock_quantity,
  isWishlisted,
  isInCart,
  currentCartQuantity,
  cartItemId,
  onAddToCartClick,
  onWishlistClick,
  onCompareClick,
  onBuyNowClick,
  onShareClick,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRemoveFromCart,
  productData,
  productType,
  pageUrlType,
}: ProductCardDisplayProps) => {
  const isAvailable = is_active && (!directSale || stock_quantity > 0);
  const isPurchasable = is_active && (!directSale || stock_quantity > 0);

  // ✅ Slug: Use the perfect slugify function
  const cleanTitleForSlug = `${(productData.user_name || "").replace("_", " ")} ${
    title || ""
  } ${productData.model || ""}`.trim();
  const productSlug = slugify(cleanTitleForSlug);
  const productDetailUrl = `/product/${productSlug}-${id}`; // Use hyphen to separate slug and ID

  // Determine button text and form based on page URL type
  const isRentalPage = pageUrlType === "rental";
  const isUsedPage = pageUrlType === "used";
  const formButtonText = isRentalPage ? "Rent Now" : "Get a Quote";

  // Format price with Rupee symbol and handle hidden/zero price
  const displayPrice =
    hide_price || parseFloat(price.toString()) <= 0 ? (
      <span className="text-xl font-bold text-gray-400 tracking-wider">
        ₹ *******
      </span>
    ) : (
      <span className="text-xl font-bold text-green-600 tracking-wide">
        ₹{" "}
        {typeof price === "number"
          ? price.toLocaleString("en-IN")
          : parseFloat(price.toString()).toLocaleString("en-IN")}
      </span>
    );

  // Create a lookup map for category images for fast access
  const categoryImageMap = useMemo(() => {
    const map: { [key: number]: string } = {};

    const processCategory = (category: any) => {
      if (category.id && category.image_url) {
        map[category.id] = category.image_url;
      }
      if (category.subcategories && category.subcategories.length > 0) {
        category.subcategories.forEach(processCategory);
      }
    };

    categories.forEach(processCategory);
    return map;
  }, []);

  const categoryFallbackImage = category_id
    ? categoryImageMap[category_id]
    : null;

  const badgeStyles = {
    new: "border-green-400 bg-green-100 text-green-800",
    used: "border-yellow-400 bg-yellow-100 text-yellow-800",
    rental: "border-blue-400 bg-blue-100 text-blue-800",
    attachments: "border-slate-400 bg-slate-100 text-slate-800",
  };

  const showNewBadge = () => {
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const productDate = new Date(productData.created_at as string);
    const currentDate = new Date();
    const differenceInMs = currentDate.getTime() - productDate.getTime();

    // The product is new if it was created within the last 30 days
    return differenceInMs <= thirtyDaysInMs;
  };
  
  // ✅ FIX: Clean the displayed title, allowing all requested punctuation for UI presentation
  const displayTitle = `${(productData.user_name || "").replace("_", " ")} ${
    title || ""
  } ${productData.model || ""}`
    // Allow letters, numbers, spaces, and all requested punctuation marks.
    .replace(/[^a-zA-Z0-9 \-\.\(\)/\\*?,!@#$^&%]/g, "") 
    .replace(/\s+/g, " ")
    .trim();

  return (
    <div
      className={`bg-white group rounded-2xl shadow-md border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col w-full h-full ${
        !isAvailable && directSale ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {/* Image Container */}
      <div className="relative w-full h-48 sm:h-56 flex-shrink-0 bg-gray-100 overflow-hidden ">
        <Link href={productDetailUrl} className="block w-full h-full">
          <FallbackImage
            src={image}
            alt={title}
            width={320}
            height={224}
            className="object-contain w-full h-full transition-transform duration-300 hover:scale-110"
            quality={85}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            fallbackSrc={categoryFallbackImage}
          />
        </Link>
        {/* Action Icons Top-Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <button
            onClick={() => onWishlistClick(id)}
            className={`bg-white p-2 rounded-full border border-gray-200 shadow-sm transition hover:bg-gray-100 flex items-center justify-center w-8 h-8 opacity-0 group-hover:opacity-100 duration-300 ${
              isWishlisted ? "opacity-100" : "opacity-0"
            }`}
            aria-label="Add to wishlist"
            disabled={!is_active}
          >
            <Heart
              className={`w-4 h-4 ${
                isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
              }`}
            />
          </button>
          <button
            onClick={() => onCompareClick(productData)}
            className="bg-white p-2 rounded-full border border-gray-200 shadow-sm transition hover:bg-gray-100 flex items-center justify-center w-8 h-8 opacity-0 group-hover:opacity-100 duration-300"
            aria-label="Compare"
            disabled={!is_active}
          >
            <Repeat className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() =>
              onShareClick(window.location.origin + productDetailUrl, title)
            }
            className="bg-white p-2 rounded-full border border-gray-200 shadow-sm transition hover:bg-gray-100 flex items-center justify-center w-8 h-8 opacity-0 group-hover:opacity-100 duration-300"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="absolute top-3 right-3">
          {Array.isArray(productType) &&
            productType.map((type, index) => {
              // CASE 1: Handle the special logic for the 'new' badge.
              if (type === "new") {
                return (
                  showNewBadge() && (
                    <Badge
                      key={index}
                      className={badgeStyles.new || "default-new-badge"}
                    >
                      New
                    </Badge>
                  )
                );
              }

              // CASE 2: Handle all other badge types.
              return (
                <Badge
                  key={index}
                  className={badgeStyles[type] || "default-badge-style"}
                >
                  {/* Capitalize the first letter for better display */}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Badge>
              );
            })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between p-4">
        <div className="flex-1">
          <Link href={productDetailUrl}>
            <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-green-700 transition-colors">
              {displayTitle}
            </h3>
          </Link>
          <p className="text-sm text-gray-500 mb-2 line-clamp-1">
            {/* ✅ FIX: Sanitize the subtitle/description for display, stripping HTML tags */}
            <span
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(subtitle || "", { ALLOWED_TAGS: [] }), // Strips all tags for plain text display
              }}
            />
          </p>
          {/* Price */}
          <div className="flex justify-between mb-4">
            <div className="mb-3">{displayPrice}</div>
            {category_id == 18 && (
              <Badge
                className={
                  stock_quantity > 0
                    ? "border-green-400 bg-green-100 text-green-800"
                    : "border-red-400 bg-red-100 text-red-800"
                }
              >
                {is_active
                  ? stock_quantity > 0
                    ? `Available`
                    : "Unavailable"
                  : "Inactive"}
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons (Remains unchanged) */}
        {directSale ? (
          <div className="flex flex-col gap-2 w-full">
            {isInCart ? (
              <div className="flex items-center justify-between bg-green-50 text-green-700 font-medium py-1 px-1 rounded-lg">
                <button
                  onClick={() => onDecreaseQuantity(id)}
                  disabled={currentCartQuantity <= 1 || !isPurchasable}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-green-800 font-semibold text-center flex-1 text-base">
                  {currentCartQuantity}
                </span>
                <button
                  onClick={() => onIncreaseQuantity(id)}
                  disabled={!isPurchasable}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onRemoveFromCart(id)}
                  className="h-8 w-8 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 transition-colors ml-1"
                  aria-label="Remove from cart"
                  title="Remove from Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => onAddToCartClick(id)}
                  className="flex items-center justify-center rounded-lg bg-[#5CA131] hover:bg-green-700 py-3 text-white font-medium transition-colors w-12 h-12"
                  aria-label="Add to cart"
                  disabled={!isPurchasable}
                >
                  <ShoppingCart className="w-6 h-6" />
                </button>
                <button
                  onClick={() => onBuyNowClick(id)}
                  className="rounded-lg border border-green-600 text-green-600 hover:bg-green-50 py-3 font-medium text-base transition-colors flex-1"
                  aria-label="Buy now"
                  disabled={!isPurchasable}
                >
                  Buy Now
                </button>
              </div>
            )}
            {!isPurchasable && (
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className="flex items-center justify-center rounded-lg bg-[#5CA131] hover:bg-green-700 py-3 text-white font-medium transition-colors flex-1 text-base"
                    aria-label="Get a quote"
                  >
                    <span>Get a Quote</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-2xl mx-auto">
                  <QuoteForm
                    product={productData as any}
                    onClose={() =>
                      document
                        .querySelector<HTMLButtonElement>("[data-dialog-close]")
                        ?.click()
                    }
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <button
                className="flex items-center justify-center rounded-lg bg-[#5CA131] hover:bg-green-700 py-3 text-white font-medium transition-colors w-full text-base"
                aria-label={formButtonText}
                disabled={!is_active}
              >
                {formButtonText}
              </button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl mx-auto">
              {isRentalPage ? (
                <RentalForm
                  productId={id}
                  productDetails={{
                    image: image,
                    title: title,
                    description: subtitle || "",
                    price: price,
                    stock_quantity: stock_quantity,
                  }}
                  onClose={() =>
                    document
                      .querySelector<HTMLButtonElement>("[data-dialog-close]")
                      ?.click()
                  }
                />
              ) : (
                <QuoteForm
                  product={productData as any}
                  onClose={() =>
                    document
                      .querySelector<HTMLButtonElement>("[data-dialog-close]")
                      ?.click()
                  }
                />
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

// Interface for props passed to ProductCardContainer (from ProductListing)
interface ProductCardContainerProps {
  id: number;
  image: string;
  title: string;
  subtitle: string | null | undefined;
  price: string | number;
  currency: string;
  directSale: boolean;
  is_active: boolean;
  hide_price: boolean;
  stock_quantity: number;
  type: string;
  category_id: number | null;
  pageUrlType: string;
  model: string | null;
  manufacturer: string | null;
  user_name: string | null;
  created_at: string | null;
}

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

export const ProductCardContainer = ({
  id,
  image,
  title,
  subtitle,
  price,
  currency,
  directSale,
  is_active,
  hide_price,
  stock_quantity,
  type,
  category_id,
  pageUrlType,
  model,
  manufacturer,
  user_name,
  created_at, // Add created_at to the destructured props
}: ProductCardContainerProps) => {
  const router = useRouter();
  const {
    user,
    // State derived from context
    isProductWishlisted,
    isProductInCart,
    getCartItemQuantity,
    getCartItemId,
    // Actions from context
    addToWishlist,
    removeFromWishlist,
    addToCart,
    removeFromCart,
    updateCartQuantity,
  } = useUser();

  const isWishlisted = isProductWishlisted(id);
  const isInCart = isProductInCart(id);
  const currentCartQuantity = getCartItemQuantity(id);
  const cartItemId = getCartItemId(id); // Context provides this if needed

  const productFullData: ProductCardContainerProps = {
    id,
    image,
    title,
    subtitle,
    price,
    currency,
    directSale,
    is_active,
    hide_price,
    stock_quantity,
    type,
    category_id,
    pageUrlType,
    model,
    manufacturer,
    user_name,
    created_at,
  };

  const handleAddToCart = useCallback(
    async (productId: number) => {
      if (!user) {
        toast.error("Please log in to add products to your cart.");
        router.push("/login");
        return;
      }
      if (isInCart) {
        toast.info("This product is already in your cart.");
        return;
      }

      const success = await addToCart(productId);
      if (success) {
        toast.success("Product added to cart!", {
          action: {
            label: "View Cart",
            onClick: () => router.push("/cart"),
          },
        });
      } else {
        toast.error("Failed to add product to cart.");
      }
    },
    [user, router, isInCart, addToCart]
  );

  const handleRemoveFromCart = useCallback(
    async (productId: number) => {
      if (!user) return;
      const success = await removeFromCart(productId);
      if (success) {
        toast.success("Product removed from cart.");
      } else {
        toast.error("Failed to remove product from cart.");
      }
    },
    [user, removeFromCart]
  );

  const handleIncreaseQuantity = useCallback(
    async (productId: number) => {
      if (!user) return;
      const newQuantity = currentCartQuantity + 1;
      const success = await updateCartQuantity(productId, newQuantity);
      // No toast needed here as the UI update is instant feedback.
      if (!success) {
        toast.error("Failed to update quantity.");
      }
    },
    [user, currentCartQuantity, updateCartQuantity]
  );

  const handleDecreaseQuantity = useCallback(
    async (productId: number) => {
      if (!user) return;
      if (currentCartQuantity <= 1) {
        toast.info("Use the remove button to take it out of cart.");
        return;
      }
      const newQuantity = currentCartQuantity - 1;
      const success = await updateCartQuantity(productId, newQuantity);
      if (!success) {
        toast.error("Failed to update quantity.");
      }
    },
    [user, currentCartQuantity, updateCartQuantity]
  );

  const handleWishlist = useCallback(
    async (productId: number) => {
      if (!user) {
        toast.error("Please log in to manage your wishlist.");
        router.push("/login");
        return;
      }

      let success;
      if (isWishlisted) {
        success = await removeFromWishlist(productId);
        if (success) toast.success("Product removed from wishlist!");
      } else {
        success = await addToWishlist(productId);
        if (success) toast.success("Product added to wishlist!");
      }

      if (!success) {
        toast.error("Could not update wishlist. Please try again.");
      }
    },
    [user, isWishlisted, router, addToWishlist, removeFromWishlist]
  );

  const handleCompare = useCallback(
    (data: Record<string, unknown>) => {
      console.log(
        `[handleCompare] Attempting to add Product ID: ${id} to comparison.`
      );
      const COMPARE_KEY = "mhe_compare_products";
      if (typeof window !== "undefined") {
        const currentCompare: ProductCardContainerProps[] = JSON.parse(
          localStorage.getItem(COMPARE_KEY) || "[]"
        );
        const existingProduct = currentCompare.find(
          (p: ProductCardContainerProps) => p.id === id
        );
        if (!existingProduct) {
          const dataToStore = { ...data };
          if (hide_price) {
            const { price: _, ...restOfData } = dataToStore;
            currentCompare.push(
              restOfData as unknown as ProductCardContainerProps
            );
          } else {
            currentCompare.push(
              dataToStore as unknown as ProductCardContainerProps
            );
          }
          localStorage.setItem(COMPARE_KEY, JSON.stringify(currentCompare));
          console.log(
            `[handleCompare SUCCESS] Product ID ${id} added to comparison.`
          );
          toast.success("Product added to comparison!");
        } else {
          console.log(
            `[handleCompare] Product ID ${id} is already in comparison.`
          );
          toast.info("Product is already in comparison.");
        }
      }
    },
    [id, hide_price]
  );

  const handleBuyNow = useCallback(
    async (productId: number) => {
      if (!user) {
        toast.error("Please log in to proceed with purchase.");
        router.push("/login");
        return;
      }
      if (!directSale || stock_quantity === 0 || !is_active) {
        toast.error("This product is not available for direct purchase.");
        return;
      }

      if (!isInCart) {
        await addToCart(productId);
      }
      router.push("/cart");
    },
    [user, router, directSale, stock_quantity, is_active, isInCart, addToCart]
  );

  const handleShare = useCallback((url: string, title: string) => {
    console.log(`[handleShare] Sharing URL: ${url} with title: ${title}`);
    if (navigator.share) {
      navigator
        .share({
          title: title,
          url: url,
        })
        .then(() => {
          console.log(
            "[handleShare SUCCESS] Product link shared successfully!"
          );
          toast.success("Product link shared successfully!");
        })
        .catch((error) => {
          if (error.name === "AbortError") {
            console.log("[handleShare INFO] Sharing cancelled.");
            toast.info("Sharing cancelled.");
          } else {
            console.error(
              "[handleShare ERROR] Failed to share product link:",
              error
            );
            toast.error("Failed to share product link.");
          }
        });
    } else {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          console.log(
            "[handleShare SUCCESS] Product link copied to clipboard!"
          );
          toast.success("Product link copied to clipboard!");
        })
        .catch((err) => {
          console.error(
            "[handleShare ERROR] Failed to copy link to clipboard:",
            err
          );
          toast.error("Failed to copy link to clipboard.");
        });
    }
  }, []);

  return (
    <ProductCard
      id={id}
      image={image}
      category_id={category_id}
      title={title}
      subtitle={subtitle}
      price={price}
      currency={currency}
      directSale={directSale}
      is_active={is_active}
      hide_price={hide_price}
      stock_quantity={stock_quantity}
      isWishlisted={isWishlisted}
      isInCart={isInCart}
      currentCartQuantity={currentCartQuantity}
      cartItemId={cartItemId}
      onAddToCartClick={handleAddToCart}
      onWishlistClick={handleWishlist}
      onCompareClick={handleCompare}
      onBuyNowClick={handleBuyNow}
      onShareClick={handleShare}
      onIncreaseQuantity={handleIncreaseQuantity}
      onDecreaseQuantity={handleDecreaseQuantity}
      onRemoveFromCart={handleRemoveFromCart}
      productData={productFullData as unknown as Record<string, unknown>}
      productType={type}
      pageUrlType={pageUrlType}
    />
  );
};

export default ProductCardContainer;
