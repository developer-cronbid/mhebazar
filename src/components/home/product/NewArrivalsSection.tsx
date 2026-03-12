import api from "@/lib/api";
import NewArrivalsAndTopSearches from "@/components/home/NewArrivalsAndTopSearches";

export default async function NewArrivalsSection() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.mhebazar.in/api";

  try {
    // Fetch both endpoints in parallel for maximum speed
    const [newArrivalsRes, topRatedRes] = await Promise.all([
      fetch(`${baseUrl}/products/new-arrival/`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/products/top-rated/`, { next: { revalidate: 3600 } })
    ]);

    let newArrivalsData = { products: [], count: 0 };
    let topRatedData = { products: [] };

    if (newArrivalsRes.ok) {
      newArrivalsData = await newArrivalsRes.json();
    } else {
      console.error(`New Arrivals API Error: ${newArrivalsRes.status} ${newArrivalsRes.statusText}`);
    }

    if (topRatedRes.ok) {
      topRatedData = await topRatedRes.json();
    } else {
      console.error(`Top Rated API Error: ${topRatedRes.status} ${topRatedRes.statusText}`);
    }

    return (
      <NewArrivalsAndTopSearches
        initialNewArrivals={newArrivalsData?.products || []}
        initialTopRated={topRatedData?.products || []}
        newArrivalsCount={newArrivalsData?.count || 0}
      />
    );
  } catch (error: any) {
    console.error("SSR Fetch Error Arrivals:", error.message || error);
    return <NewArrivalsAndTopSearches initialNewArrivals={[]} initialTopRated={[]} newArrivalsCount={0} />;
  }
}