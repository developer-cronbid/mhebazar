/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Vendor } from "@/types";


type Props = {
  vendor: Vendor;
};

// Utility to create SEO-friendly slug
const toSlug = (text: string) =>
  text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

export default function VendorCard({ vendor }: Props) {
  const [isAdminPath, setIsAdminPath] = useState(false);
  // console.log(vendor);

  useEffect(() => {
    setIsAdminPath(window.location.pathname.startsWith("/admin/"));
  }, []);

  const vendorDisplayName =
    vendor.brand || vendor.company_name || vendor.full_name;

  // const vendorSlug = toSlug(vendorDisplayName);

  const href = isAdminPath
    ? `/admin/accounts/registered-vendors/${vendor.brand}/?user=${vendor.user_info.id}`
    : `/vendor-listing/${vendor.brand}`;

  return (
    <div className="relative border border-gray-200 rounded-2xl p-5 flex flex-col items-center shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 bg-white w-full max-w-xs min-w-[240px] h-full">
      
    
      {/* Logo / Placeholder */}
      <div className="relative w-24 h-20 mb-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden">
        <Image
          src={vendor.user_info.profile_photo}
          alt={vendor.brand}
          fill
          className="object-contain"
          sizes="96px"
        />
      </div>

      {/* Name */}
      <h3 className="text-base font-semibold text-center text-gray-900 mb-6">
        {vendor.brand}
      </h3>

      {/* Company Name (if different) */}
      {vendor.company_name !== vendorDisplayName && (
        <p className="text-sm text-gray-500 text-center mb-4 line-clamp-1">
          {vendor.company_name}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 w-full mt-auto">
        <Link href={href} className="flex-1">
          <Button className="w-full text-sm font-medium py-2 rounded-lg bg-[#5CA131] hover:bg-[#4a8f28] text-white transition-colors duration-150">
            View Products
          </Button>
        </Link>
        <Button
          variant="outline"
          className="flex-1 text-sm font-medium py-2 rounded-lg border border-[#5CA131] text-[#5CA131] hover:bg-[#f2fbf2] transition-colors duration-150"
        >
          Contact
        </Button>
      </div>
    </div>
  );
}
