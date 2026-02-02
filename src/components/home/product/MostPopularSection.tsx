import api from "@/lib/api";
import MostPopular from "@/components/home/MostPopular";

export default async function MostPopularSection() {
  // Using a fallback URL for safety during Server Side Rendering
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.mhebazar.in/api";

  try {
    // 1. Fetch data directly on the server
    const response = await api.get(`${baseUrl}/products/most_popular/`, {
       // Optional: Cache this specific request for 1 hour to make it instant
       // next: { revalidate: 3600 } 
    });

    const apiProducts = response.data?.results || response.data || [];

    // 2. Pass the data directly into your CSR component
    return <MostPopular initialData={apiProducts} />;
    
  } catch (error) {
    console.error("Most Popular SSR Fetch Error:", error);
    // Return the component with empty array to maintain layout height (CLS fix)
    return <MostPopular initialData={[]} />;
  }
}