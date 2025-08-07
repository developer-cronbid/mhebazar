// src/components/products/Reviews.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import api from "@/lib/api";
import { Button } from "../ui/button";
import { Dialog } from "@radix-ui/react-dialog";
import { DialogContent, DialogTrigger } from "../ui/dialog";
import MheWriteAReview from "@/components/forms/product/ProductReviewForm";

// Adjusted to reflect backend model field name 'review' for text content
interface BackendReview {
  id: number;
  user: number; // User ID
  user_name: string; // From serializer source
  stars: number; // Corresponds to 'stars' field in backend
  title: string | null; //
  review: string | null; // This is the main review text from models.py
  created_at: string;
  updated_at: string;
  product: number;
  review_images: { id: number; image: string }[]; // From serializer related name
}

type ReviewsApiResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendReview[];
};

type ReviewData = {
  summary: {
    avg: number;
    total: number;
    breakdown: { star: number; percent: number }[];
  };
  say: string;
  reviewImages: string[];
  reviews: BackendReview[]; // Use BackendReview type for actual reviews
};

const fallbackData: ReviewData = {
  summary: {
    avg: 4.5,
    total: 65,
    breakdown: [
      { star: 5, percent: 67 },
      { star: 4, percent: 17 },
      { star: 3, percent: 0 },
      { star: 2, percent: 7 },
      { star: 1, percent: 9 },
    ],
  },
  say: "Customers find the product versatile and efficient material handling solution designed for warehouses and distribution centres. With its electric power and precise control.",
  reviewImages: [
    "/rev1.png",
    "/rev2.png",
    "/rev3.png",
    "/rev4.png",
    "/rev5.png",
  ],
  reviews: [
    {
      id: 1,
      user: 101, // Dummy user ID
      user_name: "Surinder",
      stars: 4,
      created_at: "2024-10-13T00:00:00Z",
      title: "Great Product!",
      review: "This product is versatile and efficient material handling solution designed for warehouses and distribution centres. With its electric power and precise control.",
      product: 1, // Dummy product ID
      review_images: [{ id: 1, image: "/rev1.png" }, { id: 2, image: "/rev2.png" }],
      updated_at: "2024-10-13T00:00:00Z",
    },
    {
      id: 2,
      user: 102, // Dummy user ID
      user_name: "Naresh",
      stars: 5,
      created_at: "2024-10-13T00:00:00Z",
      title: "Highly Recommend!",
      review: "This product is versatile and efficient material handling solution designed for warehouses and distribution centres. With its electric power and precise control.",
      product: 1, // Dummy product ID
      review_images: [{ id: 3, image: "/rev3.png" }, { id: 4, image: "/rev4.png" }],
      updated_at: "2024-10-13T00:00:00Z",
    },
    {
      id: 3,
      user: 103, // Dummy user ID
      user_name: "Avinash Samrat",
      stars: 3,
      created_at: "2024-10-13T00:00:00Z",
      title: "Good Value",
      review: "This product is versatile and efficient material handling solution designed for warehouses and distribution centres. With its electric power and precise control.",
      product: 1, // Dummy product ID
      review_images: [],
      updated_at: "2024-10-13T00:00:00Z",
    },
  ],
};

interface ReviewSectionProps {
  productId: number;
  registerRefresher?: (refresher: () => void) => void; // Optional prop for parent to register a refresher
}

