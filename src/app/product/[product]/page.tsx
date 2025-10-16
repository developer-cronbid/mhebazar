// src/app/product/[product]/page.tsx
import { notFound, redirect } from 'next/navigation';
import api from '@/lib/api';
import Breadcrumb from '@/components/elements/Breadcrumb';
import ProductSection from '@/components/products/IndividualProduct';
import SparePartsFeatured from '@/components/home/SparepartsFeatured';
import VendorProducts from '@/components/elements/VendorFeaturedProducts';
import CategoryProducts from '@/components/elements/CategoryProducts';
import styles from './page.module.css';

// Helper function for SEO-friendly slug generation
const slugify = (text: string): string => {
  // 1. Convert to lowercase, trim.
  let slug = (text || '')
    .toString()
    .toLowerCase()
    .trim();

  // 2. Replace unwanted characters with a space first. 
  // Allowed characters: letters (a-z), numbers (0-9), period (.), and braces (()).
  // All others (including -, /) are replaced by a space.
  slug = slug.replace(/[^a-z0-9\.\(\)\s]/g, ' ');

  // 3. Collapse multiple spaces into a single period (.)
  // Using a period as the primary separator as requested, instead of a hyphen.
  slug = slug.replace(/\s+/g, '.');

  // 4. Remove leading/trailing periods
  slug = slug.replace(/^\.+|\.+$/g, '');

  return slug;
};

// This function now fetches real data for better SEO
export async function generateMetadata({
  params,
}: {
  params: { product: string };
}) {
  // Note: The product parameter might contain periods from the new slugify function.
  const productId = parseInt(params.product.split('-').pop() || '', 10);

  // Validate ID early
  if (isNaN(productId)) {
    return {
      title: 'Invalid Product',
      description: 'This product could not be found.',
    };
  }

  try {
    const response = await api.get(`/products/${productId}`);
    const productName = response.data.name;

    return {
      title: `${productName} - MHE Product Details`,
      description: `Detailed information about ${productName} and customer reviews.`,
    };
  } catch (error) {
    // Handle cases where the product isn't found for metadata generation
    return {
      title: 'Product Not Found',
      description: 'The product you are looking for does not exist.',
    };
  }
}

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
  let separator = '-'; // We assume the ID is still separated by a hyphen from the slug in the URL param.

  // Case 1: Handle old query parameter URLs like /product?id=123
  if (searchParams.id) {
    productId = parseInt(searchParams.id, 10);
    // Use a placeholder slug for now
    productSlugFromUrl = params.product || 'product';
  } else {
    // Case 2: Handle slug-based URLs like /product/forklift.123
    const parts = params.product.split(separator);
    productId = parseInt(parts.pop() || '', 10);
    productSlugFromUrl = parts.join(separator); // The slug part is everything before the last separator
  }

  // If the ID is not a valid number, render a 404 page
  if (isNaN(productId)) {
    notFound();
  }

  let productData;
  try {
    const response = await api.get(`/products/${productId}`);
    productData = response.data;
  } catch (error) {
    console.error('Failed to fetch product:', error);
    notFound();
  }

  // Generate the correct, canonical slug from the product name (including manufacturer/model for accuracy)
  const productTitleForSlug = `${productData.user_name || ''} ${productData.name} ${productData.model || ''}`;
  const canonicalProductSlug = slugify(productTitleForSlug);

  // Check if the URL slug matches the canonical slug
  if (productSlugFromUrl !== canonicalProductSlug) {
    // Redirect to the correct URL with the hyphen separator for the ID
    const canonicalUrl = `/product/${canonicalProductSlug}${separator}${productId}`;
    redirect(canonicalUrl);
  }
  
  // If the old query param URL was used, redirect to the new format
  if (searchParams.id) {
    const canonicalUrl = `/product/${canonicalProductSlug}${separator}${productId}`;
    redirect(canonicalUrl);
  }

  const { category_name, subcategory_name, name: productName } = productData;
  // Clean the product name for Breadcrumb display (allowing punctuation)
  const product = productName
    .replace(/[^a-zA-Z0-9 \-\.\(\)/\\*]/g, "") // Keep display title clean but readable
    .replace(/\s+/g, " ")
    .trim()
  const cat_slug = category_name.toLowerCase().replace(/\s+/g, '-');
  const subcat_slug = subcategory_name?.toLowerCase().replace(/\s+/g, '-');

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          // Use original category names in slugs to prevent redirect loops if they contain disallowed characters
          { label: category_name, href: `/${cat_slug}` },
          ...(subcategory_name ? [{ label: subcategory_name, href: `/${cat_slug}/${subcat_slug}` }] : []),
          // Use the canonical slug for the product link
          { label: product, href: `/product/${canonicalProductSlug}${separator}${productId}` },
        ]}
      />

      {/* Pass the ID and slug to the client component */}
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
