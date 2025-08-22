'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Breadcrumb from "@/components/elements/Breadcrumb";
import HomeBanner from "@/components/layout/HomeBanner";
import AboutStats from "@/components/about/AboutStats";
import Image from "next/image";
import LeadershipTeam from "@/components/about/LeadershipTeam";
import GlobalMapStats from "@/components/about/MapStats";
import VendorRegistrationCard from "@/components/elements/VendorRegistrationCard";

const SectionWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const AboutPage = () => {
  return (
    <>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "About Us", href: "/about" },
        ]}
      />
      
      {/* Top About div */}
      <SectionWrapper>
        <section className="bg-white py-6">
          <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
            <div className="mb-4">
              <h1 className="text-3xl md:text-2xl font-bold mb-4 text-gray-900">
                About MHE Bazar
              </h1>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                MHE Bazar is an online platform that provides a{" "}
                <span className="font-semibold text-[#6FCF97]">
                  One-Stop Solution
                </span>{" "}
                for complete material handling equipment needs. Whether you are
                looking to buy or rent new or used equipment or need spare parts or
                services, MHE Bazar has you covered. Our website is a B2B and B2C
                multi-vendor e-commerce portal that allows sellers to showcase their
                products and services, and buyers to find what they need at
                competitive prices.
              </p>
            </div>
          </div>
        </section>
      </SectionWrapper>

      {/* HomeBanner div */}
      <HomeBanner />
      
      {/* Solution div */}
      <SectionWrapper>
        <section>
          <div className="max-w-12xl mx-auto px-4 mt-12 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold m-12  text-gray-900">
              The portal is having the complete <br /> solution for MHE like:
            </h2>
            <div className="text-center">
              <Image
                src="/about/image.png"
                alt="MHE Bazar One Stop"
                width={1140}
                height={1140}
                className="w-full h-auto mx-auto "
                priority
              />
            </div>
          </div>
        </section>
      </SectionWrapper>

      {/* Bottom Description */}
      <SectionWrapper>
        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p>
              MHE Bazar is part of Greentech India Material Handling LLP (GTIMH), a
              company dedicated to providing top-quality solutions for material
              handling in various industries. One of our most popular offerings is
              the Lithium-Ion Conversion Kit for Lead-Acid Batteries. This product
              allows you to upgrade your lead-acid batteries to more efficient and
              cost-effective lithium-ion batteries, offering superior performance, a
              longer lifespan, fast charging, more productivity, and requiring less
              maintenance.
            </p>
            <br />
            <p>
              In addition to the conversion kit, we also offer a wide range of
              high-quality lithium-ion batteries that are optimized for use in a
              variety of material handling equipment, including forklifts, scissors
              lifts, reach trucks, BOPTs, stackers, golf carts, cranes, and electric
              street sweepers. So far, MHE Bazar has successfully converted and
              installed a Li-ion conversion kit for all almost brands covering all
              types of MHEs.
            </p>
            <br />
            <p>
              We are committed to helping our customers save money and improve their
              operations through the use of advanced technology, and our lithium-ion
              solutions play a crucial role in supporting India&apos;s goal of achieving
              net-zero emissions by 2070.
            </p>
          </div>
        </section>
      </SectionWrapper>
      
      <SectionWrapper>
        <section className="w-full bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl overflow-hidden mb-8">
              <div className="relative w-full h-72 md:h-96">
                <Image
                  src="/about/three.jpg"
                  alt="MHE Bazar Vision Mission"
                  layout="fill"
                  objectFit="cover"
                  priority
                />
              </div>
            </div>
            <div className="md:p-12 lg:p-16 rounded-3xl grid md:grid-cols-2 gap-10 md:gap-16">
              {/* Vision */}
              <div> 
                <h2 className="text-3xl font-bold mb-5 text-gray-900">Our Vision</h2>
                <ul className="list-disc pl-6 space-y-3 text-lg text-gray-800">
                  <li>
                    To be the leading provider of material handling solutions in
                    India.
                  </li>
                  <li>
                    To be the best overall partner supplier for all our clients.
                  </li>
                  <li>To empower every employee to reach their full potential.</li>
                  <li>
                    To maintain sustained profitability through honesty, integrity,
                    and ethical practices.
                  </li>
                </ul>
              </div>
              {/* Mission */}
              <div>
                <h2 className="text-3xl font-bold mb-5 text-gray-900">Our Mission</h2>
                <ul className="list-disc pl-6 space-y-3 text-lg text-gray-800">
                  <li>
                    To provide comprehensive solutions for all material handling
                    needs, including equipment, accessories, spare parts, service,
                    attachments, and training
                  </li>
                  <li>
                    To foster a culture of excellence, urgency, and customer focus
                    through the delivery of value, innovative solutions, and
                    exceptional service.
                  </li>
                  <li>
                    To continuously strive to be the best in all that we do, with a
                    passion and determination to succeed.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </SectionWrapper>

      {/* About Stats div */}
      <SectionWrapper>
        <section className="bg-white">
          <AboutStats />
        </section>
      </SectionWrapper>

      {/* Leadership Team div */}
      <SectionWrapper>
        <section className="bg-gray-50">
          <LeadershipTeam />
        </section>
      </SectionWrapper>

      {/* Global Map Stats div */}
      <SectionWrapper>
        <section className="bg-white">
          <GlobalMapStats />
        </section>
      </SectionWrapper>

      {/* Vendor Registration Card div */}
      <SectionWrapper>
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <VendorRegistrationCard />
          </div>
        </section>
      </SectionWrapper>
    </>
  );
};

export default AboutPage;