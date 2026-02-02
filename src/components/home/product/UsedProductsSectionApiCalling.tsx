import api from "@/lib/api";
import ExportProductsFeatured from "@/components/home/ExportProdcutsFeatured";

export default async function UsedProductsSection() {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    try {
        const response = await api.get(`${baseUrl}/products/?type=used&limit=10`);

        const rawData = Array.isArray(response.data)
            ? response.data
            : response.data?.results ?? [];
        const formattedData = rawData.map((item: any) => ({
            ...item,
            title: item.name,
            subtitle: item.description,
            image: item.images?.[0]?.image || "/placeholder.jpg",
        }));

        console.log(`USED PRODUCTS FETCHED: ${formattedData.length} items`);

        return <ExportProductsFeatured initialData={formattedData} />;
    } catch (error) {
        console.error("Used Products Fetch Error:", error);
        return <ExportProductsFeatured initialData={[]} />;
    }
}