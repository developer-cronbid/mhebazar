// src/components/products/SideFilter.tsx
"use client";

import { useState, useEffect, useCallback, JSX } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, ChevronUp, Funnel } from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";
import categoriesData from "@/data/categories.json";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Subcategory {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  subcategories: Subcategory[];
}

const PRODUCT_TYPE_CHOICES = ["new", "used", "rental", "attachments"];

interface SideFilterProps {
  selectedFilters: Set<string>;
  onFilterChange: (
    filterValue: string | number,
    filterType: "category" | "subcategory" | "type" | "price_range" | "manufacturer" | "rating" | "sort_by",
    newValue?: number | string | string[] | { min: number | ''; max: number | '' } | null
  ) => void;
  selectedCategoryName: string | null;
  selectedSubcategoryName: string | null;
  selectedTypes: string[];
  minPrice: number | '';
  maxPrice: number | '';
  selectedManufacturer: string | null;
  selectedRating: number | null;
  showManufacturerFilter?: boolean;
}

// Updated helper function for consistent slug generation
const toSlug = (name: string): string => {
  let slug = name.toLowerCase();
  
  // Replace ' (something)' with '-something'
  slug = slug.replace(/\s*\((\w+)\)/g, '-$1');
  
  // Replace all non-alphanumeric characters (except hyphens) with a hyphen
  slug = slug.replace(/[^a-z0-9-]/g, '-');
  
  // Replace multiple hyphens with a single hyphen
  slug = slug.replace(/--+/g, '-');
  
  // Trim leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');
  
  return slug;
};


