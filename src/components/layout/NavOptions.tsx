// src/components/layout/NavOptions.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Package, AlertTriangle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useEffect, useMemo, JSX } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Import the local JSON data for categories
import categoriesData from "@/data/categories.json";

// --- START: Corrected function and image handling logic ---
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_MEDIA_URL || process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

// Correct way to define a utility function outside of a component.
const createSlug = (name: string): string => {
  // Convert to lowercase and replace spaces and parentheses with a single hyphen.
  const slug = name.toLowerCase().replace(/[\s()]+/g, '-');
  
  // Remove any leading or trailing hyphens that might have been created.
  return slug.replace(/^-+|-+$/g, '');
};
function getFullImageUrl(imagePath: string | null): string | null {
  if (!imagePath) {
    return null;
  }
  const baseUrl = BACKEND_BASE_URL?.endsWith("/") ? BACKEND_BASE_URL : `${BACKEND_BASE_URL}/`;
  const path = imagePath.startsWith("/") ? imagePath.substring(1) : imagePath;
  return `${baseUrl}${path}`;
}
// --- END: Corrected logic ---


interface Subcategory {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  image_url: string;
  subcategories: Subcategory[];
}

interface CategoryMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[]; // Add this line
}


const CategoryIcon = ({ category }: { category: Category }) => {
  const [hasError, setHasError] = useState(false);
  const fullImageUrl = useMemo(() => getFullImageUrl(category.image_url), [category.image_url]);

  useEffect(() => {
    setHasError(false);
  }, [category.image_url]);

  if (!fullImageUrl || hasError) {
    return (
      <div className="w-8 h-8 flex items-center justify-center bg-muted rounded-md shrink-0">
        <Package className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Image
      src={fullImageUrl}
      alt={category.name}
      width={32}
      height={32}
      className="w-8 h-8 object-contain rounded-md shrink-0"
      onError={() => setHasError(true)}
      unoptimized
      priority
    />
  );
};

export default function CategoryMenu({ isOpen, onClose, categories }: CategoryMenuProps) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (isDesktop && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [isDesktop, categories, activeCategory]);

  const handleMouseEnter = useCallback(
    (category: Category) => {
      setActiveCategory(category);
    },
    []
  );

  const renderContent = () => {
    if (isDesktop) {
      return (
        <div className="flex w-[640px] max-h-[calc(100vh-220px)]">
          <div className="w-64 p-2 border-r overflow-y-auto">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/${createSlug(category.name)}`}
                onClick={onClose}
                onMouseEnter={() => handleMouseEnter(category)}
                className={`inline-flex items-center w-full justify-start gap-3 p-2.5 h-auto rounded-md text-sm font-medium transition-colors ${
                  activeCategory?.id === category.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent"
                }`}
              >
                <CategoryIcon category={category} />
                <span className="truncate">{category.name}</span>
              </Link>
            ))}
          </div>

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

    return (
      <div className="w-80 p-2">
        <Accordion type="single" collapsible className="w-full">
          {categories.map((category) =>
            category.subcategories?.length > 0 ? (
              <AccordionItem value={String(category.id)} key={category.id}>
                <AccordionTrigger className="p-2.5 hover:no-underline hover:bg-accent rounded-md">
                  <div className="flex items-center gap-3">
                    <CategoryIcon category={category} />
                    <span className="font-medium text-sm">{category.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-0">
                  <Link
                    href={`/${createSlug(category.name)}`}
                    className="block w-full text-left py-2.5 pl-12 pr-4 text-sm font-semibold rounded-md text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={onClose}
                  >
                    All {category.name}
                  </Link>
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
                <CategoryIcon category={category} />
                <span>{category.name}</span>
              </Link>
            )
          )}
        </Accordion>
      </div>
    );
  };

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