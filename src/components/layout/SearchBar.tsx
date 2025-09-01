// SearchBar.tsx
"use client";

import { Search, Mic } from "lucide-react";
import { useRef, useState, useEffect, useCallback, JSX } from "react";
import { useRouter } from "next/navigation";
import { Category, Subcategory } from "./Nav";
import { motion, AnimatePresence } from "framer-motion";


// Assuming you have a toast library like react-hot-toast imported globally or passed as prop
declare const toast: { error: (message: string) => void };

// TypeScript support for SpeechRecognition without 'any'
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Helper function to create slugs
const createSlug = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, "-");

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
  const [suggestions, setSuggestions] = useState<
    Array<
      (Category | Subcategory | Product) & {
        type: string;
        category_name?: string;
      }
    >
  >([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Filter suggestions based on search query and fetch from API
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchQuery.length > 0) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const combinedSuggestions: (Category | Subcategory | Product)[] = [];

        // Fetch products directly from the API endpoint
        let productsFromApi: Product[] = [];
        try {
          const response = await fetch(`${API_BASE_URL}/products/?search=${lowerCaseQuery}`);
          if (response.ok) {
            const data = await response.json();
            productsFromApi = data.results || [];
          } else {
            console.error("API request failed with status:", response.status);
          }
        } catch (error) {
          console.error("Error fetching products:", error);
        }

        // Add product types to suggestions
        TYPE_CHOICES.forEach((type) => {
          if (type.name.toLowerCase().includes(lowerCaseQuery)) {
            combinedSuggestions.push({ ...type, id: Date.now() + Math.random(), type: "product_type" });
          }
        });

        // Add categories to suggestions
        categories.forEach((category) => {
          if (category.name.toLowerCase().includes(lowerCaseQuery)) {
            combinedSuggestions.push({ ...category, type: "category" });
          }
          category.subcategories.forEach((subcategory) => {
            if (subcategory.name.toLowerCase().includes(lowerCaseQuery)) {
              combinedSuggestions.push({
                ...subcategory,
                type: "subcategory",
                category_name: category.name,
              });
            }
          });
        });

        // Add fetched products to suggestions
        productsFromApi.forEach((product) => {
          combinedSuggestions.push({ ...product, type: "product" });
        });

        const uniqueSuggestions = Array.from(
          new Map(
            combinedSuggestions.map((item) => [`${item.type}-${item.name}`, item])
          ).values()
        );

        setSuggestions(uniqueSuggestions.slice(0, 10) as Array<(Category | Subcategory | Product) & { type: string; category_name?: string }>);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // Debounce time of 300ms

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
    (item: (Category | Subcategory | Product) & { type: string; category_name?: string }) => {
      setShowSuggestions(false);
      setSearchQuery("");

      if (item.type === "category") {
        router.push(`/${createSlug(item.name)}`);
      } else if (item.type === "subcategory") {
        const subCategoryItem = item as Subcategory & { category_name: string };
        const categorySlug = createSlug(subCategoryItem.category_name);
        router.push(`/${categorySlug}/${createSlug(subCategoryItem.name)}`);
      } else if (item.type === "product_type") {
        router.push(`/${createSlug(item.name)}`);
      } else if (item.type === "product") {
        const productItem = item as Product;
        router.push(`/product/${createSlug(productItem.name)}?id=${productItem.id}`);
      }
    },
    [router, setSearchQuery]
  );

  return (
    <div className="relative w-full" ref={searchBarRef}>
      <input
        type="text"
        placeholder="Search by Products, Categories, Types..."
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
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
          >
            {suggestions.map((item, index) => (
              <div
                key={index}
                className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center transition border-b border-gray-100 last:border-b-0"
                onClick={() => handleSuggestionClick(item)}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">
                    {item.name}
                  </span>
                  {'category_name' in item && item.category_name && (
                    <span className="text-gray-500 text-xs"> (Category: {item.category_name})</span>
                  )}
                </div>
                <span className="text-xs text-green-600 capitalize font-semibold bg-green-50 px-2 py-1 rounded-full">
                  {item.type.replace('_', ' ')}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}