// src/app/product/[product]/page.tsx
import { notFound, redirect } from 'next/navigation';
import api from '@/lib/api';
import Breadcrumb from '@/components/elements/Breadcrumb';
import ProductSection from '@/components/products/IndividualProduct';
import SparePartsSection from '@/components/home/product/SparePartsSectionApiCalling';
// import SparePartsFeatured from '@/components/home/SparepartsFeatured';
import VendorProducts from '@/components/elements/VendorFeaturedProducts';
import CategoryProducts from '@/components/elements/CategoryProducts';
import styles from './page.module.css';
import { Metadata } from 'next';
import { Suspense } from 'react';

// --- START: FIXED API Type Definitions ---
interface ProductApiResponse {
  id: number;
  name: string;
  description: string;
  meta_title: string | null;
  meta_description: string | null;
  manufacturer: string | null;
  model: string | null;
  product_details: {
    capacity?: string;
    [key: string]: unknown;
  } | null;
  price: string;
  type: string | string[];
  is_active: boolean;
  direct_sale: boolean;
  online_payment: boolean;
  hide_price: boolean;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
  status: string;
  user: number;
  category: number;
  subcategory: number | null;
  category_name: string;
  subcategory_name: string | null;
  user_name: string;
  images: { id: number; image: string }[];
  brochure: string | null;
  average_rating: number | null;
  review_count: number;
  user_description: string | null;
  user_image: string | null;
  category_details: {
    cat_image: string | null;
  };
}
// --- END: FIXED API Type Definitions ---

// Helper function for SEO-friendly slug generation (Canonical URL)
const slugify = (text: string): string => {
  let slug = (text || '')
    .toString()
    .toLowerCase()
    .trim();

  // 1. Replace unwanted characters with a space first.
  slug = slug.replace(/[^a-z0-9\.\s]/g, ' ');

  // 2. Collapse multiple spaces into a single hyphen (-).
  slug = slug.replace(/\s+/g, '-');

  // 3. Remove leading/trailing hyphens or periods.
  slug = slug.replace(/^-+|-+$/g, '');
  slug = slug.replace(/^\.+|\.+$/g, '');

  return slug;
};

// Helper function to force HTTPS on image URLs
const forceHttps = (url: string): string => {
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
};

