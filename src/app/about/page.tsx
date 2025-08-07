import Breadcrumb from "@/components/elements/Breadcrumb";
import HomeBanner from "@/components/layout/HomeBanner";
import AboutStats from "@/components/about/AboutStats";
import Image from "next/image";
import LeadershipTeam from "@/components/about/LeadershipTeam";
import GlobalMapStats from "@/components/about/MapStats";
// import SubscriptionPlans from "@/components/elements/SubscriptionPlans";
import VendorRegistrationCard from "@/components/elements/VendorRegistrationCard";


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
      <section className="max-w-[90vw] mx-auto">
        <div className="bg-white my-4 ">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
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

        {/* HomeBanner div */}
          <HomeBanner className="rounded-lg" />

        {/* Solution div */}
        <div className="w-full flex justify-center my-8">
          <div className="w-full max-w-8xl px-2 md:px-0">
            <Image
              src="/about/image.png"
              alt="MHE Bazar One Stop"
              width={1640}
              height={1640}
              className="w-full h-auto "
              priority
            />
          </div>
        </div>
        {/* Bottom Description */}
        <div className="mt-12 bg-white rounded-xl p-6 md:p-8 mx-auto">
          <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-2">
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
          <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-2">
            In addition to the conversion kit, we also offer a wide range of
            high-quality lithium-ion batteries that are optimized for use in a
            variety of material handling equipment, including forklifts, scissors
            lifts, reach trucks, BOPTs, stackers, golf carts, cranes, and electric
            street sweepers. So far, MHE Bazar has successfully converted and
            installed a Li-ion conversion kit for all almost brands covering all
            types of MHEs.
          </p>
          <br />

          <p className="text-base md:text-lg text-gray-700 leading-relaxed">
            We are committed to helping our customers save money and improve their
            operations through the use of advanced technology, and our lithium-ion
            solutions play a crucial role in supporting Indias goal of achieving
            net-zero emissions by 2070.
          </p>
        </div>

        {/* Vision & Mission div */}
        <div className="w-full py-10 px-2 md:px-12 mt-12 rounded-2xl flex flex-col items-center">
          {/* Top Image with curved border */}
          <div className="w-full max-w-6xl mx-auto">
            <div className="overflow-hidden rounded-t-3xl rounded-b-xl shadow-lg">
              <Image
                src="/about/three.png"
                alt="MHE Bazar Vision Mission"
                width={1600}
                height={500}
                className="w-full h-[270px] md:h-[350px] object-cover"
                priority
              />
            </div>
          </div>
          {/* Vision & Mission Points */}
          <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-10 bg-[#F8F8F8] px-4 md:px-12 py-10 rounded-b-2xl -mt-8 shadow-lg">
            {/* Vision */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-5 text-gray-900">Vision</h2>
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
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-5 text-gray-900">Mission</h2>
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

        {/* About Stats div */}
        <AboutStats />

        {/* Leadership Team div */}
        <LeadershipTeam />

        {/* Global Map Stats div */}
        <GlobalMapStats />

        {/* Subscription Plan div */}
        {/* <SubscriptionPlans /> */}

        {/* Vendor Registration Card div */}
        <VendorRegistrationCard />
      </section>
    </>
  );
};

export default AboutPage;
