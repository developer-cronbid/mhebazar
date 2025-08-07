// src/app/product/[product]/page.tsx
import CategoryProducts from "@/components/elements/CategoryProducts";
import VendorProducts from "@/components/elements/VendorFeaturedProducts";
import SparePartsFeatured from "@/components/home/SparepartsFeatured";
import ProductSection from "@/components/products/IndividualProduct";
// import ReviewSection from "@/components/products/Reviews"; // This import is now handled within IndividualProduct.tsx

// Define the generateMetadata function for dynamic metadata
export async function generateMetadata({ params }: { params: { product: string } }) {
  const productSlug = params.product;
  // In a real application, you would fetch the product data here to get
  // the actual meta_title and meta_description.
  // For now, we'll use a placeholder or derive from slug.

  // NOTE: Direct API call from server components might be needed here
  // if you want to set dynamic metadata based on fetched product data.
  // For this example, we'll keep it simple as the client component fetches.
  // If you need real SEO, this part requires server-side data fetching.

  const productName = productSlug.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return {
    title: `${productName} - MHE Product Details`,
    description: `Detailed information about ${productName} and customer reviews.`,
  };
}

export default async function IndividualProductPage({ 
  params,
  searchParams,
}: {
  params: { product: string };
  searchParams: { id: string };
}) {
  const { product: productSlug } = params;
  // Ensure productId is always a number for consistency
  const productId = parseInt(searchParams.id, 10); // Get the ID from the URL query and parse as integer

  return (
    <>
      {/* ProductSection will fetch its own data based on productSlug and productId */}
      {/* ReviewSection is now placed within IndividualProduct.tsx */}
      <ProductSection productSlug={productSlug} productId={productId} />

      <SparePartsFeatured />

      <VendorProducts currentProductId={productId} />

      <CategoryProducts currentProductId={productId} />
    </>
  );
}