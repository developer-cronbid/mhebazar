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

    const newArrivalsData = await newArrivalsRes.json();
    const topRatedData = await topRatedRes.json();

    return (
      <NewArrivalsAndTopSearches 
        initialNewArrivals={newArrivalsData?.products || []} 
        initialTopRated={topRatedData?.products || []}
        newArrivalsCount={newArrivalsData?.count || 0}
      />
    );
  } catch (error) {
    console.error("SSR Fetch Error Arrivals:", error);
    return <NewArrivalsAndTopSearches initialNewArrivals={[]} initialTopRated={[]} newArrivalsCount={0} />;
  }
}