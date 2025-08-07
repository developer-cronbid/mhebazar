/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/products/SideFilter.tsx
"use client";

import { useState, useEffect, useCallback, JSX } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";

// Import the local JSON data for categories
import categoriesData from "@/data/categories.json";

// Define interfaces based on the local JSON data structure
interface Subcategory {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  subcategories: Subcategory[];
}

// Product types as provided by your backend
const PRODUCT_TYPE_CHOICES = ["new", "used", "rental", "attachments"];

interface SideFilterProps {
  selectedFilters: Set<string>;
  onFilterChange: (
    filterValue: string | number,
    filterType: "category" | "subcategory" | "type" | "price_range" | "manufacturer" | "rating" | "sort_by",
    newValue?: number | string | { min: number | ''; max: number | '' } | null
  ) => void;
  selectedCategoryName: string | null;
  selectedSubcategoryName: string | null;
  selectedTypeName: string | null;
  minPrice: number | '';
  maxPrice: number | '';
  selectedManufacturer: string | null;
  selectedRating: number | null;
  showManufacturerFilter?: boolean;
}

const SideFilter = ({
  selectedFilters,
  onFilterChange,
  selectedCategoryName,
  selectedSubcategoryName,
  selectedTypeName,
  minPrice,
  maxPrice,
  selectedManufacturer,
  selectedRating,
  showManufacturerFilter = true,
}: SideFilterProps): JSX.Element => {
  const [search, setSearch] = useState<string>("");
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [isLoadingManufacturers, setIsLoadingManufacturers] = useState<boolean>(true);
  
  // Use the imported JSON data directly
  const categories: Category[] = categoriesData;

  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [priceRangeExpanded, setPriceRangeExpanded] = useState<boolean>(true);

  // Local state for price inputs to avoid re-fetches on every keystroke
  const [localMinPrice, setLocalMinPrice] = useState<number | ''>(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState<number | ''>(maxPrice);

  // Sync local price state with props when they change (e.g., from URL params)
  useEffect(() => {
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  // Fetch unique manufacturers (this still requires an API call as the data is dynamic)
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
    // Only fetch manufacturers if the filter is enabled
    if (showManufacturerFilter) {
      fetchManufacturers();
    }
  }, [fetchManufacturers, showManufacturerFilter]);

  // Expand the category if a subcategory within it is currently selected
  useEffect(() => {
    if (categories.length > 0) {
      const currentCategory = categories.find(cat =>
        (selectedCategoryName && cat.name.toLowerCase() === selectedCategoryName.toLowerCase()) ||
        (selectedSubcategoryName && cat.subcategories.some(sub => sub.name.toLowerCase() === selectedSubcategoryName.toLowerCase()))
      );
      if (currentCategory) {
        setExpandedCategory(currentCategory.id);
      }
    }
  }, [selectedCategoryName, selectedSubcategoryName, categories]);

  // Filter categories by search input
  const filteredCategories: Category[] = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  // Filter product types by search input
  const filteredProductTypes: string[] = PRODUCT_TYPE_CHOICES.filter(type =>
    type.toLowerCase().includes(search.toLowerCase())
  );

  // Handler for the Apply button
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

  // Helper to determine if a filter is active for highlighting
  const isFilterActive = (value: string): boolean => {
    const lowerValue = value.toLowerCase();
    if (selectedCategoryName && lowerValue === selectedCategoryName.toLowerCase()) return true;
    if (selectedSubcategoryName && lowerValue === selectedSubcategoryName.toLowerCase()) return true;
    if (selectedTypeName && lowerValue === selectedTypeName.toLowerCase()) return true;
    return false;
  };

  return (
    <aside className="sticky top-0 w-full max-w-xs min-h-screen bg-white flex flex-col overflow-y-auto z-20 border-r border-gray-100 shadow-sm">
      <div className="p-3 sm:p-4 pb-2">
        <h1 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Filter
        </h1>
        <div className="flex items-center gap-2 mb-4 relative">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by name..."
            className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            aria-label="Filter categories and types by name"
          />
          {search && (
            <button
              className="absolute right-2 text-gray-400 hover:text-red-500 text-xs"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              tabIndex={0}
            >
              ×
            </button>
          )}
        </div>

        {/* Categories Section */}
        <h2 className="text-base font-semibold mb-2 text-gray-800">Categories</h2>
        <div className="space-y-1 mb-4">
          {filteredCategories.map((category: Category) => (
            <div key={category.id} className="border-b border-gray-100 last:border-b-0">
              <button
                onClick={() => {
                  if (category.subcategories.length > 0) {
                    setExpandedCategory(
                      expandedCategory === category.id ? null : category.id
                    );
                  }
                  onFilterChange(category.name, "category", category.name);
                }}
                className={`w-full flex items-center justify-between px-2 py-2 rounded-md transition-colors duration-200 ${isFilterActive(category.name)
                  ? "bg-green-50 text-green-700 font-medium"
                  : "hover:bg-gray-50 text-gray-700"
                  }`}
                aria-expanded={expandedCategory === category.id}
              >
                <span className="text-sm">{category.name}</span>
                {category.subcategories.length > 0 && (
                  expandedCategory === category.id ? (
                    <ChevronDown className="w-4 h-4 text-green-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )
                )}
              </button>
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
                      {category.subcategories.map((subcategory: Subcategory, index: number) => (
                        <motion.button
                          key={subcategory.id}
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className={`w-full text-left p-2 text-xs rounded-md transition-colors duration-200 ${isFilterActive(subcategory.name)
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-600 hover:bg-green-50"
                            }`}
                          onClick={() => onFilterChange(subcategory.name, "subcategory", subcategory.name)}
                        >
                          {subcategory.name}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Product Types Section */}
        <h2 className="text-base font-semibold mb-2 text-gray-800">Product Types</h2>
        <div className="space-y-1 mb-4">
          {filteredProductTypes.map((type: string, index: number) => (
            <button
              key={index}
              onClick={() => onFilterChange(type, "type")}
              className={`w-full text-left px-2 py-2 rounded-md transition-colors duration-200 ${isFilterActive(type)
                ? "bg-purple-50 text-purple-700 font-medium"
                : "hover:bg-gray-50 text-gray-700"
                }`}
            >
              <span className="text-sm">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </button>
          ))}
        </div>

        {/* Price Range Filter */}
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

        {/* Manufacturer Filter */}
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

        {/* Rating Filter */}
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
      {/* Banner Image */}
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
