// src/app/[category]/layout.tsx
import { Metadata } from "next";

type Props = {
  params: Promise<{ category: string }>;
  children: React.ReactNode;
};

const formatNameFromSlug = (slug: string): string => {
  return slug.replace(/-/g, ' ').split(' ').map((word: string) => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: urlSlug } = await params;
  
  const isProd = process.env.NODE_ENV === "production";
  const siteUrl = isProd ? "https://mhebazar.in" : "http://localhost:3000";
  const apiUrl = isProd ? "https://api.mhebazar.in" : "http://127.0.0.1:8000";
  const API_BASE = `${apiUrl}/api`;

  const formattedName = formatNameFromSlug(urlSlug);

  try {
    // ✅ Performance Fix: Using native fetch with revalidate (1 hour)
    // We fetch category data by name (matching your original logic)
    const res = await fetch(`${API_BASE}/categories/?name=${encodeURIComponent(formattedName)}`, { 
      next: { revalidate: 3600 } 
    });

    if (!res.ok) throw new Error('Category fetch failed');
    
    const data = await res.json();
    const categoryData = data[0]; // Assuming your API returns an array

    if (categoryData) {
      const rawImg = categoryData.cat_image || "/images/default-og.jpg";
      let cleanedImgPath = rawImg.trim().replace(/\/$/, "");

      // Construct Absolute URL
      let ogImageUrl = "";
      if (cleanedImgPath.startsWith('http')) {
        ogImageUrl = cleanedImgPath;
      } else if (cleanedImgPath.startsWith('/media')) {
        ogImageUrl = `${apiUrl}${cleanedImgPath}`; 
      } else {
        ogImageUrl = `${siteUrl}${cleanedImgPath}`;
      }

      return {

        title: categoryData.meta_title || `${categoryData.name} | MHE Bazar`,
        
        description: categoryData.meta_description || `Explore our ${categoryData.name} collection.`,
        openGraph: {
          title: categoryData.meta_title || categoryData.name,
          description: categoryData.meta_description || `Check out ${categoryData.name} at MHE Bazar.`,
          url: `${siteUrl}/${urlSlug}`,
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: categoryData.name,
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          images: [ogImageUrl],
        }
        
      };
    }
  } catch (error) {
    console.error("Category Metadata fetch failed", error);
  }

  return {
    title: `${formattedName} Products | MHE Bazar`,
  };
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}