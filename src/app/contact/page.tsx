/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Phone, Mail, CheckCircle} from "lucide-react";
import Breadcrumb from "@/components/elements/Breadcrumb";
import ContactForm from "@/components/forms/publicforms/ContactForm";

const offices = [
  {
    title: "Registered Office:",
    address: `E-228, Goyla Vihar, Block D, Lajpat Nagar I, Lajpat Nagar, New Delhi, Delhi 110024`,
    person: "Mr. Manik Thapar",
    phone: "+91 928 909 4445",
    email: "sales.1@mhebazar.com",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3503.738018617578!2d77.23933067468166!3d28.57476629910515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce341b9ab9da3%3A0xc22e1d33ae9532bd!2sMHE%20Bazar!5e0!3m2!1sen!2sin!4v1718872580795!5m2!1sen!2sin",
  },
  {
    title: "Corporate Office:",
    address: `Survey no.76/1A, Poonamallee High Road, Velappanchavadi, Chennai-600077`,
    person: "Mr. Ulhas Makeshwar",
    phone: "+91 984 008 8428",
    email: "sales.2@mhebazar.com",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.974577884489!2d80.1166708746818!3d13.045763987255395!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a52601ae56b9c9b%3A0x868c29b794f8b91c!2sVelappanchavadi%2C%20Chennai%2C%20Tamil%20Nadu%20600077!5e0!3m2!1sen!2sin!4v1718872658828!5m2!1sen!2sin",
  },
  {
    title: "Branch Office:",
    address: `Plot No A-61, Next to Spree Hotel, H Block, MIDC, MIDC, Pimpri-Chinchwad, Pune Maharashtra 411018`,
    person: "Mr. Sumedh Ramteke",
    phone: "+91 730 5950 939",
    email: "sumedh.ramteke@mhebazar.com",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3780.0039233682977!2d73.7844005746825!3d18.636048182513476!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2b9dfd1f1e9c7%3A0x6b6d27e2a967c132!2sSpree%20Hotel%20Pimpri!5e0!3m2!1sen!2sin!4v1718872719602!5m2!1sen!2sin",
  },
];

export default function ContactPage() {
  const [selectedOfficeIndex, setSelectedOfficeIndex] = useState(0);

  // Use a useEffect hook to update the metadata when the component mounts
  useEffect(() => {
    // Set the document title
    document.title = "Contact MHEBazar for Material Handling Equipment Solutions | Reach Us Now";

    // Create or update the meta title tag
    let metaTitle = document.querySelector('meta[name="title"]');
    if (!metaTitle) {
      metaTitle = document.createElement('meta');
      metaTitle.setAttribute('name', 'title');
      document.head.appendChild(metaTitle);
    }
    metaTitle.setAttribute('content', "Contact Us – Material Handling Equipment Experts in India​");

    // Create or update the meta description tag
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', "Get in touch with MHE Bazar for all your material handling equipment needs. Reach our Delhi, Chennai, or Pune offices via phone or email.");

    // Create or update the canonical link tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', "https://www.mhebazar.in/contact");
  }, []); // The empty array ensures this runs only once on mount

  return (
    <>
      {/* Breadcrumb */}
      <div className="w-full px-4 sm:px-8 pt-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Contact", href: "/contact" },
          ]}
        />
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-1 text-gray-900">Contact us</h2>
        <p className="text-gray-700 mb-6">
          We love to hear from you! Please let us know if you have any questions
          or concerns and we will get back to you soon. Thank you!
        </p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left - Office Cards */}
          <div className="flex-1 flex flex-col gap-4">
            {offices.map((office, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedOfficeIndex(index)}
                className={`text-left bg-white border rounded-lg p-4 shadow-sm transition-all duration-300 ease-in-out ${
                  selectedOfficeIndex === index
                    ? "border-green-600 ring-2 ring-green-200 scale-[1.01]"
                    : "border-gray-200 hover:shadow-md"
                }`}
                style={{ cursor: "pointer" }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-sm text-gray-900">{office.title}</span>
                </div>
                <div className="text-gray-800 text-sm mb-1">
                  {office.address}
                </div>
                <div className="text-gray-800 text-sm font-semibold mb-2">
                  {office.person}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                  <Phone className="h-4 w-4 text-green-600" />
                  <span>{office.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="h-4 w-4 text-green-600" />
                  <span>{office.email}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Right - Contact Form */}
          <ContactForm/>
        </div>
      </section>

      {/* Map Embed */}
      <div className="w-full h-[350px] mt-8">
        <iframe
          title={offices[selectedOfficeIndex].title + " Map"}
          src={offices[selectedOfficeIndex].mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </>
  );
}