import api from "@/lib/api";
import SparePartsFeatured from "@/components/home/SparepartsFeatured";

export default async function SparePartsSection() {
  try {
    const res = await api.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/`, {
      params: { category: 18, limit: 10 },
    });
    
    const spareParts = res.data?.results || [];

    return <SparePartsFeatured initialData={spareParts} />;
  } catch (error) {
    console.error("Spare Parts Fetch Error:", error);
    return <SparePartsFeatured initialData={[]} />;
  }
}