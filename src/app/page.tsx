import HomeBanner from "@/components/layout/HomeBanner";
import CategoryButtons from "@/components/home/CategoryButtons";
import MostPopular from "@/components/home/MostPopular";
import NewArrivalsAndTopSearches from "@/components/home/NewArrivalsAndTopSearches";
import SpareParts from "@/components/home/SparepartsFeatured";
import VendorProductsFeatured from "@/components/home/VendorFeatured";
import ExportProductsFeatured from "@/components/home/ExportProdcutsFeatured";
import TestimonialsCarousel from "@/components/elements/Testimonials";
import { BlogCarousel } from "@/components/home/BlogCarousal";
import Link from "next/link";
import VendorMarquee from "@/components/home/Marquee";
import SectionWrapper from "@/components/common/SectionWrapper"; // New component for animations
import ImagePopup from "@/components/common/ImagePopup";

export default async function HomePage() {
  return (
    <>
      <HomeBanner />

      <SectionWrapper className="max-w-[97vw] mx-auto">
        <CategoryButtons />
      </SectionWrapper>

      <div className="w-full bg-[#F5F7F8] py-6 md:py-8">
        <div className="max-w-[93vw] mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 justify-center items-start">
          <SectionWrapper>
            <MostPopular />
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

      {/* <ImagePopup /> */}

      <ImagePopup/>
    </>
  );
}

