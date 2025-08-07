"use client";
import HomeBanner from "@/components/layout/HomeBanner";
import CategoryButtons from "@/components/home/CategoryButtons";
import MostPopular from "@/components/home/MostPopular";
import NewArrivalsAndTopSearches from "@/components/home/NewArrivalsAndTopSearches";
import SpareParts from "@/components/home/SparepartsFeatured";
import VendorProductsFeatured from "@/components/home/VendorFeatured";
import ExportProductsFeatured from "@/components/home/ExportProdcutsFeatured";
import TestimonialsCarousel from "@/components/elements/Testimonials";
import Marquee from "react-fast-marquee";
import { BlogCarousel } from "@/components/home/BlogCarousal";
import Image from "next/image";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link"; // Import Link for the View All Brands button

const SectionWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default function HomePage() {
  const bannerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: bannerRef,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.5]);

  return (
    <>
      <div ref={bannerRef} style={{ y, opacity }}>
        <HomeBanner />
      </div>

      <SectionWrapper className="max-w-[95vw] mx-auto py-6 md:py-8">
        <CategoryButtons />
      </SectionWrapper>

      <div className="w-full bg-[#F5F7F8] py-10 md:py-12">
        <div className="max-w-[95vw] mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 justify-center items-start px-4 md:px-0">
          <SectionWrapper>
            <MostPopular />
          </SectionWrapper>
          <SectionWrapper>
            <NewArrivalsAndTopSearches />
          </SectionWrapper>
        </div>
      </div>

      <div className="max-w-[95vw] mx-auto">
        <SectionWrapper className="my-10 md:my-12">
          <SpareParts />
        </SectionWrapper>
      </div>

      <div className="w-full bg-[#F5F7F8] py-10 md:py-12">
        <div className="max-w-[95vw] mx-auto">
          <SectionWrapper>
            <VendorProductsFeatured />
          </SectionWrapper>
        </div>
      </div>

      <div className="max-w-[95vw] mx-auto">
        <SectionWrapper className="my-10 md:my-12">
          <ExportProductsFeatured />
        </SectionWrapper>
      </div>

      <div className="w-full bg-[#F5F7F8] py-10 md:py-12">
        <div className="max-w-[95vw] mx-auto">
          <SectionWrapper>
            <BlogCarousel />
          </SectionWrapper>
        </div>
      </div>

      <div className="max-w-[95vw] mx-auto">
        <SectionWrapper className="my-8 md:my-10">
          <div className="flex justify-between items-center mb-8 px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Our Brands</h2>
            <Link href="/vendor-listing" className="text-green-600 font-medium hover:underline">
              View All Brands
            </Link>
          </div>
          <Marquee className="my-8">
            <Image src={"/logos/AEPL.png"} alt="AEP Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/Asmita.png"} alt="Asmita Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/Bolzoni1.png"} alt="Bolzoni Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/BYD Forklift.png"} alt="BYD Forklift Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/Cascade.png"} alt="Cascade Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/Godrej.png"} alt="Godrej Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/Greentech India.png"} alt="Greentech India Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/Logisnext.png"} alt="Logisnext Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/Logisnext-1.png"} alt="Logisnext-1 Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/Logisnext-2.png"} alt="Logisnext-2 Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/Logisnext-3.png"} alt="Logisnext-3 Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/Manasi Engineering.png"} alt="Manasi Engineering Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/manasi-engineering.png"} alt="Manasi Engineering Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/MHE Bazar.png"} alt="MHE Bazar Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/PHL.png"} alt="PHL Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/Speciality Urethanes Pvt Ltd.png"} alt="Speciality Urethanes Pvt Ltd Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/Stackon.png"} alt="Stackon Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/STW.png"} alt="STW Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/Tallboy.png"} alt="Tallboy Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/Troax.png"} alt="Troax Logo" width={100} height={64} className="h-16 w-auto mx-4" />
            <Image src={"/logos/Unik.png"} alt="Unik Logo" width={100} height={64} className="h-16 w-auto mx-4" />
          </Marquee>
        </SectionWrapper>
      </div>

      <div className="w-full bg-[#F5F7F8] py-10 md:py-12">
        <div className="max-w-[95vw] mx-auto">
          <SectionWrapper>
            <TestimonialsCarousel />
          </SectionWrapper>
        </div>
      </div>
    </>
  );
}