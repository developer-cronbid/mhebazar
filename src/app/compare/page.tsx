// src/app/compare/page.tsx
"use client";
import React, { useState, ChangeEvent, useEffect, useCallback } from "react";
import Breadcrumb from "@/components/elements/Breadcrumb";
import { ProductCardContainer } from "@/components/elements/Product";
import { Plus, X } from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";
import { toast } from "sonner";

// Define the Product type based on the API response structure
type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  direct_sale: boolean;
  is_active: boolean;
  hide_price: boolean;
  stock_quantity: number;
  images: { id: number; image: string }[];
  category_name: string;
  subcategory_name: string | null;
  manufacturer: string;
  model: string;
  average_rating: number | null;
  type: string;
  product_details: Record<string, string | number | null>; // Added dynamic product_details
};

// Define a type for the product data as stored in local storage for comparison
type CompareProduct = {
  id: number;
  image: string;
  title: string;
  subtitle: string | null | undefined;
  price: string | number;
  currency: string;
  directSale: boolean;
  is_active: boolean;
  hide_price: boolean;
  stock_quantity: number;
  category_name: string;
  manufacturer: string;
  model: string;
  ratings: number; // Mapped from average_rating
  ratingsCount: number; // Placeholder, not in API
  soldBy: string; // Placeholder
  brand: string; // Mapped from manufacturer
  type: string;
  product_details: Record<string, string | number | null>; // Added dynamic product_details
};

// Static table fields for common product attributes
const staticTableFields = [
  { label: "Price", key: "price", isCurrency: true },
  { label: "Customer Ratings", key: "ratings", isRating: true },
  { label: "Sold by", key: "soldBy" },
  { label: "Brand", key: "brand" },
  { label: "Category", key: "category_name" },
  { label: "Subcategory", key: "subcategory_name" },
  { label: "Manufacturer", key: "manufacturer" },
  { label: "Model", key: "model" },
];

const maxColumns = 4;
const COMPARE_KEY = 'mhe_compare_products';

