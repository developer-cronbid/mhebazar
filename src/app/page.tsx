import HomeBanner from "@/components/layout/HomeBanner";
import CategoryButtons from "@/components/home/CategoryButtons";
import NewArrivalsAndTopSearches from "@/components/home/NewArrivalsAndTopSearches";
import VendorMarqueeSection from "@/components/home/product/VendorMarqueeSectionApiCalling";
import Link from "next/link";
import SectionWrapper from "@/components/common/SectionWrapper";
import ImagePopup from "@/components/common/ImagePopup";
import SparePartsSection from "@/components/home/product/SparePartsSectionApiCalling";
import VendorFeaturedsection from "@/components/home/product/VendorFeaturedApiCalling";
import UsedProductsSection from "@/components/home/product/UsedProductsSectionApiCalling";
import { Suspense } from "react";
import  TestimonialsCarousel from "@/components/elements/Testimonials";
import { BlogCarousel } from "@/components/home/BlogCarousal";
import MostPopularSection from "@/components/home/product/MostPopularSection";


export default async function HomePage() {
  

  return (
    <>
      {/* CWV FIX: Ensure HomeBanner's main image uses the 'priority' prop for LCP */}
      <HomeBanner priority />

      <SectionWrapper className="max-w-[97vw] mx-auto">
        <CategoryButtons />
      </SectionWrapper>

      <div className="w-full bg-[#F5F7F8] py-6 md:py-8">
        <div className="max-w-[93vw] mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 justify-center items-start">
          <Suspense>
            {/* These are likely above the fold, keep static */}
            <MostPopularSection />
          </Suspense>
          <Suspense>
            <NewArrivalsAndTopSearches />
          </Suspense>
        </div>
      </div>

      <div className="max-w-[93vw] mx-auto">
        <Suspense>
          <SparePartsSection />
        </Suspense>
      </div>

      <div className="w-full bg-[#F5F7F8] py-6 md:py-8">
        <div className="max-w-[93vw] mx-auto">
         <Suspense>
            <VendorFeaturedsection />
          </Suspense>
        </div>
      </div>

      <div className="max-w-[93vw] mx-auto">
        <Suspense>
          <UsedProductsSection />
        </Suspense>
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
            <Suspense>
              <VendorMarqueeSection />
            </Suspense>
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

      <ImagePopup />
    </>
  );
}