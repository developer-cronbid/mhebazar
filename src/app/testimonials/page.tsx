"use client";

import { useState, useMemo, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Star, ChevronDown, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import React from "react";

// --- Testimonial Data ---
// Re-ordered to prioritize Perumal, Xavier, and Rajappa
const reviews = [
  // Perumal - ID 4
  {
    id: 4,
    name: "Mr. Perumal",
    role: "M/s. Prime Forklifters Pvt. Ltd.",
    avatar:
      "/css/newassets/imgs/page/testimonials/e-forklifters-pvt-ltd-mr-perumal.webp",
    fallback: "PN",
    rating: 5,
    category: "MHE Equipment",
    date: "2023-04-05",
    tags: ["BYD forklift", "Lithium-Ion", "Rental Replacement", "Customer Support"],
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
  // Xavier - ID 12
  {
    id: 12,
    name: "Mr. Xavier",
    role: "M/s. Asian Engineering Group",
    avatar:
      "/css/newassets/imgs/page/testimonials/engineering-group-mr-benzie-xavier.webp",
    fallback: "PN",
    rating: 5,
    category: "MHE Equipment",
    date: "2023-12-05",
    tags: ["BYD Lithium-Ion Forklift", "Efficiency", "Eco-friendliness"],
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
  // Rajappa - ID 9
  {
    id: 9,
    name: "Mr. Rajappa",
    role: "Sunray Material Handling Pvt. Ltd.",
    avatar:
      "/css/newassets/imgs/page/testimonials/rial-handling-pvt-ltd-mr-rajappa.webp",
    fallback: "PN",
    rating: 5,
    category: "Battery Technology",
    date: "2023-09-22",
    tags: ["BOPT", "Lithium-Ion Batteries", "Maintenance Free", "Green India"],
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
  // All other reviews
  {
    id: 1,
    name: "Mr. Manohari Lal",
    role: "M/s. A.M. Enterprises",
    avatar:
      "/css/newassets/imgs/page/testimonials/photo/M_s. AM Enterprises, Mr. Manohari Lal.png",
    fallback: "ML",
    rating: 5,
    category: "MHE Equipment",
    date: "2023-01-15",
    tags: ["BYD Forklifts", "MHE Spares", "AMC Service", "Rental Service"],
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
    id: 2,
    name: "Mr. Nitish Hirve",
    role: "Operations Head",
    avatar:
      "/css/newassets/imgs/page/testimonials/photo/M_s. Asmita Engineering, Mr. Nitish Hirve.png",
    fallback: "NH",
    rating: 5,
    category: "Electric Equipment",
    date: "2023-02-20",
    tags: ["Asmita Engineering", "Lithium-Ion", "Electric Hand Pallet Truck", "eHPT"],
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
    id: 3,
    name: "Mr. Pathan Nawaz",
    role: "M/s. R S Global",
    avatar:
      "/css/newassets/imgs/page/testimonials/photo/M_s. R S Global, Mr. Pathan Nawaz.png",
    fallback: "PN",
    rating: 5,
    category: "Battery Technology",
    date: "2023-03-10",
    tags: ["Lithium-Ion Battery", "eHPT", "Reduced Pollution", "Ergonomic Design"],
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
    id: 5,
    name: "Mr. Prasad Dhaniwale",
    role: "M/s. Novel Lifting Engineers",
    avatar:
      "/css/newassets/imgs/page/testimonials/ting-engineers-mr-prasad-dhaniwale.webp",
    fallback: "PN",
    rating: 5,
    category: "Battery Technology",
    date: "2023-05-18",
    tags: ["MHE Bazar", "Lithium-Ion Battery", "Performance", "Durability", "Eco-Friendly"],
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
    id: 6,
    name: "Mr Ram Thanash",
    role: "M/s. PRT Enterprises Pvt. Ltd.",
    avatar:
      "/css/newassets/imgs/page/testimonials/s-prt-enterprises-mr-ram-thanash.webp",
    fallback: "PN",
    rating: 4,
    category: "Electric Equipment",
    date: "2023-06-01",
    tags: ["Metal finishing", "Semi-Electric Stacker", "Productivity"],
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
    id: 7,
    name: "Mr. Bharat Ganesh",
    role: "M/s. venkraft Paper Mills Pvt. Ltd.",
    avatar:
      "/css/newassets/imgs/page/testimonials/r-mills-pvt-ltd-mr-bharat-ganesh.webp",
    fallback: "PN",
    rating: 5,
    category: "MHE Equipment",
    date: "2023-07-08",
    tags: ["Hyundai Forklift", "Rental", "Lithium-Ion Battery", "Eco-Friendly"],
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
    id: 8,
    name: "Mr. Manoj Shekhawat",
    role: "M/s. Ambey Developers",
    avatar:
      "/css/newassets/imgs/page/testimonials/mbey-developers-mr-manoj-shekhawat.webp",
    fallback: "PN",
    rating: 5,
    category: "Battery Technology",
    date: "2023-08-14",
    tags: ["Greentech", "MHE Bazar", "Lithium-ion Battery", "Customer Support"],
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
    id: 10,
    name: "Mrs. Divya Roy",
    role: "M/s. Watrana Traction Pvt. Ltd.",
    avatar:
      "/css/newassets/imgs/page/testimonials/a-traction-pvt-ltd-mrs-divya-roy.webp",
    fallback: "PN",
    rating: 5,
    category: "MHE Equipment",
    date: "2023-10-15",
    tags: ["Spare parts", "After sales", "Customer Support", "Reliability"],
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
    id: 11,
    name: "Mr. Jayanta Dutta",
    role: "MAC SPARES",
    avatar:
      "/css/newassets/imgs/page/testimonials/mr-jayanta-dutta-mac-spares.webp",
    fallback: "PN",
    rating: 5,
    category: "Battery Technology",
    date: "2023-11-20",
    tags: ["Green Revolution", "Lithium-Ion Battery", "Uptime", "Maintenance-free"],
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
];

const categories = ["All Categories", "MHE Equipment", "Electric Equipment", "Battery Technology"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
};

interface StarRatingProps {
  rating: number;
}

const StarRating = ({ rating }: StarRatingProps) => (
  <div className="flex space-x-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-4 h-4 ${
          star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ))}
  </div>
);

// Helper function to extract text from a React element
function extractTextFromReactNode(node: React.ReactNode): string {
  if (typeof node === 'string') {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map(extractTextFromReactNode).join(' ');
  }
  if (React.isValidElement(node) && node.props.children) {
    return extractTextFromReactNode(node.props.children);
  }
  return '';
}

export default function TestimonialsPage() {
  useEffect(() => {
    // Set the document title
    document.title = "What Customers Say | MHE Bazar Testimonials and Client Reviews";

    // Create or update the meta description tag
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute(
      "content",
      "Read real testimonials and success stories from satisfied MHE Bazar clients. Discover why businesses trust our material handling and safety solutions.",
    );

    // Create or update the canonical link tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", "https://www.mhebazar.in/testimonials");
  }, []); // The empty dependency array ensures this effect runs only once when the component mounts.

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [showFilters, setShowFilters] = useState(false);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const contentText = extractTextFromReactNode(review.content);

      const matchesSearch =
        review.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contentText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === "All Categories" || review.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-green-600 to-green-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-x-48 -translate-y-48"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white opacity-5 rounded-full translate-x-40 translate-y-40"></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Link
              href="/"
              className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Customer <span className="text-green-200">Testimonials</span>
            </h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto leading-relaxed">
              Discover what industry leaders say about our innovative material handling solutions
              and exceptional service quality.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">500+</div>
                <div className="text-green-200 text-sm">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">4.9</div>
                <div className="text-green-200 text-sm">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">10+</div>
                <div className="text-green-200 text-sm">Years of Excellence</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search testimonials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 w-full"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                >
                  <Filter className="w-4 h-4" />
                  {selectedCategory}
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-20"
                    >
                      <div className="py-2">
                        {categories.map((category) => (
                          <button
                            key={category}
                            onClick={() => {
                              setSelectedCategory(category);
                              setShowFilters(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors duration-200 ${
                              selectedCategory === category ? "text-green-600 bg-green-50" : "text-gray-700"
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="text-sm text-gray-600">
                {filteredReviews.length} testimonial{filteredReviews.length !== 1 ? "s" : ""} found
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Testimonials Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <AnimatePresence mode="wait">
          {filteredReviews.length > 0 ? (
            <motion.div
              key="testimonials-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {filteredReviews.map((review) => (
                <motion.div
                  key={review.id}
                  variants={itemVariants}
                  className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16 border-2 border-gray-200 group-hover:border-green-300 transition-colors duration-300">
                        <AvatarImage src={review.avatar} alt={review.name} />
                        <AvatarFallback className="bg-gradient-to-br from-green-100 to-green-200 text-green-700 font-semibold text-lg">
                          {review.fallback}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-green-700 transition-colors duration-300">
                          {review.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{review.role}</p>
                        <StarRating rating={review.rating} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 mb-2">
                        {review.category}
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(review.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Quote */}
                  <div className="mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors duration-300">
                      <svg width="16" height="12" viewBox="0 0 32 24" fill="none" className="text-green-600">
                        <path d="M0 12.8V24h11.2V12.8H5.6c0-3.11 2.53-5.6 5.6-5.6V0C4.98 0 0 4.98 0 12.8zM20.8 12.8V24H32V12.8h-5.6c0-3.11 2.53-5.6 5.6-5.6V0c-6.22 0-11.2 4.98-11.2 12.8z" fill="currentColor" />
                      </svg>
                    </div>
                    <div className="text-gray-700 leading-relaxed space-y-3">
                      {review.content}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {review.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 group-hover:bg-green-50 group-hover:text-green-700 transition-colors duration-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No testimonials found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Try adjusting your search terms or filters to find what you&apos;re looking for.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All Categories");
                }}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200 font-medium"
              >
                Clear Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Join Our Success Stories?</h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Experience the difference our innovative solutions can make for your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-white text-green-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-semibold shadow-lg"
              >
                Get Started Today
              </Link>
              <Link
                href="/new"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-green-700 transition-colors duration-200 font-semibold"
              >
                Explore Products
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}