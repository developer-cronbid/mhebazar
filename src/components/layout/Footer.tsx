"use client";

import {
  Globe,
  Headphones,
  ShoppingCart,
  RotateCcw,
  ShieldCheck,
  Download,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner"; // Import toast for notifications

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [email, setEmail] = useState<string>(''); // State for newsletter email
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // State for submission status

  const createSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoryResponse = await api.get("/categories/")
        setCategories(categoryResponse.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/newsletter-subscriptions/', { email });
      console.log('Newsletter subscription successful:', response.data);
      toast.success("Thank you for subscribing to our newsletter!");
      setEmail('');
    } catch (error: any) {
      console.error('Error subscribing to newsletter:', error);
      if (error.response && error.response.data && error.response.data.detail) {
        toast.error(error.response.data.detail);
      } else if (error.response && error.response.data && error.response.data.email) {
        toast.error(`Email: ${error.response.data.email.join(', ')}`);
      }
      else {
        toast.error("Failed to subscribe. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const midpoint = Math.ceil(categories.length / 2);
  const firstColumn = categories.slice(0, midpoint);
  const secondColumn = categories.slice(midpoint);

  return (
    <footer className="bg-white border-t">
      {/* Top blue subscribe section */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              Subscribe & Get{" "}
              <span className="text-yellow-400">10% Discount</span>
            </h2>
            <p className="text-base sm:text-lg">
              Get E-mail updates about our latest shop and special offers.
            </p>
          </div>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row items-center gap-3 md:gap-0 md:items-stretch justify-center md:justify-end w-full md:w-auto">
            <input
              type="email"
              placeholder="Enter email address"
              className="px-4 py-2 rounded md:rounded-l md:rounded-r-none w-full sm:w-72 text-black bg-white outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-yellow-400 text-black px-6 py-2 rounded md:rounded-r md:rounded-l-none font-semibold transition hover:bg-yellow-300 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Subscribing...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>

      {/* Main footer content */}
      <div className="bg-gray-50 px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Grid container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">

            {/* Address & Contact - Takes up 1 column */}
            <div className="lg:col-span-2">
              <Image
                src="/mhe-logo.png"
                alt="MHE Bazar"
                width={120}
                height={40}
                className="mb-4 h-10 w-auto"
                priority
              />
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Address:</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    E-228, Lower Basement, Lajpat Nagar-I, New Delhi-110024
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Phone:</h3>
                  <p className="text-sm text-gray-600">+91 9289094445</p>
                  <p className="text-sm text-gray-600">+91 9840088428</p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">E-mail:</h3>
                  <span className="text-sm text-gray-600 pr-2 border-r-2">sales.1@mhebazar.com</span>
                  <span className="text-sm text-gray-600 pl-2">sales.2@mhebazar.com</span>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="flex items-center gap-4 mt-8">
                <Link href="https://www.linkedin.com/company/mhe-bazar/" target="_blank" aria-label="LinkedIn">
                  <Image src="/linkedinlogo.png" alt="LinkedIn Logo" width={30} height={30} className="filter grayscale hover:grayscale-0 transition-all duration-300" />
                </Link>
                <Link href="https://www.instagram.com/mhebazar.in/" target="_blank" aria-label="Instagram">
                  <Image src="/instagram.png" alt="Instagram Logo" width={30} height={30} className="filter grayscale hover:grayscale-0 transition-all duration-300" />
                </Link>
                <Link href="https://www.facebook.com/mhebazar.in/" target="_blank" aria-label="Facebook">
                  <Image src="/facebook.png" alt="Facebook Logo" width={30} height={30} className="filter grayscale hover:grayscale-0 transition-all duration-300" />
                </Link>
                <Link href="https://twitter.com/Greentech_MH" target="_blank" aria-label="Twitter (X)">
                  <Image src="/x.png" alt="X Logo" width={30} height={30} className="filter grayscale hover:grayscale-0 transition-all duration-300" />
                </Link>
                <Link href="https://www.youtube.com/@mhebazar" target="_blank" aria-label="YouTube">
                  <Image src="/youtube.png" alt="YouTube Logo" width={30} height={30} className="filter grayscale hover:grayscale-0 transition-all duration-300" />
                </Link>
                <Link href="https://in.pinterest.com/greentechindiamh/" target="_blank" aria-label="Pinterest">
                  <Image src="/pinterest.png" alt="Pinterest Logo" width={30} height={30} className="filter grayscale hover:grayscale-0 transition-all duration-300" />
                </Link>
              </div>
            </div>

            {/* Company - Takes up 1 column */}
            <div className="lg:col-span-1">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="text-gray-600 hover:text-blue-700 transition">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/used" className="text-gray-600 hover:text-blue-700 transition">
                    Rental/Used MHE
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="text-gray-600 hover:text-blue-700 transition">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/attachments" className="text-gray-600 hover:text-blue-700 transition">
                    Attachments
                  </Link>
                </li>
                <li>
                  <Link href="/spare-parts" className="text-gray-600 hover:text-blue-700 transition">
                    Spare Parts
                  </Link>
                </li>
                <li>
                  <Link href="/training" className="text-gray-600 hover:text-blue-700 transition">
                    Training
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-gray-600 hover:text-blue-700 transition">
                    Blogs
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-600 hover:text-blue-700 transition">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/vendor-listing" className="text-gray-600 hover:text-blue-700 transition">
                    Vendor Listing
                  </Link>
                </li>
                <li>
                  <Link href="/services/subscription-plan" className="text-gray-600 hover:text-blue-700 transition">
                    Price Plan
                  </Link>
                </li>
                {/* New Terms & Conditions Link */}
                <li>
                  <Link href="/terms-conditions" className="text-gray-600 underline hover:text-blue-700 transition">
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Category - Takes up 2 columns on large screens */}
            <div className="lg:col-span-2">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Category</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                {/* First Column */}
                <div className="space-y-2">
                  {firstColumn.map((category) => (
                    <Link
                      key={category.id}
                      href={`/${createSlug(category.name)}`}
                      className="block text-gray-600 hover:text-blue-700 transition"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>

                {/* Second Column */}
                <div className="space-y-2">
                  {secondColumn.map((category) => (
                    <Link
                      key={category.id}
                      href={`/${createSlug(category.name)}`}
                      className="block text-gray-600 hover:text-blue-700 transition"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Get support - Takes up 1 column */}
            <div className="lg:col-span-1">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Get Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/contact" className="text-gray-600 hover:text-blue-700 transition">
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* Features row */}
      <div className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Globe className="w-6 h-6 text-blue-700" />
              </div>
              <span className="font-semibold text-gray-800 mb-1">Worldwide Delivery</span>
              <span className="text-xs text-gray-500 leading-relaxed">
                MHEBazar delivers products globally.
              </span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Headphones className="w-6 h-6 text-blue-700" />
              </div>
              <span className="font-semibold text-gray-800 mb-1">Support 24/7</span>
              <span className="text-xs text-gray-500 leading-relaxed">
                Reach our experts today!
              </span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <ShoppingCart className="w-6 h-6 text-blue-700" />
              </div>
              <span className="font-semibold text-gray-800 mb-1">First Purchase Discount</span>
              <span className="text-xs text-gray-500 leading-relaxed">Up to 10% discount</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <RotateCcw className="w-6 h-6 text-blue-700" />
              </div>
              <span className="font-semibold text-gray-800 mb-1">Easy Returns</span>
              <span className="text-xs text-gray-500 leading-relaxed">
                Read our return policy
              </span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6 text-blue-700" />
              </div>
              <span className="font-semibold text-gray-800 mb-1">Secure payment</span>
              <span className="text-xs text-gray-500 leading-relaxed">100% Protected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-gray-100 text-center text-sm py-4 border-t text-gray-600">
        Copyright © {new Date().getFullYear()} MHE Bazar. All rights reserved.
      </div>
    </footer>
  );
}