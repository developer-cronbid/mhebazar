import {
  Globe,
  Headphones,
  ShoppingCart,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { JSX } from "react";
import categoriesData from "@/data/categories.json";
import NewsletterSubscribeForm from "./NewsletterSubscribeForm";

interface Subcategory {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  image_url: string;
  subcategories: Subcategory[];
}

const createSlug = (name: string): string => {
  // Convert to lowercase and replace spaces, parentheses, and underscores with a single hyphen.
  const slug = name.toLowerCase().replace(/[\s()_]+/g, '-');
  
  // Remove any leading or trailing hyphens.
  return slug.replace(/^-+|-+$/g, '');
};

export default function Footer(): JSX.Element {
  const categories: Category[] = categoriesData;
  const midpoint = Math.ceil(categories.length / 2);
  const firstColumn = categories.slice(0, midpoint);
  const secondColumn = categories.slice(midpoint);

  return (
    <footer className="bg-white border-t">
      <NewsletterSubscribeForm />

      <div className="bg-gray-50 px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
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
                  <a href="tel:+919289094445" className="text-sm text-gray-600 hover:text-blue-700 transition">+91 9289094445</a>
                  <span className="text-sm text-gray-600"> | </span>
                  <a href="tel:+919840088428" className="text-sm text-gray-600 hover:text-blue-700 transition">+91 9840088428</a>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">E-mail:</h3>
                  <div className="flex flex-col md:flex-row">
                    <a href="mailto:sales.1@mhebazar.com" className="text-sm text-gray-600 pr-2 md:border-r-2 hover:text-blue-700 transition">sales.1@mhebazar.com</a>
                    <a href="mailto:sales.2@mhebazar.com" className="text-sm text-gray-600 pl-2 hover:text-blue-700 transition">sales.2@mhebazar.com</a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-8">
                <Link href="https://www.linkedin.com/company/mhe-bazar/" target="_blank" aria-label="LinkedIn">
                  <Image src="/linkedinlogo.png" alt="LinkedIn Logo" width={30} height={30} className="filter hover:grayscale-0 hover:scale-105 transition-all duration-300" />
                </Link>
                <Link href="https://www.instagram.com/mhebazar.in/" target="_blank" aria-label="Instagram">
                  <Image src="/instagram.png" alt="Instagram Logo" width={30} height={30} className="filter hover:grayscale-0 hover:scale-105 transition-all duration-300" />
                </Link>
                <Link href="https://www.facebook.com/mhebazar.in/" target="_blank" aria-label="Facebook">
                  <Image src="/facebook.png" alt="Facebook Logo" width={30} height={30} className="filter hover:grayscale-0 hover:scale-105 transition-all duration-300" />
                </Link>
                <Link href="https://twitter.com/Greentech_MH" target="_blank" aria-label="Twitter (X)">
                  <Image src="/x.png" alt="X Logo" width={30} height={30} className="filter hover:grayscale-0 hover:scale-105 transition-all duration-300" />
                </Link>
                <Link href="https://www.youtube.com/@mhebazar" target="_blank" aria-label="YouTube">
                  <Image src="/youtube.png" alt="YouTube Logo" width={30} height={30} className="filter hover:grayscale-0 hover:scale-105 transition-all duration-300" />
                </Link>
                <Link href="https://in.pinterest.com/greentechindiamh/" target="_blank" aria-label="Pinterest">
                  <Image src="/pinterest.png" alt="Pinterest Logo" width={30} height={30} className="filter hover:grayscale-0 hover:scale-105 transition-all duration-300" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-1">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-gray-600 hover:text-blue-700 transition">About</Link></li>
                <li><Link href="/used" className="text-gray-600 hover:text-blue-700 transition">Rental/Used MHE</Link></li>
                <li><Link href="/services" className="text-gray-600 hover:text-blue-700 transition">Services</Link></li>
                <li><Link href="/attachments" className="text-gray-600 hover:text-blue-700 transition">Attachments</Link></li>
                <li><Link href="/spare-parts" className="text-gray-600 hover:text-blue-700 transition">Spare Parts</Link></li>
                <li><Link href="/training" className="text-gray-600 hover:text-blue-700 transition">Training</Link></li>
                <li><Link href="/blog" className="text-gray-600 hover:text-blue-700 transition">Blogs</Link></li>
                <li><Link href="/contact" className="text-gray-600 hover:text-blue-700 transition">Contact Us</Link></li>
                <li><Link href="/vendors-listing" className="text-gray-600 hover:text-blue-700 transition">Vendors Listing</Link></li>
                <li><Link href="/services/subscription-plan" className="text-gray-600 hover:text-blue-700 transition">Price Plan</Link></li>
                <li><Link href="/terms-conditions" className="text-gray-600 underline hover:text-blue-700 transition">Terms & Conditions</Link></li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Category</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div className="space-y-2">
                  {firstColumn.map((category) => (
                    <Link key={category.id} href={`/${createSlug(category.name)}`} className="block text-gray-600 hover:text-blue-700 transition">
                      {category.name}
                    </Link>
                  ))}
                </div>
                <div className="space-y-2">
                  {secondColumn.map((category) => (
                    <Link key={category.id} href={`/${createSlug(category.name)}`} className="block text-gray-600 hover:text-blue-700 transition">
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Get Support</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contact" className="text-gray-600 hover:text-blue-700 transition">Help Center</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3"><Globe className="w-6 h-6 text-blue-700" /></div>
              <span className="font-semibold text-gray-800 mb-1">Worldwide Delivery</span>
              <span className="text-xs text-gray-500 leading-relaxed">MHEBazar delivers products globally.</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3"><Headphones className="w-6 h-6 text-blue-700" /></div>
              <span className="font-semibold text-gray-800 mb-1">Support 24/7</span>
              <span className="text-xs text-gray-500 leading-relaxed">Reach our experts today!</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3"><ShoppingCart className="w-6 h-6 text-blue-700" /></div>
              <span className="font-semibold text-gray-800 mb-1">First Purchase Discount</span>
              <span className="text-xs text-gray-500 leading-relaxed">Up to 10% discount</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3"><RotateCcw className="w-6 h-6 text-blue-700" /></div>
              <span className="font-semibold text-gray-800 mb-1">Easy Returns</span>
              <span className="text-xs text-gray-500 leading-relaxed">Read our return policy</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3"><ShieldCheck className="w-6 h-6 text-blue-700" /></div>
              <span className="font-semibold text-gray-800 mb-1">Secure payment</span>
              <span className="text-xs text-gray-500 leading-relaxed">100% Protected</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 text-center text-sm py-4 border-t text-gray-600">
        Copyright © {new Date().getFullYear()} MHE Bazar. All rights reserved.
      </div>
    </footer>
  );
}
