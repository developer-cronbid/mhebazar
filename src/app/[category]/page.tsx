// src/app/[category]/page.tsx

import { Metadata } from "next";
import api from "@/lib/api";
import { notFound } from "next/navigation";
import CategoryPageClient from "./CategoryPageClient";

// Helper function to format slugs to display names
const formatNameFromSlug = (slug: string): string => {
  if (!slug) return '';
  return slug
    .replace(/-/g, " ")
    .split(" ")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Define API data structures
interface ApiCategory {
  id: number;
  name: string;
  meta_title?: string;
  meta_description?: string;
  subcategories: { id: number; name: string }[];
}

const PRODUCT_TYPE_CHOICES = ["new", "used", "rental", "attachments"];

// **Server-Side Logic for Metadata**
export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  const urlParamSlug: string = params.category;
  const formattedParamName = formatNameFromSlug(urlParamSlug);

  if (PRODUCT_TYPE_CHOICES.includes(urlParamSlug)) {
    return {
      title: `${formattedParamName} | MHE Bazar`,
      description: `Browse all our ${formattedParamName.toLowerCase()} products on MHE Bazar.`,
    };
  }

  try {
    const categoryResponse = await api.get<ApiCategory[]>(
      `/categories/?name=${formattedParamName}`
    );
    const category = categoryResponse.data[0];

    if (category) {
      return {
        title: category.meta_title || category.name,
        description:
          category.meta_description ||
          `Explore products in the ${category.name} category on MHE Bazar.`,
      };
    }
  } catch (err) {
    console.error(
      "[Category Page Metadata] Failed to fetch metadata for category:",
      err
    );
  }

  return {
    title: "Page Not Found | MHE Bazar",
    description: "The page you are looking for does not exist.",
  };
}

// **Server-Side Component to render the Client Component**
export default function CategoryOrTypePage({
  params,
}: {
  params: { category: string; subcategory?: string };
}) {
  return <CategoryPageClient params={params} />;
}