const ComparePage = () => {
  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dynamicProductDetailsKeys, setDynamicProductDetailsKeys] = useState<string[]>([]);

  // Function to collect unique product_details keys from all products in comparison
  const collectDynamicProductDetailsKeys = useCallback((currentProducts: CompareProduct[]) => {
    const uniqueKeys = new Set<string>();
    currentProducts.forEach(product => {
      if (product.product_details) {
        Object.keys(product.product_details).forEach(key => uniqueKeys.add(key));
      }
    });
    // Sort keys alphabetically for consistent display
    setDynamicProductDetailsKeys(Array.from(uniqueKeys).sort());
  }, []);

  // Load products from local storage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedProducts: CompareProduct[] = JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]');
        if (storedProducts.length > 0) {
          setProducts(storedProducts);
          setSelectedCategory(storedProducts[0].category_name);
          collectDynamicProductDetailsKeys(storedProducts);
        }
      } catch (error) {
        console.error("Failed to parse products from local storage:", error);
        localStorage.removeItem(COMPARE_KEY); // Clear invalid data
        setProducts([]);
        setSelectedCategory(null);
      }
    }
  }, [collectDynamicProductDetailsKeys]);

  // Update dynamic keys whenever 'products' state changes
  useEffect(() => {
    collectDynamicProductDetailsKeys(products);
  }, [products, collectDynamicProductDetailsKeys]);


  // Handle adding a product from the modal to the comparison list
  const handleAddProduct = (product: Product) => {
    if (products.some((p) => p.id === product.id)) {
      toast.info("This product is already in your comparison list.");
      return;
    }

    if (selectedCategory && product.category_name !== selectedCategory) {
      toast.error(`Only products from the "${selectedCategory}" category can be compared together.`);
      return;
    }

    const newCompareProduct: CompareProduct = {
      id: product.id,
      image: product.images[0]?.image || "/images/placeholder.jpg",
      title: product.name,
      subtitle: product.subcategory_name || product.description || '', // Ensure string fallback
      price: product.price,
      currency: "₹",
      directSale: product.direct_sale,
      is_active: product.is_active,
      hide_price: product.hide_price,
      stock_quantity: product.stock_quantity,
      category_name: product.category_name,
      manufacturer: product.manufacturer,
      model: product.model,
      ratings: product.average_rating || 0,
      ratingsCount: 0, // Placeholder
      soldBy: "N/A", // Placeholder
      brand: product.manufacturer,
      type: product.type,
      product_details: product.product_details || {}, // Ensure product_details is an object
    };

    const updatedProducts = [...products, newCompareProduct];
    setProducts(updatedProducts);
    localStorage.setItem(COMPARE_KEY, JSON.stringify(updatedProducts));
    setSelectedCategory(newCompareProduct.category_name);
    setShowModal(false);
    setSearch("");
    setSearchResults([]);
    toast.success(`${product.name} added to comparison!`);
  };

  // Handle removing a product from the comparison list
  const handleRemoveProduct = (id: number) => {
    const updatedProducts = products.filter((product) => product.id !== id);
    setProducts(updatedProducts);
    localStorage.setItem(COMPARE_KEY, JSON.stringify(updatedProducts));
    if (updatedProducts.length === 0) {
      setSelectedCategory(null); // Reset category if no products are left
    }
    toast.info("Product removed from comparison.");
  };

  // Handle search input change and fetch results from API
  const handleSearch = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setSearch(searchTerm);

    if (searchTerm.length < 2) { // Only search if at least 2 characters
      setSearchResults([]);
      setLoadingSearch(false);
      return;
    }

    setLoadingSearch(true);
    try {
      const response = await api.get<{ results: Product[] }>(`/products/`, {
        params: {
          search: searchTerm,
          // Only filter by category if a category is already selected in comparison
          category_name: selectedCategory || undefined,
          is_active: true, // Only search for active products
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

  const displayProducts = products.slice(0, maxColumns);

  // Combine static and dynamic table fields
  const allTableFields = [
    ...staticTableFields,
    ...dynamicProductDetailsKeys.map(key => ({ label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), key: `product_details.${key}` }))
  ];

  return (
    <>
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Compare", href: "/compare" },
          ]}
        />
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 mt-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Compare Products</h2>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 mb-10 overflow-x-auto">
        <div className="flex flex-nowrap gap-3 sm:gap-4 lg:gap-6 pb-2 justify-start min-w-max">
          {displayProducts.map((product) => (
            <div key={product.id} className="flex-shrink-0 relative w-64 sm:w-72 lg:w-80">
              <ProductCardContainer
                id={product.id}
                image={product.image}
                title={product.title}
                subtitle={product.subtitle}
                price={product.price}
                currency={product.currency}
                directSale={product.directSale}
                is_active={product.is_active}
                hide_price={product.hide_price}
                stock_quantity={product.stock_quantity}
                type={product.type}
              />
              <button
                onClick={() => handleRemoveProduct(product.id)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors z-10"
                aria-label={`Remove ${product.title} from comparison`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {displayProducts.length < maxColumns && (
            <div
              onClick={() => setShowModal(true)}
              className="flex-shrink-0 w-64 sm:w-72 lg:w-80 h-80 sm:h-96 bg-white border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-all duration-200 p-4"
              tabIndex={0}
              role="button"
              aria-label="Add Product to Compare"
            >
              <Plus className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-green-500 mb-3" />
              <span className="text-green-600 font-semibold text-base sm:text-lg text-center">Add Product</span>
              {selectedCategory && (
                <span className="text-gray-500 text-xs sm:text-sm mt-1 text-center px-2">(Only &quot;{selectedCategory}&quot; products)</span>
              )}
            </div>
          )}
        </div>
      </div>

      {products.length > 0 && (
        <div className="w-full px-4 sm:px-6 lg:px-8 mb-10">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs sm:text-sm divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 sm:py-4 px-2 sm:px-4 text-left font-semibold text-gray-700 w-32 sm:w-44 rounded-tl-xl sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                      {/* Empty for row labels */}
                    </th>
                    {Array.from({ length: maxColumns }).map((_, idx) => (
                      <th
                        key={idx}
                        className={`py-3 sm:py-4 px-2 sm:px-4 text-center font-semibold text-gray-700 min-w-[200px] sm:min-w-[240px] lg:min-w-[280px] ${idx === maxColumns - 1 ? "rounded-tr-xl" : ""
                          }`}
                      >
                        {displayProducts[idx]?.title ? (
                          <span className="block text-gray-900 font-semibold text-xs sm:text-sm lg:text-base px-1 sm:px-2 leading-tight truncate">
                            {displayProducts[idx].title}
                          </span>
                        ) : (
                          <span className="text-gray-400">---</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allTableFields.map((field) => ( // Use allTableFields here
                    <tr key={field.key} className="border-t last:border-b">
                      <td className="py-3 sm:py-4 px-2 sm:px-4 font-medium text-gray-700 sticky left-0 bg-gray-50 z-10 whitespace-nowrap text-xs sm:text-sm border-r border-gray-200">
                        <span className="block leading-tight">{field.label}</span>
                      </td>
                      {Array.from({ length: maxColumns }).map((_, idx) => {
                        const product = displayProducts[idx];
                        if (!product)
                          return (
                            <td
                              key={idx}
                              className="py-3 sm:py-4 px-2 sm:px-4 text-center text-gray-400"
                            >
                              ----
                            </td>
                          );

                        let value: unknown;
                        if (field.key.startsWith('product_details.')) {
                          const detailKey = field.key.split('.')[1];
                          value = product.product_details?.[detailKey];
                        } else {
                          value = product[field.key as keyof CompareProduct];
                        }

                        if (field.isCurrency)
                          return (
                            <td
                              key={idx}
                              className="py-3 sm:py-4 px-2 sm:px-4 text-center font-semibold text-green-600"
                            >
                              <span className="block leading-tight text-xs sm:text-sm">
                                {product.hide_price ? (
                                  <>
                                    {product.currency} *******
                                  </>
                                ) : (
                                  <>
                                    {product.currency} {typeof product.price === "number" ? product.price.toLocaleString("en-IN") : product.price}
                                  </>
                                )}
                              </span>
                            </td>
                          );
                        if (field.isRating)
                          return (
                            <td key={idx} className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                              <span className="inline-flex flex-col sm:flex-row items-center gap-1">
                                <span className="text-xs sm:text-sm">
                                  {product.ratings > 0 ? product.ratings.toFixed(1) : 'N/A'}
                                </span>
                                {product.ratings > 0 && (
                                  <span className="text-yellow-400 flex">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <svg
                                        key={i}
                                        className={`inline w-3 h-3 sm:w-4 sm:h-4 ${i < Math.round(product.ratings)
                                            ? "fill-yellow-400"
                                            : "fill-gray-200"
                                          }`}
                                        viewBox="0 0 20 20"
                                      >
                                        <polygon points="9.9,1.1 12.3,6.7 18.4,7.5 13.7,11.8 15,17.8 9.9,14.7 4.8,17.8 6.1,11.8 1.4,7.5 7.5,6.7" />
                                      </svg>
                                    ))}
                                  </span>
                                )}
                                {product.ratingsCount > 0 && (
                                  <span className="text-gray-500 text-xs">
                                    ({product.ratingsCount})
                                  </span>
                                )}
                              </span>
                            </td>
                          );
                        return (
                          <td
                            key={idx}
                            className="py-3 sm:py-4 px-2 sm:px-4 text-center text-gray-700"
                          >
                            <span className="block leading-tight text-xs sm:text-sm break-words">
                              {value ? String(value) : "----"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {products.length === 0 && (
        <div className="text-center text-gray-500 py-10 px-4">
          <p className="text-base sm:text-lg mb-4">No products selected for comparison yet.</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md shadow-sm text-white bg-[#5CA131] hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            Add First Product
          </button>
        </div>
      )}

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs sm:max-w-md lg:max-w-lg p-4 sm:p-6 relative border border-gray-200 transform scale-100 opacity-100 animate-fade-in-up max-h-[90vh] flex flex-col">
            <button
              className="absolute top-2 sm:top-3 right-2 sm:right-3 text-gray-400 hover:text-gray-700 text-2xl sm:text-3xl focus:outline-none z-10"
              onClick={() => {
                setShowModal(false);
                setSearch("");
                setSearchResults([]);
              }}
              aria-label="Close"
              tabIndex={0}
            >
              &times;
            </button>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 text-gray-900 text-center pr-8">
              Add Product to Compare
            </h3>
            {selectedCategory && (
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 text-center px-2">
                Only products from the &quot;<span className="font-semibold">{selectedCategory}</span>&quot; category can be added.
              </p>
            )}
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={handleSearch}
              className="w-full border border-gray-300 rounded-md px-3 sm:px-4 py-2 mb-3 sm:mb-4 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
              aria-label="Search products"
            />
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-1 sm:pr-2 min-h-0">
              {loadingSearch ? (
                <div className="text-center py-8 text-gray-500 text-sm sm:text-base">Loading products...</div>
              ) : searchResults.length === 0 && search.length > 1 ? (
                <div className="text-gray-400 text-center py-8 text-sm sm:text-base">
                  No products found matching your search.
                </div>
              ) : searchResults.length === 0 && search.length <= 1 ? (
                <div className="text-gray-400 text-center py-8 text-sm sm:text-base">
                  Start typing to search for products.
                </div>
              ) : (
                searchResults.map((product) => (
                  <div
                    key={product.id}
                    className={`flex items-center gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 rounded-lg cursor-pointer transition-colors duration-200 my-2
                      ${product.category_name !== selectedCategory && selectedCategory !== null
                        ? "bg-gray-100 opacity-60 cursor-not-allowed"
                        : "hover:bg-green-50"
                      }`}
                    onClick={() => {
                      if (product.category_name === selectedCategory || selectedCategory === null) {
                        handleAddProduct(product);
                      } else {
                        toast.error(`This product is from a different category (${product.category_name}).`);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Add ${product.name}`}
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 relative flex-shrink-0 border border-gray-200 rounded-md overflow-hidden">
                      <Image
                        src={product.images[0]?.image || "/images/placeholder.jpg"}
                        alt={product.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 48px, (max-width: 1024px) 56px, 64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {product.name}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate">
                        {product.subcategory_name || product.description || 'N/A'}
                      </div>
                      {product.category_name && (
                        <div className="text-xs text-gray-400 mt-1 truncate">Category: {product.category_name}</div>
                      )}
                    </div>
                    <span className="text-green-600 font-semibold flex-shrink-0 text-xs sm:text-sm lg:text-base">
                      {product.hide_price ? "₹ *******" : `₹ ${product.price}`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ComparePage;