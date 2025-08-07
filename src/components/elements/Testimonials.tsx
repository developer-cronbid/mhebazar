"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

export default function ReviewCarousel() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  // const [read, setRead] = useState(false);

  const scrollPrev = useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", handleSelect);

    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: { key: string }) => {
      if (e.key === "ArrowLeft") {
        scrollPrev();
      } else if (e.key === "ArrowRight") {
        scrollNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [scrollPrev, scrollNext]);

  const reviews = [
    {
      name: "Mr. Manohari Lal",
      role: "M/s. A.M. Enterprises",
      avatar:
        "https://www.mhebazar.in/css/newassets/imgs/page/testimonials/photo/M_s. AM Enterprises, Mr. Manohari Lal.png",
      fallback: "ML",
      content: (
        <div>
          <p>
            We have been
            <span className="font-semibold">
              dealing with Greentech India &amp; MHE Bazar for more than a year
            </span>{" "}
            now, and we are using their supplied{" "}
            <span className="font-semibold">
              BYD Forklifts, MHE Spares, and AMC Service.
            </span>
          </p>
          <p>
            We are{" "}
            <span className="font-semibold">
              very much happy with the service extended by them.
            </span>{" "}
            we are mostly in touch with their representative Mr. Paras Nath
            &amp; Mr. Mahesh Jumde, and they are also very prompt in their work,{" "}
            <span className="font-semibold">
              We are a Rental Service Provider for MHE Equipment
            </span>{" "}
            and we have supplied forklifts to Kolkata customers if suppose any
            support is required from Greentech India or MHE Bazar Team, so we
            just need to inform to the team they will take care of all other
            things without any interruption.
          </p>

          <p>
            So as a MHE Rental provider the same sort of service we required and
            that we are getting constantly.We are expecting the same support in
            future also.
          </p>
        </div>
      ),
    },
    {
      name: "Mr. Nitish Hirve",
      role: "Operations Head",
      avatar:
        "https://www.mhebazar.in/css/newassets/imgs/page/testimonials/photo/M_s. Asmita Engineering, Mr. Nitish Hirve.png",
      fallback: "NH",
      content: (
        <div>
          <p>
            <span className="font-semibold">Asmita Engineering</span> is engaged
            in manufacturing, supplying and exporting a gamut of Material
            Handling Equipment. The range we offer is acknowledged by our
            clients&apos; for its high performance, high efficiency, and sturdy
            construction
          </p>

          <p>
            &quot;We recently acquired{" "}
            <span className="font-semibold">
              Greentech&apos;s Lithium-Ion Electric Hand Pallet Truck (eHPT)
            </span>{" "}
            2 Units and it&apos;s been a game-changer for our MHE operations and we
            supplied to our end customers also. Its{" "}
            <span className="font-semibold">
              efficiency and durability have exceeded our expectations, allowing
              us to enhance productivity while reducing environmental impact.
            </span>{" "}
            A stellar addition to our pioneering fleet!&quot;
          </p>

          <p>Highly recommended for your Material handling solution…!</p>
        </div>
      ),
    },
    {
      name: "Mr. Pathan Nawaz",
      role: "M/s. R S Global",
      avatar:
        "https://www.mhebazar.in/css/newassets/imgs/page/testimonials/photo/M_s. R S Global, Mr. Pathan Nawaz.png",
      fallback: "NH",
      content: (
        <div>
          <p>
            We acquired from{" "}
            <span className="font-semibold">
              Greentech India Lithium-Ion Battery Powered eHPT.
            </span>{" "}
            The Greentech Lithium-Ion eHPT technology is{" "}
            <span className="font-semibold">a game-changer,</span> offering
            <span className="font-semibold">
              impressive efficiency and longer run times.
            </span>{" "}
            Our team has been{" "}
            <span className="font-semibold">
              happy with its quiet operation, reducing all kinds of pollution
            </span>{" "}
            in our workspace. The{" "}
            <span className="font-semibold">
              eHPT&apos;s precise maneuverability and ergonomic design have
              significantly increased our productivity and operator comfort.
            </span>
          </p>

          <p>
            {" "}
            Additionally, the{" "}
            <span className="font-semibold">
              reduced maintenance costs and eco-friendliness of the lithium-ion
              battery and Extra Battery option are remarkable benefits
            </span>{" "}
            for 3-shift operation.
          </p>

          <p>
            Greentech India&apos;s{" "}
            <span className="font-semibold">
              exemplary service and expertise made the purchasing process
              seamless.
            </span>{" "}
            We{" "}
            <span className="font-semibold">
              highly recommend purchasing MHE&apos;s from Greentech India
            </span>{" "}
            Material Handling LLP for their{" "}
            <span className="font-semibold">
              exceptional products and outstanding customer support.
            </span>
          </p>
        </div>
      ),
    },
    {
      name: "Mr. Perumal",
      role: "M/s. Prime Forklifters Pvt. Ltd.",
      avatar:
        "https://www.mhebazar.in/css/newassets/imgs/page/testimonials/e-forklifters-pvt-ltd-mr-perumal.webp",
      fallback: "PN",
      content: (
        <div>
          <p>
            <span className="font-semibold">
              first BYD forklift from Greentech India Material Handling LLP.
            </span>
            We acquired the Now after watching the performance of the first
            equipment, we have already purchased more than 10 BYD equipment.
            Greentech India Material Handling LLP is a very supportive company
            with excellent response for service and spare parts support.
          </p>

          <p>
            We are completely{" "}
            <span className="font-semibold">
              satisfied with the performance of the equipment and the support
              from Greentech India
            </span>{" "}
            Material Handling LLP.
          </p>

          <p>
            <span className="font-semibold">
              Being in the field of MHE for more than 35 years we are very happy
              to own BYD in our fleet which at present is one of the best
              Lithium-Ion powered forklifts
            </span>{" "}
            in the world for the price sold in India. The BYD Lithium-Ion
            battery forklift&apos;s technology is a game-changer, offering
            <span className="font-semibold">
              impressive efficiency and longer run times.
            </span>{" "}
            Additionally, the{" "}
            <span className="font-semibold">
              reduced maintenance costs and eco-friendliness
            </span>{" "}
            of the lithium-ion battery are remarkable benefits.
          </p>

          <p>
            We are now in the process of procuring{" "}
            <span className="font-semibold">
              many of our Rental replacement equipment from BYD through
              Greentech India
            </span>{" "}
            Material Handling LLP, their service and expertise make our
            purchasing process seamless.
          </p>

          <p>
            We{" "}
            <span className="font-semibold">
              highly recommend purchasing Forklifts or other MHEs from Greentech
              India
            </span>{" "}
            Material Handling LLP for their exceptional product knowledge and
            outstanding customer support.
          </p>
        </div>
      ),
    },
    {
      name: "Customer",
      role: "",
      avatar:
        "https://www.mhebazar.in/css/newassets/imgs/page/testimonials/ting-engineers-mr-prasad-dhaniwale.webp",
      fallback: "PN",
      content: (
        <div>
          <p>
            I am writing to share{" "}
            <span className="font-semibold">
              my positive experience with the MHE Bazar Lithium-Ion Battery,
            </span>{" "}
            which we purchased and using.
          </p>

          <p>
            <span className="font-semibold">
              Performance: ⭐⭐⭐⭐⭐
              <br />
            </span>
            The battery&apos;s performance has been exceptional. It{" "}
            <span className="font-semibold">
              consistently provides a long-lasting charge.
            </span>
          </p>
          <p>
            <span className="font-semibold">
              Durability: ⭐⭐⭐⭐⭐
              <br />
            </span>
            One of the standout features of this battery is its remarkable
          </p>
          <p>
            {" "}
            durability. It has withstood the rigors of our warehouse
            environment, including heavy usage and challenging terrain.
          </p>
          <p>
            {" "}
            Eco-Friendly: ⭐⭐⭐⭐⭐
            <br />
            The lithium-ion technology of this battery not only extends its
            lifespan but also aligns with our commitment to sustainability.
          </p>
          <p>
            {" "}
            Overall: ⭐⭐⭐⭐⭐
            <br />
            MHE Bazar Lithium-Ion Battery has exceeded our expectations. Its
            outstanding performance, durability, and eco-friendliness have made
            it an invaluable addition to our equipment.{" "}
            <span className="font-semibold">
              We wholeheartedly recommend it to anyone seeking a reliable and
              efficient power solution
            </span>{" "}
            for their material handling needs.
          </p>

          <p>
            Thank you MHE Bazar for providing us with a product that has
            significantly improved our end-customer operations and contributed
            to our success!
          </p>
        </div>
      ),
    },
    {
      name: "Customer",
      role: "",
      avatar:
        "https://www.mhebazar.in/css/newassets/imgs/page/testimonials/s-prt-enterprises-mr-ram-thanash.webp",
      fallback: "PN",
      content: (
        <div>
          <p>
            We offer a
            <span className="font-semibold">
              wide range of metal finishing services across Tamil Nadu including
              Black oxide coating
            </span>{" "}
            (blackening), Manganese phosphating, Zinc phosphating, Molybdenum di
            sulfide coating, etc.,
          </p>

          <p>
            We purchased{" "}
            <span className="font-semibold">
              2 Ton Semi-Electric Stacker from Greentech India Material
            </span>
            Handling LLP last financial year, from day one, it has demonstrated
            exceptional performance and reliability. Its ease of use and
            intuitive controls have streamlined our material handling processes,
            significantly increasing productivity while reducing manual labor
            and fatigue among our employees.
          </p>
        </div>
      ),
    },
    {
      name: "Customer",
      role: "",
      avatar:
        "https://www.mhebazar.in/css/newassets/imgs/page/testimonials/r-mills-pvt-ltd-mr-bharat-ganesh.webp",
      fallback: "PN",
      content: (
        <div>
          <p>
            We have taken a{" "}
            <span className="font-semibold">
              Hyundai Forklift on Rental from Greentech India
            </span>{" "}
            Material Handling LLP, their team took the time to understand our
            specific requirements and recommended the Hyundai Forklift on Rental
            as the perfect fit for our business.
          </p>

          <p>
            {" "}
            This machine comes with an{" "}
            <span className="font-semibold">
              MHE Bazar Lithium-Ion Battery,
            </span>{" "}
            this battery
            <span className="font-semibold">
              helps to reach our target production
            </span>{" "}
            daily, and the{" "}
            <span className="font-semibold">
              competitive rental package and transparent pricing made the
              decision even more appealing.
            </span>
            We appreciate the environmental responsibility of Hyundai Forklifts,
            which aligns with our values. In a nutshell,{" "}
            <span className="font-semibold">
              Greentech India&apos;s Hyundai forklift has exceeded our expectations,
            </span>{" "}
            making them our{" "}
            <span className="font-semibold">
              top choice for material handling rental solutions.
            </span>
          </p>
        </div>
      ),
    },
    {
      name: "Customer",
      role: "",
      avatar:
        "https://www.mhebazar.in/css/newassets/imgs/page/testimonials/mbey-developers-mr-manoj-shekhawat.webp",
      fallback: "PN",
      content: (
        <div>
          <p>
            <span className="font-semibold">
              Greentech is a fantastic organization as each team member has a
              zeal to go the extra mile to provide their best every time.
            </span>{" "}
            The{" "}
            <span className="font-semibold">
              key impetus for growth is product innovation
            </span>
            and team Greentech has{" "}
            <span className="font-semibold">
              meticulously researched and identified the current needs of the
              MHE industry.
            </span>
          </p>

          <p>
            Hence they came up with{" "}
            <span className="font-semibold">
              MHE Bazar Lithium-ion Battery solutions for maximum uptime of
              machines
            </span>{" "}
            as they are virtually maintenance-free. They have resurrected the
            industry.
          </p>

          <p>
            {" "}
            We have{" "}
            <span className="font-semibold">
              never seen time or day of the week to connect and get support
            </span>
            from Greentech.{" "}
            <span className="font-semibold">
              Mr. Rohit Kumar with his smile and technical prowess resolves all
              issues calmly. Mr. Ullhas Makeshwar &amp; Mr. Manik Thapar always
              came up with their impeccable suggestions
            </span>{" "}
            which ultimately resulted in being very fruitful and viable.
          </p>

          <p>
            <span className="font-semibold">They are the &quot;Man of Mettle&quot;.</span>{" "}
            We are perfectly content with all the business we had with them and
            the same also recommend the other MHE users.
          </p>
        </div>
      ),
    },
    {
      name: "Mr. Rajappa ",
      role: "Sunray Material Handling Pvt. Ltd.",
      avatar:
        "https://www.mhebazar.in/css/newassets/imgs/page/testimonials/rial-handling-pvt-ltd-mr-rajappa.webp",
      fallback: "PN",
      content: (
        <div>
          <p>
            One of our customers asked for BOPT on a rental basis and we decided
            to supply it with Lithium-Ion Batteries, considering its{" "}
            <span className="font-semibold">
              benefits like opportunity charging, Maintenance free, Emission
              Free and long life, etc…
            </span>
          </p>

          <p>
            {" "}
            On supply of
            <span className="font-semibold">
              {" "}
              6 Nos BOPT with 25V 200Ah Li-Ion Battery
            </span>{" "}
            one year back, till now we are free from its maintenance and also
            opportunity charging gives the benefit to operate the BOPT more
            without keeping it idle for charging. It is more beneficial to our
            customers also and for us also as providing equipment on rental.
          </p>

          <p>
            <span className="font-semibold">
              We are very happy with the MHE Bazar Li-Ion battery,
            </span>{" "}
            and the information provided by the salesperson and the service team
            was also very cooperative and guided us to install it in our
            equipment.
          </p>

          <p>
            {" "}
            Mr. Ulhas and Mr. Manik are our friends and we will definitely work
            with them again for our next requirement for{" "}
            <span className="font-semibold">
              MHE Bazar Lithium-ion Battery.
            </span>
            <br />
            And again, I will request to all who are using MHEs with Lead-Acid
            batteries that they can convert their MHEs into Li-ion Battery
            Operated with a very small investment as this technology is very
            good for the environment and operational use also so{" "}
            <span className="font-semibold">
              do this for Green India and Net Zero Nation.
            </span>
          </p>
        </div>
      ),
    },
    {
      name: "Mrs. Divya Roy,",
      role: "M/s. Watrana Traction Pvt. Ltd.",
      avatar:
        "https://www.mhebazar.in/css/newassets/imgs/page/testimonials/a-traction-pvt-ltd-mrs-divya-roy.webp",
      fallback: "PN",
      content: (
        <div>
          <p>
            We acquired Spare parts from Greentech India Material Handling LLP.
            Our team has been happy with its quiet operation, especially in
            after sales and service.
          </p>

          <p>
            {" "}
            We would like to agree on the below listed points as excellent
            credentials:-
            <br />
            1. Communication such as Prompt Response
            <br />
            2. Reliability over Certainty
            <br />
            3. Delivery of Products
            <br />
            4. Quality of Product
            <br />
            5. Value of Vendor
          </p>

          <p>
            {" "}
            Greentech India&apos;s exemplary service and expertise made the
            purchasing process seamless.
          </p>

          <p>
            We highly recommend purchasing MHE Products and spare parts &amp;
            services from Greentech India Material Handling LLP for their
            exceptional products and outstanding customer support.
          </p>
        </div>
      ),
    },
    {
      name: "Customer",
      role: "",
      avatar:
        "https://www.mhebazar.in/css/newassets/imgs/page/testimonials/mr-jayanta-dutta-mac-spares.webp",
      fallback: "PN",
      content: (
        <div>
          <p>
            Currently, in the Indian market scenario for Material Handling
            Equipment, Greentech India Material Handling LLP &amp; MHE Bazar are
            working together for the Green Revolution &amp; they are big
            milestones given for all of us.
          </p>

          <p>
            {" "}
            For the last 2 years, we have been using their 5 numbers MHE Bazar
            Lithium-Ion Battery conversion kits (Li-Ion batteries using for
            Forklifts, BOPTs &amp; Tow Truck), and as a result, we have
            benefited from maximum uptime of machines maintenance-free battery,
            we have all been in touch and working with these organizations,
            especially Thanks to the good management and service team, they are
            always kind support &amp; cooperation with our MAC SPARES TEAM.
          </p>

          <p>
            We expect that in Future Green Revolution and other upcoming
            technology, all works will come together in the Eastern Part of
            India.
          </p>
        </div>
      ),
    },
    {
      name: "Mr. Xavier",
      role: "M/s. Asian Engineering Group",
      avatar:
        "https://www.mhebazar.in/css/newassets/imgs/page/testimonials/engineering-group-mr-benzie-xavier.webp",
      fallback: "PN",
      content: (
        <div>
          <p>
            BYD Lithium-Ion Forklift we acquired from Greentech India Material
            Handling LLP.
          </p>

          <p>
            {" "}
            The BYD Lithium-Ion Battery Forklift&apos;s technology is a game-changer,
            offering impressive efficiency and longer run times. Our team has
            been happy with its quiet operation, reducing pollution in our
            workspace. The forklift&apos;s precise maneuverability and ergonomic
            design have significantly increased our productivity and operator
            comfort.
          </p>

          <p>
            {" "}
            Additionally, the lithium-ion battery&apos;s reduced maintenance costs
            and eco-friendliness are remarkable benefits. Greentech India&apos;s
            exemplary service and expertise made the purchasing process
            seamless.
          </p>

          <p>
            {" "}
            We highly recommend purchasing Forklifts and other MHEs from
            Greentech India Material Handling LLP for their exceptional products
            and outstanding customer support.
          </p>
        </div>
      ),
    },
  ];

  const getCardStyles = (index: number) => {
    const isActive = current === index;
    const isPrev = (current - 1 + reviews.length) % reviews.length === index;
    const isNext = (current + 1) % reviews.length === index;

    if (isActive) {
      return {
        transform: 'scale(1.05)',
        opacity: 1,
        zIndex: 10,
        backgroundColor: 'white',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
      };
    } else if (isPrev || isNext) {
      return {
        transform: 'scale(0.9)',
        opacity: 0.7,
        zIndex: 5,
        backgroundColor: '#f8f9fa',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      };
    } else {
      return {
        transform: 'scale(0.8)',
        opacity: 0.4,
        zIndex: 1,
        backgroundColor: '#f1f3f4',
        boxShadow: 'none',
      };
    }
  };

  return (
    <section className="w-full overflow-hidden bg-white py-16 font-general">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-12 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-black">
            Testimonials
          </h2>
          <a href="#" className="text-green-600 text-sm hover:underline">
            View more
          </a>
        </div>

        <div className="relative">
          <Carousel
            className="w-full"
            setApi={setApi}
            opts={{
              align: "center",
              loop: true,
            }}>
            <CarouselContent className="flex items-center">
              {reviews.map((review, index) => {
                const cardStyles = getCardStyles(index);
                const isActive = current === index;

                return (
                  <CarouselItem
                    key={index}
                    className="basis-full md:basis-1/3 flex justify-center py-12">
                    <div
                      className="w-full mx-2 rounded-lg p-6 transition-all duration-500 ease-out border"
                      style={cardStyles}>

                      {/* Quote icon */}
                      <div className="mb-4">
                        <svg width="32" height="24" viewBox="0 0 32 24" fill="none" className="text-gray-400">
                          <path d="M0 12.8V24h11.2V12.8H5.6c0-3.11 2.53-5.6 5.6-5.6V0C4.98 0 0 4.98 0 12.8zM20.8 12.8V24H32V12.8h-5.6c0-3.11 2.53-5.6 5.6-5.6V0c-6.22 0-11.2 4.98-11.2 12.8z" fill="currentColor" />
                        </svg>
                      </div>

                      {/* Content */}
                      <div className={`mb-6 text-gray-700 text-sm leading-relaxed ${isActive ? 'line-clamp-4' : 'line-clamp-4'}`}>
                        {typeof review.content === 'string' ? (
                          <p>{review.content}</p>
                        ) : (
                          <div className="space-y-2">
                            {review.content.props.children.slice(0, isActive ? undefined : 2)}
                          </div>
                        )}
                      </div>

                      {/* User info */}
                      <div className="flex items-center">
                        <Avatar className="h-12 w-12 rounded-full border-2 border-gray-200">
                          <AvatarImage src={review.avatar} alt={review.name} />
                          <AvatarFallback className="bg-gray-200 text-gray-600 text-sm font-medium">
                            {review.fallback}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <h3 className="text-sm font-semibold text-black">
                            {review.name}
                          </h3>
                          {review.role && (
                            <p className="text-xs text-gray-500">
                              {review.role}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Read More Dialog */}
                      {(
                        <div className="mt-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <button className="text-green-600 text-sm hover:underline">
                                Read More
                              </button>
                            </DialogTrigger>
                            <DialogContent className="bg-white w-full max-w-2xl ">
                              <div className="mb-4 ">
                                <svg width="32" height="24" viewBox="0 0 32 24" fill="none" className="text-gray-400 mb-4">
                                  <path d="M0 12.8V24h11.2V12.8H5.6c0-3.11 2.53-5.6 5.6-5.6V0C4.98 0 0 4.98 0 12.8zM20.8 12.8V24H32V12.8h-5.6c0-3.11 2.53-5.6 5.6-5.6V0c-6.22 0-11.2 4.98-11.2 12.8z" fill="currentColor" />
                                </svg>
                                <div className="mb-6 text-gray-700 text-sm leading-relaxed">
                                  {review.content}
                                </div>
                                <div className="flex items-center">
                                  <Avatar className="h-12 w-12 rounded-full border-2 border-gray-200">
                                    <AvatarImage src={review.avatar} alt={review.name} />
                                    <AvatarFallback className="bg-gray-200 text-gray-600 text-sm font-medium">
                                      {review.fallback}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="ml-3">
                                    <h3 className="text-sm font-semibold text-black">
                                      {review.name}
                                    </h3>
                                    {review.role && (
                                      <p className="text-xs text-gray-500">
                                        {review.role}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>

          {/* Pagination dots */}
          <div className="flex justify-center mt-8 space-x-2">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${current === index
                    ? 'bg-[#5CA131]'
                    : index === 1
                      ? 'bg-gray-400'
                      : 'bg-gray-300'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none">
            <button
              onClick={scrollPrev}
              className="pointer-events-auto rounded-full bg-white p-3 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-200"
              aria-label="Previous slide">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={scrollNext}
              className="pointer-events-auto rounded-full bg-white p-3 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-200"
              aria-label="Next slide">
              <ArrowRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}