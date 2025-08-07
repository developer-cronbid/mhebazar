"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useCallback, useEffect, JSX } from "react";
import { useRouter } from "next/navigation";
import { Category, Subcategory } from "./Nav";

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

  useEffect(() => {
    if (isOpen) {
      if (categories.length > 0) {
        setHoveredCategory(categories[0]);
      }
    } else {
      setSelectedCategory(null);
      setHoveredCategory(null);
    }
  }, [isOpen, categories]);

  const getInitials = useCallback((name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }, []);

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

  const displayedCategory: Category | null = selectedCategory || hoveredCategory;
  const subcategoriesToDisplay: Subcategory[] = displayedCategory?.subcategories || [];

  const categoriesCol1: Category[] = useMemo(
    () => categories.slice(0, Math.ceil(categories.length / 2)),
    [categories]
  );
  const categoriesCol2: Category[] = useMemo(
    () => categories.slice(Math.ceil(categories.length / 2)),
    [categories]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute left-0 top-full z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden md:min-w-[800px]"
        >
          <div className="flex flex-col md:flex-row">
            {/* Left Categories Column 1 (Scrollable on small screens) */}
            <div className="w-full md:w-64 bg-gray-50 md:border-r border-gray-200 flex-shrink-0">
              <div className="p-2 h-[200px] md:h-[400px] overflow-y-auto custom-scrollbar">
                {categoriesCol1.map((category) => (
                  <div
                    key={category.id}
                    className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded transition-colors ${
                      selectedCategory?.id === category.id
                        ? "bg-white text-green-600 font-medium shadow-sm"
                        : hoveredCategory?.id === category.id
                        ? "bg-gray-100 text-green-600"
                        : "text-gray-700 hover:bg-white hover:text-green-600"
                    }`}
                    onMouseEnter={() => {
                      if (!selectedCategory) {
                        setHoveredCategory(category);
                      }
                    }}
                    onMouseLeave={() => {
                      if (!selectedCategory) {
                        setHoveredCategory(null);
                      }
                    }}
                  >
                    <span
                      onClick={() => handleCategoryNameClick(category)}
                      className="flex-1 cursor-pointer"
                    >
                      {category.name}
                    </span>
                    <Link
                      href={`/${createSlug(category.name)}`}
                      passHref
                      onClick={onClose}
                      className="p-1 -mr-1 rounded hover:bg-gray-200"
                      aria-label={`Go to ${category.name} category page`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Middle Categories Column 2 (Hidden on small screens) */}
            <div className="hidden md:block md:w-64 bg-gray-50 border-r border-gray-200 flex-shrink-0">
              <div className="p-2 h-[400px] overflow-y-auto custom-scrollbar">
                {categoriesCol2.map((category) => (
                  <div
                    key={category.id}
                    className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded transition-colors ${
                      selectedCategory?.id === category.id
                        ? "bg-white text-green-600 font-medium shadow-sm"
                        : hoveredCategory?.id === category.id
                        ? "bg-gray-100 text-green-600"
                        : "text-gray-700 hover:bg-white hover:text-green-600"
                    }`}
                    onMouseEnter={() => {
                      if (!selectedCategory) {
                        setHoveredCategory(category);
                      }
                    }}
                    onMouseLeave={() => {
                      if (!selectedCategory) {
                        setHoveredCategory(null);
                      }
                    }}
                  >
                    <span
                      onClick={() => handleCategoryNameClick(category)}
                      className="flex-1 cursor-pointer"
                    >
                      {category.name}
                    </span>
                    <Link
                      href={`/${createSlug(category.name)}`}
                      passHref
                      onClick={onClose}
                      className="p-1 -mr-1 rounded hover:bg-gray-200"
                      aria-label={`Go to ${category.name} category page`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content Column */}
            <div className="w-full md:w-80 bg-white p-4 flex-shrink-0">
              <div className="h-[200px] md:h-[400px] overflow-y-auto space-y-4 custom-scrollbar">
                {!displayedCategory && (
                  <p className="text-gray-500 text-sm p-3 text-center">
                    Hover over a category to see more.
                  </p>
                )}

                {subcategoriesToDisplay.length > 0 ? (
                  subcategoriesToDisplay.map((subCategory) => (
                    <Link
                      key={subCategory.id}
                      href={`/${createSlug(displayedCategory!.name)}/${createSlug(subCategory.name)}`}
                      passHref
                      className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-100 group"
                      onClick={onClose}
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {displayedCategory?.image_url ? (
                          <Image
                            src={displayedCategory.image_url}
                            alt={displayedCategory.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            unoptimized
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  const fallback = document.createElement("span");
                                  fallback.className = "text-gray-500 text-xs font-semibold";
                                  fallback.textContent = getInitials(subCategory.name);
                                  parent.appendChild(fallback);
                                }
                            }}
                          />
                        ) : (
                          <span className="text-gray-500 text-xs font-semibold">
                            {getInitials(subCategory.name)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm mb-1 group-hover:text-green-600 transition-colors">
                          {subCategory.name}
                        </h4>
                        <div className="inline-flex items-center justify-center bg-gray-100 text-gray-700 rounded-full px-2 py-1 text-xs font-medium min-w-[24px]">
                          <span className="text-xs">View All</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : displayedCategory ? (
                  <motion.div
                    key="no-subcategories-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center justify-center p-6 border border-green-200 bg-green-50 rounded-lg shadow-md h-full text-center"
                  >
                    <div className="mb-4 text-green-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-12 h-12 mx-auto"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.75 3.104v5.303m0 0a3.001 3.001 0 1 0 6.002 0V3.104m-6.002 0h-3M9.75 3.104h3c0 1.258-.29 2.474-.836 3.565M9.75 3.104V2.001l-1.426-.399m-5.462 8.528l1.426.399M9.75 3.104h-3c-1.34 0-2.61.425-3.663 1.226C2.213 5.4 1.75 6.703 1.75 8.163V21c0 .828.672 1.5 1.5 1.5h17.5c.828 0 1.5-.672 1.5-1.5V8.163c0-1.46-.463-2.763-1.353-3.791a5.956 5.956 0 0 0-3.663-1.226M15.75 12h.008v.008h-.008V12zm2.25 0h.008v.008h-.008V12zm-4.5 0h.008v.008h-.008V12zm2.25 0h.008v.008h-.008V12z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-800 text-lg font-semibold mb-2">
                      Browse {displayedCategory.name} Products
                    </p>
                    <p className="text-gray-700 text-sm mb-4">
                      Explore all available items under this category.
                    </p>
                    <Link
                      href={`/${createSlug(displayedCategory.name)}`}
                      passHref
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                      onClick={onClose}
                    >
                      View All
                    </Link>
                  </motion.div>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}