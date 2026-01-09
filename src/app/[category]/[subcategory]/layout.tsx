// src/app/[category]/[subcategory]/layout.tsx
import { Metadata } from "next";

type Props = {
  params: Promise<{ category: string; subcategory: string }>;
  children: React.ReactNode;
};

const formatNameFromSlug = (slug: string): string => {
  return slug.replace(/-/g, ' ').split(' ').map((word: string) => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: catSlug, subcategory: subcatSlug } = await params;
  
  const isProd = process.env.NODE_ENV === "production";
  const siteUrl = isProd ? "https://mhebazar.in" : "http://localhost:3000";
  const apiUrl = isProd ? "https://api.mhebazar.in" : "http://127.0.0.1:8000";
  const API_BASE = `${apiUrl}/api`;

  const formattedCatName = formatNameFromSlug(catSlug);
  const formattedSubcatName = formatNameFromSlug(subcatSlug);

  try {
    // ✅ Performance Fix: Native fetch with 1-hour revalidation
    const res = await fetch(`${API_BASE}/categories/?name=${encodeURIComponent(formattedCatName)}`, { 
      next: { revalidate: 3600 } 
    });

    if (!res.ok) throw new Error('Failed to fetch category');
    
    const data = await res.json();
    const category = data[0];

    if (category) {
      const subcategory = category.subcategories.find((sub: any) =>
        sub.name.toLowerCase() === formattedSubcatName.toLowerCase()
      );

      if (subcategory) {
        const rawImg = subcategory.sub_image || subcategory.sub_banner || "/images/default-og.jpg";
        
        // Construct the Absolute URL & handle trailing slash
        let cleanPath = rawImg.trim().replace(/\/$/, "");
        let ogImageUrl = "";
        
        if (cleanPath.startsWith('http')) {
          ogImageUrl = cleanPath;
        } else if (cleanPath.startsWith('/media')) {
          ogImageUrl = `${apiUrl}${cleanPath}`;
        } else {
          ogImageUrl = `${siteUrl}${cleanPath}`;
        }

        return {
          title: subcategory.meta_title || `${subcategory.name} | MHE Bazar`,
          description: subcategory.meta_description || `Explore our range of ${subcategory.name}.`,
          openGraph: {
            title: subcategory.meta_title || subcategory.name,
            description: subcategory.meta_description,
            url: `${siteUrl}/${catSlug}/${subcatSlug}`,
            images: [
              {
                url: ogImageUrl,
                width: 1200,
                height: 630,
                alt: subcategory.name,
              },
            ],
          },
          twitter: {
            card: "summary_large_image",
            images: [ogImageUrl],
          }
        };
      }
    }
  } catch (error) {
    console.error("Subcategory metadata fetch error:", error);
  }

  return {
    title: `${formattedSubcatName} | MHE Bazar`,
  };
}

export default function SubCategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}