// src/components/SearchBar.tsx - FINAL STABLE CODE
"use client";

import { Search, Mic } from "lucide-react";
import { useRef, useState, useEffect, useCallback, JSX, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api"; 
// You MUST ensure you have a debounce utility available (e.g., install lodash or define one)
import { debounce } from "lodash"; 

declare const toast: { error: (message: string) => void };

type SpeechRecognition = any;
type SpeechRecognitionEvent = any;

type SearchBarProps = {
  categories?: any[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
};

interface SearchSuggestion {
  id: string | number; 
  name: string;
  // Included 'vendor_product' type for hierarchy
  type: 'vendor' | 'vendor_category' | 'vendor_product' | 'product' | 'category' | 'subcategory' | 'product_type';
  category_slug?: string;
  subcategory_slug?: string; 
  vendor_slug?: string;
  product_id?: number;
  user_id?: number;
  model?: string;
  product_tags?: {
    vendor: string;
    category: string;
    subcategory: string;
  };
}

const createSlug = (name: string): string =>
  name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "";

const INITIAL_VISIBLE_COUNT = 20;
const LOAD_MORE_STEP = 30;
const DEBOUNCE_TIME = 300; // FIX: Stable debounce time (used to be 100)

export default function SearchBar({
  searchQuery,
  setSearchQuery,
}: SearchBarProps): JSX.Element {
  const [listening, setListening] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_COUNT);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [searchQuery]);
  
  // 1. Stable debounce function
  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      
      try {
        const response = await api.get<SearchSuggestion[]>(
          `/search/universal/?search=${encodeURIComponent(query)}`
        );

        const newSuggestions: SearchSuggestion[] = response.data || [];
        
        const uniqueSuggestionsMap = new Map<string, SearchSuggestion>();
        newSuggestions.filter(item => !!item.name).forEach(item => {
            uniqueSuggestionsMap.set(`${item.type}_${String(item.id)}`, item); 
        });
        
        const filteredSuggestions = Array.from(uniqueSuggestionsMap.values());
        
        setSuggestions(filteredSuggestions);
        setShowSuggestions(query.length > 0); 

      } catch (error) {
        setSuggestions([]);
        setShowSuggestions(query.length > 0); 
      }
    }, DEBOUNCE_TIME), 
    [] // Stable function
  );

  // 2. Main search effect now calls the stable debounced function
  useEffect(() => {
    if (searchQuery.length < 1) { 
        fetchSuggestions.cancel();
        setSuggestions([]);
        setShowSuggestions(false);
        return;
    }
    
    fetchSuggestions(searchQuery);

    return () => {
        fetchSuggestions.cancel();
    };
  }, [searchQuery, fetchSuggestions]);


  const visibleSuggestions = useMemo(() => {
    return suggestions.slice(0, visibleCount);
  }, [suggestions, visibleCount]);

  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => prev + LOAD_MORE_STEP);
  }, []);

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

  const handleMicClick = useCallback((): void => {
    // ... (Voice search logic remains the same) ...
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      if (typeof toast !== 'undefined' && toast.error) {
        toast.error("Voice search is not supported in this browser.");
      }
      return;
    }

    if (!recognitionRef.current) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

      recognitionRef.current.onerror = (): void => { setListening(false); };
      recognitionRef.current.onend = (): void => { setListening(false); };
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
    (item: SearchSuggestion) => {
      setShowSuggestions(false);
      // FIX: Set the search query to the item name (do NOT clear it)
      setSearchQuery(item.name); 

      if (item.type === "vendor" && item.vendor_slug) {
        router.push(`/vendor-listing/${item.vendor_slug}`);
      } else if (item.type === "vendor_category" && item.vendor_slug && item.category_slug) {
        router.push(`/vendor-listing/${item.vendor_slug}?page=1&category=${item.category_slug}`);
      } else if (item.type === "category" && item.category_slug) {
        router.push(`/${item.category_slug}`);
      } 
      else if (item.type === "subcategory" && item.category_slug && item.subcategory_slug) {
        router.push(`/${item.category_slug}/${item.subcategory_slug}`); 
      } 
      else if (item.type === "product_type" && item.category_slug) {
        router.push(`/${item.category_slug}`);
      } 
      // FIX: Handle both 'product' and the new 'vendor_product' type
      else if ((item.type === "product" || item.type === "vendor_product") && item.name && item.product_id) {
        router.push(`/product/${createSlug(item.name)}-${item.product_id}`);
      }
    },
    [router, setSearchQuery]
  );

  const hasMore = visibleCount < suggestions.length;
  const isSearchActive = searchQuery.length >= 1; 

  return (
    <div className="relative w-full" ref={searchBarRef}>
      <input
        type="text"
        placeholder="Search by Products, Categories, Vendors..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        // FIX: Re-open on focus only if there are results
        onFocus={() => isSearchActive && suggestions.length > 0 && setShowSuggestions(true)}
        onKeyDown={(e) => {
             if (e.key === 'Enter' && searchQuery.trim()) {
                router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                setShowSuggestions(false);
             }
          }}
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
            className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto no-scrollbar"
          >
            {suggestions.length > 0 ? (
              <>
                {visibleSuggestions.map((item) => (
                  <div
                    key={item.id} 
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-start transition border-b border-gray-100 last:border-b-0"
                    onClick={() => handleSuggestionClick(item)}
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium text-gray-800 break-words">
                        {item.name}
                        {/* Show model for product/vendor_product types */}
                        {(item.type === 'product' || item.type === 'vendor_product') && item.model && (
                            <span className="text-gray-500 text-xs ml-2">({item.model})</span>
                        )}
                      </span>
                      
                      {/* Show product tags for product/vendor_product types */}
                      {(item.type === 'product' || item.type === 'vendor_product') && item.product_tags && (
                          <div className="flex flex-wrap gap-1 mt-1">
                              {item.product_tags.vendor && (
                                <span className="text-xs text-gray-600 bg-gray-100 px-1 py-0.5 rounded-full whitespace-nowrap">
                                    Vendor: {item.product_tags.vendor}
                                </span>
                              )}
                              {item.product_tags.category && (
                                <span className="text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded-full whitespace-nowrap">
                                    Cat: {item.product_tags.category}
                                </span>
                              )}
                              {item.product_tags.subcategory && (
                                <span className="text-xs text-purple-600 bg-purple-50 px-1 py-0.5 rounded-full whitespace-nowrap">
                                    Subcat: {item.product_tags.subcategory}
                                </span>
                              )}
                          </div>
                      )}

                    </div>
                    
                    {/* Item Type Tag */}
                    <span className="text-xs text-green-600 capitalize font-semibold bg-green-50 px-2 py-1 rounded-full ml-3 flex-shrink-0">
                      {item.type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
                
                {hasMore && (
                  <div 
                    className="p-3 text-center text-sm font-medium text-blue-600 cursor-pointer hover:bg-blue-50 transition"
                    onClick={handleLoadMore}
                  >
                    Load More ({suggestions.length - visibleCount} remaining)
                  </div>
                )}
                
                 <div 
                    className="p-3 text-center text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-50 transition border-t"
                    onClick={() => {
                        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                        setShowSuggestions(false);
                    }}
                  >
                    Search all results for **"{searchQuery}"**
                  </div>
              </>
            ) : (
                <div className="p-4 text-center text-gray-400">
                    No perfect matches found. Try refining your search.
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