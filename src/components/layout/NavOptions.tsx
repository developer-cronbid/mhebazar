"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useCallback, useEffect, JSX, useRef } from "react";
// import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: number;
  subcategories: {
    id: number;
    name: string;
    sub_image?: string;
    product_count?: number;
    category?: number;
  }[];
  cat_image?: string;
  name: string;
}

interface CategoryMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImageWithFallbackProps {
  subCategory: {
    name: string;
    sub_image?: string;
    category?: number;
  };
  categories: Category[];
}

const createSlug = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, "-");

export default function CategoryMenu({
  isOpen,
  onClose,
}: CategoryMenuProps): JSX.Element {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<Category | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const displayedCategory: Category | null = hoveredCategory;

  const subcategoriesToDisplay = useMemo(() =>
    displayedCategory?.subcategories || [],
    [displayedCategory]
  );

  const fetchCategories = useCallback(async () => {
    if (!isOpen || categories.length > 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/categories/');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isOpen, categories.length]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (isOpen && categories.length > 0 && !loading) {
      setHoveredCategory(categories[0]);
    }
  }, [isOpen, categories, loading]);

  const handleMouseEnterContainer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const handleMouseLeaveContainer = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setHoveredCategory(null);
      onClose();
    }, 200);
  }, [onClose]);

  const ImageWithFallback = ({ subCategory, categories }: ImageWithFallbackProps) => {
    const parentCategory = categories.find(cat => cat.id === subCategory.category);
    const imageSources = [subCategory.sub_image, parentCategory?.cat_image].filter(Boolean) as string[];

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [error, setError] = useState(false);

    useEffect(() => {
      setCurrentImageIndex(0);
      setError(false);
    }, [subCategory.sub_image, parentCategory?.cat_image]);

    const handleError = () => {
      if (currentImageIndex < imageSources.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1);
      } else {
        setError(true);
      }
    };

    const currentSrc = imageSources[currentImageIndex];

    if (error || !currentSrc) {
      return (
        <span className="text-gray-500 text-xs font-medium">
          {subCategory.name.substring(0, 2).toUpperCase()}
        </span>
      );
    }

    return (
      <Image
        src={currentSrc}
        alt={subCategory.name}
        width={48}
        height={48}
        className="w-full h-full object-contain"
        unoptimized
        onError={handleError}
      />
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute left-0 top-full z-50 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
          style={{ width: '1200px', height: '480px' }}
          onMouseEnter={handleMouseEnterContainer}
          onMouseLeave={handleMouseLeaveContainer}
        >
          <div className="flex h-full">
            {/* Categories Column */}
            <div className="w-80 bg-gray-50 border-r border-gray-300">
              <div className="p-4 border-b border-gray-300">
                <h3 className="font-medium text-gray-900 text-base">Categories</h3>
              </div>

              <div className="p-2 h-full overflow-y-auto" style={{ maxHeight: '420px' }}>
                {loading ? (
                  <div className="space-y-2 p-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-gray-100 rounded-md animate-pulse">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-6 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="p-4 text-center">
                    <p className="text-red-500 text-sm mb-3">{error}</p>
                    <button
                      onClick={() => {
                        setCategories([]);
                        fetchCategories();
                      }}
                      className="text-blue-600 text-sm font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-gray-500 text-sm">No categories available</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/${createSlug(category.name)}`}
                        onClick={onClose}
                        className={`flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer rounded-md transition-colors duration-150 ${
                          hoveredCategory?.id === category.id
                            ? "bg-gray-200"
                            : "text-gray-700 hover:bg-gray-200"
                        }`}
                        onMouseEnter={() => setHoveredCategory(category)}
                      >
                        <span className="flex-1">{category.name}</span>

                        <div className="flex items-center gap-2">
                          {category.subcategories?.length > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              hoveredCategory?.id === category.id
                                ? "bg-gray-200"
                                : "bg-gray-200 text-gray-600"
                            }`}>
                              {category.subcategories.length}
                            </span>
                          )}

                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Subcategories Panel */}
            <div className="flex-1 bg-white">
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-300 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 text-base">
                    {displayedCategory?.name || "Select a category"}
                  </h3>
                  {displayedCategory && (
                    <Link
                      href={`/${createSlug(displayedCategory.name)}`}
                      onClick={onClose}
                      className="text-sm text-blue-600 font-medium flex items-center gap-1"
                    >
                      View All
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {loading ? (
                    <div className="grid grid-cols-4 gap-4">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                          <Skeleton className="w-12 h-12 rounded-lg mx-auto mb-3" />
                          <Skeleton className="h-4 w-20 mx-auto mb-2" />
                          <Skeleton className="h-5 w-8 mx-auto" />
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                        <span className="text-red-500 text-2xl">⚠️</span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">Failed to load data</h4>
                      <p className="text-gray-500 text-sm mb-4">{error}</p>
                      <button
                        onClick={() => {
                          setCategories([]);
                          fetchCategories();
                        }}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  ) : subcategoriesToDisplay.length > 0 ? (
                    <div className="grid grid-cols-4 gap-4">
                      {subcategoriesToDisplay.map((subCategory) => (
                        <Link
                          key={subCategory.id}
                          href={`/${createSlug(displayedCategory?.name || '')}/${createSlug(subCategory.name)}`}
                          className="bg-white hover:bg-gray-50 rounded-lg p-4 text-center cursor-pointer transition-colors duration-150 border border-gray-200 hover:border-gray-300"
                          onClick={onClose}
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3 overflow-hidden">
                            <ImageWithFallback subCategory={subCategory} categories={categories} />
                          </div>

                          <h4 className="font-medium text-gray-900 text-sm mb-2 leading-tight">
                            {subCategory.name}
                          </h4>

                          <div className="text-blue-600 font-semibold text-sm">
                            {subCategory.product_count !== undefined ? (
                              `${subCategory.product_count} items`
                            ) : (
                              <span className="text-gray-400">--</span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : displayedCategory ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Browse all products in this category .
                      </h4>
                      <p className="text-gray-500 text-sm mb-4 max-w-sm">
                        click the button below to explore all available products within the {displayedCategory.name} category.
                      </p>
                      <Link
                        href={`/${createSlug(displayedCategory.name)}`}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md transition-colors"
                        onClick={onClose}
                      >
                        Browse {displayedCategory.name}
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                        <span className="text-gray-400 text-2xl">👈</span>
                      </div>
                      <p className="text-gray-500 text-sm">
                        Select a category to view subcategories
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <style jsx global>{`
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        div::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
      `}</style>
    </AnimatePresence>
  );
}