const SideFilter = ({
  selectedFilters,
  onFilterChange,
  selectedCategoryName,
  selectedSubcategoryName,
  selectedTypes = [],
  minPrice,
  maxPrice,
  selectedManufacturer,
  selectedRating,
  showManufacturerFilter = true,
}: SideFilterProps): JSX.Element => {
  const [search, setSearch] = useState<string>("");
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [isLoadingManufacturers, setIsLoadingManufacturers] = useState<boolean>(true);
  const pathname = usePathname();

  const categories: Category[] = categoriesData;

  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [priceRangeExpanded, setPriceRangeExpanded] = useState<boolean>(true);

  const [localMinPrice, setLocalMinPrice] = useState<number | ''>(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState<number | ''>(maxPrice);

  useEffect(() => {
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  const fetchManufacturers = useCallback(async () => {
    setIsLoadingManufacturers(true);
    try {
      const response = await api.get<{ results: { manufacturer: string }[] }>("/products/unique-manufacturers/");
      const uniqueManufacturers = Array.from(new Set(response.data.results.map(item => item.manufacturer)));
      setManufacturers(uniqueManufacturers.filter(Boolean) as string[]);
    } catch (err) {
      console.error("[SideFilter] Failed to fetch manufacturers:", err);
    } finally {
      setIsLoadingManufacturers(false);
    }
  }, []);

  useEffect(() => {
    if (showManufacturerFilter) {
      fetchManufacturers();
    }
  }, [fetchManufacturers, showManufacturerFilter]);

  useEffect(() => {
    if (categories.length > 0 && pathname) {
      const pathSegments = pathname.split('/').filter(Boolean);
      const currentCategorySlug = pathSegments[0];
      const currentCategory = categories.find(cat => toSlug(cat.name) === currentCategorySlug);
      
      if (currentCategory) {
        setExpandedCategory(currentCategory.id);
      }
    }
  }, [pathname, categories]);

  const filteredCategories: Category[] = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProductTypes: string[] = PRODUCT_TYPE_CHOICES.filter(type =>
    type.toLowerCase().includes(search.toLowerCase())
  );

  const handleApplyPriceFilter = useCallback(() => {
    onFilterChange('price_range', 'price_range', {
      min: localMinPrice,
      max: localMaxPrice
    });
  }, [localMinPrice, localMaxPrice, onFilterChange]);

  const handleManufacturerChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'all' ? null : e.target.value;
    onFilterChange(value || '', 'manufacturer', value);
  }, [onFilterChange]);

  const handleRatingChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === '0' ? null : Number(e.target.value);
    onFilterChange(value || 0, 'rating', value);
  }, [onFilterChange]);

  const isFilterActive = (slug: string): boolean => {
    return pathname.endsWith(`/${slug}`);
  };

  return (
    <aside className="sticky top-0 w-full max-w-[250px] min-h-screen bg-white flex flex-col overflow-y-auto z-20 border-r border-gray-100 shadow-sm">
      <div className="p-4 pb-2 ml-9">
        <h1 className="text-base font-bold text-black font-sans mb-3">
          Filter
        </h1>
        <div className="flex items-center gap-2 mb-5 relative">
          <input
            type="text"
            placeholder="Filter by"
            className="w-full h-9 border border-green-500 rounded px-3 py-0 text-sm text-gray-500 bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            aria-label="Filter categories and types by name"
          />
          {search ? (
            <button
              className="absolute right-2 text-gray-400 hover:text-red-500 text-xs"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              tabIndex={0}
            >
              ×
            </button>
          ) : (<button
            className="absolute right-2 text-gray-400 text-xs"
            aria-label="search"
            tabIndex={0}
          >
            <Funnel className="w-4 h-4" />
          </button>)}
        </div>

        <h2 className="text-base font-bold text-black font-sans mb-2.5">Categories</h2>
        <div className="space-y-0 mb-4">
          {filteredCategories.map((category: Category) => {
            const categorySlug = toSlug(category.name);
            const isCategoryActive = pathname === `/${categorySlug}`;
            
            return (
              <div key={category.id} className="border-b border-gray-200 last:border-b-0">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/${categorySlug}`}
                    className={`flex-1 text-left py-2 px-0 transition-colors duration-200 ${isCategoryActive
                      ? "bg-green-50 text-green-700 font-medium"
                      : "hover:bg-gray-50 text-black"
                      }`}
                  >
                    <span className="text-sm font-sans text-black truncate line-clamp-1">{category.name}</span>
                  </Link>
                  {category.subcategories.length > 0 && (
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                      className="p-2 -mr-2 rounded-full hover:bg-gray-100"
                      aria-expanded={expandedCategory === category.id}
                    >
                      {expandedCategory === category.id ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {expandedCategory === category.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 mt-1 space-y-1">
                        {category.subcategories.map((subcategory: Subcategory, index: number) => {
                          const subcategorySlug = toSlug(subcategory.name);
                          const href = `/${categorySlug}/${subcategorySlug}`;
                          const isSubcategoryActive = pathname === href;

                          return (
                            <motion.div
                              key={subcategory.id}
                              initial={{ x: -10, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: index * 0.02 }}
                            >
                              <Link
                                href={href}
                                className={`w-full block text-left p-2 text-xs rounded-md transition-colors duration-200 ${isSubcategoryActive
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "text-gray-600 hover:bg-green-50"
                                  }`}
                              >
                                <span className="truncate line-clamp-1">{subcategory.name}</span>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <h2 className="text-base font-bold text-black font-sans mb-2.5">Product Types</h2>
        <div className="space-y-0 mb-4">
          {filteredProductTypes.map((type: string, index: number) => {
            const isActive = selectedTypes.includes(type);
            const handleTypeChange = () => {
              const newSelectedTypes = isActive
                ? selectedTypes.filter((t) => t !== type)
                : [...selectedTypes, type];
              onFilterChange(type, "type", newSelectedTypes);
            };

            return (
              <button
                key={index}
                onClick={handleTypeChange}
                className={`w-full text-left py-2 px-0 transition-colors duration-200 ${isActive
                  ? "bg-green-50 text-green-700 font-medium"
                  : "hover:bg-gray-50 text-black"
                  }`}
                aria-pressed={isActive}
              >
                <span className="text-sm font-sans truncate line-clamp-1">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
              </button>
            );
          })}
        </div>

        <h2 className="text-base font-semibold mb-2 text-gray-800">Price Range</h2>
        <div className="space-y-1 mb-4">
          <button
            onClick={() => setPriceRangeExpanded(!priceRangeExpanded)}
            className="w-full flex items-center justify-between px-2 py-2 rounded-md transition-colors duration-200 hover:bg-gray-50 text-gray-700"
            aria-expanded={priceRangeExpanded}
          >
            <span className="text-sm">Filter by Price</span>
            {priceRangeExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
          </button>
          <AnimatePresence>
            {priceRangeExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden ml-2 space-y-2 pt-2"
              >
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-1/2 border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                    value={localMinPrice}
                    onChange={(e) => setLocalMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    aria-label="Minimum price"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-1/2 border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                    value={localMaxPrice}
                    onChange={(e) => setLocalMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    aria-label="Maximum price"
                  />
                </div>
                <button
                  onClick={handleApplyPriceFilter}
                  className="w-full text-sm bg-green-600 text-white py-1.5 rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Apply
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {showManufacturerFilter && (
          <>
            <h2 className="text-base font-semibold mb-2 text-gray-800">Manufacturer</h2>
            <div className="space-y-1 mb-4">
              <select
                className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                value={selectedManufacturer || 'all'}
                onChange={handleManufacturerChange}
                aria-label="Select manufacturer"
              >
                <option value="all">All Manufacturers</option>
                {manufacturers.map((manufacturer, index) => (
                  <option key={index} value={manufacturer}>
                    {manufacturer}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <h2 className="text-base font-semibold mb-2 text-gray-800">Rating</h2>
        <div className="space-y-1 mb-4">
          <select
            className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
            value={selectedRating || '0'}
            onChange={handleRatingChange}
            aria-label="Select minimum rating"
          >
            <option value="0">All Ratings</option>
            <option value="4">4 Stars & Up</option>
            <option value="3">3 Stars & Up</option>
            <option value="2">2 Stars & Up</option>
            <option value="1">1 Star & Up</option>
          </select>
        </div>

      </div>
      <div className="p-3 sm:p-4 mt-auto">
        <Image
          src="/sidebar.png"
          alt="Forklift Service"
          width={400}
          height={300}
          className="rounded-lg object-cover w-full h-auto"
          priority
        />
      </div>
    </aside>
  );
};

export default SideFilter;