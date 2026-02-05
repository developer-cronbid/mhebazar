/**
 * @fileoverview Robust component for comparing up to 4 products in Next.js 15 (TSX).
 * FINAL FIX: Incorporates a robust data parsing mechanism to handle the structured
 * array data even if it arrives as a single string, ensuring clean, stacked key-value pairs
 * in the comparison table. Also enforces strict vertical alignment (align-top) in the table cells.
 */
"use client";
import React, { useState, ChangeEvent, useEffect, useCallback, useMemo } from "react";
import { Plus, X, Star, Loader2, Maximize2 } from "lucide-react";
import Image from "next/image"; 
import Link from "next/link"; 
// Assuming these imports are correctly set up
// Ensure you have these components/utilities in your project structure
import api from "@/lib/api"; 
import { toast } from "sonner";
import { Button } from "@/components/ui/button"; 
import { Card, CardContent } from "@/components/ui/card"; 

// --- 1. TYPE DEFINITIONS ---
type ApiProduct = {
  id: number;
  name: string;
  description: string | null;
  price: string | number; 
  direct_sale: boolean;
  is_active: boolean;
  hide_price: boolean;
  stock_quantity: number;
  images: { id: number; image: string }[];
  category_name: string;
  subcategory_name: string | null;
  manufacturer: string | null;
  model: string | null;
  user_name: string | null;
  average_rating: number | null;
  type: string[] | string; 
  product_details: Record<string, string | number | boolean | null | Array<string>>; 
};

type CompareProduct = {
  id: number;
  image: string;
  title: string;
  price: string | number;
  currency: string;
  hide_price: boolean;
  category_name: string;
  manufacturer: string | null;
  model: string | null;
  average_rating: number | null;
  stock_quantity: number;
  product_details: Record<string, string | number | boolean | null | Array<string>>;
};

interface ComparisonField {
  label: string;
  key: string; 
  isCurrency?: boolean;
  isRating?: boolean;
  isBoolean?: boolean;
  isStructuredArray?: boolean; 
}

// --- 2. CONSTANTS & UTILITIES ---
const MAX_COLUMNS = 4;
const COMPARE_KEY = 'mhe_compare_products';

// Helper: Safely retrieve product value 
const getProductValue = (product: CompareProduct, key: string): string | number | boolean | null | Array<string> => {
    if (key in product) {
        return product[key as keyof CompareProduct];
    }
    return product.product_details?.[key] ?? null;
};

/**
 * CORE FIX: Forcefully parses the structured data string into an array of strings.
 * Handles cases where the API returns ["Brand: X", "Part: Y"] as a single string.
 */
