// src/app/product/[product]/page.tsx
import { notFound, redirect } from 'next/navigation';
import api from '@/lib/api';
import Breadcrumb from '@/components/elements/Breadcrumb';
import ProductSection from '@/components/products/IndividualProduct';
import SparePartsFeatured from '@/components/home/SparepartsFeatured';
import VendorProducts from '@/components/elements/VendorFeaturedProducts';
import CategoryProducts from '@/components/elements/CategoryProducts';
import styles from './page.module.css';
import { Metadata } from 'next';

// --- START: FIXED API Type Definitions ---
interface ProductApiResponse {
  id: number;
  category_name: string;
  subcategory_name: string | null;
  user_name: string | null;
  images: { id: number; image: string }[];
  average_rating: number | null;
  name: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  manufacturer: string | null;
  model: string | null;
  price: string;
  type: string[] | string;
  is_active: boolean;
  direct_sale: boolean;
  // FIX 3: Add missing stock_quantity property
  stock_quantity: number; 
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

// Helper function to fetch product data (Reusable for Metadata and Page)
async function getProductData(productId: number): Promise<ProductApiResponse> {
  // Use .get<ProductApiResponse> to enforce type checking on the API response
  const response = await api.get<ProductApiResponse>(`/products/${productId}`);
  return response.data;
}


// --- SEO AND METADATA GENERATION (CWV FIX) ---
export async function generateMetadata({
  params,
}: {
  params: { product: string };
}): Promise<Metadata> {
  const separator = '-';
  const productId = parseInt(params.product.split(separator).pop() || '', 10);

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
    const firstImage = productData.images.length > 0 ? productData.images[0].image : '/mhe-logo.png';
    const canonicalUrl = `https://www.mhebazar.in/product/${params.product}`; 
    
    const isAvailable = productData.stock_quantity > 0 && productData.is_active;

    // Helper for Schema Markup (Rich Snippets)
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": productName,
      "description": metaDescription,
      "sku": productData.model || productName.substring(0, 5).toUpperCase(),
      "image": firstImage,
      "brand": productData.manufacturer || productData.user_name || "MHE Bazar",
      "offers": {
        "@type": "Offer",
        "url": canonicalUrl,
        "priceCurrency": "INR",
        "price": productData.price,
        "availability": isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
      // Schema for Rating (if available)
      ...(productData.average_rating && {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": productData.average_rating.toFixed(1),
          "reviewCount": 1, // Placeholder, ideally fetched
        }
      })
    };

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
        // FIX 1: Change 'product' to 'website' to align with Next.js supported types and solve the error
        type: 'website', 
        images: [{ url: firstImage, alt: productName }],
      },
      // Social Sharing: Twitter Card
      twitter: {
        card: 'summary_large_image',
        title: metaTitle,
        description: metaDescription,
        images: [firstImage],
      },
      // Schema Markup (Rich Snippets for Google)
      metadataBase: new URL('https://www.mhebazar.in'),
      other: {
        'json-ld': JSON.stringify(productSchema),
      },
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
  params: { product: string };
  searchParams: { id?: string };
}) {
  let productId: number;
  let productSlugFromUrl: string;
  let separator = '-'; // The reliable separator between the slug and the ID in the URL parameter.

  // 1. Determine Product ID
  if (searchParams.id) {
    productId = parseInt(searchParams.id, 10);
    productSlugFromUrl = params.product || 'product';
  } else {
    const parts = params.product.split(separator);
    productId = parseInt(parts.pop() || '', 10);
    productSlugFromUrl = parts.join(separator);
  }

  if (isNaN(productId)) {
    notFound();
  }

  let productData: ProductApiResponse;
  try {
    // CWV FIX: Reuse the fetched product data (or trigger a cached fetch)
    productData = await getProductData(productId); 
  } catch (error) {
    console.error('Failed to fetch product:', error);
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
  if (searchParams.id) {
    const canonicalUrl = `/product/${canonicalProductSlug}${separator}${productId}`;
    redirect(canonicalUrl);
  }

  // 3. Prepare Data for Rendering
  const { category_name, subcategory_name, name: productName } = productData;
  
  // Clean the product name for Breadcrumb display (allowing standard symbols)
  const product = productName
    .replace(/[^a-zA-Z0-9 \-\.\(\)/\\*]/g, "") 
    .replace(/\s+/g, " ")
    .trim()
  
  const cat_slug = category_name.toLowerCase().replace(/\s+/g, '-');
  const subcat_slug = subcategory_name?.toLowerCase().replace(/\s+/g, '-');

  // 4. Render
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: category_name, href: `/${cat_slug}` },
          ...(subcategory_name ? [{ label: subcategory_name, href: `/${cat_slug}/${subcat_slug}` }] : []),
          // Use the canonical slug for the product link in the breadcrumb
          { label: product, href: `/product/${canonicalProductSlug}${separator}${productId}` },
        ]}
      />
      {/* FIX 2: Pass productSlug to the client component to resolve the prop error */}
      <ProductSection productSlug={params.product} productId={productId} />

      <div className={styles.animatedSection}>
        <SparePartsFeatured />
      </div>

      <div className={styles.animatedSection}>
        <VendorProducts currentProductId={productId} />
      </div>

      <div className={styles.animatedSection}>
        <CategoryProducts currentProductId={productId} />
      </div>
    </>
  );
}