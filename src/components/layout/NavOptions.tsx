"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useEffect, JSX, useRef } from "react";
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
  const [submenuTop, setSubmenuTop] = useState<number>(0);
  const menuTimerRef = useRef<NodeJS.Timeout | null>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null); // Ref for the main container

  const fetchCategories = useCallback(async () => {
    if (!isOpen || categories.length > 0) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/categories/");
      setCategories(response.data || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setError("Failed to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isOpen, categories.length]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleMouseEnter = useCallback(() => {
    if (menuTimerRef.current) {
      clearTimeout(menuTimerRef.current);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    menuTimerRef.current = setTimeout(() => {
      onClose();
      setHoveredCategory(null);
    }, 200);
  }, [onClose]);

  const CategoryImage = ({ category }: { category: Category }) => {
    const [hasError, setHasError] = useState(!category.cat_image);
    useEffect(() => {
      setHasError(!category.cat_image);
    }, [category.cat_image]);

    if (hasError) {
      return (
        <div className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded">
          <Package className="w-4 h-4 text-gray-500" />
        </div>
      );
    }
    return (
      <Image
        src={category.cat_image!}
        alt={category.name}
        width={32}
        height={32}
        className="w-8 h-8 object-contain rounded"
        onError={() => setHasError(true)}
        unoptimized
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
          className="absolute left-0 top-full z-50 mt-2"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative flex" ref={menuContainerRef}>
            {/* Main Category List */}
            <div className="w-80 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="p-2 max-h-[480px] overflow-y-auto">
                {loading ? (
                  <div className="space-y-1">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-4 ml-auto" />
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
                ) : (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      onMouseEnter={(e) => {
                        setHoveredCategory(category);
                        if (menuContainerRef.current) {
                          const itemRect = e.currentTarget.getBoundingClientRect();
                          const containerRect = menuContainerRef.current.getBoundingClientRect();
                          // Calculate the top position relative to the container, accounting for scroll
                          const topPosition = itemRect.top - containerRect.top;
                          setSubmenuTop(topPosition);
                        }
                      }}
                    >
                      <Link
                        href={`/${createSlug(category.name)}`}
                        onClick={onClose}
                        className={`flex items-center gap-3 p-2.5 text-sm font-medium rounded-md transition-colors ${hoveredCategory?.id === category.id
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-800 hover:bg-gray-100"
                          }`}
                      >
                        <CategoryImage category={category} />
                        <span className="flex-1">{category.name}</span>
                        {category.subcategories?.length > 0 && (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Subcategory Fly-out Menu */}
            <AnimatePresence>
              {hoveredCategory?.subcategories?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute left-full ml-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg"
                  style={{ top: `${submenuTop}px` }}
                >
                  <div className="p-2 max-h-[480px] overflow-y-auto">
                    {hoveredCategory.subcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/${createSlug(
                          hoveredCategory.name
                        )}/${createSlug(sub.name)}`}
                        onClick={onClose}
                        className="block w-full text-left p-2.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      <style jsx global>{`
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
      `}</style>
    </AnimatePresence>
  );
}