const parseStructuredArray = (data: Array<string> | string | null | undefined): Array<string> => {
    if (Array.isArray(data)) {
        return data.filter(d => typeof d === 'string' && d.trim().length > 0);
    }
    
    if (typeof data === 'string') {
        const trimmedData = data.trim();
        
        // 1. Attempt JSON parsing (handles strings that look like valid JSON arrays)
        if (trimmedData.startsWith('[') && trimmedData.endsWith(']')) {
            try {
                const jsonParse = JSON.parse(trimmedData);
                if (Array.isArray(jsonParse)) {
                    return jsonParse.filter(item => typeof item === 'string');
                }
            } catch (e) {
                // If JSON.parse fails, it's likely the unquoted list format.
                
                // 2. Fallback for unquoted or quoted strings that just need splitting
                // Strip outer brackets and attempt to split by common array delimiters
                const cleanedString = trimmedData.replace(/^\[|\]$/g, '');
                
                // Best effort split: assumes content is structured like "Item 1", "Item 2" or Item 1, Item 2
                return cleanedString.split(/,\s*(?=(?:(?:[^"]*"){2})*[^"]*$)/)
                    .map(item => item.replace(/"/g, '').trim()) // Remove internal quotes
                    .filter(item => item.length > 0);
            }
        }
    }
    return [];
};


const ComparePage = () => {
  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ApiProduct[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // --- 3. DYNAMIC DATA PROCESSING ---

  const dynamicProductDetailsKeys: string[] = useMemo(() => {
    const uniqueKeys = new Set<string>();
    products.forEach(product => {
      if (product.product_details) {
        Object.keys(product.product_details).forEach(key => {
            if (key && !key.toLowerCase().includes('meta_')) {
                uniqueKeys.add(key);
            }
        });
      }
    });
    return Array.from(uniqueKeys).sort();
  }, [products]);


  const allTableFields: ComparisonField[] = useMemo(() => {
    const staticFields: ComparisonField[] = [
      { label: "Price", key: "price", isCurrency: true },
      { label: "Rating", key: "average_rating", isRating: true },
      { label: "Category", key: "category_name" },
      { label: "Manufacturer", key: "manufacturer" },
      { label: "Model", key: "model" },
      { label: "In Stock", key: "stock_quantity" }, 
    ];

    const dynamicFields: ComparisonField[] = dynamicProductDetailsKeys.map(key => {
        const isArrayData = products.some(p => {
             const value = getProductValue(p, key);
             // Use the parser defensively here to determine if this is a structured field
             return parseStructuredArray(value).length > 0;
        });

        return {
          label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          key: key,
          isStructuredArray: isArrayData,
        };
    });

    return [...staticFields, ...dynamicFields];
  }, [dynamicProductDetailsKeys, products]);


  // --- 4. HANDLERS (Unchanged logic) ---
  const saveToLocalStorage = useCallback((updatedProducts: CompareProduct[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(COMPARE_KEY, JSON.stringify(updatedProducts));
    }
  }, []);

useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const rawData = localStorage.getItem(COMPARE_KEY);
        const storedProducts: any[] = JSON.parse(rawData || '[]');
        
        if (storedProducts.length > 0) {
          // --- FIX: Normalize data structure ---
          const normalized = storedProducts.map(p => ({
            ...p,
            // Map 'name' to 'title' if 'title' is missing
            title: p.title || p.name || "Unnamed Product",
            
            // Map ratings correctly (Backend often returns 'average_rating')
            average_rating: p.average_rating !== undefined ? p.average_rating : (p.rating || 0),
            
            // Map images correctly (Product page might save 'images' array or just 'image' string)
            image: p.image || (p.images && p.images[0]?.image) || "/images/placeholder.jpg",
            
            // Ensure product_details is an object to prevent table crashes
            product_details: p.product_details || {}
          }));

          setProducts(normalized);
          // Auto-select category based on the first item found
          if (normalized[0].category_name) {
            setSelectedCategory(normalized[0].category_name);
          }
        }
      } catch (error) {
        console.error("Failed to parse products from local storage:", error);
        localStorage.removeItem(COMPARE_KEY);
      }
    }
  }, []);
  const handleAddProduct = (product: ApiProduct) => {
    if (products.some((p) => p.id === product.id)) {
      toast.info("This product is already in comparison.");
      return;
    }
    if (selectedCategory && product.category_name !== selectedCategory) {
      toast.error(`Only products from the "${selectedCategory}" category can be compared together.`);
      return;
    }

    const newCompareProduct: CompareProduct = {
      id: product.id,
      image: product.images?.[0]?.image || "/images/placeholder.jpg",
      title: product.name,
      price: product.price,
      currency: "₹",
      hide_price: product.hide_price,
      category_name: product.category_name,
      manufacturer: product.manufacturer,
      model: product.model,
      average_rating: product.average_rating || null,
      stock_quantity: product.stock_quantity, 
      product_details: product.product_details || {},
    };

    const updatedProducts = [...products, newCompareProduct].slice(0, MAX_COLUMNS);
    setProducts(updatedProducts);
    saveToLocalStorage(updatedProducts);
    
    if (!selectedCategory) {
        setSelectedCategory(newCompareProduct.category_name);
    }

    setShowModal(false);
    setSearch("");
    setSearchResults([]);
    toast.success(`${product.name} added to comparison!`);
  };
  
  const handleRemoveProduct = (id: number) => {
    const updatedProducts = products.filter((product) => product.id !== id);
    setProducts(updatedProducts);
    saveToLocalStorage(updatedProducts);
    
    if (updatedProducts.length === 0) {
      setSelectedCategory(null);
    } else if (selectedCategory && updatedProducts.length > 0 && selectedCategory !== updatedProducts[0].category_name) {
      setSelectedCategory(updatedProducts[0].category_name);
    }
    toast.info("Product removed from comparison.");
  };

  const handleSearch = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setSearch(searchTerm);

    if (searchTerm.length < 2) {
      setSearchResults([]);
      setLoadingSearch(false);
      return;
    }

    setLoadingSearch(true);
    try {
      const response = await api.get<{ results: ApiProduct[] }>(`/products/`, {
        params: {
          search: searchTerm,
          category_name: selectedCategory || undefined, 
          is_active: true,
          status: 'approved',
          page_size: 10,
        },
      });
      setSearchResults(response.data.results);
    } catch (error) {
      console.error("Error searching products:", error);
      toast.error("Failed to search products. Please try again later.");
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  }, [selectedCategory]);


  const displayProducts = products.slice(0, MAX_COLUMNS);

const productSlugify = (name: string | undefined | null) => {
  if (!name) return 'product'; // Fallback to avoid .toLowerCase() crash
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
  // --- 5. REFINED RENDER COMPONENTS ---

  const RatingDisplay = ({ rating }: { rating: number | null }) => {
    const numericRating = typeof rating === 'number' ? rating : 0;
    if (numericRating <= 0) return <span className="text-gray-400 text-sm font-light">N/A</span>;
    
    const filledStars = Math.round(numericRating);
    return (
      <span className="flex items-center text-sm gap-1 justify-center">
        <span className="font-semibold text-yellow-600">{numericRating.toFixed(1)}</span>
        <span className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 transition-colors ${i < filledStars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
            />
          ))}
        </span>
      </span>
    );
  };
  
  const StatusDisplay = ({ value, label }: { value: string | number | boolean | null, label: string }) => {
      let displayValue: React.ReactNode = <span className="text-gray-400 text-sm font-light">N/A</span>;
      
      if (label === 'In Stock') {
          const stock = Number(value);
          if (stock > 0) {
              displayValue = <span className="text-green-600 font-semibold">Available ({stock})</span>;
          } else if (stock === 0) {
              displayValue = <span className="text-red-600 font-semibold">Out of Stock</span>;
          }
      } else if (typeof value === 'boolean') {
          if (value === true) {
              displayValue = <span className="text-blue-600 font-semibold">Yes</span>;
          } else if (value === false) {
              displayValue = <span className="text-red-600 font-semibold">No</span>;
          }
      } else if (value !== null && value !== undefined && String(value).trim() !== "") {
          displayValue = <span className="text-gray-700 break-words font-normal">{String(value)}</span>;
      }
      
      return displayValue;
  }

  /**
   * Final Component Fix: Renders the destructured key-value pairs vertically.
   */
  const ArrayDetailsDisplay = ({ data }: { data: Array<string> | string | null | undefined }) => {
    // Pass the raw data through the robust parser
    const details = parseStructuredArray(data);

    if (details.length === 0) {
      return <span className="text-gray-400 text-sm font-light">N/A</span>;
    }

    return (
      // Enforce column layout for stacking with tight spacing, centered within the TD but contents aligned left
      <div className="flex flex-col items-start space-y-1 py-1 px-1 w-full max-w-[95%] mx-auto text-left">
        {details.map((detail, index) => {
            const parts = detail.split(':').map(s => s.trim());
            const label = parts[0]; 
            const content = parts.slice(1).join(': '); 

            // Only show if there is clear content after the first colon
            if (!content) return null;

            return (
                <div key={index} className="text-xs w-full pb-1 border-b border-gray-100 last:border-b-0 text-left">
                    {/* Label (Key) is font-medium */}
                    <span className="font-medium text-gray-700">{label}:</span>{' '}
                    {/* Content (Value) is font-normal/regular, breaks onto new line if needed */}
                    <span className="text-gray-600 font-normal break-words block sm:inline-block mt-0.5 sm:mt-0">{content}</span>
                </div>
            );
        })}
      </div>
    );
  };


  return (
    <>
      <div className="min-h-screen bg-white pb-20"> {/* Changed bg to white */}
        {/* Header Section */}
        <div className="w-full px-6 lg:px-12 pt-8 pb-6 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900">
              Product Comparison {selectedCategory && 
                <span className="text-[#5CA131]">({selectedCategory})</span>
              }
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Comparing {products.length} out of {MAX_COLUMNS} products
            </p>
          </div>
        </div>

        {/* Product Cards Section - Updated styling */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12 my-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: MAX_COLUMNS }).map((_, idx) => {
              const product = displayProducts[idx];
              
              if (product) {
                const productUrl = `/product/${productSlugify(product.title)}-${product.id}`;
                const safeTitle = product.title || "product";
    const safeId = product.id || "0";
                return (
                  <Card 
                    key={product.id} 
                    className="relative bg-white rounded-lg border border-gray-200 hover:border-[#5CA131] transition-all duration-300"
                  >
                    <button
                      onClick={() => handleRemoveProduct(product.id)}
                      className="absolute top-2 right-2 bg-white text-gray-400 rounded-full p-1.5 hover:text-red-500 transition-colors z-10 border border-gray-200"
                      aria-label={`Remove ${product.title} from comparison`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <CardContent className="p-4">
                      <Link href={productUrl} className="block text-center">
                        <div className="w-full h-40 relative flex items-center justify-center bg-gray-50 rounded mb-3">
                          <Image
                            src={product.image || "/images/placeholder.jpg"}
                            alt={product.title}
                            width={160}
                            height={160}
                            className="object-contain max-h-[160px]"
                            priority={idx === 0}
                          />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[40px] hover:text-[#5CA131]">
                          {product.title}
                        </h3>
                      </Link>
                      <div className="mt-3 text-center">
                        <p className="text-lg font-semibold text-[#5CA131]">
                          {product.hide_price ? (
                            <span className="text-gray-500 text-sm">Request Quote</span>
                          ) : (
                            `${product.currency} ${Number(product.price).toLocaleString('en-IN')}`
                          )}
                        </p>
                        <RatingDisplay rating={product.average_rating} />
                        <Button 
                          variant="default"
                          className="w-full mt-3 bg-[#5CA131] hover:bg-[#4c8728] text-white text-sm font-medium"
                          asChild
                        >
                          <Link href={productUrl}>View Details</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              // Add Product Placeholder - Updated styling
              return (
                <div
                  key={idx}
                  onClick={() => { if (displayProducts.length < MAX_COLUMNS) setShowModal(true); }}
                  className={`relative rounded-lg flex flex-col items-center justify-center p-4 min-h-[320px] ${
                    displayProducts.length < MAX_COLUMNS 
                      ? 'cursor-pointer border-2 border-dashed border-[#5CA131] hover:bg-green-50'
                      : 'cursor-not-allowed border-2 border-dashed border-gray-200'
                  }`}
                >
                  {displayProducts.length < MAX_COLUMNS ? (
                    <>
                      <Plus className="w-10 h-10 text-[#5CA131] mb-2" />
                      <span className="text-[#5CA131] font-medium text-center">Add Product</span>
                      {selectedCategory && (
                        <span className="text-gray-400 text-xs mt-1 text-center">{selectedCategory}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-10 h-10 text-gray-300 mb-2" />
                      <span className="text-gray-400 font-medium text-center">Maximum {MAX_COLUMNS} Products</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Comparison Table Section - Updated styling */}
        {products.length > 0 && (
          <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-8">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {allTableFields.map((field) => {
                        if (field.key.includes('meta_')) return null; 
                          
                        const hasRelevantData = displayProducts.some(product => {
                            const value = getProductValue(product, field.key);
                            if (Array.isArray(value)) return value.length > 0;
                            return value !== null && value !== undefined && String(value).trim() !== '' && String(value).trim().toUpperCase() !== 'N/A';
                        });
                        
                        if (!hasRelevantData) return null;

                        return (
                          <tr key={field.key} className="transition-colors hover:bg-gray-50">
                            {/* Row Label (Sticky Column) - Min-width increased for better label readability */}
                            <td 
                              className="py-4 px-4 font-semibold text-gray-800 sticky left-0 bg-gray-100 z-10 whitespace-nowrap min-w-[200px] border-r border-gray-200 text-left"
                            >
                              {field.label}
                            </td>
                            
                            {/* Product Data Cells */}
                            {Array.from({ length: MAX_COLUMNS }).map((_, idx) => {
                              const product = displayProducts[idx];
                              
                              if (!product) return <td key={idx} className="py-4 px-4 text-center text-gray-400 font-light border-x border-gray-100">N/A</td>;

                              const value = getProductValue(product, field.key);
                              
                              // Specific types
                              if (field.isCurrency) {
                                return (
                                  <td key={idx} className="py-4 px-4 text-center font-extrabold border-x border-gray-100 align-middle">
                                    {product.hide_price ? (
                                      <span className="text-gray-400 text-sm font-medium">Request Quote</span>
                                    ) : (
                                      <span className="text-green-600 text-lg">{product.currency} {Number(product.price).toLocaleString('en-IN')}</span>
                                    )}
                                  </td>
                                );
                              }
                              if (field.isRating) {
                                return (
                                  <td key={idx} className="py-4 px-4 text-center border-x border-gray-100 align-middle">
                                    <RatingDisplay rating={product.average_rating} />
                                  </td>
                                );
                              }
                              if (field.key === 'stock_quantity' || field.isBoolean) {
                                  return (
                                      <td key={idx} className="py-4 px-4 text-center border-x border-gray-100 align-middle">
                                          <StatusDisplay value={value} label={field.label} />
                                      </td>
                                  );
                              }
                              
                              // ✅ Final Structured Array Rendering
                              if (field.isStructuredArray) {
                                  return (
                                      // CRUCIAL: Use align-top for clean stacked list presentation
                                      <td key={idx} className="py-2 px-4 max-w-[300px] border-x border-gray-100 align-top">
                                          {/* Pass the potentially single-string value into the robust parser */}
                                          <ArrayDetailsDisplay data={value} />
                                      </td>
                                  );
                              }

                              // Default rendering for generic text/number product details
                              return (
                                <td
                                  key={idx}
                                  className="py-4 px-4 text-center text-gray-700 max-w-[250px] border-x border-gray-100 align-middle"
                                >
                                  <span className="block leading-tight break-words text-wrap text-sm font-normal px-1">
                                    {value !== null && value !== undefined && String(value).trim() !== "" ? String(value) : "N/A"}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - Updated styling */}
        {products.length === 0 && (
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center py-16">
              <p className="text-lg font-medium mb-4 text-gray-600">
                Select products to start comparison
              </p>
              <Button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-6 py-2 text-sm font-medium rounded-md 
                          text-white bg-[#5CA131] hover:bg-[#4c8728]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>
        )}

        {/* Modal - Updated styling */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-medium">Select Product to Compare</h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSearch("");
                    setSearchResults([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={handleSearch}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#5CA131]"
                />
                
                <div className="mt-4 max-h-[400px] overflow-y-auto">
                  {loadingSearch ? (
                    <div className="text-center py-8 text-gray-500 flex justify-center items-center">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> <span className="font-light">Searching...</span>
                    </div>
                  ) : searchResults.length === 0 && search.length > 1 ? (
                    <div className="text-gray-400 text-center py-8 font-light">
                      No approved products found matching your search term.
                    </div>
                  ) : searchResults.length === 0 && search.length <= 1 ? (
                    <div className="text-gray-400 text-center py-8 font-light">
                      Start typing to see product suggestions.
                    </div>
                  ) : (
                    searchResults.map((product) => {
                        const isInvalidCategory = selectedCategory && product.category_name !== selectedCategory;
                        
                        return (
                            <div
                                key={product.id}
                                className={`flex items-center p-3 rounded-lg border transition-colors duration-200 ${
                                    isInvalidCategory
                                        ? "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                                        : "hover:bg-green-50 border-green-200 cursor-pointer"
                            }`}
                            onClick={() => {
                                if (!isInvalidCategory) {
                                    handleAddProduct(product);
                                } else {
                                    toast.error(`Cannot add. Must be from the "${selectedCategory}" category.`);
                                }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={`Add ${product.name}`}
                        >
                            <div className="w-16 h-16 relative flex-shrink-0 border border-gray-200 rounded-md overflow-hidden mr-3 bg-white">
                                <Image
                                    src={product.images?.[0]?.image || "/images/placeholder.jpg"}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-1"
                                    sizes="64px"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-base truncate">
                                    {product.name}
                                </div>
                                <div className="text-xs text-gray-500 font-light mt-1">
                                    Category: <span className="font-normal text-gray-700">{product.category_name}</span>
                                </div>
                                <div className="text-xs text-gray-500 font-light truncate">
                                    {product.manufacturer} {product.model && `/ ${product.model}`}
                                </div>
                            </div>
                            <Plus className={`w-5 h-5 ml-2 flex-shrink-0 ${isInvalidCategory ? 'text-gray-400' : 'text-green-500'}`} />
                        </div>
                        );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal - Improved styling and positioning */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative border border-gray-200 
                          max-h-[90vh] flex flex-col animate-in fade-in duration-200">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none z-10"
              onClick={() => {
                setShowModal(false);
                setSearch("");
                setSearchResults([]);
              }}
              aria-label="Close"
              tabIndex={0}
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-bold mb-4 text-gray-900 pr-8">
              Select Product to Compare
            </h3>
            
            {selectedCategory && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 mb-4 rounded-md text-sm">
                <p>
                    <span className="font-semibold">Constraint:</span> Only products from the <span className="font-bold">"{selectedCategory}"</span> category can be added.
                </p>
              </div>
            )}
            
            <input
              type="text"
              placeholder="Search by name, model, or manufacturer..."
              value={search}
              onChange={handleSearch}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-base shadow-sm"
              aria-label="Search products"
            />
            
            <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-2 min-h-[150px] max-h-[60vh]">
              {loadingSearch ? (
                <div className="text-center py-8 text-gray-500 flex justify-center items-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> <span className="font-light">Searching...</span>
                </div>
              ) : searchResults.length === 0 && search.length > 1 ? (
                <div className="text-gray-400 text-center py-8 font-light">
                  No approved products found matching your search term.
                </div>
              ) : searchResults.length === 0 && search.length <= 1 ? (
                <div className="text-gray-400 text-center py-8 font-light">
                  Start typing to see product suggestions.
                </div>
              ) : (
                searchResults.map((product) => {
                    const isInvalidCategory = selectedCategory && product.category_name !== selectedCategory;
                    
                    return (
                        <div
                            key={product.id}
                            className={`flex items-center p-3 rounded-lg border transition-colors duration-200 ${
                                isInvalidCategory
                                    ? "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                                    : "hover:bg-green-50 border-green-200 cursor-pointer"
                            }`}
                            onClick={() => {
                                if (!isInvalidCategory) {
                                    handleAddProduct(product);
                                } else {
                                    toast.error(`Cannot add. Must be from the "${selectedCategory}" category.`);
                                }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={`Add ${product.name}`}
                        >
                            <div className="w-16 h-16 relative flex-shrink-0 border border-gray-200 rounded-md overflow-hidden mr-3 bg-white">
                                <Image
                                    src={product.images?.[0]?.image || "/images/placeholder.jpg"}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-1"
                                    sizes="64px"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-base truncate">
                                    {product.name}
                                </div>
                                <div className="text-xs text-gray-500 font-light mt-1">
                                    Category: <span className="font-normal text-gray-700">{product.category_name}</span>
                                </div>
                                <div className="text-xs text-gray-500 font-light truncate">
                                    {product.manufacturer} {product.model && `/ ${product.model}`}
                                </div>
                            </div>
                            <Plus className={`w-5 h-5 ml-2 flex-shrink-0 ${isInvalidCategory ? 'text-gray-400' : 'text-green-500'}`} />
                        </div>
                    );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ComparePage;