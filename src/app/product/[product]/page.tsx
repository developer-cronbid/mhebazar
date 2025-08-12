// src/app/product/[product]/page.tsx
import CategoryProducts from "@/components/elements/CategoryProducts";
import VendorProducts from "@/components/elements/VendorFeaturedProducts";
import SparePartsFeatured from "@/components/home/SparepartsFeatured";
import ProductSection from "@/components/products/IndividualProduct";
import Breadcrumb from "@/components/elements/Breadcrumb";
import styles from "./page.module.css"; // new CSS module

export async function generateMetadata({ params }: { params: { product: string } }) {
  const productSlug = params.product;
  const productName = productSlug
    .replace(/-/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

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
  const productId = parseInt(searchParams.id, 10);

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          { label: productSlug.replace(/-/g, " "), href: `/product/${productSlug}` },
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
