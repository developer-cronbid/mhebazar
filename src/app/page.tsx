import HomeBanner from "@/components/layout/HomeBanner";
import CategoryButtons from "@/components/home/CategoryButtons";
import MostPopular from "@/components/home/MostPopular";
import NewArrivalsAndTopSearches from "@/components/home/NewArrivalsAndTopSearches";
import SpareParts from "@/components/home/SparepartsFeatured";
import VendorMarquee from "@/components/home/Marquee";
import Link from "next/link";
import SectionWrapper from "@/components/common/SectionWrapper";
import ImagePopup from "@/components/common/ImagePopup";
import dynamic from "next/dynamic"; // Import dynamic for lazy loading
import api from "@/lib/api";

// CWV FIX: Dynamically import components below the fold to improve LCP/INP
const VendorProductsFeatured = dynamic(() => import("@/components/home/VendorFeatured"));
const ExportProductsFeatured = dynamic(() => import("@/components/home/ExportProdcutsFeatured"));
const TestimonialsCarousel = dynamic(() => import("@/components/elements/Testimonials"));
const BlogCarousel = dynamic(() => import("@/components/home/BlogCarousal").then(mod => mod.BlogCarousel));


export default async function HomePage() {

// --- DATA FETCHING ---
  // We fetch this here so it's ready for the MostPopular component immediately
  let popularProducts = [];
  try {
    const response = await api.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/most_popular/`);
    popularProducts = response.data?.results || response.data || [];
  } catch (err) {
    console.error("Error fetching popular products:", err);
  }
  
  return (
    <>
      {/* CWV FIX: Ensure HomeBanner's main image uses the 'priority' prop for LCP */}
      <HomeBanner priority /> 

      <SectionWrapper className="max-w-[97vw] mx-auto">
        <CategoryButtons />
      </SectionWrapper>

      <div className="w-full bg-[#F5F7F8] py-6 md:py-8">
        <div className="max-w-[93vw] mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 justify-center items-start">
          <SectionWrapper>
            {/* These are likely above the fold, keep static */}
            <MostPopular initialData={popularProducts} />
          </SectionWrapper>
          <SectionWrapper>
            <NewArrivalsAndTopSearches />
          </SectionWrapper>
        </div>
      </div>

      <div className="max-w-[93vw] mx-auto">
        <SectionWrapper className="my-6 md:my-8">
          <SpareParts />
        </SectionWrapper>
      </div>

      <div className="w-full bg-[#F5F7F8] py-6 md:py-8">
        <div className="max-w-[93vw] mx-auto">
          <SectionWrapper>
            <VendorProductsFeatured />
          </SectionWrapper>
        </div>
      </div>

      <div className="max-w-[93vw] mx-auto">
        <SectionWrapper className="my-6 md:my-8">
          <ExportProductsFeatured />
        </SectionWrapper>
      </div>

      <div className="w-full bg-[#F5F7F8] py-6 md:py-8">
        <div className="max-w-[93vw] mx-auto">
          <SectionWrapper>
            <BlogCarousel />
          </SectionWrapper>
        </div>
      </div>

      <div className="max-w-[93vw] mx-auto">
        <SectionWrapper className="my-4 md:my-6">
          <div className="flex justify-between items-center mb-8 px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Our Brands</h2>
            <Link href="/vendor-listing" className="text-green-600 font-medium hover:underline">
              View All Brands
            </Link>
          </div>
          <div className="max-w-[93vw] mx-auto">
            <SectionWrapper className="my-4 md:my-6">
              <VendorMarquee />
            </SectionWrapper>
          </div>
        </SectionWrapper>
      </div>

      <div className="w-full bg-[#F5F7F8] py-6">
        <div className="max-w-[100vw] mx-auto">
          <SectionWrapper>
            <TestimonialsCarousel />
          </SectionWrapper>
        </div>
      </div>

      <ImagePopup/>
    </>
  );
}