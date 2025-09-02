// SearchBar.tsx
"use client";

import { Search, Mic } from "lucide-react";
import { useRef, useState, useEffect, useCallback, JSX } from "react";
import { useRouter } from "next/navigation";
import { Category, Subcategory } from "./Nav";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";

declare const toast: { error: (message: string) => void };

// TypeScript support for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}
type SpeechRecognition = any;
type SpeechRecognitionEvent = any;

type SearchBarProps = {
  categories: Category[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
};

// Define Product interface based on API response
interface Product {
  id: number;
  name: string;
  category_name: string;
  subcategory_name: string;
}

// Define Vendor interface based on API response
interface Vendor {
  id: number;
  username: string;
  full_name: string;
  company_name: string;
  brand?: string;
}

interface ApiResponse<T> {
  results: T[];
}

// Helper function to create slugs
const createSlug = (name: string): string =>
  name?.toLowerCase().replace(/\s+/g, "-");

const TYPE_CHOICES = [
  { name: "New", slug: "new" },
  { name: "Used", slug: "used" },
  { name: "Rental", slug: "rental" },
  { name: "Attachments", slug: "attachments" },
];

export default function SearchBar({
  categories,
  searchQuery,
  setSearchQuery,
}: SearchBarProps): JSX.Element {
  const [listening, setListening] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Optimized search logic: Fetch from all relevant endpoints and sort
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchQuery.length > 0) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        
        let vendorSuggestions: any[] = [];
        let productSuggestions: any[] = [];
        let categorySuggestions: any[] = [];
        let subcategorySuggestions: any[] = [];
        let productTypeSuggestions: any[] = [];

        try {
          // Parallel API Calls for Products and Vendors with search queries
          const [productsResponse, vendorsResponse] = await Promise.all([
            api.get<ApiResponse<Product>>(`/products/?search=${lowerCaseQuery}`),
            api.get<ApiResponse<Vendor>>(`/vendor/?search=${lowerCaseQuery}`),
          ]);
          
          // Filter results client-side to ensure exact matches and populate respective lists
          productsResponse.data?.results.forEach(product => {
            if (product.name.toLowerCase().includes(lowerCaseQuery)) {
              productSuggestions.push({ ...product, type: "product" });
            }
          });

          vendorsResponse.data?.results.forEach(vendor => {
            const vendorName = vendor.brand || vendor.company_name || vendor.full_name || vendor.username;
            if (vendorName?.toLowerCase().includes(lowerCaseQuery)) {
              vendorSuggestions.push({
                id: vendor.id,
                name: vendorName,
                type: "vendor",
                slug: vendor.brand
              });
            }
          });

          // Add matching categories and subcategories to suggestions
          categories.forEach((category) => {
            if (category.name.toLowerCase().includes(lowerCaseQuery)) {
              categorySuggestions.push({ ...category, type: "category" });
            }
            category.subcategories.forEach((subcategory) => {
              if (subcategory.name.toLowerCase().includes(lowerCaseQuery)) {
                subcategorySuggestions.push({
                  ...subcategory,
                  type: "subcategory",
                  category_name: category.name,
                });
              }
            });
          });

          // Add product types to suggestions
          TYPE_CHOICES.forEach((type) => {
            if (type.name.toLowerCase().includes(lowerCaseQuery)) {
              productTypeSuggestions.push({ ...type, type: "product_type" });
            }
          });

        } catch (error) {
          console.error("Error fetching search results:", error);
        }

        // Combine all suggestions in the desired order of priority
        const combinedSuggestions = [
          ...vendorSuggestions,
          ...productTypeSuggestions,
          ...categorySuggestions,
          ...subcategorySuggestions,
          ...productSuggestions,

        ];

        // Remove duplicates based on ID and type
        const uniqueSuggestions = combinedSuggestions.filter((item, index, self) =>
          index === self.findIndex((t) => (
            t.id === item.id && t.type === item.type
          ))
        );

        setSuggestions(uniqueSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // Debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, categories]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Start/stop voice recognition
  const handleMicClick = useCallback((): void => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      if (typeof toast !== 'undefined' && toast.error) {
        toast.error("Voice search is not supported in this browser.");
      } else {
        console.error("Voice search is not supported in this browser.");
      }
      return;
    }

    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "en-IN";
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent): void => {
        const transcript: string = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setListening(false);
        setShowSuggestions(true);
      };

      recognitionRef.current.onerror = (): void => {
        setListening(false);
      };

      recognitionRef.current.onend = (): void => {
        setListening(false);
      };
    }

    if (!listening) {
      setListening(true);
      recognitionRef.current.start();
    } else {
      setListening(false);
      recognitionRef.current.stop();
    }
  }, [listening, setSearchQuery]);

  const handleSuggestionClick = useCallback(
    (item: any) => {
      setShowSuggestions(false);
      setSearchQuery("");

      if (item.type === "vendor") {
        router.push(`/vendor-listing/${item.slug}`);
      } else if (item.type === "category") {
        router.push(`/${createSlug(item.name)}`);
      } else if (item.type === "subcategory") {
        const categorySlug = createSlug(item.category_name);
        router.push(`/${categorySlug}/${createSlug(item.name)}`);
      } else if (item.type === "product_type") {
        router.push(`/products?type=${item.slug}`);
      } else if (item.type === "product") {
        router.push(`/product/${createSlug(item.name)}?id=${item.id}`);
      }
    },
    [router, setSearchQuery]
  );
  
  return (
    <div className="relative w-full" ref={searchBarRef}>
      <input
        type="text"
        placeholder="Search by Products, Categories, Vendors..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
        className="w-full px-4 py-2 pl-12 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base transition-shadow h-10"
        autoComplete="off"
      />
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <button
        type="button"
        className={`absolute right-4 top-1/2 transform -translate-y-1/2 rounded-full p-1 transition
          ${listening ? "bg-green-100 animate-pulse shadow-lg" : "hover:bg-gray-100"}
        `}
        aria-label={listening ? "Stop voice input" : "Start voice input"}
        onClick={handleMicClick}
      >
        <Mic className={`w-5 h-5 ${listening ? "text-green-600" : "text-gray-400"}`} />
        {listening && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
        )}
      </button>
      {listening && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2 bg-white border border-green-200 rounded px-2 py-1 text-xs text-green-700 shadow animate-fade-in">
          Listening...
        </div>
      )}

      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto no-scrollbar"
          >
            {suggestions.length > 0 ? (
              suggestions.map((item, index) => (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center transition border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSuggestionClick(item)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800">
                      {item.name}
                    </span>
                    {item.type === 'subcategory' && item.category_name && (
                      <span className="text-gray-500 text-xs"> (Category: {item.category_name})</span>
                    )}
                  </div>
                  <span className="text-xs text-green-600 capitalize font-semibold bg-green-50 px-2 py-1 rounded-full">
                    {item.type.replace('_', ' ')}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No results found. Try a different search.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </div>
  );
}