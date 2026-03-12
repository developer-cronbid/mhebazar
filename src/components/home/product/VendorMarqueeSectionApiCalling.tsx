// src/components/home/VendorMarqueeSection.tsx
import VendorMarquee from '@/components/home/Marquee';
// src/components/home/VendorMarqueeSection.tsx
export default async function VendorMarqueeSection() {
    // 🔍 DEBUG: Log this to your terminal to see if it's undefined
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "localhost";

    try {
        const res = await fetch(`${baseUrl}/vendor/approved/`, {
            next: { revalidate: 3600 }
        });

        if (!res.ok) {
            console.error(`Vendor Marquee API Error: ${res.status} ${res.statusText}`);
            return <VendorMarquee initialData={[]} />;
        }

        const data = await res.json();
        // 🔍 DEBUG: See what the API actually returned in your terminal
        console.log("VENDOR DATA FETCHED:", data.results?.length);

        return <VendorMarquee initialData={data.results || []} />;
    } catch (error: any) {
        console.error("Vendor Marquee SSR Error:", error.message || error);
        return <VendorMarquee initialData={[]} />;
    }
}