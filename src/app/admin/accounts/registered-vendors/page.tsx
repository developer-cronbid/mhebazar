// import Breadcrumb from "@/components/elements/Breadcrumb";
import VendorCard from "@/components/vendor-listing/VendorCard";
// import Link from "next/link";

import { Metadata } from "next";
// import { useEffect } from "react";
// import { UserPlusIcon } from "lucide-react";
import api from "@/lib/api";
import { Vendor } from "@/types";

export const metadata: Metadata = {
  title: "Vendors at MHEBazar",
};


export default async function VendorsPage() {
  let vendors: Vendor[] = [];
  try {
    const response = await api.get("/vendor/approved/");
    vendors = response.data.results || [];
  } catch{
    // Optionally log error or show a message
    vendors = [];
  }

  console.log("Vendors:", vendors);
  return (
    <>
      {/* <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Vendors", href: "/vendors" },
        ]}
      /> */}

      {/* <div className="max-w-7xl mx-auto px-4 flex justify-end items-center mt-6">
        <Link href="/become-vendor" passHref>
          <div className="inline-flex items-center gap-2 bg-[#5CA131] hover:scale-105 text-white font-medium px-5 py-2 rounded-lg shadow transition">
            <UserPlusIcon className="w-5 h-5" />
            Become a Vendor
          </div>
        </Link>
      </div> */}

      <main className="max-w-7xl mx-auto px-4 py-10 overflow-auto">
        <h1 className="text-2xl font-semibold mb-6">Registered Vendors</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
          {vendors?.map(vendor => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      </main>
    </>
  );
}
