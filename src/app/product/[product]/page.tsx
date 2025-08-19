// src/app/product/[product]/page.tsx

import { notFound } from 'next/navigation';
import api from '@/lib/api';
import Breadcrumb from '@/components/elements/Breadcrumb';
import ProductSection from '@/components/products/IndividualProduct';
import SparePartsFeatured from '@/components/home/SparepartsFeatured';
import VendorProducts from '@/components/elements/VendorFeaturedProducts';
import CategoryProducts from '@/components/elements/CategoryProducts';
import styles from './page.module.css';

// This function now fetches real data for better SEO
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { product: string };
  searchParams: { id: string };
}) {
  const productId = parseInt(searchParams.id, 10);

  // Validate ID early
  if (isNaN(productId)) {
    return {
      title: 'Invalid Product',
      description: 'This product could not be found.',
    };
  }

  try {
    const response = await api.get(`/products/${productId}`);
    const productName = response.data.name; // Use the actual product name from the API

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
  searchParams: { id: string };
}) {
  const { product: productSlug } = params;
  const productId = parseInt(searchParams.id, 10);

  // If the ID is not a valid number, render a 404 page
  if (isNaN(productId)) {
    notFound();
  }

  let productData;
  try {
    // Fetch data directly on the server. No useState or useEffect needed.
    const response = await api.get(`/products/${productId}`);
    productData = response.data;
  } catch (error) {
    // If the API call fails (e.g., product not found), trigger a 404 page
    console.error('Failed to fetch product:', error);
    notFound();
  }

  const { category_name, subcategory_name, name: productName } = productData;
  const cat_slug = category_name.toLowerCase().replace(/\s+/g, '-');
  const subcat_slug = subcategory_name?.toLowerCase().replace(/\s+/g, '-');

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: category_name, href: `/${cat_slug}` },
          ...(subcategory_name ? [{ label: subcategory_name, href: `/${cat_slug}/${subcat_slug}` }] : []),
          // Use the actual product name for the label for better UX
          { label: productName, href: `/product/${productSlug}?id=${productId}` },
        ]}
      />

      <ProductSection productSlug={productSlug} productId={productId} />

      {/* Section container with fade-slide animation */}
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