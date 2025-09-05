"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Package, AlertTriangle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useEffect, JSX } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import api from "@/lib/api";

// --- Shadcn UI & Type Definitions (unchanged) ---
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Category {
  id: number;
  subcategories: {
    id: number;
    name: string;
  }[];
  cat_image?: string;
  name: string;
}

interface CategoryMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Helper Functions & Image Fallback (unchanged) ---
const createSlug = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, "-");

const CategoryImage = ({ category }: { category: Category }) => {
  const [hasError, setHasError] = useState(!category.cat_image);
  useEffect(() => {
    setHasError(!category.cat_image);
  }, [category.cat_image]);

  if (hasError) {
    return (
      <div className="w-8 h-8 flex items-center justify-center bg-muted rounded-md shrink-0">
        <Package className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }
  return (
    <Image
      src={category.cat_image!}
      alt={category.name}
      width={32}
      height={32}
      className="w-8 h-8 object-contain rounded-md shrink-0"
      onError={() => setHasError(true)}
      unoptimized
    />
  );
};

// --- Main Responsive Component ---
export default function CategoryMenu({ isOpen, onClose }: CategoryMenuProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // --- Data Fetching Logic (unchanged) ---
  const fetchCategories = useCallback(async () => {
    if (!isOpen || categories.length > 0) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/categories/");
      const data = response.data || [];
      setCategories(data);
      if (data.length > 0) {
        const firstCategoryWithSubs = data.find(
          (cat: Category) => cat.subcategories?.length > 0
        );
        setActiveCategory(firstCategoryWithSubs || data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setError("Failed to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isOpen, categories.length]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // --- renderContent function with modifications ---
  const renderContent = () => {
    // --- Loading and Error States (unchanged) ---
    if (loading) {
      return (
        <div className="p-4 space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 text-center">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => {
              setCategories([]);
              fetchCategories();
            }}
          >
            Try Again
          </Button>
        </div>
      );
    }

    // --- DESKTOP: Two-Pane Layout (MODIFIED) ---
    if (isDesktop) {
      return (
        <div className="flex w-[640px] max-h-[calc(100vh-220px)]">
          <div className="w-64 p-2 border-r overflow-y-auto">
            {categories.map((category) => (
              // ✨ CHANGE 1: Replaced <Button> with <Link> for navigation on click.
              <Link
                key={category.id}
                href={`/${createSlug(category.name)}`}
                // ✨ CHANGE 2: Added onClick to close the menu after navigation.
                onClick={onClose}
                // ✨ CHANGE 3: Use onMouseEnter to update the active category on hover.
                onMouseEnter={() => setActiveCategory(category)}
                // ✨ CHANGE 4: Replicated button styles directly on the Link component.
                className={`inline-flex items-center w-full justify-start gap-3 p-2.5 h-auto rounded-md text-sm font-medium transition-colors ${
                  activeCategory?.id === category.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent"
                }`}
              >
                <CategoryImage category={category} />
                <span className="truncate">{category.name}</span>
              </Link>
            ))}
          </div>

          {/* Right Pane (unchanged) */}
          <div className="flex-1 p-2 overflow-y-auto">
            {activeCategory && activeCategory.subcategories?.length > 0 ? (
              activeCategory.subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/${createSlug(activeCategory.name)}/${createSlug(
                    sub.name
                  )}`}
                  onClick={onClose}
                  className="block w-full text-left p-2.5 text-sm rounded-md text-foreground hover:bg-accent transition-colors"
                >
                  {sub.name}
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-sm text-center p-4">
                <p className="text-muted-foreground mb-4">
                  Explore all products in this category.
                </p>
                {activeCategory && (
                  <Button asChild onClick={onClose}>
                    <Link href={`/${createSlug(activeCategory.name)}`}>
                      Explore {activeCategory.name}
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // --- MOBILE: Accordion Layout (unchanged) ---
    return (
      <div className="w-80 p-2">
        <Accordion type="single" collapsible className="w-full">
          {categories.map((category) =>
            category.subcategories?.length > 0 ? (
              <AccordionItem value={String(category.id)} key={category.id}>
                <AccordionTrigger className="p-2.5 hover:no-underline hover:bg-accent rounded-md">
                  <div className="flex items-center gap-3">
                    <CategoryImage category={category} />
                    <span className="font-medium text-sm">{category.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-0">
                  {category.subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/${createSlug(category.name)}/${createSlug(
                        sub.name
                      )}`}
                      onClick={onClose}
                      className="block w-full text-left py-2.5 pl-12 pr-4 text-sm rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ) : (
              <Link
                key={category.id}
                href={`/${createSlug(category.name)}`}
                onClick={onClose}
                className="flex items-center gap-3 p-2.5 text-sm font-medium rounded-md transition-colors text-foreground hover:bg-accent"
              >
                <CategoryImage category={category} />
                <span>{category.name}</span>
              </Link>
            )
          )}
        </Accordion>
      </div>
    );
  };

  // --- Main Return JSX (unchanged) ---
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute left-0 top-full z-50 mt-0"
        >
          <Card className="shadow-lg">{renderContent()}</Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