export default function ReviewSection({ productId, registerRefresher }: ReviewSectionProps) {
  const [data, setData] = useState<ReviewData | null>(null);
  const [imgScroll, setImgScroll] = useState(0);

  const fetchReviews = useCallback(async () => {
    if (!productId) {
      setData(fallbackData);
      return;
    }
    try {
      const res = await api.get<ReviewsApiResponse>(`/reviews/?product=${productId}`); //
      const fetchedReviews = res.data.results;

      // Calculate summary statistics from fetched reviews
      const totalStars = fetchedReviews.reduce((sum, review) => sum + review.stars, 0); //
      const avgRating = fetchedReviews.length > 0 ? totalStars / fetchedReviews.length : 0;

      const breakdown = Array(5).fill(0).map((_, i) => {
        const starCount = fetchedReviews.filter(review => review.stars === (i + 1)).length; //
        const percent = fetchedReviews.length > 0 ? (starCount / fetchedReviews.length) * 100 : 0;
        return { star: i + 1, percent: parseFloat(percent.toFixed(0)) };
      }).reverse();

      const allReviewImages = fetchedReviews.flatMap(review => review.review_images.map(img => img.image)); //

      console.log("Fetched reviews:", fetchedReviews);
      setData({
        summary: {
          avg: parseFloat(avgRating.toFixed(1)),
          total: fetchedReviews.length,
          breakdown: breakdown,
        },
        say: fallbackData.say, // Static for now
        reviewImages: allReviewImages,
        reviews: fetchedReviews,
      });

    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      // Fallback to dummy data if API fails or no reviews
      setData(fallbackData);
    }
  }, [productId]); // productId is a dependency

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Register the fetchReviews function with the parent (IndividualProduct)
  useEffect(() => {
    if (registerRefresher) {
      registerRefresher(fetchReviews);
    }
  }, [registerRefresher, fetchReviews]);


  if (!data) {
    return (
      <div className="px-4 mx-auto p-4 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>
          <div className="md:col-span-2 space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-20 bg-gray-200 rounded w-full" />
            <div className="h-32 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  const visibleImages = data.reviewImages.slice(imgScroll, imgScroll + 5);
  const canScrollLeft = imgScroll > 0;
  const canScrollRight = imgScroll + 5 < data.reviewImages.length;

  return (
    <div className="px-4 mx-auto p-2 sm:p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Summary */}
        <div>
          <div className="bg-white rounded-lg border p-5 shadow-sm mb-6">
            <h3 className="font-semibold text-lg mb-2">Customer Reviews</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-yellow-500">
                {data.summary.avg.toFixed(1)}
              </span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < data.summary.avg ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                  />
                ))}
              </div>
              <span className="text-gray-600 text-sm">
                {data.summary.avg} out of 5
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-4">
              {data.summary.total} ratings
            </div>
            <div className="space-y-2 mb-4">
              {data.summary.breakdown.map((item) => (
                <div key={item.star} className="flex items-center gap-2">
                  <span className="w-8 text-xs">{item.star} star</span>
                  <div className="flex-1 bg-gray-200 h-2 rounded">
                    <div
                      className="bg-yellow-400 h-2 rounded"
                      style={{ width: `${item.percent}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-xs text-right">
                    {item.percent}%
                  </span>
                </div>
              ))}
            </div>
            <div className="max-w-md mx-auto p-2 rounded-lg">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Review this product
                  </h2>
                  <p className="text-sm text-gray-600">
                    Share your thoughts with other customers
                  </p>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full bg-gray-50 border-gray-200 hover:bg-gray-100 py-6 px-4 rounded-lg"
                    >
                      <span className="text-green-600 font-medium">
                        Write your product review
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-full max-w-2xl">
                    <MheWriteAReview
                      productId={productId}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Reviews */}
        <div className="md:col-span-2 space-y-8">
          {/* Customers Say */}
          <div className="bg-white rounded-lg border p-5 shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Customers Say</h3>
            <p className="text-gray-600 text-sm">{data.say}</p>
          </div>

          {/* Reviews with Images */}
          <div className="bg-white rounded-lg border p-5 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold">Reviews with Images</h4>
              <Link
                href="#"
                className="text-green-600 text-sm font-medium hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                {canScrollLeft && (
                  <button
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full shadow p-1"
                    onClick={() => setImgScroll(imgScroll - 1)}
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="flex gap-4 pl-6 pr-6">
                  {visibleImages.map((src, i) => (
                    <div
                      key={src + "-" + i}
                      className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-100 shadow"
                    >
                      <Image
                        src={src}
                        alt={`Review image ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
                {canScrollRight && (
                  <button
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full shadow p-1"
                    onClick={() => setImgScroll(imgScroll + 1)}
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Top Reviews */}
          <div className="bg-white rounded-lg border p-5 shadow-sm">
            <h4 className="font-semibold mb-4">Top Reviews</h4>
            {data.reviews.length > 0 ? (
              data.reviews.map((review) => (
                <div
                  key={review.id}
                  className="mb-8 border-b last:border-b-0 pb-6 last:pb-0"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                      {review.review_images && review.review_images.length > 0 && review.review_images[0].image ? (
                        <Image
                          src={review.review_images[0].image}
                          alt={review.user_name || "User"}
                          width={36}
                          height={36}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-gray-500">
                          {review.user_name ? review.user_name[0].toUpperCase() : "A"}
                        </span>
                      )}
                    </div>
                    <span className="font-medium">{review.user_name}</span>
                    <div className="flex items-center gap-1 ml-2">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <Star
                          key={j}
                          className={`w-4 h-4 ${review.stars >= j
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                            }`}
                        />
                      ))}
                      <span className="text-xs text-gray-600 ml-1">
                        {review.stars} out of 5
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    Reviewed on {new Date(review.created_at).toLocaleDateString()}
                  </div>
                  <h5 className="font-semibold text-sm mb-1">{review.title}</h5>
                  <div className="text-sm mb-2">{review.review}</div> {/* Used review field */}
                  <div className="flex gap-2 mt-2">
                    {review.review_images && review.review_images.map((img) => (
                      <div
                        key={img.id}
                        className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100 shadow"
                      >
                        <Image
                          src={img.image}
                          alt="review image"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-6 text-sm text-green-600 mt-2">
                    <button className="hover:underline">Helpful</button>
                    <button className="hover:underline">Report</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-sm">No reviews yet. Be the first to review this product!</p>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        }
      `}</style>
    </div>
  );
}