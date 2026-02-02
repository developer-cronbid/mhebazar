import api from "@/lib/api";
import VendorProductsFeatured from "@/components/home/VendorFeatured";

export default async function VendorFeaturedSection() {
  const PRODUCT_IDS = [18, 19, 20, 21, 22, 23, 24, 25, 26, 27];

  try {
    const productPromises = PRODUCT_IDS.map((id) => api.get(`/products/${id}/`));
    const responses = await Promise.allSettled(productPromises);

    const products = responses
      .filter((res) => res.status === "fulfilled")
      .map((res) => {
        const fullResponse = (res as PromiseFulfilledResult<any>).value;
        // Logic: Axios has a .data property. 
        // If your API ALSO wraps it in .data, you need fullResponse.data.data
        return fullResponse.data;
      });

    // Check your VS Code Terminal for this output:
    console.log("SERVER FETCH SUCCESS:", products.length, "items");

    return <VendorProductsFeatured initialProducts={products} />;
  } catch (error) {
    console.error("SERVER FETCH ERROR:", error);
    return null;
  }
}