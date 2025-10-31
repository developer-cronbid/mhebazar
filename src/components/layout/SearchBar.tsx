// src/components/SearchBar.tsx - FULL UNIVERSAL SEARCH WITH ALL TYPES (INCLUDING PRODUCT DETAILS)
"use client";

import { Search, Mic, Tag, Package, Building2, LayoutGrid } from "lucide-react";
import { useRef, useState, useEffect, useCallback, JSX } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api"; 
import { debounce } from "lodash"; 

declare const toast: { error: (message: string) => void };

type SpeechRecognition = any;
type SpeechRecognitionEvent = any;

type SearchBarProps = {
  categories?: any[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
};

// Interface updated to include 'product' and 'product_type' and their specific fields
interface SearchSuggestion {
  id: string | number; 
  name: string;
  type: 'vendor' | 'category' | 'subcategory' | 'vendor_category' | 'product' | 'product_type'; 
  vendor_slug?: string;
  category_slug?: string; 
  subcategory_slug?: string;
  
  // Product specific fields (passed from backend)
  url?: string; 
  product_id?: string | number;
  product_tags?: {
    model?: string;
    vendor?: string;
    category?: string;
    subcategory?: string;
  };
}

// Minimal Constants
const INITIAL_VISIBLE_COUNT = 20;
const DEBOUNCE_TIME = 300; 


export default function SearchBar({
  searchQuery,
  setSearchQuery,
}: SearchBarProps): JSX.Element {
  const [listening, setListening] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 1. Stable debounce function
  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      
      try {
        // Updated API call reflects the Universal Search endpoint
        const response = await api.get<SearchSuggestion[]>(
          `/search/universal/?search=${encodeURIComponent(query)}`
        );

        setSuggestions(response.data || []);
        setShowSuggestions(query.length > 0); 

      } catch (error) {
        // Assuming 'toast' is available globally
        // toast.error("Failed to fetch search suggestions.");
        setSuggestions([]);
        setShowSuggestions(query.length > 0); 
      }
    }, DEBOUNCE_TIME), 
    [] // Stable function
  );

  // 2. Main search effect 
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


  const visibleSuggestions = suggestions.slice(0, INITIAL_VISIBLE_COUNT); 
  const isSearchActive = searchQuery.length >= 1; 
  
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

  // Voice logic remains the same
  const handleMicClick = useCallback((): void => {
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

  // Add the slugify function (same as in product pages)
  const slugify = (text: string): string => {
    let slug = (text || '')
      .toString()
      .toLowerCase()
      .trim();

    slug = slug.replace(/[^a-z0-9\.\s]/g, ' ');
    slug = slug.replace(/\s+/g, '-');
    slug = slug.replace(/^-+|-+$/g, '');
    slug = slug.replace(/^\.+|\.+$/g, '');

    return slug;
  };

  // *** REDIRECTION LOGIC (UPDATED FOR ALL SIX TYPES) ***
  const handleSuggestionClick = useCallback(
    (item: SearchSuggestion) => {
      setShowSuggestions(false);
      setSearchQuery(item.name); 

      // For products, generate the proper slug
      if (item.type === "product" && item.product_id) {
        // Generate slug using the same pattern as product pages
        const titleForSlug = `${item.product_tags?.vendor || ''} ${item.name} ${item.product_tags?.model || ''}`.trim();
        const productSlug = slugify(titleForSlug);
        router.push(`/product/${productSlug}-${item.product_id}`);
        return;
      } 
      // 2. Product Type (Specific URL provided by backend, or base slug)
      else if (item.type === "product_type" && item.url) {
        router.push(`/${item.category_slug}`); // e.g., /search?type=new
      }
      // 3. Vendor-Category (Vendor Page, filtered by Category)
      else if (item.type === "vendor_category" && item.vendor_slug && item.category_slug) {
        router.push(`/vendor-listing/${item.vendor_slug}?category=${item.category_slug}`);
      } 
      // 4. Vendor (Generic Vendor Listing)
      else if (item.type === "vendor" && item.vendor_slug) {
        router.push(`/vendor-listing/${item.vendor_slug}`);
      } 
      // 5. Category (Redirects directly to /category-slug)
      else if (item.type === "category" && item.category_slug) {
        router.push(`/${item.category_slug}`); 
      } 
      // 6. Subcategory (Redirects directly to /category-slug/sub-cat-slug)
      else if (item.type === "subcategory" && item.category_slug && item.subcategory_slug) {
        router.push(`/${item.category_slug}/${item.subcategory_slug}`);
      } 
      // Fallback to general search
      else {
        router.push(`/search?q=${encodeURIComponent(item.name)}`);
      }
    },
    [router, setSearchQuery]
  );
  
  // Helper component to render badge
  const TagBadge = ({ label, value, icon: Icon, colorClass }: { label: string, value: string | undefined, icon: any, colorClass: string }) => {
    if (!value) return null;
    return (
      <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${colorClass} mr-2 mb-1`}>
        <Icon className="w-3 h-3 mr-1 opacity-70" />
        {label}: <span className="ml-1 font-semibold">{value}</span>
      </span>
    );
  };
  
  // Helper component to render a suggestion item
  const SuggestionItem = ({ item }: { item: SearchSuggestion }) => {
    const isProduct = item.type === 'product';
    const tag = item.type.replace('_', ' ');

    let badgeClass = 'bg-purple-50 text-purple-600';
    if (item.type === 'product') badgeClass = 'bg-red-50 text-red-600';
    else if (item.type === 'product_type') badgeClass = 'bg-pink-50 text-pink-600';
    else if (item.type === 'vendor_category') badgeClass = 'bg-orange-50 text-orange-600';
    else if (item.type === 'vendor') badgeClass = 'bg-green-50 text-green-600';
    else if (item.type === 'category') badgeClass = 'bg-blue-50 text-blue-600';

    return (
      <div
        key={item.id} 
        className={`px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm transition border-b border-gray-100 last:border-b-0 ${isProduct ? 'flex-col items-start' : 'flex-row justify-between items-start'}`}
        onClick={() => handleSuggestionClick(item)}
      >
        <div className={`flex ${isProduct ? 'w-full justify-between mb-1' : 'flex-row flex-1 min-w-0'}`}>
            <span className="font-medium text-gray-800 break-words flex-1 min-w-0 mr-3">
              {item.name}
            </span>
            {/* Item Type Tag */}
            <span className={`text-xs capitalize font-semibold px-2 py-1 rounded-full flex-shrink-0 ${badgeClass}`}>
              {tag} 
            </span>
        </div>

        {/* DETAILS SECTION: Model, Vendor, Category for Product suggestions */}
        {isProduct && item.product_tags && (
          <div className="flex flex-wrap mt-1">
            <TagBadge label="Model" value={item.product_tags.model} icon={Tag} colorClass="bg-gray-100 text-gray-700" />
            <TagBadge label="Vendor" value={item.product_tags.vendor} icon={Building2} colorClass="bg-green-100 text-green-700" />
            <TagBadge label="Category" value={item.product_tags.category} icon={LayoutGrid} colorClass="bg-blue-100 text-blue-700" />
            {/* Subcategory is optional but good to include if present */}
            {item.product_tags.subcategory && (
                <TagBadge label="Subcategory" value={item.product_tags.subcategory} icon={Package} colorClass="bg-purple-100 text-purple-700" />
            )}
          </div>
        )}
      </div>
    );
  };

  const displayPlaceholder = isSearchActive ? "Refining results..." : "Search Products, Vendors, Categories...";


  return (
    <div className="relative w-full" ref={searchBarRef}>
      <input
        type="text"
        placeholder={displayPlaceholder} 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => isSearchActive && suggestions.length > 0 && setShowSuggestions(true)}
        onKeyDown={(e) => {
             if (e.key === 'Enter' && searchQuery.trim()) {
                // Main search still redirects to the general search page
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
                    <SuggestionItem key={item.id} item={item} />
                ))}
                
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
                    No matching results found. Try a different query.
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