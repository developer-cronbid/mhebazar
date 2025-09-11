"use client";

import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { JSX, useState } from "react";
import categoriesData from "@/data/categories.json";
import { motion } from "framer-motion";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_MEDIA_URL || process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

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
  const baseUrl = BACKEND_BASE_URL?.endsWith("/") ? BACKEND_BASE_URL : `${BACKEND_BASE_URL}/`;
  const path = imagePath.startsWith("/") ? imagePath.substring(1) : imagePath;
  return `${baseUrl}${path}`;
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
};

const CategoryItem = ({ imageSrc, label, slug }: CategoryItemProps): JSX.Element => {
  const [showInitials, setShowInitials] = useState<boolean>(false);
  const fullImageUrl = getImageUrl(imageSrc);

  const handleImageError = () => {
    setShowInitials(true);
  };

  const initials = label
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link href={`/${slug}`} className="flex flex-col items-center gap-4 relative text-center">
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex flex-col w-[130px] h-[130px] items-center justify-center px-0 py-6 relative rounded-[1000px] aspect-[1] bg-[linear-gradient(143deg,rgba(212,234,250,1)_0%,rgba(255,255,255,1)_100%)] group"
      >
        {fullImageUrl && !showInitials ? (
          <motion.div
            className="relative w-[100px] h-[100px]"
            whileHover={{
              scale: 1.65,
              z: 10,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <Image
              src={fullImageUrl}
              alt={label}
              fill
              className="object-contain"
              onError={handleImageError}
              sizes="100px"
              priority
            />
          </motion.div>
        ) : (
          <span className="text-blue-500 text-base font-normal">{initials}</span>
        )}
      </motion.div>
      <div className="relative w-fit">{label}</div>
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
  const [showAll, setShowAll] = useState(false);
  const categories = categoriesData as Category[];

  const displayedCategories = showAll ? categories : categories.slice(0, 7);

  return (
    <section className="py-10 mb-4 w-full mx-auto px-4 md:px-8 bg-black-50">
      <h2 className="text-3xl font-bold mb-8 text-left text-black-900">
        MHE Categories
      </h2>
      
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
            slug={cat.name.toLowerCase().replace(/\s+/g, "-")}
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
              className="flex flex-col items-center justify-center w-[144px] h-[144px] rounded-full border-2 border-blue-300 bg-white text-blue-500 hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 "
            >
              <LayoutGrid size={32} className="mb-2" />
              <span className="text-sm font-medium text-center">
                {showAll ? "Show Less" : "All Category"}
              </span>
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}