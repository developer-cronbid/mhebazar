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
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/-+$/, '');
};

// This function now fetches real data for better SEO
export async function generateMetadata({
  params,
}: {
  params: { product: string };
}) {
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

  // Case 1: Handle old query parameter URLs like /product?id=123
  if (searchParams.id) {
    productId = parseInt(searchParams.id, 10);
    // Use a placeholder slug for now
    productSlugFromUrl = params.product || 'product';
  } else {
    // Case 2: Handle slug-based URLs like /product/forklift-123
    const parts = params.product.split('-');
    productId = parseInt(parts.pop() || '', 10);
    productSlugFromUrl = parts.join('-');
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

  // Generate the correct, canonical slug from the product name
  const canonicalProductSlug = slugify(productData.name);

  // If the URL slug doesn't match the canonical slug, redirect to the correct URL
  if (productSlugFromUrl !== canonicalProductSlug) {
    const canonicalUrl = `/product/${canonicalProductSlug}-${productId}`;
    redirect(canonicalUrl);
  }
  
  // If the old query param URL was used, redirect to the new format
  if (searchParams.id) {
    const canonicalUrl = `/product/${canonicalProductSlug}-${productId}`;
    redirect(canonicalUrl);
  }

  const { category_name, subcategory_name, name: productName } = productData;
  const product = productName.replace(/[^a-zA-Z0-9 \-\.]/g, "")
    .replace(/\s+/g, " ")
    .trim()
  const cat_slug = category_name.toLowerCase().replace(/\s+/g, '-');
  const subcat_slug = subcategory_name?.toLowerCase().replace(/\s+/g, '-');

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: category_name, href: `/${cat_slug}` },
          ...(subcategory_name ? [{ label: subcategory_name, href: `/${cat_slug}/${subcat_slug}` }] : []),
          { label: product, href: `/product/${canonicalProductSlug}-${productId}` },
        ]}
      />

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