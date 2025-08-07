// src/components/products/ProductListing.tsx
"use client";

import React, { useState } from "react";
import { Grid, List, MenuIcon, X } from "lucide-react";
import { ProductCardContainer } from "@/components/elements/Product";
import SideFilter from "@/components/products/SideFilter";
import Image from "next/image";
import { Toaster } from "sonner"; // Import Toaster for sonner
import QuoteForm from "../forms/enquiryForm/quotesForm";
import { Product } from "@/types";
import DOMPurify from 'dompurify';

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// Types
export interface Product {
  type: string;
  id: string;
  image: string;
  title: string;
  subtitle: string;
  price: number;
  currency: string;
  direct_sale: boolean;
  category_name: string;
  subcategory_name: string;
  is_active: boolean;
  hide_price: boolean;
  stock_quantity: number;
  manufacturer: string;
  average_rating: number | null;
}

interface ProductGridProps {
  products: Product[];
  viewMode?: "grid" | "list";
  noProductsMessage: string | null;
}

function ProductGrid({
  products,
  viewMode = "grid",
  noProductsMessage,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-300 rounded-full opacity-50"></div>
          </div>
          <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">No Products Found</h3>
          <p className="text-gray-500 text-sm md:text-base leading-relaxed">
            {noProductsMessage || "No products found matching your criteria. Try adjusting your filters or search terms."}
          </p>
        </div>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-4 md:space-y-6">
        {products.map((product: Product) => (
          <div
            key={product.id}
            className={`group bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-green-50/30 transition-all duration-300 overflow-hidden backdrop-blur-sm ${(!product.is_active || (product.direct_sale && product.stock_quantity === 0))
              ? 'opacity-60 pointer-events-none grayscale-[0.3]'
              : 'hover:shadow-lg hover:border-green-200 hover:-translate-y-1'
              }`}
          >
            <div className="flex flex-col sm:flex-row items-stretch">
              {/* Image Section */}
              <div className="w-full sm:w-32 md:w-44 lg:w-52 h-48 sm:h-32 md:h-36 lg:h-40 flex-shrink-0 relative overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.title}
                  width={300}
                  height={300}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  quality={90}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Content Section */}
              <div className="flex-1 p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between min-h-[140px] sm:min-h-[128px] md:min-h-[144px] lg:min-h-[160px]">
                {/* Product Info */}
                <div className="flex-1 min-w-0 mb-4 sm:mb-0 sm:pr-6">
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-700 transition-colors duration-200">
                    {product.title}
                  </h3>
                  <div className="text-sm sm:text-base md:text-lg text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                    <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.subtitle) }} />
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    {(product.hide_price == true || product.price <= 0) ? ( // Changed "0" to 0 for number comparison
                      <span className="text-xl md:text-2xl font-bold text-gray-400 tracking-wider">
                        {product.currency} *******
                      </span>
                    ) : (
                      <span className="text-xl md:text-2xl lg:text-3xl font-bold text-emerald-600 tracking-wide">
                        {product.currency} {typeof product.price === "number" ? product.price.toLocaleString("en-IN") : parseFloat(product.price.toString()).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-row sm:flex-col gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
                  {product.direct_sale ? (
                    <>
                      <button
                        className="flex-1 sm:flex-none bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap min-w-[120px] sm:min-w-[140px]"
                        disabled={!product.is_active || product.stock_quantity === 0}
                      >
                        Add to Cart
                      </button>
                      <button
                        className="flex-1 sm:flex-none bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap min-w-[120px] sm:min-w-[140px]"
                        disabled={!product.is_active || product.stock_quantity === 0}
                      >
                        Buy Now
                      </button>
                    </>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          className="flex items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 py-2.5 sm:py-3 px-4 sm:px-6 text-white font-semibold transition-all duration-200 w-full sm:w-auto shadow-md hover:shadow-lg transform hover:-translate-y-0.5 min-w-[120px] sm:min-w-[140px]"
                          aria-label="Get a quote"
                          disabled={!product.is_active}
                        >
                          Get a Quote
                        </button>
                      </DialogTrigger>
                      <DialogContent className="w-full sm:max-w-2xl">
                        <QuoteForm product={product} />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 p-2 sm:p-4 md:p-6"> {/* Changed grid to lg:grid-cols-4 */}
      {products.map((product: Product) => (
        <ProductCardContainer
          key={product.id}
          id={parseInt(product.id, 10)}
          image={product.image}
          title={product.title}
          subtitle={product.subtitle}
          price={product.price}
          currency={product.currency}
          directSale={product.direct_sale}
          is_active={product.is_active}
          hide_price={product.hide_price}
          type={product.type}
          stock_quantity={product.stock_quantity}
        />
      ))}
    </div>
  );
}

interface ProductListingProps {
  products: Product[];
  title?: string;
  totalCount: number;
  onFilterChange: (
    filterValue: string | number,
    filterType: "category" | "subcategory" | "type" | "price_range" | "manufacturer" | "rating" | "sort_by",
    newValue?: number | string | { min: number | ''; max: number | '' } | null
  ) => void;
  selectedFilters: Set<string>;
  selectedCategoryName: string | null;
  selectedSubcategoryName: string | null;
  selectedTypeName: string | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  noProductsMessage?: string | null;
  minPrice: number | '';
  maxPrice: number | '';
  selectedManufacturer: string | null;
  selectedRating: number | null;
  sortBy: string;
  onSortChange: (value: string) => void;
  showManufacturerFilter?: boolean;
}

export default function ProductListing({
  products,
  title,
  totalCount,
  onFilterChange,
  selectedFilters,
  selectedCategoryName,
  selectedSubcategoryName,
  selectedTypeName,
  currentPage,
  totalPages,
  onPageChange,
  noProductsMessage = null,
  minPrice,
  maxPrice,
  selectedManufacturer,
  selectedRating,
  sortBy,
  onSortChange,
  showManufacturerFilter = true,
}: ProductListingProps) {
  const [currentView, setCurrentView] = useState<"grid" | "list">("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  const handleViewChange = (view: "grid" | "list") => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-green-50/30">
      <Toaster position="top-right" richColors />
      <div className="flex flex-col lg:flex-row">

        {/* --- START: Conditional Rendering for Filters --- */}

        {/* Render the filters ONLY if the path does NOT start with /vendor-listing/ */}
        {/* {!window.location.pathname.startsWith("/vendor-listing/") && ( */}
        <>
          {/* Desktop Sidebar */}
          <div className="hidden lg:block flex-shrink-0 w-72 xl:w-80">
            <div className="sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto">
              <SideFilter
                selectedFilters={selectedFilters}
                onFilterChange={onFilterChange}
                selectedCategoryName={selectedCategoryName}
                selectedSubcategoryName={selectedSubcategoryName}
                selectedTypeName={selectedTypeName}
                minPrice={minPrice}
                maxPrice={maxPrice}
                selectedManufacturer={selectedManufacturer}
                showManufacturerFilter={showManufacturerFilter} // Pass the new prop down
                selectedRating={selectedRating}
              />
            </div>
          </div>

          {/* Sidebar Mobile Drawer */}
          <div
            className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-all duration-300 ${mobileFilterOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
              }`}
            onClick={() => setMobileFilterOpen(false)}
          >
            <aside
              className={`absolute left-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 ${mobileFilterOpen ? "translate-x-0" : "-translate-x-full"
                }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
                <span className="font-bold text-lg sm:text-xl text-gray-800">Filters</span>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-2 rounded-full hover:bg-white/80 transition-colors duration-200 shadow-sm"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="h-[calc(100%-80px)] overflow-y-auto">
                <SideFilter
                  selectedFilters={selectedFilters}
                  onFilterChange={onFilterChange}
                  selectedCategoryName={selectedCategoryName}
                  selectedSubcategoryName={selectedSubcategoryName}
                  selectedTypeName={selectedTypeName}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  selectedManufacturer={selectedManufacturer}
                  showManufacturerFilter={showManufacturerFilter} // Pass the new prop down
                  selectedRating={selectedRating}
                />
              </div>
            </aside>
          </div>
        </>
        {/* )} */}

        {/* --- END: Conditional Rendering for Filters --- */}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top Controls */}
          <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 shadow-sm sticky top-0 z-40">
            <div className="flex flex-col gap-4 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 px-4 py-2 rounded-full text-sm sm:text-base font-semibold shadow-sm">
                    {title || 'Products'}
                  </div>
                  <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
                  <p className="text-sm sm:text-base text-gray-600 font-medium">
                    <span className="text-green-600 font-bold">{products.length}</span> of <span className="font-bold">{totalCount}</span> results
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-4">
                {/* Sort By */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <label htmlFor="sort-by" className="text-sm sm:text-base font-semibold text-gray-700 whitespace-nowrap">
                    Sort By
                  </label>
                  <select
                    id="sort-by"
                    className="px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg text-sm sm:text-base bg-white shadow-sm hover:border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value)}
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>

                {/* View Toggle & Mobile Filter Button */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
                    <button
                      onClick={() => handleViewChange("grid")}
                      className={`p-2 sm:p-2.5 transition-all duration-200 ${currentView === "grid"
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                        : "text-gray-500 hover:text-green-600 hover:bg-green-50"}`}
                      aria-label="Grid View"
                    >
                      <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => handleViewChange("list")}
                      className={`p-2 sm:p-2.5 transition-all duration-200 ${currentView === "list"
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                        : "text-gray-500 hover:text-green-600 hover:bg-green-50"}`}
                      aria-label="List View"
                    >
                      <List className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  {/* Mobile Filter Button: Only show if NOT a vendor page */}
                  {!window.location.pathname.startsWith("/vendor-listing/") && (
                    <button
                      className="lg:hidden flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                      onClick={() => setMobileFilterOpen(true)}
                      aria-label="Open filters"
                    >
                      <MenuIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base">Filters</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid and Pagination */}
          <div className="p-4 sm:p-6 lg:p-8">
            <ProductGrid products={products} viewMode={currentView} noProductsMessage={noProductsMessage} />

            {totalPages > 1 && (
              <div className="mt-8 sm:mt-12 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-green-50"}
                      />
                    </PaginationItem>

                    {(() => {
                      const items = [];
                      const delta = 2;

                      // Always show first page
                      items.push(
                        <PaginationItem key={1}>
                          <PaginationLink
                            onClick={() => onPageChange(1)}
                            isActive={currentPage === 1}
                            className={currentPage === 1
                              ? "bg-green-500 text-white hover:bg-green-600"
                              : "cursor-pointer hover:bg-green-50"}
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                      );

                      // Add ellipsis if there's a gap after page 1
                      if (currentPage - delta > 2) {
                        items.push(
                          <PaginationItem key="ellipsis-start">
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }

                      // Add pages around current page
                      const start = Math.max(2, currentPage - delta);
                      const end = Math.min(totalPages - 1, currentPage + delta);

                      for (let i = start; i <= end; i++) {
                        items.push(
                          <PaginationItem key={i}>
                            <PaginationLink
                              onClick={() => onPageChange(i)}
                              isActive={currentPage === i}
                              className={currentPage === i
                                ? "bg-green-500 text-white hover:bg-green-600"
                                : "cursor-pointer hover:bg-green-50"}
                            >
                              {i}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }

                      // Add ellipsis if there's a gap before last page
                      if (currentPage + delta < totalPages - 1) {
                        items.push(
                          <PaginationItem key="ellipsis-end">
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }

                      // Always show last page (if more than 1 page total)
                      if (totalPages > 1) {
                        items.push(
                          <PaginationItem key={totalPages}>
                            <PaginationLink
                              onClick={() => onPageChange(totalPages)}
                              isActive={currentPage === totalPages}
                              className={currentPage === totalPages
                                ? "bg-green-500 text-white hover:bg-green-600"
                                : "cursor-pointer hover:bg-green-50"}
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }

                      return items;
                    })()}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-green-50"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
