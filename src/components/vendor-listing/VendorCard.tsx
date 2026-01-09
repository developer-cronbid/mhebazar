// src/components/VendorCard.tsx
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

// Helper function to create a URL-safe slug
const createSlug = (name: string): string => {
  if (!name) return "";
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
};

type Vendor = {
  id: number;
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  company_name: string;
  company_email: string;
  brand: string;
  is_approved: boolean;
  application_date: string;
  product_count?: number;
  user_info?: {
    id: number;
    profile_photo: string;
  };
};

type Props = {
  vendor: Vendor;
};

export default function VendorCard({ vendor }: Props) {
  const [isAdminPath, setIsAdminPath] = useState(false);

  useEffect(() => {
    setIsAdminPath(window.location.pathname.startsWith("/admin/"));
  }, []);

  // Use the slugified brand name for the URL
  const vendorSlug = createSlug(vendor.brand);

  const href = isAdminPath
    ? `/admin/accounts/registered-vendors/${vendorSlug}/?user=${vendor?.user_info?.id}`
    : `/vendor-listing/${vendorSlug}`;

  return (
    <div className="relative border border-gray-200 rounded-2xl p-4 flex flex-col items-center shadow-sm hover:shadow-lg transition-all duration-200 bg-white w-full h-full font-inter">
      {vendor.product_count !== undefined && (
        <span className="absolute top-4 right-4 bg-green-500/20 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full">
          {vendor.product_count} items
        </span>
      )}

      <div className="relative w-28 h-28 my-4 rounded-xl flex items-center justify-center overflow-hidden">
        <Image
          src={vendor.user_info?.profile_photo || "/placeholder-logo.png"}
          alt={`${vendor.brand} Logo`}
          width={112}
          height={112}
          className="object-contain"
        />
      </div>

      <h3 className="text-lg font-semibold text-center text-gray-900 mb-1">
        {vendor.brand}
      </h3>

      <p className="text-sm text-gray-500 text-center mb-4 line-clamp-1">
        {vendor.company_name}
      </p>

      <div className="flex flex-col sm:flex-row gap-2 w-full mt-auto">
        <Link href={href} className="flex-1">
          <Button className="w-full text-sm font-medium py-2 rounded-lg bg-[#5CA131] hover:bg-[#4a8f28] text-white transition-colors duration-150 cursor-pointer">
            View Product
          </Button>
        </Link>
        <Link href="/contact" className="flex-1">
          <Button
            variant="outline"
            className="w-full flex-1 text-sm font-medium py-2 rounded-lg border border-[#5CA131] text-[#5CA131] hover:bg-[#f2fbf2] transition-colors duration-150 cursor-pointer"
          >
            Contact
          </Button>
        </Link>
      </div>
    </div>
  );
}