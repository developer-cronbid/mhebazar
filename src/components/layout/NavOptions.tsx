"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useCallback, useEffect, JSX } from "react";
import { useRouter } from "next/navigation";
import { Category, Subcategory } from "./Nav";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

const createSlug = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, "-");

export default function CategoryMenu({
  isOpen,
  onClose,
  categories,
}: CategoryMenuProps): JSX.Element {
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<Category | null>(null);
  const [productCounts, setProductCounts] = useState<{ [subcategoryId: number]: number }>({});
  const [loadingCounts, setLoadingCounts] = useState<boolean>(false);
  const [isHoveringFirstColumn, setIsHoveringFirstColumn] = useState<boolean>(false);

  const displayedCategory: Category | null = selectedCategory || hoveredCategory;
  const subcategoriesToDisplay: Subcategory[] = displayedCategory?.subcategories || [];

  const getProductCounts = useCallback(async (categoryId: number, subcategories: Subcategory[]) => {
    if (subcategories.length === 0) {
      setProductCounts({});
      setLoadingCounts(false);
      return;
    }

    setLoadingCounts(true);
    try {
      const promises = subcategories.map(async (sub) => {
        const response = await api.get(`/products/?category=${categoryId}&subcategory=${sub.id}`);
        return { subcategoryId: sub.id, count: response.data?.count || 0 };
      });
      const results = await Promise.all(promises);
      const newCounts = results.reduce((acc, curr) => {
        acc[curr.subcategoryId] = curr.count;
        return acc;
      }, {} as { [key: number]: number });
      setProductCounts(newCounts);
    } catch (error) {
      console.error("Failed to fetch product counts:", error);
      setProductCounts({});
    } finally {
      setLoadingCounts(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (categories.length > 0) {
        setHoveredCategory(categories[0]);
        getProductCounts(categories[0].id, categories[0].subcategories);
      }
    } else {
      setSelectedCategory(null);
      setHoveredCategory(null);
      setProductCounts({});
      setIsHoveringFirstColumn(false);
    }
  }, [isOpen, categories, getProductCounts]);

  useEffect(() => {
    if (hoveredCategory) {
      getProductCounts(hoveredCategory.id, hoveredCategory.subcategories);
    }
  }, [hoveredCategory, getProductCounts]);

  const handleCategoryNameClick = useCallback(
    (category: Category) => {
      if (category.subcategories.length > 0) {
        setSelectedCategory(category.id === selectedCategory?.id ? null : category);
        setHoveredCategory(category);
      } else {
        router.push(`/${createSlug(category.name)}`);
        onClose();
      }
    },
    [selectedCategory, onClose, router]
  );

  const categoriesWithSubs = useMemo(() => 
    categories.filter(c => c.subcategories.length > 0), 
    [categories]
  );

  const categoriesCol1: Category[] = useMemo(
    () => categoriesWithSubs.slice(0, Math.ceil(categoriesWithSubs.length / 2)),
    [categoriesWithSubs]
  );
  
  const categoriesCol2: Category[] = useMemo(
    () => categoriesWithSubs.slice(Math.ceil(categoriesWithSubs.length / 2)),
    [categoriesWithSubs]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute left-0 top-full z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          style={{ width: '1200px', height: '480px' }}
        >
          <div className="flex h-full relative">
            {/* Left Categories Column 1 - Fixed Position */}
            <motion.div 
              className="w-80 bg-gray-50 border-r border-gray-200 flex-shrink-0"
              onMouseEnter={() => setIsHoveringFirstColumn(true)}
              onMouseLeave={() => setIsHoveringFirstColumn(false)}
            >
              <div className="p-4 h-full">
                <div className="space-y-1">
                  {categoriesCol1.map((category) => (
                    <div
                      key={category.id}
                      className={`group flex items-center justify-between px-4 py-3 text-sm cursor-pointer rounded-lg transition-all duration-200 ${
                        selectedCategory?.id === category.id || hoveredCategory?.id === category.id
                          ? "bg-blue-50 text-blue-700 font-medium border border-blue-200"
                          : "text-gray-700 hover:bg-white hover:text-blue-600 hover:border hover:border-gray-200"
                      }`}
                      onMouseEnter={() => setHoveredCategory(category)}
                    >
                      <span
                        onClick={() => handleCategoryNameClick(category)}
                        className="flex-1 cursor-pointer text-left"
                      >
                        {category.name}
                      </span>
                      <Link
                        href={`/${createSlug(category.name)}`}
                        onClick={onClose}
                        className="p-1.5 -mr-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all duration-200"
                        aria-label={`Go to ${category.name} category page`}
                      >
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Middle Categories Column 2 - Animates Right When First Column Hovered */}
            <motion.div 
              className="w-80 bg-gray-50 border-r border-gray-200 flex-shrink-0"
              animate={{
                x: isHoveringFirstColumn ? 420 : 0,
                zIndex: isHoveringFirstColumn ? 10 : 1,
              }}
              transition={{ 
                duration: 0.4, 
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            >
              <div className="p-4 h-full">
                <div className="space-y-1">
                  {categoriesCol2.map((category) => (
                    <div
                      key={category.id}
                      className={`group flex items-center justify-between px-4 py-3 text-sm cursor-pointer rounded-lg transition-all duration-200 ${
                        selectedCategory?.id === category.id || hoveredCategory?.id === category.id
                          ? "bg-blue-50 text-blue-700 font-medium border border-blue-200"
                          : "text-gray-700 hover:bg-white hover:text-blue-600 hover:border hover:border-gray-200"
                      }`}
                      onMouseEnter={() => setHoveredCategory(category)}
                    >
                      <span
                        onClick={() => handleCategoryNameClick(category)}
                        className="flex-1 cursor-pointer text-left"
                      >
                        {category.name}
                      </span>
                      <Link
                        href={`/${createSlug(category.name)}`}
                        onClick={onClose}
                        className="p-1.5 -mr-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all duration-200"
                        aria-label={`Go to ${category.name} category page`}
                      >
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
            
            {/* Right Content Column - Subcategories - Moves to Center When First Column Hovered */}
            <motion.div 
              className="flex-1 bg-white"
              animate={{
                x: isHoveringFirstColumn ? -380 : 0,
              }}
              transition={{ 
                duration: 0.4, 
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            >
              <div className="h-full p-6 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {displayedCategory?.name || "Select a category"}
                  </h3>
                  {displayedCategory && (
                    <Link
                      href={`/${createSlug(displayedCategory.name)}`}
                      onClick={onClose}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50 flex items-center gap-1"
                    >
                      View All 
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 min-h-0">
                  {loadingCounts ? (
                    <div className="grid grid-cols-3 gap-4 auto-rows-max">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center min-h-[140px] border">
                          <Skeleton className="w-16 h-16 rounded-lg mb-3" />
                          <Skeleton className="h-4 w-20 mb-2" />
                          <Skeleton className="h-6 w-8" />
                        </div>
                      ))}
                    </div>
                  ) : subcategoriesToDisplay.length > 0 ? (
                    <div 
                      className="grid grid-cols-3 gap-4 auto-rows-max overflow-y-auto pr-2"
                      style={{ 
                        maxHeight: '380px',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 transparent'
                      }}
                    >
                      <style jsx>{`
                        div::-webkit-scrollbar {
                          width: 6px;
                        }
                        div::-webkit-scrollbar-track {
                          background: #f8fafc;
                          border-radius: 6px;
                        }
                        div::-webkit-scrollbar-thumb {
                          background: #cbd5e1;
                          border-radius: 6px;
                        }
                        div::-webkit-scrollbar-thumb:hover {
                          background: #94a3b8;
                        }
                      `}</style>
                      
                      {subcategoriesToDisplay.map((subCategory) => (
                        <Link
                          key={subCategory.id}
                          href={`/${createSlug(displayedCategory!.name)}/${createSlug(subCategory.name)}`}
                          className="group bg-white hover:bg-gray-50 rounded-lg p-4 cursor-pointer transition-all duration-200 border border-gray-200 hover:border-blue-200 hover:shadow-md min-h-[140px] flex flex-col items-center justify-center"
                          onClick={onClose}
                        >
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden mb-3 group-hover:bg-blue-50 transition-colors">
                            {displayedCategory?.image_url ? (
                              <Image
                                src={displayedCategory.image_url.startsWith("/media") ? `https://mheback.onrender.com${displayedCategory.image_url}` : displayedCategory.image_url}
                                alt={subCategory.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                unoptimized
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const fallback = document.createElement("div");
                                    fallback.className = "text-gray-600 text-xs font-semibold flex items-center justify-center w-full h-full";
                                    fallback.textContent = subCategory.name.substring(0, 2).toUpperCase();
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-gray-600 text-xs font-semibold">
                                {subCategory.name.substring(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900 text-sm text-center mb-2 group-hover:text-blue-600 transition-colors leading-tight px-1">
                            {subCategory.name}
                          </h4>
                          <div className="text-lg font-semibold text-gray-800 min-w-[32px] text-center">
                            {productCounts[subCategory.id] !== undefined ? (
                              String(productCounts[subCategory.id]).padStart(2, '0')
                            ) : (
                              <span className="text-gray-400">--</span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : displayedCategory ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                        <span className="text-gray-400 text-2xl">📦</span>
                      </div>
                      <p className="text-gray-500 text-sm mb-4">
                        No subcategories available
                      </p>
                      <Link
                        href={`/${createSlug(displayedCategory.name)}`}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        onClick={onClose}
                      >
                        Browse {displayedCategory.name}
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                        <span className="text-gray-400 text-2xl">👈</span>
                      </div>
                      <p className="text-gray-500 text-sm">
                        Hover over a category to see subcategories
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}