// src/app/vendor-listing/[vendor]/layout.tsx
import { Metadata } from "next";
import vendorSeoData from "@/data/vendorseo.json";

type Props = {
  params: Promise<{ vendor: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vendor } = await params;
  const normalizedSlug = decodeURIComponent(vendor).toLowerCase();

  const isProd = process.env.NODE_ENV === "production";
  const siteUrl = isProd ? "https://mhebazar.in" : "http://localhost:3000";
  const apiUrl = isProd ? "https://api.mhebazar.in" : "http://127.0.0.1:8000";
  const API_BASE = `${apiUrl}/api`;

  // 1. Get Text from local JSON (This is fast)
  const seoMatch = vendorSeoData.find((item) => {
    const slugFromJson = item.url.split('/').filter(Boolean).pop();
    return slugFromJson === normalizedSlug;
  });

  // 2. Default OG Image
  let ogImageUrl = `${siteUrl}/images/default-vendor-og.jpg`; 
  
  try {
    // ✅ Performance Fix: Native fetch with 1-hour revalidation
    const res = await fetch(`${API_BASE}/vendor/by-slug/${normalizedSlug}/`, { 
      next: { revalidate: 3600 } 
    });

    if (res.ok) {
      const data = await res.json();
      const photo = data?.user_info?.profile_photo;
      
      if (photo) {
        // Clean trailing slashes if any
        const cleanPhoto = photo.trim().replace(/\/$/, "");
        
        if (cleanPhoto.startsWith('http')) {
          ogImageUrl = cleanPhoto;
        } else {
          // Ensure lead slash for media paths
          const formattedPath = cleanPhoto.startsWith('/') ? cleanPhoto : `/${cleanPhoto}`;
          ogImageUrl = `${apiUrl}${formattedPath}`; 
        }
      }
    }
  } catch (error) {
    console.error("Metadata Error: Vendor logo fetch failed", error);
  }

  return {
    title: seoMatch?.title || `${vendor.toUpperCase()} | MHE Bazar`,
    description: seoMatch?.meta_description || "Authorized Material Handling Equipment Vendor.",
    openGraph: {
      title: seoMatch?.meta_title || seoMatch?.title || "Vendor Brand Store",
      description: seoMatch?.meta_description,
      url: `${siteUrl}/vendor-listing/${normalizedSlug}`,
      siteName: "MHE Bazar",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: seoMatch?.title || "Vendor Logo",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      images: [ogImageUrl],
    },
  };
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}