// Helper function to fetch product data (Reusable for Metadata and Page)
async function getProductData(productId: number): Promise<ProductApiResponse> {
  // Add cache-control headers to bypass Next.js and API caching
  const response = await api.get<ProductApiResponse>(`/products/${productId}`, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
  return response.data;
}


// --- SEO AND METADATA GENERATION (CWV FIX) ---
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ product: string }>;
  searchParams: Promise<{ id?: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const product = resolvedParams.product;
  const queryId = resolvedSearchParams.id;

  const separator = '-';
  let productId: number;

  // Logic to find ID from query string first, then slug
  if (queryId) {
    productId = parseInt(queryId, 10);
  } else {
    productId = parseInt(product.split(separator).pop() || '', 10);
  }

  // Fallback metadata immediately if ID is invalid
  if (isNaN(productId)) {
    return { title: 'Invalid Product' };
  }

  try {
    // CWV FIX: Fetch data here for SEO/Social sharing, Next.js will cache this fetch result.
    const productData = await getProductData(productId);
    const productName = productData.name;
    const metaTitle = productData.meta_title || `${productName} - MHE Product Details`;
    const metaDescription = productData.meta_description || `Detailed information about ${productName} and customer reviews.`;

    // FIX 2: Ensure the image URL is HTTPS
    const firstImageHttp = productData.images.length > 0 ? productData.images[0].image : '/mhe-logo.png';
    const firstImage = forceHttps(firstImageHttp);

    const canonicalUrl = `https://www.mhebazar.in/product/${product}`;

    // const isAvailable = productData.stock_quantity > 0 && productData.is_active;

    // Helper for Schema Markup (Rich Snippets)
    //   const productSchema = {
    //     "@context": "https://schema.org",
    //     "@type": "Product",
    //     "name": productName,
    //     "description": metaDescription,
    //     "sku": productData.model || productName.substring(0, 5).toUpperCase(),
    //     "image": firstImage,
    //     "brand": productData.manufacturer || productData.user_name || "MHE Bazar",
    //     "offers": {
    //       "@type": "Offer",
    //       "url": canonicalUrl,
    //       "priceCurrency": "INR",
    //       "price": productData.price,
    //       "availability": isAvailable ? "https://schema.org/InStock" : "https://schema.org/InStock",
    //     },
    //     // FIX 1: Ensure AggregateRating structure is complete for rich snippets (Price/Rating shown)
    //     // This requires "reviewCount" even if estimated or placeholder.
    //    "aggregateRating": productData.review_count > 0 ? {
    //   "@type": "AggregateRating",
    //   "ratingValue": productData.average_rating || 5,
    //   "reviewCount": productData.review_count
    // } : undefined,

    //   };

    return {
      title: metaTitle,
      description: metaDescription,
      // Canonical URL
      alternates: {
        canonical: canonicalUrl,
      },
      // Social Sharing: Open Graph (Facebook/LinkedIn)
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        url: canonicalUrl,
        // FIX: Using 'website' as the safe type
        type: 'website',
        // FIX 2: Use the HTTPS image URL
        images: [{ url: firstImage, alt: productName }],
      },
      // Social Sharing: Twitter Card
      twitter: {
        card: 'summary_large_image',
        title: metaTitle,
        description: metaDescription,
        // FIX 2: Use the HTTPS image URL
        images: [firstImage],
      },
      // Schema Markup (Rich Snippets for Google)
      metadataBase: new URL('https://www.mhebazar.in'),
      // other: {
      //   'json-ld': JSON.stringify(productSchema),
      // },
    };
  } catch (error) {
    // Soft fail for metadata if API throws
    return {
      title: 'Product Not Found',
      description: 'The product you are looking for does not exist.',
    };
  }
}
// --- END: METADATA GENERATION ---


