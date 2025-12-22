// src/app/vendor/product-list/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import api from "@/lib/api";
import ProductForm from "@/components/forms/uploadForm/ProductForm";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Pencil, ExternalLink } from "lucide-react";

import { Product } from "@/types";
import categories_id from '@/data/categories.json';
import { useUser } from "@/context/UserContext";

const sortOptions = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "A-Z", value: "az" },
  { label: "Z-A", value: "za" },
];

const TYPE_OPTIONS = ["new", "used", "rental", "attachments"] as const;
type TabType = (typeof TYPE_OPTIONS)[number];


const imgUrl = process.env.NEXT_PUBLIC_API_BASE_MEDIA_URL || process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [tab, setTab] = useState<TabType>("new");
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState(sortOptions[0].value);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { user } = useUser(); 

  // 2. DERIVE LOGIC HERE
  // Note: Check if 'role' is a string or an object. 
  // If it's an object, use: user?.role?.name === 'vendor'
  const isVendorUser = useMemo(() => {
    // We check user.role.name instead of just user.role
    return user?.role?.name === 'Vendor'; 
  }, [user]);

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
    categories_id.forEach(processCategory);
    return map;
  }, []);

  function getImageSrc(images?: { image: string }[] | string): string {
    if (typeof images === 'string' && images) return `${imgUrl}${images}`;
    if (Array.isArray(images) && images.length > 0 && images[0].image) {
        const imagePath = images[0].image.startsWith('/') ? images[0].image.substring(1) : images[0].image;
        return `${imgUrl}${imagePath}`;
    }
    return "/no-product.jpg";
  }

  // Define fetchProducts outside of useEffect for re-use
  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch products from the vendor dashboard endpoint
      const response = await api.get("/vendor/dashboard/"); 
      const productsData = response.data?.products || [];
      setProducts(productsData);
      const uniqueCategories = Array.from(
        new Set(productsData.map((p: Product) => p.category_name))
      ) as string[];
      setCategories(uniqueCategories);
      setError(null);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to close the sheet and refresh data
  const closeSheetAndRefresh = () => {
    setIsSheetOpen(false);
    setSelectedProduct(undefined); // Clear selected product state to reset form
    fetchProducts(); // Refresh the product list
  };

  useEffect(() => {
    fetchProducts();
  }, []); // Initial fetch

  useEffect(() => {
    if (showFilter) {
      const originalStyle = window.getComputedStyle(document.body);
      const originalOverflow = originalStyle.overflow;
      const originalPaddingRight = originalStyle.paddingRight;
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      Object.assign(document.body.style, {
        overflow: 'hidden',
        paddingRight: `calc(${originalPaddingRight} + ${scrollBarWidth}px)`
      });
      return () => {
        Object.assign(document.body.style, {
          overflow: originalOverflow,
          paddingRight: originalPaddingRight
        });
      };
    }
  }, [showFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSort) {
        const target = event.target as Element;
        if (!target.closest('.sort-dropdown-container')) {
          setShowSort(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSort]);

  const productsPerPage = 4;

  // Filtering logic now checks if the product's type array includes the current tab
  let filteredProducts = products.filter((p) =>
    Array.isArray(p.type) && p.type.includes(tab)
  );

  if (selectedCategories.length > 0) {
    filteredProducts = filteredProducts.filter((p) =>
      selectedCategories.includes(p.category_name)
    );
  }

  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "az":
        return a.name.localeCompare(b.name);
      case "za":
        return b.name.localeCompare(a.name);
      case "oldest":
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      case "newest":
      default:
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
  });

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));

  const handleCategoryChange = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleEditClick = async (productId: number) => {
    try {
      // This GET request failed before because the restricted queryset blocked it.
      // With the fix in views.py, this should now succeed for the product owner.
      const response = await api.get(`/products/${productId}/`);
      setSelectedProduct(response.data);
      setIsSheetOpen(true);
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            Product List
          </h1>
          <Sheet open={isSheetOpen} onOpenChange={(open) => {
            if (!open) {
                // When closing, clear selected product to reset form for 'Add Product'
                setSelectedProduct(undefined); 
            }
            setIsSheetOpen(open);
          }}>
            <SheetTrigger asChild>
              <Button
                variant="default"
                className="bg-[#5CA131] hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 w-full sm:w-auto justify-center transition-colors duration-200"
                onClick={() => setSelectedProduct(undefined)} // Ensure form is clear for new product
              >
                + Add Product
              </Button>
            </SheetTrigger>
                       <SheetContent className="flex flex-col h-full p-0 sm:max-w-xl">
              {/* The Header is fixed at the top */}
              {/* <div className="p-4 border-b bg-white shrink-0">
                <h2 className="text-lg font-semibold">
                  {selectedProduct ? "Edit Product" : "Add Product"}
                </h2>
              </div> */}
            
              {/* This is the magic div: flex-1 takes all remaining space, 
                  overflow-y-auto enables scrolling ONLY here */}
              <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                <ProductForm product={selectedProduct} isVendor={isVendorUser}  onSuccess={() => setIsSheetOpen(false)} />
                
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Tabs and Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as TabType);
              setCurrentPage(1);
            }}
            className="w-full lg:w-auto"
          >
            <TabsList className="bg-white w-full grid grid-cols-2 sm:grid-cols-4 lg:flex h-auto p-1 rounded-lg shadow-sm border">
              {TYPE_OPTIONS.map((type) => (
                <TabsTrigger
                  key={type}
                  value={type}
                  className="data-[state=active]:bg-green-50 data-[state=active]:border-green-500 data-[state=active]:text-green-600 px-3 py-2 font-medium text-sm rounded-md transition-all duration-200"
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex gap-2 w-full lg:w-auto">
            <Button
              variant="outline"
              className="flex items-center gap-2 border-gray-300 hover:border-gray-400 font-medium text-gray-700 px-4 py-2 rounded-lg flex-1 sm:flex-none justify-center transition-colors duration-200"
              onClick={() => setShowFilter(true)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
            </Button>

            <div className="relative flex-1 sm:flex-none sort-dropdown-container">
              <Button
                variant="outline"
                className="flex items-center gap-2 border-gray-300 hover:border-gray-400 font-medium text-gray-700 px-4 py-2 rounded-lg w-full sm:w-auto justify-center transition-colors duration-200"
                onClick={() => setShowSort((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={showSort}
              >
                Sort by
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showSort ? 'rotate-180' : ''}`} />
              </Button>
              {showSort && (
                <div className="absolute right-0 mt-2 z-30 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px] overflow-hidden">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`block w-full text-left px-4 py-3 text-sm hover:bg-green-50 transition-colors duration-150 ${sortBy === opt.value ? "text-green-600 bg-green-50 font-medium" : "text-gray-700"
                        }`}
                      onClick={() => {
                        setSortBy(opt.value);
                        setShowSort(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="space-y-4">
          {currentProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 bg-white"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Product Image */}
                  <div className="relative h-24 w-24 sm:h-32 sm:w-32 lg:h-36 lg:w-36 flex-shrink-0 mx-auto sm:mx-0">
                    <img
                      src={getImageSrc(product.images)}
                      alt={product.name}
                      className="object-contain rounded"
                      sizes="80px"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `${imgUrl}${categoryImageMap[product.category]}`;
                      }}
                    />
                    {/* Badge now uses the 'tab' state for color and text */}
                    <span
                      className={`absolute top-1 left-1 sm:top-2 sm:left-2 ${(() => {
                        switch (tab) {
                          case 'new': return 'bg-blue-500';
                          case 'used': return 'bg-orange-500';
                          case 'rental': return 'bg-purple-500';
                          case 'attachments': return 'bg-pink-500';
                          default: return 'bg-gray-500';
                        }
                      })()} text-white px-2 py-1 rounded-md text-xs font-medium shadow-sm`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${product.is_active
                            ? "text-green-800 bg-green-100"
                            : "text-yellow-800 bg-yellow-100"
                            }`}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                         <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${product.status === 'approved'
                            ? "text-green-800 bg-green-100"
                            : product.status === 'pending' ? "text-blue-800 bg-blue-100" : "text-red-800 bg-red-100"
                            }`}
                        >
                          {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                        </span>
                        <span className="text-xs text-gray-700 bg-gray-100 px-3 py-1 rounded-full font-medium">
                          {product.category_name}
                        </span>
                      </div>

                      <div className="flex sm:justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem onSelect={() => handleEditClick(product.id)} className="cursor-pointer">
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => window.open(`/products-details/${product.id}`, '_blank')} className="cursor-pointer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <h3 className="font-semibold text-lg sm:text-xl text-gray-900 mb-2 line-clamp-2" title={product.name}>
                      {product.name}
                    </h3>

                    <div className="flex items-center text-sm text-gray-500">
                      <span>
                        Updated {new Date(product.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {currentProducts.length === 0 && (
            <div className="text-center text-gray-500 py-16 bg-white rounded-xl border border-gray-200">
              <div className="max-w-sm mx-auto">
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-sm">Try adjusting your filters or selected tab to see more products.</p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 cursor-default">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {[...Array(totalPages)].map((_, i) => {
                  // Show first page, last page, current page, and pages around current
                  const pageNumber = i + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNumber)}
                          isActive={currentPage === pageNumber}
                          className={`${currentPage === pageNumber
                              ? "bg-[#5CA131] text-white hover:bg-[#4A8127]"
                              : "hover:bg-green-50"
                            }`}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }

                  // Show ellipsis for skipped pages
                  if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return (
                      <PaginationItem key={i}>
                        <span className="px-4 py-2">...</span>
                      </PaginationItem>
                    );
                  }

                  return null;
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Filter Modal */}
        {showFilter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowFilter(false)}
            />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Filter Products</h3>
                <button
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setShowFilter(false)}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="mb-6">
                  <div className="font-semibold text-gray-900 mb-4">Category</div>
                  <div className="space-y-3">
                    {categories.map((cat) => (
                      <label key={cat} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors duration-150">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat)}
                          onChange={() => handleCategoryChange(cat)}
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2"
                        />
                        <span className="text-gray-700">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-300 hover:bg-gray-100"
                  onClick={() => {
                    setSelectedCategories([]);
                  }}
                >
                  Clear All
                </Button>
                <Button
                  variant="default"
                  className="flex-1 bg-[#5CA131] hover:bg-green-700 text-white"
                  onClick={() => setShowFilter(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}