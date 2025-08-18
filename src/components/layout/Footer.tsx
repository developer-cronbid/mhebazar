// Footer.tsx
"use client";

import {
  Globe,
  Headphones,
  ShoppingCart,
  RotateCcw,
  ShieldCheck,
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
        // Fetch categories and subcategories in parallel for better performance
        const categoryResponse = await api.get("/categories/");

        // Update state with data from the API response
        // Make sure the response structure matches (e.g., response.data)
        setCategories(categoryResponse.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        // You could set an error state here to inform the user
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this runs only once when the component mounts

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
      setEmail(''); // Clear input on success
    } catch (error: any) {
      console.error('Error subscribing to newsletter:', error);
      if (error.response && error.response.data && error.response.data.detail) {
        toast.error(error.response.data.detail); // Display backend error message
      } else if (error.response && error.response.data && error.response.data.email) {
        toast.error(`Email: ${error.response.data.email.join(', ')}`); // Handle email specific errors
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
                <Link href="https://www.linkedin.com/company/mhe-bazar/" target="_blank" aria-label="LinkedIn" className="text-gray-600 hover:text-blue-700 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2a2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </Link>
                <Link href="https://www.instagram.com/mhebazar.in/" target="_blank" aria-label="Instagram" className="text-gray-600 hover:text-blue-700 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </Link>
                <Link href="https://www.facebook.com/mhebazar.in/" target="_blank" aria-label="Facebook" className="text-gray-600 hover:text-blue-700 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </Link>
                <Link href="https://twitter.com/Greentech_MH" target="_blank" aria-label="Twitter" className="text-gray-600 hover:text-blue-700 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter">
                    <path d="M22 4s-.7 2.1-2 3.4c-1 1-2.4 1.4-4 1.4c-.4 0-.8 0-1.2-.1c-.4-.1-.8-.2-1.2-.4c-.4-.2-.8-.4-1.2-.6c-.4-.2-.8-.4-1.2-.6c-.4-.2-.8-.4-1.2-.6-1.5-.9-3.2-1.4-5.2-1.4-1.6 0-3.2.4-4.8 1.2s-2.9 2-4 3.4c-1.3 1.3-2.6 3.4-3.4 5.4s-1.2 4-.8 6.4c.4 2.4 1.2 4.4 2.4 6c1.6 1.2 2.8 2.8 4.8 3.6s4 1.2 6.4.8c2.4-.4 4.4-1.2 6-2.4c1.6-1.2 2.8-2.8 3.6-4.8s1.2-4.2-.8-6.4c-.4-.2-.8-.4-1.2-.6z" />
                  </svg>
                </Link>
                <Link href="https://www.youtube.com/@mhebazar" target="_blank" aria-label="YouTube" className="text-gray-600 hover:text-blue-700 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube">
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                    <path d="m10 15 5-3-5-3z" />
                  </svg>
                </Link>
                <Link href="https://in.pinterest.com/greentechindiamh/" target="_blank" aria-label="Pinterest" className="text-gray-600 hover:text-blue-700 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pinterest">
                    <path d="M12 0a12 12 0 1 0 0 24a12 12 0 0 0 0-24z" />
                    <path d="M8 8a3 3 0 0 1 3-3c1.7 0 3 1.3 3 3c0 1.7-1.3 3-3 3z" />
                    <path d="M12 16c-1.7 0-3-1.3-3-3s1.3-3 3-3s3 1.3 3 3s-1.3 3-3 3z" />
                  </svg>
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
                  {/* Updated link from /used-mhe to /used to match Nav.tsx */}
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
                  {/* New link from Nav.tsx */}
                  <Link href="/attachments" className="text-gray-600 hover:text-blue-700 transition">
                    Attachments
                  </Link>
                </li>
                <li>
                  {/* New link from Nav.tsx */}
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
                  {/* New link from Nav.tsx */}
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
                  {/* Updated link from /vendors to /vendor-listing to match Nav.tsx */}
                  <Link href="/vendor-listing" className="text-gray-600 hover:text-blue-700 transition">
                    Vendor Listing
                  </Link>
                </li>
                <li>
                  {/* New link from Nav.tsx */}
                  <Link href="/services/subscription-plan" className="text-gray-600 hover:text-blue-700 transition">
                    Price Plan
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