// The page component is now an async function
export default async function IndividualProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ product: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedParams = await params; // Await the promise first
  const resolvedSearchParams = await searchParams;

  const productPath = resolvedParams.product;
  const queryId = resolvedSearchParams.id;

  let productId: number;
  let productSlugFromUrl: string;
  let separator = '-';

  if (queryId) {
    productId = parseInt(queryId, 10); // Use the ID from the URL query
    productSlugFromUrl = productPath || 'product';
  } else {
    const parts = productPath.split(separator);
    productId = parseInt(parts.pop() || '', 10); // Fallback to slug ID
    productSlugFromUrl = parts.join(separator);
  }

  if (isNaN(productId)) {
    notFound();
  }

  let productData: ProductApiResponse;
  let reviews: any[] = [];
  try {
    // 1. Fetch main product data
    // const productRes = await getProductData(productId); 
    const [productRes, reviewsRes] = await Promise.all([
      getProductData(productId),
      api.get(`/reviews/?product=${productId}`, {
        headers: { 'Cache-Control': 'no-cache' }
      })
    ]);

    // 2. Logic: If Approved and User is Active, continue; otherwise, redirect to Home
    if (productRes.status !== 'approved' || !productRes.is_active) {
      console.warn(`Redirecting: Product ${productId} is ${productRes.status} or inactive.`);
      redirect('/'); // Sends user to home if status is wrong
    }

    reviews = reviewsRes.data;

    // 3. Fetch category details
    const categoryRes = await api.get(`/categories/${productRes.category}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });

    productData = {
      ...productRes,
      category_details: categoryRes.data,
    };
  } catch (error: any) {
    // 4. FIX: Handle Django's 404. If the API says 404, it means the product 
    // exists but is hidden by your 'get_queryset' logic
    if (error.response?.status === 404) {
      console.error('Product hidden by backend (404), redirecting to home...');
      redirect('/'); // Redirect instead of showing notFound()
    }

    // For other serious errors (like server down), you can still show 404
    console.error('Unexpected error:', error);
    notFound();
  }

  // 2. Canonicalization Check and Redirects

  // Generate the correct, canonical slug from the product name 
  // (Crucial for SEO and preventing duplicate content)
  const productTitleForSlug = `${productData.user_name || ''} ${productData.name} ${productData.model || ''}`;
  const canonicalProductSlug = slugify(productTitleForSlug);

  // Check 1: If the URL slug doesn't match the canonical slug, redirect.
  if (productSlugFromUrl !== canonicalProductSlug) {
    const canonicalUrl = `/product/${canonicalProductSlug}${separator}${productId}`;
    redirect(canonicalUrl);
  }

  // Check 2: If the old query param URL was used, redirect to the new format.
  if (queryId) { // FIX: Use the variable you defined at the top
    const canonicalUrl = `/product/${canonicalProductSlug}${separator}${productId}`;
    redirect(canonicalUrl);
  }

  // 3. Prepare Data for Rendering
  const { category_name, subcategory_name, name: productName } = productData;

  // Clean the product name for Breadcrumb display (allowing standard symbols)
  const productNameClean = productName
    .replace(/[^a-zA-Z0-9 \-\.\(\)/\\*]/g, "")
    .replace(/\s+/g, " ")
    .trim()

  const cat_slug = category_name.toLowerCase().replace(/\s+/g, '-');
  const subcat_slug = subcategory_name?.toLowerCase().replace(/\s+/g, '-');

  // 4. Render
  return (
    <>
   
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": productData.name,
            "description": productData.meta_description || productData.description,
            "image": productData.images.length > 0 ? forceHttps(productData.images[0].image) : 'https://www.mhebazar.in/mhe-logo.png',
            "sku": productData.model || `MHE-${productData.id}`,
            "brand": {
              "@type": "Brand",
              "name": productData.manufacturer || productData.user_name || "MHE Bazar"
            },
            // ONLY show aggregateRating if there are reviews
            ...(productData.review_count > 0 ? {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": (productData.average_rating || 5.0).toFixed(1),
                "reviewCount": productData.review_count
              }
            } : {}),
            "review": reviews.length > 0 ? reviews.map((rev: any) => ({
              "@type": "Review",
              "author": { "@type": "Person", "name": rev.user_name || "MHE Bazar User" },
              "datePublished": rev.created_at,
              "reviewBody": rev.comment || "Excellent product",
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": rev.rating || 5
              }
            })) : undefined,
            "offers": {
              "@type": "Offer",
              "price": productData.price,
              "priceCurrency": "INR",
              "availability": "https://schema.org/InStock",
              "url": `https://www.mhebazar.in/product/${canonicalProductSlug}${separator}${productId}`,
              "priceValidUntil": "2026-12-31" // ADD THIS to fix Merchant Listing warning
            }
          })
        }}
      />
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: category_name, href: `/${cat_slug}` },
          ...(subcategory_name ? [{ label: subcategory_name, href: `/${cat_slug}/${subcat_slug}` }] : []),
          // Use the canonical slug for the product link in the breadcrumb
          { label: productNameClean, href: `/product/${canonicalProductSlug}${separator}${productId}` },
        ]}
      />
      {/* FIX 2: Pass productSlug to the client component to resolve the prop error */}
      <ProductSection productSlug={productPath} productId={productId} initialData={productData} />

      <div className={styles.animatedSection}>
        <Suspense><SparePartsSection /></Suspense>
      </div>

      <div className={styles.animatedSection}>
        <Suspense><VendorProducts currentProductId={productId} /></Suspense>
      </div>

      <div className={styles.animatedSection}>
        <Suspense><CategoryProducts currentProductId={productId} /></Suspense>
      </div>
    </>
  );
}