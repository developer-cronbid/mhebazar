"use client";

import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { JSX, useEffect, useState } from "react";
import categoriesData from "@/data/categories.json";
import { motion } from "framer-motion";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

interface Category {
  id: number;
  subcategories: {
    id: number;
    name: string;
  }[];
  image_url: string | null;
  name: string;
}

interface CategoryItemProps {
  imageSrc: string | null;
  label: string;
  slug: string;
}

function getImageUrl(imagePath: string | null): string | null {
  if (!imagePath) {
    return null;
  }

  let cleanedPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  cleanedPath = cleanedPath.startsWith('api/') ? cleanedPath.substring(4) : cleanedPath;

  if (BACKEND_BASE_URL) {
    const baseUrl = BACKEND_BASE_URL.endsWith('/') ? BACKEND_BASE_URL.slice(0, -1) : BACKEND_BASE_URL;
    const path = cleanedPath.startsWith('/') ? cleanedPath : `/${cleanedPath}`;
    return `${baseUrl}${path}`;
  }

  return imagePath;
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20
    }
  }
};

const CategoryItem = ({ imageSrc, label, slug }: CategoryItemProps): JSX.Element => {
  const initials = label
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const [showInitials, setShowInitials] = useState<boolean>(false);
  const fullImageUrl = getImageUrl(imageSrc);

  const handleImageError = () => {
    setShowInitials(true);
  };

  return (
    <Link href={`/${slug}`} className="flex flex-col items-center group cursor-pointer">
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-[144px] h-[144px] rounded-full bg-gradient-to-b from-blue-100 to-white flex items-center justify-center mb-2 overflow-hidden shadow-md"
      >
        {fullImageUrl && !showInitials ? (
          <div className="relative w-[80%] h-[80%]">
            <Image
              src={fullImageUrl}
              alt={label}
              fill
              className="object-contain p-2"
              onError={handleImageError}
              sizes="(max-width: 768px) 120px, 144px"
            />
          </div>
        ) : (
          <span className="text-blue-500 text-3xl font-bold">{initials}</span>
        )}
      </motion.div>
      <p className="text-center text-sm font-normal text-gray-800">
        {label}
      </p>
    </Link>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export default function CategoriesSection(): JSX.Element {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCategories(categoriesData);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const displayedCategories = showAll ? categories : categories.slice(0, 7);

  return (
    <section className="py-12 w-full mx-auto px-4 md:px-8 bg-white">
      <h2 className="text-2xl font-bold mb-8 text-left text-gray-900">
        MHE Categories
      </h2>

      {loading ? (
        <p className="text-center text-gray-600 animate-pulse">Loading categories...</p>
      ) : categories.length === 0 ? (
        <p className="text-center text-gray-500">No categories found.</p>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 xl:grid-cols-8 gap-x-4 gap-y-8 justify-items-center"
        >
          {displayedCategories.map((cat) => (
            <CategoryItem
              key={cat.id}
              imageSrc={cat.image_url}
              label={cat.name}
              slug={cat.name.toLowerCase().replace(/\s+/g, '-')}
            />
          ))}
          {categories.length > 7 && (
            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center"
            >
              <motion.button
                onClick={() => setShowAll(!showAll)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center justify-center w-[144px] h-[144px] rounded-full border-2 border-blue-500 bg-white text-blue-500 hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md"
              >
                <LayoutGrid size={32} className="mb-2" />
                <span className="text-sm font-medium text-center">
                  {showAll ? "Show Less" : "All Category"}
                </span>
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      )}
    </section>
  );
}