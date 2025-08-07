// SearchBar.tsx
"use client";

import { Search, Mic } from "lucide-react";
import { useRef, useState, useEffect, useCallback, JSX } from "react";
import { useRouter } from "next/navigation";
import { Category, Subcategory } from "./Nav";
// Assuming you have a toast library like react-hot-toast imported globally or passed as prop
// For this example, I'll add a simple console.error for toast.error calls if not available.
declare const toast: { error: (message: string) => void };

// TypeScript support for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
type SpeechRecognition = any;
type SpeechRecognitionEvent = any;

type SearchBarProps = {
  categories: Category[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
};

// Helper function to create slugs
const createSlug = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, "-");

export default function SearchBar({
  categories,
  searchQuery,
  setSearchQuery,
}: SearchBarProps): JSX.Element {
  const [listening, setListening] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<
    Array<(Category | Subcategory) & { type: "category" | "subcategory"; category_name?: string }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Filter suggestions based on search query
  useEffect(() => {
    if (searchQuery.length > 0) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      let combinedSuggestions: (Category | Subcategory)[] = [];

      categories.forEach((category) => {
        // Check if category name matches
        if (category.name.toLowerCase().includes(lowerCaseQuery)) {
          combinedSuggestions.push({ ...category, type: "category" });
        }

        // Check if any subcategory name matches
        category.subcategories.forEach((subcategory) => {
          if (subcategory.name.toLowerCase().includes(lowerCaseQuery)) {
            combinedSuggestions.push({
              ...subcategory,
              type: "subcategory",
              category_name: category.name, // Add parent category name for display
            });
          }
        });
      });

      const uniqueSuggestions = Array.from(
        new Map(
          combinedSuggestions.map((item) => [`${item.type}-${item.name}`, item])
        ).values()
      );

      setSuggestions(uniqueSuggestions.slice(0, 10) as Array<(Category | Subcategory) & { type: "category" | "subcategory"; category_name?: string }>); // Limit suggestions
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
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
      // Using a toast message instead of alert()
      // Fallback if toast is not defined
      if (typeof toast !== 'undefined' && toast.error) {
        toast.error("Voice search is not supported in this browser.");
      } else {
        console.error("Voice search is not supported in this browser.");
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
        setShowSuggestions(true); // Show suggestions after voice input
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
    (item: (Category | Subcategory) & { type: "category" | "subcategory"; category_name?: string }) => {
      setShowSuggestions(false);
      setSearchQuery("");

      if (item.type === "category") {
        router.push(`/${createSlug(item.name)}`);
      } else if (item.type === "subcategory") {
        const subCategoryItem = item as Subcategory & { category_name: string };
        const categorySlug = createSlug(subCategoryItem.category_name);
        router.push(`/${categorySlug}/${createSlug(subCategoryItem.name)}`);
      }
    },
    [router, setSearchQuery]
  );

  return (
    <div className="relative w-full" ref={searchBarRef}>
      <input
        type="text"
        placeholder="Search by Products, Category..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
        // Adjusted height to h-8 and padding to match smaller search bar in image
        className="w-full px-3 py-1 pl-9 pr-9 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-shadow h-8" // Changed h-10 to h-8, text-base to text-sm, adjusted padding
        autoComplete="off"
      />
      {/* Adjusted icon positioning for smaller input field */}
      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /> {/* Changed left-3 to left-2.5, w-5 h-5 to w-4 h-4 */}
      <button
        type="button"
        className={`absolute right-2.5 top-1/2 transform -translate-y-1/2 rounded-full p-0.5 transition
          ${listening ? "bg-green-100 animate-pulse shadow-lg" : "hover:bg-gray-100"}
        `}
        aria-label={listening ? "Stop voice input" : "Start voice input"}
        onClick={handleMicClick}
      >
        {/* Adjusted icon size */}
        <Mic className={`w-4 h-4 ${listening ? "text-green-600" : "text-gray-400"}`} /> {/* Changed w-5 h-5 to w-4 h-4 */}
        {listening && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
        )}
      </button>
      {listening && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2 bg-white border border-green-200 rounded px-2 py-1 text-xs text-green-700 shadow animate-fade-in">
          Listening...
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((item, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center"
              onClick={() => handleSuggestionClick(item)}
            >
              <span>
                {item.name}
                {" "}
                {'category_name' in item && item.category_name && (
                  <span className="text-gray-500 text-xs"> (Category: {item.category_name})</span>
                )}
              </span>
              <span className="text-xs text-gray-400 capitalize">{item.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
