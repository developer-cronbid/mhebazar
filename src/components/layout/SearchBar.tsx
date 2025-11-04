// src/components/SearchBar.tsx - FULL UNIVERSAL SEARCH WITH ALL TYPES (INCLUDING PRODUCT DETAILS)
"use client";

import { Search, Mic, Tag, Package, Building2, LayoutGrid } from "lucide-react";
import { useRef, useState, useEffect, useCallback, JSX } from "react";
import { useRouter } from "next/navigation";
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

interface SearchSuggestion {
  id: string | number;
  name: string;
  type:
    | "vendor"
    | "category"
    | "subcategory"
    | "vendor_category"
    | "product"
    | "product_type";
  vendor_slug?: string;
  category_slug?: string;
  subcategory_slug?: string;
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
        const response = await api.get<SearchSuggestion[]>(
          `/search/universal/?search=${encodeURIComponent(query)}`
        );

        setSuggestions(response.data || []);
        setShowSuggestions(true);
      } catch (error) {
        setSuggestions([]);
      }
    }, DEBOUNCE_TIME),
    []
  );

  // 2. Main search effect (FUNCTIONALITY RESTORED)
  useEffect(() => {
    if (searchQuery.length < 1) {
      fetchSuggestions.cancel();
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setShowSuggestions(true);
    fetchSuggestions(searchQuery);

    return () => {
      fetchSuggestions.cancel();
    };
  }, [searchQuery, fetchSuggestions]);

  const visibleSuggestions = suggestions.slice(0, INITIAL_VISIBLE_COUNT);
  const isSearchActive = searchQuery.length >= 1;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMicClick = useCallback((): void => {
    // ... (omitted)
  }, [listening, setSearchQuery]);

  const slugify = (text: string): string => {
    let slug = (text || "").toString().toLowerCase().trim();
    slug = slug.replace(/[^a-z0-9\.\s]/g, " ");
    slug = slug.replace(/\s+/g, "-");
    slug = slug.replace(/^-+|-+$/g, "");
    slug = slug.replace(/^\.+|\.+$/g, "");
    return slug;
  };

  const handleSuggestionClick = useCallback(
    (item: SearchSuggestion) => {
      setShowSuggestions(false);
      setSearchQuery(item.name);
      // ... (redirection logic)
    },
    [router, setSearchQuery]
  );

  // Helper component to render badge
  const TagBadge = ({
    label,
    value,
    icon: Icon,
    colorClass,
  }: {
    label: string;
    value: string | undefined;
    icon: any;
    colorClass: string;
  }) => {
    if (!value) return null;
    return (
      <span
        // Mobile layout is forced to wrap and not stretch
        className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${colorClass} mb-1 mr-2 flex-shrink-0
        max-w-[48%] sm:max-w-none text-ellipsis overflow-hidden whitespace-nowrap`}
      >
        <Icon className="w-3 h-3 mr-1 opacity-70 flex-shrink-0" />
        <span className="truncate">
            {label}: <span className="ml-1 font-semibold">{value}</span>
        </span>
      </span>
    );
  };

  // Helper component to render a suggestion item
  const SuggestionItem = ({ item }: { item: SearchSuggestion }) => {
    const isProduct = item.type === "product";
    const tag = item.type.replace("_", " ");

    // CRITICAL MOBILE BG FIX: Define text color and PC background color separately
    let textColorClass;
    let badgeBgClass;

    if (item.type === "product") {
      textColorClass = "text-red-600";
      badgeBgClass = "bg-transparent sm:bg-red-50";
    } else if (item.type === "product_type") {
      textColorClass = "text-pink-600";
      badgeBgClass = "bg-transparent sm:bg-pink-50";
    } else if (item.type === "vendor_category") {
      textColorClass = "text-orange-600";
      badgeBgClass = "bg-transparent sm:bg-orange-50";
    } else if (item.type === "vendor") {
      textColorClass = "text-green-600";
      badgeBgClass = "bg-transparent sm:bg-green-50";
    } else if (item.type === "category") {
      textColorClass = "text-blue-600";
      badgeBgClass = "bg-transparent sm:bg-blue-50";
    } else if (item.type === "subcategory") {
      textColorClass = "text-purple-600";
      badgeBgClass = "bg-transparent sm:bg-purple-50";
    } else {
      textColorClass = "text-gray-600";
      badgeBgClass = "bg-transparent sm:bg-gray-50";
    }

    const primaryTagClass = `text-xs capitalize font-semibold px-2 py-1 rounded-full flex-shrink-0 ${badgeBgClass} ${textColorClass}`;

    return (
      <div
        key={item.id}
        className={`px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm transition duration-150 border-b border-gray-100 last:border-b-0 ${
          isProduct
            ? "flex-col items-start"
            : "flex-row justify-between items-start"
        }`}
        onClick={() => handleSuggestionClick(item)}
        role="option"
        aria-selected={false}
      >
        <div
          className={`flex ${
            isProduct
              ? "w-full justify-between mb-1"
              : "flex-row flex-1 min-w-0"
          }`}
        >
          <span className="font-medium text-gray-800 break-words flex-1 min-w-0 mr-3">
            {item.name}
          </span>
          {/* Item Type Tag (Vendor, Category, Product) */}
          <span className={primaryTagClass}>
            {tag}
          </span>
        </div>

        {/* DETAILS SECTION: Model, Vendor, Category for Product suggestions */}
        {isProduct && item.product_tags && (
          // MOBILE FIX: Enforce flex-wrap here to ensure tags go to new lines
          <div className="flex flex-wrap mt-1 w-full"> 
            <TagBadge
              label="Model"
              value={item.product_tags.model}
              icon={Tag}
              colorClass="bg-gray-100 text-gray-700"
            />
            <TagBadge
              label="Vendor"
              value={item.product_tags.vendor}
              icon={Building2}
              colorClass="bg-green-100 text-green-700"
            />
            <TagBadge
              label="Category"
              value={item.product_tags.category}
              icon={LayoutGrid}
              colorClass="bg-blue-100 text-blue-700"
            />
            {/* Subcategory is optional but good to include if present */}
            {item.product_tags.subcategory && (
              <TagBadge
                label="Subcategory"
                value={item.product_tags.subcategory}
                icon={Package}
                colorClass="bg-purple-100 text-purple-700"
              />
            )}
          </div>
        )}
      </div>
    );
  };

  const displayPlaceholder = isSearchActive
    ? "Refining results..."
    : "Search Products, Vendors, Categories...";

  return (
    <div className="relative w-full" ref={searchBarRef}>
      <input
        type="text"
        placeholder={displayPlaceholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() =>
          isSearchActive && suggestions.length > 0 && setShowSuggestions(true)
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" && searchQuery.trim()) {
            e.preventDefault();

            setShowSuggestions(false);

            if (visibleSuggestions.length > 0) {
              handleSuggestionClick(visibleSuggestions[0]);
            }
          }
        }}
        aria-label="Search products, vendors, and categories"
        aria-expanded={showSuggestions}
        className="w-full px-4 py-2 pl-12 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base transition-shadow h-10"
        autoComplete="off"
      />
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
      <button
        type="button"
        className={`absolute right-4 top-1/2 transform -translate-y-1/2 rounded-full p-1 transition
          ${
            listening
              ? "bg-green-100 animate-pulse shadow-lg"
              : "hover:bg-gray-100"
          }
        `}
        aria-label={listening ? "Stop voice input" : "Start voice input"}
        onClick={handleMicClick}
      >
        <Mic
          className={`w-5 h-5 ${
            listening ? "text-green-600" : "text-gray-400"
          }`}
          aria-hidden="true"
        />
        {listening && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping" role="status" aria-label="Microphone active"></span>
        )}
      </button>
      {listening && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2 bg-white border border-green-200 rounded px-2 py-1 text-xs text-green-700 shadow animate-fade-in" role="status" aria-live="polite">
          Listening...
        </div>
      )}

      {/* REPLACED FRAMER MOTION WITH CSS TRANSITION */}
      {showSuggestions && (
          <div
            className="search-suggestions-dropdown" 
            role="listbox" 
            style={{
                position: 'absolute',
                left: 0,
                right: 0,
                marginTop: '0.25rem', 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb', 
                borderRadius: '0.375rem', 
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', 
                zIndex: 50,
                maxHeight: '24rem', 
                overflowY: 'auto',
                opacity: 1,
                transform: 'translateY(0)',
                transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
            }}
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
                  role="option" 
                  aria-label={`Search all results for ${searchQuery}`}
                >
                  Search all results for **"{searchQuery}"**
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-gray-400">
                No matching results found. Try a different query.
              </div>
            )}
          </div>
      )}
      <style jsx global>{`
        /* Mobile speed fix: Hide scrollbars */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}